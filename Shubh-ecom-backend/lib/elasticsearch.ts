// @ts-nocheck
const { Client } = require('@elastic/elasticsearch');
const logger = require('../config/logger');

let client = null;

const node = process.env.ELASTICSEARCH_NODE;
const username = process.env.ELASTICSEARCH_USERNAME;
const password = process.env.ELASTICSEARCH_PASSWORD;

if (node) {
  const auth =
    username && password
      ? {
          username,
          password,
        }
      : undefined;

  client = new Client({
    node,
    ...(auth ? { auth } : {}),
  });
}

const isEnabled = () => Boolean(client);

const getClient = () => client;

const getProductsIndex = () =>
  process.env.ELASTICSEARCH_INDEX_PRODUCTS || 'products';

const ping = async () => {
  if (!client) return false;
  try {
    await client.ping();
    return true;
  } catch (err) {
    logger.warn('elasticsearch_unavailable', {
      error: err?.message || String(err),
    });
    return false;
  }
};

module.exports = {
  isEnabled,
  getClient,
  getProductsIndex,
  ping,
};
