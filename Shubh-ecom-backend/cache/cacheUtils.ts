// @ts-nocheck
const { redis } = require('../config/redis');
const { cacheHitCounter, cacheMissCounter } = require('../config/metrics');
const logger = require('../config/logger');

const jsonGet = async (key, cacheLabel = 'generic') => {
  try {
    if (!redis.isOpen) return null;
    const raw = await redis.get(key);
    if (raw) cacheHitCounter.inc({ cache: cacheLabel });
    else cacheMissCounter.inc({ cache: cacheLabel });
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.error('Redis get error', { key, error: err.message });
    return null; // Fallback to fetching from DB
  }
};

const jsonSet = async (key, value, ttlSeconds) => {
  try {
    if (!redis.isOpen) return;
    if (value === undefined) return;
    const payload = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.set(key, payload, { EX: ttlSeconds });
    } else {
      await redis.set(key, payload);
    }
  } catch (err) {
    logger.error('Redis set error', { key, error: err.message });
    // Proceed without caching
  }
};

const deleteKey = async (key) => {
  try {
    if (!key) return;
    if (!redis.isOpen) return;
    await redis.del(key);
  } catch (err) {
    logger.error('Redis delete error', { key, error: err.message });
  }
};

// Safer pattern delete using SCAN to avoid blocking Redis.
const deleteByPattern = async (pattern) => {
  try {
    if (!redis.isOpen || typeof redis.scanIterator !== 'function') return 0;
    const keys = [];
    for await (const key of redis.scanIterator({
      MATCH: pattern,
      COUNT: 100,
    })) {
      keys.push(key);
    }
    if (keys.length) {
      await redis.del(keys);
    }
    return keys.length;
  } catch (err) {
    logger.error('Cache pattern delete failed', { pattern, error: err.message });
    return 0;
  }
};

module.exports = { jsonGet, jsonSet, deleteKey, deleteByPattern };

