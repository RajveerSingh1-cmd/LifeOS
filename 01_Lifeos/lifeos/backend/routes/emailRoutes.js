const express = require('express');
const router = express.Router();
const { getAuthClient } = require('../auth');
const { fetchEmails } = require('../api-wrappers/gmail');
const { analyzeEmails } = require('../modules/emailIntel');

/**
 * GET /api/emails/fetch
 * Fetches raw emails from Gmail.
 */
router.get('/fetch', async (req, res) => {
    try {
        const auth = await getAuthClient();
        const emails = await fetchEmails(auth, 20);
        res.json({ success: true, data: { emails }, error: null });
    } catch (err) {
        res.status(500).json({ success: false, data: null, error: err.message });
    }
});

/**
 * POST /api/emails/analyze
 * Runs LLM analysis on provided emails.
 * Body: { emails: [] }
 */
router.post('/analyze', async (req, res) => {
    try {
        const { emails } = req.body;
        if (!emails || !Array.isArray(emails)) {
            return res.status(400).json({ success: false, data: null, error: 'Body must contain an "emails" array.' });
        }
        const analyses = await analyzeEmails(emails);
        res.json({ success: true, data: { analyses }, error: null });
    } catch (err) {
        res.status(500).json({ success: false, data: null, error: err.message });
    }
});

module.exports = router;
