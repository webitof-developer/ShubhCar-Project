import type { Response } from 'express';
import type { UserActivityLogsRequest } from './userActivityLogs.types';
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/apiResponse');
const service = require('./userActivityLogs.service');

exports.list = asyncHandler(async (req: UserActivityLogsRequest, res: Response) => {
  const data = await service.list(req.query);
  return success(res, data, 'User activity logs fetched');
});

