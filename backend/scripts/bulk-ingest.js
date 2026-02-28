require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

async function bulkIngest() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  const { closeDriver } = require('../src/config/neo4j');
  const Scheme = require('../src/models/Scheme');
  const SchemeChunk = require('../src/models/SchemeChunk');
  const pdfProcessor = require('../src/services/pdfProcessor');
  const embeddingService = require('../src/services/embeddingService');
  const graphService = require('../src/services/graphService');

  // Paths assuming this runs from backend/ folder
  const baseDir = path.join(__dirname, '..', '..', 'docs', 'schemes');
  if (!fs.existsSync(baseDir)) {
    console.error('❌ Directory does not exist:', baseDir);
    process.exit(1);
  }

  const categories = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());
  let successCount = 0;
  let failCount = 0;

  for (const category of categories) {
    const categoryPath = path.join(baseDir, category);
    const pdfs = fs.readdirSync(categoryPath).filter(f => f.toLowerCase().endsWith('.pdf'));

    if (pdfs.length === 0) continue;
    console.log(`\n======================================================`);
    console.log(`📁 Category: ${category.toUpperCase()} (${pdfs.length} files)`);
    console.log(`======================================================`);

    for (const pdfFile of pdfs) {
      const filePath = path.join(categoryPath, pdfFile);
      // Create a clean scheme name from the filename
      const schemeName = path.basename(pdfFile, '.pdf').replace(/_|-/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`\n📄 Processing: ${schemeName}`);

      try {
        // 1. Process PDF into chunks
        const { chunks, totalChunks, numPages } = await pdfProcessor.processPDF(filePath, schemeName);
        console.log(`  → Extracted ${numPages} pages into ${totalChunks} metadata chunks.`);

        if (totalChunks === 0) {
          console.warn(`  ⚠️ No text chunks could be extracted. Skipping.`);
          failCount++;
          continue;
        }

        // 2. Generate Embeddings (batches of 20 to prevent memory crashes on local models)
        const texts = chunks.map(c => c.text);
        const embeddings = await embeddingService.generateBatchEmbeddings(texts, 20);
        console.log(`  → Generated ${embeddings.length} vector embeddings.`);

        // 3. Save to MongoDB - Scheme
        const scheme = await Scheme.create({
          name: schemeName,
          description: `Government scheme document: ${schemeName}`,
          category: category,
          version: '1.0',
          totalChunks: totalChunks,
          processedAt: new Date(),
        });

        // 4. Save to MongoDB - SchemeChunks
        const chunkDocs = chunks.map((chunk, i) => ({
          schemeId: scheme._id,
          schemeName: schemeName,
          category: category,
          text: chunk.text,
          embedding: embeddings[i],
          metadata: chunk.metadata,
        }));
        await SchemeChunk.insertMany(chunkDocs);
        console.log(`  → Saved to MongoDB (Scheme & ${chunkDocs.length} Chunks).`);

        // 5. Save to Neo4j Knowledge Graph
        await graphService.ensureSchemeNode({
          name: schemeName,
          description: `Agricultural scheme related to ${category}`,
          id: scheme._id.toString(),
          category: category
        });

        const docMetadata = { path: pdfFile, type: 'guidelines', state: 'All', language: 'en' };
        await graphService.addDocumentToScheme(schemeName, docMetadata);

        const chunksMetadata = chunks.map(c => c.metadata);
        await graphService.linkChunksBatch(pdfFile, chunksMetadata);
        console.log(`  → Added nodes & relationships to Neo4j (Batch).`);
        
        console.log(`  ✅ SUCCESS: ${schemeName}`);
        successCount++;
      } catch (err) {
        console.error(`  ❌ ERROR processing ${pdfFile}:`, err.message);
        failCount++;
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`🎉 Bulk ingestion complete!`);
  console.log(`✅ Successfully processed: ${successCount} PDFs`);
  if (failCount > 0) console.log(`❌ Failed to process: ${failCount} PDFs`);
  console.log(`======================================================\n`);

  await closeDriver();
  await mongoose.disconnect();
}

bulkIngest().catch(err => {
  console.error('❌ Fatal error during bulk ingestion:', err);
  process.exit(1);
});
