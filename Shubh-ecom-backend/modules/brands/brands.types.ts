import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface BrandsParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface BrandsQuery {
  limit?: QueryScalar;
  page?: QueryScalar;
  search?: QueryScalar;
  type?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface BrandsBody {
  description?: unknown;
  logo?: unknown;
  name?: unknown;
  slug?: unknown;
  status?: unknown;
  type?: unknown;
  [key: string]: unknown;
}

export interface BrandsRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface BrandsRequestShape {
  params: BrandsParams;
  query: BrandsQuery;
  body: BrandsBody;
}

export type BrandsRequest = Request<
  BrandsParams,
  unknown,
  BrandsBody,
  BrandsQuery
> &
  BrandsRequestContext;

export interface BrandsEntity {
  [key: string]: any;
}

export interface BrandsServiceInput {
  [key: string]: any;
}

export type BrandsServiceResult<T = any> = Promise<T>;

export interface BrandsRepoFilter {
  [key: string]: any;
}

export interface BrandsRepoUpdate {
  [key: string]: any;
}

export interface BrandsValidatorInput {
  [key: string]: any;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type BrandType = 'vehicle' | 'manufacturer';
export type BrandStatus = 'active' | 'inactive';

export interface BrandRecord {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  type: BrandType;
  status: BrandStatus;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBrandInput {
  name: string;
  slug: string;
  type: BrandType;
  description?: string;
  logo?: string;
}

export interface UpdateBrandInput {
  name?: string;
  description?: string;
  logo?: string;
  status?: BrandStatus;
}
