import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface OrderItemsParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface OrderItemsQuery {
  [key: string]: QueryScalar | unknown;
}

export interface OrderItemsBody {
  status?: unknown;
  [key: string]: unknown;
}

export interface OrderItemsRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface OrderItemsRequestShape {
  params: OrderItemsParams;
  query: OrderItemsQuery;
  body: OrderItemsBody;
}

export type OrderItemsRequest = Request<
  OrderItemsParams,
  unknown,
  OrderItemsBody,
  OrderItemsQuery
> &
  OrderItemsRequestContext;

export interface OrderItemsEntity {
  [key: string]: unknown;
}

export interface OrderItemsServiceInput {
  [key: string]: unknown;
}

export type OrderItemsServiceResult<T = unknown> = ServiceResult<T>;

export interface OrderItemsRepoFilter {
  [key: string]: unknown;
}

export interface OrderItemsRepoUpdate {
  [key: string]: unknown;
}

export interface OrderItemsValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type OrderItemStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type OrderItemTaxMode = 'intra' | 'inter';

export interface TaxComponents {
  cgst: number;
  sgst: number;
  igst: number;
}

export interface OrderItemRecord {
  _id: string;
  orderId: string;
  productId: string;
  productName: string;
  productSlug?: string;
  productImage?: string;
  productDescription?: string;
  sku?: string;
  hsnCode?: string;
  quantity: number;
  price: number;
  discount: number;
  taxableAmount: number;
  taxPercent: number;
  taxAmount: number;
  taxComponents: TaxComponents;
  taxMode?: OrderItemTaxMode;
  shippingShare: number;
  total: number;
  status: OrderItemStatus;
  createdAt: Date;
  updatedAt: Date;
}

