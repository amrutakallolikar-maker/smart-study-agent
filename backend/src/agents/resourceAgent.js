/**
 * Resource Processing Agent
 * Processes uploaded learning resources: extracts text, stores chunks for RAG.
 */
const db = require('../database');
const { extractText, chunkText } = require('../utils/textProcessing');

async function processResource(resourceId) {
  const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(resourceId);
  if (!resource) throw new Error(`Resource ${resourceId} not found`);

  // Extract text
  const text = await extractText(resource.file_path, resource.file_type);

  // Update resource with extracted text
  db.prepare('UPDATE resources SET extracted_text = ? WHERE id = ?').run(text, resourceId);

  // Delete old chunks if any
  db.prepare('DELETE FROM resource_chunks WHERE resource_id = ?').run(resourceId);

  // Create chunks for RAG
  const chunks = chunkText(text);
  const insertChunk = db.prepare(
    'INSERT INTO resource_chunks (resource_id, chunk_index, chunk_text) VALUES (?, ?, ?)'
  );
  const insertMany = db.transaction((resourceId, chunks) => {
    chunks.forEach((chunk, idx) => insertChunk.run(resourceId, idx, chunk));
  });
  insertMany(resourceId, chunks);

  return { text, chunkCount: chunks.length };
}

module.exports = { processResource };
