const express = require('express');
const router = express.Router();
const { getProgressData, generateRecommendations } = require('../agents/progressAgent');

// GET progress dashboard data
router.get('/', (req, res) => {
  const { profile_id } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });

  try {
    const data = getProgressData(profile_id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET AI-powered recommendations
router.get('/recommendations', async (req, res) => {
  const { profile_id } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });

  try {
    const result = await generateRecommendations(profile_id);
    res.json(result);
  } catch (err) {
    console.error('Recommendations error:', err.message);
    if (err.message.includes('API_KEY') || err.message.includes('PROJECT_ID')) {
      return res.status(503).json({ error: 'IBM Granite not configured.' });
    }
    res.status(500).json({ error: `Recommendations failed: ${err.message}` });
  }
});

module.exports = router;
