const dotenv = require("dotenv");
const path = require("path");

// Load .env from backend root
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const requiredVars = ["MONGODB_URI", "GROQ_API_KEY", "JWT_SECRET"];

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
  mongodbUri: process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : undefined,
  groqApiKey: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : undefined,
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY ? process.env.ELEVENLABS_API_KEY.trim() : undefined,
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  embeddingModel: process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2",
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
  rateLimitMaxRequests:
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  logLevel: process.env.LOG_LEVEL || "info",
  neo4jUri: process.env.NEO4J_URI ? process.env.NEO4J_URI.trim() : undefined,
  neo4jUser: process.env.NEO4J_USER ? process.env.NEO4J_USER.trim() : undefined,
  neo4jPassword: process.env.NEO4J_PASSWORD ? process.env.NEO4J_PASSWORD.trim() : undefined,
  jwtSecret: process.env.JWT_SECRET ? process.env.JWT_SECRET.trim() : undefined,
  jwtExpire: process.env.JWT_EXPIRE || "30d",
  googleClientId: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.trim() : undefined,
  neo4jDatabase: process.env.NEO4J_DATABASE || "neo4j",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.trim() : undefined,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ? process.env.TWILIO_AUTH_TOKEN.trim() : undefined,
  twilioWhatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886",
  frontendUrl: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.trim() : "http://localhost:5173",
};
