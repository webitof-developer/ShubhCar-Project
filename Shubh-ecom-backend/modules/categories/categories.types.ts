import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface CategoriesParams {
  id?: string;
  parentId?: string;
  slug?: string;
  [key: string]: string | undefined;
}

export interface CategoriesQuery {
  [key: string]: QueryScalar | unknown;
}

export interface CategoriesBody {
  description?: unknown;
  iconUrl?: unknown;
  imageUrl?: unknown;
  isActive?: unknown;
  name?: unknown;
  parentId?: unknown;
  slug?: unknown;
  [key: string]: unknown;
}

export interface CategoriesRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface CategoriesRequestShape {
  params: CategoriesParams;
  query: CategoriesQuery;
  body: CategoriesBody;
}

export type CategoriesRequest = Request<
  CategoriesParams,
  unknown,
  CategoriesBody,
  CategoriesQuery
> &
  CategoriesRequestContext;

export interface CategoriesEntity {
  [key: string]: any;
}

export interface CategoriesServiceInput {
  [key: string]: any;
}

export type CategoriesServiceResult<T = any> = Promise<T>;

export interface CategoriesRepoFilter {
  [key: string]: any;
}

export interface CategoriesRepoUpdate {
  [key: string]: any;
}

export interface CategoriesValidatorInput {
  [key: string]: any;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface CategoryRecord {
  _id: string;
  name: string;
  slug: string;
  categoryCode?: string;
  parentId?: string | null;
  iconUrl?: string;
  imageUrl?: string;
  description?: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  parentId?: string;
  description?: string;
  iconUrl?: string;
  imageUrl?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  iconUrl?: string;
  imageUrl?: string;
}
