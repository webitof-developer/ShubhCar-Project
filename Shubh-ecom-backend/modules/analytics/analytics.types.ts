import type { Request } from 'express';
import type { AuthenticatedUser, ServiceResult } from '../../types/modules/common';

export type QueryScalar = string | number | boolean | null | undefined;

export interface AnalyticsParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface AnalyticsQuery {
  from?: QueryScalar;
  limit?: QueryScalar;
  page?: QueryScalar;
  range?: QueryScalar;
  salesmanId?: QueryScalar;
  threshold?: QueryScalar;
  to?: QueryScalar;
  [key: string]: QueryScalar | unknown;
}

export interface AnalyticsBody {
  [key: string]: unknown;
}

export interface AnalyticsRequestContext {
  user: AuthenticatedUser;
  id?: string;
  sessionId?: string;
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | Record<string, Express.Multer.File[]>;
  [key: string]: unknown;
}

export interface AnalyticsRequestShape {
  params: AnalyticsParams;
  query: AnalyticsQuery;
  body: AnalyticsBody;
}

export type AnalyticsRequest = Request<
  AnalyticsParams,
  unknown,
  AnalyticsBody,
  AnalyticsQuery
> &
  AnalyticsRequestContext;

export interface AnalyticsEntity {
  [key: string]: unknown;
}

export interface AnalyticsServiceInput {
  [key: string]: unknown;
}

export type AnalyticsServiceResult<T = unknown> = ServiceResult<T>;

export interface AnalyticsRepoFilter {
  [key: string]: unknown;
}

export interface AnalyticsRepoUpdate {
  [key: string]: unknown;
}

export interface AnalyticsValidatorInput {
  [key: string]: unknown;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface AnalyticsDateRange {
  from?: string | Date;
  to?: string | Date;
  range?: 'today' | '7d' | '30d' | '90d' | 'custom';
}

export interface TopProductStat {
  productId: string;
  name: string;
  totalSold: number;
  revenue: number;
}

export interface SalesmanStat {
  salesmanId: string;
  name: string;
  ordersCount: number;
  revenue: number;
  commissionsTotal: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  totalCustomers: number;
  conversionRate?: number;
  topProducts?: TopProductStat[];
  revenueByDay?: RevenuePoint[];
}

