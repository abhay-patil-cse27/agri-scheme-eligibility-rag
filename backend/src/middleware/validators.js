const { body, param, validationResult } = require('express-validator');

/**
 * Middleware to check validation results and return errors.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

/**
 * Validation chain for creating a farmer profile.
 */
const validateProfile = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be under 100 characters'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('district').trim().notEmpty().withMessage('District is required'),
  body('landHolding')
    .isFloat({ min: 0 })
    .withMessage('Land holding must be a positive number (in acres)'),
  body('cropType').trim().notEmpty().withMessage('Crop type is required'),
  body('category')
    .isIn(['General', 'SC', 'ST', 'OBC'])
    .withMessage('Category must be General, SC, ST, or OBC'),
  body('annualIncome')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Annual income must be a positive number'),
  body('hasIrrigationAccess')
    .optional()
    .isBoolean()
    .withMessage('hasIrrigationAccess must be true or false'),
  handleValidationErrors,
];

/**
 * Validation chain for eligibility check requests.
 */
const validateEligibilityCheck = [
  body('profileId')
    .trim()
    .notEmpty()
    .withMessage('profileId is required')
    .isMongoId()
    .withMessage('profileId must be a valid MongoDB ObjectId'),
  body('schemeName')
    .trim()
    .notEmpty()
    .withMessage('schemeName is required')
    .isLength({ max: 200 })
    .withMessage('schemeName must be under 200 characters'),
  handleValidationErrors,
];

/**
 * Validation chain for voice transcript processing.
 */
const validateVoiceTranscript = [
  body('transcript')
    .trim()
    .notEmpty()
    .withMessage('Transcript text is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Transcript must be between 10 and 5000 characters'),
  handleValidationErrors,
];

/**
 * Validate MongoDB ObjectId parameter.
 */
const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors,
];

module.exports = {
  validateProfile,
  validateEligibilityCheck,
  validateVoiceTranscript,
  validateObjectId,
};
