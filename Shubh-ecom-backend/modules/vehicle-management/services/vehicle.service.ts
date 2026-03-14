const repo = require('../repositories/vehicle.repository');
const ExcelJS = require('exceljs');
const { generateVehicleCode } = require('../../../utils/numbering');
const Brand = require('../../../models/Brand.model');
const VehicleModel = require('../models/VehicleModel.model');
const VehicleYear = require('../models/VehicleYear.model');
const VehicleAttribute = require('../models/VehicleAttribute.model');
const VehicleAttributeValue = require('../models/VehicleAttributeValue.model');
const Vehicle = require('../models/Vehicle.model');
const { randomUUID } = require('crypto');
const { error } = require('../../../utils/apiResponse');
const { getOffsetPagination, buildPaginationMeta } = require('../../../utils/pagination');

const normalizeName = (value = '') => value.trim().toLowerCase();
const normalizeVariantName = (value = '') => value.trim().toLowerCase();
const VARIANT_NAME_KEY = 'variant name';
const MAX_VARIANT_NAME_LENGTH = 100;
const GENERATION_ATTRIBUTE_KEYS = [
  'generation',
  'generation / variant',
  'generation-variant',
  'generation variant',
];

const buildSignature = (ids) =>
  ids
    .map((id) => String(id))
    .sort()
    .join('|');

const isVariantNameAttribute = (name) =>
  normalizeName(name) === VARIANT_NAME_KEY;

const isGenerationAttributeName = (name = '') =>
  GENERATION_ATTRIBUTE_KEYS.includes(normalizeName(name));

type VehicleAttributeValueItem = {
  attributeId?: { _id?: unknown; name?: string } | string | null;
  _id?: unknown;
  value?: string;
  status?: string;
};

type VehiclePayload = {
  brandId?: unknown;
  modelId?: unknown;
  yearId?: unknown;
  variantName?: unknown;
  attributeValueIds?: unknown[];
  vehicleCode?: unknown;
  status?: unknown;
  [key: string]: unknown;
};

type VehicleCodeItem = {
  _id?: unknown;
  vehicleCode?: string;
  [key: string]: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toAttributeRef = (value: unknown) => (isRecord(value) ? value : null);

const getRefId = (value: unknown) => {
  if (!isRecord(value)) return value;
  return value._id ?? value;
};

const mapAttributeValues = (attributeValues: VehicleAttributeValueItem[] = []) => {
  const attributes = attributeValues
    .filter((item) => item?.attributeId)
    .map((item) => {
      const attributeRef = toAttributeRef(item.attributeId);
      return {
        attributeId: attributeRef?._id || item.attributeId,
        attributeName:
          typeof attributeRef?.name === 'string' ? attributeRef.name : '',
        valueId: item._id,
        value: item.value,
        status: item.status,
      };
    })
    .filter((item) => !isVariantNameAttribute(item.attributeName));

  const byName: Record<string, string> = {};
  attributes.forEach((attr) => {
    const key = normalizeName(attr.attributeName);
    if (key && typeof attr.value === 'string') {
      byName[key] = attr.value;
    }
  });

  return { attributes, byName };
};

const resolveGenerationFromByName = (byName: Record<string, string> = {}) => {
  for (const key of GENERATION_ATTRIBUTE_KEYS) {
    if (byName[key]) return byName[key];
  }
  return '';
};

const mapVehicle = (vehicle: Record<string, unknown>) => {
  const attributeValueIds = Array.isArray(vehicle.attributeValueIds)
    ? (vehicle.attributeValueIds as VehicleAttributeValueItem[])
    : [];
  const { attributes, byName } = mapAttributeValues(attributeValueIds);
  const brand = vehicle.brandId;
  const model = vehicle.modelId;
  const year = vehicle.yearId;

  return {
    _id: vehicle._id,
    vehicleCode: vehicle.vehicleCode || '',
    brandId: getRefId(brand),
    modelId: getRefId(model),
    yearId: getRefId(year),
    variantName: vehicle.variantName || '',
    brand: brand || null,
    model: model || null,
    year: year || null,
    status: vehicle.status,
    attributes,
    display: {
      variantName: vehicle.variantName || '',
      fuelType: byName['fuel type'] || '',
      transmission: byName['transmission'] || '',
      engineCapacity: byName['engine capacity'] || '',
      generation: resolveGenerationFromByName(byName),
    },
  };
};

const hasGenerationAttributeValue = (
  attributeValues: Array<{ attributeId?: { name?: string } | null }> = [],
) =>
  attributeValues.some((value) =>
    isGenerationAttributeName(value?.attributeId?.name || ''),
  );

const buildVehicleOptionLabel = (vehicle: Record<string, unknown>) => {
  const name =
    String(
      vehicle?.variantName ||
      (vehicle?.display as Record<string, unknown>)?.variantName ||
      'Variant',
    ).trim() || 'Variant';
  const display = (vehicle?.display as Record<string, unknown>) || {};
  const meta = [display.fuelType, display.transmission, display.engineCapacity]
    .filter(Boolean)
    .join(' | ');
  return meta ? `${name} (${meta})` : name;
};

const VEHICLE_CODE_REGEX = /^VEH-\d{6}$/;

const ensureVehicleCodes = async (vehicles: VehicleCodeItem[] = []) => {
  const missing = vehicles.filter((item) => !item.vehicleCode || !VEHICLE_CODE_REGEX.test(item.vehicleCode));
  if (!missing.length) return;

  const existingCodes = await Vehicle.find({ vehicleCode: { $ne: null } })
    .select('vehicleCode')
    .lean();
  const used = new Set(existingCodes.map((item) => item.vehicleCode));
  const updates: Array<Record<string, unknown>> = [];

  for (const item of missing) {
    let next = await generateVehicleCode();
    while (used.has(next)) {
      next = await generateVehicleCode();
    }
    used.add(next);
    item.vehicleCode = next;
    updates.push({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: { vehicleCode: next } },
      },
    });
  }

  if (updates.length) {
    await Vehicle.bulkWrite(updates, { ordered: false });
  }
};

