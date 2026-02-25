import type { AnalyticsRequestShape } from './analytics.types';
const mongoose = require('mongoose');
const Order = require('../../models/Order.model');
const OrderItem = require('../../models/OrderItem.model');
const User = require('../../models/User.model');
const Product = require('../../models/Product.model');
const Review = require('../../models/ProductReview.model');
const Role = require('../../models/Role.model');

const MAX_ANALYTICS_LIMIT = 100;

class AnalyticsService {
  async _resolveSalesmanActor(user: any = {}) {
    const actorId = user?.id || user?._id;
    if (!actorId || !mongoose.Types.ObjectId.isValid(actorId)) return null;
    if (String(user?.role || '').toLowerCase() === 'salesman') {
      return new mongoose.Types.ObjectId(actorId);
    }
    const actor = await User.findById(actorId).select('role roleId').lean();
    if (!actor) return null;
    if (String(actor.role || '').toLowerCase() === 'salesman') {
      return new mongoose.Types.ObjectId(actorId);
    }
    if (!actor.roleId || !mongoose.Types.ObjectId.isValid(actor.roleId))
      return null;
    const roleDoc = await Role.findById(actor.roleId)
      .select('slug name')
      .lean();
    const slug = String(roleDoc?.slug || '').toLowerCase();
    const name = String(roleDoc?.name || '').toLowerCase();
    return slug === 'salesman' || name.includes('salesman')
      ? new mongoose.Types.ObjectId(actorId)
      : null;
  }

  async _roleScopedOrderMatch(user: any = {}, extra: any = {}, targetSalesmanId = null) {
    const match: any = { ...extra };

    // 1. If user is Admin and targetSalesmanId is provided, force filter by that salesman
    if (targetSalesmanId) {
      const actorRole = String(user?.role || '').toLowerCase();
      if (actorRole === 'admin') {
        match.salesmanId = new mongoose.Types.ObjectId(targetSalesmanId);
        return match;
      }
    }

    // 2. Otherwise, applies normal role-based scoping (Salesman sees own data)
    const salesmanId = await this._resolveSalesmanActor(user);
    if (salesmanId) {
      match.salesmanId = salesmanId;
    }
    return match;
  }

