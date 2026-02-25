import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface SalesReportsParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface SalesReportsQuery {
  date?: QueryScalar;
  from?: QueryScalar;
  limit?: QueryScalar;
  page?: QueryScalar;
  salesmanId?: QueryScalar;
  to?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface SalesReportsBody {
  date?: unknown;
  platformCommission?: unknown;
  totalOrders?: unknown;
  totalSales?: unknown;
  totalUnitsSold?: unknown;
  [key: string]: unknown;
}

export interface SalesReportsRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface SalesReportsRequestShape {
  params: SalesReportsParams;
  query: SalesReportsQuery;
  body: SalesReportsBody;
}

export type SalesReportsRequest = Request<
  SalesReportsParams,
  unknown,
  SalesReportsBody,
  SalesReportsQuery
> &
  SalesReportsRequestContext;

export interface SalesReportsEntity {
  [key: string]: any;
}

export interface SalesReportsServiceInput {
  [key: string]: any;
}

export type SalesReportsServiceResult<T = any> = Promise<T>;

export interface SalesReportsRepoFilter {
  [key: string]: any;
}

export interface SalesReportsRepoUpdate {
  [key: string]: any;
}

export interface SalesReportsValidatorInput {
  [key: string]: any;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface CommissionStat {
  salesmanId: string;
  salesmanName?: string;
  ordersCount: number;
  totalSales: number;
  commissionPercent: number;
  commissionAmount: number;
}

export interface SalesReportRecord {
  _id?: string;
  date: string;
  totalOrders: number;
  totalSales: number;
  totalUnitsSold: number;
  platformCommission: number;
  createdAt?: Date;
}

export interface SalesReportSummary {
  period: { from: string; to: string };
  totalRevenue: number;
  totalOrders: number;
  commissions: CommissionStat[];
}
