import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface AdminParams {
  id?: string;
  userId?: string;
  [key: string]: string | undefined;
}

export interface AdminQuery {
  [key: string]: QueryScalar | unknown;
}

export interface AdminBody {
  action?: unknown;
  is?: unknown;
  otherwise?: unknown;
  reason?: unknown;
  then?: unknown;
  [key: string]: unknown;
}

export interface AdminRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface AdminRequestShape {
  params: AdminParams;
  query: AdminQuery;
  body: AdminBody;
}

export type AdminRequest = Request<
  AdminParams,
  unknown,
  AdminBody,
  AdminQuery
> &
  AdminRequestContext;

export interface AdminEntity {
  [key: string]: unknown;
}

export interface AdminServiceInput {
  [key: string]: unknown;
}

export type AdminServiceResult<T = unknown> = ServiceResult<T>;

export interface AdminRepoFilter {
  [key: string]: unknown;
}

export interface AdminRepoUpdate {
  [key: string]: unknown;
}

export interface AdminValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type AdminActionType =
  | 'ban_user'
  | 'unban_user'
  | 'fraud_flag'
  | 'order_override'
  | 'refund_manual'
  | 'inventory_adjust';

export interface AdminLogRecord {
  _id: string;
  adminId: string;
  action: AdminActionType;
  targetType: string;
  targetId: string;
  reason?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

export interface BanUserInput {
  userId: string;
  reason?: string;
}

export interface UpdateFraudFlagInput {
  orderId: string;
  fraudFlag: boolean;
  fraudReason?: string;
}

