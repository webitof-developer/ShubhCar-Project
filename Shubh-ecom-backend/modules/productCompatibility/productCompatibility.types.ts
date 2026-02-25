import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface ProductCompatibilityParams {
  id?: string;
  productId?: string;
  [key: string]: string | undefined;
}

export interface ProductCompatibilityQuery {
  [key: string]: QueryScalar | unknown;
}

export interface ProductCompatibilityBody {
  vehicleIds?: unknown;
  [key: string]: unknown;
}

export interface ProductCompatibilityRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface ProductCompatibilityRequestShape {
  params: ProductCompatibilityParams;
  query: ProductCompatibilityQuery;
  body: ProductCompatibilityBody;
}

export type ProductCompatibilityRequest = Request<
  ProductCompatibilityParams,
  unknown,
  ProductCompatibilityBody,
  ProductCompatibilityQuery
> &
  ProductCompatibilityRequestContext;

export interface ProductCompatibilityEntity {
  [key: string]: any;
}

export interface ProductCompatibilityServiceInput {
  [key: string]: any;
}

export type ProductCompatibilityServiceResult<T = any> = Promise<T>;

export interface ProductCompatibilityRepoFilter {
  [key: string]: any;
}

export interface ProductCompatibilityRepoUpdate {
  [key: string]: any;
}

export interface ProductCompatibilityValidatorInput {
  [key: string]: any;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface ProductCompatibilityRecord {
  _id: string;
  productId: string;
  vehicleIds: string[];
  makeId?: string;
  modelId?: string;
  yearMin?: number;
  yearMax?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddCompatibilityInput {
  productId: string;
  vehicleIds?: string[];
  makeId?: string;
  modelId?: string;
  yearMin?: number;
  yearMax?: number;
}
