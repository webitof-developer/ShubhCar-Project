const path = require('path');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const slugify = require('slugify');
require('dotenv').config();

const Brand = require('../models/Brand.model');
const VehicleModel = require('../modules/vehicle-management/models/VehicleModel.model');
const VehicleYear = require('../modules/vehicle-management/models/VehicleYear.model');
const VehicleModelYear = require('../modules/vehicle-management/models/VehicleModelYear.model');
const VehicleVariant = require('../modules/vehicle-management/models/VehicleVariant.model');
const Vehicle = require('../modules/vehicle-management/models/Vehicle.model');

const DEFAULT_INPUT = path.resolve(
  __dirname,
  '..',
  '..',
  'merged_vehicle_models_schema_ready.xlsx',
);

const normalize = (value) => String(value || '').trim();
const toStatus = (value) => (normalize(value).toLowerCase() === 'inactive' ? 'inactive' : 'active');
const toSlug = (value) =>
  slugify(normalize(value), { lower: true, strict: true, trim: true });

const toInt = (value) => {
  const num = Number(value);
  return Number.isInteger(num) ? num : null;
};

const rangeYears = (start, end) => {
  if (!start || !end || start > end) return [];
  const out = [];
  for (let y = start; y <= end; y += 1) out.push(y);
  return out;
};

const ensureVehicleBrand = async (name, status) => {
  const existing = await Brand.findOne({ name }).lean();
  if (existing) {
    if (existing.type !== 'vehicle') {
      throw new Error(`Brand "${name}" exists but type is "${existing.type}" (expected "vehicle")`);
    }
    await Brand.updateOne({ _id: existing._id }, { $set: { status, isDeleted: false } });
    return existing._id;
  }

  const created = await Brand.create({
    name,
    slug: toSlug(name),
    type: 'vehicle',
    status,
    isDeleted: false,
  });
  return created._id;
};

const ensureVehicleModel = async (brandId, name, status) => {
  const existing = await VehicleModel.collection.findOne({
    brandId: new mongoose.Types.ObjectId(String(brandId)),
    name,
  });
  if (existing) {
    await VehicleModel.collection.updateOne(
      { _id: existing._id },
      { $set: { status, isDeleted: false } },
    );
    return existing._id;
  }

  const created = await VehicleModel.create({
    brandId,
    name,
    slug: toSlug(name),
    status,
    isDeleted: false,
  });
  return created._id;
};

const ensureVehicleYear = async (year, status) => {
  const existing = await VehicleYear.collection.findOne({ year });
  if (existing) {
    await VehicleYear.collection.updateOne(
      { _id: existing._id },
      { $set: { status, isDeleted: false } },
    );
    return existing._id;
  }
  const created = await VehicleYear.create({ year, status, isDeleted: false });
  return created._id;
};

const ensureModelYear = async (modelId, year, status) => {
  const existing = await VehicleModelYear.collection.findOne({
    modelId: new mongoose.Types.ObjectId(String(modelId)),
    year,
  });
  if (existing) {
    await VehicleModelYear.collection.updateOne(
      { _id: existing._id },
      { $set: { status, isDeleted: false } },
    );
    return existing._id;
  }
  const created = await VehicleModelYear.create({ modelId, year, status, isDeleted: false });
  return created._id;
};

const ensureVariant = async (modelYearId, name, status) => {
  const existing = await VehicleVariant.collection.findOne({
    modelYearId: new mongoose.Types.ObjectId(String(modelYearId)),
    name,
  });
  if (existing) {
    await VehicleVariant.collection.updateOne(
      { _id: existing._id },
      { $set: { status, isDeleted: false } },
    );
    return existing._id;
  }
  const created = await VehicleVariant.create({ modelYearId, name, status, isDeleted: false });
  return created._id;
};

