import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface ProductVariantsParams {
  id?: string;
  productId?: string;
  variantId?: string;
  [key: string]: string | undefined;
}

export interface ProductVariantsQuery {
  [key: string]: QueryScalar | unknown;
}

export interface ProductVariantsBody {
  attributes?: unknown;
  changeType?: unknown;
  delta?: unknown;
  mrp?: unknown;
  price?: unknown;
  referenceId?: unknown;
  salePrice?: unknown;
  sku?: unknown;
  stockQty?: unknown;
  [key: string]: unknown;
}

export interface ProductVariantsRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface ProductVariantsRequestShape {
  params: ProductVariantsParams;
  query: ProductVariantsQuery;
  body: ProductVariantsBody;
}

export type ProductVariantsRequest = Request<
  ProductVariantsParams,
  unknown,
  ProductVariantsBody,
  ProductVariantsQuery
> &
  ProductVariantsRequestContext;

export interface ProductVariantsEntity {
  [key: string]: unknown;
}

export interface ProductVariantsServiceInput {
  [key: string]: unknown;
}

export type ProductVariantsServiceResult<T = unknown> = ServiceResult<T>;

export interface ProductVariantsRepoFilter {
  [key: string]: unknown;
}

export interface ProductVariantsRepoUpdate {
  [key: string]: unknown;
}

export interface ProductVariantsValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type VariantAttributeMap = Record<string, string>;

export interface ProductVariantRecord {
  _id: string;
  productId: string;
  sku: string;
  name?: string;
  attributes: VariantAttributeMap;
  mrp: number;
  salePrice?: number;
  price: number;
  stockQty: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductVariantInput {
  productId: string;
  sku: string;
  attributes?: VariantAttributeMap;
  mrp: number;
  salePrice?: number;
  stockQty?: number;
}

export interface UpdateVariantStockInput {
  delta: number;
  changeType: 'increase' | 'decrease' | 'order' | 'cancel' | 'admin_adjust';
  referenceId?: string;
}

