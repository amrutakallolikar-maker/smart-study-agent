/**
 * Study Material Agent
 * Generates summaries, notes, flashcards, and questions using IBM Granite.
 */
const { generateText, generateJSON } = require('../utils/granite');
const db = require('../database');

function buildContext(text, maxChars = 3000) {
  if (!text) return '';
  return text.length > maxChars ? text.slice(0, maxChars) + '\n...[truncated]' : text;
}

async function generateSummary(text, subject = '', topic = '') {
  const context = buildContext(text);
  const prompt = `You are an expert academic tutor. Generate a concise, well-structured summary of the following study material.
${subject ? `Subject: ${subject}` : ''}
${topic ? `Topic: ${topic}` : ''}

Study Material:
${context}

Provide:
1. A brief overview (2-3 sentences)
2. Key concepts (bullet points)
3. Important takeaways

Format your response clearly with headings.`;

  return generateText(prompt, { max_new_tokens: 800 });
}

async function generateDetailedNotes(text, subject = '', topic = '') {
  const context = buildContext(text, 3500);
  const prompt = `You are an expert academic tutor. Create detailed, exam-oriented study notes from the following material.
${subject ? `Subject: ${subject}` : ''}
${topic ? `Topic: ${topic}` : ''}

Study Material:
${context}

Generate comprehensive notes including:
1. Main concepts with explanations
2. Key definitions
3. Important formulas (if any)
4. Examples
5. Points to remember for exams

Use clear headings and bullet points.`;

  return generateText(prompt, { max_new_tokens: 1200 });
}

async function generateFlashcards(text, subject = '', topic = '', count = 8) {
  const context = buildContext(text);
  const prompt = `You are an expert academic tutor. Generate ${count} flashcards from the following study material.
${subject ? `Subject: ${subject}` : ''}
${topic ? `Topic: ${topic}` : ''}

Study Material:
${context}

Return a JSON array of flashcard objects. Each object must have:
- "front": the question or term (string)
- "back": the answer or definition (string)
- "difficulty": one of "easy", "medium", "hard" (string)

Example format:
[{"front": "What is Newton's first law?", "back": "An object at rest stays at rest...", "difficulty": "medium"}]`;

  return generateJSON(prompt, { max_new_tokens: 1500 });
}

async function generateMCQs(text, subject = '', topic = '', count = 5) {
  const context = buildContext(text);
  const prompt = `You are an expert academic tutor. Generate ${count} multiple choice questions from the following study material.
${subject ? `Subject: ${subject}` : ''}
${topic ? `Topic: ${topic}` : ''}

Study Material:
${context}

Return a JSON array of MCQ objects. Each object must have:
- "question": the question text (string)
- "options": array of 4 option strings labeled A, B, C, D
- "correct_answer": the letter of the correct option (e.g., "A")
- "explanation": brief explanation of why the answer is correct (string)

Example:
[{"question": "What is ...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "correct_answer": "B", "explanation": "Because..."}]`;

  return generateJSON(prompt, { max_new_tokens: 2000 });
}

async function generateKeyPoints(text, subject = '', topic = '') {
  const context = buildContext(text);
  const prompt = `You are an expert academic tutor. Extract the most important key points, definitions, and formulas from the following study material.
${subject ? `Subject: ${subject}` : ''}
${topic ? `Topic: ${topic}` : ''}

Study Material:
${context}

Provide:
1. **Key Points** (numbered list)
2. **Important Definitions** (term: definition format)
3. **Formulas** (if applicable)
4. **Quick Revision Points** (5-7 bullet points for last-minute revision)`;

  return generateText(prompt, { max_new_tokens: 900 });
}

async function generateShortAnswerQuestions(text, subject = '', topic = '', count = 6) {
  const context = buildContext(text);
  const prompt = `You are an expert academic tutor. Generate ${count} important short-answer questions with model answers from the following study material.
${subject ? `Subject: ${subject}` : ''}
${topic ? `Topic: ${topic}` : ''}

Study Material:
${context}

Return a JSON array. Each object must have:
- "question": the short-answer question (string)
- "answer": a concise model answer (string, 2-4 sentences)
- "marks": suggested marks (number, 2-5)

Example:
[{"question": "Define ...", "answer": "...", "marks": 2}]`;

  return generateJSON(prompt, { max_new_tokens: 1800 });
}

async function generateImportantQuestions(text, subject = '', topic = '') {
  const context = buildContext(text);
  const prompt = `You are an expert academic tutor specializing in exam preparation. Based on the following study material, list the most important questions likely to appear in exams.
${subject ? `Subject: ${subject}` : ''}
${topic ? `Topic: ${topic}` : ''}

Study Material:
${context}

Provide:
1. **Very Important Questions** (likely 6+ marks each)
2. **Important Short Questions** (2-4 marks each)
3. **Definitions to Remember**
4. **Numerical/Problem-solving Questions** (if applicable)

Focus on conceptual clarity and exam relevance.`;

  return generateText(prompt, { max_new_tokens: 1000 });
}

// Save generated material to database
function saveMaterial(profileId, subjectId, topicId, resourceId, type, title, content) {
  const contentStr = typeof content === 'object' ? JSON.stringify(content) : content;
  const result = db.prepare(`
    INSERT INTO study_materials (profile_id, subject_id, topic_id, resource_id, material_type, title, content)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(profileId, subjectId || null, topicId || null, resourceId || null, type, title, contentStr);
  return result.lastInsertRowid;
}

module.exports = {
  generateSummary,
  generateDetailedNotes,
  generateFlashcards,
  generateMCQs,
  generateKeyPoints,
  generateShortAnswerQuestions,
  generateImportantQuestions,
  saveMaterial,
};
