const { createSafeSession } = require('../../utils/mongoTransaction');
const paymentRepo = require('./payment.repo');
const orderRepo = require('../orders/order.repo');
const { error } = require('../../utils/apiResponse');

const razorpayService = require('../../services/razorpay.service');
const paymentGatewayService = require('./payment.gateway.service');
const logger = require('../../config/logger');
const { getPaymentSettings } = require('../../utils/paymentSettings');
const orderService = require('../orders/orders.service');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

const {
  PAYMENT_RECORD_STATUS,
  PAYMENT_STATUS,
} = require('../../constants/paymentStatus');

const { paymentRetryQueue } = require('../../queues/paymentRetry.queue');

type PaymentAdminListQuery = {
  status?: string;
  limit?: number | string;
  page?: number | string;
};

/* =======================
   PAYMENTS SERVICE
======================= */
class PaymentsService {
  /**
   * Initiate payment (idempotent)
   */
  async initiatePayment({ orderId, gateway, context = {} as Record<string, unknown> }) {
    const log = logger.withContext({
// @ts-ignore
      requestId: context.requestId || null,
// @ts-ignore
      route: context.route,
// @ts-ignore
      method: context.method,
// @ts-ignore
      userId: context.userId || null,
    });
    const session = await createSafeSession();
    if (!session._isStandalone) {
      session.startTransaction({ readPreference: 'primary' });
    }

    try {
      /* =====================
       ORDER VALIDATION
    ====================== */
      const order = await orderRepo.findById(orderId).session(session);
      if (!order) error('Order not found', 404);

      // SECURITY: Verify user owns this order
// @ts-ignore
      if (String(order.userId) !== String(context.userId)) {
        error('Access denied - order belongs to another user', 403);
      }

      if (order.orderStatus !== 'created') {
        error('Order not eligible for payment', 409);
      }

      if (order.paymentStatus !== PAYMENT_STATUS.PENDING) {
        error('Payment already processed', 409);
      }

      /* =====================
       IDEMPOTENCY (REUSE)
    ====================== */
      const existing = await paymentRepo.findOpenByOrderAndGateway(
        orderId,
        gateway,
      );

      if (existing) {
        if (!session._isStandalone && session.inTransaction()) {
          await session.commitTransaction();
        }
        return {
          paymentId: existing._id,
          gatewayPayload: existing.gatewayResponse,
        };
      }

      /* =====================
       FAIL OLD OPEN PAYMENTS
    ====================== */
      await paymentRepo.failOpenPayments(orderId, gateway, 'new_initiation');

      /* =====================
       GATEWAY CREATE
    ====================== */
      let gatewayResponse;
      let gatewayOrderId;

      if (gateway === 'razorpay') {
        const paymentSettings = await getPaymentSettings();
        if (!paymentSettings.razorpayEnabled) {
          error('Razorpay payments are disabled', 409);
        }

        // Allow Env fallback if DB settings are empty
        const keyId =
          paymentSettings.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
        const keySecret =
          paymentSettings.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
          error('Razorpay credentials are missing (DB or Env)', 500);
        }

        logger.info('razorpay_credentials_resolved', {
          keyIdTail: keyId ? keyId.slice(-4) : 'MISSING',
          keySecretTail: keySecret ? keySecret.slice(-4) : 'MISSING',
        });

        gatewayResponse = await razorpayService.createOrder({
          amount: order.grandTotal,
          currency: 'INR',
          receipt: order.orderNumber,
          keyId,
          keySecret,
        });
        gatewayOrderId = gatewayResponse.id;
      } else {
        error('Unsupported payment gateway', 400);
      }

      if (!gatewayOrderId) {
        error('Payment gateway initialization failed', 502);
      }

      /* =====================
       CREATE PAYMENT (DB GUARDED)
    ====================== */
      const payment = await paymentRepo.create(
        {
          orderId,
          paymentGateway: gateway,
          transactionId: null,
          gatewayOrderId,
          metadata: { orderId, gateway },
          amount: order.grandTotal,
          currency: 'INR',
          status: PAYMENT_RECORD_STATUS.CREATED,
          gatewayResponse,
        },
        session,
      );

      order.paymentSnapshot = {
        paymentId: payment._id,
        gateway,
        gatewayOrderId,
        transactionId: null,
        status: PAYMENT_RECORD_STATUS.CREATED,
        amount: payment.amount,
        currency: payment.currency || 'INR',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await order.save({ session });

      if (!session._isStandalone && session.inTransaction()) {
        await session.commitTransaction();
      }

      log.info('payment_intent_created', {
        type: 'payment',
        entityId: payment._id.toString(),
        paymentId: payment._id.toString(),
        orderId,
        gateway,
      });

      return {
        paymentId: payment._id,
        gatewayPayload: gatewayResponse,
      };
    } catch (e) {
      if (!session._isStandalone && session.inTransaction()) {
        await session.abortTransaction();
      }

      // 👇 Handle duplicate key safely
      if (e.code === 11000) {
        const existing = await paymentRepo.findOpenLeanByOrderAndGateway(
          orderId,
          gateway,
        );
        if (existing) {
          return {
            paymentId: existing._id,
            gatewayPayload: existing.gatewayResponse,
          };
        }
      }

      if (e.code !== 11000) {
        log.error('payment_initiation_failed', {
          type: 'payment_failure',
          entityId: orderId,
          orderId,
          gateway,
          errorCode: e.code || e.name,
        });
      }

      throw e;
    } finally {
      session.endSession();
    }
  }

