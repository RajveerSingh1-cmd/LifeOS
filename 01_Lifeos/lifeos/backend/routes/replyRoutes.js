const express = require('express');
const router = express.Router();
const { callLLM } = require('../llm/llm');
const { buildReplyPrompt } = require('../llm/prompts');

/**
 * POST /api/reply/draft
 * Generates a reply draft for a single email.
 * Body: { email: {}, analysis: {} }
 */
router.post('/draft', async (req, res) => {
    try {
        const { email, analysis } = req.body;
        if (!email || !analysis) {
            return res.status(400).json({ success: false, data: null, error: 'Body must contain "email" and "analysis" objects.' });
        }

        const prompt = buildReplyPrompt(email, analysis);
        const result = await callLLM(prompt);

        res.json({
            success: true,
            data: { emailId: email.id, draft: result.draft || '' },
            error: null,
        });
    } catch (err) {
        res.status(500).json({ success: false, data: null, error: err.message });
    }
});

module.exports = router;
