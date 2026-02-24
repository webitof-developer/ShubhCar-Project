// Temporary admin service methods for orders - to be integrated into orders.service.js
const Order = require('../../models/Order.model');
const orderRepo = require('./order.repo');
const orderEventRepo = require('./orderEvent.repo');
const shipmentRepo = require('../shipments/shipment.repo');
const { error } = require('../../utils/apiResponse');
const { attachPaymentSummary } = require('./paymentSummary');
const { ORDER_STATUS_LIST } = require('../../constants/orderStatus');
const mongoose = require('mongoose');
const ProductImage = require('../../models/ProductImage.model');
const userRepo = require('../users/user.repo');
const Role = require('../../models/Role.model');
// Security: Escape user input before constructing RegExp to prevent ReDoS.
const { escapeRegex } = require('../../utils/escapeRegex');
const { getOffsetPagination, buildPaginationMeta } = require('../../utils/pagination');

const isSalesmanActor = async (actor = {}) => {
  if (String(actor?.role || '').toLowerCase() === 'salesman') return true;
  const actorId = actor?.id || actor?._id;
  if (!actorId || !mongoose.Types.ObjectId.isValid(actorId)) return false;
  const actorUser = await userRepo.findById(actorId);
  if (!actorUser) return false;
  if (String(actorUser.role || '').toLowerCase() === 'salesman') return true;
  if (!actorUser.roleId) return false;
  const roleDoc = await Role.findById(actorUser.roleId).select('slug name').lean();
  const slug = String(roleDoc?.slug || '').toLowerCase();
  const name = String(roleDoc?.name || '').toLowerCase();
  return slug === 'salesman' || name.includes('salesman');
};

// Admin list orders method
exports.adminList = async (query = {}, actor = {}) => {
  const {
    status,
    paymentStatus,
    customerType,
    productType,
    page = 1,
    limit = 20,
    from,
    to,
    userId,
    search,
    summary,
  } = query;

  const pagination = getOffsetPagination({ page, limit });
  const skip = pagination.skip;
  const filter = { isDeleted: false };
  const isSalesman = await isSalesmanActor(actor);

  if (status) filter.orderStatus = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (isSalesman) {
    filter.salesmanId = new mongoose.Types.ObjectId(actor.id);
  }
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    filter.userId = new mongoose.Types.ObjectId(userId);
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const searchValue = search || '';
  const hasSearch = Boolean(searchValue);
  const searchRegex = hasSearch ? new RegExp(escapeRegex(searchValue), 'i') : null;
  const normalizedCustomerType = String(customerType || '')
    .trim()
    .toLowerCase();
  const normalizedProductTypes = String(productType || '')
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean)
    .filter((value) => ['OEM', 'AFTERMARKET'].includes(value));
  const customerTypeMatch =
    normalizedCustomerType && normalizedCustomerType !== 'all'
      ? { 'user.customerType': normalizedCustomerType }
      : null;
  const hasProductTypeFilter = normalizedProductTypes.length > 0;
  const searchMatch = hasSearch
    ? {
      $or: [
        { orderNumber: searchRegex },
        { 'user.firstName': searchRegex },
        { 'user.lastName': searchRegex },
        { 'user.email': searchRegex },
        { 'user.phone': searchRegex },
      ],
    }
    : null;

  if (hasSearch && mongoose.Types.ObjectId.isValid(searchValue)) {
    searchMatch.$or.push({ _id: new mongoose.Types.ObjectId(searchValue) });
  }

  const pipeline = [
    { $match: filter },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
  ];

  const summaryMode = String(summary || '').toLowerCase() === 'true' || summary === '1';

  if (!summaryMode) {
    pipeline.push(
      {
        $lookup: {
          from: 'useraddresses',
          localField: 'shippingAddressId',
          foreignField: '_id',
          as: 'shippingAddress',
        },
      },
      { $unwind: { path: '$shippingAddress', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          userId: '$user',
          shippingAddressId: '$shippingAddress',
        },
      },
    );
  } else {
    pipeline.push(
      {
        $addFields: {
          userId: '$user',
        },
      },
      {
        $project: {
          user: 0,
          shippingAddressId: 0,
          billingAddressId: 0,
          shippingAddress: 0,
          billingAddress: 0,
          items: 0,
          codPayments: 0,
          taxBreakdown: 0,
          couponId: 0,
        },
      },
    );
  }

  if (searchMatch) {
    pipeline.push({ $match: searchMatch });
  }
  if (customerTypeMatch) {
    pipeline.push({ $match: customerTypeMatch });
  }
  if (hasProductTypeFilter) {
    pipeline.push(
      {
        $lookup: {
          from: 'orderitems',
          localField: '_id',
          foreignField: 'orderId',
          as: 'orderItems',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.productId',
          foreignField: '_id',
          as: 'orderProducts',
        },
      },
      {
        $match: {
          'orderProducts.productType': { $in: normalizedProductTypes },
        },
      },
      {
        $project: {
          orderItems: 0,
          orderProducts: 0,
        },
      },
    );
  }

  pipeline.push({
    $facet: {
      items: [{ $skip: skip }, { $limit: pagination.limit }],
      total: [{ $count: 'count' }],
    },
  });

  const [result] = await Order.aggregate(pipeline);
  const items = (result?.items || []).map(attachPaymentSummary);
  const total = result?.total?.[0]?.count || 0;
  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages,
    pagination: buildPaginationMeta({ ...pagination, total }),
  };
};

