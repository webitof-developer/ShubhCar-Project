/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Product = require('../models/Product.model.ts');
const ProductImage = require('../models/ProductImage.model.ts');
const ProductCompatibility = require('../models/ProductCompatibility.model.ts');
const ProductReview = require('../models/ProductReview.model.ts');
const ProductVariant = require('../models/ProductVariant.model.ts');
const ProductAttribute = require('../models/ProductAttribute.model.ts');
const ProductAttributeValue = require('../models/ProductAttributeValue.model.ts');
const InventoryLog = require('../models/InventoryLog.model.ts');
const CartItem = require('../models/CartItem.model.ts');
const Wishlist = require('../models/Wishlist.model.ts');
const Media = require('../models/Media.model.ts');
const { redis, redisEnabled } = require('../config/redis');

dotenv.config();

const hasArg = (name) => process.argv.includes(name);
const shouldDryRun = hasArg('--dry-run');
const shouldConfirm = hasArg('--confirm');

const purgeRedisKeys = async (patterns) => {
  if (!redisEnabled || !redis || typeof redis.scanIterator !== 'function') {
    return { scanned: 0, deleted: 0 };
  }

  let scanned = 0;
  let deleted = 0;
  for (const pattern of patterns) {
    for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 200 })) {
      scanned += 1;
      deleted += await redis.del(key);
    }
  }
  return { scanned, deleted };
};

const summarizeCounts = async (productIdList) => {
  const includeDeleted = { includeDeleted: true };
  const productQuery = productIdList.length
    ? { productId: { $in: productIdList } }
    : { _id: null };
  const productIdsQuery = productIdList.length
    ? { _id: { $in: productIdList } }
    : { _id: null };

  const [
    products,
    productImages,
    compatibility,
    reviews,
    variants,
    attributes,
    attrValues,
    inventoryLogs,
    cartItemsWithProductRef,
    wishlistWithProductRef,
    mediaWithProductUse,
  ] = await Promise.all([
    Product.countDocuments(productIdsQuery).setOptions(includeDeleted),
    ProductImage.countDocuments(productQuery),
    ProductCompatibility.countDocuments(productQuery),
    ProductReview.countDocuments(productQuery),
    ProductVariant.countDocuments(productQuery),
    ProductAttribute.countDocuments(productQuery),
    ProductAttributeValue.countDocuments(productQuery),
    InventoryLog.countDocuments(productQuery),
    CartItem.countDocuments(productQuery),
    Wishlist.countDocuments(productQuery),
    Media.countDocuments({ usedIn: 'product' }),
  ]);

  return {
    productsToDelete: products,
    productImagesToDelete: productImages,
    compatibilityToDelete: compatibility,
    reviewsToDelete: reviews,
    variantsToDelete: variants,
    attributesToDelete: attributes,
    attributeValuesToDelete: attrValues,
    inventoryLogsToDelete: inventoryLogs,
    cartItemsWithProductRef,
    wishlistWithProductRef,
    mediaWithProductUse,
  };
};

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGO_REPLICA_URI;
  if (!uri) {
    throw new Error('Missing MONGO_URI or MONGO_REPLICA_URI');
  }

  await mongoose.connect(uri);

  const productIds = await Product.find({}, { _id: 1 })
    .setOptions({ includeDeleted: true })
    .lean();
  const productIdList = productIds.map((row) => row._id);

  const before = await summarizeCounts(productIdList);
  console.log('Product reset summary (before):');
  console.table(before);

  if (shouldDryRun || !shouldConfirm) {
    console.log(
      shouldDryRun
        ? 'Dry-run complete. No records deleted.'
        : 'No changes made. Pass --confirm to execute deletion.',
    );
    await mongoose.disconnect();
    return;
  }

  const targetQuery = productIdList.length ? { productId: { $in: productIdList } } : { _id: null };

  await Promise.all([
    ProductImage.deleteMany(targetQuery),
    ProductCompatibility.deleteMany(targetQuery),
    ProductReview.deleteMany(targetQuery),
    ProductVariant.deleteMany(targetQuery),
    ProductAttribute.deleteMany(targetQuery),
    ProductAttributeValue.deleteMany(targetQuery),
    InventoryLog.deleteMany(targetQuery),
    CartItem.deleteMany(targetQuery),
    Wishlist.deleteMany(targetQuery),
  ]);

  if (productIdList.length) {
    await Product.deleteMany({ _id: { $in: productIdList } }).setOptions({ includeDeleted: true });
  }

  await Media.updateMany({ usedIn: 'product' }, { $pull: { usedIn: 'product' } });

  const redisResult = await purgeRedisKeys([
    'bulk-create:upload:*',
    'bulk-update:upload:*',
  ]);

  const after = await summarizeCounts([]);
  console.log('Product reset summary (after):');
  console.table(after);
  console.log('Redis cleanup:', redisResult);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('reset-products-full failed:', err?.message || err);
  try {
    await mongoose.disconnect();
  } catch (_err) {
    // ignore
  }
  process.exit(1);
});
