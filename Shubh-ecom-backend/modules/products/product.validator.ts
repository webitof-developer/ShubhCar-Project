const Joi = require('joi');
const { paginationQuerySchema } = require('../../utils/paginationQuery.validator');

const priceSchema = Joi.object({
  mrp: Joi.number().positive().required(),
  salePrice: Joi.number().positive().optional(),
});

const imageSchema = Joi.object({
  url: Joi.string().uri().required(),
  altText: Joi.string().allow('', null),
});

exports.createProductSchema = Joi.object({
  name: Joi.string().trim().min(3).required(),
  slug: Joi.string().lowercase().trim(),
  categoryId: Joi.string().required(),
  productCode: Joi.string().trim().allow('', null),

  retailPrice: priceSchema.required(),
  wholesalePrice: priceSchema.optional(),

  minOrderQty: Joi.number().min(1).default(1),
  maxOrderQty: Joi.number().min(1).optional(),
  minWholesaleQty: Joi.number().min(1).optional(),

  shortDescription: Joi.string().allow('', null),
  longDescription: Joi.string().allow('', null),

  sku: Joi.string().allow('', null),
  hsnCode: Joi.string().allow('', null),
  productType: Joi.string().valid('OEM', 'AFTERMARKET').required(),
  vehicleBrand: Joi.string().trim().when('productType', {
    is: 'OEM',
    then: Joi.required(),
    otherwise: Joi.optional().allow('', null),
  }),
  oemNumber: Joi.string().trim().when('productType', {
    is: 'OEM',
    then: Joi.required(),
    otherwise: Joi.optional().allow('', null),
  }),
  manufacturerBrand: Joi.string().trim().when('productType', {
    is: 'AFTERMARKET',
    then: Joi.required(),
    otherwise: Joi.optional().allow('', null),
  }),
  returnPolicy: Joi.string().allow('', null),
  warrantyInfo: Joi.string().allow('', null),
  stockQty: Joi.number().min(0).optional(),
  weight: Joi.number().min(0).optional(),
  length: Joi.number().min(0).optional(),
  width: Joi.number().min(0).optional(),
  height: Joi.number().min(0).optional(),
  taxClassKey: Joi.string().allow('', null),
  taxRate: Joi.number().min(0).optional(),
  taxSlabs: Joi.array()
    .items(
      Joi.object({
        minAmount: Joi.number().min(0).default(0),
        maxAmount: Joi.number().min(0).allow(null),
        rate: Joi.number().min(0).required(),
      }),
    )
    .optional(),
  isFragile: Joi.boolean().optional(),
  isHeavy: Joi.boolean().optional(),
  shippingClass: Joi.string().allow('', null),

  images: Joi.array().items(imageSchema).max(10).default([]),
  status: Joi.string().valid('draft', 'active', 'inactive', 'blocked').optional(),
  isFeatured: Joi.boolean().optional(),
  listingFeeStatus: Joi.string().valid('pending', 'paid', 'waived').optional(),
  hlaapNo: Joi.string().allow('', null).optional(),

  // system-managed fields
}).options({ allowUnknown: false });

exports.updateProductSchema = Joi.object({
  name: Joi.string().trim().min(3),
  slug: Joi.string().lowercase().trim(), // optional, but must remain unique if changed
  categoryId: Joi.string(),

  retailPrice: priceSchema,
  wholesalePrice: priceSchema,

  minOrderQty: Joi.number().min(1),
  maxOrderQty: Joi.number().min(1),
  minWholesaleQty: Joi.number().min(1),

  shortDescription: Joi.string().allow('', null),
  longDescription: Joi.string().allow('', null),
  returnPolicy: Joi.string().allow('', null),
  warrantyInfo: Joi.string().allow('', null),
  sku: Joi.string().allow('', null),
  hsnCode: Joi.string().allow('', null),
  productType: Joi.string().valid('OEM', 'AFTERMARKET'),
  vehicleBrand: Joi.string().trim().allow('', null),
  oemNumber: Joi.string().trim().allow('', null),
  manufacturerBrand: Joi.string().trim().allow('', null),
  stockQty: Joi.number().min(0),
  weight: Joi.number().min(0),
  length: Joi.number().min(0),
  width: Joi.number().min(0),
  height: Joi.number().min(0),
  taxClassKey: Joi.string().allow('', null),
  taxRate: Joi.number().min(0),
  taxSlabs: Joi.array().items(
    Joi.object({
      minAmount: Joi.number().min(0).default(0),
      maxAmount: Joi.number().min(0).allow(null),
      rate: Joi.number().min(0).required(),
    }),
  ),
  isFragile: Joi.boolean(),
  isHeavy: Joi.boolean(),
  shippingClass: Joi.string().allow('', null),

  isFeatured: Joi.boolean(),
  status: Joi.string().valid('draft', 'active', 'inactive', 'blocked'),
  listingFeeStatus: Joi.string().valid('pending', 'paid', 'waived'),
  hlaapNo: Joi.string().allow('', null).optional(),

  primaryImageId: Joi.string(),
}).options({ allowUnknown: false });

const searchQuerySchema = Joi.string().trim().max(100).allow('');

exports.listFeaturedQuerySchema = Joi.object({
  ...paginationQuerySchema,
  cursor: Joi.string().trim().optional(),
});

exports.listByCategoryQuerySchema = Joi.object({
  ...paginationQuerySchema,
  cursor: Joi.string().trim().optional(),
});

exports.listPublicQuerySchema = Joi.object({
  ...paginationQuerySchema,
  search: searchQuerySchema.optional(),
  categoryId: Joi.string().trim().optional(),
  manufacturerBrand: Joi.string().trim().optional(),
  productType: Joi.string().trim().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  sort: Joi.string()
    .valid('created_desc', 'created_asc', 'price_asc', 'price_desc')
    .default('created_desc'),
});

exports.adminListQuerySchema = Joi.object({
  ...paginationQuerySchema,
  status: Joi.string()
    .valid('published', 'draft', 'trashed', 'all')
    .optional(),
  categoryId: Joi.string().trim().optional(),
  manufacturerBrand: Joi.string().trim().optional(),
  productType: Joi.string().trim().optional(),
  stockStatus: Joi.string().valid('instock', 'outstock').optional(),
  isFeatured: Joi.boolean().optional(),
  search: searchQuerySchema.optional(),
  summary: Joi.boolean().optional(),
});

