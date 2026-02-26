import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

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
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
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
  [key: string]: unknown;
}

export interface ProductCompatibilityServiceInput {
  [key: string]: unknown;
}

export type ProductCompatibilityServiceResult<T = unknown> = ServiceResult<T>;

export interface ProductCompatibilityRepoFilter {
  [key: string]: unknown;
}

export interface ProductCompatibilityRepoUpdate {
  [key: string]: unknown;
}

export interface ProductCompatibilityValidatorInput {
  [key: string]: unknown;
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

