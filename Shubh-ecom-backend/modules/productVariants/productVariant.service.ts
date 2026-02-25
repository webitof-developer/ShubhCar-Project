import type { ProductVariantsRequestShape } from './productVariants.types';
const mongoose = require('mongoose');
const { createSafeSession } = require('../../utils/mongoTransaction');
const ProductVariant = require('../../models/ProductVariant.model');
const InventoryLog = require('../../models/InventoryLog.model');
const { error } = require('../../utils/apiResponse');

class ProductVariantService {
  /**
   * Create a new product variant
   */
  async create(productId, payload, user) {
    if (!user) error('Unauthorized', 401);

    const variant = await ProductVariant.create({
      productId,
      ...payload,
      createdBy: user._id,
    });

    return variant.toObject();
  }

  /**
   * Get all variants for a product
   */
  async listByProduct(productId) {
    const variants = await ProductVariant.find({
      productId,
      isDeleted: false,
    }).lean();

    return variants;
  }

  /**
   * Get a single variant by ID
   */
  async getById(variantId) {
    const variant = await ProductVariant.findOne({
      _id: variantId,
      isDeleted: false,
    }).lean();

    if (!variant) error('Variant not found', 404);
    return variant;
  }

  /**
   * Update a product variant
   */
  async update(variantId, payload, user) {
    if (!user) error('Unauthorized', 401);

    const variant = await ProductVariant.findOne({
      _id: variantId,
      isDeleted: false,
    });

    if (!variant) error('Variant not found', 404);

    // Update fields
    Object.assign(variant, payload);
    variant.updatedBy = user._id;

    await variant.save();
    return variant.toObject();
  }

  /**
   * Soft delete a product variant
   */
  async remove(variantId, user) {
    if (!user) error('Unauthorized', 401);

    const variant = await ProductVariant.findOne({
      _id: variantId,
      isDeleted: false,
    });

    if (!variant) error('Variant not found', 404);

    variant.isDeleted = true;
    variant.deletedAt = new Date();
    variant.deletedBy = user._id;

    await variant.save();
    return { message: 'Variant deleted successfully' };
  }

  /**
   * Admin stock adjustment with audit log.
   * Delta can be positive (increase) or negative (decrease).
   */
  async adjustStock({
    variantId,
    delta,
    changeType = 'admin_adjust',
    referenceId,
  }) {
    if (!delta || delta === 0) error('delta must be non-zero', 400);

    const session = await createSafeSession();
    if (!session._isStandalone) {
      session.startTransaction({ readPreference: 'primary' });
    }

    try {
      const variant = await ProductVariant.findById(variantId).session(session);
      if (!variant) error('Variant not found', 404);

      const newStock = variant.stockQty + delta;
      if (newStock < 0 || newStock < variant.reservedQty) {
        error('Stock adjustment would go negative or below reserved', 400);
      }

      const previousStock = variant.stockQty;
      variant.stockQty = newStock;
      await variant.save({ session });

      await InventoryLog.create(
        {
          productVariantId: variantId,
          vendorId: variant.productId, // vendorId not available on variant schema; use productId as fallback
          changeType,
          quantityChanged: delta,
          previousStock,
          newStock,
          referenceId,
        },
        { session },
      );

      if (!session._isStandalone && session.inTransaction()) {
        await session.commitTransaction();
      }
      return variant.toObject();
    } catch (e) {
      if (!session._isStandalone && session.inTransaction()) {
        await session.abortTransaction();
      }
      throw e;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new ProductVariantService();