const toCsvBuffer = async (workbook) => {
  const buffer = await workbook.csv.writeBuffer();
  return Buffer.from(buffer);
};

const toXlsxBuffer = async (workbook) => {
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

type VehicleImportParsedRow = {
  sourceRow: number;
  brandName: string;
  modelName: string;
  variantName: string;
  generationValue: string;
  yearStart: number;
  yearEnd: number;
  status: 'active' | 'inactive';
  sourceName: string;
  fallbackUsed: boolean;
};

type VehicleImportDryRunSummary = {
  totalRows: number;
  validRows: number;
  skippedRows: number;
  expandedYearRows: number;
  missingGenerationCount: number;
  fallbackGroupCount: number;
  errors: Array<{ row: number; message: string }>;
};

type VehicleImportRun = {
  runId: string;
  createdAt: string;
  scope: { brandName: string; modelContains: string };
  summary: VehicleImportDryRunSummary;
  rows: VehicleImportParsedRow[];
};

type VehicleImportHistoryItem = {
  runId: string;
  createdAt: string;
  status: 'dry_run' | 'completed' | 'failed';
  scope: { brandName: string; modelContains: string };
  summary: VehicleImportDryRunSummary;
  commit?: {
    processedRows: number;
    createdVehicles: number;
    updatedVehicles: number;
    skippedRows: number;
    errors: Array<{ row: number; message: string }>;
  };
};

const IMPORT_RUN_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_IMPORT_HISTORY = 25;
const importRuns = new Map<string, VehicleImportRun>();
const importHistory: VehicleImportHistoryItem[] = [];

const normalizeCell = (value: unknown = '') => String(value || '').trim();

const parseYearFromText = (value = '') => {
  const text = normalizeCell(value);
  if (!text) return null;
  const match = text.match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
};

const isOngoingText = (value = '') => {
  const text = normalizeName(normalizeCell(value));
  if (!text) return false;
  return (
    text.includes('present') ||
    text.includes('ongoing') ||
    text.includes('current') ||
    text.includes('till date') ||
    text.includes('till now')
  );
};

const resolveYearBounds = (row: Record<string, string>) => {
  const fromRaw = normalizeCell(row.year_start || row.year_from);
  const toRaw = normalizeCell(row.year_end || row.year_to);
  const rangeRaw = normalizeCell(row.year_range || row.years_csv);

  let start = parseYearFromText(fromRaw);
  let end = parseYearFromText(toRaw);

  if (!start || !end) {
    const years = (rangeRaw.match(/(19|20)\d{2}/g) || []).map(Number);
    if (!start && years.length) start = years[0];
    if (!end && years.length) end = years[years.length - 1];
  }

  if (!end && (isOngoingText(toRaw) || isOngoingText(rangeRaw))) {
    end = new Date().getFullYear();
  }

  if (!start || !end) return { yearStart: null, yearEnd: null };
  if (start > end) [start, end] = [end, start];
  return { yearStart: start, yearEnd: end };
};

const buildImportScope = (scope: Record<string, unknown> = {}) => {
  const usePilot = String(scope.pilot || '').toLowerCase() === 'true';
  if (usePilot) {
    return { brandName: 'TOYOTA', modelContains: 'ETIOS' };
  }
  return {
    brandName: normalizeCell(scope.brandName || ''),
    modelContains: normalizeCell(scope.modelContains || ''),
  };
};

const shouldIncludeScopeRow = (
  row: { brandName: string; modelName: string },
  scope: { brandName: string; modelContains: string },
) => {
  if (scope.brandName && normalizeName(row.brandName) !== normalizeName(scope.brandName)) {
    return false;
  }
  if (scope.modelContains && !normalizeName(row.modelName).includes(normalizeName(scope.modelContains))) {
    return false;
  }
  return true;
};

const cleanupImportRuns = () => {
  const now = Date.now();
  for (const [runId, run] of importRuns.entries()) {
    const createdAt = new Date(run.createdAt).getTime();
    if (!Number.isFinite(createdAt) || now - createdAt > IMPORT_RUN_TTL_MS) {
      importRuns.delete(runId);
    }
  }
};

const pushImportHistory = (item: VehicleImportHistoryItem) => {
  importHistory.unshift(item);
  if (importHistory.length > MAX_IMPORT_HISTORY) {
    importHistory.length = MAX_IMPORT_HISTORY;
  }
};

const parseImportWorkbook = async (
  fileBuffer: Buffer,
  scope: { brandName: string; modelContains: string },
) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  const sheet = workbook.getWorksheet('VehicleSchemaReady') || workbook.worksheets[0];
  if (!sheet) {
    error('No worksheet found in import file', 400);
  }

  const headers = sheet
    .getRow(1)
    .values
    .slice(1)
    .map((value) => normalizeName(normalizeCell(value)));
  const headerIndex: Record<string, number> = {};
  headers.forEach((header, idx) => {
    headerIndex[header] = idx + 1;
  });

  const getValue = (row, key: string) => {
    const idx = headerIndex[normalizeName(key)];
    if (!idx || idx < 1) return '';
    return normalizeCell(row.getCell(idx).value);
  };

  const errors: Array<{ row: number; message: string }> = [];
  const rows: VehicleImportParsedRow[] = [];
  let totalRows = 0;
  let validRows = 0;
  let skippedRows = 0;
  let expandedYearRows = 0;
  let missingGenerationCount = 0;
  let fallbackGroupCount = 0;

  for (let i = 2; i <= sheet.rowCount; i += 1) {
    const row = sheet.getRow(i);

    const brandName = getValue(row, 'brand_name') || getValue(row, 'brand');
    const modelName = getValue(row, 'model_name') || getValue(row, 'model');
    const variantName = getValue(row, 'variant_name') || getValue(row, 'body_type') || 'Standard';
    const generationValue = getValue(row, 'generation_value') || getValue(row, 'generation / variant');
    const sourceName = getValue(row, 'source_name') || getValue(row, 'source') || '';
    const importReady = normalizeName(getValue(row, 'import_ready'));
    const status = normalizeName(getValue(row, 'status')) === 'inactive' ? 'inactive' : 'active';

    if (!brandName && !modelName) continue;
    if (!shouldIncludeScopeRow({ brandName, modelName }, scope)) continue;
    totalRows += 1;

    if (importReady && importReady !== 'yes') {
      skippedRows += 1;
      errors.push({ row: i, message: 'Row marked as not import-ready' });
      continue;
    }

    const { yearStart, yearEnd } = resolveYearBounds({
      year_start: getValue(row, 'year_start'),
      year_end: getValue(row, 'year_end'),
      year_from: getValue(row, 'year from'),
      year_to: getValue(row, 'year to'),
      year_range: getValue(row, 'year range'),
      years_csv: getValue(row, 'years_csv'),
    });

    if (!brandName || !modelName || !variantName || !yearStart || !yearEnd) {
      skippedRows += 1;
      errors.push({ row: i, message: 'Missing required fields (brand/model/variant/year range)' });
      continue;
    }

    if (yearEnd - yearStart > 60) {
      skippedRows += 1;
      errors.push({ row: i, message: 'Year range is too large' });
      continue;
    }

    const fallbackUsed = !generationValue;
    if (fallbackUsed) {
      missingGenerationCount += 1;
      fallbackGroupCount += 1;
    }

    rows.push({
      sourceRow: i,
      brandName,
      modelName,
      variantName,
      generationValue,
      yearStart,
      yearEnd,
      status,
      sourceName,
      fallbackUsed,
    });
    validRows += 1;
    expandedYearRows += yearEnd - yearStart + 1;
  }

  const summary: VehicleImportDryRunSummary = {
    totalRows,
    validRows,
    skippedRows,
    expandedYearRows,
    missingGenerationCount,
    fallbackGroupCount,
    errors: errors.slice(0, 200),
  };

  return { rows, summary };
};

