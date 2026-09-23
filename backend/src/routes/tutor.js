const express = require('express');
const router = express.Router();
const db = require('../database');
const { generateText } = require('../utils/granite');
const { retrieveRelevantChunks } = require('../utils/textProcessing');

// POST - ask AI tutor a question (RAG-based)
router.post('/ask', async (req, res) => {
  const { profile_id, subject_id, question, conversation_id } = req.body;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });
  if (!question?.trim()) return res.status(400).json({ error: 'Question is required' });

  try {
    // Retrieve relevant chunks from uploaded resources (RAG)
    let contextChunks = [];
    if (subject_id) {
      // Get chunks from resources for this subject
      const resourceIds = db.prepare(`
        SELECT id FROM resources WHERE profile_id = ? AND subject_id = ?
      `).all(profile_id, subject_id).map(r => r.id);

      if (resourceIds.length > 0) {
        const placeholders = resourceIds.map(() => '?').join(',');
        const allChunks = db.prepare(`
          SELECT rc.*, r.original_name as source_name
          FROM resource_chunks rc
          JOIN resources r ON rc.resource_id = r.id
          WHERE rc.resource_id IN (${placeholders})
        `).all(...resourceIds);

        contextChunks = retrieveRelevantChunks(question, allChunks, 4);
      }
    } else {
      // All resources for profile
      const allChunks = db.prepare(`
        SELECT rc.*, r.original_name as source_name
        FROM resource_chunks rc
        JOIN resources r ON rc.resource_id = r.id
        WHERE r.profile_id = ?
      `).all(profile_id);

      contextChunks = retrieveRelevantChunks(question, allChunks, 4);
    }

    const hasContext = contextChunks.length > 0;
    const contextText = hasContext
      ? contextChunks.map((c, i) => `[Source: ${c.source_name}]\n${c.chunk_text}`).join('\n\n---\n\n')
      : '';

    // Get recent conversation history (last 4 exchanges)
    const history = db.prepare(`
      SELECT role, content FROM tutor_conversations
      WHERE profile_id = ? ${subject_id ? 'AND subject_id = ?' : ''}
      ORDER BY created_at DESC LIMIT 8
    `).all(...(subject_id ? [profile_id, subject_id] : [profile_id])).reverse();

    const conversationContext = history.length > 0
      ? history.map(h => `${h.role === 'user' ? 'Student' : 'Tutor'}: ${h.content}`).join('\n')
      : '';

    const prompt = `You are a helpful AI tutor for students. Answer questions based on the provided study material context.
${hasContext ? `\nRelevant Study Material:\n${contextText}\n` : '\n[No specific uploaded material found for this query. Use general knowledge.]\n'}
${conversationContext ? `\nPrevious conversation:\n${conversationContext}\n` : ''}
Student: ${question}

Tutor: Provide a clear, educational answer. If the question is about uploaded material, base your answer on the provided context. Be accurate, helpful, and concise.`;

    const answer = await generateText(prompt, { max_new_tokens: 800 });

    // Save conversation
    const insertMsg = db.prepare(`
      INSERT INTO tutor_conversations (profile_id, subject_id, role, content) VALUES (?, ?, ?, ?)
    `);
    insertMsg.run(profile_id, subject_id || null, 'user', question);
    insertMsg.run(profile_id, subject_id || null, 'assistant', answer);

    res.json({
      answer,
      sources: contextChunks.map(c => c.source_name).filter((v, i, a) => a.indexOf(v) === i),
      used_rag: hasContext,
    });
  } catch (err) {
    console.error('Tutor error:', err.message);
    if (err.message.includes('API_KEY') || err.message.includes('PROJECT_ID')) {
      return res.status(503).json({ error: 'IBM Granite not configured.' });
    }
    res.status(500).json({ error: `Tutor failed: ${err.message}` });
  }
});

// GET conversation history
router.get('/history', (req, res) => {
  const { profile_id, subject_id, limit = 50 } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });

  const history = db.prepare(`
    SELECT * FROM tutor_conversations
    WHERE profile_id = ? ${subject_id ? 'AND subject_id = ?' : ''}
    ORDER BY created_at ASC LIMIT ?
  `).all(...(subject_id ? [profile_id, subject_id, parseInt(limit)] : [profile_id, parseInt(limit)]));

  res.json({ history });
});

// DELETE conversation history
router.delete('/history', (req, res) => {
  const { profile_id, subject_id } = req.query;
  if (!profile_id) return res.status(400).json({ error: 'profile_id is required' });

  db.prepare(`
    DELETE FROM tutor_conversations WHERE profile_id = ? ${subject_id ? 'AND subject_id = ?' : ''}
  `).run(...(subject_id ? [profile_id, subject_id] : [profile_id]));

  res.json({ message: 'Conversation cleared' });
});

module.exports = router;
