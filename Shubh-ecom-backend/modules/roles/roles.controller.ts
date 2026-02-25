import type { RolesRequestShape } from './roles.types';
import type { Response } from 'express';
import type { RolesRequest } from './roles.types';
const asyncHandler = require('../../utils/asyncHandler');
const rolesService = require('./roles.service');
const { success } = require('../../utils/apiResponse');

exports.list = asyncHandler(async (req: RolesRequest, res: Response) => {
  const data = await rolesService.list(req.query);
  return success(res, data);
});

exports.get = asyncHandler(async (req: RolesRequest, res: Response) => {
  const data = await rolesService.get(req.params.roleId);
  return success(res, data);
});

exports.create = asyncHandler(async (req: RolesRequest, res: Response) => {
  const data = await rolesService.create(req.body);
  return success(res, data, 'Role created', 201);
});

exports.update = asyncHandler(async (req: RolesRequest, res: Response) => {
  const data = await rolesService.update(req.params.roleId, req.body);
  return success(res, data, 'Role updated');
});

exports.remove = asyncHandler(async (req: RolesRequest, res: Response) => {
  const data = await rolesService.remove(req.params.roleId);
  return success(res, data, 'Role deleted');
});
