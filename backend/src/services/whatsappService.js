const twilio = require('twilio');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { transcribeAudio, chatWithKrishiMitra } = require('./llmService');
const logger = require('../config/logger');
const FarmerProfile = require('../models/FarmerProfile');

// Twilio credentials from ENV
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Default Twilio Sandbox number

// Initialize Twilio client only if credentials are provided
let client;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

/**
 * Main handler for incoming WhatsApp messages (text or voice)
 */
const handleIncomingMessage = async (payload) => {
  const from = payload.From; // format: whatsapp:+91xxxxxxxxxx
  const body = payload.Body;
  const mediaUrl = payload.MediaUrl0;
  const mediaType = payload.MediaContentType0;

  try {
    let userMessage = body;
    
    // 1. Handle Voice Note
    if (mediaUrl && mediaType && mediaType.startsWith('audio/')) {
      logger.info(`Processing WhatsApp voice note from ${from}`);
      const tempPath = path.join(os.tmpdir(), `whatsapp_voice_${Date.now()}.ogg`);
      
      const response = await axios({
        method: 'get',
        url: mediaUrl,
        responseType: 'stream',
        auth: { username: accountSid, password: authToken }
      });

      const writer = fs.createWriteStream(tempPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Transcribe the voice note
      // We assume Marathi as default for hyper-local focus, or let Whisper detect
      userMessage = await transcribeAudio(tempPath, 'mr'); 
      logger.info(`WhatsApp Voice Transcribed: "${userMessage}"`);
      
      // Cleanup
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }

    if (!userMessage || userMessage.trim() === "") {
        if (mediaUrl) {
             await sendWhatsAppMessage(from, "I couldn't hear the audio clearly. Could you please try again or type your question?");
        }
        return;
    }

    // 2. Identify Farmer Profile by Contact Number
    const contactNumber = from.replace('whatsapp:', '');
    const profile = await FarmerProfile.findOne({ contactNumber }).lean();
    
    // 3. Generate AI Response using Krishi Mitra Engine
    // We pass the profile (if exists) for dialect-tuned responses
    const aiResponse = await chatWithKrishiMitra(userMessage, [], profile || null);
    
    // 4. Send Response Back to User
    await sendWhatsAppMessage(from, aiResponse.text);

  } catch (error) {
    logger.error('WhatsApp Service Error:', error);
    await sendWhatsAppMessage(from, "I'm having some trouble processing your message right now, Brother. Please try again later.");
  }
};

/**
 * Send a WhatsApp message via Twilio API
 */
const sendWhatsAppMessage = async (to, text) => {
  if (!client) {
    logger.warn('Twilio client not initialized. Cannot send WhatsApp message.');
    return;
  }

  try {
    await client.messages.create({
      from: whatsappFrom,
      to: to,
      body: text
    });
    logger.info(`WhatsApp reply sent to ${to}`);
  } catch (error) {
    logger.error('Failed to send WhatsApp message:', error);
  }
};

module.exports = {
  handleIncomingMessage,
  sendWhatsAppMessage
};
