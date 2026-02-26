import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface InvoiceParams {
  id?: string;
  orderId?: string;
  [key: string]: string | undefined;
}

export interface InvoiceQuery {
  download?: QueryScalar;
  limit?: QueryScalar;
  page?: QueryScalar;
  type?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface InvoiceBody {
  [key: string]: unknown;
}

export interface InvoiceRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface InvoiceRequestShape {
  params: InvoiceParams;
  query: InvoiceQuery;
  body: InvoiceBody;
}

export type InvoiceRequest = Request<
  InvoiceParams,
  unknown,
  InvoiceBody,
  InvoiceQuery
> &
  InvoiceRequestContext;

export interface InvoiceEntity {
  [key: string]: unknown;
}

export interface InvoiceServiceInput {
  [key: string]: unknown;
}

export type InvoiceServiceResult<T = unknown> = ServiceResult<T>;

export interface InvoiceRepoFilter {
  [key: string]: unknown;
}

export interface InvoiceRepoUpdate {
  [key: string]: unknown;
}

export interface InvoiceValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export type InvoiceType = 'order' | 'credit_note' | 'proforma';

export interface InvoiceRecord {
  _id: string;
  orderId: string;
  userId?: string;
  type: InvoiceType;
  invoiceNumber: string;
  invoiceDate: Date;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateInvoiceInput {
  orderId: string;
  type?: InvoiceType;
}

