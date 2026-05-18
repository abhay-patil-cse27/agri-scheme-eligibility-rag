const { getSession, closeDriver } = require('../src/config/neo4j');
const logger = require('../src/config/logger');

const categories = [
  { name: 'Income Support', id: 'income_support' },
  { name: 'Crop Insurance', id: 'insurance' },
  { name: 'Agriculture Infrastructure', id: 'infrastructure' },
  { name: 'Irrigation & Energy', id: 'energy' },
  { name: 'Soil & Productivity', id: 'soil' },
  { name: 'Horticulture', id: 'horticulture' },
  { name: 'Agricultural Credit', id: 'credit' },
  { name: 'Livestock & Dairy', id: 'livestock' },
  { name: 'Miscellaneous schemes', id: 'other' }
];

async function seedGraph() {
  const session = getSession();
  try {
    logger.info('Starting Graph seeding...');

    // 1. Create Constraints
    logger.info('Creating constraints...');
    await session.run('CREATE CONSTRAINT IF NOT EXISTS FOR (c:Category) REQUIRE c.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT IF NOT EXISTS FOR (s:Scheme) REQUIRE s.name IS UNIQUE');
    await session.run('CREATE CONSTRAINT IF NOT EXISTS FOR (d:Document) REQUIRE d.path IS UNIQUE');

    // 2. Seed Categories
    logger.info('Seeding categories...');
    for (const cat of categories) {
      console.log('Seeding ', cat.id, '...');
      await session.run(
        'MERGE (c:Category {id: $id}) SET c.name = $name RETURN c',
        cat
      );
      console.log('Finished seeding ', cat.id);
    }
    console.log('Loop finished');

    // 3. Seed Schemes
    logger.info('Seeding schemes...');
    const schemesList = require('../schemes_list.json');
    for (const s of schemesList) {
      await session.run(`
        MERGE (s:Scheme {name: $name})
        SET s.id = $id
        WITH s
        MATCH (c:Category {id: $categoryId})
        MERGE (s)-[:BELONGS_TO]->(c)
      `, {
        name: s.name,
        id: s._id,
        categoryId: s.category
      });
    }

    // 4. Seed Conflict (EXCLUSIVE_OF) Relationships
    logger.info('Seeding EXCLUSIVE_OF conflicts...');
    const conflicts = [
      // Income Support Pension Schemes Conflicts (duplicate enrollment)
      { 
        s1: "PM KMY Salient Features", 
        s2: "PM KMY Operational Guidelines", 
        reason: "Duplicate pension registration: Already registered for Pradhan Mantri Kisan Maandhan Yojana." 
      },
      { 
        s1: "PM KMY Salient Features", 
        s2: "PM KMY FAQs", 
        reason: "Duplicate pension registration: Already registered for Pradhan Mantri Kisan Maandhan Yojana." 
      },
      { 
        s1: "PM KMY Operational Guidelines", 
        s2: "PM KMY FAQs", 
        reason: "Duplicate pension registration: Already registered for Pradhan Mantri Kisan Maandhan Yojana." 
      },
      
      // Self-exclusion
      { 
        s1: "PM KMY Salient Features", 
        s2: "PM KMY Salient Features", 
        reason: "Active Enrollment Conflict: You are already enrolled in this exact scheme." 
      },
      { 
        s1: "PM KMY Operational Guidelines", 
        s2: "PM KMY Operational Guidelines", 
        reason: "Active Enrollment Conflict: You are already enrolled in this exact scheme." 
      },
      { 
        s1: "PM KMY FAQs", 
        s2: "PM KMY FAQs", 
        reason: "Active Enrollment Conflict: You are already enrolled in this exact scheme." 
      },
      
      // Credit KCC Conflicts
      { 
        s1: "Master Circular Kisan Credit Card (KCC) Scheme", 
        s2: "Revised Kisan Credit Card (KCC) Scheme", 
        reason: "Overlapping Credit Limit: Farmers can only hold one active Kisan Credit Card (KCC) account." 
      },
      { 
        s1: "Revised Kisan Credit Card (KCC) Scheme", 
        s2: "Revised Kisan Credit Card (KCC) Scheme", 
        reason: "Active Enrollment Conflict: You already hold an active Kisan Credit Card." 
      },
      { 
        s1: "Master Circular Kisan Credit Card (KCC) Scheme", 
        s2: "Master Circular Kisan Credit Card (KCC) Scheme", 
        reason: "Active Enrollment Conflict: You already hold an active Kisan Credit Card." 
      },
      
      // Crop Insurance Conflicts
      { 
        s1: "Pradhan Mantri Fasal Bima Yojana (PMFBY)", 
        s2: "NAIS SCHEME", 
        reason: "Exclusive Insurance Cover: NAIS has been integrated into PMFBY; dual-coverage for the same crop is prohibited." 
      },
      { 
        s1: "FINAL WBCIS OGs 23.03.2016", 
        s2: "FINAL UPISOGs 23.03.2016", 
        reason: "Duplicate Crop Cover: Mutual exclusion exists between Weather-Based Crop Insurance (WBCIS) and Unified Package Insurance Scheme (UPIS)." 
      }
    ];

    for (const con of conflicts) {
      await session.run(`
        MERGE (s1:Scheme {name: $s1})
        MERGE (s2:Scheme {name: $s2})
        MERGE (s1)-[r:EXCLUSIVE_OF]->(s2)
        SET r.reason = $reason
      `, con);
    }

    logger.info('Graph seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding graph:', error);
    logger.error('Error seeding graph:', error);
  } finally {
    await session.close();
    await closeDriver();
  }
}

seedGraph();
