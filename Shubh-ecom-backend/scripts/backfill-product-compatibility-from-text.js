/* eslint-disable no-console */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const Product = require('../models/Product.model.ts');
const ProductCompatibility = require('../models/ProductCompatibility.model.ts');
const Brand = require('../models/Brand.model.ts');
const Vehicle = require('../modules/vehicle-management/models/Vehicle.model.ts');
const VehicleModel = require('../modules/vehicle-management/models/VehicleModel.model.ts');

dotenv.config();

const hasArg = (name) => process.argv.includes(name);
const shouldApply = hasArg('--apply');

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const compact = (value) => normalize(value).replace(/\s+/g, '');
const debracket = (value) => String(value || '').replace(/\([^)]*\)/g, ' ');

const BRAND_ALIASES = new Map([
  ['vw', 'volkswagen'],
  ['v w', 'volkswagen'],
  ['maruti', 'maruti suzuki'],
  ['suzuki', 'maruti suzuki'],
]);

const normalizeBrandKey = (value) => {
  const key = normalize(value);
  return BRAND_ALIASES.get(key) || key;
};

const includesModel = (text, modelName) => {
  const nText = ` ${normalize(text)} `;
  const nModel = normalize(modelName);
  const nModelCore = normalize(debracket(modelName));
  if (!nModel || nModel.length < 3) return false;
  if (nText.includes(` ${nModel} `)) return true;
  if (nModelCore && nModelCore.length >= 3 && nText.includes(` ${nModelCore} `)) return true;

  const cModel = compact(modelName);
  const cModelCore = compact(debracket(modelName));
  const cText = compact(text);
  if (cModel.length >= 4 && cText.includes(cModel)) return true;
  if (cModelCore.length >= 4 && cText.includes(cModelCore)) return true;
  return false;
};

async function run() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_REPLICA_URI;
  if (!mongoUri) throw new Error('Missing MONGO_URI or MONGO_REPLICA_URI');
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  const [products, vehicles] = await Promise.all([
    Product.find({}, { _id: 1, productId: 1, productCode: 1, name: 1, shortDescription: 1, vehicleBrand: 1 })
      .lean(),
    Vehicle.find({ status: 'active', isDeleted: false }, { _id: 1, brandId: 1, modelId: 1, vehicleCode: 1 })
      .lean(),
  ]);

  const brandIds = [...new Set(vehicles.map((v) => String(v.brandId)))];
  const modelIds = [...new Set(vehicles.map((v) => String(v.modelId)))];
  const [brands, models] = await Promise.all([
    Brand.find({ _id: { $in: brandIds } }, { _id: 1, name: 1 }).lean(),
    VehicleModel.find({ _id: { $in: modelIds } }, { _id: 1, brandId: 1, name: 1 }).lean(),
  ]);

  const brandById = new Map(brands.map((b) => [String(b._id), b.name]));
  const modelById = new Map(models.map((m) => [String(m._id), m]));
  const brandIdByName = new Map(brands.map((b) => [normalizeBrandKey(b.name), String(b._id)]));
  const modelIdsByBrand = new Map();
  for (const model of models) {
    const key = String(model.brandId);
    if (!modelIdsByBrand.has(key)) modelIdsByBrand.set(key, []);
    modelIdsByBrand.get(key).push(String(model._id));
  }

  const updates = [];
  const unmatched = [];
  const reasons = {
    no_brand_on_product: 0,
    brand_not_in_vehicle_master: 0,
    model_not_detected_in_text: 0,
    no_vehicle_rows_for_match: 0,
  };

  for (const product of products) {
    const corpus = `${product.name || ''} ${product.shortDescription || ''}`;
    const productCode = product.productCode || product.productId || String(product._id);
    const brandKey = normalizeBrandKey(product.vehicleBrand);
    const modelMatchesAllBrands = [];
    for (const model of models) {
      if (includesModel(corpus, model.name)) {
        modelMatchesAllBrands.push(String(model._id));
      }
    }

    const inferredBrandIds = [...new Set(modelMatchesAllBrands.map((id) => String(modelById.get(id)?.brandId || '')))]
      .filter(Boolean);
    const inferredBrandId = inferredBrandIds.length === 1 ? inferredBrandIds[0] : '';

    let brandId = '';
    if (brandKey && brandKey !== 'test' && brandKey !== '???') {
      brandId = brandIdByName.get(brandKey) || '';
    }
    if (!brandId && inferredBrandId) brandId = inferredBrandId;

    if (!brandId) {
      const reason = !brandKey || brandKey === 'test' || brandKey === '???'
        ? 'no_brand_on_product'
        : 'brand_not_in_vehicle_master';
      reasons[reason] += 1;
      unmatched.push({
        productCode,
        reason,
        vehicleBrand: product.vehicleBrand || '',
        name: product.name || '',
      });
      continue;
    }

    const candidateModelIds = [];
    for (const modelId of modelIdsByBrand.get(brandId) || []) {
      const model = modelById.get(modelId);
      if (model && includesModel(corpus, model.name)) candidateModelIds.push(modelId);
    }

    if (!candidateModelIds.length) {
      reasons.model_not_detected_in_text += 1;
      unmatched.push({
        productCode,
        reason: 'model_not_detected_in_text',
        vehicleBrand: product.vehicleBrand || '',
        resolvedBrand: brandById.get(brandId) || '',
        name: product.name || '',
      });
      continue;
    }

    const vehicleIds = vehicles
      .filter(
        (row) =>
          String(row.brandId) === brandId &&
          candidateModelIds.includes(String(row.modelId)),
      )
      .map((row) => row._id);

    if (!vehicleIds.length) {
      reasons.no_vehicle_rows_for_match += 1;
      unmatched.push({
        productCode,
        reason: 'no_vehicle_rows_for_match',
        vehicleBrand: product.vehicleBrand || '',
        resolvedBrand: brandById.get(brandId) || '',
        name: product.name || '',
      });
      continue;
    }

    updates.push({
      productId: product._id,
      productCode,
      brandName: brandById.get(brandId) || '',
      vehicleIds: [...new Set(vehicleIds.map(String))],
    });
  }

  if (shouldApply && updates.length) {
    await Promise.all(
      updates.map((item) =>
        ProductCompatibility.updateOne(
          { productId: item.productId },
          { $set: { vehicleIds: item.vehicleIds } },
          { upsert: true },
        ),
      ),
    );
  }

  const summary = {
    applyMode: shouldApply,
    totalProductsScanned: products.length,
    matchedProducts: updates.length,
    unmatchedProducts: products.length - updates.length,
    reasonBreakdown: reasons,
    sampleMatches: updates.slice(0, 10).map((item) => ({
      productCode: item.productCode,
      vehicleCount: item.vehicleIds.length,
      brandName: item.brandName,
    })),
  };

  console.log(JSON.stringify(summary, null, 2));
  const outDir = path.resolve(__dirname, '..', 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'compatibility-unmatched.json');
  fs.writeFileSync(outPath, JSON.stringify(unmatched, null, 2));
  console.log(`Wrote unmatched report: ${outPath}`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('backfill-product-compatibility-from-text failed:', err?.message || err);
  try {
    await mongoose.disconnect();
  } catch (_err) {
    // ignore
  }
  process.exit(1);
});
