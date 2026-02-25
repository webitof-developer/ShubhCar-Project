/**
 * Cart service tests aligned to current product-based cart flow.
 */
jest.mock('../../modules/cart/cart.repo', () => ({
  getOrCreateCart: jest.fn(),
  addItem: jest.fn(),
  updateQty: jest.fn(),
  removeItem: jest.fn(),
  getItemById: jest.fn(),
  getCartWithItems: jest.fn(),
}));
jest.mock('../../modules/cart/cart.cache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  clear: jest.fn(),
}));
jest.mock('../../modules/coupons/coupons.service', () => ({
  validate: jest.fn(),
}));
jest.mock('../../models/Product.model', () => ({
  findById: jest.fn(),
  find: jest.fn(),
}));
jest.mock('../../models/ProductImage.model', () => ({
  find: jest.fn(),
}));
jest.mock('../../models/User.model', () => ({
  findById: jest.fn(),
}));
jest.mock('../../models/Cart.model', () => ({
  findByIdAndUpdate: jest.fn(),
}));

const cartService = require('../../modules/cart/cart.service');
const cartRepo = require('../../modules/cart/cart.repo');
const cartCache = require('../../modules/cart/cart.cache');
const couponService = require('../../modules/coupons/coupons.service');
const Product = require('../../models/Product.model');
const ProductImage = require('../../models/ProductImage.model');
const User = require('../../models/User.model');
const Cart = require('../../models/Cart.model');
const { AppError } = require('../../utils/apiResponse');

const user = { id: '507f1f77bcf86cd799439021' };
const sessionId = 'sess-1';
const cartDoc = {
  _id: 'cart1',
  couponId: null,
  couponCode: null,
  discountAmount: 0,
  updatedAt: new Date(),
};

const mockLean = (value) => ({ lean: jest.fn().mockResolvedValue(value) });
const mockSelectLean = (value) => ({
  select: jest.fn(() => ({
    lean: jest.fn().mockResolvedValue(value),
  })),
});

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cartCache.get.mockResolvedValue(null);
    cartRepo.getOrCreateCart.mockResolvedValue(cartDoc);
    User.findById.mockReturnValue(mockSelectLean({
      customerType: 'retail',
      verificationStatus: 'approved',
    }));
    Product.find.mockReturnValue(mockLean([]));
    ProductImage.find.mockReturnValue({
      sort: jest.fn(() => mockLean([])),
    });
  });

  it('addItem rejects unavailable product', async () => {
    Product.findById.mockReturnValue(mockLean(null));

    await expect(
      cartService.addItem({ user, sessionId, productId: '507f1f77bcf86cd799439011', quantity: 1 }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('addItem stores item and returns refreshed cart', async () => {
    Product.findById.mockReturnValue(mockLean({
      _id: '507f1f77bcf86cd799439011',
      status: 'active',
      stockQty: 10,
      retailPrice: { mrp: 100, salePrice: 90 },
      sku: 'SKU-1',
    }));
    cartRepo.getCartWithItems.mockResolvedValue([
      {
        _id: 'ci1',
        productId: '507f1f77bcf86cd799439011',
        quantity: 2,
        priceAtTime: 90,
      },
    ]);
    Product.find.mockReturnValue(mockLean([
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'P1',
        status: 'active',
        retailPrice: { mrp: 100, salePrice: 90 },
      },
    ]));

    const payload = await cartService.addItem({
      user,
      sessionId,
      productId: '507f1f77bcf86cd799439011',
      quantity: 2,
    });

    expect(cartRepo.addItem).toHaveBeenCalledWith(
      expect.objectContaining({
        cartId: 'cart1',
        item: expect.objectContaining({
          productId: '507f1f77bcf86cd799439011',
          quantity: 2,
          priceType: 'retail',
          priceAtTime: 90,
        }),
      }),
    );
    expect(cartCache.clear).toHaveBeenCalledWith({ userId: user.id, sessionId });
    expect(payload.items).toHaveLength(1);
  });

  it('updateQuantity rejects unknown cart item', async () => {
    cartRepo.getItemById.mockResolvedValue(null);

    await expect(
      cartService.updateQuantity({ user, sessionId, itemId: 'missing', quantity: 2 }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('getCart returns cached payload when present', async () => {
    cartCache.get.mockResolvedValue({ cartId: 'cached', items: [] });

    const res = await cartService.getCart({ user, sessionId });

    expect(res).toEqual({ cartId: 'cached', items: [] });
    expect(cartRepo.getCartWithItems).not.toHaveBeenCalled();
  });

  it('applyCoupon validates and persists coupon fields', async () => {
    cartRepo.getCartWithItems.mockResolvedValue([
      { productId: '507f1f77bcf86cd799439011', quantity: 2, priceAtTime: 50 },
    ]);
    couponService.validate.mockResolvedValue({
      couponId: 'c1',
      couponCode: 'OFF10',
      discountAmount: 10,
    });

    await cartService.applyCoupon({ user, sessionId, code: 'OFF10' });

    expect(couponService.validate).toHaveBeenCalledWith({
      code: 'OFF10',
      userId: user.id,
      orderAmount: 100,
    });
    expect(Cart.findByIdAndUpdate).toHaveBeenCalledWith('cart1', {
      couponId: 'c1',
      couponCode: 'OFF10',
      discountAmount: 10,
    });
  });
});
