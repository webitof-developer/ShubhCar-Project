// @ts-nocheck
const mongoose = require('mongoose');

const vendorDocumentSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },
    docType: { type: String, required: true, trim: true },
    docUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    remarks: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

module.exports = mongoose.model('VendorDocument', vendorDocumentSchema);

