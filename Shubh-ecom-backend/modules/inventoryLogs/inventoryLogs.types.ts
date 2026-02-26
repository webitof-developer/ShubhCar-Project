import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface InventoryLogsParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface InventoryLogsQuery {
  changeType?: QueryScalar;
  productId?: QueryScalar;
  referenceId?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface InventoryLogsBody {
  [key: string]: unknown;
}

export interface InventoryLogsRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface InventoryLogsRequestShape {
  params: InventoryLogsParams;
  query: InventoryLogsQuery;
  body: InventoryLogsBody;
}

export type InventoryLogsRequest = Request<
  InventoryLogsParams,
  unknown,
  InventoryLogsBody,
  InventoryLogsQuery
> &
  InventoryLogsRequestContext;

export interface InventoryLogsEntity {
  [key: string]: unknown;
}

export interface InventoryLogsServiceInput {
  [key: string]: unknown;
}

export type InventoryLogsServiceResult<T = unknown> = ServiceResult<T>;

export interface InventoryLogsRepoFilter {
  [key: string]: unknown;
}

export interface InventoryLogsRepoUpdate {
  [key: string]: unknown;
}

export interface InventoryLogsValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type InventoryChangeType =
  | 'increase'
  | 'decrease'
  | 'order'
  | 'cancel'
  | 'admin_adjust';

export interface InventoryLogRecord {
  _id: string;
  productId: string;
  changeType: InventoryChangeType;
  quantityChanged: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  note: string;
  createdAt: Date;
}

