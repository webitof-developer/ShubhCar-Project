// @ts-nocheck
const { createQueue } = require('../config/queue');

const productBulkCreateQueue = createQueue('product-bulk-create');

module.exports = { productBulkCreateQueue };
