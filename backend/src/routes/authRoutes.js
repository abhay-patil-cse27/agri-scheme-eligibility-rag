const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config/env');
const { protect } = require('../middleware/auth');

// Helper to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign({ id: user._id }, config.jwtSecret || 'supersecretjwtkey', {
    expiresIn: config.jwtExpire || '30d',
  });

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    }
  });
};

/**
 * POST /api/auth/register
 * Register a new farmer
 */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Create user (Force role to farmer, admins must be created manually in DB)
    const user = await User.create({
      name,
      email,
      password,
      role: 'farmer',
    });

    sendTokenResponse(user, 201, res);
  })
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  })
);

/**
 * GET /api/auth/me
 * Get current logged in user
 */
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  })
);

module.exports = router;
