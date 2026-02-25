import type { VendorsRequestShape } from './vendors.types';
const vendorRepo = require('./vendor.repo');
const cache = require('./vendor.cache');
const jobs = require('./vendor.jobs');
const { error } = require('../../utils/apiResponse');
const { assertRole } = require('../../utils/roleGuard');
const {
  onboardVendorSchema,
  vendorSelfUpdateSchema,
  adminUpdateVendorSchema,
  updateBankSchema,
  statusUpdateSchema,
  addDocumentsSchema,
} = require('./vendor.validator');

class VendorService {
  async getByOwner(ownerUserId) {
    const cached = await cache.getByOwner(ownerUserId);
    if (cached) return cached;

    const vendor = await vendorRepo.getByOwner(ownerUserId);
    if (!vendor) error('Vendor not found', 404);

    await cache.setById(vendor._id, vendor);
    await cache.setByOwner(ownerUserId, vendor);
    return vendor;
  }

  async onboard(adminUser, payload) {
    assertRole(adminUser, ['admin']);
    const { error: err, value } = onboardVendorSchema.validate(payload, {
      abortEarly: false,
    });
    if (err) error(err.details.map((d) => d.message).join(', '));

    const existing = await vendorRepo.getByOwner(value.ownerUserId);
    if (existing && existing.status !== 'rejected') {
      error('Vendor already exists for owner', 409);
    }

    const vendor = await vendorRepo.createVendor({
      ...value,
      status: 'active',
      rejectionReason: null,
    });

    if (value.documents?.length) {
      await vendorRepo.insertDocuments(
        value.documents.map((d) => ({
          vendorId: vendor._id,
          ...d,
        })),
      );
    }

    if (value.bankDetails) {
      await vendorRepo.upsertBankDetails(vendor._id, value.bankDetails);
    }

    await cache.invalidate({ _id: vendor._id, ownerUserId: vendor.ownerUserId });
    await jobs.enqueueListingFeeJob(vendor._id);
    await jobs.vendorStatusChangedNotification(vendor._id, vendor.status);
    await jobs.verifyVendorDocuments(vendor._id);

    return vendor;
  }

  async updateStatus(adminUser, vendorId, payload) {
    assertRole(adminUser, ['admin']);

    const { error: err, value } = statusUpdateSchema.validate(payload, {
      abortEarly: false,
    });
    if (err) error(err.details.map((d) => d.message).join(', '));

    const vendor = await vendorRepo.findById(vendorId);
    if (!vendor) error('Vendor not found', 404);

    const updated = await vendorRepo.updateVendorStatus(
      vendorId,
      value.status,
      value.rejectionReason,
    );

    await cache.invalidate({
      _id: vendorId,
      ownerUserId: vendor.ownerUserId,
    });
    await jobs.vendorStatusChangedNotification(vendorId, value.status);
    return updated;
  }

  async addDocuments(ownerUserId, payload) {
    const { error: err, value } = addDocumentsSchema.validate(payload, {
      abortEarly: false,
    });
    if (err) error(err.details.map((d) => d.message).join(', '));

    const vendor = await vendorRepo.getByOwner(ownerUserId);
    if (!vendor) error('Vendor not found', 404);

    await vendorRepo.insertDocuments(
      value.documents.map((d) => ({ vendorId: vendor._id, ...d })),
    );
    await jobs.verifyVendorDocuments(vendor._id);
    await cache.invalidate({ _id: vendor._id, ownerUserId });
    return vendorRepo.getVendorDocuments(vendor._id);
  }

  async updateDetails(ownerUserId, payload) {
    const { error: err, value } = vendorSelfUpdateSchema.validate(payload, {
      abortEarly: false,
    });
    if (err) error(err.details.map((d) => d.message).join(', '));

    const vendor = await vendorRepo.getByOwner(ownerUserId);
    if (!vendor) error('Vendor not found', 404);

    const updated = await vendorRepo.updateById(vendor._id, value);
    await cache.invalidate({ _id: vendor._id, ownerUserId });
    return updated;
  }

  async updateDetailsAdmin(adminUser, vendorId, payload) {
    assertRole(adminUser, ['admin']);

    const { error: err, value } = adminUpdateVendorSchema.validate(payload, {
      abortEarly: false,
    });
    if (err) error(err.details.map((d) => d.message).join(', '));

    const vendor = await vendorRepo.findById(vendorId);
    if (!vendor) error('Vendor not found', 404);

    const updated = await vendorRepo.updateById(vendorId, value);
    await cache.invalidate({
      _id: vendorId,
      ownerUserId: vendor.ownerUserId,
    });
    return updated;
  }

  async updateBank(ownerUserId, payload) {
    const { error: err, value } = updateBankSchema.validate(payload, {
      abortEarly: false,
    });
    if (err) error(err.details.map((d) => d.message).join(', '));

    const vendor = await vendorRepo.getByOwner(ownerUserId);
    if (!vendor) error('Vendor not found', 404);

    const bank = await vendorRepo.upsertBankDetails(vendor._id, value);
    await cache.invalidate({ _id: vendor._id, ownerUserId });
    return bank;
  }
}

module.exports = new VendorService();
