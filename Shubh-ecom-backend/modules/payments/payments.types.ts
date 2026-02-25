import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface PaymentsParams {
  id?: string;
  paymentId?: string;
  [key: string]: string | undefined;
}

export interface PaymentsQuery {
  [key: string]: QueryScalar | unknown;
}

export interface PaymentsBody {
  amount?: unknown;
  gateway?: unknown;
  orderId?: unknown;
  reason?: unknown;
  transactionId?: unknown;
  [key: string]: unknown;
}

export interface PaymentsRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface PaymentsRequestShape {
  params: PaymentsParams;
  query: PaymentsQuery;
  body: PaymentsBody;
}

export type PaymentsRequest = Request<
  PaymentsParams,
  unknown,
  PaymentsBody,
  PaymentsQuery
> &
  PaymentsRequestContext;

export interface PaymentsEntity {
  [key: string]: any;
}

export interface PaymentsServiceInput {
  [key: string]: any;
}

export type PaymentsServiceResult<T = any> = Promise<T>;

export interface PaymentsRepoFilter {
  [key: string]: any;
}

export interface PaymentsRepoUpdate {
  [key: string]: any;
}

export interface PaymentsValidatorInput {
  [key: string]: any;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type PaymentGateway = 'stripe' | 'razorpay';

export type PaymentRecordStatus =
  | 'created'
  | 'success'
  | 'failed'
  | 'refunded'
  | 'partially_refunded'
  | 'manual_review';

export interface PaymentRecord {
  _id: string;
  orderId: string;
  paymentGateway: PaymentGateway;
  transactionId?: string | null;
  gatewayOrderId?: string | null;
  amount: number;
  currency: string;
  refundAmount: number;
  status: PaymentRecordStatus;
  suspicious: boolean;
  fraudScore?: number;
  failureReason?: string;
  metadata?: Record<string, unknown>;
  gatewayResponse?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentInput {
  orderId: string;
  paymentGateway: PaymentGateway;
  amount: number;
  currency?: string;
  transactionId?: string;
  gatewayOrderId?: string;
}

/** Context passed to payment service methods */
export interface PaymentServiceContext {
  requestId?: string;
  route?: string;
  method?: string;
  userId?: string;
}
