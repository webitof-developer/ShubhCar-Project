const cron = require('node-cron');
const logger = require('../config/logger');
const { redis, redisEnabled } = require('../config/redis');
const checkoutDraftService = require('../modules/checkout-drafts/checkoutDrafts.service');

const LOCK_KEY = 'checkout_draft_expiry:lock';

async function expireStaleCheckoutDrafts() {
  const result = await checkoutDraftService.expireStaleDrafts();
  logger.info('checkout_drafts_expired', result);
  return result;
}

function startCheckoutDraftExpiryCron() {
  cron.schedule('*/10 * * * *', async () => {
    let lockAcquired = false;

    if (redisEnabled && redis?.isOpen) {
      const lock = await redis.set(LOCK_KEY, '1', {
        NX: true,
        EX: 9 * 60,
      });

      if (!lock) return;
      lockAcquired = true;
    }

    try {
      await expireStaleCheckoutDrafts();
    } catch (err) {
      logger.error('checkout_draft_expiry_failed', {
        error: err?.message || String(err),
      });
    } finally {
      if (lockAcquired) {
        await redis.del(LOCK_KEY).catch(() => { });
      }
    }
  });
}

module.exports = {
  startCheckoutDraftExpiryCron,
  expireStaleCheckoutDrafts,
};
