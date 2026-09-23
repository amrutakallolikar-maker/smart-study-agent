const express = require('express');
const router = express.Router();
const db = require('../database');
const agent = require('../agents/studyMaterialAgent');

// GET flashcards for profile
router.get('/', (req, res) => {
  const { profile_id, subject_id, difficulty } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });

  let query = `SELECT fc.*, s.name as subject_name, t.name as topic_name
    FROM flashcards fc
    LEFT JOIN subjects s ON fc.subject_id = s.id
    LEFT JOIN topics t ON fc.topic_id = t.id
    WHERE fc.profile_id = ?`;
  const params = [profile_id];

  if (subject_id) { query += ' AND fc.subject_id = ?'; params.push(subject_id); }
  if (difficulty) { query += ' AND fc.difficulty = ?'; params.push(difficulty); }
  query += ' ORDER BY fc.created_at DESC';

  const flashcards = db.prepare(query).all(...params);
  res.json({ flashcards });
});

// POST generate flashcards via AI
router.post('/generate', async (req, res) => {
  const { profile_id, subject_id, topic_id, resource_id, text, count } = req.body;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });

  let sourceText = text || '';
  let subjectName = '';
  let topicName = '';

  if (resource_id) {
    const r = db.prepare('SELECT extracted_text FROM resources WHERE id = ?').get(resource_id);
    if (r?.extracted_text) sourceText = r.extracted_text;
  }
  if (subject_id) {
    const s = db.prepare('SELECT name FROM subjects WHERE id = ?').get(subject_id);
    if (s) subjectName = s.name;
  }
  if (topic_id) {
    const t = db.prepare('SELECT name FROM topics WHERE id = ?').get(topic_id);
    if (t) topicName = t.name;
  }

  if (!sourceText && !subjectName) {
    return res.status(400).json({ error: 'Provide resource_id, text, or subject_id' });
  }

  try {
    const cards = await agent.generateFlashcards(sourceText, subjectName, topicName, count || 8);

    if (!Array.isArray(cards)) {
      return res.status(500).json({ error: 'Invalid flashcard format from AI' });
    }

    const insertCard = db.prepare(`
      INSERT INTO flashcards (profile_id, subject_id, topic_id, front, back, difficulty)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    cards.forEach(c => insertCard.run(
      profile_id, subject_id || null, topic_id || null,
      c.front, c.back, c.difficulty || 'medium'
    ));

    const saved = db.prepare(`
      SELECT * FROM flashcards WHERE profile_id = ? ORDER BY created_at DESC LIMIT ?
    `).all(profile_id, cards.length);
    res.json({ flashcards: saved, count: saved.length });
  } catch (err) {
    console.error('Flashcard generation error:', err.message);
    if (err.message.includes('API_KEY') || err.message.includes('PROJECT_ID')) {
      return res.status(503).json({ error: 'IBM Granite not configured.' });
    }
    res.status(500).json({ error: `Flashcard generation failed: ${err.message}` });
  }
});

// POST create manual flashcard
router.post('/', (req, res) => {
  const { profile_id, subject_id, topic_id, front, back, difficulty } = req.body;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });
  if (!front?.trim()) return res.status(400).json({ error: 'Front is required' });
  if (!back?.trim()) return res.status(400).json({ error: 'Back is required' });

  const result = db.prepare(`
    INSERT INTO flashcards (profile_id, subject_id, topic_id, front, back, difficulty)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(profile_id, subject_id || null, topic_id || null, front.trim(), back.trim(), difficulty || 'medium');
  const card = db.prepare('SELECT * FROM flashcards WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ flashcard: card });
});

// PUT update flashcard (difficulty, review)
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM flashcards WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Flashcard not found' });

  const { difficulty, front, back } = req.body;
  db.prepare(`
    UPDATE flashcards SET difficulty = ?, front = ?, back = ?,
    last_reviewed = CURRENT_TIMESTAMP, review_count = review_count + 1
    WHERE id = ?
  `).run(
    difficulty || existing.difficulty,
    front?.trim() || existing.front,
    back?.trim() || existing.back,
    req.params.id
  );
  const card = db.prepare('SELECT * FROM flashcards WHERE id = ?').get(req.params.id);
  res.json({ flashcard: card });
});

// DELETE flashcard
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM flashcards WHERE id = ?').run(req.params.id);
  res.json({ message: 'Flashcard deleted' });
});

module.exports = router;