  async getStatus(paymentId, userId) {
    const payment = await paymentRepo.findByIdLean(paymentId);
    if (!payment) {
      error('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }

    // Verify user owns this payment's order
    const orderRepoHasLean = typeof orderRepo.findByIdLean === 'function';
    const order = orderRepoHasLean
      ? await orderRepo.findByIdLean(payment.orderId)
      : await orderRepo.findById(payment.orderId);
    if (!order) {
      error('Associated order not found', 404);
    }

    if (String(order.userId) !== String(userId)) {
      error('Access denied', 403, 'FORBIDDEN');
    }

    return {
      paymentId: payment._id,
      orderId: payment.orderId,
      gateway: payment.paymentGateway,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  /**
   * Retry payment (async, safe)
   */
  async retryPayment({ orderId, gateway, context = {} as Record<string, unknown> }) {
    const paymentSettings = await getPaymentSettings();
    if (gateway === 'razorpay' && !paymentSettings.razorpayEnabled) {
      error('Razorpay payments are disabled', 409);
    }
    if (gateway !== 'razorpay') {
      error('Unsupported payment gateway', 400);
    }
    const order = await orderRepo.findById(orderId);
    if (!order) error('Order not found', 404);

    // SECURITY: Verify user owns this order
// @ts-ignore
    if (context.userId && String(order.userId) !== String(context.userId)) {
      error('Access denied - order belongs to another user', 403);
    }

    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      error('Order already paid', 409);
    }

    await paymentRetryQueue.add(
      'retry',
      { orderId, gateway },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: true,
      },
    );

    return { enqueued: true };
  }
  /**
   * List all payments (Admin)
   */
  async adminList(_actor, query: PaymentAdminListQuery = {}) {
    // Permission check if needed, though routes handle role access control
    const { status, limit, page } = query;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const pagination = getOffsetPagination({ page, limit });
    const [data, total] = await Promise.all([
      paymentRepo.list(filter, pagination),
      paymentRepo.count(filter),
    ]);

    return {
      payments: data,
      data,
      pagination: buildPaginationMeta({ ...pagination, total }),
    };
  }

  async confirmPayment(paymentId, user, transactionId = null) {
    const payment = await paymentRepo.findById(paymentId);
    if (!payment) {
      error('Payment not found', 404, 'PAYMENT_NOT_FOUND');
    }

    const order = await orderRepo.findById(payment.orderId);
    if (!order) {
      error('Associated order not found', 404);
    }

    const isAdmin = user?.role === 'admin';
    if (!isAdmin && String(order.userId) !== String(user?.id)) {
      error('Access denied', 403, 'FORBIDDEN');
    }

    // If transactionId is provided and payment doesn't have one, update it
    if (transactionId && !payment.transactionId) {
      logger.info('confirm_payment_updating_transaction_id', { transactionId });
      await paymentRepo.updateTransactionId(payment._id, transactionId);
      // Refresh payment object with new transactionId
      payment.transactionId = transactionId;
    }

    logger.info('confirm_payment_fetching_gateway_status', {
      paymentId: payment._id,
      transactionId: payment.transactionId,
    });

    const gatewayStatus = await paymentGatewayService.fetchStatus(payment);
    logger.info('confirm_payment_gateway_status_response', {
      paymentId: payment._id,
      gatewayStatus,
    });
    if (!gatewayStatus) {
      logger.warn('confirm_payment_gateway_status_missing', {
        paymentId: payment._id,
      });
      return {
        paymentId: payment._id,
        status: payment.status,
        orderId: order._id,
        orderPaymentStatus: order.paymentStatus,
      };
    }

    const normalized = gatewayStatus.status;
    logger.info('confirm_payment_status_normalized', {
      paymentId: payment._id,
      normalizedStatus: normalized,
    });

    if (normalized === 'success') {
      if (payment.status !== PAYMENT_RECORD_STATUS.SUCCESS) {
        await paymentRepo.markSuccess(payment._id, {
          transactionId: gatewayStatus.transactionId,
        });
      }
      if (order.paymentStatus !== PAYMENT_STATUS.PAID) {
        await orderService.confirmOrder(order._id);
      }
    } else if (normalized === 'failed') {
      if (payment.status !== PAYMENT_RECORD_STATUS.FAILED) {
        await paymentRepo.markFailed(payment._id, {
          reason: 'gateway_failure',
        });
      }
      if (order.paymentStatus !== PAYMENT_STATUS.FAILED) {
        await orderService.failOrder(order._id);
      }
    } else if (normalized === 'refunded') {
      await paymentRepo.finalizeRefund(
        payment._id,
        Boolean(gatewayStatus.fullRefund),
      );
      await orderService.markRefunded(
        order._id,
        Boolean(gatewayStatus.fullRefund),
      );
    }

    await orderRepo.updateById(order._id, {
      paymentSnapshot: {
        paymentId: payment._id,
        gateway: payment.paymentGateway,
        gatewayOrderId: payment.gatewayOrderId || null,
        transactionId:
          gatewayStatus.transactionId || payment.transactionId || null,
        status: normalized,
        amount: payment.amount,
        currency: payment.currency || 'INR',
        createdAt:
          order.paymentSnapshot?.createdAt || payment.createdAt || new Date(),
        updatedAt: new Date(),
      },
    });

    const refreshedOrder = await orderRepo.findById(order._id);

    return {
      paymentId: payment._id,
      status: normalized,
      orderId: order._id,
      orderPaymentStatus: refreshedOrder?.paymentStatus || order.paymentStatus,
    };
  }
}

module.exports = new PaymentsService();

