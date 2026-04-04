const { fetchEmails } = require('../api-wrappers/gmail');
const { fetchEvents } = require('../api-wrappers/calendar');
const { analyzeEmails } = require('../modules/emailIntel');
const { computeFreeBlocks } = require('../modules/scheduler');
const { scheduleDeepWork } = require('../modules/calendarManager');
const { draftReplies } = require('../modules/replyDraft');
const workingHours = require('../config/workingHours');

/**
 * Runs the full LifeOS autonomous pipeline in sequence.
 * Each step logs a string to steps[]. On error, catches and continues.
 *
 * @param {import('google-auth-library').OAuth2Client} auth
 * @param {boolean} dryRun - If true, skips calendar event creation
 * @param {function} onStep - Optional callback called with each step log string
 * @returns {Promise<ExecutionSummaryObject>}
 */
async function runAutonomousMode(auth, dryRun = false, onStep = null) {
    const executedAt = new Date().toISOString();
    const steps = [];
    const log = (msg) => {
        steps.push(msg);
        if (onStep) onStep(msg);
        console.log(`[orchestrator] ${msg}`);
    };

    let emails = [];
    let analyses = [];
    let nearestDeadline = null;
    let events = [];
    let schedulingDecision = null;
    let eventCreated = null;
    let drafts = [];

    // ── Step 1: Fetch Emails ──────────────────────────────────────────────────
    try {
        log('Step 1: Fetching emails from Gmail...');
        emails = await fetchEmails(auth, 20);
        log(`Step 1 ✓ — Fetched ${emails.length} emails.`);
    } catch (err) {
        log(`Step 1 ✗ — Failed to fetch emails: ${err.message}`);
    }

    // ── Step 2: Analyze Emails with LLM ──────────────────────────────────────
    try {
        log('Step 2: Analyzing emails with LLM...');
        if (emails.length > 0) {
            analyses = await analyzeEmails(emails);
            const urgentCount = analyses.filter((a) => a.urgency).length;
            log(`Step 2 ✓ — Analyzed ${analyses.length} emails. ${urgentCount} urgent.`);
        } else {
            log('Step 2 — Skipped (no emails to analyze).');
        }
    } catch (err) {
        log(`Step 2 ✗ — Email analysis failed: ${err.message}`);
    }

    // ── Step 3: Extract Nearest Deadline ────────────────────────────────────
    try {
        log('Step 3: Extracting nearest deadline from analysis...');
        const deadlines = analyses
            .map((a) => a.deadline)
            .filter((d) => d !== null && d !== undefined)
            .sort();

        if (deadlines.length > 0) {
            nearestDeadline = deadlines[0];
            log(`Step 3 ✓ — Nearest deadline detected: ${nearestDeadline}`);
        } else {
            log('Step 3 ✓ — No explicit deadlines found in emails.');
        }
    } catch (err) {
        log(`Step 3 ✗ — Deadline extraction failed: ${err.message}`);
    }

    // ── Step 4: Fetch Calendar Events ────────────────────────────────────────
    try {
        log('Step 4: Fetching calendar events...');
        events = await fetchEvents(auth, 5);
        log(`Step 4 ✓ — Fetched ${events.length} upcoming calendar events.`);
    } catch (err) {
        log(`Step 4 ✗ — Failed to fetch calendar events: ${err.message}`);
    }

    // ── Step 5: Compute Free Blocks ──────────────────────────────────────────
    try {
        log('Step 5: Computing optimal deep work block...');
        schedulingDecision = computeFreeBlocks(events, nearestDeadline, workingHours);
        if (schedulingDecision.suggestedBlock) {
            log(`Step 5 ✓ — Block found: ${schedulingDecision.suggestedBlock.start} → ${schedulingDecision.suggestedBlock.end}`);
        } else {
            log(`Step 5 ✓ — No block available: ${schedulingDecision.reason}`);
        }
    } catch (err) {
        log(`Step 5 ✗ — Scheduling failed: ${err.message}`);
        schedulingDecision = { suggestedBlock: null, targetDeadline: nearestDeadline, reason: err.message };
    }

    // ── Step 6: Create Calendar Event (unless dry run) ────────────────────────
    if (!dryRun) {
        try {
            log('Step 6: Creating deep work block on Google Calendar...');
            eventCreated = await scheduleDeepWork(auth, schedulingDecision);
            if (eventCreated.success) {
                log(`Step 6 ✓ — Event created: ${eventCreated.eventLink}`);
            } else {
                log(`Step 6 ✓ — Event not created: ${eventCreated.error}`);
            }
        } catch (err) {
            log(`Step 6 ✗ — Event creation failed: ${err.message}`);
        }
    } else {
        log('Step 6 — Skipped (dry run mode — no calendar event created).');
    }

    // ── Step 7: Draft Replies ────────────────────────────────────────────────
    try {
        log('Step 7: Generating reply drafts for urgent emails...');
        const urgentEmails = emails.filter((e) =>
            analyses.some((a) => a.id === e.id && a.urgency && a.replyRequired)
        );
        drafts = await draftReplies(urgentEmails, analyses);
        log(`Step 7 ✓ — Generated ${drafts.length} reply drafts.`);
    } catch (err) {
        log(`Step 7 ✗ — Reply drafting failed: ${err.message}`);
    }

    // ── Step 8: Assemble Execution Summary ───────────────────────────────────
    log('Step 8 ✓ — Execution complete. Assembling report...');

    const urgentCount = analyses.filter((a) => a.urgency).length;

    return {
        executedAt,
        dryRun,
        emails,
        analyses,
        urgentCount,
        events,
        schedulingDecision,
        eventCreated: dryRun ? null : eventCreated,
        drafts,
        steps,
    };
}

module.exports = { runAutonomousMode };
