const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

/**
 * Extract text from a PDF file buffer.
 */
async function extractTextFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text || '';
}

/**
 * Extract text from an image file using Tesseract OCR.
 */
async function extractTextFromImage(filePath) {
  const { data: { text } } = await Tesseract.recognize(filePath, 'eng', {
    logger: () => {},
  });
  return text || '';
}

/**
 * Extract text from a plain text file.
 */
function extractTextFromTXT(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Extract text from any supported file type.
 */
async function extractText(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();

  if (mimeType === 'application/pdf' || ext === '.pdf') {
    return extractTextFromPDF(filePath);
  }

  if (
    mimeType?.startsWith('image/') ||
    ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'].includes(ext)
  ) {
    return extractTextFromImage(filePath);
  }

  if (
    mimeType === 'text/plain' ||
    ['.txt', '.md', '.rst'].includes(ext)
  ) {
    return extractTextFromTXT(filePath);
  }

  // Fallback: try as text
  try {
    return extractTextFromTXT(filePath);
  } catch {
    return '';
  }
}

/**
 * Split text into overlapping chunks for RAG.
 * @param {string} text
 * @param {number} chunkSize  - characters per chunk
 * @param {number} overlap    - overlap characters
 */
function chunkText(text, chunkSize = 800, overlap = 150) {
  const chunks = [];
  let start = 0;
  const cleaned = text.replace(/\s+/g, ' ').trim();

  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    chunks.push(cleaned.slice(start, end));
    start += chunkSize - overlap;
    if (start >= cleaned.length) break;
  }
  return chunks;
}

/**
 * Simple TF-based relevance retrieval (no embedding server needed).
 * Returns top-k chunks most relevant to a query.
 */
function retrieveRelevantChunks(query, chunks, topK = 5) {
  if (!chunks || chunks.length === 0) return [];

  const queryWords = new Set(
    query.toLowerCase().split(/\W+/).filter(w => w.length > 2)
  );

  const scored = chunks.map((chunk, idx) => {
    const chunkWords = chunk.chunk_text.toLowerCase().split(/\W+/);
    let score = 0;
    for (const word of chunkWords) {
      if (queryWords.has(word)) score++;
    }
    // Normalize by chunk length to avoid long chunks dominating
    return { ...chunk, score: score / Math.sqrt(chunkWords.length) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter(c => c.score > 0);
}

module.exports = { extractText, chunkText, retrieveRelevantChunks };
