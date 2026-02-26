import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface UserActivityLogsParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface UserActivityLogsQuery {
  activityType?: QueryScalar;
  userId?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface UserActivityLogsBody {
  [key: string]: unknown;
}

export interface UserActivityLogsRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface UserActivityLogsRequestShape {
  params: UserActivityLogsParams;
  query: UserActivityLogsQuery;
  body: UserActivityLogsBody;
}

export type UserActivityLogsRequest = Request<
  UserActivityLogsParams,
  unknown,
  UserActivityLogsBody,
  UserActivityLogsQuery
> &
  UserActivityLogsRequestContext;

export interface UserActivityLogsEntity {
  [key: string]: unknown;
}

export interface UserActivityLogsServiceInput {
  [key: string]: unknown;
}

export type UserActivityLogsServiceResult<T = unknown> = ServiceResult<T>;

export interface UserActivityLogsRepoFilter {
  [key: string]: unknown;
}

export interface UserActivityLogsRepoUpdate {
  [key: string]: unknown;
}

export interface UserActivityLogsValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type ActivityLogType =
  | 'login'
  | 'logout'
  | 'register'
  | 'password_change'
  | 'profile_update'
  | 'order_placed'
  | 'order_cancelled'
  | 'review_submitted'
  | 'address_added'
  | 'wishlist_add'
  | 'wishlist_remove';

export interface UserActivityLogRecord {
  _id: string;
  userId: string;
  activityType: ActivityLogType;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  createdAt: Date;
}

