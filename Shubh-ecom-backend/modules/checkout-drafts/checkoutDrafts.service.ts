const { createSafeSession } = require('../../utils/mongoTransaction');
const { error } = require('../../utils/apiResponse');
const { generateOrderNumber } = require('../../utils/numbering');
const { ORDER_STATUS } = require('../../constants/orderStatus');
const { PAYMENT_STATUS } = require('../../constants/paymentStatus');

const CheckoutDraft = require('../../models/CheckoutDraft.model');
const cartRepo = require('../cart/cart.repo');
const cartService = require('../cart/cart.service');
const orderRepo = require('../orders/order.repo');
const productRepo = require('../products/product.repo');
const userRepo = require('../users/user.repo');
const inventoryService = require('../inventory/inventory.service');
const couponRepo = require('../coupons/coupon.repo');
const pricingService = require('../../services/pricing.service');
const checkoutTotals = require('../../services/checkoutTotals.service');

const CHECKOUT_DRAFT_STATUS = CheckoutDraft.CHECKOUT_DRAFT_STATUS || {
  DRAFT: 'draft',
  PENDING: 'pending',
  PAID: 'paid',
  EXPIRED: 'expired',
};

const toObject = (doc) => (doc?.toObject ? doc.toObject() : doc);
const roundCurrency = (value) => Math.round((Number(value) || 0) * 100) / 100;

const assertRequestedQuantityWithinStock = (product, requestedQuantity) => {
  const quantity = Number(requestedQuantity);
  const availableStock = Number(product?.stockQty ?? product?.stock ?? 0);

  if (!Number.isFinite(quantity) || quantity <= 0) {
    error('Invalid quantity', 400, 'VALIDATION_ERROR');
  }
  if (quantity > availableStock) {
    error('Requested quantity exceeds available stock', 400, 'VALIDATION_ERROR');
  }
};

const getDraftTtlMinutes = () => {
  const raw = Number(process.env.CHECKOUT_DRAFT_TTL_MINUTES || 20);
  if (!Number.isFinite(raw)) return 20;
  return Math.max(1, Math.floor(raw));
};

const buildExpiresAt = () =>
  new Date(Date.now() + getDraftTtlMinutes() * 60 * 1000);

class CheckoutDraftService {
  async createDraft({ user, sessionId, payload = {} as Record<string, unknown> }) {
    const cart = await cartRepo.getOrCreateCart({ userId: user.id, sessionId });
    if (!cart) error('Cart not found', 404, 'CART_NOT_FOUND');

    if (payload.cartId && String(payload.cartId) !== String(cart._id)) {
      error('Invalid cartId for user', 400, 'INVALID_CART');
    }

    const cartItems = await cartRepo.getCartWithItems(cart._id);
    if (!cartItems.length) error('Cart is empty', 400);

    const previewSummary = await cartService.getSummary({
      user,
      sessionId,
      shippingAddressId: null,
    });

    const totalQuantity = cartItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );

    const session = await createSafeSession();
    let couponLocked = false;
    let order;
    let draft;

