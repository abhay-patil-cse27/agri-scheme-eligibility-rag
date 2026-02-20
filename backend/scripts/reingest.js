/**
 * One-time script to re-ingest a PDF that exists on disk but is missing from MongoDB.
 * Run from the backend/ directory: node scripts/reingest.js
 */
require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const path = require('path');

const MISSING_FILE = '1771525532373-Pradhan Mantri Kisan Samman Nidhi FAQ (PM- KISAN).pdf';
const SCHEME_NAME  = 'PM-KISAN';
const DESCRIPTION  = 'Pradhan Mantri Kisan Samman Nidhi — income support scheme providing ₹6,000/year to farmer families';
const CATEGORY     = 'income_support';

async function reingest() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const Scheme      = require('../src/models/Scheme');
  const SchemeChunk = require('../src/models/SchemeChunk');
  const pdfProcessor     = require('../src/services/pdfProcessor');
  const embeddingService = require('../src/services/embeddingService');

  const filePath = path.join(__dirname, '..', 'data', 'schemes', MISSING_FILE);

  // Remove any stale record with the same name
  const existing = await Scheme.findOne({ name: SCHEME_NAME });
  if (existing) {
    console.log('Removing stale DB record for', SCHEME_NAME);
    await SchemeChunk.deleteMany({ schemeId: existing._id });
    await Scheme.findByIdAndDelete(existing._id);
  }

  console.log('Processing PDF:', MISSING_FILE);
  const { chunks, totalChunks, numPages } = await pdfProcessor.processPDF(filePath, SCHEME_NAME);
  console.log(`  → ${numPages} pages, ${totalChunks} chunks`);

  console.log('Generating embeddings...');
  const texts = chunks.map(c => c.text);
  const embeddings = await embeddingService.generateBatchEmbeddings(texts);

  console.log('Saving scheme to MongoDB...');
  const scheme = await Scheme.create({
    name: SCHEME_NAME,
    description: DESCRIPTION,
    category: CATEGORY,
    sourceFile: MISSING_FILE,
    totalChunks,
    processedAt: new Date(),
  });

  const chunkDocs = chunks.map((chunk, i) => ({
    schemeId: scheme._id,
    schemeName: SCHEME_NAME,
    text: chunk.text,
    embedding: embeddings[i],
    metadata: chunk.metadata,
  }));

  await SchemeChunk.insertMany(chunkDocs);

  console.log(`✅ Done! PM-KISAN ingested: ${totalChunks} chunks stored. ID: ${scheme._id}`);
  await mongoose.disconnect();
}

reingest().catch(err => {
  console.error('❌ Ingestion failed:', err.message);
  process.exit(1);
});
