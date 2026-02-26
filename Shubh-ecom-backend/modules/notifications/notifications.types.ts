import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

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
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
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
  [key: string]: unknown;
}

export interface NotificationsServiceInput {
  [key: string]: unknown;
}

export type NotificationsServiceResult<T = unknown> = ServiceResult<T>;

export interface NotificationsRepoFilter {
  [key: string]: unknown;
}

export interface NotificationsRepoUpdate {
  [key: string]: unknown;
}

export interface NotificationsValidatorInput {
  [key: string]: unknown;
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

