const Joi = require('joi');

const documentSchema = Joi.object({
  docType: Joi.string().trim().required(),
  docUrl: Joi.string().uri().required(),
});

const bankSchema = Joi.object({
  accountHolder: Joi.string().required(),
  bankName: Joi.string().required(),
  accountNumber: Joi.string().required(),
  ifscOrSwift: Joi.string().required(),
  upiId: Joi.string().allow(null, ''),
  paypalEmail: Joi.string().email().allow(null, ''),
});

const onboardVendorSchema = Joi.object({
  ownerUserId: Joi.string().required(),
  businessName: Joi.string().required(),
  legalName: Joi.string().required(),
  gstOrTaxId: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required(),
  logoUrl: Joi.string().uri().optional(),
  bannerUrl: Joi.string().uri().optional(),
  description: Joi.string().allow('', null),
  documents: Joi.array().items(documentSchema).default([]),
  bankDetails: bankSchema.optional(),
});

const updateVendorSchema = Joi.object({
  businessName: Joi.string(),
  legalName: Joi.string(),
  gstOrTaxId: Joi.string(),
  email: Joi.string().email(),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional(),
  logoUrl: Joi.string().uri().optional(),
  bannerUrl: Joi.string().uri().optional(),
  description: Joi.string().allow('', null),
}).min(1);

const vendorSelfUpdateSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .optional(),
  logoUrl: Joi.string().uri().optional(),
  bannerUrl: Joi.string().uri().optional(),
  description: Joi.string().allow('', null),
}).min(1);

const adminUpdateVendorSchema = updateVendorSchema;

const updateBankSchema = bankSchema;

const statusUpdateSchema = Joi.object({
  status: Joi.string().valid('active', 'suspended', 'rejected').required(),
  rejectionReason: Joi.when('status', {
    is: Joi.valid('suspended', 'rejected'),
    then: Joi.string().min(5).required(),
    otherwise: Joi.string().optional(),
  }),
});

const addDocumentsSchema = Joi.object({
  documents: Joi.array().items(documentSchema).min(1).required(),
});

module.exports = {
  onboardVendorSchema,
  updateVendorSchema,
  vendorSelfUpdateSchema,
  adminUpdateVendorSchema,
  updateBankSchema,
  statusUpdateSchema,
  addDocumentsSchema,
};

