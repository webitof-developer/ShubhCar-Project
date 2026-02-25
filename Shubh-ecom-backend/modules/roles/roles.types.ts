import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface RolesServiceInput {
  [key: string]: any;
}

export type RolesServiceResult<T = any> = Promise<T>;

export interface RolesRepoFilter {
  [key: string]: any;
}

export interface RolesRepoUpdate {
  [key: string]: any;
}

export interface RolesValidatorInput {
  [key: string]: any;
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
