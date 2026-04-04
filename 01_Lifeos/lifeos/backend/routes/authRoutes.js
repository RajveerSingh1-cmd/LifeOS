const express = require('express');
const router = express.Router();
const { getOAuth2Client, storeTokens, isAuthenticated, SCOPES } = require('../auth');

/**
 * POST /api/auth/google
 * Initiates Google OAuth2 flow — redirects user to Google consent screen.
 */
router.get('/google', (req, res) => {
    const oauth2Client = getOAuth2Client();
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent', // force consent to always get refresh_token
    });
    res.redirect(authUrl);
});

/**
 * GET /api/auth/callback
 * Handles Google OAuth callback. Exchanges code for tokens and stores them.
 */
router.get('/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        return res.status(400).json({ success: false, data: null, error: `OAuth error: ${error}` });
    }

    if (!code) {
        return res.status(400).json({ success: false, data: null, error: 'No code in callback' });
    }

    try {
        const oauth2Client = getOAuth2Client();
        const { tokens } = await oauth2Client.getToken(code);
        storeTokens(tokens);
        console.log('[auth] OAuth flow complete. Tokens stored.');

        // Redirect to frontend dashboard
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
    } catch (err) {
        console.error('[auth] Token exchange failed:', err.message);
        res.status(500).json({ success: false, data: null, error: `Token exchange failed: ${err.message}` });
    }
});

/**
 * GET /api/auth/status
 * Returns whether a user is currently authenticated.
 */
router.get('/status', (req, res) => {
    res.json({
        success: true,
        data: { authenticated: isAuthenticated() },
        error: null,
    });
});

module.exports = router;