const findOrCreateVehicleBrand = async (name: string, status: string) => {
  const existing = await Brand.findOne({ name }).lean();
  if (existing) {
    if (existing.type !== 'vehicle') {
      error(`Brand "${name}" exists with non-vehicle type`, 400);
    }
    await Brand.updateOne({ _id: existing._id }, { $set: { status, isDeleted: false } });
    return existing._id;
  }

  const created = await Brand.create({
    name,
    slug: normalizeName(name).replace(/\s+/g, '-'),
    type: 'vehicle',
    status,
    isDeleted: false,
  });
  return created._id;
};

const findOrCreateVehicleModel = async (brandId: unknown, name: string, status: string) => {
  const existing = await VehicleModel.findOne({ brandId, name }).lean();
  if (existing) {
    await VehicleModel.updateOne({ _id: existing._id }, { $set: { status, isDeleted: false } });
    return existing._id;
  }

  const created = await VehicleModel.create({
    brandId,
    name,
    slug: normalizeName(name).replace(/\s+/g, '-'),
    status,
    isDeleted: false,
  });
  return created._id;
};

const findOrCreateYear = async (year: number, status: string) => {
  const existing = await VehicleYear.findOne({ year }).lean();
  if (existing) {
    await VehicleYear.updateOne({ _id: existing._id }, { $set: { status, isDeleted: false } });
    return existing._id;
  }
  const created = await VehicleYear.create({ year, status, isDeleted: false });
  return created._id;
};

