const request = require('supertest');
const {
  setupIntegrationTests,
  clearDatabase,
  teardownIntegrationTests,
} = require('./setup');
const {
  createUser,
  createProduct,
  createShippingConfig,
  createAddress,
} = require('./helpers/factories');
const Order = require('../../models/Order.model');
const OrderItem = require('../../models/OrderItem.model');
const Product = require('../../models/Product.model');
const Settings = require('../../models/Settings.model');
const { signAccessToken } = require('../../utils/jwt');

let app;

describe('Order Placement Integration Tests', () => {
  beforeAll(async () => {
    const setup = await setupIntegrationTests();
    app = setup.app;
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await teardownIntegrationTests();
  });

  let token;
  let user;
  let shippingAddress;
  let billingAddress;

  beforeEach(async () => {
    // Create user and issue auth token directly to avoid auth route rate-limits in this suite.
    const dbUser = await createUser({
      email: `order_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`,
      firstName: 'Order',
      lastName: 'Test',
    });
    token = signAccessToken({ userId: dbUser._id.toString(), role: dbUser.role });
    user = { id: dbUser._id.toString(), role: dbUser.role };

    // Create addresses
    shippingAddress = await createAddress(user.id, {
      fullName: 'Order Test',
      addressLine1: '123 Shipping St',
      city: 'Bangalore',
      state: 'KA',
    });

    billingAddress = await createAddress(user.id, {
      fullName: 'Order Test',
      addressLine1: '456 Billing Ave',
      city: 'Bangalore',
      state: 'KA',
      isDefault: false,
    });
  });

  describe('POST /api/v1/orders/place - Order Creation', () => {
    it('should use default shipping config when explicit config is missing', async () => {
      const { product, variants } = await createProduct({ stockQty: 100 });

      // Add item to cart
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 2,
        });

      // Try to place order without shipping config
      const response = await request(app)
        .post('/api/v1/orders/place')
        .set('Authorization', `Bearer ${token}`)
        .send({
          shippingAddressId: shippingAddress._id.toString(),
          billingAddressId: billingAddress._id.toString(),
          paymentMethod: 'cod',
        })
        .expect(200); // Shipping service will fall back to defaults, but testing explicit config

      expect(response.body.success).toBe(true);
      const orders = await Order.find({});
      expect(orders).toHaveLength(1);
    });

    it('should successfully create order with valid cart and addresses', async () => {
      // Create shipping config
      await createShippingConfig({
        flatRate: 50,
        freeShippingAbove: 1000,
      });

      const { product, variants } = await createProduct({
        stockQty: 100,
        reservedQty: 0,
      });

      // Add items to cart
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 2,
        });

      // Place order
      const response = await request(app)
        .post('/api/v1/orders/place')
        .set('Authorization', `Bearer ${token}`)
        .send({
          shippingAddressId: shippingAddress._id.toString(),
          billingAddressId: billingAddress._id.toString(),
          paymentMethod: 'cod',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.orderNumber).toMatch(/^ORD-/);
      expect(response.body.data.paymentStatus).toBe('pending');
      expect(response.body.data.orderStatus).toBe('created');

      // Assert order document in database
      const dbOrder = await Order.findById(response.body.data._id);
      expect(dbOrder).toBeTruthy();
      expect(dbOrder.shippingAddressId.toString()).toBe(shippingAddress._id.toString());
      expect(dbOrder.billingAddressId.toString()).toBe(billingAddress._id.toString());
      expect(dbOrder.grandTotal).toBeGreaterThan(0);
      expect(dbOrder.shippingFee).toBe(50);
    });

    it('CRITICAL: order document must contain shippingAddressId and billingAddressId', async () => {
      await createShippingConfig();
      const { product, variants } = await createProduct({ stockQty: 100 });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 1,
        });

      const response = await request(app)
        .post('/api/v1/orders/place')
        .set('Authorization', `Bearer ${token}`)
        .send({
          shippingAddressId: shippingAddress._id.toString(),
          billingAddressId: billingAddress._id.toString(),
          paymentMethod: 'cod',
        })
        .expect(200);

      const dbOrder = await Order.findById(response.body.data._id);
      
      // CRITICAL: These fields must exist to prevent schema validation failures
      expect(dbOrder.shippingAddressId).toBeTruthy();
      expect(dbOrder.billingAddressId).toBeTruthy();
      expect(dbOrder.shippingAddressId.toString()).toBe(shippingAddress._id.toString());
      expect(dbOrder.billingAddressId.toString()).toBe(billingAddress._id.toString());
    });

    it('should apply static shipping fee correctly', async () => {
      await createShippingConfig({
        flatRate: 75,
        freeShippingAbove: 5000,
      });

      const { product, variants } = await createProduct({ stockQty: 100 });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 1,
        });

      const response = await request(app)
        .post('/api/v1/orders/place')
        .set('Authorization', `Bearer ${token}`)
        .send({
          shippingAddressId: shippingAddress._id.toString(),
          billingAddressId: billingAddress._id.toString(),
          paymentMethod: 'cod',
        })
        .expect(200);

      const dbOrder = await Order.findById(response.body.data._id);
      expect(dbOrder.shippingFee).toBe(75);
    });

    it('should apply free shipping when subtotal exceeds threshold', async () => {
      await createShippingConfig({
        flatRate: 100,
        freeShippingAbove: 500,
      });

      const { product, variants } = await createProduct({
        stockQty: 100,
      });

      // Set high price product
      await Product.findByIdAndUpdate(product._id, {
        retailPrice: { mrp: 600, salePrice: 600 },
      });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 1,
        });

      const response = await request(app)
        .post('/api/v1/orders/place')
        .set('Authorization', `Bearer ${token}`)
        .send({
          shippingAddressId: shippingAddress._id.toString(),
          billingAddressId: billingAddress._id.toString(),
          paymentMethod: 'cod',
        })
        .expect(200);

      const dbOrder = await Order.findById(response.body.data._id);
      expect(dbOrder.shippingFee).toBe(0); // Free shipping applied
    });

    it('CRITICAL: should decrement inventory when order is placed', async () => {
      await createShippingConfig();
      const { product, variants } = await createProduct({
        stockQty: 100,
        reservedQty: 10,
      });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 5,
        });

      await request(app)
        .post('/api/v1/orders/place')
        .set('Authorization', `Bearer ${token}`)
        .send({
          shippingAddressId: shippingAddress._id.toString(),
          billingAddressId: billingAddress._id.toString(),
          paymentMethod: 'cod',
        })
        .expect(200);

      // Check inventory state
      const updatedProduct = await Product.findById(product._id).lean();
      expect(updatedProduct.stockQty).toBe(95);
    });

    it('should create OrderItems in separate collection', async () => {
      await createShippingConfig();
      const { product, variants } = await createProduct({ stockQty: 100 });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 3,
        });

      const response = await request(app)
        .post('/api/v1/orders/place')
        .set('Authorization', `Bearer ${token}`)
        .send({
          shippingAddressId: shippingAddress._id.toString(),
          billingAddressId: billingAddress._id.toString(),
          paymentMethod: 'cod',
        })
        .expect(200);

      // Check OrderItem collection
      const orderItems = await OrderItem.find({ orderId: response.body.data._id });
      expect(orderItems).toHaveLength(1);
      expect(orderItems[0].quantity).toBe(3);
      expect(orderItems[0].productId.toString()).toBe(product._id.toString());
    });

    it('should fail when cart is empty', async () => {
      await createShippingConfig();

      const response = await request(app)
        .post('/api/v1/orders/place')
        .set('Authorization', `Bearer ${token}`)
        .send({
          shippingAddressId: shippingAddress._id.toString(),
          billingAddressId: billingAddress._id.toString(),
          paymentMethod: 'cod',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/cart is empty/i);

      // No order should be created
      const orders = await Order.find({});
      expect(orders).toHaveLength(0);
    });

    it('CRITICAL: should rollback on failure (transaction safety)', async () => {
      await createShippingConfig();
      const { product, variants } = await createProduct({
        stockQty: 5,
        reservedQty: 0,
      });

      // Add item to cart
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 2,
        });

      // Simulate failure by using invalid address
      await request(app)
        .post('/api/v1/orders/place')
        .set('Authorization', `Bearer ${token}`)
        .send({
          shippingAddressId: '000000000000000000000000', // Invalid ObjectId
          billingAddressId: billingAddress._id.toString(),
          paymentMethod: 'cod',
        })
        .expect(400);

      // Check that inventory was NOT decremented
      const unchangedProduct = await Product.findById(product._id).lean();
      expect(unchangedProduct.stockQty).toBe(5);

      // Check that no order was created
      const orders = await Order.find({});
      expect(orders).toHaveLength(0);
    });
  });

  describe('Order Schema Validation', () => {
    it('should have grandTotal field (not totalAmount)', async () => {
      await createShippingConfig();
      const { product, variants } = await createProduct({ stockQty: 100 });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 1,
        });

      const response = await request(app)
        .post('/api/v1/orders/place')
        .set('Authorization', `Bearer ${token}`)
        .send({
          shippingAddressId: shippingAddress._id.toString(),
          billingAddressId: billingAddress._id.toString(),
          paymentMethod: 'cod',
        })
        .expect(200);

      const dbOrder = await Order.findById(response.body.data._id).lean();
      expect(dbOrder.grandTotal).toBeDefined();
      expect(dbOrder.totalAmount).toBeUndefined(); // Old field should not exist
    });

    it('should have paymentStatus field (not status)', async () => {
      await createShippingConfig();
      const { product, variants } = await createProduct({ stockQty: 100 });

      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 1,
        });

      const response = await request(app)
        .post('/api/v1/orders/place')
        .set('Authorization', `Bearer ${token}`)
        .send({
          shippingAddressId: shippingAddress._id.toString(),
          billingAddressId: billingAddress._id.toString(),
          paymentMethod: 'cod',
        })
        .expect(200);

      const dbOrder = await Order.findById(response.body.data._id).lean();
      expect(dbOrder.paymentStatus).toBeDefined();
      expect(dbOrder.paymentStatus).toBe('pending');
    });
  });
});
