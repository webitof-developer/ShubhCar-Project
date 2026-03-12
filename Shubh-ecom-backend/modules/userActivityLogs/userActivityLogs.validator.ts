const Joi = require('joi');

const listUserActivityLogsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  userId: Joi.string(),
  activityType: Joi.string().trim().max(120),
  resource: Joi.string().trim().max(120),
  action: Joi.string().trim().max(120),
  severity: Joi.string().valid('info', 'warning', 'error', 'critical'),
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  search: Joi.string().trim().max(120),
});

module.exports = {
  listUserActivityLogsQuerySchema,
};

