// @ts-nocheck
const mongoose = require('mongoose');

const userActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actor: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      role: { type: String, default: '' },
    },
    activityType: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info',
      index: true,
    },
    resource: { type: String, default: '', index: true },
    resourceId: { type: String, default: '' },
    targetDisplay: { type: String, default: '' },
    message: { type: String, default: '' },
    metadata: { type: Object, default: {} },
    requestContext: {
      ip: { type: String, default: '' },
      userAgent: { type: String, default: '' },
      requestId: { type: String, default: '' },
      method: { type: String, default: '' },
      path: { type: String, default: '' },
      statusCode: { type: Number, default: 0 },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Retain activity logs for 180 days.
userActivityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 180 },
);

module.exports = mongoose.model('UserActivityLog', userActivityLogSchema);