const findGenerationAttribute = async () => {
  const all = await VehicleAttribute.find({}).lean();
  const existing = all.find((item) => isGenerationAttributeName(item.name || ''));
  if (existing) return existing;
  const created = await VehicleAttribute.create({
    name: 'Generation',
    type: 'dropdown',
    status: 'active',
    isDeleted: false,
  });
  return created;
};

class VehiclesService {
  async list(query: Record<string, unknown> = {}) {
    const filter: Record<string, unknown> = { isDeleted: false };
    if (query.brandId) filter.brandId = query.brandId;
    if (query.modelId) filter.modelId = query.modelId;
    if (query.yearId) filter.yearId = query.yearId;
    if (query.status) filter.status = query.status;

    let attributeValueIds: string[] = [];
    if (query.attributeValueIds) {
      attributeValueIds = String(query.attributeValueIds)
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      if (attributeValueIds.length) {
        filter.attributeValueIds = { $all: attributeValueIds };
      }
    }

    const pagination = getOffsetPagination({
      page: query.page,
      limit: query.limit,
    });

    const [items, total] = await Promise.all([
      repo
        .list(filter, pagination)
        .populate('brandId', 'name logo status')
        .populate('modelId', 'name image status')
        .populate('yearId', 'year status')
        .populate({
          path: 'attributeValueIds',
          select: 'value attributeId status',
          populate: { path: 'attributeId', select: 'name type status' },
        })
        .lean(),
      repo.count(filter),
    ]);

    await ensureVehicleCodes(items);

    return {
      items: items.map(mapVehicle),
      total,
      page: pagination.page,
      limit: pagination.limit,
      pagination: buildPaginationMeta({ ...pagination, total }),
    };
  }

  async exportVehicles(format = 'csv') {
    const vehicles = await Vehicle.find({ isDeleted: false })
      .populate('brandId', 'name')
      .populate('modelId', 'name')
      .populate('yearId', 'year')
      .populate({
        path: 'attributeValueIds',
        select: 'value attributeId status',
        populate: { path: 'attributeId', select: 'name type status' },
      })
      .lean();

    await ensureVehicleCodes(vehicles);
    const mapped = vehicles.map(mapVehicle);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Vehicles');
    sheet.columns = [
      { header: 'vehicleCode', key: 'vehicleCode' },
      { header: 'brandName', key: 'brandName' },
      { header: 'modelName', key: 'modelName' },
      { header: 'year', key: 'year' },
      { header: 'variantName', key: 'variantName' },
      { header: 'status', key: 'status' },
      { header: 'attributes', key: 'attributes' },
    ];

    mapped.forEach((item) => {
      const attrText = Array.isArray(item.attributes)
        ? item.attributes
          .map((attr) => `${attr.attributeName || ''}:${attr.value}`)
          .filter((entry) => entry !== ':')
          .join(' | ')
        : '';
      sheet.addRow({
        vehicleCode: item.vehicleCode || '',
        brandName: item.brand?.name || '',
        modelName: item.model?.name || '',
        year: item.year?.year || '',
        variantName: item.variantName || '',
        status: item.status || '',
        attributes: attrText,
      });
    });

    const isXlsx = String(format || '').toLowerCase() === 'xlsx';
    const buffer = isXlsx ? await toXlsxBuffer(workbook) : await toCsvBuffer(workbook);
    return {
      buffer,
      filename: `vehicles_export.${isXlsx ? 'xlsx' : 'csv'}`,
      contentType: isXlsx
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv',
    };
  }

