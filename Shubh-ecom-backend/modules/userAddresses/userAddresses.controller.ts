import type { Response } from 'express';
import type { UserAddressesRequest } from './userAddresses.types';
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./userAddresses.service');

exports.list = asyncHandler(async (req: UserAddressesRequest, res: Response) => {
  const data = await service.list(req.user.id, req.query);
  return success(res, data, 'Addresses fetched');
});

exports.adminListByUser = asyncHandler(async (req: UserAddressesRequest, res: Response) => {
  const data = await service.adminListByUser(req.params.userId, req.query);
  return success(res, data, 'Addresses fetched');
});

exports.get = asyncHandler(async (req: UserAddressesRequest, res: Response) => {
  const data = await service.get(req.params.id, req.user.id);
  return success(res, data, 'Address fetched');
});

exports.create = asyncHandler(async (req: UserAddressesRequest, res: Response) => {
  const data = await service.create(req.user.id, req.body);
  return success(res, data, 'Address created', 201);
});

exports.update = asyncHandler(async (req: UserAddressesRequest, res: Response) => {
  const data = await service.update(req.params.id, req.user.id, req.body);
  return success(res, data, 'Address updated');
});

exports.remove = asyncHandler(async (req: UserAddressesRequest, res: Response) => {
  const data = await service.remove(req.params.id, req.user.id);
  return success(res, data, 'Address deleted');
});

