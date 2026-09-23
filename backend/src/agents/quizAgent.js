/**
 * Quiz Agent
 * Generates and evaluates quizzes using IBM Granite.
 */
const { generateJSON, generateText } = require('../utils/granite');
const db = require('../database');

async function generateQuiz(profileId, subjectId, topicId, text, count = 5) {
  const subject = subjectId ? db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId) : null;
  const topic = topicId ? db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId) : null;

  const context = text && text.length > 3000 ? text.slice(0, 3000) : text || '';

  const prompt = `You are an expert academic quiz generator. Generate ${count} multiple choice questions for an exam quiz.
${subject ? `Subject: ${subject.name}` : ''}
${topic ? `Topic: ${topic.name}` : ''}
${context ? `\nStudy Material:\n${context}` : '\nGenerate questions based on the subject/topic.'}

Return ONLY a JSON array of exactly ${count} MCQ objects. Each object must have:
- "question": clear question text (string)
- "options": exactly 4 strings, each starting with "A. ", "B. ", "C. ", "D. " 
- "correct_answer": just the letter "A", "B", "C", or "D" (string)
- "explanation": 1-2 sentence explanation of the correct answer (string)

Example:
[{"question":"What is...","options":["A. First","B. Second","C. Third","D. Fourth"],"correct_answer":"B","explanation":"Because..."}]`;

  const questions = await generateJSON(prompt, { max_new_tokens: 2500 });

  if (!Array.isArray(questions)) {
    throw new Error('Quiz generation failed: invalid format returned.');
  }

  // Validate and sanitize
  const validated = questions.slice(0, count).map(q => ({
    question: q.question || 'Question not available',
    options: Array.isArray(q.options) && q.options.length === 4
      ? q.options
      : ['A. Option A', 'B. Option B', 'C. Option C', 'D. Option D'],
    correct_answer: q.correct_answer?.toUpperCase() || 'A',
    explanation: q.explanation || '',
  }));

  // Create quiz session
  const session = db.prepare(`
    INSERT INTO quiz_sessions (profile_id, subject_id, topic_id, total_questions)
    VALUES (?, ?, ?, ?)
  `).run(profileId, subjectId || null, topicId || null, validated.length);

  const sessionId = session.lastInsertRowid;

  // Insert questions individually (sql.js transaction wrapper is unreliable)
  const insertQ = db.prepare(`
    INSERT INTO quiz_questions (session_id, question, options, correct_answer, explanation)
    VALUES (?, ?, ?, ?, ?)
  `);
  validated.forEach(q =>
    insertQ.run(sessionId, q.question, JSON.stringify(q.options), q.correct_answer, q.explanation)
  );

  return { sessionId, questions: validated };
}

async function submitAnswer(questionId, studentAnswer) {
  const question = db.prepare('SELECT * FROM quiz_questions WHERE id = ?').get(questionId);
  if (!question) throw new Error('Question not found');

  const isCorrect = question.correct_answer === studentAnswer.toUpperCase() ? 1 : 0;

  db.prepare(`
    UPDATE quiz_questions SET student_answer = ?, is_correct = ? WHERE id = ?
  `).run(studentAnswer.toUpperCase(), isCorrect, questionId);

  return {
    isCorrect: Boolean(isCorrect),
    correctAnswer: question.correct_answer,
    explanation: question.explanation,
  };
}

async function completeQuizSession(sessionId) {
  const questions = db.prepare('SELECT * FROM quiz_questions WHERE session_id = ?').all(sessionId);
  const answered = questions.filter(q => q.student_answer !== null);
  const correct = answered.filter(q => q.is_correct === 1).length;

  db.prepare(`
    UPDATE quiz_sessions SET score = ?, completed = 1 WHERE id = ?
  `).run(correct, sessionId);

  const session = db.prepare('SELECT * FROM quiz_sessions WHERE id = ?').get(sessionId);

  return {
    sessionId,
    score: correct,
    total: questions.length,
    percentage: Math.round((correct / questions.length) * 100),
    session,
  };
}

function getQuizHistory(profileId) {
  return db.prepare(`
    SELECT qs.*, s.name as subject_name, t.name as topic_name,
           ROUND(CAST(qs.score AS REAL) / NULLIF(qs.total_questions, 0) * 100, 1) as percentage
    FROM quiz_sessions qs
    LEFT JOIN subjects s ON qs.subject_id = s.id
    LEFT JOIN topics t ON qs.topic_id = t.id
    WHERE qs.profile_id = ? AND qs.completed = 1
    ORDER BY qs.created_at DESC
    LIMIT 50
  `).all(profileId);
}

module.exports = { generateQuiz, submitAnswer, completeQuizSession, getQuizHistory };