  async create(payload: VehiclePayload = {}) {
    if (!payload.brandId) error('brandId is required', 400);
    if (!payload.modelId) error('modelId is required', 400);
    if (!payload.yearId) error('yearId is required', 400);
    if (payload.variantName === undefined || payload.variantName === null) {
      error('variantName is required', 400);
    }

    const variantName = String(payload.variantName || '').trim();
    if (!variantName) error('variantName cannot be empty', 400);
    if (variantName.length > MAX_VARIANT_NAME_LENGTH) {
      error(`variantName must be at most ${MAX_VARIANT_NAME_LENGTH} characters`, 400);
    }

    const brand = await Brand.findById(payload.brandId).lean();
    if (!brand || brand.type !== 'vehicle') error('Vehicle brand not found', 404);

    const model = await VehicleModel.findById(payload.modelId).lean();
    if (!model) error('Vehicle model not found', 404);
    if (String(model.brandId) !== String(payload.brandId)) {
      error('Model does not belong to brand', 400);
    }

    const year = await VehicleYear.findById(payload.yearId).lean();
    if (!year) error('Vehicle year not found', 404);

    const attributeValueIds: unknown[] = Array.isArray(payload.attributeValueIds)
      ? payload.attributeValueIds
      : [];

    const uniqueIds = [
      ...new Set(attributeValueIds.map((id): string => String(id))),
    ];
    if (!uniqueIds.length) {
      error('attributeValueIds is required', 400);
    }
    if (uniqueIds.length !== attributeValueIds.length) {
      error('attributeValueIds contains duplicates', 400);
    }

    const attributeValues = await VehicleAttributeValue.find({
      _id: { $in: uniqueIds },
    })
      .populate('attributeId', 'name type')
      .lean();

    if (attributeValues.length !== uniqueIds.length) {
      error('One or more attributeValueIds are invalid', 400);
    }

    const hasVariantNameAttribute = attributeValues.some((value) =>
      isVariantNameAttribute(value.attributeId?.name),
    );
    if (hasVariantNameAttribute) {
      error('Variant Name cannot be sent as a variant attribute', 400);
    }

    const status = String(payload.status || 'active').toLowerCase();
    if (status === 'active' && !hasGenerationAttributeValue(attributeValues)) {
      error('Generation attribute is required for active vehicles', 400);
    }

    const attributeSignature = buildSignature(uniqueIds);
    const variantNameNormalized = normalizeVariantName(variantName);
    const duplicate = await repo.findOne({
      brandId: payload.brandId,
      modelId: payload.modelId,
      yearId: payload.yearId,
      variantNameNormalized,
      attributeSignature,
    });

    if (duplicate) {
      error('Vehicle with the same variant name and attributes already exists', 409);
    }

    const vehicleCode = payload.vehicleCode
      ? String(payload.vehicleCode).trim().toUpperCase()
      : undefined;

    if (vehicleCode) {
      if (!VEHICLE_CODE_REGEX.test(vehicleCode)) {
        error('vehicleCode must be in format VEH-000001', 400);
      }
      const existingCode = await repo.findOne({ vehicleCode });
      if (existingCode) {
        error('vehicleCode already exists', 409);
      }
    }

    return repo.create({
      vehicleCode,
      brandId: payload.brandId,
      modelId: payload.modelId,
      yearId: payload.yearId,
      variantName,
      variantNameNormalized,
      attributeValueIds: uniqueIds,
      attributeSignature,
      status: payload.status || 'active',
    });
  }

  async get(id) {
    const item = await repo
      .findById(id)
      .populate('brandId', 'name logo status')
      .populate('modelId', 'name image status')
      .populate('yearId', 'year status')
      .populate({
        path: 'attributeValueIds',
        select: 'value attributeId status',
        populate: { path: 'attributeId', select: 'name type status' },
      })
      .lean();

    if (!item) error('Vehicle not found', 404);
    return mapVehicle(item);
  }

  async detail(id) {
    const vehicle = await this.get(id);
    const siblings = await Vehicle.find({ modelId: vehicle.modelId })
      .populate('brandId', 'name logo status')
      .populate('modelId', 'name image status')
      .populate('yearId', 'year status')
      .populate({
        path: 'attributeValueIds',
        select: 'value attributeId status',
        populate: { path: 'attributeId', select: 'name type status' },
      })
      .lean();

    const grouped = new Map();
    siblings.map(mapVehicle).forEach((item) => {
      const yearKey = String(item.year?.year || item.yearId);
      const entry = grouped.get(yearKey) || {
        yearId: item.yearId,
        year: item.year?.year,
        variants: [],
      };
      entry.variants.push(item);
      grouped.set(yearKey, entry);
    });

    const variantsByYear = Array.from(grouped.values()).sort(
      (a, b) => Number(b.year || 0) - Number(a.year || 0),
    );

    return {
      vehicle,
      master: {
        brand: vehicle.brand,
        model: vehicle.model,
      },
      variantsByYear,
    };
  }

