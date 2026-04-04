/**
 * scheduler.js — Deterministic scheduling module.
 * Pure function: same inputs always produce the same output.
 * No LLM calls. No API calls. No randomness. No side effects.
 */

/**
 * Parses "HH:MM" string into { hours, minutes } object.
 */
function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
}

/**
 * Creates a Date object for a given day at a specific HH:MM time (UTC).
 * @param {Date} day - The base date
 * @param {string} timeStr - "HH:MM" format
 * @returns {Date}
 */
function dateAtTime(day, timeStr) {
    const { hours, minutes } = parseTime(timeStr);
    const d = new Date(day);
    d.setUTCHours(hours, minutes, 0, 0);
    return d;
}

/**
 * Computes free time blocks within working hours given a set of calendar events.
 * Returns the earliest valid block before the deadline.
 *
 * @param {Array<CalendarEventObject>} events - Existing calendar events
 * @param {string|null} nearestDeadline - ISO 8601 date string or null
 * @param {{ start: string, end: string, timezone: string, minBlockDuration: number }} config
 * @returns {SchedulingDecisionObject}
 */
function computeFreeBlocks(events, nearestDeadline, config) {
    const { start: workStart, end: workEnd, minBlockDuration } = config;
    const minDurationMs = (minBlockDuration || 60) * 60 * 1000;
    const maxBlockMs = 2 * 60 * 60 * 1000; // max 2 hours per spec

    // Determine search range: today → deadline or today + 5 days
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let endDate;
    if (nearestDeadline) {
        endDate = new Date(nearestDeadline);
        endDate.setUTCHours(23, 59, 59, 999);
    } else {
        endDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
    }

    // Parse all events into intervals sorted by start time
    const eventIntervals = events
        .map((e) => ({
            start: new Date(e.start).getTime(),
            end: new Date(e.end).getTime(),
        }))
        .filter((e) => e.start && e.end && !isNaN(e.start) && !isNaN(e.end))
        .sort((a, b) => a.start - b.start);

    // Iterate each day in the range
    let currentDay = new Date(today);
    while (currentDay <= endDate) {
        const dayStart = dateAtTime(currentDay, workStart);
        const dayEnd = dateAtTime(currentDay, workEnd);

        // Skip if working window is in the past
        const now = new Date();
        const windowStart = dayStart < now ? now : dayStart;
        const windowEnd = dayEnd;

        if (windowStart >= windowEnd) {
            currentDay.setUTCDate(currentDay.getUTCDate() + 1);
            continue;
        }

        // Find events overlapping this day's working window
        const overlapping = eventIntervals.filter(
            (e) => e.end > windowStart.getTime() && e.start < windowEnd.getTime()
        );

        // Build free gaps within the working window
        const gaps = [];
        let cursor = windowStart.getTime();

        for (const evt of overlapping) {
            if (evt.start > cursor) {
                gaps.push({ start: cursor, end: evt.start });
            }
            if (evt.end > cursor) {
                cursor = evt.end;
            }
        }

        // Final gap: after last event to end of working window
        if (cursor < windowEnd.getTime()) {
            gaps.push({ start: cursor, end: windowEnd.getTime() });
        }

        // Filter gaps that are at least minBlockDuration long
        const validGaps = gaps.filter((g) => g.end - g.start >= minDurationMs);

        if (validGaps.length > 0) {
            // Take the first (earliest) valid gap
            const gap = validGaps[0];
            const blockDuration = Math.min(gap.end - gap.start, maxBlockMs);
            const blockStart = new Date(gap.start);
            const blockEnd = new Date(gap.start + blockDuration);

            return {
                suggestedBlock: {
                    start: blockStart.toISOString(),
                    end: blockEnd.toISOString(),
                },
                targetDeadline: nearestDeadline || null,
                reason: nearestDeadline
                    ? `Scheduled before deadline ${nearestDeadline}. Earliest available slot found on ${blockStart.toDateString()}.`
                    : `No deadline detected. Scheduled at earliest available slot on ${blockStart.toDateString()}.`,
            };
        }

        currentDay.setUTCDate(currentDay.getUTCDate() + 1);
    }

    // No free slot found
    return {
        suggestedBlock: null,
        targetDeadline: nearestDeadline || null,
        reason: nearestDeadline
            ? `No free block found before deadline ${nearestDeadline}. Calendar appears fully booked during working hours.`
            : `No free block found in the next 5 days. Calendar appears fully booked during working hours.`,
    };
}

module.exports = { computeFreeBlocks };
