const express = require('express');
const router = express.Router();
const db = require('../database');
const agent = require('../agents/studyMaterialAgent');

// GET saved study materials for a profile
router.get('/', (req, res) => {
  const { profile_id, subject_id, material_type } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });

  let query = `SELECT sm.*, s.name as subject_name, t.name as topic_name
    FROM study_materials sm
    LEFT JOIN subjects s ON sm.subject_id = s.id
    LEFT JOIN topics t ON sm.topic_id = t.id
    WHERE sm.profile_id = ?`;
  const params = [profile_id];

  if (subject_id) { query += ' AND sm.subject_id = ?'; params.push(subject_id); }
  if (material_type) { query += ' AND sm.material_type = ?'; params.push(material_type); }
  query += ' ORDER BY sm.created_at DESC';

  const materials = db.prepare(query).all(...params);
  res.json({ materials });
});

// POST generate study material
router.post('/generate', async (req, res) => {
  const { profile_id, subject_id, topic_id, resource_id, material_type, text, count } = req.body;

  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });
  if (!material_type) return res.status(400).json({ error: 'material_type is required' });

  // Resolve text from resource or body
  let sourceText = text || '';
  let subjectName = '';
  let topicName = '';

  if (resource_id) {
    const resource = db.prepare('SELECT extracted_text FROM resources WHERE id = ?').get(resource_id);
    if (resource?.extracted_text) sourceText = resource.extracted_text;
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
    return res.status(400).json({ error: 'Provide either a resource_id, text, or subject_id for generation.' });
  }

  try {
    let content;
    let title;

    switch (material_type) {
      case 'summary':
        content = await agent.generateSummary(sourceText, subjectName, topicName);
        title = `Summary${topicName ? ` - ${topicName}` : subjectName ? ` - ${subjectName}` : ''}`;
        break;
      case 'detailed_notes':
        content = await agent.generateDetailedNotes(sourceText, subjectName, topicName);
        title = `Detailed Notes${topicName ? ` - ${topicName}` : subjectName ? ` - ${subjectName}` : ''}`;
        break;
      case 'key_points':
        content = await agent.generateKeyPoints(sourceText, subjectName, topicName);
        title = `Key Points${topicName ? ` - ${topicName}` : subjectName ? ` - ${subjectName}` : ''}`;
        break;
      case 'flashcards':
        content = await agent.generateFlashcards(sourceText, subjectName, topicName, count || 8);
        title = `Flashcards${topicName ? ` - ${topicName}` : subjectName ? ` - ${subjectName}` : ''}`;
        break;
      case 'mcqs':
        content = await agent.generateMCQs(sourceText, subjectName, topicName, count || 5);
        title = `MCQs${topicName ? ` - ${topicName}` : subjectName ? ` - ${subjectName}` : ''}`;
        break;
      case 'short_answers':
        content = await agent.generateShortAnswerQuestions(sourceText, subjectName, topicName, count || 6);
        title = `Short Answer Questions${topicName ? ` - ${topicName}` : ''}`;
        break;
      case 'important_questions':
        content = await agent.generateImportantQuestions(sourceText, subjectName, topicName);
        title = `Important Questions${topicName ? ` - ${topicName}` : subjectName ? ` - ${subjectName}` : ''}`;
        break;
      default:
        return res.status(400).json({ error: `Unknown material_type: ${material_type}` });
    }

    const materialId = agent.saveMaterial(profile_id, subject_id, topic_id, resource_id, material_type, title, content);
    res.json({ material_id: materialId, content, title, material_type });
  } catch (err) {
    console.error('Study material generation error:', err.message);
    if (err.message.includes('API_KEY') || err.message.includes('PROJECT_ID')) {
      return res.status(503).json({ error: 'IBM Granite not configured. Please set WATSONX_API_KEY and WATSONX_PROJECT_ID.' });
    }
    res.status(500).json({ error: `Generation failed: ${err.message}` });
  }
});

// DELETE saved material
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM study_materials WHERE id = ?').run(req.params.id);
  res.json({ message: 'Material deleted' });
});

module.exports = router;
