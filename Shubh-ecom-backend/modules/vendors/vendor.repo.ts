import type { VendorsRequestShape } from './vendors.types';
const Vendor = require('../../models/Vendor.model');
const VendorDocument = require('../../models/VendorDocument.model');
const VendorBankDetails = require('../../models/VendorBankDetails.model');

class VendorRepository {
  createVendor(data) {
    return Vendor.create(data);
  }

  findById(id) {
    return Vendor.findById(id).lean();
  }

  findByEmail(email) {
    return Vendor.findOne({ email }).lean();
  }

  getByOwner(ownerUserId) {
    return Vendor.findOne({ ownerUserId }).lean();
  }

  updateById(id, data) {
    return Vendor.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  updateVendorStatus(id, status, rejectionReason = null) {
    return Vendor.findByIdAndUpdate(
      id,
      { status, rejectionReason: rejectionReason || null },
      { new: true },
    ).lean();
  }

  /* =====================
     DOCUMENTS
  ====================== */
  insertDocuments(docs) {
    return VendorDocument.insertMany(docs);
  }

  getVendorDocuments(vendorId) {
    return VendorDocument.find({ vendorId }).sort({ uploadedAt: -1 }).lean();
  }

  /* =====================
     BANK DETAILS
  ====================== */
  upsertBankDetails(vendorId, payload) {
    return VendorBankDetails.findOneAndUpdate(
      { vendorId },
      { vendorId, ...payload },
      { upsert: true, new: true },
    ).lean();
  }
}

module.exports = new VendorRepository();
