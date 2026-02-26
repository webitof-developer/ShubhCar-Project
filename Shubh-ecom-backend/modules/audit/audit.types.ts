import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface AuditParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface AuditQuery {
  [key: string]: QueryScalar | unknown;
}

export interface AuditBody {
  [key: string]: unknown;
}

export interface AuditRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface AuditRequestShape {
  params: AuditParams;
  query: AuditQuery;
  body: AuditBody;
}

export type AuditRequest = Request<
  AuditParams,
  unknown,
  AuditBody,
  AuditQuery
> &
  AuditRequestContext;

export interface AuditEntity {
  [key: string]: unknown;
}

export interface AuditServiceInput {
  [key: string]: unknown;
}

export type AuditServiceResult<T = unknown> = ServiceResult<T>;

export interface AuditRepoFilter {
  [key: string]: unknown;
}

export interface AuditRepoUpdate {
  [key: string]: unknown;
}

export interface AuditValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface AuditActor {
  id: string;
  role: string;
}

export interface AuditTarget {
  orderId?: string;
  productId?: string;
  userId?: string;
  [key: string]: string | undefined;
}

export interface AuditLogInput {
  actor: AuditActor;
  action: string;
  target: AuditTarget;
  meta?: Record<string, unknown>;
}

export interface AuditLogRecord {
  actor: AuditActor;
  action: string;
  target: AuditTarget;
  meta: Record<string, unknown>;
  timestamp: string;
}

