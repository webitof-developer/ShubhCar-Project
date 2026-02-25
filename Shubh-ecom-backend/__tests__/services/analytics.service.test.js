/**
 * Analytics service aggregations power dashboards; regressions here would mislead ops.
 * Use in-memory Mongo with fixed fixtures to assert revenue/user/top-products math and filters.
 */
const mongoose = require('mongoose');
const analyticsService = require('../../modules/analytics/analytics.service');
const Order = require('../../models/Order.model');
const OrderItem = require('../../models/OrderItem.model');
const User = require('../../models/User.model');
const Product = require('../../models/Product.model');
const ProductVariant = require('../../models/ProductVariant.model');
const Review = require('../../models/ProductReview.model');
const {
  connectTestDB,
  clearDatabase,
  disconnectTestDB,
} = require('../helpers/mongo');

describe('AnalyticsService', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it('computes revenue summary only for paid orders within date range', async () => {
    const userId = new mongoose.Types.ObjectId();
    const addressId = new mongoose.Types.ObjectId();

    await Order.collection.insertMany([
      {
        userId,
        shippingAddressId: addressId,
        billingAddressId: addressId,
        orderNumber: 'ORD-1',
        totalItems: 2,
        subtotal: 200,
        taxAmount: 20,
        shippingFee: 30,
        discountAmount: 0,
        grandTotal: 250,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        isDeleted: false,
        createdAt: new Date('2024-05-01'),
      },
      {
        userId,
        shippingAddressId: addressId,
        billingAddressId: addressId,
        orderNumber: 'ORD-2',
        totalItems: 3,
        subtotal: 300,
        taxAmount: 30,
        shippingFee: 20,
        discountAmount: 0,
        grandTotal: 350,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        orderStatus: 'delivered',
        isDeleted: false,
        createdAt: new Date('2024-05-02'),
      },
      {
        // out of range
        userId,
        shippingAddressId: addressId,
        billingAddressId: addressId,
        orderNumber: 'ORD-3',
        totalItems: 1,
        subtotal: 500,
        taxAmount: 0,
        shippingFee: 0,
        discountAmount: 0,
        grandTotal: 500,
        paymentMethod: 'card',
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        isDeleted: false,
        createdAt: new Date('2024-06-15'),
      },
      {
        // not paid
        userId,
        shippingAddressId: addressId,
        billingAddressId: addressId,
        orderNumber: 'ORD-4',
        totalItems: 1,
        subtotal: 400,
        taxAmount: 0,
        shippingFee: 0,
        discountAmount: 0,
        grandTotal: 400,
        paymentMethod: 'card',
        paymentStatus: 'pending',
        orderStatus: 'created',
        isDeleted: false,
        createdAt: new Date('2024-05-03'),
      },
    ]);

    const summary = await analyticsService.revenueSummary({
      from: '2024-05-01',
      to: '2024-05-31',
    });

    expect(summary).toMatchObject({
      totalRevenue: 600, // 250 + 350
      totalOrders: 3,
      paidOrders: 2,
      pendingOrders: 1,
      avgOrderValue: 300,
    });
  });

  it('counts users and wholesale approvals correctly', async () => {
    await User.collection.insertMany([
      {
        firstName: 'A',
        email: 'a@test.com',
        role: 'customer',
        isDeleted: false,
        customerType: 'retail',
        verificationStatus: 'approved',
      },
      {
        firstName: 'B',
        email: 'b@test.com',
        role: 'customer',
        isDeleted: false,
        customerType: 'wholesale',
        verificationStatus: 'approved',
      },
      {
        firstName: 'C',
        email: 'c@test.com',
        role: 'customer',
        isDeleted: false,
        customerType: 'wholesale',
        verificationStatus: 'pending',
      },
      {
        firstName: 'D',
        email: 'deleted@test.com',
        role: 'customer',
        isDeleted: true,
        customerType: 'wholesale',
        verificationStatus: 'approved',
      },
    ]);

    const summary = await analyticsService.userSummary();

    expect(summary).toEqual({
      totalUsers: 3,
      wholesaleUsers: 1,
    });
  });

  it('returns top products by quantity sold with product names', async () => {
    const vendorId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();
    const prodA = await Product.create({
      name: 'Brake Pad',
      price: 100,
      slug: 'brake-pad',
      vendorId,
      categoryId,
    });
    const prodB = await Product.create({
      name: 'Oil Filter',
      price: 50,
      slug: 'oil-filter',
      vendorId,
      categoryId,
    });

    const order1 = await Order.create({
      userId: new mongoose.Types.ObjectId(),
      shippingAddressId: new mongoose.Types.ObjectId(),
      billingAddressId: new mongoose.Types.ObjectId(),
      orderNumber: 'ORD-TP1',
      totalItems: 3,
      subtotal: 300,
      taxAmount: 0,
      shippingFee: 0,
      discountAmount: 0,
      grandTotal: 300,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
    });

    const order2 = await Order.create({
      userId: new mongoose.Types.ObjectId(),
      shippingAddressId: new mongoose.Types.ObjectId(),
      billingAddressId: new mongoose.Types.ObjectId(),
      orderNumber: 'ORD-TP2',
      totalItems: 2,
      subtotal: 200,
      taxAmount: 0,
      shippingFee: 0,
      discountAmount: 0,
      grandTotal: 200,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
    });

    await OrderItem.collection.insertMany([
      { orderId: order1._id, productId: prodA._id, productVariantId: new mongoose.Types.ObjectId(), vendorId, sku: 'BP1', quantity: 2, price: 100, taxAmount: 0, total: 200 },
      { orderId: order1._id, productId: prodB._id, productVariantId: new mongoose.Types.ObjectId(), vendorId, sku: 'OF1', quantity: 1, price: 50, taxAmount: 0, total: 50 },
      { orderId: order2._id, productId: prodB._id, productVariantId: new mongoose.Types.ObjectId(), vendorId, sku: 'OF1', quantity: 3, price: 50, taxAmount: 0, total: 150 },
    ]);

    const top = await analyticsService.topProducts({ limit: 2 });

    expect(top).toEqual([
      {
        productId: prodB._id,
        name: 'Oil Filter',
        quantitySold: 4,
      },
      {
        productId: prodA._id,
        name: 'Brake Pad',
        quantitySold: 2,
      },
    ]);
  });

  it('returns low stock products based on stockQty threshold', async () => {
    const vendorId = new mongoose.Types.ObjectId();
    const categoryId = new mongoose.Types.ObjectId();
    await Product.create({
      name: 'Brake Pad Standard',
      sku: 'BP-STD',
      retailPrice: { mrp: 100, salePrice: 100 },
      slug: 'brake-pad-standard',
      vendorId,
      categoryId,
      stockQty: 3,
      status: 'active',
      isDeleted: false,
    });
    await Product.create({
      name: 'Brake Pad Premium',
      sku: 'BP-PREM',
      retailPrice: { mrp: 150, salePrice: 150 },
      slug: 'brake-pad-premium',
      vendorId,
      categoryId,
      stockQty: 2,
      status: 'active',
      isDeleted: false,
    });
    await Product.create({
      name: 'Brake Pad Deluxe',
      sku: 'BP-DLX',
      retailPrice: { mrp: 200, salePrice: 200 },
      slug: 'brake-pad-deluxe',
      vendorId,
      categoryId,
      stockQty: 100,
      status: 'active',
      isDeleted: false,
    });

    const res = await analyticsService.lowStock({ threshold: 5 });

    expect(res).toHaveLength(2);
    expect(res.map(v => v.sku).sort()).toEqual(['BP-PREM', 'BP-STD']);
    expect(res.find(v => v.sku === 'BP-STD')).toMatchObject({
      availableQty: 3,
      name: 'Brake Pad Standard',
    });
    expect(res.find(v => v.sku === 'BP-PREM')).toMatchObject({
      availableQty: 2,
      name: 'Brake Pad Premium',
    });
  });

  it('handles empty datasets gracefully in revenueSummary', async () => {
    const summary = await analyticsService.revenueSummary({});
    expect(summary).toMatchObject({
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
    });
  });

  it('summarizes published reviews average safely', async () => {
    const userA = new mongoose.Types.ObjectId();
    const userB = new mongoose.Types.ObjectId();
    const productId = new mongoose.Types.ObjectId();
    const productId2 = new mongoose.Types.ObjectId();
    await Review.collection.insertMany([
      { rating: 5, status: 'published', userId: userA, productId },
      { rating: 3, status: 'published', userId: userB, productId },
      { rating: 4, status: 'pending', userId: userA, productId: productId2 },
    ]);

    const summary = await analyticsService.reviewSummary();

    expect(summary).toEqual({
      totalReviews: 2,
      averageRating: 4,
    });
  });
});
