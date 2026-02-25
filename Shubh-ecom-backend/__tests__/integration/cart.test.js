const request = require('supertest');
const {
  setupIntegrationTests,
  clearDatabase,
  teardownIntegrationTests,
} = require('./setup');
const {
  createUser,
  createProduct,
} = require('./helpers/factories');
const ProductVariant = require('../../models/ProductVariant.model');
const CartItem = require('../../models/CartItem.model');
const { signAccessToken } = require('../../utils/jwt');

let app;

describe('Cart + Inventory Safety Integration Tests', () => {
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

  beforeEach(async () => {
    // Create user and issue auth token directly to avoid auth route rate-limits in this suite.
    const dbUser = await createUser({
      email: `cart_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`,
      firstName: 'Cart',
      lastName: 'Test',
    });
    token = signAccessToken({ userId: dbUser._id.toString(), role: dbUser.role });
    user = { id: dbUser._id.toString(), role: dbUser.role };
  });

  describe('POST /api/v1/cart/items - Add Item', () => {
    it('should add item to cart when sufficient stock available', async () => {
      const { product, variants } = await createProduct({
        stockQty: 10,
        reservedQty: 0,
      });

      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 5,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].quantity).toBe(5);

      // Assert database side-effect
      const cartItems = await CartItem.find({});
      expect(cartItems).toHaveLength(1);
      expect(cartItems[0].quantity).toBe(5);
    });

    it('CRITICAL: should prevent adding items beyond available stock (stockQty - reservedQty)', async () => {
      const { product, variants } = await createProduct({
        stockQty: 3,
      });

      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 5, // Trying to add more than available
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/insufficient stock/i);

      // Assert NO cart item was created
      const cartItems = await CartItem.find({});
      expect(cartItems).toHaveLength(0);
    });

    it('should allow adding exactly the available quantity', async () => {
      const { product, variants } = await createProduct({
        stockQty: 3,
      });

      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 3, // Exact available quantity
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items[0].quantity).toBe(3);
    });

    it('should reject adding item when all stock is reserved', async () => {
      const { product, variants } = await createProduct({
        stockQty: 0,
      });

      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 1,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/insufficient stock/i);
    });
  });

  describe('PATCH /api/v1/cart/items/:itemId - Update Quantity', () => {
    it('should update quantity within available stock limits', async () => {
      const { product, variants } = await createProduct({
        stockQty: 20,
        reservedQty: 5, // availableQty = 15
      });

      // Add item first
      const addResponse = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 5,
        });

      const itemId = addResponse.body.data.items[0]._id;

      // Update quantity
      const response = await request(app)
        .patch(`/api/v1/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          quantity: 10, // Still within availableQty
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items[0].quantity).toBe(10);
    });

    it('CRITICAL: should prevent updating quantity beyond available stock', async () => {
      const { product, variants } = await createProduct({
        stockQty: 5,
      });

      // Add item first
      const addResponse = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 2,
        });

      const itemId = addResponse.body.data.items[0]._id;

      // Try to update beyond available
      const response = await request(app)
        .patch(`/api/v1/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          quantity: 10, // Exceeds availableQty
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/insufficient stock/i);

      // Assert quantity unchanged in database
      const cartItem = await CartItem.findById(itemId);
      expect(cartItem.quantity).toBe(2);
    });

    it('should respect reserved quantities when updating', async () => {
      const { product, variants } = await createProduct({
        stockQty: 5,
      });

      const addResponse = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 3,
        });

      const itemId = addResponse.body.data.items[0]._id;

      // Can update to 5 (available)
      await request(app)
        .patch(`/api/v1/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 5 })
        .expect(200);

      // Cannot update to 6 (exceeds available)
      const failResponse = await request(app)
        .patch(`/api/v1/cart/items/${itemId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 6 })
        .expect(400);

      expect(failResponse.body.message).toMatch(/insufficient stock/i);
    });
  });

  describe('Cart Persistence', () => {
    it('should persist cart items per user across sessions', async () => {
      const { product, variants } = await createProduct({
        stockQty: 100,
        reservedQty: 0,
      });

      // Add item to cart
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 5,
        });

      // Get cart again (simulating new session)
      const response = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].quantity).toBe(5);
    });

    it('should isolate carts between different users', async () => {
      const { product, variants } = await createProduct({
        stockQty: 100,
        reservedQty: 0,
      });

      // User 1 adds to cart
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 5,
        });

      // Create User 2
      const email2 = `cart2_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;
      const dbUser2 = await createUser({
        firstName: 'Cart2',
        lastName: 'Test',
        email: email2,
      });
      const token2 = signAccessToken({
        userId: dbUser2._id.toString(),
        role: dbUser2.role,
      });

      // User 2's cart should be empty
      const response2 = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response2.body.data.items).toHaveLength(0);
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error message on insufficient stock', async () => {
      const { product, variants } = await createProduct({
        stockQty: 0,
      });

      const response = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: product._id.toString(),
          quantity: 1,
        })
        .expect(400);

      expect(response.body.message).toMatch(/insufficient stock/i);
      expect(response.body.success).toBe(false);
    });
  });
});
