const { getSession, closeDriver } = require('../src/config/neo4j');
const logger = require('../src/config/logger');

const categories = [
  { name: 'Income Support', id: 'income_support' },
  { name: 'Crop Insurance', id: 'insurance' },
  { name: 'Irrigation & Energy', id: 'irrigation' },
  { name: 'Soil & Productivity', id: 'soil' },
  { name: 'Horticulture', id: 'horticulture' },
  { name: 'Agricultural Credit', id: 'credit' },
  { name: 'Livestock & Dairy', id: 'livestock' },
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
      await session.run(
        'MERGE (c:Category {id: $id}) SET c.name = $name RETURN c',
        cat
      );
    }

    logger.info('Graph seeding completed successfully.');
  } catch (error) {
    logger.error('Error seeding graph:', error);
  } finally {
    await session.close();
    await closeDriver();
  }
}

seedGraph();
