const express = require('express');
const router = express.Router();
const db = require('../database');
const { generateStudyPlan } = require('../agents/studyPlannerAgent');

// GET latest study plan
router.get('/', (req, res) => {
  const { profile_id } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });

  const plan = db.prepare('SELECT * FROM study_plan WHERE profile_id = ? ORDER BY generated_at DESC LIMIT 1').get(profile_id);
  res.json({ plan: plan || null });
});

// POST generate new study plan
router.post('/generate', async (req, res) => {
  const { profile_id } = req.body;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });

  try {
    const plan = await generateStudyPlan(profile_id);
    res.json({ plan });
  } catch (err) {
    console.error('Study planner error:', err.message);
    if (err.message.includes('API_KEY') || err.message.includes('PROJECT_ID')) {
      return res.status(503).json({ error: 'IBM Granite not configured.' });
    }
    res.status(500).json({ error: `Plan generation failed: ${err.message}` });
  }
});

// POST log study session
router.post('/sessions', (req, res) => {
  const { profile_id, subject_id, topic_id, hours, session_date, notes } = req.body;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });
  if (!hours || isNaN(parseFloat(hours))) return res.status(400).json({ error: 'Valid hours required' });
  if (!session_date) return res.status(400).json({ error: 'session_date is required' });

  const result = db.prepare(`
    INSERT INTO study_sessions (profile_id, subject_id, topic_id, hours, session_date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(profile_id, subject_id || null, topic_id || null, parseFloat(hours), session_date, notes || null);

  const session = db.prepare('SELECT * FROM study_sessions WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ session });
});

// GET study sessions
router.get('/sessions', (req, res) => {
  const { profile_id, subject_id } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });

  let query = `SELECT ss.*, s.name as subject_name, t.name as topic_name
    FROM study_sessions ss
    LEFT JOIN subjects s ON ss.subject_id = s.id
    LEFT JOIN topics t ON ss.topic_id = t.id
    WHERE ss.profile_id = ?`;
  const params = [profile_id];

  if (subject_id) { query += ' AND ss.subject_id = ?'; params.push(subject_id); }
  query += ' ORDER BY ss.session_date DESC LIMIT 100';

  const sessions = db.prepare(query).all(...params);
  res.json({ sessions });
});

module.exports = router;
