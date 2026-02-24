const shipmentRepo = require('./shipment.repo');
const OrderItem = require('../../models/OrderItem.model');
const { error } = require('../../utils/apiResponse');
const orderJobs = require('../../jobs/order.jobs');
const orderRepo = require('../orders/order.repo');
const { PAYMENT_STATUS } = require('../../constants/paymentStatus');
const orderItemsRepo = require('../orderItems/orderItems.repo');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

const ROLES = require('../../constants/roles');

const ALLOWED_TRANSITIONS = {
  pending: ['shipped', 'cancelled'],
  shipped: ['in_transit', 'delivered', 'cancelled', 'returned'],
  in_transit: ['delivered', 'cancelled', 'returned'],
  delivered: [],
  cancelled: [],
  returned: [],
};

class ShipmentService {
  async createShipment(orderItemId, payload) {
    /* =====================
     LOAD ORDER ITEM
  ====================== */
    const orderItem = await OrderItem.findById(orderItemId).lean();
    if (!orderItem) error('Order item not found', 404);

    /* =====================
     LOAD PARENT ORDER
  ====================== */
    const order = await orderRepo.findById(orderItem.orderId);
    if (!order) error('Order not found', 404);

    /* =====================
     🔒 HARD GUARD: PAYMENT
  ====================== */
    if (order.paymentStatus !== PAYMENT_STATUS.PAID) {
      error('Cannot create shipment for unpaid order', 409, 'PAYMENT_REQUIRED');
    }

    /* =====================
     STATE VALIDATION
  ====================== */
    if (!['confirmed', 'packed'].includes(order.orderStatus)) {
      error('Order not eligible for shipment', 409, 'INVALID_ORDER_STATE');
    }

    /* =====================
     DUPLICATE CHECK
  ====================== */
    const existing = await shipmentRepo.findByOrderItem(orderItemId);
    if (existing) error('Shipment already exists for this item', 400);

    if (!payload.shippingProviderId || !payload.trackingNumber) {
      error('shippingProviderId and trackingNumber are required', 400);
    }

    /* =====================
     CREATE SHIPMENT
  ====================== */
    const shipment = await shipmentRepo.create({
      orderId: order._id,
      orderItemId,
      shippingProviderId: payload.shippingProviderId,
      carrierName: payload.carrierName,
      trackingNumber: payload.trackingNumber,
      trackingUrlFormat: payload.trackingUrlFormat,
      shippedAt: payload.shippedAt || new Date(),
      estimatedDeliveryDate: payload.estimatedDeliveryDate,
      statusHistory: [{ status: 'shipped', at: new Date() }],
      status: 'shipped',
    });

    /* =====================
     SYNC ORDER ITEM
  ====================== */
    await OrderItem.findByIdAndUpdate(orderItemId, { status: 'shipped' });

    /* =====================
     NOTIFY
  ====================== */
    await orderJobs.enqueueStatusNotification(orderItem.orderId, 'shipped');

    return shipment;
  }

  /**
   * Create pending shipment shells per order item.
   * Used by background job to hand off fulfillment to fulfillment partners.
   */
  async prepareForOrder(orderId) {
    const items = await orderItemsRepo.findByOrderId(orderId);
    if (!items || !items.length) return [];

    const prepared = [];
    for (const item of items) {
      const existing = await shipmentRepo.findByOrderItem(item._id);
      if (existing) continue;

      const shipment = await shipmentRepo.create({
        orderId,
        orderItemId: item._id,
        status: 'pending',
        statusHistory: [{ status: 'pending', at: new Date() }],
      });
      prepared.push(shipment);
    }
    return prepared;
  }

