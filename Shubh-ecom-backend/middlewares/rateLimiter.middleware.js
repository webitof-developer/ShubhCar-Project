const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { redis, redisEnabled } = require('../config/redis');
const { ipKeyGenerator } = rateLimit;

/* =========================
   SHARED CONFIG
========================= */
const store = redisEnabled
  ? new RedisStore({
      sendCommand: (...args) => redis.sendCommand(args),
    })
  : undefined; // Defaults to MemoryStore

const baseConfig = {
  store, // Use Redis store if enabled
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true, // If Redis fails, allow request to proceed (Fail Open)
};

const buildRateLimitHandler = (message) => (req, res) => {
  return res.status(429).json({
    success: false,
    message,
    code: 'RATE_LIMIT_EXCEEDED',
    requestId: req.context?.requestId,
  });
};

const ipKey = (req) => ipKeyGenerator(req);

/* =========================
   AUTH (VERY STRICT)
========================= */
exports.authLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 1000, // 1 minute
  max: 5, // HARD LIMIT
  keyGenerator: (req) =>
    `${ipKey(req)}:${req.body?.email || req.body?.phone || 'unknown'}`,
  handler: buildRateLimitHandler('Too many requests, please try again later'),
});

// Security: Rate limiting prevents brute-force and credential stuffing attacks.
exports.loginLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  // Security: Key limiter by IP + identifier to prevent distributed brute-force attacks targeting a single account.
  keyGenerator: (req) => {
    const ip = ipKey(req);
    const identifierRaw =
      typeof req.body?.email === 'string'
        ? req.body.email
        : typeof req.body?.phone === 'string'
          ? req.body.phone
          : '';
    const identifier = identifierRaw.toLowerCase().trim();
    return `${ip}_${identifier}`;
  },
  handler: buildRateLimitHandler(
    'Too many login attempts. Please try again later.',
  ),
});

// Security: Rate limiting prevents brute-force and credential stuffing attacks.
exports.registerLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  handler: buildRateLimitHandler(
    'Too many registration attempts. Please try again later.',
  ),
});

// Security: Rate limiting prevents brute-force and credential stuffing attacks.
exports.passwordResetLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  handler: buildRateLimitHandler(
    'Too many password reset attempts. Please try again later.',
  ),
});

/* =========================
   PUBLIC API
========================= */
exports.apiLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  skip: (req) => req.originalUrl?.startsWith('/api/v1/payments/webhook'),
  handler: buildRateLimitHandler('Too many requests, please try again later'),
});

/* =========================
   ADMIN (STRICTER THAN API)
========================= */
exports.adminLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyGenerator: (req) => (req.user?.id ? `admin:${req.user.id}` : ipKey(req)),
  handler: buildRateLimitHandler('Too many requests, please try again later'),
});

/* =========================
   PAYMENTS (PER USER)
========================= */
exports.paymentLimiter = rateLimit({
  ...baseConfig,
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  keyGenerator: (req) => (req.user?.id ? `payment:${req.user.id}` : ipKey(req)),
  handler: buildRateLimitHandler('Too many requests, please try again later'),
});
