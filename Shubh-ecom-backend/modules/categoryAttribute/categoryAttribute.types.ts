import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

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
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
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
  [key: string]: unknown;
}

export interface CategoryAttributeServiceInput {
  [key: string]: unknown;
}

export type CategoryAttributeServiceResult<T = unknown> = ServiceResult<T>;

export interface CategoryAttributeRepoFilter {
  [key: string]: unknown;
}

export interface CategoryAttributeRepoUpdate {
  [key: string]: unknown;
}

export interface CategoryAttributeValidatorInput {
  [key: string]: unknown;
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