  async updateShipmentStatus(orderItemId, payload) {
    const shipment = await shipmentRepo.findByOrderItem(orderItemId);
    if (!shipment) error('Shipment not found', 404);

    const orderItem = await OrderItem.findById(orderItemId).lean();
    if (!orderItem) error('Order item not found', 404);

    const allowedStatuses = Object.keys(ALLOWED_TRANSITIONS).filter(
      (s) => s !== 'pending',
    );
    const nextStatus = payload.status;
    if (nextStatus && !allowedStatuses.includes(nextStatus)) {
      error('Invalid shipment status', 400);
    }

    if (nextStatus) {
      const transitions = ALLOWED_TRANSITIONS[shipment.status] || [];
      if (!transitions.includes(nextStatus)) {
        error(
          `Cannot move shipment from ${shipment.status} to ${nextStatus}`,
          409,
        );
      }
    }

    const update = {
      carrierName: payload.carrierName ?? shipment.carrierName,
      shippingProviderId:
        payload.shippingProviderId ?? shipment.shippingProviderId,
      trackingNumber: payload.trackingNumber ?? shipment.trackingNumber,
      trackingUrlFormat:
        payload.trackingUrlFormat ?? shipment.trackingUrlFormat,
      estimatedDeliveryDate:
        payload.estimatedDeliveryDate ?? shipment.estimatedDeliveryDate,
    };

    if (nextStatus) update.status = nextStatus;
    if (nextStatus === 'delivered' && !payload.deliveredAt) {
      update.deliveredAt = new Date();
    } else if (payload.deliveredAt) {
      update.deliveredAt = payload.deliveredAt;
    }

    const updatedShipment = await shipmentRepo.updateStatusWithHistory(
      orderItemId,
      update,
      nextStatus,
    );

    // Keep order item status in sync for key milestones
    if (nextStatus === 'delivered') {
      await OrderItem.findByIdAndUpdate(orderItemId, { status: 'delivered' });
    } else if (nextStatus === 'cancelled' || nextStatus === 'returned') {
      await OrderItem.findByIdAndUpdate(orderItemId, { status: 'cancelled' });
    } else if (nextStatus) {
      await OrderItem.findByIdAndUpdate(orderItemId, { status: 'shipped' });
    }

    if (nextStatus) {
      await orderJobs.enqueueStatusNotification(orderItem.orderId, nextStatus);
    }

    return updatedShipment;
  }

  async list(query = {}) {
    const { page, limit, ...filter } = query;
    const pagination = getOffsetPagination({ page, limit });
    const [data, total] = await Promise.all([
      shipmentRepo.list(filter, pagination),
      shipmentRepo.count(filter),
    ]);
    return {
      shipments: data,
      data,
      pagination: buildPaginationMeta({ ...pagination, total }),
    };
  }

  async get(id) {
    const shipment = await shipmentRepo.findById(id);
    if (!shipment) error('Shipment not found', 404);
    return shipment;
  }

  async remove(id) {
    const deleted = await shipmentRepo.remove(id);
    if (!deleted) error('Shipment not found', 404);
    return deleted;
  }

  // tarcking
  async track(user, orderItemId) {
    const orderItem = await OrderItem.findById(orderItemId).lean();
    if (!orderItem) error('Order item not found', 404);

    // ownership check
    if (
      user.role === ROLES.CUSTOMER &&
      String(orderItem.userId) !== String(user.id)
    ) {
      error('Forbidden', 403);
    }

    const shipment = await shipmentRepo.findByOrderItem(orderItemId);
    if (!shipment) error('Shipment not yet created', 404);

    return {
      status: shipment.status,
      trackingNumber: shipment.trackingNumber,
      trackingUrl: shipment.trackingUrlFormat
        ? shipment.trackingUrlFormat.replace(
            '{{trackingNumber}}',
            shipment.trackingNumber,
          )
        : null,
      shippedAt: shipment.shippedAt,
      estimatedDeliveryDate: shipment.estimatedDeliveryDate,
      deliveredAt: shipment.deliveredAt,
    };
  }

  async adminListByOrder(orderId, query = {}) {
    const orderItems = await orderItemsRepo.findByOrderId(orderId);
    if (!orderItems || !orderItems.length) {
      const pagination = getOffsetPagination({
        page: query.page,
        limit: query.limit,
      });
      return {
        shipments: [],
        data: [],
        pagination: buildPaginationMeta({ ...pagination, total: 0 }),
      };
    }

    const filter = {
      orderItemId: { $in: orderItems.map((i) => i._id) },
    };
    const pagination = getOffsetPagination({
      page: query.page,
      limit: query.limit,
    });
    const [data, total] = await Promise.all([
      shipmentRepo.list(filter, pagination),
      shipmentRepo.count(filter),
    ]);
    return {
      shipments: data,
      data,
      pagination: buildPaginationMeta({ ...pagination, total }),
    };
  }




}

module.exports = new ShipmentService();
