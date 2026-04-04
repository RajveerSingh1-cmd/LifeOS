/**
 * prompts.js — The ONLY file in the codebase that contains LLM prompt strings.
 * All prompt changes must happen here.
 */

/**
 * Builds the batch email analysis prompt.
 * Instructs the LLM to return a JSON array, one item per email, keyed by id.
 *
 * @param {Array<RawEmailObject>} emails
 * @returns {string} prompt string
 */
function buildAnalysisPrompt(emails) {
    const emailsJson = JSON.stringify(emails, null, 2);

    return `You are an executive assistant AI analyzing emails for a busy professional.

Analyze the following emails and return a JSON object with a single key "analyses" containing an array.
Each element in the array must correspond to one email (in the same order as input) with these exact fields:

- id: string (same as input email id)
- subject: string (same as input subject)
- sender: string (same as input sender)
- urgency: boolean (true if the email requires action within 48 hours or has explicit urgency language)
- deadline: string | null (ISO 8601 date string if a deadline is explicitly mentioned, otherwise null)
- replyRequired: boolean (true if a reply is expected or requested)
- actionItem: string | null (one-sentence description of what action is needed, or null)
- summary: string (one or two sentence plain-English summary of the email)

Rules:
- Return ONLY valid JSON. No preamble, no markdown, no explanation.
- The "analyses" array must have exactly ${emails.length} elements in the same order as the input.
- For deadline: only extract explicit deadlines mentioned in subject or snippet. Do not infer.
- For urgency: "ASAP", "urgent", "EOD", "by tomorrow", explicit deadlines < 48h = true.

Input emails:
${emailsJson}`;
}

/**
 * Builds the reply draft prompt for a single urgent email.
 * Returns { draft: "string" } only.
 *
 * @param {RawEmailObject} email
 * @param {EmailAnalysisObject} analysis
 * @returns {string} prompt string
 */
function buildReplyPrompt(email, analysis) {
    return `You are a professional executive assistant writing a reply on behalf of a busy professional.

Write a concise, professional, and context-aware email reply to the following email.

Email details:
- Subject: ${email.subject}
- From: ${email.sender}
- Snippet: ${email.snippet}
- Action needed: ${analysis.actionItem || 'Acknowledge and respond appropriately'}
- Summary: ${analysis.summary}

Requirements:
- The reply should be polite, professional, and concise (2-4 sentences max unless more is clearly needed)
- Address the sender's request or question directly
- Do not include a subject line
- Start with an appropriate greeting
- End with a professional sign-off using "Best regards,"

Return ONLY a JSON object with this exact shape:
{ "draft": "the full reply text here" }

No preamble. No markdown. JSON only.`;
}

module.exports = { buildAnalysisPrompt, buildReplyPrompt };
