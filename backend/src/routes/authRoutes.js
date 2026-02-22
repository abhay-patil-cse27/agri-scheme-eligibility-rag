const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config/env');
const { protect, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
      activeSchemes: user.activeSchemes,
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

    // Send Welcome Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to Niti-Setu',
        html: `
          <h2 style="color: #1f2937; margin-top: 0;">Welcome, ${user.name}!</h2>
          <p style="font-size: 16px; line-height: 1.5;">Your account has been successfully created. You can now log in to the Niti-Setu engine to check your agricultural scheme eligibility, save your history, and manage your profile.</p>
          <p style="font-size: 16px; line-height: 1.5;">Thank you for joining.</p>
        `
      });
    } catch (err) {
      console.error('Welcome email could not be sent', err);
    }

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

/**
 * PUT /api/auth/updatedetails
 * Update user details (Name, Email)
 */
router.put(
  '/updatedetails',
  protect,
  asyncHandler(async (req, res) => {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      activeSchemes: req.body.activeSchemes,
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    try {
      await sendEmail({
        email: user.email,
        subject: 'Security Alert: Profile Updated',
        html: `
          <h2 style="color: #1f2937; margin-top: 0;">Hello, ${user.name}</h2>
          <p style="font-size: 16px; line-height: 1.5;">Your Niti-Setu profile details (Name/Email) have been successfully updated.</p>
          <p style="font-size: 16px; line-height: 1.5;">If you did not make this change, please contact an administrator immediately.</p>
        `
      });
    } catch (err) {
      console.error('Profile update email could not be sent', err);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  })
);

/**
 * PUT /api/auth/updatepassword
 * Update password
 */
router.put(
  '/updatepassword',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = req.body.newPassword;
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'Security Alert: Password Changed',
        html: `
          <h2 style="color: #1f2937; margin-top: 0;">Hello, ${user.name}</h2>
          <p style="font-size: 16px; line-height: 1.5;">Your Niti-Setu account password was just changed successfully.</p>
          <p style="font-size: 16px; line-height: 1.5; color: #dc2626; font-weight: bold;">If you did not make this change, please contact an administrator immediately as your account may be compromised.</p>
        `
      });
    } catch (err) {
      console.error('Password update email could not be sent', err);
    }

    sendTokenResponse(user, 200, res);
  })
);

/**
 * POST /api/auth/forgotpassword
 * Forgot password
 */
router.post(
  '/forgotpassword',
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ success: false, error: 'There is no user with that email' });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    // Generate Reset URL
    const resetUrl = `http://localhost:5173/resetpassword/${resetToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        html: `
          <h2 style="color: #1f2937; margin-top: 0;">Password Reset</h2>
          <p style="font-size: 16px; line-height: 1.5;">You requested a password reset for your Niti-Setu account. Please click the secure button below to choose a new password.</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; margin: 16px 0; font-size: 16px; color: #ffffff; background-color: #4f46e5; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
          <p style="font-size: 14px; color: #6b7280; margin-top: 16px;">This link will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        `
      });

      res.status(200).json({
        success: true,
        data: 'Email sent'
      });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ success: false, error: 'Email could not be sent' });
    }
  })
);

/**
 * PUT /api/auth/resetpassword/:resettoken
 * Reset password
 */
router.put(
  '/resetpassword/:resettoken',
  asyncHandler(async (req, res) => {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  })
);

/**
 * POST /api/auth/google
 * Authenticate with Google OAuth ID Token
 */
router.post(
  '/google',
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    
    // Verify the Google ID Token
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,  
    });
    
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // If user doesn't exist, create a new Farmer account seamlessly
      // We generate a secure random password since they use Google
      const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!'; // ensure it passes the regex
      user = await User.create({
        name: name,
        email: email,
        password: randomPassword,
        role: 'farmer'
      });
    }
    
    // Send standard JWT
    sendTokenResponse(user, 200, res);
  })
);

/**
 * GET /api/auth/users
 * Get all registered users (Admin only)
 */
router.get(
  '/users',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password').sort('-createdAt');
    res.status(200).json({ success: true, data: users });
  })
);

module.exports = router;
