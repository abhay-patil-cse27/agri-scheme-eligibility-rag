const express = require('express');
const router = express.Router();

const FarmerProfile = require('../models/FarmerProfile');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateProfile, validateObjectId } = require('../middleware/validators');

/**
 * POST /api/profiles
 * Create a new farmer profile with validation.
 */
router.post(
  '/',
  validateProfile,
  asyncHandler(async (req, res) => {
    const profileData = {
      name: req.body.name,
      state: req.body.state,
      district: req.body.district,
      landHolding: req.body.landHolding,
      cropType: req.body.cropType,
      category: req.body.category,
      annualIncome: req.body.annualIncome || null,
      hasIrrigationAccess: req.body.hasIrrigationAccess || false,
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
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [profiles, total] = await Promise.all([
      FarmerProfile.find({ isActive: true })
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FarmerProfile.countDocuments({ isActive: true }),
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
  validateObjectId,
  asyncHandler(async (req, res) => {
    const profile = await FarmerProfile.findById(req.params.id).select('-__v').lean();

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
  validateObjectId,
  asyncHandler(async (req, res) => {
    const allowedFields = [
      'name', 'state', 'district', 'landHolding',
      'cropType', 'category', 'annualIncome', 'hasIrrigationAccess',
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const profile = await FarmerProfile.findOneAndUpdate(
      { _id: req.params.id },
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    res.json({ success: true, data: profile });
  })
);

module.exports = router;
