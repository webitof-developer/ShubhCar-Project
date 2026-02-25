import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface ProductVariantsServiceInput {
  [key: string]: any;
}

export type ProductVariantsServiceResult<T = any> = Promise<T>;

export interface ProductVariantsRepoFilter {
  [key: string]: any;
}

export interface ProductVariantsRepoUpdate {
  [key: string]: any;
}

export interface ProductVariantsValidatorInput {
  [key: string]: any;
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
