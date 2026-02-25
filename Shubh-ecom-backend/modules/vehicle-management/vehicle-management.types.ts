import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface VehicleManagementServiceInput {
  [key: string]: any;
}

export type VehicleManagementServiceResult<T = any> = Promise<T>;

export interface VehicleManagementRepoFilter {
  [key: string]: any;
}

export interface VehicleManagementRepoUpdate {
  [key: string]: any;
}

export interface VehicleManagementValidatorInput {
  [key: string]: any;
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
