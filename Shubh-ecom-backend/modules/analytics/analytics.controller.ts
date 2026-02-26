import type { Response } from 'express';
import type {
  AnalyticsRequest,
  AnalyticsQuery as RequestAnalyticsQuery,
  QueryScalar,
} from './analytics.types';
const asyncHandler = require('../../utils/asyncHandler');
const analyticsService = require('./analytics.service');
const { success } = require('../../utils/apiResponse');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const DEFAULT_THRESHOLD = 5;
const MAX_LIMIT = 100;
const MAX_PAGE = 100000;
const MAX_THRESHOLD = 100000;

type SanitizedAnalyticsQuery = Omit<
  RequestAnalyticsQuery,
  'limit' | 'page' | 'threshold' | 'from' | 'to'
> & {
  limit: number;
  page: number;
  threshold: number;
  from?: Date;
  to?: Date;
};

const toPositiveInt = (
  value: QueryScalar,
  fallback: number,
  min = 1,
  max = MAX_LIMIT,
) => {
  if (value === null || value === undefined) return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const toValidDate = (value: QueryScalar | Date | unknown) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return null;
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sanitizeAnalyticsQuery = (
  query: RequestAnalyticsQuery = {},
  { defaultLimit = DEFAULT_LIMIT } = {},
) => {
  const {
    from: _from,
    to: _to,
    limit: _limit,
    page: _page,
    threshold: _threshold,
    ...rest
  } = query;

  const sanitized: SanitizedAnalyticsQuery = {
    ...rest,
    limit: toPositiveInt(query.limit, defaultLimit, 1, MAX_LIMIT),
    page: toPositiveInt(query.page, DEFAULT_PAGE, 1, MAX_PAGE),
    threshold: toPositiveInt(query.threshold, DEFAULT_THRESHOLD, 0, MAX_THRESHOLD),
  };

  let from = toValidDate(query.from);
  let to = toValidDate(query.to);
  if (from && to && from.getTime() > to.getTime()) {
    [from, to] = [to, from];
  }

  if (from) sanitized.from = from;
  else delete sanitized.from;
  if (to) sanitized.to = to;
  else delete sanitized.to;

  return sanitized;
};

const sendList = (res, data) => success(res, Array.isArray(data) ? data : []);

exports.revenue = asyncHandler(async (req: AnalyticsRequest, res: Response) => {
  const query = sanitizeAnalyticsQuery(req.query);
  const data = await analyticsService.revenueSummary(query, req.user);
  return success(res, data);
});

exports.users = asyncHandler(async (_req: AnalyticsRequest, res: Response) => {
  const data = await analyticsService.userSummary();
  return success(res, data);
});

exports.topProducts = asyncHandler(async (req: AnalyticsRequest, res: Response) => {
  const query = sanitizeAnalyticsQuery(req.query, { defaultLimit: 10 });
  const data = await analyticsService.topProducts(query);
  return sendList(res, data);
});

exports.inventory = asyncHandler(async (req: AnalyticsRequest, res: Response) => {
  const query = sanitizeAnalyticsQuery(req.query);
  const data = await analyticsService.lowStock(query);
  return sendList(res, data);
});

exports.reviews = asyncHandler(async (_req: AnalyticsRequest, res: Response) => {
  const data = await analyticsService.reviewSummary();
  return success(res, data);
});

exports.dashboardStats = asyncHandler(async (req: AnalyticsRequest, res: Response) => {
  const query = sanitizeAnalyticsQuery(req.query);
  const salesmanId =
    typeof query.salesmanId === 'string' && query.salesmanId.trim()
      ? query.salesmanId
      : null;
  const data = await analyticsService.dashboardStats(
    req.user,
    salesmanId,
  );
  return success(res, data);
});

exports.revenueChartData = asyncHandler(async (req: AnalyticsRequest, res: Response) => {
  const query = sanitizeAnalyticsQuery(req.query);
  const data = await analyticsService.revenueChartData(query, req.user);
  return success(res, data);
});

exports.salesByState = asyncHandler(async (req: AnalyticsRequest, res: Response) => {
  const query = sanitizeAnalyticsQuery(req.query, { defaultLimit: 6 });
  const data = await analyticsService.salesByState(query);
  return sendList(res, data);
});

exports.repeatCustomers = asyncHandler(async (req: AnalyticsRequest, res: Response) => {
  const query = sanitizeAnalyticsQuery(req.query);
  const data = await analyticsService.repeatCustomerSummary(query);
  return success(res, data);
});

exports.fulfillment = asyncHandler(async (req: AnalyticsRequest, res: Response) => {
  const query = sanitizeAnalyticsQuery(req.query);
  const data = await analyticsService.fulfillmentSummary(query);
  return success(res, data);
});

exports.orderFunnel = asyncHandler(async (req: AnalyticsRequest, res: Response) => {
  const query = sanitizeAnalyticsQuery(req.query);
  const data = await analyticsService.orderFunnel(query);
  return success(res, data);
});

exports.topCategories = asyncHandler(async (req: AnalyticsRequest, res: Response) => {
  const query = sanitizeAnalyticsQuery(req.query, { defaultLimit: 6 });
  const data = await analyticsService.topCategories(query);
  return sendList(res, data);
});

exports.topBrands = asyncHandler(async (req: AnalyticsRequest, res: Response) => {
  const query = sanitizeAnalyticsQuery(req.query, { defaultLimit: 6 });
  const data = await analyticsService.topBrands(query);
  return sendList(res, data);
});

exports.inventoryTurnover = asyncHandler(async (req: AnalyticsRequest, res: Response) => {
  const query = sanitizeAnalyticsQuery(req.query, { defaultLimit: 6 });
  const data = await analyticsService.inventoryTurnover(query);
  return success(res, data);
});

exports.salesByCity = asyncHandler(async (req: AnalyticsRequest, res: Response) => {
  const query = sanitizeAnalyticsQuery(req.query, { defaultLimit: 6 });
  const data = await analyticsService.salesByCity(query);
  return sendList(res, data);
});

