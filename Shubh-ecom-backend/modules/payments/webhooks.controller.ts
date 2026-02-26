import type { Response } from 'express';
import type { PaymentsRequest } from './payments.types';
const { randomUUID } = require('crypto');
const stripeService = require('../../services/stripe.service');
const razorpayService = require('../../services/razorpay.service');
const { paymentWebhookQueue } = require('../../queues/paymentWebhook.queue');
const paymentRepo = require('./payment.repo');
const orderRepo = require('../orders/order.repo');
const orderService = require('../orders/orders.service');
const invoiceService = require('../invoice/invoice.service');
const { PAYMENT_RECORD_STATUS } = require('../../constants/paymentStatus');
const { redis } = require('../../config/redis');
const { queuesEnabled } = require('../../config/queue');
const logger = require('../../config/logger');

const WEBHOOK_TTL_SECONDS = 60 * 60 * 24; // 24h dedupe window

const reserveEvent = async (gateway, eventId, requestId) => {
  if (!eventId) return false;
  const key = `payment-webhook:${gateway}:${eventId}`;
  try {
    const result = await redis.set(key, requestId || '1', {
      NX: true,
      EX: WEBHOOK_TTL_SECONDS,
    });
    return result === 'OK';
  } catch (err) {
    logger.error('Webhook dedupe reservation failed', {
      gateway,
      eventId,
      error: err.message,
    });
    return true; // fail-open to avoid dropping gateway retries
  }
};

const processRazorpayInline = async (payload, requestId) => {
  const event = payload?.event;
  const paymentEntity = payload?.payload?.payment?.entity || null;
  const paymentId = paymentEntity?.id || null;
  const razorpayOrderId = paymentEntity?.order_id || null;

  logger.info('razorpay_webhook_inline_processing_started', {
    requestId,
    event,
    razorpayPaymentId: paymentId,
    razorpayOrderId,
  });

  if (event !== 'payment.captured' && event !== 'order.paid') {
    logger.info('razorpay_webhook_inline_skipped_event', {
      requestId,
      event,
    });
    return;
  }

  let payment = null;
  if (razorpayOrderId) {
    payment = await paymentRepo.findByGatewayOrderIdLean(razorpayOrderId);
  }
  if (!payment && paymentId) {
    payment = await paymentRepo.findByGatewayPaymentIdLean(paymentId);
  }

  logger.info('razorpay_webhook_inline_lookup_result', {
    requestId,
    event,
    razorpayOrderId,
    razorpayPaymentId: paymentId,
    paymentFound: Boolean(payment),
// @ts-ignore
    localOrderId: payment?.orderId ? String(payment.orderId) : null,
  });

// @ts-ignore
  if (!payment || payment.status === PAYMENT_RECORD_STATUS.SUCCESS) return;

// @ts-ignore
  const updatedPayment = await paymentRepo.markSuccess(payment._id, {
// @ts-ignore
    transactionId: paymentId || payment.transactionId,
    gatewayResponse: paymentEntity || {},
  });
  const snapshotPayment = updatedPayment || payment;

// @ts-ignore
  await orderRepo.updateById(payment.orderId, {
    paymentSnapshot: {
// @ts-ignore
      paymentId: payment._id,
      gateway: snapshotPayment.paymentGateway,
      gatewayOrderId: snapshotPayment.gatewayOrderId || null,
      transactionId: snapshotPayment.transactionId || paymentId || null,
      status: PAYMENT_RECORD_STATUS.SUCCESS,
      amount: snapshotPayment.amount,
      currency: snapshotPayment.currency || 'INR',
      createdAt: snapshotPayment.createdAt || new Date(),
      updatedAt: new Date(),
    },
  });

// @ts-ignore
  const order = await orderRepo.findById(payment.orderId);
  logger.info('razorpay_webhook_inline_order_lookup', {
    requestId,
    event,
    razorpayOrderId,
// @ts-ignore
    localOrderId: payment?.orderId ? String(payment.orderId) : null,
    orderFound: Boolean(order),
  });

  if (order) {
// @ts-ignore
    await orderService.confirmOrder(payment.orderId);
    await invoiceService.generateFromOrder(order);
  }
};

