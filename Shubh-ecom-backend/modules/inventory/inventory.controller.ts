import type { Response } from 'express';
import type { InventoryRequest } from './inventory.types';
const asyncHandler = require('../../utils/asyncHandler');
const service = require('./inventory.admin.service');
const { success } = require('../../utils/apiResponse');

exports.summary = asyncHandler(async (req: InventoryRequest, res: Response) => {
  const data = await service.summary(req.query);
  return success(res, data, 'Inventory summary fetched');
});

exports.listProducts = asyncHandler(async (req: InventoryRequest, res: Response) => {
  const data = await service.listProducts(req.query);
  return success(res, data, 'Inventory products fetched');
});

exports.adjustStock = asyncHandler(async (req: InventoryRequest, res: Response) => {
  const data = await service.adjustStock(req.body);
  return success(res, data, 'Inventory stock adjusted');
});

