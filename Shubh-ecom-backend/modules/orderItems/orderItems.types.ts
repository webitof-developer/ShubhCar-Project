import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface OrderItemsServiceInput {
  [key: string]: any;
}

export type OrderItemsServiceResult<T = any> = Promise<T>;

export interface OrderItemsRepoFilter {
  [key: string]: any;
}

export interface OrderItemsRepoUpdate {
  [key: string]: any;
}

export interface OrderItemsValidatorInput {
  [key: string]: any;
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
