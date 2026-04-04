const express = require('express');
const router = express.Router();
const { getAuthClient } = require('../auth');
const { runAutonomousMode } = require('../orchestrator/orchestrator');

/**
 * POST /api/run
 * Runs the full autonomous LifeOS pipeline.
 * Query param: ?dryRun=true|false
 *
 * Streams each step log via Server-Sent Events (SSE) as the pipeline executes.
 * Sends the complete Execution Summary as the final SSE event of type "complete".
 */
router.post('/run', async (req, res) => {
    const dryRun = req.query.dryRun === 'true';

    // ── Set up SSE headers ────────────────────────────────────────────────────
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if applicable
    res.flushHeaders();

    const sendStep = (msg) => {
        res.write(`data: ${JSON.stringify({ type: 'step', message: msg })}\n\n`);
    };

    const sendComplete = (summary) => {
        res.write(`data: ${JSON.stringify({ type: 'complete', summary })}\n\n`);
        res.end();
    };

    const sendError = (errMsg) => {
        res.write(`data: ${JSON.stringify({ type: 'error', message: errMsg })}\n\n`);
        res.end();
    };

    try {
        const auth = await getAuthClient();

        sendStep(`LifeOS pipeline starting... (dryRun: ${dryRun})`);

        const summary = await runAutonomousMode(auth, dryRun, sendStep);

        sendComplete(summary);
    } catch (err) {
        console.error('[orchestratorRoute] Fatal error:', err.message);
        sendError(`Pipeline failed: ${err.message}`);
    }
});

module.exports = router;
