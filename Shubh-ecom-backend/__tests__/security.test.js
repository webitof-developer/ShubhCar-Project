/* Security-focused unit tests (no external services) */

const jwt = require('jsonwebtoken');
let auth;

// Set required env before importing modules that validate env
beforeAll(() => {
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost/test';
  process.env.MONGO_REPLICA_URI =
    process.env.MONGO_REPLICA_URI || process.env.MONGO_URI;
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.STRIPE_SECRET_KEY = 'sk_test';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  process.env.RAZORPAY_KEY_ID = 'rzp_test';
  process.env.RAZORPAY_KEY_SECRET = 'rzp_secret';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'rzp_wh_test';
  auth = require('../middlewares/auth.middleware');
});

describe('sanitize.middleware', () => {
  const sanitize = require('../middlewares/sanitize.middleware');

  test('removes NoSQL operator keys from nested objects', () => {
    const req = {
      body: { name: 'ok', filter: { $gt: 1, nested: { 'a.b': 2, good: 3 } } },
      query: {},
      params: {},
    };
    const res = {};
    const next = jest.fn();

    sanitize(req, res, next);

    expect(req.body).toEqual({
      name: 'ok',
      filter: { nested: { good: 3 } },
    });
    expect(next).toHaveBeenCalled();
  });
});

describe('auth.middleware', () => {
  test('rejects missing token', async () => {
    const middleware = auth();
    const req = { headers: {} };
    const res = {};
    const next = jest.fn();

    await middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]?.message).toBe('Authorization token missing');
  });

  test('accepts valid bearer token', async () => {
    const token = jwt.sign(
      { userId: '123', role: 'customer' },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '15m' },
    );
    const middleware = auth();
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};
    const next = jest.fn();

    await middleware(req, res, next);
    expect(req.user).toEqual({ _id: '123', id: '123', role: 'customer' });
    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith();
  });
});