class WebhookController {
  /* =====================
     STRIPE WEBHOOK
  ===================== */
  async stripe(req: PaymentsRequest, res: Response) {
    let event;
    const requestId = randomUUID();

    try {
      event = stripeService.verifyWebhook(
        req.headers['stripe-signature'],
        req.body,
      );
    } catch (err) {
      return res.status(400).send('Invalid signature');
    }

    const isReserved = await reserveEvent('stripe', event.id, requestId);
    if (!isReserved) {
      return res.sendStatus(200);
    }

    try {
      await paymentWebhookQueue.add(
        'process',
        {
          gateway: 'stripe',
          eventId: event.id,
          requestId,
          payload: event,
        },
        {
          jobId: `stripe:${event.id}`,
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
    } catch (err) {
      // IMPORTANT: force retry by gateway
      return res.status(500).send('Queue unavailable');
    }

    return res.sendStatus(200);
  }

  /* =====================
     RAZORPAY WEBHOOK
  ===================== */
  async razorpay(req: PaymentsRequest, res: Response) {
    const requestId = randomUUID();
    const rawBody = req.body;

    logger.info('razorpay_webhook_received', {
      requestId,
      hasSignature: Boolean(req.headers['x-razorpay-signature']),
      rawBodyType: Buffer.isBuffer(rawBody) ? 'buffer' : typeof rawBody,
    });

    if (!Buffer.isBuffer(rawBody)) {
      logger.warn('razorpay_webhook_invalid_payload_type', { requestId });
      return res.status(400).send('Invalid payload');
    }

    try {
      razorpayService.verifyWebhook(
        req.headers['x-razorpay-signature'],
        rawBody,
      );
      logger.info('razorpay_webhook_signature_valid', { requestId });
    } catch (err) {
      logger.warn('razorpay_webhook_signature_invalid', {
        requestId,
        error: err.message,
      });
      return res.status(400).send('Invalid signature');
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch (err) {
      logger.warn('razorpay_webhook_invalid_json', { requestId });
      return res.status(400).send('Invalid payload');
    }

    const event = payload?.event;
    const razorpayOrderId = payload?.payload?.payment?.entity?.order_id || null;
    const razorpayPaymentId = payload?.payload?.payment?.entity?.id || null;

    logger.info('razorpay_webhook_event_parsed', {
      requestId,
      event,
      razorpayOrderId,
      razorpayPaymentId,
    });

    const eventId = payload?.payload?.payment?.entity?.id;
    if (!eventId) {
      logger.warn('razorpay_webhook_event_id_missing', {
        requestId,
        event,
        razorpayOrderId,
      });
      return res.status(400).send('Event id missing');
    }

    const isReserved = await reserveEvent('razorpay', eventId, requestId);
    if (!isReserved) {
      logger.info('razorpay_webhook_duplicate_ignored', {
        requestId,
        event,
        eventId,
      });
      return res.sendStatus(200);
    }

    if (!queuesEnabled) {
      await processRazorpayInline(payload, requestId);
      return res.sendStatus(200);
    }

    try {
      await paymentWebhookQueue.add(
        'process',
        {
          gateway: 'razorpay',
          eventId,
          requestId,
          payload,
        },
        {
          jobId: `razorpay:${eventId}`,
          removeOnComplete: true,
          removeOnFail: true,
        },
      );
      logger.info('razorpay_webhook_enqueued', {
        requestId,
        event,
        eventId,
        razorpayOrderId,
      });
    } catch (err) {
      logger.error('razorpay_webhook_enqueue_failed', {
        requestId,
        event,
        eventId,
        error: err.message,
      });
      await processRazorpayInline(payload, requestId);
      return res.sendStatus(200);
    }

    return res.sendStatus(200);
  }
}

module.exports = new WebhookController();

