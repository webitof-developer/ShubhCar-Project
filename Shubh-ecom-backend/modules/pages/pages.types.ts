import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface PagesParams {
  id?: string;
  page?: string;
  seo?: string;
  slug?: string;
  [key: string]: string | undefined;
}

export interface PagesQuery {
  limit?: QueryScalar;
  page?: QueryScalar;
  slug?: QueryScalar;
  status?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface PagesBody {
  data?: unknown;
  metaDescription?: unknown;
  metaTitle?: unknown;
  sections?: unknown;
  slug?: unknown;
  status?: unknown;
  title?: unknown;
  type?: unknown;
  [key: string]: unknown;
}

export interface PagesRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface PagesRequestShape {
  params: PagesParams;
  query: PagesQuery;
  body: PagesBody;
}

export type PagesRequest = Request<
  PagesParams,
  unknown,
  PagesBody,
  PagesQuery
> &
  PagesRequestContext;

export interface PagesEntity {
  [key: string]: unknown;
}

export interface PagesServiceInput {
  [key: string]: unknown;
}

export type PagesServiceResult<T = unknown> = ServiceResult<T>;

export interface PagesRepoFilter {
  [key: string]: unknown;
}

export interface PagesRepoUpdate {
  [key: string]: unknown;
}

export interface PagesValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type PageStatus = 'draft' | 'published' | 'archived';
export type PageType =
  | 'landing'
  | 'about'
  | 'faq'
  | 'terms'
  | 'privacy'
  | 'custom';

export interface PageRecord {
  _id: string;
  title: string;
  slug: string;
  type: PageType;
  status: PageStatus;
  sections?: Record<string, unknown>[];
  data?: Record<string, unknown>;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePageInput {
  title: string;
  slug: string;
  type?: PageType;
  status?: PageStatus;
  sections?: Record<string, unknown>[];
  data?: Record<string, unknown>;
  metaTitle?: string;
  metaDescription?: string;
}

