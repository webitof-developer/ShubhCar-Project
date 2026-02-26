const Joi = require('joi');

const stockAdjustSchema = Joi.object({
  delta: Joi.number().integer().required(),
  changeType: Joi.string()
    .valid('increase', 'decrease', 'order', 'cancel', 'admin_adjust')
    .default('admin_adjust'),
  referenceId: Joi.string().allow('', null),
});

const createVariantSchema = Joi.object({
  sku: Joi.string().required(),
  attributes: Joi.object().default({}),  // e.g., { color: 'red', size: 'M' }
  stockQty: Joi.number().integer().min(0).default(0),
  price: Joi.object({
    mrp: Joi.number().positive().required(),
    salePrice: Joi.number().positive().optional(),
  }).optional(),
  weight: Joi.number().positive().optional(),
  dimensions: Joi.object({
    length: Joi.number().positive(),
    width: Joi.number().positive(),
    height: Joi.number().positive(),
  }).optional(),
  isDefault: Joi.boolean().default(false),
}).options({ allowUnknown: false });

const updateVariantSchema = Joi.object({
  sku: Joi.string(),
  attributes: Joi.object(),
  stockQty: Joi.number().integer().min(0),
  price: Joi.object({
    mrp: Joi.number().positive(),
    salePrice: Joi.number().positive(),
  }),
  weight: Joi.number().positive(),
  dimensions: Joi.object({
    length: Joi.number().positive(),
    width: Joi.number().positive(),
    height: Joi.number().positive(),
  }),
  isDefault: Joi.boolean(),
}).options({ allowUnknown: false });

module.exports = { 
  stockAdjustSchema, 
  createVariantSchema,
  updateVariantSchema 
};

