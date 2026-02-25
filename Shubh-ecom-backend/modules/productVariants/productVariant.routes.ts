import type { ProductVariantsRequestShape } from './productVariants.types';
const { buildRouter } = require('./productVariant.controller');

module.exports = buildRouter();
