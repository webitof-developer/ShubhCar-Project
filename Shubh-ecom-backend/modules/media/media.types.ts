import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface MediaServiceInput {
  [key: string]: any;
}

export type MediaServiceResult<T = any> = Promise<T>;

export interface MediaRepoFilter {
  [key: string]: any;
}

export interface MediaRepoUpdate {
  [key: string]: any;
}

export interface MediaValidatorInput {
  [key: string]: any;
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
