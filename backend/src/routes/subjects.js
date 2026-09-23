const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all subjects for a profile
router.get('/', (req, res) => {
  const { profile_id } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });
  const subjects = db.prepare('SELECT * FROM subjects WHERE profile_id = ? ORDER BY priority, name').all(profile_id);
  res.json({ subjects });
});

// GET single subject with topics
router.get('/:id', (req, res) => {
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  const topics = db.prepare('SELECT * FROM topics WHERE subject_id = ? ORDER BY name').all(subject.id);
  res.json({ subject, topics });
});

// POST create subject
router.post('/', (req, res) => {
  const { profile_id, name, code, difficulty, priority, color } = req.body;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });
  if (!name?.trim()) return res.status(400).json({ error: 'Subject name is required' });

  const result = db.prepare(`
    INSERT INTO subjects (profile_id, name, code, difficulty, priority, color)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    profile_id,
    name.trim(),
    code?.trim() || null,
    difficulty || 'medium',
    priority ? parseInt(priority) : 2,
    color || '#3b82f6'
  );
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ subject });
});

// PUT update subject
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Subject not found' });

  const { name, code, difficulty, priority, color } = req.body;
  db.prepare(`
    UPDATE subjects SET name = ?, code = ?, difficulty = ?, priority = ?, color = ? WHERE id = ?
  `).run(
    name?.trim() || existing.name,
    code !== undefined ? code?.trim() : existing.code,
    difficulty || existing.difficulty,
    priority !== undefined ? parseInt(priority) : existing.priority,
    color || existing.color,
    req.params.id
  );
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
  res.json({ subject });
});

// DELETE subject
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Subject not found' });
  db.prepare('DELETE FROM subjects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Subject deleted' });
});

// ---- Topics ----

// GET topics for subject
router.get('/:subjectId/topics', (req, res) => {
  const topics = db.prepare('SELECT * FROM topics WHERE subject_id = ? ORDER BY name').all(req.params.subjectId);
  res.json({ topics });
});

// POST add topic
router.post('/:subjectId/topics', (req, res) => {
  const { name, difficulty } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Topic name is required' });
  const result = db.prepare(`
    INSERT INTO topics (subject_id, name, difficulty) VALUES (?, ?, ?)
  `).run(req.params.subjectId, name.trim(), difficulty || 'medium');
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ topic });
});

// PUT update topic (mark complete etc.)
router.put('/:subjectId/topics/:topicId', (req, res) => {
  const existing = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.topicId);
  if (!existing) return res.status(404).json({ error: 'Topic not found' });
  const { name, difficulty, is_completed } = req.body;
  db.prepare(`
    UPDATE topics SET name = ?, difficulty = ?, is_completed = ? WHERE id = ?
  `).run(
    name?.trim() || existing.name,
    difficulty || existing.difficulty,
    is_completed !== undefined ? (is_completed ? 1 : 0) : existing.is_completed,
    req.params.topicId
  );
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.topicId);
  res.json({ topic });
});

// DELETE topic
router.delete('/:subjectId/topics/:topicId', (req, res) => {
  db.prepare('DELETE FROM topics WHERE id = ?').run(req.params.topicId);
  res.json({ message: 'Topic deleted' });
});

module.exports = router;
