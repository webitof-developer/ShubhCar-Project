// @ts-nocheck
const ExcelJS = require('exceljs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const { error } = require('../../utils/apiResponse');
const { redis, redisEnabled } = require('../../config/redis');
const { productBulkUpdateQueue } = require('../../queues/productBulkUpdate.queue');
const Product = require('../../models/Product.model');

const UPLOAD_TTL_SECONDS = 60 * 60; // 1 hour
const localUploads = new Map();
const localJobs = new Map();
type ProductBulkUpdateRow = {
  rowNumber: number;
  productId: string;
  productCode: string;
  sku: string;
  productName: string;
  retailMrp: number;
  retailSalePrice: number;
  wholesaleMrp: number;
  wholesaleSalePrice: number;
  stock: number;
};

type InvalidBulkUpdateRow = {
  row: number;
  productId: string | null;
  sku: string | null;
  productName: string | null;
  reason: string;
};

const VALID_HEADERS: Record<string, string> = {
  productcode: 'productCode',
  product_code: 'productCode',
  productid: 'productId',
  product_id: 'productId',
  sku: 'sku',
  productname: 'productName',
  product_name: 'productName',
  retail_mrp: 'retailMrp',
  retail_sale_price: 'retailSalePrice',
  wholesale_mrp: 'wholesaleMrp',
  wholesale_sale_price: 'wholesaleSalePrice',
  stock: 'stock',
};

const PRODUCT_CODE_REGEX = /^PRO-\d{6}$/;

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
  if (value == null) return NaN;
  if (typeof value === 'number') return value;
  const parsed = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : NaN;
};

const getRowCellValue = (row, columnNumber) => {
  if (!row || !columnNumber) return undefined;
  return row.getCell(columnNumber)?.value;
};

const resolveRowIdentifier = (row) => {
  if (row.productId && mongoose.Types.ObjectId.isValid(row.productId)) {
    return { type: 'productId', value: String(row.productId) };
  }
  if (row.productCode) {
    return { type: 'productCode', value: String(row.productCode).trim().toUpperCase() };
  }
  if (row.sku) {
    return { type: 'sku', value: String(row.sku) };
  }
  return null;
};

const buildBulkOps = (rows, productIdMap, skuMap, productCodeMap) => {
  const ops = [];
  const skipped = [];

  rows.forEach((row) => {
    const identifier = resolveRowIdentifier(row);
    if (!identifier) {
      skipped.push({ row: row.rowNumber, reason: 'Missing identifier' });
      return;
    }

    let targetId = null;
    if (identifier.type === 'productId') targetId = productIdMap.get(identifier.value) || null;
    else if (identifier.type === 'productCode') targetId = productCodeMap.get(identifier.value) || null;
    else if (identifier.type === 'sku') targetId = skuMap.get(identifier.value) || null;

    if (!targetId) {
      skipped.push({ row: row.rowNumber, reason: 'Product not found' });
      return;
    }

    ops.push({
      updateOne: {
        filter: { _id: targetId },
        update: {
          $set: {
            'retailPrice.mrp': Number(row.retailMrp),
            'retailPrice.salePrice': Number(row.retailSalePrice),
            'wholesalePrice.mrp': Number(row.wholesaleMrp),
            'wholesalePrice.salePrice': Number(row.wholesaleSalePrice),
            stockQty: Number(row.stock),
            updatedAt: new Date(),
          },
        },
      },
    });
  });

  return { ops, skipped };
};

const processRowsInline = async (rows) => {
  const productIds = rows
    .filter((row) => row.productId && mongoose.Types.ObjectId.isValid(row.productId))
    .map((row) => String(row.productId));
  const productCodes = rows
    .filter((row) => !row.productId && row.productCode)
    .map((row) => String(row.productCode).trim().toUpperCase());
  const skus = rows
    .filter((row) => !row.productId && !row.productCode && row.sku)
    .map((row) => String(row.sku));

  const [productsById, productsBySku, productsByCode] = await Promise.all([
    productIds.length ? Product.find({ _id: { $in: productIds } }).select('_id').lean() : [],
    skus.length ? Product.find({ sku: { $in: skus } }).select('_id sku').lean() : [],
    productCodes.length
      ? Product.find({ productId: { $in: productCodes } }).select('_id productId').lean()
      : [],
  ]);

  const productIdMap = new Map(productsById.map((product) => [String(product._id), product._id]));
  const skuMap = new Map(productsBySku.map((product) => [String(product.sku), product._id]));
  const productCodeMap = new Map(
    productsByCode.map((product) => [String(product.productId).toUpperCase(), product._id]),
  );

  const { ops, skipped } = buildBulkOps(rows, productIdMap, skuMap, productCodeMap);
  let success = 0;
  let failed = skipped.length;
  if (ops.length) {
    try {
      await Product.bulkWrite(ops, { ordered: false });
      success = ops.length;
    } catch (_err) {
      failed += ops.length;
    }
  }

  return {
    total: rows.length,
    processed: rows.length,
    success,
    failed,
    skipped: skipped.length,
  };
};

