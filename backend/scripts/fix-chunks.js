require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

async function fixChunks() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Scheme = require('./src/models/Scheme');
  const SchemeChunk = require('./src/models/SchemeChunk');

  const schemes = await Scheme.find({});
  for (let s of schemes) {
    const chunkCount = await SchemeChunk.countDocuments({ schemeId: s._id });
    s.totalChunks = chunkCount;
    await s.save();
    console.log(`Updated ${s.name} to ${chunkCount} chunks`);
  }

  console.log('Fixed chunks!');
  process.exit(0);
}
fixChunks().catch(console.error);
