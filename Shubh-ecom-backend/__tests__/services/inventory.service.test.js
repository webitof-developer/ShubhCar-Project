/**
 * Inventory service tests for product-level stock transitions.
 */
jest.mock('../../cache/inventory.cache', () => ({
  del: jest.fn(),
}));
jest.mock('../../queues/email.queue', () => ({
  enqueueEmail: jest.fn(),
}));
jest.mock('../../config/env', () => ({
  LOW_STOCK_THRESHOLD: '5',
  STOCK_ALERT_EMAIL: 'ops@example.com',
}));

const mongoose = require('mongoose');
const inventoryService = require('../../modules/inventory/inventory.service');
const Product = require('../../models/Product.model');
const inventoryCache = require('../../cache/inventory.cache');
const { enqueueEmail } = require('../../queues/email.queue');
const { AppError } = require('../../utils/apiResponse');
const {
  connectTestDB,
  clearDatabase,
  disconnectTestDB,
} = require('../helpers/mongo');

describe('InventoryService', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  it('reserves stock when available and invalidates cache', async () => {
    const product = await Product.create({
      name: 'P1',
      slug: 'p1',
      categoryId: new mongoose.Types.ObjectId(),
      status: 'active',
      stockQty: 10,
      retailPrice: { mrp: 100, salePrice: 100 },
      isDeleted: false,
    });

    await inventoryService.reserve(product._id, 3);

    const updated = await Product.findById(product._id).lean();
    expect(updated.stockQty).toBe(7);
    expect(inventoryCache.del).toHaveBeenCalledWith(product._id);
  });

  it('throws when reserving more than available stock', async () => {
    const product = await Product.create({
      name: 'P2',
      slug: 'p2',
      categoryId: new mongoose.Types.ObjectId(),
      status: 'active',
      stockQty: 2,
      retailPrice: { mrp: 80, salePrice: 80 },
      isDeleted: false,
    });

    await expect(
      inventoryService.reserve(product._id, 5),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('commit keeps stock and triggers low-stock alert', async () => {
    const product = await Product.create({
      name: 'P3',
      slug: 'p3',
      categoryId: new mongoose.Types.ObjectId(),
      status: 'active',
      stockQty: 4,
      sku: 'SKU-3',
      retailPrice: { mrp: 120, salePrice: 120 },
      isDeleted: false,
    });

    const committed = await inventoryService.commit(product._id, 1);

    expect(committed.stockQty).toBe(4);
    expect(inventoryCache.del).toHaveBeenCalledWith(product._id);
    expect(enqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        templateName: 'inventory_low_stock',
      }),
    );
  });

  it('releases stock on cancel/failure', async () => {
    const product = await Product.create({
      name: 'P4',
      slug: 'p4',
      categoryId: new mongoose.Types.ObjectId(),
      status: 'active',
      stockQty: 5,
      retailPrice: { mrp: 150, salePrice: 150 },
      isDeleted: false,
    });

    const released = await inventoryService.release(product._id, 2);

    expect(released.stockQty).toBe(7);
    expect(inventoryCache.del).toHaveBeenCalledWith(product._id);
  });
});