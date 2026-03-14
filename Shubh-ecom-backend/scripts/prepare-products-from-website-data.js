/* eslint-disable no-console */
const path = require('path');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const dotenv = require('dotenv');

const Category = require('../models/Category.model.ts');

dotenv.config();

const DEFAULT_INPUT = path.resolve(__dirname, '..', '..', 'DATA FOR WEBSITE (1).xlsx');
const DEFAULT_IMPORT_OUTPUT = path.resolve(
  __dirname,
  '..',
  '..',
  'products_test_60_import_ready.xlsx',
);
const DEFAULT_REPORT_OUTPUT = path.resolve(
  __dirname,
  '..',
  '..',
  'products_test_60_mapping_report.xlsx',
);

const TARGET_GROUPS = [
  { source: 'SUSPENSION SYSTEM', label: 'SUSPENSION', parentCode: 'CAT-000054', take: 30 },
  { source: 'STEERING SYSTEM', label: 'STEERING', parentCode: 'CAT-000053', take: 30 },
];

const BULK_HEADERS = [
  'productCode',
  'name',
  'categoryCode',
  'productType',
  'manufacturerBrand',
  'vehicleBrand',
  'oemNumber',
  'sku',
  'shortDescription',
  'retail_mrp',
  'status',
];

const normalizeText = (value) =>
  String(value == null ? '' : value)
    .replace(/\s+/g, ' ')
    .trim();

const upper = (value) => normalizeText(value).toUpperCase();

const normalizeMainGroup = (value) => {
  const normalized = upper(value).replace(/\s+/g, ' ');
  if (normalized.includes('SUSPENSION')) return 'SUSPENSION SYSTEM';
  if (normalized.includes('STEERING')) return 'STEERING SYSTEM';
  return normalized;
};

const toSafeSlug = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const asNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const raw = normalizeText(value);
  if (!raw) return null;
  const parsed = Number(raw.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return Math.round(sorted[mid]);
};

