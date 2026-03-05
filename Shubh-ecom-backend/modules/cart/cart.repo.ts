const Cart = require('../../models/Cart.model');
const CartItem = require('../../models/CartItem.model');

type CartItemPayload = Record<string, unknown> & {
  productId?: string;
};

type QuantityUpdate = {
  quantity: number;
  priceAtTime?: number;
};

type CartRepoError = Error & {
  code?: number | string;
  details?: Record<string, unknown> | null;
  keyPattern?: Record<string, unknown> | null;
  keyValue?: Record<string, unknown> | null;
};

class CartRepository {
  async getByUserId(userId) {
    if (!userId) return null;
    return Cart.findOne({ userId }).lean();
  }

  async clearCartByUserId(userId) {
    const cart = await this.getByUserId(userId);
    if (!cart?._id) {
      return { cleared: false, cartId: null, removedItems: 0 };
    }

    const deleteResult = await CartItem.deleteMany({ cartId: cart._id });
    await Cart.findByIdAndUpdate(cart._id, {
      couponId: null,
      couponCode: null,
      discountAmount: 0,
    });

    return {
      cleared: true,
      cartId: cart._id,
      removedItems: Number(deleteResult?.deletedCount || 0),
    };
  }

  async getOrCreateCart({ userId, sessionId }) {
    // Fix: Find by userId if available, regardless of sessionId mismatch
    // This solves the issue where finding by {userId, sessionId} fails if the stored sessionId differs
    const query = userId ? { userId } : { sessionId };

    let cart = await Cart.findOne(query).lean();
    if (cart) return cart;

    try {
      cart = await Cart.create({
        userId: userId || undefined,
        sessionId: userId ? undefined : sessionId
      });
    } catch (error) {
      const repoError = error as CartRepoError;
      // Handle duplicate key error (race condition)
      if (repoError.code === 11000) {
        cart = await Cart.findOne(query).lean();
        if (cart) return cart;
      }
      throw repoError;
    }

    return cart.toObject ? cart.toObject() : cart;
  }

  async addItem({ cartId, item }) {
    const { quantity, ...rest } = item;

    const filter = { cartId, productId: item.productId };
    const update = {
      $set: { ...rest, cartId },
      $inc: { quantity: quantity },
    };

    try {
      return await CartItem.findOneAndUpdate(filter, update, {
        upsert: true,
        new: true,
      }).lean();
    } catch (err) {
      const repoError = err as CartRepoError;
      // Recover from race/duplicate scenarios by retrying idempotent update once.
      if (repoError?.code === 11000) {
        const recovered = await CartItem.findOneAndUpdate(filter, update, {
          upsert: false,
          new: true,
        }).lean();

        if (recovered) return recovered;

        const keyPattern = repoError?.keyPattern || null;
        const keyValue = repoError?.keyValue || null;
        const conflict = new Error('Cart index conflict detected. Please sync indexes and retry.') as CartRepoError;
        conflict.code = 'CART_INDEX_CONFLICT';
        conflict.details = { keyPattern, keyValue };
        throw conflict;
      }
      throw repoError;
    }
  }

  async updateQty({ cartId, itemId, quantity, priceAtTime }) {
    const update: QuantityUpdate = { quantity };
    if (priceAtTime != null) update.priceAtTime = priceAtTime;
    return CartItem.findOneAndUpdate(
      { _id: itemId, cartId },
      update,
      { new: true },
    ).lean();
  }

  async removeItem({ cartId, itemId }) {
    return CartItem.findOneAndDelete({ _id: itemId, cartId });
  }

  async getItemById({ cartId, itemId }) {
    return CartItem.findOne({ _id: itemId, cartId }).lean();
  }

  async getCartWithItems(cartId) {
    const items = await CartItem.find({ cartId }).lean();
    return items;
  }
}

module.exports = new CartRepository();

