import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface ProductAttributeParams {
  id?: string;
  attributeId?: string;
  productId?: string;
  [key: string]: string | undefined;
}

export interface ProductAttributeQuery {
  [key: string]: QueryScalar | unknown;
}

export interface ProductAttributeBody {
  value?: unknown;
  [key: string]: unknown;
}

export interface ProductAttributeRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface ProductAttributeRequestShape {
  params: ProductAttributeParams;
  query: ProductAttributeQuery;
  body: ProductAttributeBody;
}

export type ProductAttributeRequest = Request<
  ProductAttributeParams,
  unknown,
  ProductAttributeBody,
  ProductAttributeQuery
> &
  ProductAttributeRequestContext;

export interface ProductAttributeEntity {
  [key: string]: any;
}

export interface ProductAttributeServiceInput {
  [key: string]: any;
}

export type ProductAttributeServiceResult<T = any> = Promise<T>;

export interface ProductAttributeRepoFilter {
  [key: string]: any;
}

export interface ProductAttributeRepoUpdate {
  [key: string]: any;
}

export interface ProductAttributeValidatorInput {
  [key: string]: any;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type AttributeInputType =
  | 'text'
  | 'select'
  | 'multiselect'
  | 'number'
  | 'boolean'
  | 'date';

export interface AttributeDefinitionRecord {
  _id: string;
  name: string;
  slug: string;
  inputType: AttributeInputType;
  unit?: string;
  isRequired: boolean;
  isFilterable: boolean;
  isComparable: boolean;
  options?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttributeInput {
  name: string;
  slug: string;
  inputType?: AttributeInputType;
  unit?: string;
  isRequired?: boolean;
  isFilterable?: boolean;
  options?: string[];
}
