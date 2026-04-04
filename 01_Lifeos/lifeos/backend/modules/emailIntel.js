const { callLLM } = require('../llm/llm');
const { buildAnalysisPrompt } = require('../llm/prompts');

/**
 * Analyzes an array of raw emails using the LLM.
 * Sends all emails in a single batched prompt (one API call).
 *
 * @param {Array<RawEmailObject>} emails
 * @returns {Promise<Array<EmailAnalysisObject>>}
 */
async function analyzeEmails(emails) {
    if (!emails || emails.length === 0) {
        return [];
    }

    const prompt = buildAnalysisPrompt(emails);
    const result = await callLLM(prompt);

    // LLM returns { analyses: [...] }
    const analyses = result.analyses || result;

    if (!Array.isArray(analyses)) {
        throw new Error('emailIntel: LLM returned unexpected shape — expected an array under "analyses"');
    }

    if (analyses.length !== emails.length) {
        console.warn(
            `[emailIntel] Warning: LLM returned ${analyses.length} analyses for ${emails.length} emails. Proceeding with what we got.`
        );
    }

    return analyses;
}

module.exports = { analyzeEmails };
