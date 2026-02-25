import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface AuditServiceInput {
  [key: string]: any;
}

export type AuditServiceResult<T = any> = Promise<T>;

export interface AuditRepoFilter {
  [key: string]: any;
}

export interface AuditRepoUpdate {
  [key: string]: any;
}

export interface AuditValidatorInput {
  [key: string]: any;
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
