const Joi = require('joi');

const summaryQuerySchema = Joi.object({
  from: Joi.date().iso(),
  to: Joi.date().iso(),
});

const salesmanPerformanceQuerySchema = Joi.object({
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  salesmanId: Joi.string().trim().hex().length(24),
  limit: Joi.number().integer().min(1).max(100).default(20),
  page: Joi.number().integer().min(1).default(1),
});

const listSalesReportsQuerySchema = Joi.object({
  date: Joi.date().iso(),
});

const createSalesReportSchema = Joi.object({
  date: Joi.date().iso().required(),
  totalSales: Joi.number().min(0).default(0),
  totalOrders: Joi.number().integer().min(0).default(0),
  totalUnitsSold: Joi.number().integer().min(0).default(0),
  platformCommission: Joi.number().min(0).default(0),
});

const updateSalesReportSchema = Joi.object({
  date: Joi.date().iso(),
  totalSales: Joi.number().min(0),
  totalOrders: Joi.number().integer().min(0),
  totalUnitsSold: Joi.number().integer().min(0),
  platformCommission: Joi.number().min(0),
}).min(1);

module.exports = {
  summaryQuerySchema,
  salesmanPerformanceQuerySchema,
  listSalesReportsQuerySchema,
  createSalesReportSchema,
  updateSalesReportSchema,
};

