import type { BrandsRequestShape } from './brands.types';
import type { Response } from 'express';
import type { BrandsRequest } from './brands.types';
const asyncHandler = require('../../utils/asyncHandler');
const brandService = require('./brands.service');
const { success } = require('../../utils/apiResponse');

exports.list = asyncHandler(async (req: BrandsRequest, res: Response) => {
    const data = await brandService.list(req.query);
    return success(res, data);
});

exports.create = asyncHandler(async (req: BrandsRequest, res: Response) => {
    const data = await brandService.create(req.body);
    return success(res, data, 'Brand created');
});

exports.get = asyncHandler(async (req: BrandsRequest, res: Response) => {
    const data = await brandService.get(req.params.id);
    return success(res, data);
});

exports.update = asyncHandler(async (req: BrandsRequest, res: Response) => {
    const data = await brandService.update(req.params.id, req.body);
    return success(res, data, 'Brand updated');
});

exports.remove = asyncHandler(async (req: BrandsRequest, res: Response) => {
    await brandService.delete(req.params.id);
    return success(res, null, 'Brand deleted');
});
