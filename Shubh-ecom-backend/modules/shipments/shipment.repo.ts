import type { ShipmentsRequestShape } from './shipments.types';
const Shipment = require('../../models/Shipment.model');
const { getOffsetPagination } = require('../../utils/pagination');

class ShipmentRepository {
  create(data) {
    return Shipment.create(data);
  }

  findByOrderItem(orderItemId) {
    return Shipment.findOne({ orderItemId }).lean();
  }
  findByOrder(orderId) {
    return Shipment.find({ orderId }).lean();
  }

  findById(id) {
    return Shipment.findById(id).lean();
  }

  list(filter: any = {}, pagination: any = {}) {
    const { limit, skip } = getOffsetPagination(pagination);
    return Shipment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  count(filter: any = {}) {
    return Shipment.countDocuments(filter);
  }

  remove(id) {
    return Shipment.findByIdAndDelete(id).lean();
  }

  updateStatus(orderItemId, update) {
    return Shipment.findOneAndUpdate({ orderItemId }, update, {
      new: true,
    }).lean();
  }

  updateStatusWithHistory(orderItemId, update, nextStatus) {
    const updateDoc: any = { $set: update };
    if (nextStatus) {
      updateDoc.$push = {
        statusHistory: { status: nextStatus, at: new Date() },
      };
    }

    return Shipment.findOneAndUpdate({ orderItemId }, updateDoc, {
      new: true,
    }).lean();
  }
}

module.exports = new ShipmentRepository();
