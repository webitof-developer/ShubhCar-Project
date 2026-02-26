import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface ProductAttributeValuesParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface ProductAttributeValuesQuery {
  [key: string]: QueryScalar | unknown;
}

export interface ProductAttributeValuesBody {
  attributeId?: unknown;
  displayOrder?: unknown;
  productId?: unknown;
  value?: unknown;
  [key: string]: unknown;
}

export interface ProductAttributeValuesRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface ProductAttributeValuesRequestShape {
  params: ProductAttributeValuesParams;
  query: ProductAttributeValuesQuery;
  body: ProductAttributeValuesBody;
}

export type ProductAttributeValuesRequest = Request<
  ProductAttributeValuesParams,
  unknown,
  ProductAttributeValuesBody,
  ProductAttributeValuesQuery
> &
  ProductAttributeValuesRequestContext;

export interface ProductAttributeValuesEntity {
  [key: string]: unknown;
}

export interface ProductAttributeValuesServiceInput {
  [key: string]: unknown;
}

export type ProductAttributeValuesServiceResult<T = unknown> = ServiceResult<T>;

export interface ProductAttributeValuesRepoFilter {
  [key: string]: unknown;
}

export interface ProductAttributeValuesRepoUpdate {
  [key: string]: unknown;
}

export interface ProductAttributeValuesValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface AttributeValueRecord {
  _id: string;
  productId: string;
  attributeId: string;
  value: string;
  displayOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertAttributeValueInput {
  productId: string;
  attributeId: string;
  value: string;
  displayOrder?: number;
}

