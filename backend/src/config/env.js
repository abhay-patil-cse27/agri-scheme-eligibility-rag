const dotenv = require("dotenv");
const path = require("path");

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const requiredVars = ["MONGODB_URI", "GROQ_API_KEY"];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`FATAL: Missing required environment variable: ${varName}`);
    console.error("Copy .env.example to .env and fill in your values.");
    process.exit(1);
  }
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongodbUri: process.env.MONGODB_URI,
  groqApiKey: process.env.GROQ_API_KEY,
  groqApiKeyBackup1: process.env.GROQ_API_KEY_BACKUP1,
  groqApiKeyBackup2: process.env.GROQ_API_KEY_BACKUP2,
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  embeddingModel: process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2",
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  rateLimitMaxRequests:
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  logLevel: process.env.LOG_LEVEL || "info",
};
