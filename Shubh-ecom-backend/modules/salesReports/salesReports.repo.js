const mongoose = require('mongoose');
const Order = require('../../models/Order.model');
const OrderItem = require('../../models/OrderItem.model');

const SalesReport = require('../../models/SalesReport.model');

class SalesReportsRepo {
  create(data) {
    return SalesReport.create(data);
  }

  list(filter = {}) {
    return SalesReport.find(filter).sort({ date: -1 }).lean();
  }

  findById(id) {
    return SalesReport.findById(id).lean();
  }

  update(id, data) {
    return SalesReport.findByIdAndUpdate(id, data, { new: true }).lean();
  }

  remove(id) {
    return SalesReport.findByIdAndDelete(id).lean();
  }

  async summary({ from, to }) {
    const match = {};
    if (from || to) match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
    const orderMatch = { ...match, isDeleted: false };

    const ordersAgg = await Order.aggregate([
      { $match: orderMatch },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$grandTotal' },
        },
      },
    ]);

    const itemsAgg = await OrderItem.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalItems: { $sum: '$quantity' },
          totalItemRevenue: { $sum: '$total' },
        },
      },
    ]);

    const salesmanAgg = await Order.aggregate([
      {
        $match: {
          ...orderMatch,
          salesmanId: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$salesmanId',
          totalSales: { $sum: '$grandTotal' },
          totalCommission: {
            $sum: {
              $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 0, '$commissionAmount'],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'salesman',
        },
      },
      { $unwind: { path: '$salesman', preserveNullAndEmptyArrays: true } },
      { $sort: { totalSales: -1 } },
      {
        $project: {
          _id: 0,
          salesmanId: '$_id',
          salesmanName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ['$salesman.firstName', ''] },
                  ' ',
                  { $ifNull: ['$salesman.lastName', ''] },
                ],
              },
            },
          },
          salesmanEmail: '$salesman.email',
          totalSales: 1,
          totalCommission: 1,
        },
      },
    ]);

    return {
      orders: ordersAgg[0] || { totalOrders: 0, totalRevenue: 0 },
      items: itemsAgg[0] || { totalItems: 0, totalItemRevenue: 0 },
      salesBySalesman: salesmanAgg || [],
    };
  }

  async salesmanPerformance({ from, to, salesmanId, limit = 20, page = 1 }) {
    const orderMatch = { isDeleted: false, salesmanId: { $ne: null } };
    if (from || to) {
      orderMatch.createdAt = {};
      if (from) orderMatch.createdAt.$gte = new Date(from);
      if (to) orderMatch.createdAt.$lte = new Date(to);
    }
    if (salesmanId && mongoose.Types.ObjectId.isValid(salesmanId)) {
      orderMatch.salesmanId = new mongoose.Types.ObjectId(salesmanId);
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const [salesmenAgg, totalsAgg, productAgg, productCountAgg] = await Promise.all([
      Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: '$salesmanId',
            totalSales: { $sum: '$grandTotal' },
            totalOrders: { $sum: 1 },
            totalCommission: {
              $sum: {
                $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 0, '$commissionAmount'],
              },
            },
            lastSaleAt: { $max: '$createdAt' },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'salesman',
          },
        },
        { $unwind: { path: '$salesman', preserveNullAndEmptyArrays: true } },
        { $sort: { totalSales: -1 } },
        {
          $project: {
            _id: 0,
            salesmanId: '$_id',
            salesmanName: {
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ['$salesman.firstName', ''] },
                    ' ',
                    { $ifNull: ['$salesman.lastName', ''] },
                  ],
                },
              },
            },
            salesmanEmail: '$salesman.email',
            totalSales: 1,
            totalOrders: 1,
            totalCommission: 1,
            lastSaleAt: 1,
          },
        },
      ]),
      Order.aggregate([
        { $match: orderMatch },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$grandTotal' },
            totalOrders: { $sum: 1 },
            totalCommission: {
              $sum: {
                $cond: [{ $eq: ['$orderStatus', 'cancelled'] }, 0, '$commissionAmount'],
              },
            },
          },
        },
      ]),
      OrderItem.aggregate([
        {
          $lookup: {
            from: 'orders',
            let: { orderId: '$orderId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$orderId'] },
                  ...orderMatch,
                },
              },
              { $project: { _id: 1, salesmanId: 1, createdAt: 1 } },
            ],
            as: 'order',
          },
        },
        { $unwind: '$order' },
        {
          $group: {
            _id: '$productId',
            quantitySold: { $sum: '$quantity' },
            revenue: { $sum: '$total' },
            orderIds: { $addToSet: '$orderId' },
            salesmen: { $addToSet: '$order.salesmanId' },
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $sort: { revenue: -1 } },
        { $skip: skip },
        { $limit: safeLimit },
        {
          $project: {
            _id: 0,
            productId: '$_id',
            productName: '$product.name',
            sku: '$product.sku',
            quantitySold: 1,
            revenue: 1,
            totalOrders: { $size: '$orderIds' },
            salesmenCount: { $size: '$salesmen' },
          },
        },
      ]),
      OrderItem.aggregate([
        {
          $lookup: {
            from: 'orders',
            let: { orderId: '$orderId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$orderId'] },
                  ...orderMatch,
                },
              },
              { $project: { _id: 1 } },
            ],
            as: 'order',
          },
        },
        { $match: { order: { $ne: [] } } },
        { $group: { _id: '$productId' } },
        { $count: 'count' },
      ]),
    ]);

    const summary = totalsAgg[0] || {
      totalSales: 0,
      totalOrders: 0,
      totalCommission: 0,
    };
    const totalProducts = productCountAgg[0]?.count || 0;

    return {
      summary: {
        ...summary,
        averageOrderValue: summary.totalOrders ? summary.totalSales / summary.totalOrders : 0,
      },
      salesBySalesman: salesmenAgg || [],
      products: productAgg || [],
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: totalProducts,
        totalPages: Math.max(1, Math.ceil(totalProducts / safeLimit)),
      },
    };
  }
}

module.exports = new SalesReportsRepo();
