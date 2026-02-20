const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Scheme = require('./src/models/Scheme');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/niti-setu';

const urls = {
  'PM-KISAN': 'https://pmkisan.gov.in',
  'PM-KMY': 'https://maandhan.in/',
  'PM-KUSUM': 'https://pmkusum.mnre.gov.in/',
  'Agri-Infrastructure-Fund': 'https://agriinfra.dac.gov.in/'
};

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const [name, url] of Object.entries(urls)) {
      const res = await Scheme.updateOne({ name }, { $set: { officialWebsite: url } });
      console.log(`Updated ${name}: -> ${url} (Modified: ${res.modifiedCount})`);
    }

    console.log('Done mapping official websites.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

run();
