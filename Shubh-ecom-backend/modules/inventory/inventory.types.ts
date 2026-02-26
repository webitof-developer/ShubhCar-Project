import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

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
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
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
  [key: string]: unknown;
}

export interface InventoryServiceInput {
  [key: string]: unknown;
}

export type InventoryServiceResult<T = unknown> = ServiceResult<T>;

export interface InventoryRepoFilter {
  [key: string]: unknown;
}

export interface InventoryRepoUpdate {
  [key: string]: unknown;
}

export interface InventoryValidatorInput {
  [key: string]: unknown;
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

