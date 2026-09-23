const axios = require('axios');
const demo = require('./demoResponses');

const WATSONX_URL = process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com';
const GRANITE_TEXT_MODEL = process.env.GRANITE_TEXT_MODEL || 'ibm/granite-13b-instruct-v2';

const IS_DEMO = process.env.DEMO_MODE === 'true';

// ---------------------------------------------------------------------------
// Demo-mode helpers — pick the right mock based on the prompt content
// ---------------------------------------------------------------------------
function demoText(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('study plan') || p.includes('schedule'))     return demo.DEMO_STUDY_PLAN;
  if (p.includes('recommendation') || p.includes('weak area')) return demo.DEMO_RECOMMENDATIONS;
  if (p.includes('key point') || p.includes('formula'))       return demo.DEMO_KEY_POINTS;
  if (p.includes('detailed') && p.includes('note'))           return demo.DEMO_DETAILED_NOTES;
  if (p.includes('important question'))                        return demo.DEMO_IMPORTANT_QUESTIONS;
  if (p.includes('tutor') || p.includes('student:'))          {
    // Extract the student's question from the prompt
    const match = prompt.match(/Student:\s*(.+)/i);
    return demo.DEMO_TUTOR_ANSWER(match ? match[1].trim() : 'your question');
  }
  return demo.DEMO_SUMMARY;
}

function demoJSON(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('flashcard'))    return demo.DEMO_FLASHCARDS;
  if (p.includes('short-answer') || p.includes('short answer')) return demo.DEMO_SHORT_ANSWERS;
  if (p.includes('quiz') || p.includes('mcq') || p.includes('multiple choice')) {
    const countMatch = prompt.match(/generate (\d+)/i);
    const count = countMatch ? parseInt(countMatch[1]) : 5;
    const subjectMatch = prompt.match(/Subject:\s*(.+)/i);
    return demo.DEMO_QUIZ(subjectMatch ? subjectMatch[1].trim() : 'General', count);
  }
  return demo.DEMO_MCQS;
}

let cachedIAMToken = null;
let tokenExpiry = null;

/**
 * Obtain an IBM Cloud IAM access token using the API key.
 */
async function getIAMToken() {
  const now = Date.now();
  if (cachedIAMToken && tokenExpiry && now < tokenExpiry) {
    return cachedIAMToken;
  }

  const apiKey = process.env.WATSONX_API_KEY;
  if (!apiKey) {
    throw new Error('WATSONX_API_KEY environment variable is not set.');
  }

  const response = await axios.post(
    'https://iam.cloud.ibm.com/identity/token',
    new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: apiKey,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  cachedIAMToken = response.data.access_token;
  // Tokens expire in 3600s; refresh 5 minutes early
  tokenExpiry = now + (response.data.expires_in - 300) * 1000;
  return cachedIAMToken;
}

/**
 * Call IBM Granite text generation via watsonx.ai.
 * @param {string} prompt
 * @param {object} params - Optional generation params
 */
async function generateText(prompt, params = {}) {
  if (IS_DEMO) return demoText(prompt);
  const token = await getIAMToken();
  const projectId = process.env.WATSONX_PROJECT_ID;

  if (!projectId) {
    throw new Error('WATSONX_PROJECT_ID environment variable is not set.');
  }

  const payload = {
    model_id: params.model_id || GRANITE_TEXT_MODEL,
    input: prompt,
    parameters: {
      decoding_method: params.decoding_method || 'greedy',
      max_new_tokens: params.max_new_tokens || 1024,
      min_new_tokens: params.min_new_tokens || 1,
      stop_sequences: params.stop_sequences || [],
      repetition_penalty: params.repetition_penalty || 1.1,
      temperature: params.temperature || 0.7,
    },
    project_id: projectId,
  };

  const response = await axios.post(
    `${WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 120000,
    }
  );

  const result = response.data?.results?.[0]?.generated_text;
  if (!result) {
    throw new Error('No text generated from IBM Granite.');
  }
  return result.trim();
}

/**
 * Generate a structured JSON response from Granite.
 * Attempts to parse JSON from the response; falls back to raw text.
 */
async function generateJSON(prompt, params = {}) {
  if (IS_DEMO) return demoJSON(prompt);
  const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON. Do not include any explanation or markdown code fences.`;
  const raw = await generateText(jsonPrompt, { ...params, max_new_tokens: params.max_new_tokens || 2048 });

  // Strip markdown fences if present
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Extract first JSON object or array
  const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) {
    cleaned = match[1];
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Granite returned non-JSON response: ${raw.substring(0, 200)}`);
  }
}

module.exports = { generateText, generateJSON, getIAMToken };
