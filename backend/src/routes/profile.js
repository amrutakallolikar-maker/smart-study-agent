const express = require('express');
const router = express.Router();
const db = require('../database');

// GET current profile (first profile or null)
router.get('/', (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles ORDER BY id LIMIT 1').get();
  res.json({ profile: profile || null });
});

// POST create profile
router.post('/', (req, res) => {
  const { name, course, branch, semester, study_hours_per_day, exam_date } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  const existing = db.prepare('SELECT id FROM profiles LIMIT 1').get();
  if (existing) {
    return res.status(409).json({ error: 'Profile already exists. Use PUT to update.' });
  }
  const result = db.prepare(`
    INSERT INTO profiles (name, course, branch, semester, study_hours_per_day, exam_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    course?.trim() || null,
    branch?.trim() || null,
    semester?.trim() || null,
    parseFloat(study_hours_per_day) || 4,
    exam_date || null
  );
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ profile });
});

// PUT update profile
router.put('/:id', (req, res) => {
  const { name, course, branch, semester, study_hours_per_day, exam_date } = req.body;
  const existing = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Profile not found' });

  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }

  db.prepare(`
    UPDATE profiles
    SET name = ?, course = ?, branch = ?, semester = ?,
        study_hours_per_day = ?, exam_date = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    (name || existing.name).trim(),
    course !== undefined ? course?.trim() : existing.course,
    branch !== undefined ? branch?.trim() : existing.branch,
    semester !== undefined ? semester?.trim() : existing.semester,
    study_hours_per_day !== undefined ? parseFloat(study_hours_per_day) : existing.study_hours_per_day,
    exam_date !== undefined ? exam_date : existing.exam_date,
    req.params.id
  );
  const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(req.params.id);
  res.json({ profile });
});

module.exports = router;
