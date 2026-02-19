const mongoose = require('mongoose');

const farmerProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Farmer name is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    landHolding: {
      type: Number,
      required: [true, 'Land holding (acres) is required'],
      min: [0, 'Land holding cannot be negative'],
    },
    landHoldingHectares: {
      type: Number,
      default: 0,
    },
    cropType: {
      type: String,
      required: [true, 'Crop type is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: {
        values: ['General', 'SC', 'ST', 'OBC'],
        message: 'Category must be General, SC, ST, or OBC',
      },
      required: [true, 'Social category is required'],
    },
    annualIncome: {
      type: Number,
      default: null,
    },
    hasIrrigationAccess: {
      type: Boolean,
      default: false,
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

// Auto-calculate hectares from acres before saving (1 acre = 0.404686 hectares)
farmerProfileSchema.pre('save', function (next) {
  if (this.isModified('landHolding')) {
    this.landHoldingHectares = parseFloat((this.landHolding * 0.404686).toFixed(3));
  }
  next();
});

farmerProfileSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.landHolding !== undefined) {
    update.landHoldingHectares = parseFloat((update.landHolding * 0.404686).toFixed(3));
  }
  next();
});

module.exports = mongoose.model('FarmerProfile', farmerProfileSchema, 'farmer_profiles');
