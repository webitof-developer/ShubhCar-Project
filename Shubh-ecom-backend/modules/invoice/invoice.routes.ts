import type { InvoiceRequestShape } from './invoice.types';
const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const router = express.Router();
const Invoice = require('../../models/InvoiceSchema');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const validateId = require('../../middlewares/objectId.middleware');
const { adminLimiter } = require('../../middlewares/rateLimiter.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ROLES = require('../../constants/roles');
const PDFDocument = require('pdfkit');
const logger = require('../../config/logger');
const invoiceService = require('./invoice.service');
const settingsService = require('../settings/settings.service');
const Order = require('../../models/Order.model');
const { listInvoicesQuerySchema, pdfQuerySchema } = require('./invoice.validator');

const BASE_DIR = path.resolve(__dirname, '../../');
const PAGE_MARGIN = 28;

const getMoney = (value, currency = 'INR') =>
  `${currency} ${Number(value || 0).toFixed(2)}`;

const getDateLabel = (dateValue) => {
  if (!dateValue) return '-';
  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return '-';
  return parsedDate.toLocaleDateString('en-IN');
};

const getSafeAssetPath = (assetUrl = '') => {
  const clean = String(assetUrl || '')
    .trim()
    .split('?')[0]
    .split('#')[0];

  if (!clean) return null;
  if (/^https?:\/\//i.test(clean)) return clean;

  const stripped = clean.replace(/^[\\/]+/, '');
  const resolved = path.resolve(BASE_DIR, stripped);
  if (!resolved.startsWith(BASE_DIR)) return null;
  return resolved;
};

const readAssetBuffer = async (assetUrl = '') => {
  const source = getSafeAssetPath(assetUrl);
  if (!source) return null;

  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  return fs.readFile(source);
};

const drawInvoiceHeader = (doc, invoice, settings, logoBuffer) => {
  const title = invoice.type === 'credit_note' ? 'Credit Note' : 'Tax Invoice';

  doc.fontSize(22).font('Helvetica-Bold').fillColor('#111827').text(title, 44, 46);

  doc.fontSize(10).font('Helvetica').fillColor('#374151');
  doc.text(`Invoice #: ${invoice.invoiceNumber || '-'}`, 44, 78);
  doc.text(`Issue Date: ${getDateLabel(invoice.issuedAt)}`, 44, 92);
  doc.text(`Order #: ${invoice.orderSnapshot?.orderNumber || '-'}`, 44, 106);

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, 442, 44, { fit: [110, 72], align: 'right' });
    } catch (err) {
      logger.warn('Invoice logo rendering failed', { error: err.message });
    }
  }

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827').text(settings.invoice_company_name || '-', 44, 136);

// @ts-ignore
  const companyAddress: any[] = [
    settings.invoice_company_address_line1,
    settings.invoice_company_address_line2,
    [settings.invoice_company_city, settings.invoice_company_state, settings.invoice_company_pincode]
      .filter(Boolean)
      .join(' - '),
  ]
    .filter(Boolean)
    .join(', ');

  doc.fontSize(10).font('Helvetica').fillColor('#374151');
  doc.text(companyAddress || '-', 44, 154, { width: 360 });
  doc.text(`GSTIN: ${settings.invoice_company_gstin || '-'}`, 44, 168);
  doc.text(`Email: ${settings.invoice_company_email || '-'}`, 44, 182);
  doc.text(`Phone: ${settings.invoice_company_phone || '-'}`, 44, 196);
};

const drawBillingSection = (doc, invoice) => {
  doc
    .rect(44, 222, 508, 90)
    .fillOpacity(0.95)
    .fill('#f8fafc')
    .fillOpacity(1)
    .strokeColor('#e5e7eb')
    .stroke();

  doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827').text('Bill To', 56, 234);
  doc.fontSize(10).font('Helvetica').fillColor('#374151');
  doc.text(invoice.customerSnapshot?.name || '-', 56, 250);
  doc.text(invoice.customerSnapshot?.email || '-', 56, 264);
  doc.text(invoice.customerSnapshot?.phone || '-', 56, 278);

  const address = invoice.customerSnapshot?.address || {};
// @ts-ignore
  const addressText: any[] = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');

  doc.text(addressText || '-', 260, 250, { width: 280 });
};

