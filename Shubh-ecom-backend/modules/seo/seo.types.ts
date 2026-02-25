import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface SeoParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface SeoQuery {
  entityId?: QueryScalar;
  entityType?: QueryScalar;
  slug?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface SeoBody {
  canonicalUrl?: unknown;
  entityId?: unknown;
  entityType?: unknown;
  metaDescription?: unknown;
  metaKeywords?: unknown;
  metaTitle?: unknown;
  ogImage?: unknown;
  robots?: unknown;
  slug?: unknown;
  [key: string]: unknown;
}

export interface SeoRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface SeoRequestShape {
  params: SeoParams;
  query: SeoQuery;
  body: SeoBody;
}

export type SeoRequest = Request<SeoParams, unknown, SeoBody, SeoQuery> &
  SeoRequestContext;

export interface SeoEntity {
  [key: string]: any;
}

export interface SeoServiceInput {
  [key: string]: any;
}

export type SeoServiceResult<T = any> = Promise<T>;

export interface SeoRepoFilter {
  [key: string]: any;
}

export interface SeoRepoUpdate {
  [key: string]: any;
}

export interface SeoValidatorInput {
  [key: string]: any;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type SeoEntityType = 'product' | 'category' | 'brand' | 'page' | 'blog';
export type SeoRobotsDirective =
  | 'index,follow'
  | 'noindex,follow'
  | 'noindex,nofollow'
  | 'index,nofollow';

export interface SeoRecord {
  _id: string;
  entityType: SeoEntityType;
  entityId: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  robots?: SeoRobotsDirective;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertSeoInput {
  entityType: SeoEntityType;
  entityId: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  robots?: SeoRobotsDirective;
}
