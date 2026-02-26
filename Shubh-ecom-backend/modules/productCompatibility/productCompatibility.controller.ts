import type { Response } from 'express';
import type { ProductCompatibilityRequest } from './productCompatibility.types';
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./productCompatibility.service');

exports.getByProduct = asyncHandler(async (req: ProductCompatibilityRequest, res: Response) => {
  const data = await service.getByProduct(req.params.productId);
  return success(res, data);
});

exports.upsert = asyncHandler(async (req: ProductCompatibilityRequest, res: Response) => {
  const data = await service.upsert(req.params.productId, req.body);
  return success(res, data, 'Compatibility updated');
});

