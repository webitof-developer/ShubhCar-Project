import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface ProductImagesParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface ProductImagesQuery {
  isPrimary?: QueryScalar;
  productId?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface ProductImagesBody {
  altText?: unknown;
  isPrimary?: unknown;
  productId?: unknown;
  sortOrder?: unknown;
  url?: unknown;
  [key: string]: unknown;
}

export interface ProductImagesRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface ProductImagesRequestShape {
  params: ProductImagesParams;
  query: ProductImagesQuery;
  body: ProductImagesBody;
}

export type ProductImagesRequest = Request<
  ProductImagesParams,
  unknown,
  ProductImagesBody,
  ProductImagesQuery
> &
  ProductImagesRequestContext;

export interface ProductImagesEntity {
  [key: string]: any;
}

export interface ProductImagesServiceInput {
  [key: string]: any;
}

export type ProductImagesServiceResult<T = any> = Promise<T>;

export interface ProductImagesRepoFilter {
  [key: string]: any;
}

export interface ProductImagesRepoUpdate {
  [key: string]: any;
}

export interface ProductImagesValidatorInput {
  [key: string]: any;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface ProductImageRecord {
  _id: string;
  productId: string;
  url: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
  width?: number;
  height?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddProductImageInput {
  productId: string;
  url: string;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface UpdateProductImageInput {
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}
