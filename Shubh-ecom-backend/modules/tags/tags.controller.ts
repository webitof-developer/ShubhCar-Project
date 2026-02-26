import type { Response } from 'express';
import type { TagsRequest } from './tags.types';

const asyncHandler = require('../../utils/asyncHandler');
const tagService = require('./tags.service');
const { success } = require('../../utils/apiResponse');

exports.list = asyncHandler(async (req: TagsRequest, res: Response) => {
  const data = await tagService.list(req.query);
  return success(res, data);
});

exports.create = asyncHandler(async (req: TagsRequest, res: Response) => {
  const data = await tagService.create(req.body);
  return success(res, data, 'Tag created');
});

exports.update = asyncHandler(async (req: TagsRequest, res: Response) => {
  const data = await tagService.update(req.params.id, req.body);
  return success(res, data, 'Tag updated');
});

exports.remove = asyncHandler(async (req: TagsRequest, res: Response) => {
  await tagService.delete(req.params.id);
  return success(res, null, 'Tag deleted');
});

