import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface UserActivityLogsServiceInput {
  [key: string]: any;
}

export type UserActivityLogsServiceResult<T = any> = Promise<T>;

export interface UserActivityLogsRepoFilter {
  [key: string]: any;
}

export interface UserActivityLogsRepoUpdate {
  [key: string]: any;
}

export interface UserActivityLogsValidatorInput {
  [key: string]: any;
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
