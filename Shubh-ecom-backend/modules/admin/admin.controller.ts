import type { Response } from 'express';
import type { AdminRequest } from './admin.types';
const asyncHandler = require('../../utils/asyncHandler');
const adminService = require('./admin.service');
const { success } = require('../../utils/apiResponse');

exports.listPendingWholesale = asyncHandler(async (req: AdminRequest, res: Response) => {
  const data = await adminService.listPendingWholesale(req.query);
  return success(res, data);
});

exports.reviewWholesaleUser = asyncHandler(async (req: AdminRequest, res: Response) => {
  const data = await adminService.reviewWholesaleUser(
    req.user,
    req.params.userId,
    req.body,
  );

  return success(res, data, 'Wholesale user reviewed');
});

