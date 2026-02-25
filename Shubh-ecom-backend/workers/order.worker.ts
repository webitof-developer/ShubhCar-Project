// @ts-nocheck
const { queuesEnabled } = require('../config/queue');
const logger = require('../config/logger');

if (!queuesEnabled) {
  logger.warn('Worker disabled: REDIS_URL not set', { worker: 'order' });
  module.exports = { worker: null, disabled: true };
} else {
  const { Worker } = require('bullmq');
  const { connection } = require('../config/queue');
  const { connectRedis } = require('../config/redis');
  const orderJobs = require('../jobs/order.jobs');
  const eventBus = require('../utils/eventBus');
  const { logWorkerFailure } = require('../utils/workerLogger');
  const orderRepo = require('../modules/orders/order.repo');
  const shipmentService = require('../modules/shipments/shipment.service');

  // Ensure shared Redis client used by coupon locks is connected in the worker context.
  connectRedis().catch((err) => {
    logger.error('Failed to connect Redis for order worker', {
      error: err.message,
    });
  });

  let worker = null;

  try {
    worker = new Worker(
      'order',
      async (job) => {
        try {
          if (job.name === 'auto-cancel') {
            await orderJobs.processAutoCancel(job.data.orderId);
          }
          if (job.name === 'release-inventory') {
            await orderJobs.releaseInventory(job.data.orderId);
          }
          if (job.name === 'prepare-shipment') {
            await shipmentService.prepareForOrder(job.data.orderId);
          }
          if (job.name === 'order-status-notification') {
            const { orderId, status } = job.data;
            logger.info(`Order status notification`, { orderId, status });
            eventBus.emit('ORDER_STATUS_CHANGED', { orderId, status });
          }
        } catch (err) {
          logWorkerFailure('order', job, err);
          throw err;
        }
      },
      { connection },
    );

    worker.on('failed', (job, err) => {
      logWorkerFailure('order', job, err);
    });
  } catch (err) {
    logger.error('Order worker initialization failed', { error: err.message });
  }

  module.exports = { worker, disabled: false };
}
