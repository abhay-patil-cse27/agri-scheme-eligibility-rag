const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Scheme name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['income_support', 'infrastructure', 'energy', 'insurance', 'credit', 'other'],
      default: 'other',
    },
    benefits: {
      amount: { type: Number, default: 0 },
      frequency: { type: String, default: 'One-time' },
      description: { type: String, default: '' },
    },
    criteria: {
      maxLandHectares: { type: Number, default: null },
      minLandHectares: { type: Number, default: null },
      applicableStates: { type: [String], default: ['All'] },
      applicableCategories: { type: [String], default: ['All'] },
      applicableCrops: { type: [String], default: ['All'] },
    },
    sourceFile: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      default: '1.0',
    },
    totalChunks: {
      type: Number,
      default: 0,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Scheme', schemeSchema);
