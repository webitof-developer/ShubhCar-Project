import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

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
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface SeoRequestShape {
  params: SeoParams;
  query: SeoQuery;
  body: SeoBody;
}

export type SeoRequest = Request<SeoParams, unknown, SeoBody, SeoQuery> &
  SeoRequestContext;

export interface SeoEntity {
  [key: string]: unknown;
}

export interface SeoServiceInput {
  [key: string]: unknown;
}

export type SeoServiceResult<T = unknown> = ServiceResult<T>;

export interface SeoRepoFilter {
  [key: string]: unknown;
}

export interface SeoRepoUpdate {
  [key: string]: unknown;
}

export interface SeoValidatorInput {
  [key: string]: unknown;
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

