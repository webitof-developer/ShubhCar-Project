const Joi = require('joi');

const createCheckoutDraftSchema = Joi.object({
  cartId: Joi.string().trim().optional(),
});

module.exports = {
  createCheckoutDraftSchema,
};
