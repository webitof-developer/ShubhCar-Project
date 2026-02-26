import type { Response } from 'express';
import type { ProductAttributeRequest } from './productAttribute.types';
const { success } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const service = require('./productAttribute.service');

exports.list = asyncHandler(async (req: ProductAttributeRequest, res: Response) => {
  const data = await service.list(req.params.productId, req.user, req.query);
  return success(res, data);
});

exports.upsert = asyncHandler(async (req: ProductAttributeRequest, res: Response) => {
  const data = await service.upsert(
    req.params.productId,
    req.params.attributeId,
    req.body.value,
    req.user,
  );
  return success(res, data, 'Attribute saved');
});

exports.remove = asyncHandler(async (req: ProductAttributeRequest, res: Response) => {
  const data = await service.remove(
    req.params.productId,
    req.params.attributeId,
    req.user,
  );
  return success(res, data, 'Attribute removed');
});

