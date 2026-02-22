const neo4j = require('neo4j-driver');
const logger = require('./logger');
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USER;
const password = process.env.NEO4J_PASSWORD;

let driver;

try {
  if (uri && user && password) {
    driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    logger.info('Neo4j Driver initialized');
  } else {
    logger.warn('Neo4j credentials missing in environment variables');
  }
} catch (error) {
  logger.error('Failed to create Neo4j driver:', error);
}

const getSession = (database = process.env.NEO4J_DATABASE || 'neo4j') => {
  if (!driver) {
    throw new Error('Neo4j driver not initialized. Please check your credentials.');
  }
  return driver.session({ database });
};

const closeDriver = async () => {
  if (driver) {
    await driver.close();
    logger.info('Neo4j connection closed');
  }
};

module.exports = {
  driver,
  getSession,
  closeDriver,
};
