import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface OrdersParams {
  id?: string;
  orderId?: string;
  [key: string]: string | undefined;
}

export interface OrdersQuery {
  customerType?: QueryScalar;
  from?: QueryScalar;
  includeItems?: QueryScalar;
  paymentStatus?: QueryScalar;
  productType?: QueryScalar;
  search?: QueryScalar;
  status?: QueryScalar;
  summary?: QueryScalar;
  to?: QueryScalar;
  userId?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface OrdersBody {
  amount?: unknown;
  billingAddressId?: unknown;
  city?: unknown;
  checkoutDraftId?: unknown;
  country?: unknown;
  couponCode?: unknown;
  discountPercent?: unknown;
  fraudFlag?: unknown;
  fraudReason?: unknown;
  fullName?: unknown;
  gateway?: unknown;
  is?: unknown;
  line1?: unknown;
  line2?: unknown;
  manualDiscount?: unknown;
  note?: unknown;
  otherwise?: unknown;
  paymentCompleted?: unknown;
  paymentMethod?: unknown;
  phone?: unknown;
  postalCode?: unknown;
  reason?: unknown;
  salesmanId?: unknown;
  shippingAddress?: unknown;
  shippingAddressId?: unknown;
  shippingFee?: unknown;
  state?: unknown;
  status?: unknown;
  taxPercent?: unknown;
  then?: unknown;
  userId?: unknown;
  [key: string]: unknown;
}

export interface OrdersRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface OrdersRequestShape {
  params: OrdersParams;
  query: OrdersQuery;
  body: OrdersBody;
}

export type OrdersRequest = Request<
  OrdersParams,
  unknown,
  OrdersBody,
  OrdersQuery
> &
  OrdersRequestContext;

export interface OrdersEntity {
  [key: string]: unknown;
}

export interface OrdersServiceInput {
  [key: string]: unknown;
}

export type OrdersServiceResult<T = unknown> = ServiceResult<T>;

export interface OrdersRepoFilter {
  [key: string]: unknown;
}

export interface OrdersRepoUpdate {
  [key: string]: unknown;
}

export interface OrdersValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'created'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'partially_paid'
  | 'paid'
  | 'failed'
  | 'refunded';

export type PaymentMethod = 'cod' | 'razorpay' | 'stripe';

export interface TaxBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
}

export interface OrderShipmentSnapshot {
  carrier?: string;
  trackingNumber?: string;
  shippedAt?: Date;
  estimatedDeliveryDate?: Date;
}

export interface OrderRecord {
  _id: string;
  userId: string;
  shippingAddressId: string;
  billingAddressId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  grandTotal: number;
  taxAmount: number;
  taxBreakdown: TaxBreakdown;
  shippingFee: number;
  discountAmount: number;
  discountPercent: number;
  couponId?: string;
  couponCode?: string;
  totalItems: number;
  salesmanId?: string;
  commissionPercent: number;
  commissionAmount: number;
  fraudFlag: boolean;
  fraudReason?: string | null;
  isDeleted: boolean;
  isLocked: boolean;
  placedAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  shipment?: OrderShipmentSnapshot;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaceOrderInput {
  shippingAddressId: string;
  billingAddressId: string;
  paymentMethod: PaymentMethod;
  checkoutDraftId?: string;
  gateway?: string;
  paymentCompleted?: boolean;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  reason?: string;
  note?: string;
}

/** Context passed to service methods from controller/workers */
export interface OrderServiceContext {
  requestId?: string;
  route?: string;
  method?: string;
  userId?: string;
  actor?: { type: string; id?: string };
}

