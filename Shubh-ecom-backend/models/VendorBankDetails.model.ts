// @ts-nocheck
const mongoose = require('mongoose');

const vendorBankDetailsSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      unique: true,
      index: true,
    },
    accountHolder: { type: String, required: true, trim: true },
    bankName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    ifscOrSwift: { type: String, required: true, trim: true },
    upiId: { type: String, default: null },
    paypalEmail: { type: String, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('VendorBankDetails', vendorBankDetailsSchema);

