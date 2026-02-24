// Export individual handlers to be mounted with gateway-specific body parsing.
const controller = require('./webhooks.controller');
const asyncHandler = require('../../utils/asyncHandler');

module.exports = {
  stripe: asyncHandler(controller.stripe.bind(controller)),
  razorpay: asyncHandler(controller.razorpay.bind(controller)),
};
