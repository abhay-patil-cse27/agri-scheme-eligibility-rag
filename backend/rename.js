require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

async function rename() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Scheme = require('./src/models/Scheme');
  const SchemeChunk = require('./src/models/SchemeChunk');

  const names = {
    'cpd guidelines new': 'MIDH - CPD Guidelines',
    'midhGuidelines midh(English)': 'MIDH - Guidelines (English)',
    'Operational Manual MIDH SURAKSHA': 'MIDH - SURAKSHA Operational Manual',
    'PM KMY FAQs': 'PM-KMY - FAQs',
    'PM KMY Operational Guidelines': 'PM-KMY - Operational Guidelines',
    'PM KMY Salient Features': 'PM-KMY - Salient Features',
    'Master Circular Kisan Credit Card (KCC) Scheme': 'KCC - Master Circular',
    'Revised Kisan Credit Card (KCC) Scheme': 'KCC - Revised Scheme',
    'Scheme to cover term loans for agriculture & allied activities under KCC': 'KCC - Term Loans for Agriculture',
    'Guidelines for Implementation of New Scheme PMKUSUSM': 'PM-KUSUM - New Implementation Guidelines',
    'PM KUSUM Guidelines': 'PM-KUSUM - General Guidelines',
    'PM’s VISION for Farmers Harvesting Solar Enegy': 'PM-KUSUM - Farmers Harvesting Solar Energy',
    'aws gui cre': 'PMFBY - AWS Guidelines',
    'FINAL UPISOGs 23.03.2016': 'PMFBY - UPIS Guidelines',
    'FINAL WBCIS OGs 23.03.2016': 'RWBCIS - WBCIS Guidelines',
    'NAIS SCHEME': 'PMFBY - NAIS Scheme',
    'New Schemes english': 'PMFBY - New Schemes (English)',
    'operational guidelines pmfby': 'PMFBY - Operational Guidelines',
    'PMFBY Features': 'PMFBY - Features',
    'Revamped Operational Guidelines 17th August 2020': 'PMFBY - Revamped Guidelines 2020',
    'RWBCIS Revised Guidelines 1': 'RWBCIS - Revised Guidelines',
    'NLMOperationalGuidelines': 'NLM - Operational Guidelines',
    'RevisedSOProcedureforReleaseofCapitalSubsidyvidenotificationdated': 'NLM - Subsidy Release Procedure',
    'SoP NLM EDP': 'NLM - SoP EDP',
    'mksp agriculture guidelines': 'MKSP - Agriculture Guidelines',
    'MKSP NTFP Guidelines approved version': 'MKSP - NTFP Guidelines',
    'Circular Of Implementation Of Soil Health Card': 'SHC - Implementation Circular',
    'Citizen Charter for Soil Testing and Issue of Soil Health Card': 'SHC - Soil Testing Citizen Charter',
    'Implementation of Soil Health Card (SHC) Scheme': 'SHC - Implementation Scheme',
    'List of mini soil labs': 'SHC - Minilabs List',
    'National Mission for Sustainable Agriculture (NMSA) Operational Guidelines': 'NMSA - Operational Guidelines',
    'Soil Health & Fertility Scheme under Rashtriya Krishi Vikas Yojana(RKVY)': 'RKVY - Soil Health & Fertility Scheme'
  };

  const schemes = await Scheme.find({});
  for (let s of schemes) {
    if (names[s.name.trim()]) {
      const oldName = s.name;
      const newName = names[s.name.trim()];
      s.name = newName;
      await s.save();
      
      // Update chunks
      const r = await SchemeChunk.updateMany({ schemeId: s._id }, { $set: { schemeName: newName } });
      console.log(`Renamed: ${oldName} -> ${newName} (${r.modifiedCount} chunks)`);
    } else {
      console.log(`Skipped: ${s.name} (Not in map)`);
    }
  }

  // Update neo4j
  const neo4jConfig = require('./src/config/neo4j');
  const session = neo4jConfig.getSession();
  for (const [oldName, newName] of Object.entries(names)) {
    try {
      await session.run('MATCH (s:Scheme {name: $oldName}) SET s.name = $newName', { oldName, newName });
    } catch (e) {
      console.error(e);
    }
  }
  await session.close();
  await neo4jConfig.closeDriver();

  console.log('Done renaming!');
  process.exit(0);
}

rename().catch(console.error);
