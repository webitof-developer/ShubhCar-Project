import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface WishlistServiceInput {
  [key: string]: any;
}

export type WishlistServiceResult<T = any> = Promise<T>;

export interface WishlistRepoFilter {
  [key: string]: any;
}

export interface WishlistRepoUpdate {
  [key: string]: any;
}

export interface WishlistValidatorInput {
  [key: string]: any;
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