  async update(id, payload: VehiclePayload = {}) {
    const existing = await repo.findById(id).lean();
    if (!existing) error('Vehicle not found', 404);

    const updated: VehiclePayload = { ...payload };
    if (updated.vehicleCode) {
      updated.vehicleCode = String(updated.vehicleCode).trim().toUpperCase();
      if (!VEHICLE_CODE_REGEX.test(String(updated.vehicleCode))) {
        error('vehicleCode must be in format VEH-000001', 400);
      }
    }

    const brandId = updated.brandId || existing.brandId;
    const modelId = updated.modelId || existing.modelId;
    const yearId = updated.yearId || existing.yearId;
    const variantName =
      updated.variantName !== undefined
        ? String(updated.variantName || '').trim()
        : String(existing.variantName || '').trim();

    if (!variantName) {
      error('variantName is required', 400);
    }
    if (variantName.length > MAX_VARIANT_NAME_LENGTH) {
      error(`variantName must be at most ${MAX_VARIANT_NAME_LENGTH} characters`, 400);
    }

    if (updated.brandId || updated.modelId) {
      const brand = await Brand.findById(brandId).lean();
      if (!brand || brand.type !== 'vehicle') error('Vehicle brand not found', 404);

      const model = await VehicleModel.findById(modelId).lean();
      if (!model) error('Vehicle model not found', 404);
      if (String(model.brandId) !== String(brandId)) {
        error('Model does not belong to brand', 400);
      }
    }

    if (updated.yearId) {
      const year = await VehicleYear.findById(yearId).lean();
      if (!year) error('Vehicle year not found', 404);
    }

    let attributeValueIds: unknown[] = Array.isArray(existing.attributeValueIds)
      ? existing.attributeValueIds
      : [];
    if (updated.attributeValueIds) {
      attributeValueIds = Array.isArray(updated.attributeValueIds)
        ? updated.attributeValueIds
        : [];

      const uniqueIds = [
        ...new Set(attributeValueIds.map((item): string => String(item))),
      ];
      if (!uniqueIds.length) {
        error('attributeValueIds is required', 400);
      }
      if (uniqueIds.length !== attributeValueIds.length) {
        error('attributeValueIds contains duplicates', 400);
      }

      const attributeValues = await VehicleAttributeValue.find({
        _id: { $in: uniqueIds },
      })
        .populate('attributeId', 'name type')
        .lean();

      if (attributeValues.length !== uniqueIds.length) {
        error('One or more attributeValueIds are invalid', 400);
      }

      const hasVariantNameAttribute = attributeValues.some((value) =>
        isVariantNameAttribute(value.attributeId?.name),
      );
      if (hasVariantNameAttribute) {
        error('Variant Name cannot be sent as a variant attribute', 400);
      }

      attributeValueIds = uniqueIds;
    }

    const status = String(updated.status || existing.status || 'active').toLowerCase();
    if (status === 'active') {
      const generationValues = await VehicleAttributeValue.find({
        _id: { $in: attributeValueIds.map((item) => String(item)) },
      })
        .populate('attributeId', 'name')
        .lean();
      if (!hasGenerationAttributeValue(generationValues)) {
        error('Generation attribute is required for active vehicles', 400);
      }
    }

    const attributeSignature = buildSignature(
      attributeValueIds.map((item) => String(item)),
    );
    const variantNameNormalized = normalizeVariantName(variantName);

    const duplicate = await repo.findOne({
      _id: { $ne: id },
      brandId,
      modelId,
      yearId,
      variantNameNormalized,
      attributeSignature,
    });

    if (duplicate) {
      error('Vehicle with the same variant name and attributes already exists', 409);
    }

    if (updated.vehicleCode) {
      const existingCode = await repo.findOne({
        _id: { $ne: id },
        vehicleCode: updated.vehicleCode,
      });
      if (existingCode) error('vehicleCode already exists', 409);
    }

    const result = await repo.update(id, {
      ...updated,
      brandId,
      modelId,
      yearId,
      variantName,
      variantNameNormalized,
      attributeValueIds,
      attributeSignature,
    });

    if (!result) error('Vehicle not found', 404);
    return result;
  }

  async remove(id) {
    const item = await repo.softDelete(id);
    if (!item) error('Vehicle not found', 404);
    return item;
  }

  async listAvailableYears(query: Record<string, unknown> = {}) {
    if (!query.modelId) error('modelId is required', 400);
    const filter: Record<string, unknown> = {
      modelId: query.modelId,
      isDeleted: false,
      status:
        query.status && String(query.status).trim()
          ? String(query.status).trim()
          : 'active',
    };

    if (query.brandId) {
      filter.brandId = query.brandId;
    }

    const yearIds = await Vehicle.distinct('yearId', filter);
    if (!yearIds.length) return [];
    return VehicleYear.find({ _id: { $in: yearIds }, status: 'active' })
      .sort({ year: -1 })
      .lean();
  }

