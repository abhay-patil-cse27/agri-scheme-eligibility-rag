require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const { getSession, closeDriver } = require('../src/config/neo4j');

async function clearData() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  const Scheme = require('../src/models/Scheme');
  const SchemeChunk = require('../src/models/SchemeChunk');

  console.log('Clearing MongoDB Scheme and SchemeChunk collections...');
  const deletedChunks = await SchemeChunk.deleteMany({});
  const deletedSchemes = await Scheme.deleteMany({});
  console.log(`✅ MongoDB Cleared: Deleted ${deletedSchemes.deletedCount} Schemes and ${deletedChunks.deletedCount} Chunks.`);

  console.log('Connecting to Neo4j...');
  const session = getSession();
  try {
    console.log('Clearing Neo4j Scheme, Document, and Chunk nodes...');
    // Delete Document and Chunk nodes
    await session.run('MATCH (n) WHERE labels(n) IN ["Document", "Chunk"] DETACH DELETE n');
    // Delete Scheme nodes
    await session.run('MATCH (s:Scheme) DETACH DELETE s');
    console.log('✅ Neo4j Cleared: Deleted all Scheme, Document, and Chunk nodes. Categories preserved.');
  } catch (error) {
    console.error('❌ Error clearing Neo4j:', error);
  } finally {
    await session.close();
    await closeDriver();
  }

  console.log('Disconnecting from MongoDB...');
  await mongoose.disconnect();
  console.log('✅ Disconnected from MongoDB. Clean slate ready.');
}

clearData().catch(err => {
  console.error('❌ Data clearing failed:', err.message);
  process.exit(1);
});
