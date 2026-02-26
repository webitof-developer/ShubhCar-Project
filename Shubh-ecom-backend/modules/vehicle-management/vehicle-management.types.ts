import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface VehicleManagementParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface VehicleManagementQuery {
  format?: QueryScalar;
  limit?: QueryScalar;
  modelId?: QueryScalar;
  page?: QueryScalar;
  search?: QueryScalar;
  status?: QueryScalar;
  yearId?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface VehicleManagementBody {
  attributeId?: unknown;
  attributeValueIds?: unknown;
  brandId?: unknown;
  description?: unknown;
  logo?: unknown;
  modelId?: unknown;
  modelYearId?: unknown;
  name?: unknown;
  slug?: unknown;
  status?: unknown;
  type?: unknown;
  value?: unknown;
  variantName?: unknown;
  vehicleCode?: unknown;
  year?: unknown;
  yearId?: unknown;
  [key: string]: unknown;
}

export interface VehicleManagementRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface VehicleManagementRequestShape {
  params: VehicleManagementParams;
  query: VehicleManagementQuery;
  body: VehicleManagementBody;
}

export type VehicleManagementRequest = Request<
  VehicleManagementParams,
  unknown,
  VehicleManagementBody,
  VehicleManagementQuery
> &
  VehicleManagementRequestContext;

export interface VehicleManagementEntity {
  [key: string]: unknown;
}

export interface VehicleManagementServiceInput {
  [key: string]: unknown;
}

export type VehicleManagementServiceResult<T = unknown> = ServiceResult<T>;

export interface VehicleManagementRepoFilter {
  [key: string]: unknown;
}

export interface VehicleManagementRepoUpdate {
  [key: string]: unknown;
}

export interface VehicleManagementValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface VehicleMakeRecord {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleModelEntry {
  _id: string;
  makeId: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleYearRecord {
  _id: string;
  modelId: string;
  year: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVehicleMakeInput {
  name: string;
  slug?: string;
}
export interface CreateVehicleModelInput {
  makeId: string;
  name: string;
  slug?: string;
}
export interface CreateVehicleYearInput {
  modelId: string;
  year: number;
}

