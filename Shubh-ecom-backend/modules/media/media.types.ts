import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface MediaParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface MediaQuery {
  limit?: QueryScalar;
  page?: QueryScalar;
  usedIn?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface MediaBody {
  bucket?: unknown;
  folder?: unknown;
  height?: unknown;
  key?: unknown;
  mimeType?: unknown;
  size?: unknown;
  url?: unknown;
  usedIn?: unknown;
  width?: unknown;
  [key: string]: unknown;
}

export interface MediaRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface MediaRequestShape {
  params: MediaParams;
  query: MediaQuery;
  body: MediaBody;
}

export type MediaRequest = Request<
  MediaParams,
  unknown,
  MediaBody,
  MediaQuery
> &
  MediaRequestContext;

export interface MediaEntity {
  [key: string]: unknown;
}

export interface MediaServiceInput {
  [key: string]: unknown;
}

export type MediaServiceResult<T = unknown> = ServiceResult<T>;

export interface MediaRepoFilter {
  [key: string]: unknown;
}

export interface MediaRepoUpdate {
  [key: string]: unknown;
}

export interface MediaValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type MediaFileType = 'image' | 'video' | 'document' | 'pdf' | 'other';
export type MediaUsedIn =
  | 'product'
  | 'category'
  | 'brand'
  | 'blog'
  | 'page'
  | 'other';

export interface MediaRecord {
  _id: string;
  key: string;
  url: string;
  bucket?: string;
  folder?: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  usedIn?: MediaUsedIn;
  uploadedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadMediaInput {
  key: string;
  url: string;
  mimeType: string;
  size: number;
  bucket?: string;
  folder?: string;
  usedIn?: MediaUsedIn;
}

