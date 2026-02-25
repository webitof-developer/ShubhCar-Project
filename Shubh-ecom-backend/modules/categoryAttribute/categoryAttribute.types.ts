import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface CategoryAttributeParams {
  id?: string;
  attributeId?: string;
  categoryId?: string;
  [key: string]: string | undefined;
}

export interface CategoryAttributeQuery {
  [key: string]: QueryScalar | unknown;
}

export interface CategoryAttributeBody {
  [key: string]: unknown;
}

export interface CategoryAttributeRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface CategoryAttributeRequestShape {
  params: CategoryAttributeParams;
  query: CategoryAttributeQuery;
  body: CategoryAttributeBody;
}

export type CategoryAttributeRequest = Request<
  CategoryAttributeParams,
  unknown,
  CategoryAttributeBody,
  CategoryAttributeQuery
> &
  CategoryAttributeRequestContext;

export interface CategoryAttributeEntity {
  [key: string]: any;
}

export interface CategoryAttributeServiceInput {
  [key: string]: any;
}

export type CategoryAttributeServiceResult<T = any> = Promise<T>;

export interface CategoryAttributeRepoFilter {
  [key: string]: any;
}

export interface CategoryAttributeRepoUpdate {
  [key: string]: any;
}

export interface CategoryAttributeValidatorInput {
  [key: string]: any;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface CategoryAttributeRecord {
  _id: string;
  categoryId: string;
  attributeId: string;
  isRequired: boolean;
  isFilterable: boolean;
  displayOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddCategoryAttributeInput {
  categoryId: string;
  attributeId: string;
  isRequired?: boolean;
  isFilterable?: boolean;
  displayOrder?: number;
}