const ensureVehicle = async ({ brandId, modelId, yearId, variantName, status }) => {
  const variantNameNormalized = normalize(variantName).toLowerCase();
  const attributeSignature = '__none__';

  const existing = await Vehicle.collection.findOne({
    brandId: new mongoose.Types.ObjectId(String(brandId)),
    modelId: new mongoose.Types.ObjectId(String(modelId)),
    yearId: new mongoose.Types.ObjectId(String(yearId)),
    variantNameNormalized,
    attributeSignature,
  });

  if (existing) {
    await Vehicle.collection.updateOne(
      { _id: existing._id },
      {
        $set: {
          status,
          isDeleted: false,
          variantName,
          variantNameNormalized,
          attributeSignature,
          attributeValueIds: [],
        },
      },
    );
    return { id: existing._id, created: false };
  }

  const created = await Vehicle.create({
    brandId,
    modelId,
    yearId,
    variantName,
    variantNameNormalized,
    attributeSignature,
    attributeValueIds: [],
    status,
    isDeleted: false,
  });
  return { id: created._id, created: true };
};

async function run(inputPath) {
  const mongoUri = process.env.MONGO_URI || process.env.MONGO_REPLICA_URI;
  if (!mongoUri) throw new Error('MONGO_URI or MONGO_REPLICA_URI is required');

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(inputPath);
  const ws = wb.getWorksheet('VehicleSchemaReady') || wb.worksheets[0];
  if (!ws) throw new Error('No worksheet found');

  const header = ws.getRow(1).values.slice(1).map((h) => normalize(h));
  const idx = {};
  header.forEach((h, i) => {
    idx[h] = i + 1;
  });
  const val = (row, key) => normalize(row.getCell(idx[key] || 0).value);

  const stats = {
    rows: 0,
    skipped: 0,
    brands: 0,
    models: 0,
    years: 0,
    modelYears: 0,
    variants: 0,
    vehiclesCreated: 0,
    vehiclesUpdated: 0,
  };

  const seen = {
    brands: new Set(),
    models: new Set(),
    years: new Set(),
    modelYears: new Set(),
    variants: new Set(),
  };

  for (let r = 2; r <= ws.rowCount; r += 1) {
    const row = ws.getRow(r);
    const importReady = val(row, 'import_ready').toLowerCase();
    if (importReady && importReady !== 'yes') {
      stats.skipped += 1;
      continue;
    }

    const brandName = val(row, 'brand_name');
    const modelName = val(row, 'model_name');
    const variantName = val(row, 'variant_name') || 'Standard';
    const status = toStatus(val(row, 'status'));
    const yearStart = toInt(val(row, 'year_start'));
    const yearEnd = toInt(val(row, 'year_end'));

    if (!brandName || !modelName || !yearStart || !yearEnd) {
      stats.skipped += 1;
      continue;
    }

    stats.rows += 1;

    const brandId = await ensureVehicleBrand(brandName, status);
    const brandKey = String(brandId);
    if (!seen.brands.has(brandKey)) {
      seen.brands.add(brandKey);
      stats.brands += 1;
    }

    const modelId = await ensureVehicleModel(brandId, modelName, status);
    const modelKey = `${brandId}:${modelName}`;
    if (!seen.models.has(modelKey)) {
      seen.models.add(modelKey);
      stats.models += 1;
    }

    const years = rangeYears(yearStart, yearEnd);
    for (const yearNum of years) {
      const yearId = await ensureVehicleYear(yearNum, status);
      const yearKey = String(yearNum);
      if (!seen.years.has(yearKey)) {
        seen.years.add(yearKey);
        stats.years += 1;
      }

      const modelYearId = await ensureModelYear(modelId, yearNum, status);
      const modelYearKey = `${modelId}:${yearNum}`;
      if (!seen.modelYears.has(modelYearKey)) {
        seen.modelYears.add(modelYearKey);
        stats.modelYears += 1;
      }

      await ensureVariant(modelYearId, variantName, status);
      const variantKey = `${modelYearId}:${variantName}`;
      if (!seen.variants.has(variantKey)) {
        seen.variants.add(variantKey);
        stats.variants += 1;
      }

      const vehicleResult = await ensureVehicle({
        brandId,
        modelId,
        yearId,
        variantName,
        status,
      });
      if (vehicleResult.created) stats.vehiclesCreated += 1;
      else stats.vehiclesUpdated += 1;
    }
  }

  await mongoose.disconnect();

  console.error('Import completed');
  console.error(JSON.stringify(stats, null, 2));
}

const inputArg = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_INPUT;
run(inputArg).catch(async (err) => {
  console.error('Import failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});