const parseArgs = () => {
  const raw = process.argv.slice(2);
  const args = {};
  for (let i = 0; i < raw.length; i += 1) {
    const token = raw[i];
    if (!token.startsWith('--')) continue;
    const [flag, inlineValue] = token.split('=');
    const key = flag.replace(/^--/, '');
    if (inlineValue != null) {
      args[key] = inlineValue;
      continue;
    }
    const next = raw[i + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
};

const seededRandom = (seedInput) => {
  const seedText = String(seedInput ?? '20260313');
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let state = h >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
};

const shuffleDeterministic = (list, randomFn) => {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const normalizeName = (row) => {
  const subgroup = normalizeText(row.subProductGroup2);
  const model = normalizeText(row.applicationModel);
  const desc = normalizeText(row.hlaapDescription);
  const primary = [subgroup, model].filter(Boolean).join(' - ');
  if (primary) return primary.slice(0, 200);
  if (desc) return desc.slice(0, 200);
  if (normalizeText(row.hlaapNo)) return `Part ${normalizeText(row.hlaapNo)}`;
  return `Imported Product ${row.sourceRow}`;
};

const parseSplit = (value) => {
  const [left, right] = String(value || '30:30')
    .split(':')
    .map((part) => Number(part));
  if (!Number.isFinite(left) || !Number.isFinite(right) || left < 1 || right < 1) {
    return { suspension: 30, steering: 30 };
  }
  return { suspension: Math.floor(left), steering: Math.floor(right) };
};

const parseRatio = (value) => {
  const [oemRaw, aftermarketRaw] = String(value || '70:30')
    .split(':')
    .map((part) => Number(part));
  if (
    !Number.isFinite(oemRaw) ||
    !Number.isFinite(aftermarketRaw) ||
    oemRaw < 0 ||
    aftermarketRaw < 0 ||
    oemRaw + aftermarketRaw === 0
  ) {
    return { oem: 70, aftermarket: 30 };
  }
  const total = oemRaw + aftermarketRaw;
  return {
    oem: (oemRaw / total) * 100,
    aftermarket: (aftermarketRaw / total) * 100,
  };
};

const readSourceRows = async (inputPath) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(inputPath);
  const sheet = workbook.getWorksheet('Sheet4') || workbook.worksheets[0];
  if (!sheet) throw new Error('Input workbook has no sheet');

  const headerRowNumber = 2;
  const headerRow = sheet.getRow(headerRowNumber);
  const headerMap = new Map();

  headerRow.eachCell((cell, colNumber) => {
    headerMap.set(upper(cell.value), colNumber);
  });

  const col = (name) => {
    const key = upper(name);
    const colNumber = headerMap.get(key);
    if (!colNumber) {
      throw new Error(`Missing column "${name}" in source file`);
    }
    return colNumber;
  };

  const columns = {
    oeNo: col('OE No'),
    hlaapNo: col('HLAAP No.'),
    hlaapDescription: col('HLAAP Description'),
    applicationModel: col('APPLICATION / MODEL'),
    subProductGroup2: col('Sub-Product Group 2'),
    mainGroup: col('MAIN GROUP'),
    brand: col('BRAND'),
    mrp: col('MRP'),
  };

  const rows = [];
  for (let rowNumber = headerRowNumber + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    if (!row || row.cellCount === 0) continue;

    const source = {
      sourceRow: rowNumber,
      oeNo: normalizeText(row.getCell(columns.oeNo).value),
      hlaapNo: normalizeText(row.getCell(columns.hlaapNo).value),
      hlaapDescription: normalizeText(row.getCell(columns.hlaapDescription).value),
      applicationModel: normalizeText(row.getCell(columns.applicationModel).value),
      subProductGroup2: normalizeText(row.getCell(columns.subProductGroup2).value),
      mainGroup: normalizeMainGroup(row.getCell(columns.mainGroup).value),
      brand: normalizeText(row.getCell(columns.brand).value),
      mrp: asNumber(row.getCell(columns.mrp).value),
    };

    if (
      !source.mainGroup &&
      !source.hlaapNo &&
      !source.hlaapDescription &&
      !source.applicationModel &&
      !source.subProductGroup2
    ) {
      continue;
    }

    rows.push(source);
  }

  return rows;
};

const buildMedians = (rows) => {
  const subgroupBuckets = new Map();
  const categoryBuckets = new Map();

  for (const row of rows) {
    if (!Number.isFinite(row.mrp)) continue;
    const subgroupKey = `${row.mainGroup}::${upper(row.subProductGroup2) || 'UNSPECIFIED'}`;
    const groupKey = row.mainGroup;
    if (!subgroupBuckets.has(subgroupKey)) subgroupBuckets.set(subgroupKey, []);
    if (!categoryBuckets.has(groupKey)) categoryBuckets.set(groupKey, []);
    subgroupBuckets.get(subgroupKey).push(row.mrp);
    categoryBuckets.get(groupKey).push(row.mrp);
  }

  const subgroupMedian = new Map();
  const categoryMedian = new Map();
  for (const [key, values] of subgroupBuckets.entries()) subgroupMedian.set(key, median(values));
  for (const [key, values] of categoryBuckets.entries()) categoryMedian.set(key, median(values));

  return { subgroupMedian, categoryMedian };
};

const ensureSubcategories = async (selectedRows) => {
  const safeRows = selectedRows.filter((row) => row && typeof row === 'object');
  const parentCodes = [...new Set(TARGET_GROUPS.map((group) => group.parentCode))];
  const parentCategories = await Category.find({
    categoryCode: { $in: parentCodes },
    isDeleted: false,
  }).lean();

  if (parentCategories.length !== parentCodes.length) {
    const found = new Set(parentCategories.map((cat) => cat.categoryCode));
    const missing = parentCodes.filter((code) => !found.has(code));
    throw new Error(`Missing parent categories: ${missing.join(', ')}`);
  }

  const parentByCode = new Map(parentCategories.map((cat) => [cat.categoryCode, cat]));
  const existingSubs = await Category.find({
    parentId: { $in: parentCategories.map((cat) => cat._id) },
    isDeleted: false,
  }).lean();

  const existingByKey = new Map();
  for (const sub of existingSubs) {
    existingByKey.set(`${String(sub.parentId)}::${upper(sub.name)}`, sub);
  }

  const mapping = new Map();
  const created = [];

  for (const row of safeRows) {
    const groupMeta = TARGET_GROUPS.find((g) => g.source === row.mainGroup);
    if (!groupMeta) continue;
    const parent = parentByCode.get(groupMeta.parentCode);
    const subName = normalizeText(row.subProductGroup2) || 'General';
    const key = `${String(parent._id)}::${upper(subName)}`;
    if (mapping.has(`${row.mainGroup}::${upper(subName)}`)) continue;

    let subCategory = existingByKey.get(key);
    if (!subCategory) {
      const uniqueSlugBase = toSafeSlug(`${parent.name}-${subName}`) || 'sub-category';
      let slug = uniqueSlugBase;
      let suffix = 1;
      // Keep slug unique globally.
      // eslint-disable-next-line no-await-in-loop
      while (await Category.exists({ slug })) {
        suffix += 1;
        slug = `${uniqueSlugBase}-${suffix}`;
      }

      // eslint-disable-next-line no-await-in-loop
      subCategory = await Category.create({
        parentId: parent._id,
        name: subName,
        slug,
        isActive: true,
      });
      created.push({
        parentCode: parent.categoryCode,
        parentName: parent.name,
        subName,
        categoryCode: subCategory.categoryCode,
      });
      existingByKey.set(key, subCategory.toObject ? subCategory.toObject() : subCategory);
    }

    mapping.set(`${row.mainGroup}::${upper(subName)}`, {
      mainGroup: row.mainGroup,
      parentCode: parent.categoryCode,
      parentName: parent.name,
      subGroup2: subName,
      categoryCode: subCategory.categoryCode,
      categoryId: String(subCategory._id),
    });
  }

  return { mapping, created };
};

const writeImportWorkbook = async (rows, outputPath) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('ProductsImport');
  sheet.addRow(BULK_HEADERS);
  rows.forEach((row) => {
    sheet.addRow(BULK_HEADERS.map((key) => row[key] ?? ''));
  });

  sheet.columns = BULK_HEADERS.map((header) => ({
    header,
    key: header,
    width: Math.max(16, header.length + 4),
  }));
  await workbook.xlsx.writeFile(outputPath);
};

const writeReportWorkbook = async (rows, categoryMappingRows, outputPath, summary) => {
  const workbook = new ExcelJS.Workbook();
  const report = workbook.addWorksheet('SelectionReport');
  report.columns = [
    { header: 'sourceRow', key: 'sourceRow', width: 10 },
    { header: 'mainGroup', key: 'mainGroup', width: 22 },
    { header: 'subProductGroup2', key: 'subProductGroup2', width: 32 },
    { header: 'brand', key: 'brand', width: 20 },
    { header: 'applicationModel', key: 'applicationModel', width: 34 },
    { header: 'hlaapNo', key: 'hlaapNo', width: 16 },
    { header: 'oeNo', key: 'oeNo', width: 20 },
    { header: 'assignedType', key: 'assignedType', width: 16 },
    { header: 'categoryCode', key: 'categoryCode', width: 14 },
    { header: 'productCode', key: 'productCode', width: 14 },
    { header: 'name', key: 'name', width: 44 },
    { header: 'mrpOriginal', key: 'mrpOriginal', width: 14 },
    { header: 'mrpFinal', key: 'mrpFinal', width: 14 },
    { header: 'mrpFillRule', key: 'mrpFillRule', width: 26 },
    { header: 'sku', key: 'sku', width: 18 },
  ];

  rows.forEach((row) => report.addRow(row));

  const mappingSheet = workbook.addWorksheet('CategoryMapping');
  mappingSheet.columns = [
    { header: 'mainGroup', key: 'mainGroup', width: 22 },
    { header: 'parentCode', key: 'parentCode', width: 14 },
    { header: 'parentName', key: 'parentName', width: 20 },
    { header: 'subGroup2', key: 'subGroup2', width: 36 },
    { header: 'categoryCode', key: 'categoryCode', width: 14 },
  ];
  categoryMappingRows.forEach((row) => mappingSheet.addRow(row));

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'metric', key: 'metric', width: 30 },
    { header: 'value', key: 'value', width: 30 },
  ];
  Object.entries(summary).forEach(([metric, value]) => summarySheet.addRow({ metric, value }));

  await workbook.xlsx.writeFile(outputPath);
};

