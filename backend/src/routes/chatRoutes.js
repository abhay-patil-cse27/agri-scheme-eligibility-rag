const express = require('express');
const router = express.Router();
const { chatWithKrishiMitra } = require('../services/llmService');
const { protect } = require('../middleware/auth');
const logger = require('../config/logger');

/**
 * @route   POST /api/chat
 * @desc    Chat with Krishi Mitra AI Assistant
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { query, history, language } = req.body;
    const profile = req.user.profile || {};

    if (!query) {
      return res.status(400).json({ message: 'Query is required' });
    }

    const response = await chatWithKrishiMitra(query, history, profile, language || 'en');

    res.json({ response });
  } catch (error) {
    logger.error('Chat API Error:', error.message);
    res.status(500).json({ 
      message: 'Failed to chat with Krishi Mitra',
      error: error.message 
    });
  }
});

module.exports = router;
