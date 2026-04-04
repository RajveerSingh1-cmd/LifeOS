const express = require('express');
const router = express.Router();
const workingHours = require('../config/workingHours');

/**
 * GET /api/config/hours
 * Returns current working hours configuration.
 */
router.get('/hours', (req, res) => {
    res.json({ success: true, data: { workingHours }, error: null });
});

/**
 * POST /api/config/hours
 * Updates working hours configuration in memory.
 * Body: { start, end, timezone, minBlockDuration }
 */
router.post('/hours', (req, res) => {
    const { start, end, timezone, minBlockDuration } = req.body;

    if (!start || !end || !timezone || !minBlockDuration) {
        return res.status(400).json({
            success: false,
            data: null,
            error: 'Body must contain: start, end, timezone, minBlockDuration',
        });
    }

    // Validate time format HH:MM
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(start) || !timeRegex.test(end)) {
        return res.status(400).json({
            success: false,
            data: null,
            error: 'start and end must be in HH:MM format',
        });
    }

    // Mutate the exported config object in place
    workingHours.start = start;
    workingHours.end = end;
    workingHours.timezone = timezone;
    workingHours.minBlockDuration = Number(minBlockDuration);

    res.json({ success: true, data: { workingHours }, error: null });
});

module.exports = router;
