'use strict';
/**
 * aiProvider.js
 * Wraps the Google Gemini API.
 * All credentials and API calls are strictly server-side.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '20000', 10);
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

/**
 * Returns a configured Gemini GenerativeModel instance,
 * or throws a structured error if the key is missing.
 */
function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('AI service is not configured. GEMINI_API_KEY is missing.');
    err.statusCode = 503;
    err.code = 'AI_KEY_MISSING';
    throw err;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: MODEL_NAME });
}

/**
 * Sends a prompt to Gemini and returns the raw text response.
 * Handles timeout, rate limits, empty responses, and provider errors.
 *
 * @param {string} prompt - The full prompt text
 * @param {object} options - Optional generation config
 * @returns {Promise<string>} - Raw text from the model
 */
async function generateText(prompt, options = {}) {
  const model = getModel(); // Throws if key is missing

  const generationConfig = {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
    ...options
  };

  // Wrap in a timeout race
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      const err = new Error('AI request timed out. Please try again.');
      err.statusCode = 504;
      err.code = 'AI_TIMEOUT';
      reject(err);
    }, TIMEOUT_MS);
  });

  const generatePromise = (async () => {
    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig
      });

      const response = result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        const err = new Error('AI returned an empty response. Please try again.');
        err.statusCode = 502;
        err.code = 'AI_EMPTY_RESPONSE';
        throw err;
      }

      return text.trim();
    } catch (err) {
      // Re-throw structured errors we created
      if (err.code) throw err;

      // Handle Gemini API-specific errors
      const message = err.message || '';

      if (message.includes('429') || message.toLowerCase().includes('quota') || message.toLowerCase().includes('rate')) {
        const rateErr = new Error('AI service rate limit reached. Please wait a moment and try again.');
        rateErr.statusCode = 429;
        rateErr.code = 'AI_RATE_LIMITED';
        throw rateErr;
      }

      if (message.includes('API_KEY') || message.includes('invalid') || message.includes('401') || message.includes('403')) {
        const authErr = new Error('AI service authentication failed. Please check the API key configuration.');
        authErr.statusCode = 503;
        authErr.code = 'AI_AUTH_FAILED';
        throw authErr;
      }

      // Generic provider failure
      const providerErr = new Error('AI service is temporarily unavailable. Please try again later.');
      providerErr.statusCode = 503;
      providerErr.code = 'AI_PROVIDER_ERROR';
      providerErr.originalMessage = message;
      throw providerErr;
    }
  })();

  return Promise.race([generatePromise, timeoutPromise]);
}

module.exports = { generateText };
