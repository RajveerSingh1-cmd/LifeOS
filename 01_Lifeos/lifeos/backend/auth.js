require('dotenv').config();
const { google } = require('googleapis');

// ─── In-memory token store (swap this object's read/write for DB persistence) ───
const tokenStore = {
    tokens: null,
};

function getOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );
}

/**
 * Returns an OAuth2 client loaded with stored tokens.
 * Automatically refreshes the access token if near expiry.
 * Throws if no tokens have been stored yet.
 */
async function getAuthClient() {
    if (!tokenStore.tokens) {
        throw new Error('Not authenticated. Please complete the OAuth flow first.');
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(tokenStore.tokens);

    // Auto-refresh: if expiry_date is within 5 minutes, force refresh
    const expiryDate = tokenStore.tokens.expiry_date;
    const fiveMinutes = 5 * 60 * 1000;
    if (expiryDate && Date.now() > expiryDate - fiveMinutes) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            tokenStore.tokens = credentials;
            oauth2Client.setCredentials(credentials);
            console.log('[auth] Access token refreshed automatically.');
        } catch (err) {
            console.error('[auth] Token refresh failed:', err.message);
            throw new Error('Token refresh failed. Please re-authenticate.');
        }
    }

    return oauth2Client;
}

/**
 * Stores tokens returned from Google OAuth callback.
 */
function storeTokens(tokens) {
    tokenStore.tokens = tokens;
}

/**
 * Returns true if valid tokens are in store.
 */
function isAuthenticated() {
    return !!tokenStore.tokens;
}

/**
 * Returns the OAuth2 scopes required by LifeOS.
 */
const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/calendar.events',
];

module.exports = {
    getOAuth2Client,
    getAuthClient,
    storeTokens,
    isAuthenticated,
    SCOPES,
};
