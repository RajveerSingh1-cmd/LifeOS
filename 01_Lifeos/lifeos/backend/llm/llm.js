require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Lazy client — only instantiated on first callLLM call,
// so this module can be required without GEMINI_API_KEY at load time.
let _client = null;
function getClient() {
    if (!_client) {
        _client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return _client;
}

/**
 * Calls the Gemini API and returns a parsed JSON object.
 * - Model: gemini-2.0-flash (free tier, fast)
 * - responseMimeType: application/json (enforced JSON output)
 * - Temperature: 0.2 for consistency
 *
 * @param {string} prompt
 * @returns {Promise<object>} - Parsed JSON object from LLM response
 * @throws {Error} - Typed error with raw response attached on failure
 */
async function callLLM(prompt) {
    let rawContent = null;

    try {
        const genAI = getClient();
        const model = genAI.getGenerativeModel({
            model: 'gemini-flash-lite-latest',
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
            },
            systemInstruction:
                'You are a structured data extractor. Always respond with valid JSON only. No markdown, no preamble, no explanation.',
        });

        const result = await model.generateContent(prompt);
        rawContent = result.response.text();

        // Defensive: strip markdown code fences if present
        const cleaned = rawContent
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();

        return JSON.parse(cleaned);
    } catch (err) {
        const structuredError = new Error(`LLM call failed: ${err.message}`);
        structuredError.rawResponse = rawContent;
        structuredError.originalError = err;
        throw structuredError;
    }
}

module.exports = { callLLM };
