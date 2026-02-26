const Joi = require('joi');
const { ORDER_STATUS_LIST } = require('../../constants/orderStatus');
const { PAYMENT_STATUS } = require('../../constants/paymentStatus');
const { paginationQuerySchema } = require('../../utils/paginationQuery.validator');

const placeOrderSchema = Joi.object({
  paymentMethod: Joi.string().required(),
  gateway: Joi.string()
    .valid('razorpay')
    .when('paymentMethod', { is: 'cod', then: Joi.optional(), otherwise: Joi.required() }),
  shippingAddressId: Joi.string().required(),
  billingAddressId: Joi.string().required(),
  taxPercent: Joi.number().min(0).default(0),
  shippingFee: Joi.number().min(0).default(0),
  commissionPercent: Joi.number().min(0).default(0),
  couponCode: Joi.string().uppercase().optional(),
});

const addressSchema = Joi.object({
  fullName: Joi.string().required(),
  phone: Joi.string().required(),
  line1: Joi.string().required(),
  line2: Joi.string().allow('', null),
  city: Joi.string().required(),
  state: Joi.string().required(),
  postalCode: Joi.string().required(),
  country: Joi.string().default('IN'),
});

const adminCreateOrderSchema = Joi.object({
  userId: Joi.string().required(),
  salesmanId: Joi.string().trim().allow('', null).optional(),
  paymentMethod: Joi.string().valid('cod', 'razorpay').required(),
  paymentCompleted: Joi.boolean().default(false),
  couponCode: Joi.string().uppercase().optional(),
  manualDiscount: Joi.number().min(0).default(0),
  discountPercent: Joi.number().min(0).max(100).default(0),
  shippingFee: Joi.number().min(0).optional(),
  taxPercent: Joi.number().min(0).optional(),
  shippingAddressId: Joi.string().optional(),
  billingAddressId: Joi.string().optional(),
  shippingAddress: addressSchema.when('shippingAddressId', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required(),
  }),
  billingAddress: addressSchema.when('billingSameAsShipping', {
    is: true,
    then: Joi.optional(),
    otherwise: addressSchema.when('billingAddressId', {
      is: Joi.exist(),
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
  }),
  billingSameAsShipping: Joi.boolean().default(false),
  items: Joi.array()
    .min(1)
    .items(
      Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().min(1).required(),
      }),
    )
    .required(),
});

const myOrdersQuerySchema = Joi.object({
  ...paginationQuerySchema,
  status: Joi.string()
    .valid(...ORDER_STATUS_LIST)
    .optional(),
  includeItems: Joi.boolean().default(false),
});

const adminListOrdersQuerySchema = Joi.object({
  ...paginationQuerySchema,
  status: Joi.string()
    .valid(...ORDER_STATUS_LIST)
    .optional(),
  paymentStatus: Joi.string()
    .valid(...Object.values(PAYMENT_STATUS))
    .optional(),
  customerType: Joi.string().trim().optional(),
  productType: Joi.string().trim().optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
  userId: Joi.string().trim().optional(),
  search: Joi.string().trim().max(100).allow('').optional(),
  summary: Joi.boolean().optional(),
});

module.exports = {
  placeOrderSchema,
  adminCreateOrderSchema,
  myOrdersQuerySchema,
  adminListOrdersQuerySchema,
};