    try {
      if (cart.couponId) {
        couponLocked = await couponRepo.lockCoupon({
          couponId: cart.couponId,
          userId: user.id,
          sessionId,
          scope: 'coupon',
          ttlSeconds: 60,
        });
        if (!couponLocked) error('Coupon is currently in use', 409);
      }

      if (!session._isStandalone) {
        session.startTransaction({ readPreference: 'primary' });
      }

      const dbUser = await userRepo.findById(user.id);
      const orderCustomerType =
        dbUser?.customerType === 'wholesale' &&
        dbUser?.verificationStatus === 'approved'
          ? 'wholesale'
          : 'retail';

      let subtotal = 0;
      let totalItems = 0;
      const calcItems: Array<Record<string, unknown>> = [];
      const orderItems: Array<Record<string, unknown>> = [];

      for (const item of cartItems) {
        const product = await productRepo.findById(item.productId, session);
        if (!product || product.status !== 'active') {
          error('Product unavailable', 400);
        }

        assertRequestedQuantityWithinStock(product, item.quantity);

        const unitPrice = pricingService.resolveUnitPrice({
          product,
          customerType: orderCustomerType,
        });

        await inventoryService.reserve(product._id, item.quantity, session, {
          userId: user.id,
        });

        subtotal += unitPrice * item.quantity;
        totalItems += Number(item.quantity || 0);

        const lineSubtotal = unitPrice * item.quantity;
        let primaryImageUrl = null;
        if (product.productImages && product.productImages.length > 0) {
          primaryImageUrl = product.productImages[0].imageUrl || null;
        }

        orderItems.push({
          productId: product._id,
          productName: product.name || 'Unknown Product',
          productSlug: product.slug || null,
          productImage: primaryImageUrl,
          productDescription:
            product.shortDescription ||
            product.description?.substring(0, 250) ||
            null,
          sku:
            product.sku ||
            product.productId ||
            `PRO-${String(product._id).slice(-6).toUpperCase()}`,
          quantity: Number(item.quantity || 0),
          price: unitPrice,
          discount: 0,
          taxableAmount: lineSubtotal,
          taxPercent: 0,
          taxAmount: 0,
          taxComponents: { cgst: 0, sgst: 0, igst: 0 },
          taxMode: null,
          total: lineSubtotal,
          status: 'pending',
          hsnCode: product.hsnCode || null,
        });

        calcItems.push({
          productId: product._id,
          quantity: Number(item.quantity || 0),
          price: unitPrice,
          hsnCode: product.hsnCode || null,
          taxSlabs: product.taxSlabs || [],
          taxRate: product.taxRate,
          taxClassKey: product.taxClassKey,
          weight: product.weight || 0,
          length: product.length || 0,
          width: product.width || 0,
          height: product.height || 0,
          isHeavy: Boolean(product.isHeavy),
          isFragile: Boolean(product.isFragile),
        });
      }

      const totals = await checkoutTotals.calculateTotals({
        items: calcItems,
        shippingAddress: null,
        paymentMethod: null,
        couponCode: cart.couponCode || null,
        userId: user.id,
      });

      (totals.items || []).forEach((calc, idx) => {
        if (!orderItems[idx]) return;
        orderItems[idx].discount = Number(calc.discount || 0);
        orderItems[idx].taxableAmount = Number(calc.taxableAmount || 0);
        orderItems[idx].taxPercent = Number(calc.taxPercent || 0);
        orderItems[idx].taxMode = calc.taxMode || null;
        orderItems[idx].taxComponents = calc.taxComponents || {
          cgst: 0,
          sgst: 0,
          igst: 0,
        };
        orderItems[idx].taxAmount = Number(calc.taxAmount || 0);
        orderItems[idx].total = Number(calc.total || 0);
      });

      subtotal = Number(totals.subtotal || 0);
      const discount = Number(totals.discountAmount || 0);
      const taxAmount = Number(totals.taxAmount || 0);
      const taxBreakdown = totals.taxBreakdown || { cgst: 0, sgst: 0, igst: 0 };
      const shippingFee = Number(totals.shippingFee || 0);
      const grandTotal = Number(totals.grandTotal || 0);

      const couponPayload = {
        couponId: totals.coupon?.couponId || null,
        couponCode: totals.coupon?.couponCode || null,
      };

      [order] = await orderRepo.createOrder(
        {
          userId: user.id,
          shippingAddressId: null,
          billingAddressId: null,
          orderNumber: await generateOrderNumber(),
          totalItems,
          subtotal: roundCurrency(subtotal),
          discountAmount: roundCurrency(discount),
          couponId: couponPayload.couponId,
          couponCode: couponPayload.couponCode,
          taxAmount: roundCurrency(taxAmount),
          taxBreakdown: {
            cgst: roundCurrency(Number(taxBreakdown.cgst || 0)),
            sgst: roundCurrency(Number(taxBreakdown.sgst || 0)),
            igst: roundCurrency(Number(taxBreakdown.igst || 0)),
          },
          shippingFee: roundCurrency(shippingFee),
          grandTotal: roundCurrency(grandTotal),
          paymentStatus: PAYMENT_STATUS.PENDING,
          orderStatus: ORDER_STATUS.CREATED,
          paymentMethod: null,
          placedAt: new Date(),
        },
        session,
      );

      orderItems.forEach((item) => {
        item.orderId = order._id;
      });
      await orderRepo.createItems(orderItems, session);

      if (couponPayload.couponId) {
        await couponRepo.recordUsage(
          {
            couponId: couponPayload.couponId,
            userId: user.id,
            orderId: order._id,
          },
          session,
        );
      }

      draft = await CheckoutDraft.create(
        [
          {
            userId: user.id,
            cartId: cart._id,
            cartSnapshot: {
              itemCount: cartItems.length,
              totalQuantity,
              items: cartItems.map((item) => ({
                productId: item.productId,
                quantity: Number(item.quantity || 0),
                priceAtTime: Number(item.priceAtTime || 0),
              })),
            },
            addressIds: {
              shippingAddressId: null,
              billingAddressId: null,
            },
            paymentMethod: null,
            couponCode: couponPayload.couponCode || cart.couponCode || null,
            totalsSnapshot: {
              subtotal: roundCurrency(subtotal),
              discountAmount: roundCurrency(discount),
              taxAmount: roundCurrency(taxAmount),
              shippingFee: roundCurrency(shippingFee),
              grandTotal: roundCurrency(grandTotal),
            },
            status: CHECKOUT_DRAFT_STATUS.DRAFT,
            orderId: order._id,
            expiresAt: buildExpiresAt(),
          },
        ],
        { session },
      ).then((rows) => rows[0]);

      if (!session._isStandalone && session.inTransaction()) {
        await session.commitTransaction();
      }

      const orderJobs = require('../../jobs/order.jobs');
      if (typeof orderJobs?.scheduleAutoCancel !== 'function') {
        error(
          'Order auto-cancel scheduler unavailable',
          500,
          'SCHEDULER_UNAVAILABLE',
        );
      }
      await orderJobs.scheduleAutoCancel(order._id);

      return {
        draftId: draft._id,
        orderId: order._id,
        status: draft.status,
        expiresAt: draft.expiresAt,
      };
    } catch (err) {
      if (!session._isStandalone && session.inTransaction()) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      session.endSession();
      if (couponLocked) {
        await couponRepo.unlockCoupon({
          couponId: cart?.couponId,
          userId: user.id,
          sessionId,
          scope: 'coupon',
        });
      }
    }
  }

  async getDraft({ user, draftId }) {
    const draft = await CheckoutDraft.findById(draftId);
    if (!draft) error('Checkout draft not found', 404, 'DRAFT_NOT_FOUND');

    if (String(draft.userId) !== String(user.id)) {
      error('Access denied', 403, 'FORBIDDEN');
    }

    if (
      draft.status === CHECKOUT_DRAFT_STATUS.DRAFT &&
      draft.expiresAt &&
      draft.expiresAt.getTime() < Date.now()
    ) {
      draft.status = CHECKOUT_DRAFT_STATUS.EXPIRED;
      await draft.save();
      error('Checkout draft expired', 409, 'DRAFT_EXPIRED');
    }

    return toObject(draft);
  }

  async markPendingFromOrder({
    draftId,
    userId,
    orderId,
    shippingAddressId,
    billingAddressId,
    paymentMethod,
    couponCode,
    session,
  }) {
    const updated = await CheckoutDraft.findOneAndUpdate(
      {
        _id: draftId,
        userId,
        status: CHECKOUT_DRAFT_STATUS.DRAFT,
      },
      {
        status: CHECKOUT_DRAFT_STATUS.PENDING,
        orderId,
        paymentMethod,
        couponCode: couponCode || null,
        addressIds: {
          shippingAddressId: shippingAddressId || null,
          billingAddressId: billingAddressId || null,
        },
        expiresAt: buildExpiresAt(),
      },
      { new: true, session },
    );

    if (!updated) {
      error('Checkout draft already used or expired', 409, 'DRAFT_INVALID');
    }

    return updated;
  }

  async markPaidByOrderId(orderId, session) {
    return CheckoutDraft.findOneAndUpdate(
      { orderId },
      {
        status: CHECKOUT_DRAFT_STATUS.PAID,
        expiresAt: new Date(),
      },
      { new: true, session },
    );
  }

  async markExpiredByOrderId(orderId, session) {
    return CheckoutDraft.findOneAndUpdate(
      {
        orderId,
        status: { $in: [CHECKOUT_DRAFT_STATUS.DRAFT, CHECKOUT_DRAFT_STATUS.PENDING] },
      },
      { status: CHECKOUT_DRAFT_STATUS.EXPIRED },
      { new: true, session },
    );
  }

  async retryPayment({ user, draftId, context = {} as Record<string, unknown> }) {
    const draft = await CheckoutDraft.findById(draftId);
    if (!draft) error('Checkout draft not found', 404, 'DRAFT_NOT_FOUND');

    if (String(draft.userId) !== String(user.id)) {
      error('Access denied', 403, 'FORBIDDEN');
    }

    if (draft.status !== CHECKOUT_DRAFT_STATUS.PENDING || !draft.orderId) {
      error('Draft is not eligible for payment retry', 409, 'DRAFT_NOT_PENDING');
    }

    const order = await orderRepo.findById(draft.orderId);
    if (!order) error('Order not found', 404, 'ORDER_NOT_FOUND');

    if (String(order.userId) !== String(user.id)) {
      error('Access denied - order belongs to another user', 403);
    }

    if (order.paymentMethod !== 'razorpay') {
      error('Retry is only supported for online payments', 409);
    }

    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      error('Order is already paid', 409);
    }

    if (order.orderStatus !== ORDER_STATUS.CREATED) {
      error('Order is no longer eligible for retry', 409);
    }

    const paymentService = require('../payments/payments.service');
    const initiation = await paymentService.initiatePayment({
      orderId: order._id,
      gateway: 'razorpay',
      context: {
        ...context,
        userId: user.id,
      },
    });

    return {
      draftId: draft._id,
      orderId: order._id,
      status: draft.status,
      ...initiation,
    };
  }

  async expireStaleDrafts() {
    const cutoff = new Date(Date.now() - getDraftTtlMinutes() * 60 * 1000);
    const result = await CheckoutDraft.updateMany(
      {
        status: CHECKOUT_DRAFT_STATUS.DRAFT,
        createdAt: { $lte: cutoff },
      },
      { $set: { status: CHECKOUT_DRAFT_STATUS.EXPIRED } },
    );

    return {
      matchedCount: Number(result?.matchedCount || 0),
      modifiedCount: Number(result?.modifiedCount || 0),
      cutoff,
      ttlMinutes: getDraftTtlMinutes(),
    };
  }
}

module.exports = new CheckoutDraftService();
