import type { AnalyticsRequestShape } from './analytics.types';
const Joi = require('joi');

const analyticsQuerySchema = Joi.object({
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  threshold: Joi.number().integer().min(0).max(100000).default(5),
  range: Joi.string()
    .valid('today', 'week', 'month', 'year', 'custom')
    .default('month'),
  salesmanId: Joi.string().hex().length(24).optional(),
});

module.exports = {
  analyticsQuerySchema,
};
