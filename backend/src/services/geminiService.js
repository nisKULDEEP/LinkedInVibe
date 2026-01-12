const model = require('../config/gemini');

async function generatePost(systemPrompt, userMessage) {
    try {
        const result = await model.generateContent([systemPrompt || "", userMessage || ""]);
        const response = await result.response;
        return response.text();
    } catch (error) {
        throw new Error(`Gemini Generation Failed: ${error.message}`);
    }
}

module.exports = { generatePost };
