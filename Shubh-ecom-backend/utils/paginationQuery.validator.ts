// @ts-nocheck
const Joi = require('joi');
const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('./pagination');

const paginationQuerySchema = {
  page: Joi.number().integer().min(1).default(DEFAULT_PAGE),
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
};

module.exports = {
  paginationQuerySchema,
};

