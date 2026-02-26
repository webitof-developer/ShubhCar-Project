import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface WishlistParams {
  id?: string;
  productId?: string;
  [key: string]: string | undefined;
}

export interface WishlistQuery {
  [key: string]: QueryScalar | unknown;
}

export interface WishlistBody {
  productId?: unknown;
  [key: string]: unknown;
}

export interface WishlistRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface WishlistRequestShape {
  params: WishlistParams;
  query: WishlistQuery;
  body: WishlistBody;
}

export type WishlistRequest = Request<
  WishlistParams,
  unknown,
  WishlistBody,
  WishlistQuery
> &
  WishlistRequestContext;

export interface WishlistEntity {
  [key: string]: unknown;
}

export interface WishlistServiceInput {
  [key: string]: unknown;
}

export type WishlistServiceResult<T = unknown> = ServiceResult<T>;

export interface WishlistRepoFilter {
  [key: string]: unknown;
}

export interface WishlistRepoUpdate {
  [key: string]: unknown;
}

export interface WishlistValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface WishlistRecord {
  _id: string;
  userId: string;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddToWishlistInput {
  productId: string;
}

export interface WishlistItem extends WishlistRecord {
  product?: {
    _id: string;
    name: string;
    slug: string;
    retailPrice?: { mrp: number; salePrice?: number };
    status?: string;
  };
}

