import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface OrderReviewServiceInput {
  [key: string]: any;
}

export type OrderReviewServiceResult<T = any> = Promise<T>;

export interface OrderReviewRepoFilter {
  [key: string]: any;
}

export interface OrderReviewRepoUpdate {
  [key: string]: any;
}

export interface OrderReviewValidatorInput {
  [key: string]: any;
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
