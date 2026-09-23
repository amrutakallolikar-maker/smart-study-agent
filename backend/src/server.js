require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const db = require('./database');

// Routes
const profileRoutes = require('./routes/profile');
const subjectsRoutes = require('./routes/subjects');
const resourcesRoutes = require('./routes/resources');
const studyMaterialRoutes = require('./routes/studyMaterial');
const tutorRoutes = require('./routes/tutor');
const plannerRoutes = require('./routes/planner');
const quizRoutes = require('./routes/quiz');
const flashcardsRoutes = require('./routes/flashcards');
const progressRoutes = require('./routes/progress');

const app = express();
const PORT = process.env.PORT || 5000;

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads (secure: only accessible via this path)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/profile', profileRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/study-material', studyMaterialRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/flashcards', flashcardsRoutes);
app.use('/api/progress', progressRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const isDemo = process.env.DEMO_MODE === 'true';
  const configured = isDemo || !!(process.env.WATSONX_API_KEY && process.env.WATSONX_PROJECT_ID);
  res.json({
    status: 'ok',
    granite_configured: configured,
    demo_mode: isDemo,
    model: isDemo ? 'demo-mode' : (process.env.GRANITE_TEXT_MODEL || 'ibm/granite-13b-instruct-v2'),
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Initialize DB then start server
db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Smart Study Agent backend running on port ${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/api/health`);
    const configured = !!(process.env.WATSONX_API_KEY && process.env.WATSONX_PROJECT_ID);
    if (!configured) {
      console.warn('⚠️  IBM Granite not configured — set WATSONX_API_KEY and WATSONX_PROJECT_ID in .env');
    } else {
      console.log('✅ IBM Granite configured');
    }
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;
