/* eslint-disable no-console */
const { connectMongo, disconnectMongo } = require('../config/mongo');
const Product = require('../models/Product.model');
const ProductCompatibility = require('../models/ProductCompatibility.model');
const elastic = require('../lib/elasticsearch');

const BATCH_SIZE = 200;

const buildCompatibilityMap = async () => {
  const rows = await ProductCompatibility.find({})
    .select('productId vehicleIds')
    .lean();
  const map = new Map();
  rows.forEach((row) => {
    map.set(
      String(row.productId),
      (row.vehicleIds || []).map((id) => String(id)),
    );
  });
  return map;
};

const run = async () => {
  if (!elastic.isEnabled()) {
    throw new Error('ELASTICSEARCH_NODE is not configured');
  }

  const client = elastic.getClient();
  const index = elastic.getProductsIndex();
  await connectMongo();

  try {
    const exists = await client.indices.exists({ index });
    if (!exists) {
      await client.indices.create({
        index,
        mappings: {
          properties: {
            name: { type: 'text' },
            manufacturerBrand: { type: 'text' },
            vehicleBrand: { type: 'text' },
            oemNumber: { type: 'text' },
            oesNumber: { type: 'text' },
            sku: { type: 'text' },
            productType: { type: 'keyword' },
            categoryId: { type: 'keyword' },
            status: { type: 'keyword' },
            tags: { type: 'keyword' },
            vehicleIds: { type: 'keyword' },
            createdAt: { type: 'date' },
            retailPrice: {
              properties: {
                mrp: { type: 'float' },
                salePrice: { type: 'float' },
              },
            },
          },
        },
      });
      console.error(`Created index: ${index}`);
    }

    const compatibilityMap = await buildCompatibilityMap();
    let skip = 0;
    let indexed = 0;

    while (true) {
      const products = await Product.find({})
        .sort({ _id: 1 })
        .skip(skip)
        .limit(BATCH_SIZE)
        .lean();
      if (!products.length) break;

      const body = [];
      products.forEach((product) => {
        const productId = String(product._id);
        body.push({
          index: {
            _index: index,
            _id: productId,
          },
        });
        body.push({
          _id: productId,
          name: product.name || '',
          manufacturerBrand: product.manufacturerBrand || '',
          vehicleBrand: product.vehicleBrand || '',
          oemNumber: product.oemNumber || '',
          oesNumber: product.oesNumber || '',
          sku: product.sku || '',
          productType: product.productType || '',
          categoryId: product.categoryId ? String(product.categoryId) : '',
          status: product.status || '',
          tags: Array.isArray(product.tags) ? product.tags : [],
          vehicleIds: compatibilityMap.get(productId) || [],
          createdAt: product.createdAt || new Date(),
          retailPrice: product.retailPrice || {},
        });
      });

      const res = await client.bulk({ refresh: true, body });
      if (res.errors) {
        console.error('Bulk index had errors');
      }
      indexed += products.length;
      skip += products.length;
      console.error(`Indexed ${indexed} products...`);
    }

    console.error(`Reindex complete. Total indexed: ${indexed}`);
  } finally {
    await disconnectMongo();
  }
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Elastic reindex failed', err);
    process.exit(1);
  });

