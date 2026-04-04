const { google } = require('googleapis');

/**
 * Fetches the most recent emails from Gmail.
 * @param {import('google-auth-library').OAuth2Client} auth
 * @param {number} maxResults - max emails to fetch (default 20)
 * @returns {Promise<Array<RawEmailObject>>}
 */
async function fetchEmails(auth, maxResults = 20) {
    const gmail = google.gmail({ version: 'v1', auth });

    // Get message IDs
    const listResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
    });

    const messages = listResponse.data.messages || [];
    if (messages.length === 0) return [];

    // Fetch each message's metadata
    const emails = await Promise.all(
        messages.map(async (msg) => {
            const detail = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'metadata',
                metadataHeaders: ['Subject', 'From', 'Date'],
            });

            const headers = detail.data.payload?.headers || [];
            const getHeader = (name) =>
                headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

            return {
                id: msg.id,
                subject: getHeader('Subject') || '(no subject)',
                sender: getHeader('From') || '(unknown sender)',
                snippet: detail.data.snippet || '',
                timestamp: getHeader('Date') || new Date().toISOString(),
            };
        })
    );

    return emails;
}

module.exports = { fetchEmails };
