import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

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
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
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
  [key: string]: unknown;
}

export interface SalesReportsServiceInput {
  [key: string]: unknown;
}

export type SalesReportsServiceResult<T = unknown> = ServiceResult<T>;

export interface SalesReportsRepoFilter {
  [key: string]: unknown;
}

export interface SalesReportsRepoUpdate {
  [key: string]: unknown;
}

export interface SalesReportsValidatorInput {
  [key: string]: unknown;
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

