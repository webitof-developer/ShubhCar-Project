import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface ReviewsParams {
  id?: string;
  orderId?: string;
  productId?: string;
  reviewId?: string;
  [key: string]: string | undefined;
}

export interface ReviewsQuery {
  [key: string]: QueryScalar | unknown;
}

export interface ReviewsBody {
  comment?: unknown;
  productId?: unknown;
  rating?: unknown;
  status?: unknown;
  title?: unknown;
  [key: string]: unknown;
}

export interface ReviewsRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface ReviewsRequestShape {
  params: ReviewsParams;
  query: ReviewsQuery;
  body: ReviewsBody;
}

export type ReviewsRequest = Request<
  ReviewsParams,
  unknown,
  ReviewsBody,
  ReviewsQuery
> &
  ReviewsRequestContext;

export interface ReviewsEntity {
  [key: string]: any;
}

export interface ReviewsServiceInput {
  [key: string]: any;
}

export type ReviewsServiceResult<T = any> = Promise<T>;

export interface ReviewsRepoFilter {
  [key: string]: any;
}

export interface ReviewsRepoUpdate {
  [key: string]: any;
}

export interface ReviewsValidatorInput {
  [key: string]: any;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewRecord {
  _id: string;
  userId: string;
  productId: string;
  orderId: string;
  orderItemId?: string;
  rating: number;
  title?: string;
  comment?: string;
  status: ReviewStatus;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewInput {
  productId: string;
  orderId: string;
  rating: number;
  title?: string;
  comment?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  comment?: string;
}
