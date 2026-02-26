import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface RolesParams {
  id?: string;
  roleId?: string;
  [key: string]: string | undefined;
}

export interface RolesQuery {
  [key: string]: QueryScalar | unknown;
}

export interface RolesBody {
  name?: unknown;
  permissions?: unknown;
  slug?: unknown;
  [key: string]: unknown;
}

export interface RolesRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface RolesRequestShape {
  params: RolesParams;
  query: RolesQuery;
  body: RolesBody;
}

export type RolesRequest = Request<
  RolesParams,
  unknown,
  RolesBody,
  RolesQuery
> &
  RolesRequestContext;

export interface RolesEntity {
  [key: string]: unknown;
}

export interface RolesServiceInput {
  [key: string]: unknown;
}

export type RolesServiceResult<T = unknown> = ServiceResult<T>;

export interface RolesRepoFilter {
  [key: string]: unknown;
}

export interface RolesRepoUpdate {
  [key: string]: unknown;
}

export interface RolesValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type PermissionsMap = Record<string, boolean>;

export interface RoleRecord {
  _id: string;
  name: string;
  slug: string;
  permissions: PermissionsMap;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleInput {
  name: string;
  slug: string;
  permissions?: PermissionsMap;
}

export interface UpdateRoleInput {
  name?: string;
  permissions?: PermissionsMap;
}

