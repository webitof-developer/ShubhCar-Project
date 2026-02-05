const mongoose = require('mongoose');

const orderVendorSplitSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true,
      index: true,
    },

    vendorSubtotal: { type: Number, required: true, immutable: true },
    vendorTax: { type: Number, default: 0, immutable: true },
    vendorShippingShare: { type: Number, default: 0, immutable: true },
    platformCommission: { type: Number, default: 0, immutable: true },
    finalPayout: { type: Number, required: true, immutable: true },

    payoutStatus: {
      type: String,
      enum: ['pending', 'processed', 'on_hold'],
      default: 'pending',
      index: true,
    },

    processedAt: { type: Date },
  },
  { timestamps: true },
);

orderVendorSplitSchema.index({ orderId: 1, vendorId: 1 });
orderVendorSplitSchema.index({ vendorId: 1, payoutStatus: 1, createdAt: -1 });

const IMMUTABLE_FIELDS = [
  'orderId',
  'vendorId',
  'vendorSubtotal',
  'vendorTax',
  'vendorShippingShare',
  'platformCommission',
  'finalPayout',
];

const guardImmutable = function (next) {
  const update = this.getUpdate() || {};
  const touched = new Set();
  const check = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    IMMUTABLE_FIELDS.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(obj, field)) touched.add(field);
    });
  };

  check(update);
  ['$set', '$inc', '$unset'].forEach((op) => check(update[op]));

  if (touched.size) {
    return next(
      new Error(
        `Immutable vendor split fields cannot be modified: ${[
          ...touched,
        ].join(', ')}`,
      ),
    );
  }
  return next();
};

orderVendorSplitSchema.pre('updateOne', guardImmutable);
orderVendorSplitSchema.pre('updateMany', guardImmutable);
orderVendorSplitSchema.pre('findOneAndUpdate', guardImmutable);
orderVendorSplitSchema.pre('findByIdAndUpdate', guardImmutable);

module.exports = mongoose.model('OrderVendorSplit', orderVendorSplitSchema);