  async listAvailableAttributes(query: Record<string, unknown> = {}) {
    if (!query.modelId) error('modelId is required', 400);
    const filter: Record<string, unknown> = {
      modelId: query.modelId,
      isDeleted: false,
    };
    if (query.yearId) filter.yearId = query.yearId;

    const attributeValueIds = await Vehicle.distinct(
      'attributeValueIds',
      filter,
    );

    if (!attributeValueIds.length) return [];

    const values = await VehicleAttributeValue.find({
      _id: { $in: attributeValueIds },
      status: 'active',
    })
      .populate('attributeId', 'name type status')
      .lean();

    const map = new Map<string, {
      attributeId: unknown;
      name: string;
      type: unknown;
      values: Array<{ _id: unknown; value: unknown; status: unknown }>;
    }>();
    values.forEach((value) => {
      const attribute = toAttributeRef(value.attributeId);
      if (!attribute || typeof attribute.name !== 'string') return;
      if (isVariantNameAttribute(attribute.name)) return;
      const key = String(attribute._id);
      const entry = map.get(key) || {
        attributeId: attribute._id,
        name: attribute.name,
        type: attribute.type,
        values: [],
      };
      entry.values.push({
        _id: value._id,
        value: value.value,
        status: value.status,
      });
      map.set(key, entry);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  async importDryRun(payload: { fileBuffer?: Buffer; scope?: Record<string, unknown> } = {}) {
    const fileBuffer = payload.fileBuffer;
    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      error('Import file is required', 400);
    }

    cleanupImportRuns();
    const scope = buildImportScope(payload.scope || {});
    const { rows, summary } = await parseImportWorkbook(fileBuffer as Buffer, scope);
    const runId = randomUUID();
    const run: VehicleImportRun = {
      runId,
      createdAt: new Date().toISOString(),
      scope,
      summary,
      rows,
    };
    importRuns.set(runId, run);

    const historyItem: VehicleImportHistoryItem = {
      runId,
      createdAt: run.createdAt,
      status: 'dry_run',
      scope,
      summary,
    };
    pushImportHistory(historyItem);

    return {
      runId,
      createdAt: run.createdAt,
      scope,
      summary,
      sampleRows: rows.slice(0, 25),
    };
  }

  async importCommit(payload: { runId?: string } = {}) {
    cleanupImportRuns();
    const runId = String(payload.runId || '').trim();
    if (!runId) error('runId is required', 400);
    const run = importRuns.get(runId);
    if (!run) {
      error('Import run not found or expired', 404);
      return null;
    }

    const generationAttribute = await findGenerationAttribute();
    const generationValueMap = new Map<string, unknown>();
    const commitErrors: Array<{ row: number; message: string }> = [];
    let createdVehicles = 0;
    let updatedVehicles = 0;
    let skippedRows = 0;
    let processedRows = 0;

    const ensureGenerationValueId = async (value: string) => {
      const normalized = normalizeCell(value);
      if (!normalized) return null;
      const cacheKey = normalizeName(normalized);
      if (generationValueMap.has(cacheKey)) return generationValueMap.get(cacheKey);

      let found = await VehicleAttributeValue.findOne({
        attributeId: generationAttribute._id,
        value: normalized,
      }).lean();
      if (!found) {
        found = await VehicleAttributeValue.create({
          attributeId: generationAttribute._id,
          value: normalized,
          status: 'active',
          isDeleted: false,
        });
      }
      generationValueMap.set(cacheKey, found._id);
      return found._id;
    };

    for (const sourceRow of run.rows) {
      try {
        const brandId = await findOrCreateVehicleBrand(sourceRow.brandName, sourceRow.status);
        const modelId = await findOrCreateVehicleModel(brandId, sourceRow.modelName, sourceRow.status);
        const generationValueId = await ensureGenerationValueId(sourceRow.generationValue);

        for (let yearNum = sourceRow.yearStart; yearNum <= sourceRow.yearEnd; yearNum += 1) {
          const yearId = await findOrCreateYear(yearNum, sourceRow.status);
          const variantNameNormalized = normalizeVariantName(sourceRow.variantName);
          const attributeValueIds = generationValueId ? [generationValueId] : [];
          const attributeSignature = attributeValueIds.length
            ? buildSignature(attributeValueIds)
            : '__none__';

          const possibleSignatures = attributeSignature === '__none__'
            ? ['__none__', '']
            : [attributeSignature];

          const existing = await Vehicle.findOne({
            brandId,
            modelId,
            yearId,
            variantNameNormalized,
            attributeSignature: { $in: possibleSignatures },
            isDeleted: false,
          }).lean();

          if (existing) {
            await Vehicle.updateOne(
              { _id: existing._id },
              {
                $set: {
                  variantName: sourceRow.variantName,
                  variantNameNormalized,
                  attributeValueIds,
                  attributeSignature,
                  status: sourceRow.status,
                  isDeleted: false,
                },
              },
            );
            updatedVehicles += 1;
          } else {
            await Vehicle.create({
              brandId,
              modelId,
              yearId,
              variantName: sourceRow.variantName,
              variantNameNormalized,
              attributeValueIds,
              attributeSignature,
              status: sourceRow.status,
              isDeleted: false,
            });
            createdVehicles += 1;
          }
          processedRows += 1;
        }
      } catch (e) {
        skippedRows += 1;
        commitErrors.push({
          row: sourceRow.sourceRow,
          message: e instanceof Error ? e.message : 'Import commit failed',
        });
      }
    }

    importRuns.delete(runId);
    const commit = {
      processedRows,
      createdVehicles,
      updatedVehicles,
      skippedRows,
      errors: commitErrors.slice(0, 200),
    };

    const historyEntry = importHistory.find((item) => item.runId === runId);
    if (historyEntry) {
      historyEntry.status = commitErrors.length ? 'failed' : 'completed';
      historyEntry.commit = commit;
    } else {
      pushImportHistory({
        runId,
        createdAt: run.createdAt,
        status: commitErrors.length ? 'failed' : 'completed',
        scope: run.scope,
        summary: run.summary,
        commit,
      });
    }

    return {
      runId,
      status: commitErrors.length ? 'failed' : 'completed',
      summary: run.summary,
      commit,
    };
  }

  async getImportHistory(query: Record<string, unknown> = {}) {
    cleanupImportRuns();
    const limit = Math.min(50, Math.max(1, Number(query.limit || 10)));
    return {
      items: importHistory.slice(0, limit),
      total: importHistory.length,
    };
  }

  async listModificationGroups(query: Record<string, unknown> = {}) {
    if (!query.brandId) error('brandId is required', 400);
    if (!query.modelId) error('modelId is required', 400);
    if (!query.yearId) error('yearId is required', 400);

    const selectedYearDoc = await VehicleYear.findById(query.yearId).lean();
    if (!selectedYearDoc) error('Vehicle year not found', 404);
    const selectedYear = Number(selectedYearDoc.year);
    if (!Number.isFinite(selectedYear)) error('Invalid selected year', 400);

    const filter: Record<string, unknown> = {
      brandId: query.brandId,
      modelId: query.modelId,
      isDeleted: false,
    };
    filter.status =
      query.status && String(query.status).trim()
        ? String(query.status).trim()
        : 'active';

    const rows = await Vehicle.find(filter)
      .populate('brandId', 'name logo status')
      .populate('modelId', 'name image status')
      .populate('yearId', 'year status')
      .populate({
        path: 'attributeValueIds',
        select: 'value attributeId status',
        populate: { path: 'attributeId', select: 'name type status' },
      })
      .lean();

    const groups = new Map<string, {
      groupKey: string;
      groupTitle: string;
      yearSet: Set<number>;
      options: Array<Record<string, unknown>>;
    }>();

    rows.map(mapVehicle).forEach((vehicle) => {
      const yearValue = Number((vehicle?.year as Record<string, unknown>)?.year);
      if (!Number.isFinite(yearValue)) return;
      const display = (vehicle?.display as Record<string, unknown>) || {};
      const groupTitleRaw = String(display.generation || vehicle.variantName || 'Other').trim() || 'Other';
      const groupKey = normalizeName(groupTitleRaw);
      const entry = groups.get(groupKey) || {
        groupKey,
        groupTitle: groupTitleRaw,
        yearSet: new Set<number>(),
        options: [],
      };
      entry.yearSet.add(yearValue);
      if (yearValue === selectedYear) {
        entry.options.push({
          vehicleId: vehicle._id,
          label: buildVehicleOptionLabel(vehicle),
          variantName: vehicle.variantName || display.variantName || 'Variant',
          display: vehicle.display || {},
          year: yearValue,
        });
      }
      groups.set(groupKey, entry);
    });

    const data = Array.from(groups.values())
      .map((group) => {
        const years = Array.from(group.yearSet.values()).sort((a, b) => a - b);
        const yearStart = years[0];
        const yearEnd = years[years.length - 1];
        const yearRangeLabel =
          yearStart === yearEnd ? String(yearStart) : `${yearStart} - ${yearEnd}`;
        const lifecycle = yearEnd >= new Date().getFullYear() ? 'ongoing' : 'discontinued';
        return {
          groupKey: group.groupKey,
          groupTitle: group.groupTitle,
          yearStart,
          yearEnd,
          yearRangeLabel,
          lifecycle,
          options: group.options.sort((a, b) =>
            String(a.label || '').localeCompare(String(b.label || ''), 'en', { sensitivity: 'base' }),
          ),
        };
      })
      .filter((group) => group.options.length > 0)
      .sort((a, b) =>
        String(a.groupTitle || '').localeCompare(String(b.groupTitle || ''), 'en', { sensitivity: 'base' }),
      );

    return {
      selectedYearId: String(query.yearId),
      selectedYear,
      groups: data,
      totalGroups: data.length,
    };
  }
}

module.exports = new VehiclesService();

