const cron = require('node-cron');
const logger = require('../config/logger');
const { redis, redisEnabled } = require('../config/redis');
const Order = require('../models/Order.model');
const orderService = require('../modules/orders/orders.service');
const { ORDER_STATUS } = require('../constants/orderStatus');

const LOCK_KEY = 'auto_confirm:lock';

async function processAutoConfirmOrders() {
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
  
  const ordersToConfirm = await Order.find({
    orderStatus: ORDER_STATUS.PLACED,
    placedAt: { $lte: sixHoursAgo },
  });

  if (!ordersToConfirm.length) return { processed: 0 };

  let processedCount = 0;
  for (const order of ordersToConfirm) {
    try {
      await orderService.confirmOrder(order._id);
      processedCount++;
      logger.info('order_auto_confirmed', { orderId: order._id });
    } catch (err: any) {
      logger.error('order_auto_confirm_failed', {
        orderId: order._id,
        error: err.message || String(err),
      });
    }
  }

  return { processed: processedCount };
}

function startAutoConfirmCron() {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    let lockAcquired = false;

    if (redisEnabled && redis?.isOpen) {
      const lock = await redis.set(LOCK_KEY, '1', {
        NX: true,
        EX: 25 * 60,
      });

      if (!lock) return;
      lockAcquired = true;
    }

    try {
      await processAutoConfirmOrders();
    } catch (err: any) {
      logger.error('auto_confirm_cron_failed', {
        error: err?.message || String(err),
      });
    } finally {
      if (lockAcquired) {
        await redis.del(LOCK_KEY).catch(() => {});
      }
    }
  });
}

module.exports = {
  startAutoConfirmCron,
  processAutoConfirmOrders,
};
