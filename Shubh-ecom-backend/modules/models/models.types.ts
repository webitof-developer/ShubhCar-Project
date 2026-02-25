import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface ModelsServiceInput {
  [key: string]: any;
}

export type ModelsServiceResult<T = any> = Promise<T>;

export interface ModelsRepoFilter {
  [key: string]: any;
}

export interface ModelsRepoUpdate {
  [key: string]: any;
}

export interface ModelsValidatorInput {
  [key: string]: any;
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
