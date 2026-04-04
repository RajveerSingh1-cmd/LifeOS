const { callLLM } = require('../llm/llm');
const { buildReplyPrompt } = require('../llm/prompts');

/**
 * Generates reply drafts for urgent emails that require a reply.
 * Processes sequentially (not in parallel) to respect OpenAI rate limits.
 *
 * @param {Array<RawEmailObject>} emails - The raw email objects
 * @param {Array<EmailAnalysisObject>} analyses - Corresponding analysis objects
 * @returns {Promise<Array<ReplyDraftObject>>}
 */
async function draftReplies(emails, analyses) {
    if (!emails || emails.length === 0 || !analyses || analyses.length === 0) {
        return [];
    }

    // Build a map of email id → raw email for quick lookup
    const emailMap = {};
    for (const email of emails) {
        emailMap[email.id] = email;
    }

    // Filter analyses to only urgent emails requiring a reply
    const urgentAnalyses = analyses.filter(
        (a) => a.urgency === true && a.replyRequired === true
    );

    if (urgentAnalyses.length === 0) {
        return [];
    }

    const drafts = [];

    // Sequential processing — intentionally not Promise.all
    for (const analysis of urgentAnalyses) {
        const email = emailMap[analysis.id];
        if (!email) {
            console.warn(`[replyDraft] No raw email found for id: ${analysis.id}, skipping.`);
            continue;
        }

        try {
            const prompt = buildReplyPrompt(email, analysis);
            const result = await callLLM(prompt);

            drafts.push({
                emailId: analysis.id,
                draft: result.draft || '',
            });
        } catch (err) {
            console.error(`[replyDraft] Failed to draft reply for email ${analysis.id}:`, err.message);
            drafts.push({
                emailId: analysis.id,
                draft: '[Draft generation failed. Please write this reply manually.]',
            });
        }
    }

    return drafts;
}

module.exports = { draftReplies };
