const asyncHandler = require('../../utils/asyncHandler');
const analyticsService = require('./analytics.service');
const { success } = require('../../utils/apiResponse');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const DEFAULT_THRESHOLD = 5;
const MAX_LIMIT = 100;
const MAX_PAGE = 100000;
const MAX_THRESHOLD = 100000;

const toPositiveInt = (value, fallback, min = 1, max = MAX_LIMIT) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const toValidDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sanitizeAnalyticsQuery = (query = {}, { defaultLimit = DEFAULT_LIMIT } = {}) => {
  const limit = Number.parseInt(query.limit, 10);
  const page = Number.parseInt(query.page, 10);
  const threshold = Number.parseInt(query.threshold, 10);

  const sanitized = {
    ...query,
    // Ensure Mongo aggregation receives numeric limits.
    limit:
      Number.isFinite(limit) && limit > 0
        ? toPositiveInt(limit, defaultLimit)
        : defaultLimit,
    page:
      Number.isFinite(page) && page > 0
        ? toPositiveInt(page, DEFAULT_PAGE, 1, MAX_PAGE)
        : DEFAULT_PAGE,
    threshold:
      Number.isFinite(threshold) && threshold >= 0
        ? toPositiveInt(threshold, DEFAULT_THRESHOLD, 0, MAX_THRESHOLD)
        : DEFAULT_THRESHOLD,
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

exports.revenue = asyncHandler(async (req, res) => {
  const query = sanitizeAnalyticsQuery(req.query);
  const data = await analyticsService.revenueSummary(query, req.user);
  return success(res, data);
});

exports.users = asyncHandler(async (req, res) => {
  const data = await analyticsService.userSummary();
  return success(res, data);
});

exports.topProducts = asyncHandler(async (req, res) => {
  const query = sanitizeAnalyticsQuery(req.query, { defaultLimit: 10 });
  const data = await analyticsService.topProducts(query);
  return sendList(res, data);
});

exports.inventory = asyncHandler(async (req, res) => {
  const query = sanitizeAnalyticsQuery(req.query);
  const data = await analyticsService.lowStock(query);
  return sendList(res, data);
});

exports.reviews = asyncHandler(async (req, res) => {
  const data = await analyticsService.reviewSummary();
  return success(res, data);
});

exports.dashboardStats = asyncHandler(async (req, res) => {
  const query = sanitizeAnalyticsQuery(req.query);
  const data = await analyticsService.dashboardStats(
    req.user,
    query.salesmanId,
  );
  return success(res, data);
});

exports.revenueChartData = asyncHandler(async (req, res) => {
  const query = sanitizeAnalyticsQuery(req.query);
  const data = await analyticsService.revenueChartData(query, req.user);
  return success(res, data);
});

exports.salesByState = asyncHandler(async (req, res) => {
  const query = sanitizeAnalyticsQuery(req.query, { defaultLimit: 6 });
  const data = await analyticsService.salesByState(query);
  return sendList(res, data);
});

exports.repeatCustomers = asyncHandler(async (req, res) => {
  const query = sanitizeAnalyticsQuery(req.query);
  const data = await analyticsService.repeatCustomerSummary(query);
  return success(res, data);
});

exports.fulfillment = asyncHandler(async (req, res) => {
  const query = sanitizeAnalyticsQuery(req.query);
  const data = await analyticsService.fulfillmentSummary(query);
  return success(res, data);
});

exports.orderFunnel = asyncHandler(async (req, res) => {
  const query = sanitizeAnalyticsQuery(req.query);
  const data = await analyticsService.orderFunnel(query);
  return success(res, data);
});

exports.topCategories = asyncHandler(async (req, res) => {
  const query = sanitizeAnalyticsQuery(req.query, { defaultLimit: 6 });
  const data = await analyticsService.topCategories(query);
  return sendList(res, data);
});

exports.topBrands = asyncHandler(async (req, res) => {
  const query = sanitizeAnalyticsQuery(req.query, { defaultLimit: 6 });
  const data = await analyticsService.topBrands(query);
  return sendList(res, data);
});

exports.inventoryTurnover = asyncHandler(async (req, res) => {
  const query = sanitizeAnalyticsQuery(req.query, { defaultLimit: 6 });
  const data = await analyticsService.inventoryTurnover(query);
  return success(res, data);
});

exports.salesByCity = asyncHandler(async (req, res) => {
  const query = sanitizeAnalyticsQuery(req.query, { defaultLimit: 6 });
  const data = await analyticsService.salesByCity(query);
  return sendList(res, data);
});