const main = async () => {
  const args = parseArgs();
  const input = path.resolve(args.input ? String(args.input) : DEFAULT_INPUT);
  const importOutput = path.resolve(args.output ? String(args.output) : DEFAULT_IMPORT_OUTPUT);
  const reportOutput = path.resolve(
    args.reportOutput ? String(args.reportOutput) : DEFAULT_REPORT_OUTPUT,
  );
  const split = parseSplit(args.split);
  const ratio = parseRatio(args.ratio);
  const seed = String(args.seed || '20260313');
  const random = seededRandom(seed);

  const mongoUri = process.env.MONGO_URI || process.env.MONGO_REPLICA_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI or MONGO_REPLICA_URI is required');
  }

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

  try {
    const allRows = await readSourceRows(input);
    const filtered = allRows.filter((row) =>
      TARGET_GROUPS.some((group) => group.source === row.mainGroup),
    );
    const medians = buildMedians(filtered);

    const targetTakeByGroup = new Map([
      ['SUSPENSION SYSTEM', split.suspension],
      ['STEERING SYSTEM', split.steering],
    ]);

    const selectedRows = [];
    for (const group of TARGET_GROUPS) {
      const bucket = filtered.filter((row) => row.mainGroup === group.source);
      const picked = shuffleDeterministic(bucket, random).slice(
        0,
        targetTakeByGroup.get(group.source) ?? group.take,
      );
      if (picked.length < (targetTakeByGroup.get(group.source) ?? group.take)) {
        throw new Error(
          `Not enough rows for ${group.source}. Needed ${targetTakeByGroup.get(group.source)}, found ${picked.length}`,
        );
      }
      selectedRows.push(...picked.filter((row) => row && typeof row === 'object'));
    }

    const { mapping } = await ensureSubcategories(selectedRows);
    const shuffledSelected = shuffleDeterministic(selectedRows, random).filter(
      (row) => row && typeof row === 'object',
    );
    const totalCount = shuffledSelected.length;
    const aftermarketCount = Math.round((ratio.aftermarket / 100) * totalCount);
    const aftermarketRows = new Set(
      shuffledSelected
        .slice(0, aftermarketCount)
        .filter((row) => Number.isFinite(row.sourceRow))
        .map((row) => row.sourceRow),
    );

    const existingCodes = await Category.find({}, { categoryCode: 1 }).lean();
    if (!existingCodes.length) {
      throw new Error('No category codes found. Cannot map selected rows to subcategories.');
    }

    const existingProducts = await mongoose.connection
      .collection('products')
      .find({}, { projection: { productId: 1 } })
      .toArray();
    const codeNumbers = existingProducts
      .map((doc) => String(doc.productId || '').match(/^PRO-(\d{6})$/))
      .filter(Boolean)
      .map((match) => Number(match[1]));
    let nextCode = (codeNumbers.length ? Math.max(...codeNumbers) : 0) + 1;

    const usedSku = new Set();
    const importRows = [];
    const reportRows = [];

    for (const row of shuffledSelected) {
      const subgroup = normalizeText(row.subProductGroup2) || 'General';
      const mapKey = `${row.mainGroup}::${upper(subgroup)}`;
      const mappedCategory = mapping.get(mapKey);
      if (!mappedCategory) {
        throw new Error(
          `Missing category mapping for ${row.mainGroup} / ${subgroup}. Ensure bootstrap ran correctly.`,
        );
      }

      const subgroupKey = `${row.mainGroup}::${upper(subgroup) || 'UNSPECIFIED'}`;
      const subgroupMedian = medians.subgroupMedian.get(subgroupKey);
      const categoryMedian = medians.categoryMedian.get(row.mainGroup);
      let retailMrp = Number.isFinite(row.mrp) ? row.mrp : null;
      let mrpFillRule = 'source';
      if (!Number.isFinite(retailMrp)) {
        if (Number.isFinite(subgroupMedian)) {
          retailMrp = subgroupMedian;
          mrpFillRule = 'subgroup-median';
        } else if (Number.isFinite(categoryMedian)) {
          retailMrp = categoryMedian;
          mrpFillRule = 'category-median';
        } else {
          retailMrp = 999;
          mrpFillRule = 'hard-fallback-999';
        }
      }

      const productType = aftermarketRows.has(row.sourceRow) ? 'AFTERMARKET' : 'OEM';
      const productCode = `PRO-${String(nextCode).padStart(6, '0')}`;
      nextCode += 1;

      const baseSku = normalizeText(row.hlaapNo) || normalizeText(row.oeNo) || productCode;
      let sku = baseSku;
      let skuSuffix = 1;
      while (usedSku.has(upper(sku))) {
        skuSuffix += 1;
        sku = `${baseSku}-${skuSuffix}`;
      }
      usedSku.add(upper(sku));

      const normalizedName = normalizeName(row);
      const importRow = {
        productCode,
        name: normalizedName,
        categoryCode: mappedCategory.categoryCode,
        productType,
        manufacturerBrand: productType === 'AFTERMARKET' ? row.brand : '',
        vehicleBrand: row.brand,
        oemNumber: row.oeNo,
        sku,
        shortDescription: row.hlaapDescription || normalizedName,
        retail_mrp: Math.max(1, Math.round(retailMrp)),
        status: 'active',
      };

      importRows.push(importRow);
      reportRows.push({
        sourceRow: row.sourceRow,
        mainGroup: row.mainGroup,
        subProductGroup2: subgroup,
        brand: row.brand,
        applicationModel: row.applicationModel,
        hlaapNo: row.hlaapNo,
        oeNo: row.oeNo,
        assignedType: productType,
        categoryCode: mappedCategory.categoryCode,
        productCode,
        name: normalizedName,
        mrpOriginal: row.mrp ?? '',
        mrpFinal: importRow.retail_mrp,
        mrpFillRule,
        sku,
      });
    }

    const mappingRows = Array.from(mapping.values())
      .sort((a, b) => `${a.mainGroup}${a.subGroup2}`.localeCompare(`${b.mainGroup}${b.subGroup2}`))
      .map((entry) => ({
        mainGroup: entry.mainGroup,
        parentCode: entry.parentCode,
        parentName: entry.parentName,
        subGroup2: entry.subGroup2,
        categoryCode: entry.categoryCode,
      }));

    await writeImportWorkbook(importRows, importOutput);
    await writeReportWorkbook(reportRows, mappingRows, reportOutput, {
      seed,
      totalSelected: importRows.length,
      suspensionSelected: reportRows.filter((row) => row.mainGroup === 'SUSPENSION SYSTEM').length,
      steeringSelected: reportRows.filter((row) => row.mainGroup === 'STEERING SYSTEM').length,
      oemCount: reportRows.filter((row) => row.assignedType === 'OEM').length,
      aftermarketCount: reportRows.filter((row) => row.assignedType === 'AFTERMARKET').length,
      sourceInputFile: input,
      importOutputFile: importOutput,
      reportOutputFile: reportOutput,
    });

    console.log(`Prepared ${importRows.length} products`);
    console.log(`Import file: ${importOutput}`);
    console.log(`Mapping report: ${reportOutput}`);
  } finally {
    await mongoose.disconnect();
  }
};

main().catch((err) => {
  console.error('prepare-products-from-website-data failed:', err?.stack || err?.message || err);
  process.exit(1);
});
