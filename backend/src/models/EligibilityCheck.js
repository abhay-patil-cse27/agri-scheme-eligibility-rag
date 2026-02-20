const mongoose = require('mongoose');

const eligibilityCheckSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FarmerProfile',
      required: true,
      index: true,
    },
    schemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scheme',
      required: true,
    },
    schemeName: {
      type: String,
      required: true,
    },
    eligible: {
      type: Boolean,
      required: true,
    },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    reason: {
      type: String,
      required: true,
    },
    citation: {
      type: String,
      default: '',
    },
    citationSource: {
      page: { type: Number, default: null },
      section: { type: String, default: '' },
      subsection: { type: String, default: '' },
      paragraph: { type: Number, default: null },
    },
    officialWebsite: {
      type: String,
      default: '',
    },
    documentUrl: {
      type: String,
      default: '',
    },
    benefitAmount: {
      type: String,
      default: '',
    },
    paymentFrequency: {
      type: String,
      default: '',
    },
    actionSteps: {
      type: [String],
      default: [],
    },
    rejectionExplanation: {
      criteria: { type: String, default: '' },
      yourProfile: { type: String, default: '' }
    },
    requiredDocuments: {
      type: [String],
      default: [],
    },
    suggestions: [
      {
        schemeName: { type: String },
        eligible: { type: Boolean },
        reason: { type: String },
        benefitAmount: { type: Number },
        matchScore: { type: Number },
        citation: { type: String },
      },
    ],
    responseTime: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching a farmer's eligibility history
eligibilityCheckSchema.index({ farmerId: 1, createdAt: -1 });

module.exports = mongoose.model('EligibilityCheck', eligibilityCheckSchema, 'eligibility_checks');
