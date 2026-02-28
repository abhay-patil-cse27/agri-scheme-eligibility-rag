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
          <p style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 8px;">Authentication Code Required</p>
          <p style="margin-bottom: 32px; color: #4b5563;">Use the high-security verification code below to authorize <strong>${action}</strong> on the Niti-Setu Portal. This code is unique to your session.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
            <span style="font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #059669; font-family: monospace;">${otp}</span>
          </div>

          <p style="font-size: 14px; color: #9ca3af; line-height: 1.5;">
            <strong>Validity:</strong> 10 Minutes<br/>
            If you did not initiate this request, please disregard this email. Your account remains protected.
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
          <p style="font-size: 20px; font-weight: 700; color: #111827; margin-top: 0;">Welcome to Niti-Setu, ${user.name}</p>
          <p style="margin-bottom: 24px;">We are pleased to confirm that your account has been successfully provisioned. You now have full access to our agricultural intelligence engine, including personalized scheme matching and historical analytics.</p>
          
          <div style="background-color: #059669; color: #ffffff; padding: 16px 24px; border-radius: 8px; display: inline-block; font-weight: 600;">
            Account Verified & Active
          </div>

          <p style="margin-top: 32px; font-size: 15px; color: #64748b;">Visit your dashboard to begin exploring eligible agricultural welfare programs.</p>
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
          <p style="font-size: 18px; font-weight: 700; color: #111827; margin-top: 0;">Identity Notification: Profile Updated</p>
          <p style="margin-bottom: 16px;">Hello, ${user.name}. This is a professional notification to confirm that your profile attributes (Name/Email) have been successfully modified on the Niti-Setu platform.</p>
          
          <p style="font-size: 14px; padding: 12px; background-color: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b;">
            <strong>Immediate Action:</strong> If you did not authorize this modification, please contact our security team immediately to prevent unauthorized access.
          </p>
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
          <p style="font-size: 18px; font-weight: 700; color: #111827; margin-top: 0;">Identity Security: Password Modification</p>
          <p style="margin-bottom: 16px;">Hello, ${user.name}. We are writing to confirm that the security credentials (password) for your Niti-Setu account were recently updated.</p>
          
          <p style="font-size: 14px; padding: 12px; background-color: #fef2f2; border-left: 4px solid #ef4444; color: #991b1b;">
            <strong>Security Warning:</strong> High-risk activity detected. If this credential update was not performed by you, your account security may be compromised. Take immediate action to secure your portal access.
          </p>
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
