jest.mock('../../utils/mongoTransaction', () => ({
  createSafeSession: jest.fn(),
}));

jest.mock('../../modules/cart/cart.repo', () => ({
  getOrCreateCart: jest.fn(),
  getCartWithItems: jest.fn(),
}));

jest.mock('../../modules/cart/cart.cache', () => ({
  clearCart: jest.fn(),
}));

jest.mock('../../modules/products/product.repo', () => ({
  findById: jest.fn(),
}));

jest.mock('../../modules/users/userAddress.repo', () => ({
  findById: jest.fn(),
}));

jest.mock('../../modules/users/user.repo', () => ({
  findById: jest.fn(),
}));

jest.mock('../../modules/coupons/coupon.repo', () => ({
  lockCoupon: jest.fn(),
  unlockCoupon: jest.fn(),
  recordUsage: jest.fn(),
  removeUsageByOrder: jest.fn(),
}));

jest.mock('../../modules/coupons/coupons.service', () => ({
  preview: jest.fn(),
}));

jest.mock('../../modules/inventory/inventory.service', () => ({
  reserve: jest.fn(),
  release: jest.fn(),
}));

jest.mock('../../modules/orders/order.repo', () => ({
  createOrder: jest.fn(),
  createItems: jest.fn(),
}));

jest.mock('../../jobs/order.jobs', () => ({
  scheduleAutoCancel: jest.fn(),
}));

jest.mock('../../utils/paymentSettings', () => ({
  getPaymentSettings: jest.fn(),
}));

jest.mock('../../config/logger', () => ({
  withContext: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const { createSafeSession } = require('../../utils/mongoTransaction');
const cartRepo = require('../../modules/cart/cart.repo');
const addressRepo = require('../../modules/users/userAddress.repo');
const userRepo = require('../../modules/users/user.repo');
const productRepo = require('../../modules/products/product.repo');
const inventoryService = require('../../modules/inventory/inventory.service');
const { getPaymentSettings } = require('../../utils/paymentSettings');
const orderService = require('../../modules/orders/orders.service');

describe('OrderService stock validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 VALIDATION_ERROR when requested quantity exceeds available stock', async () => {
    const session = {
      _isStandalone: false,
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      inTransaction: jest.fn(() => true),
      endSession: jest.fn(),
    };
    createSafeSession.mockResolvedValue(session);

    getPaymentSettings.mockResolvedValue({
      codEnabled: true,
      razorpayEnabled: true,
      razorpayKeyId: 'rzp_test_key',
      razorpayKeySecret: 'rzp_test_secret',
    });

    cartRepo.getOrCreateCart.mockResolvedValue({
      _id: 'cart-1',
      couponId: null,
      couponCode: null,
    });
    cartRepo.getCartWithItems.mockResolvedValue([
      { productId: 'product-1', quantity: 6 },
    ]);

    addressRepo.findById.mockResolvedValue({
      _id: 'addr-1',
      userId: 'user-1',
      state: 'KA',
      city: 'Bangalore',
      postalCode: '560001',
      country: 'IN',
    });

    userRepo.findById.mockResolvedValue({
      _id: 'user-1',
      customerType: 'retail',
      verificationStatus: 'approved',
    });

    productRepo.findById.mockResolvedValue({
      _id: 'product-1',
      status: 'active',
      stockQty: 5,
      retailPrice: { mrp: 100, salePrice: 90 },
    });

    await expect(
      orderService.placeOrder({
        user: { id: 'user-1' },
        sessionId: 'session-1',
        payload: {
          shippingAddressId: 'addr-1',
          billingAddressId: 'addr-1',
          paymentMethod: 'cod',
        },
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Requested quantity exceeds available stock',
    });

    expect(inventoryService.reserve).not.toHaveBeenCalled();
    expect(session.abortTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
  });
});