const drawItemsHeader = (doc, y) => {
  doc
    .rect(44, y, 508, 24)
    .fill('#1f2937')
    .fillColor('#ffffff')
    .fontSize(9)
    .font('Helvetica-Bold');

  doc.text('Item', 52, y + 8, { width: 220 });
  doc.text('Qty', 286, y + 8, { width: 40, align: 'center' });
  doc.text('Unit', 336, y + 8, { width: 80, align: 'right' });
  doc.text('Tax %', 424, y + 8, { width: 45, align: 'right' });
  doc.text('Total', 474, y + 8, { width: 70, align: 'right' });
};

const drawItemRow = (doc, item, index, y, currency) => {
  const rowHeight = 22;
  const rowFill = index % 2 === 0 ? '#ffffff' : '#f9fafb';

  doc.rect(44, y, 508, rowHeight).fill(rowFill);
  doc.fillColor('#111827').fontSize(9).font('Helvetica');

  doc.text(item.name || 'Item', 52, y + 7, { width: 220, ellipsis: true });
  doc.text(String(item.quantity || 0), 286, y + 7, { width: 40, align: 'center' });
  doc.text(getMoney(item.unitPrice, currency), 336, y + 7, { width: 80, align: 'right' });
  doc.text(`${item.taxPercent || 0}`, 424, y + 7, { width: 45, align: 'right' });
  doc.text(getMoney(item.lineTotal, currency), 474, y + 7, { width: 70, align: 'right' });
};

const drawTotals = (doc, invoice, y) => {
  const totalsX = 352;
  const totalsWidth = 200;
  const currency = invoice.totals?.currency || 'INR';

  doc
    .rect(totalsX, y, totalsWidth, 96)
    .fill('#f8fafc')
    .strokeColor('#d1d5db')
    .stroke();

  doc.fontSize(10).font('Helvetica').fillColor('#111827');

  doc.text('Subtotal', totalsX + 10, y + 12, { width: 90 });
  doc.text(getMoney(invoice.totals?.subtotal, currency), totalsX + 100, y + 12, {
    width: 90,
    align: 'right',
  });

  doc.text('Tax', totalsX + 10, y + 30, { width: 90 });
  doc.text(getMoney(invoice.totals?.taxTotal, currency), totalsX + 100, y + 30, {
    width: 90,
    align: 'right',
  });

  doc.text('Discount', totalsX + 10, y + 48, { width: 90 });
  doc.text(getMoney(invoice.totals?.discountTotal, currency), totalsX + 100, y + 48, {
    width: 90,
    align: 'right',
  });

  doc.font('Helvetica-Bold');
  doc.text('Grand Total', totalsX + 10, y + 70, { width: 90 });
  doc.text(getMoney(invoice.totals?.grandTotal, currency), totalsX + 100, y + 70, {
    width: 90,
    align: 'right',
  });
};

const drawFooter = (doc, settings) => {
  const footerY = doc.page.height - 72;
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#4b5563')
    .text(settings.invoice_terms || '', 44, footerY, { width: 508, align: 'left' });
  doc
    .fontSize(9)
    .font('Helvetica-Oblique')
    .fillColor('#6b7280')
    .text(settings.invoice_notes || '', 44, footerY + 18, { width: 508, align: 'left' });
};

const streamInvoicePdf = async (invoice, res, { download = false }: any = {}) => {
  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4' });
  const filePrefix = invoice.type === 'credit_note' ? 'credit-note' : 'invoice';
  const filename = `${filePrefix}-${invoice.invoiceNumber || invoice._id}.pdf`;

  const settings = await settingsService.getInvoiceSettings().catch(() => ({}));
  const [templateBuffer, logoBuffer] = await Promise.all([
    readAssetBuffer(settings.invoice_template_image_url).catch(() => null),
    readAssetBuffer(settings.invoice_logo_url).catch(() => null),
  ]);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
  );

  doc.pipe(res);
  if (templateBuffer) {
    try {
      doc.image(templateBuffer, 0, 0, {
        width: doc.page.width,
        height: doc.page.height,
      });
    } catch (err) {
      logger.warn('Invoice template image rendering failed', { error: err.message });
    }
  }

  doc
    .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
    .fillOpacity(templateBuffer ? 0.92 : 1)
    .fill('#ffffff')
    .fillOpacity(1)
    .strokeColor('#e5e7eb')
    .stroke();

  drawInvoiceHeader(doc, invoice, settings, logoBuffer);
  drawBillingSection(doc, invoice);

  const currency = invoice.totals?.currency || 'INR';
  const items = Array.isArray(invoice.items) ? invoice.items : [] as any[];
  let tableY = 330;

  drawItemsHeader(doc, tableY);
  tableY += 24;

  const maxRowsOnPage = 15;
  items.slice(0, maxRowsOnPage).forEach((item, index) => {
    drawItemRow(doc, item, index, tableY, currency);
    tableY += 22;
  });

  if (items.length > maxRowsOnPage) {
    doc
      .font('Helvetica-Oblique')
      .fontSize(9)
      .fillColor('#6b7280')
      .text(
        `+${items.length - maxRowsOnPage} more items omitted in PDF preview`,
        44,
        tableY + 8,
      );
  }

  drawTotals(doc, invoice, 640);
  drawFooter(doc, settings);

  doc.end();
};

