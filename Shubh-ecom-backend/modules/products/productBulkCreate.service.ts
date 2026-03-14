// @ts-nocheck
const ExcelJS = require('exceljs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const slugify = require('slugify');
const { error } = require('../../utils/apiResponse');
const { redis, redisEnabled } = require('../../config/redis');
const { productBulkCreateQueue } = require('../../queues/productBulkCreate.queue');
const Product = require('../../models/Product.model');
const ProductImage = require('../../models/ProductImage.model');
const ProductCompatibility = require('../../models/ProductCompatibility.model');
const Category = require('../../models/Category.model');
const Vehicle = require('../vehicle-management/models/Vehicle.model');
const sanitize = require('../../utils/sanitizeHtml');
const { deletePatterns } = require('../../lib/cache/invalidate');

const UPLOAD_TTL_SECONDS = 60 * 60; // 1 hour
const localUploads = new Map();
const localJobs = new Map();
type ParsedBulkCreateRow = {
  rowNumber: number;
  productCode: string;
  name: string;
  categoryCode: string;
  categoryId: string;
  productType: string;
  manufacturerBrand: string;
  vehicleBrand: string;
  oemNumber: string;
  sku: string;
  hsnCode: string;
  shortDescription: string;
  longDescription: string;
  taxClassKey: string;
  taxRate: number;
  stockQty: number;
  weight: number;
  length: number;
  width: number;
  height: number;
  minOrderQty: number;
  minWholesaleQty: number;
  retailMrp: number;
  retailSalePrice: number;
  wholesaleMrp: number;
  wholesaleSalePrice: number;
  status: string;
  vehicleCodes: string[];
  featuredImageUrl: string;
  galleryImageUrls: string[];
  _errors?: string[];
};

type InvalidBulkCreateRow = {
  row: number;
  productCode: string | null;
  name: string | null;
  reason: string;
};

const VALID_HEADERS: Record<string, string> = {
  productcode: 'productCode',
  product_code: 'productCode',
  name: 'name',
  categorycode: 'categoryCode',
  category_code: 'categoryCode',
  categoryid: 'categoryId',
  category_id: 'categoryId',
  producttype: 'productType',
  manufacturerbrand: 'manufacturerBrand',
  vehiclebrand: 'vehicleBrand',
  oemnumber: 'oemNumber',
  sku: 'sku',
  hsncode: 'hsnCode',
  shortdescription: 'shortDescription',
  longdescription: 'longDescription',
  taxclasskey: 'taxClassKey',
  taxrate: 'taxRate',
  stockqty: 'stockQty',
  weight: 'weight',
  length: 'length',
  width: 'width',
  height: 'height',
  minorderqty: 'minOrderQty',
  minwholesaleqty: 'minWholesaleQty',
  retail_mrp: 'retailMrp',
  retail_mrp_price: 'retailMrp',
  retail_sale_price: 'retailSalePrice',
  wholesale_mrp: 'wholesaleMrp',
  wholesale_sale_price: 'wholesaleSalePrice',
  status: 'status',
  vehiclecodes: 'vehicleCodes',
  vehicle_codes: 'vehicleCodes',
  featured_image_url: 'featuredImageUrl',
  gallery_image_url_1: 'galleryImageUrl1',
  gallery_image_url_2: 'galleryImageUrl2',
  gallery_image_url_3: 'galleryImageUrl3',
  gallery_image_url_4: 'galleryImageUrl4',
  gallery_image_url_5: 'galleryImageUrl5',
};

const REQUIRED_HEADERS = [
  'productCode',
  'name',
  'categoryCode',
  'productType',
  'retailMrp',
];
const PRODUCT_CODE_REGEX = /^PRO-\d{6}$/;
const VEHICLE_CODE_REGEX = /^VEH-\d{6}$/;
const CATEGORY_CODE_REGEX = /^(CAT|CATS)-\d{6}$/;

const normalizeHeader = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\*/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

const toCellString = (value) => {
  if (value == null) return '';
  if (typeof value === 'object') {
    if (value.text) return String(value.text).trim();
    if (value.result) return String(value.result).trim();
  }
  return String(value).trim();
};

const toNumber = (value) => {
  if (value == null || value === '') return NaN;
  if (typeof value === 'number') return value;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : NaN;
};

const parseVehicleCodes = (value) => {
  if (!value) return [];
  return String(value)
    .split(/[,;|]+/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
};

const isValidUrl = (value) => {
  if (!value) return true;
  try {
    const parsed = new URL(String(value));
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch (_err) {
    return false;
  }
};

const getRowCellValue = (row, columnNumber) => {
  if (!row || !columnNumber) return undefined;
  return row.getCell(columnNumber)?.value;
};

const parseSheetRows = (sheet) => {
  const headerRow = sheet.getRow(1);
  const headerMap: Record<string, number> = {};
  headerRow.eachCell((cell, colNumber) => {
    const normalized = normalizeHeader(cell.value);
    const key = VALID_HEADERS[normalized];
    if (key) headerMap[key] = colNumber;
  });

  REQUIRED_HEADERS.forEach((header) => {
    if (!headerMap[header]) {
      error(`CSV must include ${header} column`, 400);
    }
  });

  const rows: ParsedBulkCreateRow[] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    if (!row || row.cellCount === 0) continue;

    const productCode = toCellString(getRowCellValue(row, headerMap.productCode));
    const name = toCellString(getRowCellValue(row, headerMap.name));
    const categoryCode = toCellString(getRowCellValue(row, headerMap.categoryCode));
    const categoryId = toCellString(getRowCellValue(row, headerMap.categoryId));
    const productType = toCellString(getRowCellValue(row, headerMap.productType)).toUpperCase();
    const manufacturerBrand = toCellString(getRowCellValue(row, headerMap.manufacturerBrand));
    const vehicleBrand = toCellString(getRowCellValue(row, headerMap.vehicleBrand));
    const oemNumber = toCellString(getRowCellValue(row, headerMap.oemNumber));
    const sku = toCellString(getRowCellValue(row, headerMap.sku));
    const hsnCode = toCellString(getRowCellValue(row, headerMap.hsnCode));
    const shortDescription = toCellString(getRowCellValue(row, headerMap.shortDescription));
    const longDescription = toCellString(getRowCellValue(row, headerMap.longDescription));
    const taxClassKey = toCellString(getRowCellValue(row, headerMap.taxClassKey));
    const taxRate = toNumber(getRowCellValue(row, headerMap.taxRate));
    const stockQty = toNumber(getRowCellValue(row, headerMap.stockQty));
    const weight = toNumber(getRowCellValue(row, headerMap.weight));
    const length = toNumber(getRowCellValue(row, headerMap.length));
    const width = toNumber(getRowCellValue(row, headerMap.width));
    const height = toNumber(getRowCellValue(row, headerMap.height));
    const minOrderQty = toNumber(getRowCellValue(row, headerMap.minOrderQty));
    const minWholesaleQty = toNumber(getRowCellValue(row, headerMap.minWholesaleQty));
    const retailMrp = toNumber(getRowCellValue(row, headerMap.retailMrp));
    const retailSalePrice = toNumber(getRowCellValue(row, headerMap.retailSalePrice));
    const wholesaleMrp = toNumber(getRowCellValue(row, headerMap.wholesaleMrp));
    const wholesaleSalePrice = toNumber(getRowCellValue(row, headerMap.wholesaleSalePrice));
    const status = toCellString(getRowCellValue(row, headerMap.status));
    const vehicleCodes = parseVehicleCodes(getRowCellValue(row, headerMap.vehicleCodes));

    const featuredImageUrl = toCellString(getRowCellValue(row, headerMap.featuredImageUrl));
    const galleryImageUrl1 = toCellString(getRowCellValue(row, headerMap.galleryImageUrl1));
    const galleryImageUrl2 = toCellString(getRowCellValue(row, headerMap.galleryImageUrl2));
    const galleryImageUrl3 = toCellString(getRowCellValue(row, headerMap.galleryImageUrl3));
    const galleryImageUrl4 = toCellString(getRowCellValue(row, headerMap.galleryImageUrl4));
    const galleryImageUrl5 = toCellString(getRowCellValue(row, headerMap.galleryImageUrl5));

    rows.push({
      rowNumber,
      productCode: productCode || '',
      name: name || '',
      categoryCode: categoryCode || '',
      categoryId: categoryId || '',
      productType: productType || '',
      manufacturerBrand: manufacturerBrand || '',
      vehicleBrand: vehicleBrand || '',
      oemNumber: oemNumber || '',
      sku: sku || '',
      hsnCode: hsnCode || '',
      shortDescription: shortDescription || '',
      longDescription: longDescription || '',
      taxClassKey: taxClassKey || '',
      taxRate,
      stockQty,
      weight,
      length,
      width,
      height,
      minOrderQty,
      minWholesaleQty,
      retailMrp,
      retailSalePrice,
      wholesaleMrp,
      wholesaleSalePrice,
      status: status || '',
      vehicleCodes,
      featuredImageUrl: featuredImageUrl || '',
      galleryImageUrls: [
        galleryImageUrl1,
        galleryImageUrl2,
        galleryImageUrl3,
        galleryImageUrl4,
        galleryImageUrl5,
      ].filter(Boolean),
    });
  }

  return rows;
};

const validateRow = (row: ParsedBulkCreateRow) => {
  const errors: string[] = [];
  if (!row.productCode) errors.push('Missing productCode');
  if (row.productCode && !PRODUCT_CODE_REGEX.test(String(row.productCode).toUpperCase())) {
    errors.push('Invalid productCode format');
  }
  if (!row.name) errors.push('Missing product name');
  if (!row.categoryCode) errors.push('Missing categoryCode');
  if (row.categoryCode && !CATEGORY_CODE_REGEX.test(String(row.categoryCode).toUpperCase())) {
    errors.push('Invalid categoryCode format');
  }
  if (!row.productType) errors.push('Missing productType');

  if (row.productType && !['OEM', 'AFTERMARKET'].includes(row.productType)) {
    errors.push('Invalid productType');
  }

  if (row.productType === 'OEM') {
    if (!row.vehicleBrand) errors.push('Vehicle brand is required for OEM products');
    if (!row.oemNumber) errors.push('OEM number is required for OEM products');
  }

  if (row.productType === 'AFTERMARKET') {
    if (!row.manufacturerBrand) errors.push('Manufacturer brand is required for Aftermarket products');
  }

  if (!Number.isFinite(row.retailMrp)) {
    errors.push('Invalid retail_mrp');
  } else if (row.retailMrp < 0) {
    errors.push('retail_mrp must be >= 0');
  }

  if (Number.isFinite(row.retailSalePrice) && row.retailSalePrice < 0) {
    errors.push('retail_sale_price must be >= 0');
  }

  if (Number.isFinite(row.wholesaleMrp) && row.wholesaleMrp < 0) {
    errors.push('wholesale_mrp must be >= 0');
  }

  if (Number.isFinite(row.wholesaleSalePrice) && row.wholesaleSalePrice < 0) {
    errors.push('wholesale_sale_price must be >= 0');
  }

  const minOrder = Number.isFinite(row.minOrderQty) ? row.minOrderQty : null;
  if (minOrder !== null && minOrder < 1) errors.push('minOrderQty must be >= 1');

  const minWholesale = Number.isFinite(row.minWholesaleQty) ? row.minWholesaleQty : null;
  if (minWholesale !== null && minWholesale < 1) errors.push('minWholesaleQty must be >= 1');

  const stock = Number.isFinite(row.stockQty) ? row.stockQty : null;
  if (stock !== null && stock < 0) errors.push('stockQty must be >= 0');

  const taxRate = Number.isFinite(row.taxRate) ? row.taxRate : null;
  if (taxRate !== null && taxRate < 0) errors.push('taxRate must be >= 0');

  ['weight', 'length', 'width', 'height'].forEach((field) => {
    const value = row[field];
    if (Number.isFinite(value) && value < 0) {
      errors.push(`${field} must be >= 0`);
    }
  });

  const status = row.status ? row.status.toLowerCase() : '';
  if (status && !['draft', 'active', 'inactive', 'blocked'].includes(status)) {
    errors.push('Invalid status');
  }

  if (row.categoryId && !mongoose.Types.ObjectId.isValid(row.categoryId)) {
    errors.push('Invalid categoryId');
  }

  if (row.featuredImageUrl && !isValidUrl(row.featuredImageUrl)) {
    errors.push('Invalid featured image URL');
  }

  row.galleryImageUrls.forEach((url) => {
    if (!isValidUrl(url)) errors.push(`Invalid gallery image URL: ${url}`);
  });

  row.vehicleCodes.forEach((code) => {
    const normalized = String(code).toUpperCase();
    if (!VEHICLE_CODE_REGEX.test(normalized)) {
      errors.push(`Invalid vehicleCode format: ${code}`);
    }
  });

  return errors;
};

const parseUpload = async (file) => {
  if (!file) error('File is required', 400);

  const workbook = new ExcelJS.Workbook();
  const ext = (file.originalname || '').toLowerCase();

  if (ext.endsWith('.csv')) {
    await workbook.csv.read(Readable.from(file.buffer.toString('utf8')));
  } else if (ext.endsWith('.xlsx')) {
    await workbook.xlsx.load(file.buffer);
  } else {
    error('Only CSV or XLSX files are allowed', 400);
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) error('No worksheet found', 400);

  return parseSheetRows(sheet);
};

const storeUpload = async (uploadId, payload) => {
  if (!redisEnabled) {
    localUploads.set(uploadId, {
      payload,
      expiresAt: Date.now() + UPLOAD_TTL_SECONDS * 1000,
    });
    return `local:${uploadId}`;
  }

  const key = `bulk-create:upload:${uploadId}`;
  await redis.setEx(key, UPLOAD_TTL_SECONDS, JSON.stringify(payload));
  return key;
};

const loadUpload = async (uploadId) => {
  if (!redisEnabled) {
    const item = localUploads.get(uploadId);
    if (!item) return null;
    if (item.expiresAt <= Date.now()) {
      localUploads.delete(uploadId);
      return null;
    }
    return { key: `local:${uploadId}`, payload: item.payload };
  }

  const key = `bulk-create:upload:${uploadId}`;
  const raw = await redis.get(key);
  if (!raw) return null;
  return { key, payload: JSON.parse(raw) };
};

const toNumberOrNull = (value) => (Number.isFinite(value) ? Number(value) : null);

const normalizeSlug = (name, fallback) => {
  const base = slugify(name || fallback || '', { lower: true, strict: true, trim: true });
  if (base) return base;
  return slugify(fallback || 'product', { lower: true, strict: true, trim: true });
};

const buildUniqueSlug = (name, productCode, usedSlugs, existingSlugs) => {
  const base = normalizeSlug(name, productCode || 'product');
  let next = base || productCode || `product-${Math.random().toString(36).slice(2, 8)}`;
  if (existingSlugs.has(next) || usedSlugs.has(next)) {
    next = `${base || 'product'}-${String(productCode || '').toLowerCase()}`;
  }
  let counter = 1;
  while (existingSlugs.has(next) || usedSlugs.has(next)) {
    next = `${base || 'product'}-${String(productCode || '').toLowerCase()}-${counter}`;
    counter += 1;
  }
  usedSlugs.add(next);
  return next;
};

const buildProductDocs = (rows, existingSlugs) => {
  const usedSlugs = new Set();
  return rows.map((row) => {
    const retailPrice = { mrp: Number(row.retailMrp) };
    if (Number.isFinite(row.retailSalePrice)) retailPrice.salePrice = Number(row.retailSalePrice);

    let wholesalePrice = undefined;
    if (Number.isFinite(row.wholesaleMrp)) {
      wholesalePrice = { mrp: Number(row.wholesaleMrp) };
      if (Number.isFinite(row.wholesaleSalePrice)) {
        wholesalePrice.salePrice = Number(row.wholesaleSalePrice);
      }
    }

    const status =
      row.status && ['draft', 'active', 'inactive', 'blocked'].includes(row.status)
        ? row.status
        : 'draft';

    return {
      productId: row.productCode,
      name: row.name,
      slug: buildUniqueSlug(row.name, row.productCode, usedSlugs, existingSlugs),
      categoryId: row.categoryId,
      productType: row.productType,
      manufacturerBrand: row.productType === 'AFTERMARKET' ? row.manufacturerBrand : null,
      vehicleBrand: row.productType === 'OEM' ? row.vehicleBrand : null,
      oemNumber: row.productType === 'OEM' ? row.oemNumber : null,
      sku: row.sku || undefined,
      hsnCode: row.hsnCode || undefined,
      shortDescription: row.shortDescription ? sanitize(row.shortDescription) : undefined,
      longDescription: row.longDescription ? sanitize(row.longDescription) : undefined,
      taxClassKey: row.taxClassKey || undefined,
      taxRate: toNumberOrNull(row.taxRate) ?? undefined,
      stockQty: Number.isFinite(row.stockQty) ? Number(row.stockQty) : 0,
      weight: toNumberOrNull(row.weight) ?? undefined,
      length: toNumberOrNull(row.length) ?? undefined,
      width: toNumberOrNull(row.width) ?? undefined,
      height: toNumberOrNull(row.height) ?? undefined,
      minOrderQty: Number.isFinite(row.minOrderQty) ? Number(row.minOrderQty) : 1,
      minWholesaleQty: toNumberOrNull(row.minWholesaleQty) ?? undefined,
      retailPrice,
      wholesalePrice,
      status,
      listingFeeStatus: 'waived',
    };
  });
};

const extractImageDocs = (productRow, productId, productName) => {
  const featured = productRow.featuredImageUrl || '';
  const gallery = Array.isArray(productRow.galleryImageUrls)
    ? productRow.galleryImageUrls.filter(Boolean)
    : [];
  const images = [];

  if (featured) {
    images.push({
      productId,
      url: featured,
      altText: productName || 'Product',
      isPrimary: true,
      sortOrder: 0,
    });
  }

  gallery.forEach((url, index) => {
    if (!url) return;
    images.push({
      productId,
      url,
      altText: productName || 'Product',
      isPrimary: !featured && index === 0,
      sortOrder: featured ? index + 1 : index,
    });
  });

  return images;
};

const resolveVehicleMap = async (rows) => {
  const vehicleCodes = new Set();
  rows.forEach((row) => {
    (row.vehicleCodes || []).forEach((code) => vehicleCodes.add(String(code).toUpperCase()));
  });
  if (!vehicleCodes.size) return new Map();

  const vehicles = await Vehicle.find({ vehicleCode: { $in: Array.from(vehicleCodes) } })
    .select('_id vehicleCode')
    .lean();
  return new Map(vehicles.map((item) => [String(item.vehicleCode).toUpperCase(), item._id]));
};

const processRowsInline = async (rows) => {
  const productCodes = rows.map((row) => String(row.productCode).toUpperCase());
  const existingProducts = await Product.find({ productId: { $in: productCodes } })
    .select('productId')
    .lean();
  const existingSet = new Set(existingProducts.map((item) => String(item.productId).toUpperCase()));

  const toInsertRows = rows.filter((row) => !existingSet.has(String(row.productCode).toUpperCase()));
  const skipped = rows.length - toInsertRows.length;
  let failed = skipped;
  let success = 0;

  if (toInsertRows.length) {
    const slugsToCheck = toInsertRows.map((row) => normalizeSlug(row.name, row.productCode));
    const existingSlugs = await Product.find({ slug: { $in: slugsToCheck } })
      .select('slug')
      .lean();
    const existingSlugSet = new Set(existingSlugs.map((item) => item.slug));
    const docs = buildProductDocs(toInsertRows, existingSlugSet);

    try {
      await Product.bulkWrite(docs.map((doc) => ({ insertOne: { document: doc } })), {
        ordered: false,
      });
    } catch (_err) {
      // continue with post-insert lookup
    }

    const insertedProducts = await Product.find({
      productId: { $in: toInsertRows.map((row) => row.productCode) },
    })
      .select('_id productId name')
      .lean();
    const insertedMap = new Map(insertedProducts.map((item) => [String(item.productId).toUpperCase(), item]));
    const vehicleMap = await resolveVehicleMap(toInsertRows);
    const imageDocs = [];
    const compatOps = [];

    toInsertRows.forEach((row) => {
      const inserted = insertedMap.get(String(row.productCode).toUpperCase());
      if (!inserted) {
        failed += 1;
        return;
      }
      success += 1;
      imageDocs.push(...extractImageDocs(row, inserted._id, inserted.name));
      if (row.vehicleCodes && row.vehicleCodes.length) {
        const vehicleIds = row.vehicleCodes
          .map((code) => vehicleMap.get(String(code).toUpperCase()))
          .filter(Boolean);
        if (vehicleIds.length) {
          compatOps.push({
            updateOne: {
              filter: { productId: inserted._id },
              update: { $set: { vehicleIds } },
              upsert: true,
            },
          });
        }
      }
    });

    if (imageDocs.length) {
      try {
        await ProductImage.insertMany(imageDocs, { ordered: false });
      } catch (_err) {
        // ignore partial duplicates
      }
    }
    if (compatOps.length) {
      try {
        await ProductCompatibility.bulkWrite(compatOps, { ordered: false });
      } catch (_err) {
        // ignore partial duplicates
      }
    }
  }

  await deletePatterns(['catalog:products:*']).catch(() => null);
  return { total: rows.length, processed: rows.length, success, failed, skipped };
};

class ProductBulkCreateService {
  async preview(file, actor) {
    const rows = await parseUpload(file);
    const invalidRows: InvalidBulkCreateRow[] = [];
    const validRows: ParsedBulkCreateRow[] = [];

    const rowMap: Array<ParsedBulkCreateRow & { _errors: string[] }> = rows.map(
      (row) => ({
        ...row,
        productCode: row.productCode.trim().toUpperCase(),
        categoryCode: row.categoryCode.trim().toUpperCase(),
        vehicleCodes: row.vehicleCodes.map((code) => code.toUpperCase()),
        _errors: [] as string[],
      }),
    );

    rowMap.forEach((row) => {
      const rowErrors = validateRow(row);
      if (rowErrors.length) {
        row._errors.push(...rowErrors);
      }
    });

    const codeCounts = new Map();
    rowMap.forEach((row) => {
      const code = row.productCode.trim().toUpperCase();
      if (!code) return;
      codeCounts.set(code, (codeCounts.get(code) || 0) + 1);
    });

    rowMap.forEach((row) => {
      const code = row.productCode.trim().toUpperCase();
      if (code && codeCounts.get(code) > 1) {
        row._errors.push('Duplicate productCode in sheet');
      }
    });

    const validCodes = rowMap
      .filter((row) => row._errors.length === 0)
      .map((row) => row.productCode.trim().toUpperCase());

    if (validCodes.length) {
      const existing = await Product.find({ productId: { $in: validCodes } })
        .select('productId')
        .lean();
      const existingCodes = new Set(existing.map((item) => String(item.productId).toUpperCase()));
      rowMap.forEach((row) => {
        const code = row.productCode.trim().toUpperCase();
        if (existingCodes.has(code)) {
          row._errors.push('productCode already exists');
        }
      });
    }

    const categoryCodes = Array.from(new Set(
      rowMap
        .filter((row) => row._errors.length === 0)
        .map((row) => row.categoryCode),
    ));

    if (categoryCodes.length) {
      const categories = await Category.find({ categoryCode: { $in: categoryCodes } })
        .select('_id categoryCode')
        .lean();
      const categoryMap = new Map<string, string>(
        categories.map((item) => [String(item.categoryCode).toUpperCase(), String(item._id)]),
      );
      rowMap.forEach((row) => {
        if (row._errors.length) return;
        const id = categoryMap.get(row.categoryCode);
        if (!id) {
          row._errors.push('categoryCode not found');
        } else {
          row.categoryId = id;
        }
      });
    }

    const vehicleCodes = Array.from(new Set(
      rowMap
        .filter((row) => row._errors.length === 0)
        .flatMap((row) => row.vehicleCodes),
    ));

    if (vehicleCodes.length) {
      const vehicles = await Vehicle.find({ vehicleCode: { $in: vehicleCodes } })
        .select('vehicleCode')
        .lean();
      const vehicleSet = new Set(vehicles.map((item) => String(item.vehicleCode).toUpperCase()));

      rowMap.forEach((row) => {
        if (row._errors.length) return;
        const missing = row.vehicleCodes.filter((code) => !vehicleSet.has(code));
        if (missing.length) {
          row._errors.push(`Unknown vehicleCodes: ${missing.join(', ')}`);
        }
      });
    }

    rowMap.forEach((row) => {
      if (row._errors.length) {
        invalidRows.push({
          row: row.rowNumber,
          productCode: row.productCode || null,
          name: row.name || null,
          reason: row._errors.join('; '),
        });
      } else {
        validRows.push({
          ...row,
          productType: row.productType.toUpperCase(),
          status: row.status ? row.status.toLowerCase() : '',
        });
      }
    });

    const uploadId = crypto.randomUUID();
    await storeUpload(uploadId, {
      adminId: actor?.id || actor?._id || null,
      fileName: file.originalname,
      createdAt: new Date().toISOString(),
      rows: validRows,
    });

    return {
      uploadId,
      totalRows: rows.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      errors: invalidRows,
    };
  }

  async confirm(uploadId, actor) {
    if (!uploadId) error('uploadId is required', 400);

    const entry = await loadUpload(uploadId);
    if (!entry) error('Upload not found or expired', 404);

// @ts-ignore
    const { payload, key } = entry;
    const total = payload.rows.length;

    if (!redisEnabled) {
      const localJobId = `local-${crypto.randomUUID()}`;
      localJobs.set(localJobId, {
        jobId: localJobId,
        status: 'processing',
        progress: { total, processed: 0, success: 0, failed: 0, skipped: 0 },
        total,
        result: null,
      });
      try {
        const result = await processRowsInline(payload.rows || []);
        localJobs.set(localJobId, {
          jobId: localJobId,
          status: 'completed',
          progress: result,
          total: result.total,
          result,
        });
      } catch (err) {
        localJobs.set(localJobId, {
          jobId: localJobId,
          status: 'failed',
          progress: { total, processed: total, success: 0, failed: total, skipped: 0 },
          total,
          result: { error: err?.message || 'Bulk create failed' },
        });
      }

      return {
        jobId: localJobId,
        status: 'completed',
        total,
      };
    }

    const job = await productBulkCreateQueue.add(
      'bulk-product-create',
      {
        redisKey: key,
        uploadId,
        adminId: actor?.id || actor?._id || null,
        fileName: payload.fileName,
        total,
      },
      {
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return {
      jobId: job.id,
      status: 'queued',
      total,
    };
  }

  async getJobStatus(jobId) {
    if (!jobId) error('jobId is required', 400);

    if (!redisEnabled) {
      const localJob = localJobs.get(jobId);
      if (!localJob) error('Job not found', 404);
      return localJob;
    }

    const job = await productBulkCreateQueue.getJob(jobId);
    if (!job) error('Job not found', 404);

    const state = await job.getState();
    return {
      jobId: job.id,
      status: state,
      progress: job.progress || {
        total: job.data?.total || 0,
        processed: 0,
        success: 0,
        failed: 0,
        skipped: 0,
      },
      total: job.data?.total || 0,
      result: job.returnvalue || null,
    };
  }
}

module.exports = new ProductBulkCreateService();

