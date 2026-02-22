const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const EligibilityCheck = require('../models/EligibilityCheck');
const FarmerProfile = require('../models/FarmerProfile');
const Scheme = require('../models/Scheme');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/analytics
 * Returns comprehensive aggregated data for the admin dashboard.
 */
router.get(
  '/',
  protect,
  authorize('admin', 'farmer'),
  asyncHandler(async (req, res) => {
    // 1. Overall Stats
    const totalSchemes = await Scheme.countDocuments();
    const totalProfiles = await FarmerProfile.countDocuments();
    const totalChecks = await EligibilityCheck.countDocuments();

    // 2. Eligibility Split (Eligible vs Not Eligible)
    const eligibilitySplit = await EligibilityCheck.aggregate([
      {
        $group: {
          _id: '$eligible',
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedSplit = {
      eligible: 0,
      notEligible: 0,
    };
    eligibilitySplit.forEach((item) => {
      if (item._id === true) formattedSplit.eligible = item.count;
      else if (item._id === false) formattedSplit.notEligible = item.count;
    });

    // 3. Top Matched Schemes
    const topSchemes = await EligibilityCheck.aggregate([
      { $match: { eligible: true } },
      {
        $group: {
          _id: '$schemeName',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // 4. Checks Over Time (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const checksOverTime = await EligibilityCheck.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 5. Demographic Breakdown by State (Total Profiles)
    const profilesByState = await FarmerProfile.aggregate([
      {
        $group: {
          _id: '$state',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 7 }, // Top 7 states
    ]);

    res.json({
      success: true,
      data: {
        rawStats: {
          totalSchemes,
          totalProfiles,
          totalChecks,
        },
        eligibilitySplit: formattedSplit,
        topSchemes,
        checksOverTime,
        profilesByState,
      },
    });
  })
);

/**
 * GET /api/analytics/logs
 * Returns the latest 50 audit logs.
 */
router.get(
  '/logs',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      data: logs,
    });
  })
);

/**
 * GET /api/analytics/system-health
 * Returns metrics on system performance and caching.
 */
router.get(
  '/system-health',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    // Calculate cache hit rate roughly from EligibilityCheck history
    const totalChecks = await EligibilityCheck.countDocuments();
    const cachedChecks = await EligibilityCheck.countDocuments({ isCached: true }); // We added this field earlier in eligibilityRoutes.js

    // Average response time
    const avgResponse = await EligibilityCheck.aggregate([
      { $match: { responseTime: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$responseTime' } } }
    ]);

    res.json({
      success: true,
      data: {
        cacheHitRate: totalChecks > 0 ? (cachedChecks / totalChecks) * 100 : 0,
        avgAiResponseTime: avgResponse.length > 0 ? avgResponse[0].avg : 0,
        activeConnections: mongoose.connection.states[mongoose.connection.readyState]
      },
    });
  })
);

module.exports = router;
