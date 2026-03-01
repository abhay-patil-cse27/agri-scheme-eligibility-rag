const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config/env');
const { protect, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/send-otp
 * Generate and send OTP for registration or password reset
 */
router.post(
  '/send-otp',
  asyncHandler(async (req, res) => {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({ success: false, error: 'Please provide email and purpose' });
    }

    // If purpose is registration, check if user already exists
    if (purpose === 'registration') {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'An account with this email already exists. Please log in instead.' });
      }
    }

    // If purpose is password reset, check if user exists
    if (purpose === 'password_reset') {
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        return res.status(404).json({ success: false, error: 'No account found with this email address. Please register first.' });
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save/Update OTP in DB
    await OTP.findOneAndUpdate(
      { email, purpose },
      { otp, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    // Send Email
    try {
      const subject = purpose === 'registration' ? 'Verification Code for Registration' : 'Password Reset Code';
      const action = purpose === 'registration' ? 'your account registration' : 'resetting your password';
      
      await sendEmail({
        email,
        subject,
        html: `
          <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 16px;">Action Required: Verification Code</h2>
          <p style="margin: 0 0 32px; color: #475569; font-size: 16px;">To proceed with <strong>${action}</strong> on the Niti-Setu portal, please use the secure 6-digit verification code provided below. This code is unique to your current request.</p>
          
          <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 20px; padding: 40px; text-align: center; margin-bottom: 32px;">
            <div style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Your Secure Code</div>
            <div style="font-size: 48px; font-weight: 800; letter-spacing: 16px; color: #166534; font-family: 'Courier New', Courier, monospace; margin-left: 16px;">${otp}</div>
          </div>

          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 32px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Security Protocol:</strong> This code is valid for 10 minutes. Do not share this code with anyone. Niti-Setu representatives will never ask for your code via phone or chat.
            </p>
          </div>

          <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
            If you did not initiate this request, no further action is required. Your account remains secure.
          </p>
        `
      });

      res.status(200).json({ success: true, message: 'OTP sent to email' });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, error: 'Email could not be sent' });
    }
  })
);

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
 * Register a new farmer with OTP
 */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, otp } = req.body;

    // Verify OTP
    const otpRecord = await OTP.findOne({ email, otp, purpose: 'registration' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Create user (Force role to farmer, admins must be created manually in DB)
    const user = await User.create({
      name,
      email,
      password,
      role: 'farmer',
    });

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Send Welcome Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to Niti-Setu',
        html: `
          <h2 style="color: #0f172a; font-size: 26px; font-weight: 800; margin: 0 0 16px;">Welcome to the Future of Farming, ${user.name.split(' ')[0]}!</h2>
          <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">We are thrilled to confirm that your account has been successfully provisioned. You now have full access to Niti-Setu — your AI-powered companion for agricultural intelligence.</p>
          
          <div style="background-color: #ecfdf5; border: 1px solid #b7e4c7; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
            <p style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 0.05em;">Your Access Highlights:</p>
            <ul style="margin: 0; padding: 0 0 0 20px; color: #064e3b; font-size: 15px; line-height: 1.8;">
              <li>Personalized Government Scheme Matching</li>
              <li>Real-time Agricultural AI Assistance (Krishi Mitra)</li>
              <li>Mobile-first Document Management</li>
              <li>Historical Analytics and Performance Insights</li>
            </ul>
          </div>

          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="background-color: #166534; color: #ffffff; padding: 16px 32px; border-radius: 12px; display: inline-block; font-weight: 700; text-decoration: none; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">Explore Your Dashboard</a>
          </div>

          <p style="margin: 0; font-size: 15px; color: #64748b;">Our mission is to bridge the gap between farmers and government opportunities through state-of-the-art technology. We're glad to have you with us.</p>
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
          <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 16px;">Security Alert: Profile Update</h2>
          <p style="margin: 0 0 24px; color: #475569; font-size: 16px;">Hello, ${user.name}. This is an automated security notification to inform you that several attributes of your Niti-Setu profile (Name/Email) have been modified.</p>
          
          <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #9f1239; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Suspicious Activity?</p>
            <p style="margin: 0; font-size: 15px; color: #b91c1c; line-height: 1.5;">
              If you did not authorize this change, your account security may be at risk. Please contact our security operations center immediately or reset your credentials.
            </p>
          </div>
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
          <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 16px;">Security Alert: Password Changed</h2>
          <p style="margin: 0 0 24px; color: #475569; font-size: 16px;">Hello, ${user.name}. We are writing to confirm that the security credentials (password) for your Niti-Setu account were successfully changed.</p>
          
          <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #9f1239; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Critical Alert</p>
            <p style="margin: 0; font-size: 15px; color: #b91c1c; line-height: 1.5;">
              This is a high-priority security event. If this password reset was not performed by you, please take immediate steps to secure your account.
            </p>
          </div>
        `
      });
    } catch (err) {
      console.error('Password update email could not be sent', err);
    }

    sendTokenResponse(user, 200, res);
  })
);


/**
 * PUT /api/auth/resetpassword
 * Reset password with OTP
 */
router.put(
  '/resetpassword',
  asyncHandler(async (req, res) => {
    const { email, otp, password } = req.body;

    // Verify OTP
    const otpRecord = await OTP.findOne({ email, otp, purpose: 'password_reset' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Set new password
    user.password = password;
    await user.save();

    // Delete OTP
    await OTP.deleteOne({ _id: otpRecord._id });

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

/**
 * DELETE /api/auth/users/:id
 * Delete a user account (Admin only)
 */
router.delete(
  '/users/:id',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Prevent admin from deleting themselves (safety)
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own admin account' });
    }

    await user.deleteOne();

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  })
);

module.exports = router;
