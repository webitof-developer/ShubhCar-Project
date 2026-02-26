import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface OrderReviewParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface OrderReviewQuery {
  [key: string]: QueryScalar | unknown;
}

export interface OrderReviewBody {
  [key: string]: unknown;
}

export interface OrderReviewRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface OrderReviewRequestShape {
  params: OrderReviewParams;
  query: OrderReviewQuery;
  body: OrderReviewBody;
}

export type OrderReviewRequest = Request<
  OrderReviewParams,
  unknown,
  OrderReviewBody,
  OrderReviewQuery
> &
  OrderReviewRequestContext;

export interface OrderReviewEntity {
  [key: string]: unknown;
}

export interface OrderReviewServiceInput {
  [key: string]: unknown;
}

export type OrderReviewServiceResult<T = unknown> = ServiceResult<T>;

export interface OrderReviewRepoFilter {
  [key: string]: unknown;
}

export interface OrderReviewRepoUpdate {
  [key: string]: unknown;
}

export interface OrderReviewValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type OrderReviewRating = 1 | 2 | 3 | 4 | 5;

export interface OrderReviewRecord {
  _id: string;
  orderId: string;
  userId: string;
  rating: OrderReviewRating;
  comment?: string;
  deliveryRating?: OrderReviewRating;
  packagingRating?: OrderReviewRating;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderReviewInput {
  orderId: string;
  rating: OrderReviewRating;
  comment?: string;
  deliveryRating?: OrderReviewRating;
  packagingRating?: OrderReviewRating;
}

