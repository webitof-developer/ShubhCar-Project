// @ts-nocheck
const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
      unique: true,
    },
    businessName: { type: String, required: true, trim: true },
    legalName: { type: String, required: true, trim: true },
    gstOrTaxId: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    logoUrl: { type: String, default: null },
    bannerUrl: { type: String, default: null },
    description: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended', 'rejected'],
      default: 'pending',
      index: true,
    },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true },
);

vendorSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Vendor', vendorSchema);