const parseSheetRows = (sheet) => {
  const headerRow = sheet.getRow(1);
  const headerMap: Record<string, number> = {};
  headerRow.eachCell((cell, colNumber) => {
    const normalized = normalizeHeader(cell.value);
    const key = VALID_HEADERS[normalized];
    if (key) headerMap[key] = colNumber;
  });

  if (!headerMap.productId && !headerMap.productCode && !headerMap.sku) {
    error('CSV must include productCode, productId, or sku column', 400);
  }
  if (!headerMap.retailMrp || !headerMap.retailSalePrice || !headerMap.wholesaleMrp || !headerMap.wholesaleSalePrice || !headerMap.stock) {
    error('CSV must include retail_mrp, retail_sale_price, wholesale_mrp, wholesale_sale_price, and stock columns', 400);
  }

  const rows: ProductBulkUpdateRow[] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    if (!row || row.cellCount === 0) continue;

    const productId = toCellString(getRowCellValue(row, headerMap.productId));
    const productCode = toCellString(getRowCellValue(row, headerMap.productCode));
    const sku = toCellString(getRowCellValue(row, headerMap.sku));
    const productName = toCellString(getRowCellValue(row, headerMap.productName));
    const retailMrp = toNumber(getRowCellValue(row, headerMap.retailMrp));
    const retailSalePrice = toNumber(getRowCellValue(row, headerMap.retailSalePrice));
    const wholesaleMrp = toNumber(getRowCellValue(row, headerMap.wholesaleMrp));
    const wholesaleSalePrice = toNumber(getRowCellValue(row, headerMap.wholesaleSalePrice));
    const stock = toNumber(getRowCellValue(row, headerMap.stock));

    rows.push({
      rowNumber,
      productId: productId || '',
      productCode: productCode || '',
      sku: sku || '',
      productName: productName || '',
      retailMrp,
      retailSalePrice,
      wholesaleMrp,
      wholesaleSalePrice,
      stock,
    });
  }

  return rows;
};

const validateRow = (row: ProductBulkUpdateRow) => {
  const errors: string[] = [];
  const hasProductId = Boolean(row.productId);
  const hasProductCode = Boolean(row.productCode);
  const hasSku = Boolean(row.sku);

  if (!hasProductId && !hasProductCode && !hasSku) {
    errors.push('Missing productCode, productId or sku');
  }
  if (hasProductCode && !PRODUCT_CODE_REGEX.test(String(row.productCode).toUpperCase())) {
    errors.push('Invalid productCode format');
  }
  if (hasProductId && !mongoose.Types.ObjectId.isValid(row.productId)) {
    errors.push('Invalid productId');
  }
  if (!Number.isFinite(row.retailMrp)) {
    errors.push('Invalid retail_mrp');
  } else if (row.retailMrp < 0) {
    errors.push('retail_mrp must be >= 0');
  }
  if (!Number.isFinite(row.retailSalePrice)) {
    errors.push('Invalid retail_sale_price');
  } else if (row.retailSalePrice < 0) {
    errors.push('retail_sale_price must be >= 0');
  }
  if (!Number.isFinite(row.wholesaleMrp)) {
    errors.push('Invalid wholesale_mrp');
  } else if (row.wholesaleMrp < 0) {
    errors.push('wholesale_mrp must be >= 0');
  }
  if (!Number.isFinite(row.wholesaleSalePrice)) {
    errors.push('Invalid wholesale_sale_price');
  } else if (row.wholesaleSalePrice < 0) {
    errors.push('wholesale_sale_price must be >= 0');
  }
  if (!Number.isFinite(row.stock)) {
    errors.push('Invalid stock');
  } else if (row.stock < 0) {
    errors.push('Stock must be >= 0');
  }

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
  const key = `bulk-price-stock:upload:${uploadId}`;
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
  const key = `bulk-price-stock:upload:${uploadId}`;
  const raw = await redis.get(key);
  if (!raw) return null;
  return { key, payload: JSON.parse(raw) };
};

class ProductBulkUpdateService {
  async preview(file, actor) {
    const rows = await parseUpload(file);
    const invalidRows: InvalidBulkUpdateRow[] = [];
    const validRows: ProductBulkUpdateRow[] = [];

    rows.forEach((row) => {
      const rowErrors = validateRow(row);
      if (rowErrors.length) {
        invalidRows.push({
          row: row.rowNumber,
          productId: row.productId || null,
          sku: row.sku || null,
          productName: row.productName || null,
          reason: rowErrors.join('; '),
        });
      } else {
        validRows.push(row);
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
          result: { error: err?.message || 'Bulk update failed' },
        });
      }
      return { jobId: localJobId, status: 'completed', total };
    }

    const job = await productBulkUpdateQueue.add(
      'bulk-price-stock-update',
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

    const job = await productBulkUpdateQueue.getJob(jobId);
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

module.exports = new ProductBulkUpdateService();

