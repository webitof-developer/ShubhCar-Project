// @ts-nocheck
const { jsonGet, jsonSet, deleteByPattern } = require('./cacheUtils');
const keys = require('../lib/cache/keys');

const TTL = 60 * 5; // 5 minutes (variant master data, not live inventory)

const key = keys.variant;

const get = async (id) => jsonGet(key(id), 'variant');
const set = async (id, value) => jsonSet(key(id), value, TTL);
const del = async (id) => deleteByPattern(key(id));

module.exports = { get, set, del, key };

