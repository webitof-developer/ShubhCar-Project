import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface PagesServiceInput {
  [key: string]: any;
}

export type PagesServiceResult<T = any> = Promise<T>;

export interface PagesRepoFilter {
  [key: string]: any;
}

export interface PagesRepoUpdate {
  [key: string]: any;
}

export interface PagesValidatorInput {
  [key: string]: any;
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