  _toSafePositiveInt(value, fallback, min = 1, max = MAX_ANALYTICS_LIMIT) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  _toSafeDate(value) {
    if (!value) return null;
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  _dateFilter(from, to) {
    const safeFrom = this._toSafeDate(from);
    const safeTo = this._toSafeDate(to);

    if (!safeFrom && !safeTo) return {};

    const createdAt: any = {};
    if (safeFrom) createdAt.$gte = safeFrom;
    if (safeTo) createdAt.$lte = safeTo;
    return { createdAt };
  }

  /* =======================
     REVENUE & ORDERS
  ======================== */
  async revenueSummary({ from, to, salesmanId }, user: any = {}) {
    const match: any = {
      ...(await this._roleScopedOrderMatch(
        user,
        this._dateFilter(from, to),
        salesmanId,
      )),
      isDeleted: false,
    };
    const pendingStatuses: any[] = ['pending', 'partially_paid'];

    const [
      totalOrders,
      paidOrders,
      pendingOrders,
      cancelledOrders,
      refundedOrders,
      paidRevenueAgg,
      pendingRevenueAgg,
      paymentSplit,
    ] = await Promise.all([
      Order.countDocuments(match),
      Order.countDocuments({ ...match, paymentStatus: 'paid' }),
      Order.countDocuments({
        ...match,
        paymentStatus: { $in: pendingStatuses },
      }),
      Order.countDocuments({ ...match, orderStatus: 'cancelled' }),
      Order.countDocuments({ ...match, paymentStatus: 'refunded' }),
      Order.aggregate([
        { $match: { ...match, paymentStatus: 'paid' } },
        { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' } } },
      ]),
      Order.aggregate([
        { $match: { ...match, paymentStatus: { $in: pendingStatuses } } },
        { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' } } },
      ]),
      Order.aggregate([
        { $match: { ...match, paymentStatus: 'paid' } },
        {
          $group: {
            _id: '$paymentMethod',
            orders: { $sum: 1 },
            revenue: { $sum: '$grandTotal' },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
    ]);

    const paidRevenue = paidRevenueAgg[0]?.totalRevenue || 0;
    const pendingRevenue = pendingRevenueAgg[0]?.totalRevenue || 0;
    const avgOrderValue = paidOrders ? paidRevenue / paidOrders : 0;
    const cancelRate = totalOrders ? (cancelledOrders / totalOrders) * 100 : 0;
    const refundRate = totalOrders ? (refundedOrders / totalOrders) * 100 : 0;

    return {
      totalRevenue: paidRevenue,
      totalOrders,
      paidOrders,
      pendingOrders,
      cancelledOrders,
      refundedOrders,
      pendingRevenue,
      avgOrderValue,
      cancelRate,
      refundRate,
      paymentSplit: paymentSplit || [],
    };
  }

  /* =======================
     USERS
  ======================== */
  async userSummary() {
    const [total, wholesale] = await Promise.all([
      User.countDocuments({ isDeleted: false, role: 'customer' }),
      User.countDocuments({
        customerType: 'wholesale',
        verificationStatus: 'approved',
        isDeleted: false,
        role: 'customer',
      }),
    ]);

    return {
      totalUsers: total,
      wholesaleUsers: wholesale,
    };
  }

// @ts-ignore
  async repeatCustomerSummary({ from, to } = {}) {
    const match: any = {
      ...this._dateFilter(from, to),
      paymentStatus: 'paid',
      isDeleted: false,
    };
    const data = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$userId',
          orders: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
        },
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          repeatCustomers: { $sum: { $cond: [{ $gt: ['$orders', 1] }, 1, 0] } },
          totalRevenue: { $sum: '$revenue' },
          averageOrdersPerCustomer: { $avg: '$orders' },
        },
      },
    ]);
    const summary = data[0] || {};
    const totalCustomers = summary.totalCustomers || 0;
    const repeatCustomers = summary.repeatCustomers || 0;
    const totalRevenue = summary.totalRevenue || 0;
    return {
      totalCustomers,
      repeatCustomers,
      repeatRate: totalCustomers ? (repeatCustomers / totalCustomers) * 100 : 0,
      averageOrdersPerCustomer: summary.averageOrdersPerCustomer || 0,
      averageLtv: totalCustomers ? totalRevenue / totalCustomers : 0,
    };
  }

  async fulfillmentSummary({ from, to }: any = {}) {
    const match: any = { ...this._dateFilter(from, to), isDeleted: false };
    const [shipAgg, deliverAgg] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            ...match,
            placedAt: { $ne: null },
            shippedAt: { $ne: null },
          },
        },
        {
          $project: {
            hoursToShip: {
              $divide: [{ $subtract: ['$shippedAt', '$placedAt'] }, 3600000],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgHoursToShip: { $avg: '$hoursToShip' },
            count: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            ...match,
            placedAt: { $ne: null },
            deliveredAt: { $ne: null },
          },
        },
        {
          $project: {
            hoursToDeliver: {
              $divide: [{ $subtract: ['$deliveredAt', '$placedAt'] }, 3600000],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgHoursToDeliver: { $avg: '$hoursToDeliver' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      avgHoursToShip: shipAgg[0]?.avgHoursToShip || 0,
      shipmentsCount: shipAgg[0]?.count || 0,
      avgHoursToDeliver: deliverAgg[0]?.avgHoursToDeliver || 0,
      deliveriesCount: deliverAgg[0]?.count || 0,
    };
  }

  async orderFunnel({ from, to }: any = {}) {
    const match: any = { ...this._dateFilter(from, to), isDeleted: false };
    const [
      totalOrders,
      paidOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      refundedOrders,
    ] = await Promise.all([
      Order.countDocuments(match),
      Order.countDocuments({ ...match, paymentStatus: 'paid' }),
      Order.countDocuments({ ...match, orderStatus: 'shipped' }),
      Order.countDocuments({ ...match, orderStatus: 'delivered' }),
      Order.countDocuments({ ...match, orderStatus: 'cancelled' }),
      Order.countDocuments({ ...match, paymentStatus: 'refunded' }),
    ]);

    return {
      placed: totalOrders,
      paid: paidOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders,
      refunded: refundedOrders,
    };
  }

  async topCategories({ from, to, limit = 6 }: any = {}) {
    const safeLimit = this._toSafePositiveInt(limit, 6);
    const match: any = {
      ...this._dateFilter(from, to),
      paymentStatus: 'paid',
      isDeleted: false,
    };
    return OrderItem.aggregate([
      {
        $lookup: {
          from: 'orders',
          let: { orderId: '$orderId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$orderId'] },
                ...match,
              },
            },
            { $project: { _id: 1 } },
          ],
          as: 'order',
        },
      },
      { $match: { order: { $ne: [] as any[] } } },
      {
        $group: {
          _id: '$productId',
          quantitySold: { $sum: '$quantity' },
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
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.categoryId',
          quantitySold: { $sum: '$quantitySold' },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      { $sort: { quantitySold: -1 } },
      { $limit: safeLimit },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          name: '$category.name',
          quantitySold: 1,
        },
      },
    ]);
  }

