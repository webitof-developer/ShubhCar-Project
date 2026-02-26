import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface ModelsParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface ModelsQuery {
  limit?: QueryScalar;
  page?: QueryScalar;
  search?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface ModelsBody {
  slug?: unknown;
  status?: unknown;
  year?: unknown;
  [key: string]: unknown;
}

export interface ModelsRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface ModelsRequestShape {
  params: ModelsParams;
  query: ModelsQuery;
  body: ModelsBody;
}

export type ModelsRequest = Request<
  ModelsParams,
  unknown,
  ModelsBody,
  ModelsQuery
> &
  ModelsRequestContext;

export interface ModelsEntity {
  [key: string]: unknown;
}

export interface ModelsServiceInput {
  [key: string]: unknown;
}

export type ModelsServiceResult<T = unknown> = ServiceResult<T>;

export interface ModelsRepoFilter {
  [key: string]: unknown;
}

export interface ModelsRepoUpdate {
  [key: string]: unknown;
}

export interface ModelsValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type VehicleModelStatus = 'active' | 'inactive';

export interface VehicleModelRecord {
  _id: string;
  makeId: string;
  name: string;
  slug: string;
  year?: number;
  status: VehicleModelStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleModelInput {
  makeId: string;
  name: string;
  slug?: string;
  year?: number;
}

