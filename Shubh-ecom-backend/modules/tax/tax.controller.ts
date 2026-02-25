import type { TaxRequestShape } from './tax.types';
import type { Response } from 'express';
import type { TaxRequest } from './tax.types';
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./tax.service');

exports.list = asyncHandler(async (req: TaxRequest, res: Response) => {
  const data = await service.list(req.query);
  return success(res, data);
});

exports.create = asyncHandler(async (req: TaxRequest, res: Response) => {
  const data = await service.create(req.body);
  return success(res, data, 'Tax slab created');
});

exports.update = asyncHandler(async (req: TaxRequest, res: Response) => {
  const data = await service.update(req.params.id, req.body);
  return success(res, data, 'Tax slab updated');
});

exports.remove = asyncHandler(async (req: TaxRequest, res: Response) => {
  const data = await service.remove(req.params.id);
  return success(res, data, 'Tax slab removed');
});
