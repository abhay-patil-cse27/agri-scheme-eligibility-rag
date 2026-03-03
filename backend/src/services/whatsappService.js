const twilio = require('twilio');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config/env');
const { transcribeAudio, chatWithKrishiMitra } = require('./llmService');
const logger = require('../config/logger');
const FarmerProfile = require('../models/FarmerProfile');

// Twilio credentials from Config
const accountSid = config.twilioAccountSid;
const authToken = config.twilioAuthToken;
const whatsappFrom = config.twilioWhatsappNumber;

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

    // 2. Identify Unique User by Contact Number
    // We search the FarmerProfile which is linked to a Unique User account
    const contactNumber = from.replace('whatsapp:', '');
    const profile = await FarmerProfile.findOne({ contactNumber }).lean();
    
    // 3. Handle Guest Mode Logic (Uniqueness Enforcement)
    if (!profile) {
      // User is not in our system. We enforce uniqueness in the Database via 'unique: true' indexes 
      // on Email and contactNumber in the User Schema.
      const guestContext = `[ADMIN NOTE: 
      - This user is NOT registered. 
      - IMPORTANT: Start your message by politely mentioning: "We have noticed that you are not registered with Niti Setu yet! 🌾"
      - Their phone number ${contactNumber} does not exist in our database.
      - Remind them that registration requires a UNIQUE Email and Phone Number for security.
      - Provide a warm welcome, brief answer, and follow the GUEST HANDLING rules to invite registration at ${process.env.FRONTEND_URL || 'nitisetu.vercel.app/register'} to unlock personalized benefits.]`;
      
      const aiResponse = await chatWithKrishiMitra(userMessage, [], null, 'en', 'guest', guestContext);
      await sendWhatsAppMessage(from, aiResponse);
      return;
    }

    // 4. Generate AI Response for Registered Users (Personalized Options)
    const registeredOptions = `
    - View your *Eligibility History* 📊
    - Check new *Schemes* 📂
    - Update your *Farmer Profile* 🚜
    - Ask about *Weather or Market Prices* 🌦️
    `;

    const registeredContext = `[ADMIN NOTE: 
    - This is a VERIFIED unique user (ID: ${profile.userId}). 
    - Address them as *${profile.name}*. 
    - Since they are registered, offer them these premium options: ${registeredOptions}
    - Remind them they can use 'Voice Input' in the app for faster profile updates.]`;
    
    const aiResponse = await chatWithKrishiMitra(userMessage, [], profile, 'en', 'registered', registeredContext);
    
    // 5. Send Response Back to User
    await sendWhatsAppMessage(from, aiResponse);

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
