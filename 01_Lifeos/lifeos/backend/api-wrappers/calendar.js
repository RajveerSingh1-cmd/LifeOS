const { google } = require('googleapis');

/**
 * Fetches upcoming calendar events.
 * @param {import('google-auth-library').OAuth2Client} auth
 * @param {number} daysAhead - how many days ahead to look (default 5)
 * @returns {Promise<Array<CalendarEventObject>>}
 */
async function fetchEvents(auth, daysAhead = 5) {
    const calendar = google.calendar({ version: 'v3', auth });

    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now.toISOString(),
        timeMax: future.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
    });

    const items = response.data.items || [];

    return items.map((item) => {
        // Normalize all-day events (which use `date` instead of `dateTime`) to datetime
        const startRaw = item.start?.dateTime || item.start?.date;
        const endRaw = item.end?.dateTime || item.end?.date;

        // For all-day events (date only), append T00:00:00Z so they become valid datetimes
        const toDateTime = (raw) => {
            if (!raw) return null;
            if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T00:00:00.000Z`;
            return raw;
        };

        return {
            id: item.id,
            title: item.summary || '(untitled)',
            start: toDateTime(startRaw),
            end: toDateTime(endRaw),
        };
    });
}

/**
 * Creates a LifeOS Deep Work Block event on Google Calendar.
 * @param {import('google-auth-library').OAuth2Client} auth
 * @param {{ start: string, end: string }} block - ISO datetime strings
 * @returns {Promise<CreatedEventConfirmationObject>}
 */
async function createEvent(auth, block) {
    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: 'LifeOS: Deep Work Block',
                description: 'Auto-scheduled based on detected urgency/deadline.',
                start: {
                    dateTime: block.start,
                    timeZone: 'UTC',
                },
                end: {
                    dateTime: block.end,
                    timeZone: 'UTC',
                },
            },
        });

        return {
            success: true,
            eventId: response.data.id || null,
            eventLink: response.data.htmlLink || null,
            error: null,
        };
    } catch (err) {
        return {
            success: false,
            eventId: null,
            eventLink: null,
            error: err.message,
        };
    }
}

module.exports = { fetchEvents, createEvent };
