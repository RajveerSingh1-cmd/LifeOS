const express = require('express');
const router = express.Router();
const { getAuthClient } = require('../auth');
const { fetchEvents, createEvent } = require('../api-wrappers/calendar');
const { computeFreeBlocks } = require('../modules/scheduler');
const workingHours = require('../config/workingHours');

/**
 * GET /api/calendar/events
 * Fetches upcoming calendar events.
 */
router.get('/events', async (req, res) => {
    try {
        const auth = await getAuthClient();
        const events = await fetchEvents(auth, 5);
        res.json({ success: true, data: { events }, error: null });
    } catch (err) {
        res.status(500).json({ success: false, data: null, error: err.message });
    }
});

/**
 * POST /api/calendar/schedule
 * Runs the deterministic scheduler.
 * Body: { events: [], nearestDeadline: ISO|null }
 */
router.post('/schedule', (req, res) => {
    try {
        const { events, nearestDeadline } = req.body;
        if (!events || !Array.isArray(events)) {
            return res.status(400).json({ success: false, data: null, error: 'Body must contain an "events" array.' });
        }
        const schedulingDecision = computeFreeBlocks(events, nearestDeadline || null, workingHours);
        res.json({ success: true, data: { schedulingDecision }, error: null });
    } catch (err) {
        res.status(500).json({ success: false, data: null, error: err.message });
    }
});

/**
 * POST /api/calendar/create
 * Creates a deep work block on Google Calendar.
 * Body: { start: ISO, end: ISO }
 */
router.post('/create', async (req, res) => {
    try {
        const { start, end } = req.body;
        if (!start || !end) {
            return res.status(400).json({ success: false, data: null, error: 'Body must contain "start" and "end" ISO strings.' });
        }
        const auth = await getAuthClient();
        const result = await createEvent(auth, { start, end });
        res.json({ success: result.success, data: result, error: result.error || null });
    } catch (err) {
        res.status(500).json({ success: false, data: null, error: err.message });
    }
});

module.exports = router;
