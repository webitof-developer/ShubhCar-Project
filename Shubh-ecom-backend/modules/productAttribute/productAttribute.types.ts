import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

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
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
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
  [key: string]: unknown;
}

export interface ProductAttributeServiceInput {
  [key: string]: unknown;
}

export type ProductAttributeServiceResult<T = unknown> = ServiceResult<T>;

export interface ProductAttributeRepoFilter {
  [key: string]: unknown;
}

export interface ProductAttributeRepoUpdate {
  [key: string]: unknown;
}

export interface ProductAttributeValidatorInput {
  [key: string]: unknown;
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

