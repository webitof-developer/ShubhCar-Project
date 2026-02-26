import type { Response } from 'express';
import type { SettingsRequest } from './settings.types';
const asyncHandler = require('../../utils/asyncHandler');
const settingsService = require('./settings.service');
const { success } = require('../../utils/apiResponse');

exports.list = asyncHandler(async (req: SettingsRequest, res: Response) => {
    const data = await settingsService.list(req.query.group, req.user);
    return success(res, data);
});

exports.listPublic = asyncHandler(async (_req, res) => {
    const data = await settingsService.listPublic();
    return success(res, data);
});

exports.updateBulk = asyncHandler(async (req: SettingsRequest, res: Response) => {
    // Body should be { "key": "value", ... }
    const data = await settingsService.updateBulk(req.body);
    return success(res, data, 'Settings updated successfully');
});

