const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../database');
const { processResource } = require('../agents/resourceAgent');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'text/plain': '.txt',
};

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '20');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = Object.keys(ALLOWED_TYPES);
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, images, text files.`));
    }
  },
});

// GET all resources for a profile
router.get('/', (req, res) => {
  const { profile_id, subject_id } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });

  let query = `SELECT r.*, s.name as subject_name, t.name as topic_name
    FROM resources r
    LEFT JOIN subjects s ON r.subject_id = s.id
    LEFT JOIN topics t ON r.topic_id = t.id
    WHERE r.profile_id = ?`;
  const params = [profile_id];

  if (subject_id) {
    query += ' AND r.subject_id = ?';
    params.push(subject_id);
  }
  query += ' ORDER BY r.created_at DESC';

  const resources = db.prepare(query).all(...params);
  // Don't send extracted_text in list view (too large)
  const safe = resources.map(({ extracted_text, ...r }) => r);
  res.json({ resources: safe });
});

// GET single resource
router.get('/:id', (req, res) => {
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
  if (!resource) return res.status(404).json({ error: 'Resource not found' });
  res.json({ resource });
});

// POST upload resource
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { profile_id, subject_id, topic_id } = req.body;
  if (!profile_id) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'profile_id is required' });
  }

  const result = db.prepare(`
    INSERT INTO resources (profile_id, subject_id, topic_id, filename, original_name, file_type, file_path, file_size)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    profile_id,
    subject_id || null,
    topic_id || null,
    req.file.filename,
    req.file.originalname,
    req.file.mimetype,
    req.file.path,
    req.file.size
  );

  const resourceId = result.lastInsertRowid;

  // Process resource asynchronously
  processResource(resourceId).catch(err => {
    console.error(`Failed to process resource ${resourceId}:`, err.message);
  });

  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(resourceId);
  const { extracted_text, ...safe } = resource;
  res.status(201).json({ resource: safe, message: 'File uploaded. Text extraction in progress.' });
});

// DELETE resource
router.delete('/:id', (req, res) => {
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
  if (!resource) return res.status(404).json({ error: 'Resource not found' });

  // Delete file from disk
  if (fs.existsSync(resource.file_path)) {
    fs.unlinkSync(resource.file_path);
  }

  db.prepare('DELETE FROM resources WHERE id = ?').run(req.params.id);
  res.json({ message: 'Resource deleted' });
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: `File too large. Maximum size is ${MAX_SIZE_MB}MB.` });
  }
  res.status(400).json({ error: err.message });
});

module.exports = router;
