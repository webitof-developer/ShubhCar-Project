const Joi = require('joi');
const { ADMIN_STATUS_UPDATES } = require('../../constants/orderStatus');

const cancelOrderSchema = Joi.object({
  reason: Joi.string().min(3).required(),
  details: Joi.string().max(500).allow('', null).optional(),
});

const adminStatusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid(...ADMIN_STATUS_UPDATES, 'pending', 'draft', 'pending_payment')
    .required(),
  reason: Joi.when('status', {
    is: 'cancelled',
    then: Joi.string().trim().min(3).max(120).required(),
    otherwise: Joi.string().trim().max(120).allow('', null).optional(),
  }),
  details: Joi.string().trim().max(500).allow('', null).optional(),
});

const adminPaymentUpdateSchema = Joi.object({
  amount: Joi.number().greater(0).required(),
  note: Joi.string().max(500).allow('', null).optional(),
});

const fraudFlagSchema = Joi.object({
  fraudFlag: Joi.boolean().required(),
  fraudReason: Joi.string().max(255).optional(),
});

module.exports = {
  cancelOrderSchema,
  adminStatusUpdateSchema,
  adminPaymentUpdateSchema,
  fraudFlagSchema,
};

