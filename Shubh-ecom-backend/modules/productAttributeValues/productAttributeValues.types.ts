import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface ProductAttributeValuesServiceInput {
  [key: string]: any;
}

export type ProductAttributeValuesServiceResult<T = any> = Promise<T>;

export interface ProductAttributeValuesRepoFilter {
  [key: string]: any;
}

export interface ProductAttributeValuesRepoUpdate {
  [key: string]: any;
}

export interface ProductAttributeValuesValidatorInput {
  [key: string]: any;
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
