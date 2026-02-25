import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface NotificationsParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface NotificationsQuery {
  [key: string]: QueryScalar | unknown;
}

export interface NotificationsBody {
  audience?: unknown;
  message?: unknown;
  metadata?: unknown;
  status?: unknown;
  title?: unknown;
  type?: unknown;
  userId?: unknown;
  [key: string]: unknown;
}

export interface NotificationsRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface NotificationsRequestShape {
  params: NotificationsParams;
  query: NotificationsQuery;
  body: NotificationsBody;
}

export type NotificationsRequest = Request<
  NotificationsParams,
  unknown,
  NotificationsBody,
  NotificationsQuery
> &
  NotificationsRequestContext;

export interface NotificationsEntity {
  [key: string]: any;
}

export interface NotificationsServiceInput {
  [key: string]: any;
}

export type NotificationsServiceResult<T = any> = Promise<T>;

export interface NotificationsRepoFilter {
  [key: string]: any;
}

export interface NotificationsRepoUpdate {
  [key: string]: any;
}

export interface NotificationsValidatorInput {
  [key: string]: any;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type NotificationType = 'email' | 'sms' | 'inapp';
export type NotificationAudience = 'user' | 'admin';
export type NotificationStatus = 'unread' | 'read';

export interface NotificationRecord {
  _id: string;
  userId?: string;
  type: NotificationType;
  audience: NotificationAudience;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  status: NotificationStatus;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationInput {
  userId?: string;
  type: NotificationType;
  audience?: NotificationAudience;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface MarkReadInput {
  notificationId: string;
}
