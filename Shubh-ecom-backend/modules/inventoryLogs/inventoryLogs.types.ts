import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface InventoryLogsServiceInput {
  [key: string]: any;
}

export type InventoryLogsServiceResult<T = any> = Promise<T>;

export interface InventoryLogsRepoFilter {
  [key: string]: any;
}

export interface InventoryLogsRepoUpdate {
  [key: string]: any;
}

export interface InventoryLogsValidatorInput {
  [key: string]: any;
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
