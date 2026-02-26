import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface ProductsParams {
  id?: string;
  categoryId?: string;
  jobId?: string;
  productId?: string;
  products?: string;
  slug?: string;
  upload?: string;
  [key: string]: string | undefined;
}

export interface ProductsQuery {
  format?: QueryScalar;
  limit?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface ProductsBody {
  altText?: unknown;
  mrp?: unknown;
  salePrice?: unknown;
  url?: unknown;
  [key: string]: unknown;
}

export interface ProductsRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface ProductsRequestShape {
  params: ProductsParams;
  query: ProductsQuery;
  body: ProductsBody;
}

export type ProductsRequest = Request<
  ProductsParams,
  unknown,
  ProductsBody,
  ProductsQuery
> &
  ProductsRequestContext;

export interface ProductsEntity {
  [key: string]: unknown;
}

export interface ProductsServiceInput {
  [key: string]: unknown;
}

export type ProductsServiceResult<T = unknown> = ServiceResult<T>;

export interface ProductsRepoFilter {
  [key: string]: unknown;
}

export interface ProductsRepoUpdate {
  [key: string]: unknown;
}

export interface ProductsValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type ProductStatus = 'draft' | 'active' | 'inactive' | 'blocked';
export type ProductType = 'OEM' | 'AFTERMARKET';
export type ListingFeeStatus = 'pending' | 'paid' | 'waived';
export type PriceLabel = 'retail' | 'wholesale';

export interface PriceSchema {
  mrp: number;
  salePrice?: number;
  costPrice?: number;
}

export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit?: string;
}

export interface ProductRecord {
  _id: string;
  productId?: string;
  categoryId: string;
  name: string;
  slug: string;
  sku?: string;
  hsnCode?: string;
  description?: string;
  shortDescription?: string;
  productType: ProductType;
  status: ProductStatus;
  retailPrice: PriceSchema;
  wholesalePrice?: PriceSchema;
  stockQty: number;
  weight?: number;
  dimensions?: ProductDimensions;
  taxSlabId?: string;
  isFeatured: boolean;
  ratingAvg: number;
  ratingCount: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  name: string;
  slug: string;
  categoryId: string;
  productType?: ProductType;
  retailPrice: PriceSchema;
  wholesalePrice?: PriceSchema;
  stockQty?: number;
  description?: string;
  sku?: string;
}

export interface UpdateProductInput {
  name?: string;
  status?: ProductStatus;
  isFeatured?: boolean;
  retailPrice?: PriceSchema;
  wholesalePrice?: PriceSchema;
  description?: string;
  stockQty?: number;
}

