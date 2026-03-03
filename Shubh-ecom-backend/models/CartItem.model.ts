// @ts-nocheck
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true },
    priceType: { type: String, enum: ['retail', 'wholesale'], required: true },
    priceAtTime: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

cartItemSchema.index({ cartId: 1, productId: 1 }, { unique: true });

const CartItem = mongoose.model('CartItem', cartItemSchema);

const syncCartItemIndexes = async () => {
  try {
    // Keeps only indexes declared in schema and drops legacy/misaligned ones.
    await CartItem.syncIndexes();
  } catch (error) {
    // Non-fatal: app should continue even if index sync cannot run.
    console.warn('[CART_ITEM_MODEL] Index sync skipped:', error?.message || error);
  }
};

if (mongoose.connection.readyState === 1) {
  syncCartItemIndexes();
} else {
  mongoose.connection.once('open', syncCartItemIndexes);
}

module.exports = CartItem;

