// @ts-nocheck
const { createQueue } = require('../config/queue');

const paymentWebhookQueue = createQueue('payment-webhook');

module.exports = { paymentWebhookQueue };
