import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

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
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
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
  [key: string]: unknown;
}

export interface ReviewsServiceInput {
  [key: string]: unknown;
}

export type ReviewsServiceResult<T = unknown> = ServiceResult<T>;

export interface ReviewsRepoFilter {
  [key: string]: unknown;
}

export interface ReviewsRepoUpdate {
  [key: string]: unknown;
}

export interface ReviewsValidatorInput {
  [key: string]: unknown;
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

