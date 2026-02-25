import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface InventoryParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface InventoryQuery {
  search?: QueryScalar;
  status?: QueryScalar;
  threshold?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface InventoryBody {
  note?: unknown;
  productId?: unknown;
  quantity?: unknown;
  type?: unknown;
  [key: string]: unknown;
}

export interface InventoryRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface InventoryRequestShape {
  params: InventoryParams;
  query: InventoryQuery;
  body: InventoryBody;
}

export type InventoryRequest = Request<
  InventoryParams,
  unknown,
  InventoryBody,
  InventoryQuery
> &
  InventoryRequestContext;

export interface InventoryEntity {
  [key: string]: any;
}

export interface InventoryServiceInput {
  [key: string]: any;
}

export type InventoryServiceResult<T = any> = Promise<T>;

export interface InventoryRepoFilter {
  [key: string]: any;
}

export interface InventoryRepoUpdate {
  [key: string]: any;
}

export interface InventoryValidatorInput {
  [key: string]: any;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type InventoryChangeType =
  | 'increase'
  | 'decrease'
  | 'order'
  | 'cancel'
  | 'admin_adjust';

export interface AdjustInventoryInput {
  productId: string;
  quantityChange: number;
  changeType: InventoryChangeType;
  referenceId?: string;
  note?: string;
}

export interface ReleaseInventoryInput {
  productId: string;
  quantity: number;
  orderId?: string;
  note?: string;
}

export interface AdminInventoryAdjustInput {
  productId: string;
  newStock: number;
  note?: string;
}
