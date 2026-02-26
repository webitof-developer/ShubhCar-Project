import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface CartParams {
  id?: string;
  itemId?: string;
  [key: string]: string | undefined;
}

export interface CartQuery {
  [key: string]: QueryScalar | unknown;
}

export interface CartBody {
  code?: unknown;
  productId?: unknown;
  quantity?: unknown;
  [key: string]: unknown;
}

export interface CartRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface CartRequestShape {
  params: CartParams;
  query: CartQuery;
  body: CartBody;
}

export type CartRequest = Request<CartParams, unknown, CartBody, CartQuery> &
  CartRequestContext;

export interface CartEntity {
  [key: string]: unknown;
}

export interface CartServiceInput {
  [key: string]: unknown;
}

export type CartServiceResult<T = unknown> = ServiceResult<T>;

export interface CartRepoFilter {
  [key: string]: unknown;
}

export interface CartRepoUpdate {
  [key: string]: unknown;
}

export interface CartValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface CartRecord {
  _id: string;
  userId?: string;
  sessionId?: string;
  couponId?: string | null;
  couponCode?: string | null;
  discountAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CartPriceType = 'retail' | 'wholesale';

export interface CartItemRecord {
  _id: string;
  cartId: string;
  productId: string;
  sku: string;
  quantity: number;
  priceType: CartPriceType;
  priceAtTime: number;
  addedAt: Date;
}

export interface AddToCartInput {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface ApplyCouponInput {
  code: string;
}