/**
 * @openapi
 * /api/v1/invoices:
 *   get:
 *     summary: List invoices (Admin)
 *     tags: [Invoices]
 *     security: [ { bearerAuth: [] as any[] } ]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invoices with pagination
 */
router.get(
  '/',
  adminLimiter,
  auth([ROLES.ADMIN]),
  validate(listInvoicesQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, type } = req.query;

    const query: any = {};
    if (type) query.type = type;

    const invoices = await Invoice.find(query)
      .sort({ issuedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await Invoice.countDocuments(query);

    return res.ok({
      invoices,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  }),
);

/**
 * @openapi
 * /api/v1/invoices/{id}:
 *   get:
 *     summary: Get invoice by id (Admin)
 *     tags: [Invoices]
 *     security: [ { bearerAuth: [] as any[] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Invoice }
 */
router.get(
  '/:id',
  adminLimiter,
  auth([ROLES.ADMIN]),
  validateId('id'),
  asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id).lean();

    if (!invoice) {
      return res.fail('Invoice not found', 404);
    }

    return res.ok({ invoice });
  }),
);

/**
 * @openapi
 * /api/v1/invoices/{id}/pdf:
 *   get:
 *     summary: Get invoice PDF (Admin)
 *     tags: [Invoices]
 *     security: [ { bearerAuth: [] as any[] } ]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: download
 *         schema: { type: string, enum: [ "true", "false" ] }
 *     responses:
 *       200:
 *         description: PDF stream
 */
router.get(
  '/:id/pdf',
  adminLimiter,
  auth([ROLES.ADMIN]),
  validateId('id'),
  validate(pdfQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const invoice = await Invoice.findById(req.params.id).lean();
    if (!invoice) {
      return res.fail('Invoice not found', 404);
    }
    const download = String(req.query.download || '').toLowerCase() === 'true';
    return streamInvoicePdf(invoice, res, { download });
  }),
);

/**
 * @openapi
 * /api/v1/invoices/order/{orderId}:
 *   get:
 *     summary: Get invoice by order id (Admin)
 *     tags: [Invoices]
 *     security: [ { bearerAuth: [] as any[] } ]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Invoice }
 */
router.get(
  '/order/:orderId',
  adminLimiter,
  auth([ROLES.ADMIN]),
  validateId('orderId'),
  asyncHandler(async (req, res) => {
    const invoice = await Invoice.findOne({ orderId: req.params.orderId }).lean();

    if (!invoice) {
      return res.fail('Invoice not found for this order', 404);
    }

    return res.ok({ invoice });
  }),
);

/**
 * @openapi
 * /api/v1/invoices/order/{orderId}/pdf:
 *   get:
 *     summary: Get invoice PDF by order id (Admin)
 *     tags: [Invoices]
 *     security: [ { bearerAuth: [] as any[] } ]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: download
 *         schema: { type: string, enum: [ "true", "false" ] }
 *     responses:
 *       200:
 *         description: PDF stream
 */
router.get(
  '/order/:orderId/pdf',
  adminLimiter,
  auth([ROLES.ADMIN]),
  validateId('orderId'),
  validate(pdfQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    let invoice = await Invoice.findOne({ orderId: req.params.orderId }).lean();

    if (!invoice) {
      const order = await Order.findById(req.params.orderId);
      if (order && order.paymentStatus === 'paid') {
        invoice = await invoiceService.generateFromOrder(order);
        if (invoice && typeof invoice.toObject === 'function') {
          invoice = invoice.toObject();
        }
      }
    }

    if (!invoice) {
      return res.fail('Invoice not found for this order', 404);
    }
    const download = String(req.query.download || '').toLowerCase() === 'true';
    return streamInvoicePdf(invoice, res, { download });
  }),
);

module.exports = router;
