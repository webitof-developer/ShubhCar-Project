import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

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
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
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
  [key: string]: unknown;
}

export interface ProductImagesServiceInput {
  [key: string]: unknown;
}

export type ProductImagesServiceResult<T = unknown> = ServiceResult<T>;

export interface ProductImagesRepoFilter {
  [key: string]: unknown;
}

export interface ProductImagesRepoUpdate {
  [key: string]: unknown;
}

export interface ProductImagesValidatorInput {
  [key: string]: unknown;
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

