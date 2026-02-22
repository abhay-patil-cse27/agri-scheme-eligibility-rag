const express = require('express');
const router = express.Router();

const FarmerProfile = require('../models/FarmerProfile');
const EligibilityCheck = require('../models/EligibilityCheck');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateProfile, validateObjectId } = require('../middleware/validators');
const { protect, authorize } = require('../middleware/auth');

/**
 * POST /api/profiles
 * Create a new farmer profile with validation.
 */
router.post(
  '/',
  protect,
  validateProfile,
  asyncHandler(async (req, res) => {
    const profileData = {
      name: req.body.name,
      age: req.body.age,
      state: req.body.state,
      district: req.body.district,
      landHolding: req.body.landHolding,
      cropType: req.body.cropType,
      category: req.body.category,
      annualIncome: req.body.annualIncome || null,
      hasIrrigationAccess: req.body.hasIrrigationAccess || false,
      gender: req.body.gender,
      hasBPLCard: req.body.hasBPLCard || false,
      ownershipType: req.body.ownershipType,
      hasKcc: req.body.hasKcc || false,
      isDifferentlyAbled: req.body.isDifferentlyAbled || false,
      hasAadharSeededBank: req.body.hasAadharSeededBank || false,
      userId: req.user.id,
    };

    const profile = await FarmerProfile.create(profileData);

    res.status(201).json({
      success: true,
      data: profile,
    });
  })
);

/**
 * GET /api/profiles
 * List all active farmer profiles.
 */
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { isActive: true };
    if (req.user.role === 'farmer') {
      query.userId = req.user.id;
    }

    const [profiles, total] = await Promise.all([
      FarmerProfile.find(query)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FarmerProfile.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: profiles.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: profiles,
    });
  })
);

/**
 * GET /api/profiles/:id
 * Get a single farmer profile.
 */
router.get(
  '/:id',
  protect,
  validateObjectId,
  asyncHandler(async (req, res) => {
    const query = { _id: req.params.id };
    if (req.user.role === 'farmer') {
      query.userId = req.user.id;
    }
    const profile = await FarmerProfile.findOne(query).select('-__v').lean();

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    res.json({ success: true, data: profile });
  })
);

/**
 * PUT /api/profiles/:id
 * Update a farmer profile.
 */
router.put(
  '/:id',
  protect,
  validateObjectId,
  asyncHandler(async (req, res) => {
    const allowedFields = [
      'name', 'age', 'state', 'district', 'landHolding',
      'cropType', 'category', 'annualIncome', 'hasIrrigationAccess',
      'gender', 'hasBPLCard', 'ownershipType', 'hasKcc', 'isDifferentlyAbled', 'hasAadharSeededBank'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const query = { _id: req.params.id };
    if (req.user.role === 'farmer') {
      query.userId = req.user.id;
    }

    const profile = await FarmerProfile.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    res.json({ success: true, data: profile });
  })
);

/**
 * DELETE /api/profiles/:id
 * Delete a farmer profile and all associated eligibility checks.
 */
router.delete(
  '/:id',
  protect,
  validateObjectId,
  asyncHandler(async (req, res) => {
    const profile = await FarmerProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    if (req.user.role === 'farmer' && profile.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this profile' });
    }

    // Delete associated eligibility checks first
    await EligibilityCheck.deleteMany({ farmerId: req.params.id });
    
    // Delete the profile
    await FarmerProfile.findByIdAndDelete(req.params.id);

    res.json({ success: true, data: { message: 'Profile and history deleted successfully' } });
  })
);

module.exports = router;
