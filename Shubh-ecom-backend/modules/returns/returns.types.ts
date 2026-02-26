import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface ReturnsParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface ReturnsQuery {
  [key: string]: QueryScalar | unknown;
}

export interface ReturnsBody {
  adminNote?: unknown;
  items?: unknown;
  orderId?: unknown;
  orderItemId?: unknown;
  quantity?: unknown;
  reason?: unknown;
  status?: unknown;
  [key: string]: unknown;
}

export interface ReturnsRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface ReturnsRequestShape {
  params: ReturnsParams;
  query: ReturnsQuery;
  body: ReturnsBody;
}

export type ReturnsRequest = Request<
  ReturnsParams,
  unknown,
  ReturnsBody,
  ReturnsQuery
> &
  ReturnsRequestContext;

export interface ReturnsEntity {
  [key: string]: unknown;
}

export interface ReturnsServiceInput {
  [key: string]: unknown;
}

export type ReturnsServiceResult<T = unknown> = ServiceResult<T>;

export interface ReturnsRepoFilter {
  [key: string]: unknown;
}

export interface ReturnsRepoUpdate {
  [key: string]: unknown;
}

export interface ReturnsValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type ReturnItemStatus = 'pending' | 'rejected' | 'approved';

export interface ReturnItemRecord {
  orderItemId: string;
  quantity: number;
  reason: string;
  status: ReturnItemStatus;
}

export interface ReturnRequestRecord {
  _id: string;
  orderId: string;
  userId: string;
  items: ReturnItemRecord[];
  status: ReturnStatus;
  adminNote?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReturnInput {
  orderId: string;
  items: {
    orderItemId: string;
    quantity: number;
    reason: string;
  }[];
}

export interface AdminReturnDecisionInput {
  status: 'approved' | 'rejected';
  adminNote?: string;
}

