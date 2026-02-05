const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./vendors.service');
const audit = require('../audit/audit.service');

exports.getMine = asyncHandler(async (req, res) => {
  const data = await service.getByOwner(req.user.id);
  return success(res, data);
});

exports.onboard = asyncHandler(async (req, res) => {
  const data = await service.onboard(req.user, req.body);
  audit.log({
    actor: { id: req.user?.id, role: req.user?.role || 'unknown' },
    action: 'vendor_onboard',
    target: { id: data._id },
  });
  return success(res, data, 'Vendor onboarded', 201);
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const data = await service.updateStatus(req.user, req.params.vendorId, req.body);
  audit.log({
    actor: { id: req.user?.id, role: req.user?.role || 'unknown' },
    action: 'vendor_status_update',
    target: { id: req.params.vendorId },
    meta: { status: req.body.status },
  });
  return success(res, data, 'Vendor status updated');
});

exports.addDocuments = asyncHandler(async (req, res) => {
  const data = await service.addDocuments(req.user.id, req.body);
  return success(res, data, 'Documents added');
});

exports.updateDetails = asyncHandler(async (req, res) => {
  const data = await service.updateDetails(req.user.id, req.body);
  audit.log({
    actor: { id: req.user?.id, role: req.user?.role || 'unknown' },
    action: 'vendor_details_update',
    target: { id: req.user?.id },
  });
  return success(res, data, 'Vendor details updated');
});

exports.updateDetailsAdmin = asyncHandler(async (req, res) => {
  const data = await service.updateDetailsAdmin(
    req.user,
    req.params.vendorId,
    req.body,
  );
  audit.log({
    actor: { id: req.user?.id, role: req.user?.role || 'unknown' },
    action: 'vendor_details_admin_update',
    target: { id: req.params.vendorId },
  });
  return success(res, data, 'Vendor details updated');
});

exports.updateBank = asyncHandler(async (req, res) => {
  const data = await service.updateBank(req.user.id, req.body);
  audit.log({
    actor: { id: req.user?.id, role: req.user?.role || 'unknown' },
    action: 'vendor_bank_update',
    target: { id: req.user?.id },
  });
  return success(res, data, 'Bank details saved');
});
