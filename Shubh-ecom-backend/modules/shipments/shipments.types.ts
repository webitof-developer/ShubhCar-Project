import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface ShipmentsParams {
  id?: string;
  orderId?: string;
  orderItemId?: string;
  [key: string]: string | undefined;
}

export interface ShipmentsQuery {
  [key: string]: QueryScalar | unknown;
}

export interface ShipmentsBody {
  carrierName?: unknown;
  deliveredAt?: unknown;
  estimatedDeliveryDate?: unknown;
  shippedAt?: unknown;
  shippingProviderId?: unknown;
  status?: unknown;
  trackingNumber?: unknown;
  trackingUrlFormat?: unknown;
  [key: string]: unknown;
}

export interface ShipmentsRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface ShipmentsRequestShape {
  params: ShipmentsParams;
  query: ShipmentsQuery;
  body: ShipmentsBody;
}

export type ShipmentsRequest = Request<
  ShipmentsParams,
  unknown,
  ShipmentsBody,
  ShipmentsQuery
> &
  ShipmentsRequestContext;

export interface ShipmentsEntity {
  [key: string]: any;
}

export interface ShipmentsServiceInput {
  [key: string]: any;
}

export type ShipmentsServiceResult<T = any> = Promise<T>;

export interface ShipmentsRepoFilter {
  [key: string]: any;
}

export interface ShipmentsRepoUpdate {
  [key: string]: any;
}

export interface ShipmentsValidatorInput {
  [key: string]: any;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type ShipmentStatus =
  | 'pending'
  | 'shipped'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface ShipmentStatusHistory {
  status: ShipmentStatus;
  timestamp: Date;
  note?: string;
}

export interface ShipmentRecord {
  _id: string;
  orderId: string;
  orderItemId: string;
  shippingProviderId?: string;
  carrierName?: string;
  trackingNumber?: string | null;
  trackingUrlFormat?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  estimatedDeliveryDate?: Date;
  status: ShipmentStatus;
  statusHistory: ShipmentStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShipmentInput {
  orderId: string;
  orderItemId: string;
  carrierName?: string;
  trackingNumber?: string;
  shippedAt?: string | Date;
  estimatedDeliveryDate?: string | Date;
}

export interface UpdateShipmentInput {
  status?: ShipmentStatus;
  trackingNumber?: string;
  deliveredAt?: string | Date;
}
