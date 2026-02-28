// @ts-nocheck
const mongoose = require('mongoose');

const CHECKOUT_DRAFT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PAID: 'paid',
  EXPIRED: 'expired',
};

const checkoutDraftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',
      default: null,
    },
    cartSnapshot: {
      itemCount: { type: Number, default: 0 },
      totalQuantity: { type: Number, default: 0 },
      items: [
        {
          productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
          quantity: { type: Number, default: 0 },
          priceAtTime: { type: Number, default: 0 },
        },
      ],
    },
    addressIds: {
      shippingAddressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserAddress',
        default: null,
      },
      billingAddressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserAddress',
        default: null,
      },
    },
    paymentMethod: {
      type: String,
      enum: ['cod', 'razorpay'],
      default: null,
    },
    couponCode: { type: String, default: null },
    totalsSnapshot: {
      subtotal: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      taxAmount: { type: Number, default: 0 },
      shippingFee: { type: Number, default: 0 },
      grandTotal: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: Object.values(CHECKOUT_DRAFT_STATUS),
      default: CHECKOUT_DRAFT_STATUS.DRAFT,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

checkoutDraftSchema.index({ userId: 1, createdAt: -1 });
checkoutDraftSchema.index({ status: 1, createdAt: 1 });

const CheckoutDraft = mongoose.model('CheckoutDraft', checkoutDraftSchema);

module.exports = CheckoutDraft;
module.exports.CHECKOUT_DRAFT_STATUS = CHECKOUT_DRAFT_STATUS;
