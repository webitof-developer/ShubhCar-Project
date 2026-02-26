const Joi = require('joi');

const listSettingsQuerySchema = Joi.object({
  group: Joi.string()
    .trim()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .max(50),
});

const updateSettingsSchema = Joi.object()
  .pattern(
    /^[a-zA-Z0-9_]+$/,
    Joi.alternatives().try(
      Joi.string(),
      Joi.number(),
      Joi.boolean(),
      Joi.object(),
      Joi.array(),
      Joi.valid(null),
    ),
  )
  .min(1);

module.exports = {
  listSettingsQuerySchema,
  updateSettingsSchema,
};

