import type { Response } from 'express';
import type { InventoryLogsRequest } from './inventoryLogs.types';
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./inventoryLogs.service');

exports.list = asyncHandler(async (req: InventoryLogsRequest, res: Response) => {
  const data = await service.list(req.query);
  return success(res, data, 'Inventory logs fetched');
});

exports.get = asyncHandler(async (req: InventoryLogsRequest, res: Response) => {
  const data = await service.get(req.params.id);
  return success(res, data, 'Inventory log fetched');
});

