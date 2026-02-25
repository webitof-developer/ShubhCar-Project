// @ts-nocheck
const mongoose = require('mongoose');

const productVariantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantName: { type: String, required: true },
    sku: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number, default: null },
    stockQty: {
      type: Number,
      default: 0, // total stock
      min: 0,
    },
    reservedQty: {
      type: Number,
      default: 0, // temporarily reserved
      min: 0,
    },
    weight: { type: Number },
    length: { type: Number },
    width: { type: Number },
    height: { type: Number },
    barcode: { type: String },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true },
);

productVariantSchema.index({ productId: 1, status: 1 });
productVariantSchema.index({ sku: 1 }, { unique: true, sparse: true });
productVariantSchema.index({ productId: 1, updatedAt: -1 });

module.exports = mongoose.model('ProductVariant', productVariantSchema);

