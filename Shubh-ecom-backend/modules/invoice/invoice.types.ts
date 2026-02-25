import type { Request } from 'express';

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
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
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
  [key: string]: any;
}

export interface InvoiceServiceInput {
  [key: string]: any;
}

export type InvoiceServiceResult<T = any> = Promise<T>;

export interface InvoiceRepoFilter {
  [key: string]: any;
}

export interface InvoiceRepoUpdate {
  [key: string]: any;
}

export interface InvoiceValidatorInput {
  [key: string]: any;
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
