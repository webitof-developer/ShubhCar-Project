import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

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
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
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
  [key: string]: unknown;
}

export interface PaymentsServiceInput {
  [key: string]: unknown;
}

export type PaymentsServiceResult<T = unknown> = ServiceResult<T>;

export interface PaymentsRepoFilter {
  [key: string]: unknown;
}

export interface PaymentsRepoUpdate {
  [key: string]: unknown;
}

export interface PaymentsValidatorInput {
  [key: string]: unknown;
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