  async topBrands({ from, to, limit = 6 }: any = {}) {
    const safeLimit = this._toSafePositiveInt(limit, 6);
    const match: any = {
      ...this._dateFilter(from, to),
      paymentStatus: 'paid',
      isDeleted: false,
    };
    return OrderItem.aggregate([
      {
        $lookup: {
          from: 'orders',
          let: { orderId: '$orderId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$orderId'] },
                ...match,
              },
            },
            { $project: { _id: 1 } },
          ],
          as: 'order',
        },
      },
      { $match: { order: { $ne: [] as any[] } } },
      {
        $group: {
          _id: '$productId',
          quantitySold: { $sum: '$quantity' },
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
      { $unwind: '$product' },
      {
        $group: {
          _id: {
            $ifNull: ['$product.manufacturerBrand', '$product.vehicleBrand'],
          },
          quantitySold: { $sum: '$quantitySold' },
        },
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { quantitySold: -1 } },
      { $limit: safeLimit },
      { $project: { _id: 0, name: '$_id', quantitySold: 1 } },
    ]);
  }

  async inventoryTurnover({ from, to, limit = 6 }: any = {}) {
    const safeLimit = this._toSafePositiveInt(limit, 6);
    const match: any = {
      ...this._dateFilter(from, to),
      paymentStatus: 'paid',
      isDeleted: false,
    };
    const soldAgg = await OrderItem.aggregate([
      {
        $lookup: {
          from: 'orders',
          let: { orderId: '$orderId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$orderId'] },
                ...match,
              },
            },
            { $project: { _id: 1 } },
          ],
          as: 'order',
        },
      },
      { $match: { order: { $ne: [] as any[] } } },
      { $group: { _id: null, totalSoldQty: { $sum: '$quantity' } } },
    ]);

    const totalSoldQty = soldAgg[0]?.totalSoldQty || 0;
    const totalStockAgg = await Product.aggregate([
      { $match: { isDeleted: false, status: 'active' } },
      { $group: { _id: null, totalStockQty: { $sum: '$stockQty' } } },
    ]);
    const totalStockQty = totalStockAgg[0]?.totalStockQty || 0;

    const soldProductIdsAgg = await OrderItem.aggregate([
      {
        $lookup: {
          from: 'orders',
          let: { orderId: '$orderId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$orderId'] },
                ...match,
              },
            },
            { $project: { _id: 1 } },
          ],
          as: 'order',
        },
      },
      { $match: { order: { $ne: [] as any[] } } },
      { $group: { _id: '$productId' } },
    ]);
    const soldProductIds = soldProductIdsAgg.map((row) => row._id);

    const deadStock = await Product.find({
      isDeleted: false,
      status: 'active',
      stockQty: { $gt: 0 },
      _id: { $nin: soldProductIds },
    })
      .select('name sku stockQty')
      .limit(safeLimit)
      .lean();

    return {
      turnoverRate: totalStockQty ? totalSoldQty / totalStockQty : 0,
      totalSoldQty,
      totalStockQty,
      deadStock,
    };
  }

  async salesByCity({ from, to, limit = 6 }: any = {}) {
    const safeLimit = this._toSafePositiveInt(limit, 6);
    const match: any = {
      ...this._dateFilter(from, to),
      isDeleted: false,
      paymentStatus: 'paid',
    };

    const data = await Order.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'useraddresses',
          localField: 'shippingAddressId',
          foreignField: '_id',
          as: 'shippingAddress',
        },
      },
      {
        $unwind: { path: '$shippingAddress', preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: '$shippingAddress.city',
          orders: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: safeLimit },
      {
        $project: {
          _id: 0,
          city: '$_id',
          orders: 1,
          revenue: 1,
        },
      },
    ]);

    return data.filter((item) => item.city);
  }

  /* =======================
     TOP PRODUCTS
  ======================== */
  async topProducts({ limit = 10 }) {
    const safeLimit = this._toSafePositiveInt(limit, 10);
    return OrderItem.aggregate([
      {
        $lookup: {
          from: 'orders',
          let: { orderId: '$orderId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$_id', '$$orderId'] },
                    { $eq: ['$paymentStatus', 'paid'] },
                  ],
                },
              },
            },
            { $project: { _id: 1 } },
          ],
          as: 'order',
        },
      },
      { $match: { order: { $ne: [] as any[] } } },
      {
        $group: {
          _id: '$productId',
          quantitySold: { $sum: '$quantity' },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: safeLimit },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          name: '$product.name',
          quantitySold: 1,
        },
      },
    ]);
  }

  /* =======================
     INVENTORY ALERTS
  ======================== */
  async lowStock({ threshold = 5 }) {
    const safeThreshold = this._toSafePositiveInt(threshold, 5, 0, 100000);
    const products = await Product.aggregate([
      { $match: { isDeleted: false, status: 'active' } },
      {
        $match: {
          stockQty: { $lte: safeThreshold },
        },
      },
      {
        $project: {
          _id: 1,
          sku: 1,
          name: 1,
          stockQty: 1,
          availableQty: '$stockQty',
          productId: '$_id',
        },
      },
    ]);

    return products;
  }

  /* =======================
     REVIEWS
  ======================== */
  async reviewSummary() {
    const [total, avg] = await Promise.all([
      Review.countDocuments({ status: 'published' }),
      Review.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } },
      ]),
    ]);

    return {
      totalReviews: total,
      averageRating: avg[0]?.avgRating || 0,
    };
  }
  /* =======================
     DASHBOARD STATS
  ======================== */
  async dashboardStats(user: any = {}, targetSalesmanId = null) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Helper for date range
    const isSalesman = Boolean(await this._resolveSalesmanActor(user));
    const isAdmin =
      String(user?.role || '').toLowerCase() === 'admin' && !isSalesman;

    const filter = async (start, end) =>
      this._roleScopedOrderMatch(
        user,
        {
          createdAt: { $gte: start, $lte: end },
          isDeleted: false,
        },
        targetSalesmanId,
      );
    const userFilter = (start, end) => ({
      createdAt: { $gte: start, $lte: end },
      role: 'customer',
      isDeleted: false,
    });
    const currentPeriodMatch = await filter(startOfMonth, now);
    const previousPeriodMatch = await filter(startOfLastMonth, endOfLastMonth);

    const [
      currentOrders,
      lastMonthOrders,
      currentRevenue,
      lastMonthRevenue,
      currentUsers,
      lastMonthUsers,
    ] = await Promise.all([
      Order.countDocuments(currentPeriodMatch),
      Order.countDocuments(previousPeriodMatch),
      Order.aggregate([
        { $match: { ...currentPeriodMatch, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
      Order.aggregate([
        { $match: { ...previousPeriodMatch, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } },
      ]),
      isAdmin ? User.countDocuments(userFilter(startOfMonth, now)) : 0,
      isAdmin
        ? User.countDocuments(userFilter(startOfLastMonth, endOfLastMonth))
        : 0,
    ]);

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const revenue = currentRevenue[0]?.total || 0;
    const prevRevenue = lastMonthRevenue[0]?.total || 0;

    const response: any = {
      totalOrders: currentOrders,
      ordersChange: calculateChange(currentOrders, lastMonthOrders),
      newLeads: currentUsers,
      leadsChange: calculateChange(currentUsers, lastMonthUsers),
      deals: currentOrders, // Utilizing orders as deals for now
      dealsChange: calculateChange(currentOrders, lastMonthOrders),
      revenue: revenue,
      revenueChange: calculateChange(revenue, prevRevenue),
    };

    if (isAdmin) {
      const salesmanRows = await Order.aggregate([
        {
          $match: {
            isDeleted: false,
            salesmanId: { $ne: null },
          },
        },
        {
          $group: {
            _id: '$salesmanId',
            totalSales: { $sum: '$grandTotal' },
            totalCommission: {
              $sum: {
                $cond: [
                  { $eq: ['$orderStatus', 'cancelled'] },
                  0,
                  '$commissionAmount',
                ],
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
      response.salesBySalesman = salesmanRows;
    }

    if (isSalesman) {
      const [myTotals] = await Order.aggregate([
        {
          $match: await this._roleScopedOrderMatch(user, { isDeleted: false }),
        },
        {
          $group: {
            _id: null,
            myTotalSales: { $sum: '$grandTotal' },
            myTotalCommission: {
              $sum: {
                $cond: [
                  { $eq: ['$orderStatus', 'cancelled'] },
                  0,
                  '$commissionAmount',
                ],
              },
            },
          },
        },
      ]);
      response.myTotalSales = myTotals?.myTotalSales || 0;
      response.myTotalCommission = myTotals?.myTotalCommission || 0;
    }

    return response;
  }

  /* =======================
     CHART DATA
  ======================== */
  async revenueChartData(
// @ts-ignore
    { range = 'month', from, to, salesmanId } = {},
    user: any = {},
  ) {
    const now = new Date();
    let startDate = new Date();
    let endDate = now;
    let groupId: any = {};
    let labels: any[] = [];
    let points = 0;

    if (range === 'custom' && from && to) {
      const safeFrom = this._toSafeDate(from);
      const safeTo = this._toSafeDate(to);
      if (!safeFrom || !safeTo) {
        range = 'month';
      } else {
        startDate = safeFrom;
        endDate = safeTo;
      }
    }

    if (range === 'custom') {
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffDays = Math.max(0, Math.ceil(diffMs / 86400000));
      points = diffDays + 1;
      groupId = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
      };
      labels = Array.from({ length: points }, (_, idx) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + idx);
        return d.toLocaleString('default', { day: 'numeric', month: 'short' });
      });
    } else if (range === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      points = 24;
      groupId = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
        hour: { $hour: '$createdAt' },
      };
      labels = Array.from(
        { length: points },
        (_, idx) => `${String(idx).padStart(2, '0')}:00`,
      );
    } else if (range === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      points = 7;
      groupId = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
      };
      labels = Array.from({ length: points }, (_, idx) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + idx);
        return d.toLocaleString('default', { weekday: 'short' });
      });
    } else if (range === 'month') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 29);
      points = 30;
      groupId = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' },
      };
      labels = Array.from({ length: points }, (_, idx) => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + idx);
        return d.toLocaleString('default', { day: 'numeric', month: 'short' });
      });
    } else {
      const months = 12;
      startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
      points = months;
      groupId = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
      };
      labels = Array.from({ length: points }, (_, idx) => {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + idx);
        return d.toLocaleString('default', { month: 'short' });
      });
    }

    const data = await Order.aggregate([
      {
        $match: {
          ...(await this._roleScopedOrderMatch(user, {}, salesmanId)),
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'paid',
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: groupId,
          revenue: { $sum: '$grandTotal' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } },
    ]);

    const result: any = { revenue: [] as any[], orders: [] as any[], labels: [] as any[] };

    for (let i = 0; i < points; i++) {
      const current = new Date(startDate);
      if (range === 'today') current.setHours(i, 0, 0, 0);
      if (range === 'week' || range === 'month' || range === 'custom')
        current.setDate(current.getDate() + i);
      if (
        range !== 'today' &&
        range !== 'week' &&
        range !== 'month' &&
        range !== 'custom'
      )
        current.setMonth(current.getMonth() + i);

      const year = current.getFullYear();
      const month = current.getMonth() + 1;
      const day = current.getDate();
      const hour = current.getHours();

      const found = data.find((item) => {
        if (range === 'today') {
          return (
            item._id.year === year &&
            item._id.month === month &&
            item._id.day === day &&
            item._id.hour === hour
          );
        }
        if (range === 'week' || range === 'month' || range === 'custom') {
          return (
            item._id.year === year &&
            item._id.month === month &&
            item._id.day === day
          );
        }
        return item._id.year === year && item._id.month === month;
      });

      result.labels.push(labels[i]);
      result.revenue.push(found ? found.revenue : 0);
      result.orders.push(found ? found.orders : 0);
    }

    return result;
  }

// @ts-ignore
  async salesByState({ limit = 6, from, to } = {}) {
    const safeLimit = this._toSafePositiveInt(limit, 6);
    const match: any = {
      ...this._dateFilter(from, to),
      isDeleted: false,
      paymentStatus: 'paid',
    };

    const data = await Order.aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'useraddresses',
          localField: 'shippingAddressId',
          foreignField: '_id',
          as: 'shippingAddress',
        },
      },
      {
        $unwind: { path: '$shippingAddress', preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: '$shippingAddress.state',
          orders: { $sum: 1 },
          revenue: { $sum: '$grandTotal' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: safeLimit },
      {
        $project: {
          _id: 0,
          state: '$_id',
          orders: 1,
          revenue: 1,
        },
      },
    ]);

    return data.filter((item) => item.state);
  }
}

module.exports = new AnalyticsService();
