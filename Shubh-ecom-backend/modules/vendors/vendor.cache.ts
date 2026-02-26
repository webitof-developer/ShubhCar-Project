const { jsonGet, jsonSet } = require('../../cache/cacheUtils');
const { redis } = require('../../config/redis');

const TTL = 60 * 10; // 10 minutes

const key = {
  byId: (id) => `vendor:id:${id}`,
  byOwner: (ownerId) => `vendor:owner:${ownerId}`,
};

const getById = async (id) => jsonGet(key.byId(id), 'vendor');
const getByOwner = async (ownerId) => jsonGet(key.byOwner(ownerId), 'vendor');

const setById = async (id, value) => jsonSet(key.byId(id), value, TTL);
const setByOwner = async (ownerId, value) =>
  jsonSet(key.byOwner(ownerId), value, TTL);

const invalidate = async ({ _id, ownerUserId }) => {
  const keys: string[] = [];
  if (_id) keys.push(key.byId(_id));
  if (ownerUserId) keys.push(key.byOwner(ownerUserId));
  if (keys.length && redis.isOpen) await redis.del(keys);
};

module.exports = { getById, getByOwner, setById, setByOwner, invalidate };