// Admin get status counts method
exports.adminGetStatusCounts = async (actor = {}) => {
  const match = { isDeleted: false };
  if (await isSalesmanActor(actor)) {
    match.salesmanId = new mongoose.Types.ObjectId(actor.id);
  }
  const counts = await Order.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  const statusCounts = ORDER_STATUS_LIST.reduce(
    (acc, status) => {
      acc[status] = 0;
      return acc;
    },
    { all: 0 },
  );

  counts.forEach(({ _id, count }) => {
    if (_id) {
      statusCounts[_id] = count;
      statusCounts.all += count;
    }
  });

  return statusCounts;
};

// Admin get single order
exports.adminGetOrder = async (orderId, actor = {}) => {
  const filter = { _id: orderId };
  if (await isSalesmanActor(actor)) {
    filter.salesmanId = actor.id;
  }
  const order = await Order.findOne(filter)
    .populate('userId', 'firstName lastName email phone customerType')
    .populate('salesmanId', 'firstName lastName email phone')
    .populate('shippingAddressId')
    .populate('billingAddressId')
    .lean();
  if (!order) {
    error('Order not found', 404);
  }

  const [items, shipments, events] = await Promise.all([
    orderRepo.findItemsByOrderWithDetails(orderId),
    shipmentRepo.list({ orderId }, { page: 1, limit: 100 }),
    orderEventRepo.listByOrder(orderId),
  ]);
  const productIds = items
    .map((item) => item.productId?._id || item.productId)
    .filter(Boolean);
  const images = productIds.length
    ? await ProductImage.find({ productId: { $in: productIds }, isDeleted: false })
        .sort({ isPrimary: -1, sortOrder: 1 })
        .lean()
    : [];
  const imageMap = new Map();
  images.forEach((img) => {
    const key = String(img.productId);
    if (!imageMap.has(key)) imageMap.set(key, []);
    imageMap.get(key).push({ url: img.url, altText: img.altText });
  });
  const enrichedItems = items.map((item) => {
    const productId = item.productId?._id || item.productId;
    const productImages = productId ? imageMap.get(String(productId)) || [] : [];
    if (item.productId && typeof item.productId === 'object') {
      return { ...item, productId: { ...item.productId, images: productImages } };
    }
    return { ...item, productImages };
  });
  const result = { order: attachPaymentSummary(order), items: enrichedItems, shipments, events };
  return result;
};

// Admin get order history
exports.adminGetOrderHistory = async (orderId) => {
  const events = await orderEventRepo.findByOrder(orderId);
  return events;
};

// Admin get order notes
exports.adminGetOrderNotes = async (orderId) => {
  const events = await orderEventRepo.findByOrder(orderId);
  // Filter for note-type events
  const notes = events.filter(e => e.noteType && ['customer', 'system', 'private'].includes(e.noteType));
  return notes;
};

// Admin add order note
exports.adminAddOrderNote = async ({ admin, orderId, payload }) => {
  if (await isSalesmanActor(admin)) {
    error('Salesman cannot edit orders', 403);
  }

  const { noteType, noteContent } = payload;
  
  const order = await orderRepo.findByIdLean(orderId);
  if (!order) error('Order not found', 404);

  const event = await orderEventRepo.log({
    orderId,
    type: 'NOTE_ADDED',
    previousStatus: order.orderStatus,
    newStatus: order.orderStatus,
    actor: { type: 'admin', actorId: admin.id },
    noteType: noteType || 'private',
    noteContent,
  });

  return event;
};
