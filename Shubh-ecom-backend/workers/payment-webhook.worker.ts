// @ts-nocheck
const { queuesEnabled } = require('../config/queue');
const logger = require('../config/logger');

if (!queuesEnabled) {
  logger.warn('Worker disabled: REDIS_URL not set', { worker: 'payment-webhook' });
  module.exports = { worker: null, disabled: true };
} else {
  const { Worker } = require('bullmq');
  const { connection } = require('../config/queue');
  const { logWorkerFailure } = require('../utils/workerLogger');

  const paymentRepo = require('../modules/payments/payment.repo');
  const orderRepo = require('../modules/orders/order.repo');
  const orderService = require('../modules/orders/orders.service');
  const invoiceService = require('../modules/invoice/invoice.service');
  const creditNoteService = require('../modules/invoice/creditNote.service');

  const { PAYMENT_RECORD_STATUS } = require('../constants/paymentStatus');

  const handleStripe = async (payload) => {
    const type = payload?.type;
    const object = payload?.data?.object;
    const orderId = object?.metadata?.orderId;
    if (!orderId) return;

    const payment = await paymentRepo.findByGatewayOrderIdLean(orderId);
    if (!payment) return;

    if (type === 'payment_intent.succeeded') {
      const updatedPayment = await paymentRepo.markSuccess(payment._id, {
        transactionId: object?.id,
      });
      const snapshotPayment = updatedPayment || payment;
      await orderRepo.updateById(payment.orderId, {
        paymentSnapshot: {
          paymentId: payment._id,
          gateway: snapshotPayment.paymentGateway,
          gatewayOrderId: snapshotPayment.gatewayOrderId || null,
          transactionId: snapshotPayment.transactionId || object?.id || null,
          status: PAYMENT_RECORD_STATUS.SUCCESS,
          amount: snapshotPayment.amount,
          currency: snapshotPayment.currency || 'INR',
          createdAt: snapshotPayment.createdAt || new Date(),
          updatedAt: new Date(),
        },
      });
      const order = await orderRepo.findById(orderId);
      if (order) {
        await orderService.confirmOrder(orderId);
        await invoiceService.generateFromOrder(order);
      }
      return;
    }

    if (type === 'charge.refunded') {
      const refundedAmount =
        typeof object?.amount_refunded === 'number'
          ? object.amount_refunded / 100
          : 0;
      const isFullRefund = refundedAmount >= (payment.amount || 0);
      const order = await orderRepo.findById(orderId);
      const updatedPayment = await paymentRepo.finalizeRefund(payment._id, isFullRefund);
      const snapshotPayment = updatedPayment || payment;
      await orderRepo.updateById(payment.orderId, {
        paymentSnapshot: {
          paymentId: payment._id,
          gateway: snapshotPayment.paymentGateway,
          gatewayOrderId: snapshotPayment.gatewayOrderId || null,
          transactionId: snapshotPayment.transactionId || object?.id || null,
          status: PAYMENT_RECORD_STATUS.REFUNDED,
          amount: snapshotPayment.amount,
          currency: snapshotPayment.currency || 'INR',
          createdAt: snapshotPayment.createdAt || new Date(),
          updatedAt: new Date(),
        },
      });
      if (order) {
        await orderService.markRefunded(orderId, isFullRefund);
        await creditNoteService.generateFromOrder(order);
      }
    }
  };

  const handleRazorpay = async (payload) => {
    const event = payload?.event;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payload?.payment?.entity;
      const paymentId = paymentEntity?.id;
      const gatewayOrderId = paymentEntity?.order_id;

      logger.info('razorpay_webhook_event_received', {
        event,
        razorpayPaymentId: paymentId || null,
        razorpayOrderId: gatewayOrderId || null,
      });

      let payment = null;
      if (gatewayOrderId) {
        payment = await paymentRepo.findByGatewayOrderIdLean(gatewayOrderId);
      }
      if (paymentId) {
        payment =
          payment || (await paymentRepo.findByGatewayPaymentIdLean(paymentId));
      }

      logger.info('razorpay_webhook_payment_lookup', {
        event,
        razorpayPaymentId: paymentId || null,
        razorpayOrderId: gatewayOrderId || null,
        paymentFound: Boolean(payment),
        localOrderId: payment?.orderId ? String(payment.orderId) : null,
      });

      if (!payment) return;
      if (payment.status === PAYMENT_RECORD_STATUS.SUCCESS) return;

      const updatedPayment = await paymentRepo.markSuccess(payment._id, {
        transactionId: paymentId || payment.transactionId,
        gatewayResponse: paymentEntity,
      });
      const snapshotPayment = updatedPayment || payment;

      await orderRepo.updateById(payment.orderId, {
        paymentSnapshot: {
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

      const order = await orderRepo.findById(payment.orderId);
      logger.info('razorpay_webhook_order_lookup', {
        event,
        razorpayOrderId: gatewayOrderId || null,
        localOrderId: payment?.orderId ? String(payment.orderId) : null,
        orderFound: Boolean(order),
      });

      if (order) {
        await orderService.confirmOrder(payment.orderId);
        await invoiceService.generateFromOrder(order);
      }
      return;
    }

    if (event === 'refund.processed') {
      const paymentId = payload?.payload?.refund?.entity?.payment_id;
      const refundAmount =
        typeof payload?.payload?.refund?.entity?.amount === 'number'
          ? payload.payload.refund.entity.amount / 100
          : 0;
      const payment = await paymentRepo.findByGatewayPaymentIdLean(paymentId);
      if (!payment) return;
      const isFullRefund = refundAmount >= (payment.amount || 0);
      const order = await orderRepo.findById(payment.orderId);
      const updatedPayment = await paymentRepo.finalizeRefund(payment._id, isFullRefund);
      const snapshotPayment = updatedPayment || payment;
      await orderRepo.updateById(payment.orderId, {
        paymentSnapshot: {
          paymentId: payment._id,
          gateway: snapshotPayment.paymentGateway,
          gatewayOrderId: snapshotPayment.gatewayOrderId || null,
          transactionId: snapshotPayment.transactionId || paymentId || null,
          status: PAYMENT_RECORD_STATUS.REFUNDED,
          amount: snapshotPayment.amount,
          currency: snapshotPayment.currency || 'INR',
          createdAt: snapshotPayment.createdAt || new Date(),
          updatedAt: new Date(),
        },
      });
      if (order) {
        await orderService.markRefunded(payment.orderId, isFullRefund);
        await creditNoteService.generateFromOrder(order);
      }
      return;
    }

    if (event === 'payment.failed') {
      const paymentId = payload?.payload?.payment?.entity?.id;
      const gatewayOrderId = payload?.payload?.payment?.entity?.order_id;
      logger.info('razorpay_webhook_event_received', {
        event,
        razorpayPaymentId: paymentId || null,
        razorpayOrderId: gatewayOrderId || null,
      });

      let payment = null;
      if (gatewayOrderId) {
        payment = await paymentRepo.findByGatewayOrderIdLean(gatewayOrderId);
      }
      if (paymentId) {
        payment =
          payment || (await paymentRepo.findByGatewayPaymentIdLean(paymentId));
      }

      logger.info('razorpay_webhook_payment_lookup', {
        event,
        razorpayPaymentId: paymentId || null,
        razorpayOrderId: gatewayOrderId || null,
        paymentFound: Boolean(payment),
        localOrderId: payment?.orderId ? String(payment.orderId) : null,
      });

      if (!payment) return;
      const updatedPayment = await paymentRepo.markFailed(payment._id, { reason: 'gateway_failure' });
      const snapshotPayment = updatedPayment || payment;
      await orderRepo.updateById(payment.orderId, {
        paymentSnapshot: {
          paymentId: payment._id,
          gateway: snapshotPayment.paymentGateway,
          gatewayOrderId: snapshotPayment.gatewayOrderId || null,
          transactionId: snapshotPayment.transactionId || paymentId || null,
          status: PAYMENT_RECORD_STATUS.FAILED,
          amount: snapshotPayment.amount,
          currency: snapshotPayment.currency || 'INR',
          createdAt: snapshotPayment.createdAt || new Date(),
          updatedAt: new Date(),
        },
      });

      await orderService.failOrder(payment.orderId);
      return;
    }

    logger.info('razorpay_webhook_event_unhandled', { event: event || null });
  };

  let worker = null;

  try {
    worker = new Worker(
      'payment-webhook',
      async (job) => {
        try {
          const { gateway, eventId } = job.data;
          logger.info('Processing payment webhook', { gateway, eventId });

          if (gateway === 'stripe') {
            await handleStripe(job.data.payload);
          } else if (gateway === 'razorpay') {
            await handleRazorpay(job.data.payload);
          } else {
            logger.warn('Unknown gateway webhook', { gateway });
            return;
          }
        } catch (err) {
          logWorkerFailure('paymentWebhook', job, err);
          throw err;
        }
      },
      { connection },
    );

    worker.on('failed', (job, err) => {
      logWorkerFailure('paymentWebhook', job, err);
    });
  } catch (err) {
    logger.error('Payment webhook worker initialization failed', {
      error: err.message,
    });
  }

  module.exports = { worker, disabled: false };
}
