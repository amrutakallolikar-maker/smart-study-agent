const express = require('express');
const router = express.Router();
const db = require('../database');
const { generateQuiz, submitAnswer, completeQuizSession, getQuizHistory } = require('../agents/quizAgent');

// POST generate new quiz
router.post('/generate', async (req, res) => {
  const { profile_id, subject_id, topic_id, resource_id, count } = req.body;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });

  try {
    let text = '';
    if (resource_id) {
      const r = db.prepare('SELECT extracted_text FROM resources WHERE id = ?').get(resource_id);
      text = r?.extracted_text || '';
    } else if (topic_id) {
      // Try to find relevant resources for the topic
      const resources = db.prepare(`
        SELECT extracted_text FROM resources WHERE topic_id = ? AND extracted_text IS NOT NULL LIMIT 1
      `).get(topic_id);
      text = resources?.extracted_text || '';
    } else if (subject_id) {
      const resources = db.prepare(`
        SELECT extracted_text FROM resources WHERE subject_id = ? AND extracted_text IS NOT NULL LIMIT 1
      `).get(subject_id);
      text = resources?.extracted_text || '';
    }

    const result = await generateQuiz(profile_id, subject_id, topic_id, text, count || 5);
    res.json(result);
  } catch (err) {
    console.error('Quiz generation error:', err.message);
    if (err.message.includes('API_KEY') || err.message.includes('PROJECT_ID')) {
      return res.status(503).json({ error: 'IBM Granite not configured.' });
    }
    res.status(500).json({ error: `Quiz generation failed: ${err.message}` });
  }
});

// GET quiz session with questions
router.get('/session/:sessionId', (req, res) => {
  const session = db.prepare('SELECT * FROM quiz_sessions WHERE id = ?').get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const questions = db.prepare('SELECT * FROM quiz_questions WHERE session_id = ? ORDER BY id').all(req.params.sessionId);
  const questionsForStudent = questions.map(q => ({
    ...q,
    options: JSON.parse(q.options),
    // Don't expose correct answer during active quiz
    correct_answer: session.completed ? q.correct_answer : undefined,
    explanation: session.completed ? q.explanation : undefined,
  }));
  res.json({ session, questions: questionsForStudent });
});

// POST submit single answer
router.post('/answer', async (req, res) => {
  const { question_id, student_answer } = req.body;
  if (!question_id) return res.status(400).json({ error: 'question_id is required' });
  if (!student_answer) return res.status(400).json({ error: 'student_answer is required' });

  try {
    const result = await submitAnswer(question_id, student_answer);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST complete quiz session
router.post('/session/:sessionId/complete', async (req, res) => {
  try {
    const result = await completeQuizSession(req.params.sessionId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET quiz history
router.get('/history', (req, res) => {
  const { profile_id } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });
  const history = getQuizHistory(profile_id);
  res.json({ history });
});

module.exports = router;
