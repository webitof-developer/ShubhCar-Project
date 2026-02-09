const mongoose = require('mongoose');

const taxSlabSchema = new mongoose.Schema(
  {
    hsnCode: { 
      type: String, 
      required: [true, 'HSN code is required'],
      unique: true,
      validate: {
        validator: function(v) {
          return /^\d{8}$/.test(v);
        },
        message: 'HSN code must be exactly 8 digits'
      },
      index: true 
    },
    rate: { 
      type: Number, 
      required: [true, 'Tax rate is required'],
      min: [0, 'Tax rate cannot be negative'],
      max: [1, 'Tax rate cannot exceed 1 (100%)']
    }, // e.g. 0.18 for 18%
    minAmount: { 
      type: Number, 
      default: 0,
      min: [0, 'Minimum amount cannot be negative']
    },
    maxAmount: { 
      type: Number, 
      default: null,
      validate: {
        validator: function(v) {
          if (v === null || v === undefined) return true;
          return v >= this.minAmount;
        },
        message: 'Maximum amount must be greater than or equal to minimum amount'
      }
    },
    status: { 
      type: String, 
      enum: {
        values: ['active', 'inactive'],
        message: 'Status must be either active or inactive'
      },
      default: 'active' 
    },
  },
  { timestamps: true },
);

taxSlabSchema.index({ hsnCode: 1, status: 1 });
taxSlabSchema.index({ hsnCode: 1, minAmount: 1, maxAmount: 1 });

module.exports = mongoose.model('TaxSlab', taxSlabSchema);
