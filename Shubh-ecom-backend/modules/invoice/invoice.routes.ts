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
const paymentRepo = require('../payments/payment.repo');
const Order = require('../../models/Order.model');
const { listInvoicesQuerySchema, pdfQuerySchema } = require('./invoice.validator');

const BASE_DIR = path.resolve(__dirname, '../../');
const PAGE_MARGIN = 28;
type StreamPdfOptions = {
  download?: boolean;
};

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

const hasCapturedPaymentStatus = (paymentStatus = '') =>
  ['paid', 'refunded'].includes(
    String(paymentStatus || '').trim().toLowerCase(),
  );

const resolveDocumentPaymentSnapshot = async (invoice, order, relatedInvoice) => {
  if (invoice?.paymentSnapshot?.paymentMethod || invoice?.paymentSnapshot?.transactionId) {
    return invoice.paymentSnapshot;
  }

  if (relatedInvoice?.paymentSnapshot?.paymentMethod || relatedInvoice?.paymentSnapshot?.transactionId) {
    return relatedInvoice.paymentSnapshot;
  }

  if (order) {
    return invoiceService.buildInvoicePaymentSnapshot(order);
  }

  if (invoice?.orderId) {
    const latestPayment = await paymentRepo.findLatestLeanByOrder(invoice.orderId).catch(() => null);
    if (latestPayment) {
      return {
        paymentMethod: invoice?.orderSnapshot?.paymentMethod || null,
        gateway: latestPayment.paymentGateway || null,
        paymentId: latestPayment._id || null,
        gatewayOrderId: latestPayment.gatewayOrderId || null,
        transactionId: latestPayment.transactionId || null,
        status: latestPayment.status || null,
        capturedAt: latestPayment.updatedAt || latestPayment.createdAt || null,
        manualReference: null,
      };
    }
  }

  return null;
};

const buildDocumentPayload = async (invoice) => {
  if (!invoice) return null;

  const [relatedInvoice, order] = await Promise.all([
    invoice.type === 'credit_note' && invoice.relatedInvoiceId
      ? Invoice.findById(invoice.relatedInvoiceId).lean().catch(() => null)
      : Promise.resolve(null),
    invoice.orderId ? Order.findById(invoice.orderId).lean().catch(() => null) : Promise.resolve(null),
  ]);

  const paymentSnapshot = await resolveDocumentPaymentSnapshot(invoice, order, relatedInvoice);

  return {
    ...invoice,
    status: invoice.status || 'issued',
    paymentSnapshot,
    refundMeta: invoice.refundMeta || {},
    displayMeta: {
      ...(invoice.displayMeta || {}),
      originalInvoiceNumber: relatedInvoice?.invoiceNumber || invoice.displayMeta?.originalInvoiceNumber || '',
      originalInvoiceDate: getDateLabel(relatedInvoice?.issuedAt || invoice.displayMeta?.originalInvoiceDate),
      refundReason: order?.cancelReason || '',
      refundStatus: String(order?.paymentStatus || '').toLowerCase(),
      cancelDetails: order?.cancelDetails || '',
    },
  };
};

const getDocumentLabels = (invoice) => ({
  title: invoice.type === 'credit_note' ? 'Credit Note' : 'Tax Invoice',
  numberLabel: invoice.type === 'credit_note' ? 'Credit Note #' : 'Invoice #',
  dateLabel: invoice.type === 'credit_note' ? 'Credit Note Date' : 'Issue Date',
});

const drawInvoiceHeader = (doc, invoice, settings, logoBuffer) => {
  const { title, numberLabel, dateLabel } = getDocumentLabels(invoice);
  const originalInvoiceNumber = invoice.displayMeta?.originalInvoiceNumber || '-';
  const originalInvoiceDate = invoice.displayMeta?.originalInvoiceDate || '-';

  doc.fontSize(22).font('Helvetica-Bold').fillColor('#111827').text(title, 44, 46);

  doc.fontSize(10).font('Helvetica').fillColor('#374151');
  doc.text(`${numberLabel}: ${invoice.invoiceNumber || '-'}`, 44, 78);
  doc.text(`${dateLabel}: ${getDateLabel(invoice.issuedAt)}`, 44, 92);
  doc.text(`Order #: ${invoice.orderSnapshot?.orderNumber || '-'}`, 44, 106);
  if (invoice.type === 'credit_note') {
    doc.text(`Original Invoice #: ${originalInvoiceNumber}`, 44, 120);
    doc.text(`Original Invoice Date: ${originalInvoiceDate}`, 44, 134);
  }

  if (logoBuffer) {
    try {
      doc.image(logoBuffer, 442, 44, { fit: [110, 72], align: 'right' });
    } catch (err) {
      logger.warn('Invoice logo rendering failed', { error: err.message });
    }
  }

  const companyInfoY = invoice.type === 'credit_note' ? 160 : 136;
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827').text(settings.invoice_company_name || '-', 44, companyInfoY);

  const companyAddress = [
    settings.invoice_company_address_line1,
    settings.invoice_company_address_line2,
    [settings.invoice_company_city, settings.invoice_company_state, settings.invoice_company_pincode]
      .filter(Boolean)
      .join(' - '),
  ]
    .filter(Boolean)
    .join(', ');

  doc.fontSize(10).font('Helvetica').fillColor('#374151');
  doc.text(companyAddress || '-', 44, companyInfoY + 18, { width: 360 });
  doc.text(`GSTIN: ${settings.invoice_company_gstin || '-'}`, 44, companyInfoY + 32);
  doc.text(`Email: ${settings.invoice_company_email || '-'}`, 44, companyInfoY + 46);
  doc.text(`Phone: ${settings.invoice_company_phone || '-'}`, 44, companyInfoY + 60);
};

const drawBillingSection = (doc, invoice, y = 222) => {
  doc
    .rect(44, y, 508, 90)
    .fillOpacity(0.95)
    .fill('#f8fafc')
    .fillOpacity(1)
    .strokeColor('#e5e7eb')
    .stroke();

  doc.fontSize(11).font('Helvetica-Bold').fillColor('#111827').text('Bill To', 56, y + 12);
  doc.fontSize(10).font('Helvetica').fillColor('#374151');
  doc.text(invoice.customerSnapshot?.name || '-', 56, y + 28);
  doc.text(invoice.customerSnapshot?.email || '-', 56, y + 42);
  doc.text(invoice.customerSnapshot?.phone || '-', 56, y + 56);

  const address = invoice.customerSnapshot?.address || {};
  const addressText = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');

  doc.text(addressText || '-', 260, y + 28, { width: 280 });
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
  return rowHeight;
};

const drawTotals = (doc, invoice, y) => {
  const totalsX = 352;
  const totalsWidth = 200;
  const currency = invoice.totals?.currency || 'INR';
  const pricesIncludeTax =
    Math.abs(
      Number((invoice.totals?.subtotal || 0) - (invoice.totals?.discountTotal || 0)) - Number(invoice.totals?.grandTotal || 0),
    ) < 0.01;
  const taxLabel = pricesIncludeTax ? 'Included Tax' : 'Tax';

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

  doc.text(taxLabel, totalsX + 10, y + 30, { width: 90 });
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

const drawCreditNoteInfo = (doc, invoice, y) => {
  if (invoice.type !== 'credit_note') return y;

  const refundStatus = invoice.displayMeta?.refundStatus || '';
  const refundReason = invoice.displayMeta?.refundReason || 'Order cancellation / return reversal';
  const refundInfo =
    refundStatus === 'pending' || refundStatus === 'failed'
      ? 'No payment captured. Refund not applicable.'
      : 'Refund settlement, if applicable, is processed separately via the original payment method.';

  const height = 56;
  doc
    .roundedRect(44, y, 508, height, 8)
    .fillOpacity(1)
    .fill('#f8fbff')
    .strokeColor('#93c5fd')
    .stroke();

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#111827').text('Credit note information', 56, y + 10);
  doc.fontSize(9).font('Helvetica').fillColor('#4b5563');
  doc.text(`Reason: ${refundReason}`, 56, y + 24, { width: 480 });
  doc.text(refundInfo, 56, y + 36, { width: 480 });
  return y + height;
};

const drawFooter = (doc, settings, invoice) => {
  const footerY = doc.page.height - 72;
  const termsText = invoice?.type === 'credit_note'
    ? (settings.credit_note_terms || settings.invoice_terms || '')
    : (settings.invoice_terms || '');
  const notesText = invoice?.type === 'credit_note'
    ? (settings.credit_note_notes || settings.invoice_notes || '')
    : (settings.invoice_notes || '');
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#4b5563')
    .text(termsText || '', 44, footerY, { width: 508, align: 'left' });
  doc
    .fontSize(9)
    .font('Helvetica-Oblique')
    .fillColor('#6b7280')
    .text(notesText || '', 44, footerY + 18, { width: 508, align: 'left' });
};

const streamInvoicePdf = async (
  invoice,
  res,
  { download = false }: StreamPdfOptions = {},
) => {
  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4' });
  const filePrefix = invoice.type === 'credit_note' ? 'credit-note' : 'invoice';
  const filename = `${filePrefix}-${invoice.invoiceNumber || invoice._id}.pdf`;

  const settings = await settingsService.getInvoiceSettings().catch(() => ({}));
  const [relatedInvoice, order] = await Promise.all([
    invoice.type === 'credit_note' && invoice.relatedInvoiceId
      ? Invoice.findById(invoice.relatedInvoiceId).lean().catch(() => null)
      : Promise.resolve(null),
    invoice.orderId ? Order.findById(invoice.orderId).lean().catch(() => null) : Promise.resolve(null),
  ]);
  invoice.displayMeta = {
    originalInvoiceNumber: relatedInvoice?.invoiceNumber || '-',
    originalInvoiceDate: getDateLabel(relatedInvoice?.issuedAt),
    refundReason: order?.cancelReason || order?.refundMeta?.reason || '',
    refundStatus: String(order?.paymentStatus || '').toLowerCase(),
  };
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
  const billingY = invoice.type === 'credit_note' ? 246 : 222;
  drawBillingSection(doc, invoice, billingY);

  const currency = invoice.totals?.currency || 'INR';
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const pageBottomY = doc.page.height - 96;
  const firstPageTableY = invoice.type === 'credit_note' ? 354 : 330;
  let tableY = firstPageTableY;
  let itemIndex = 0;

  const drawItemsPageHeader = (isContinuation = false) => {
    if (isContinuation) {
      doc.addPage();
      if (templateBuffer) {
        try {
          doc.image(templateBuffer, 0, 0, {
            width: doc.page.width,
            height: doc.page.height,
          });
        } catch (err) {
          logger.warn('Invoice template image rendering failed on continuation page', { error: err.message });
        }
      }
      doc
        .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
        .fillOpacity(templateBuffer ? 0.92 : 1)
        .fill('#ffffff')
        .fillOpacity(1)
        .strokeColor('#e5e7eb')
        .stroke();
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#111827').text(`${getDocumentLabels(invoice).title} Items`, 44, 46);
      doc.fontSize(9).font('Helvetica').fillColor('#6b7280').text(`Document #: ${invoice.invoiceNumber || '-'}`, 44, 64);
      tableY = 92;
    }

    drawItemsHeader(doc, tableY);
    tableY += 24;
  };

  drawItemsPageHeader(false);

  while (itemIndex < items.length) {
    if (tableY + 22 > pageBottomY - 140) {
      drawItemsPageHeader(true);
    }
    drawItemRow(doc, items[itemIndex], itemIndex, tableY, currency);
    tableY += 22;
    itemIndex += 1;
  }

  if (tableY + 170 > pageBottomY) {
    drawItemsPageHeader(true);
  }

  drawTotals(doc, invoice, tableY + 12);
  let postTotalsY = tableY + 124;
  postTotalsY = drawCreditNoteInfo(doc, invoice, postTotalsY + 12);
  drawFooter(doc, settings, invoice);

  doc.end();
};

/**
 * @openapi
 * /api/v1/invoices:
 *   get:
 *     summary: List invoices (Admin)
 *     tags: [Invoices]
 *     security: [ { bearerAuth: [] } ]
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
    const { page = 1, limit = 50, type, search = '' } = req.query;

    const query: Record<string, unknown> = {};
    if (type) query.type = type;
    if (search) {
      const normalizedSearch = String(search).trim();
      const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      query.$or = [
        { invoiceNumber: searchRegex },
        { 'orderSnapshot.orderNumber': searchRegex },
        { 'customerSnapshot.name': searchRegex },
      ];
    }

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
 *     security: [ { bearerAuth: [] } ]
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

    return res.ok({ invoice: await buildDocumentPayload(invoice) });
  }),
);

/**
 * @openapi
 * /api/v1/invoices/{id}/pdf:
 *   get:
 *     summary: Get invoice PDF (Admin)
 *     tags: [Invoices]
 *     security: [ { bearerAuth: [] } ]
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
 *     security: [ { bearerAuth: [] } ]
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
    let invoice = await Invoice.findOne({ orderId: req.params.orderId, type: 'invoice' }).lean();

    if (!invoice) {
      const order = await Order.findById(req.params.orderId);
      if (order && hasCapturedPaymentStatus(order.paymentStatus)) {
        invoice = await invoiceService.generateFromOrder(order);
        if (invoice && typeof invoice.toObject === 'function') {
          invoice = invoice.toObject();
        }
      }
    }

    if (!invoice) {
      return res.fail('Invoice not found for this order', 404);
    }

    return res.ok({ invoice: await buildDocumentPayload(invoice) });
  }),
);

/**
 * @openapi
 * /api/v1/invoices/order/{orderId}/pdf:
 *   get:
 *     summary: Get invoice PDF by order id (Admin)
 *     tags: [Invoices]
 *     security: [ { bearerAuth: [] } ]
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
    let invoice = await Invoice.findOne({ orderId: req.params.orderId, type: 'invoice' }).lean();

    if (!invoice) {
      const order = await Order.findById(req.params.orderId);
      if (order && hasCapturedPaymentStatus(order.paymentStatus)) {
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

router.get(
  '/order/:orderId/credit-note',
  adminLimiter,
  auth([ROLES.ADMIN]),
  validateId('orderId'),
  asyncHandler(async (req, res) => {
    let creditNote = await Invoice.findOne({ orderId: req.params.orderId, type: 'credit_note' }).lean();

    if (!creditNote) {
      const order = await Order.findById(req.params.orderId);
      if (
        order &&
        ['cancelled', 'refunded', 'returned'].includes(String(order.orderStatus || '').toLowerCase()) &&
        hasCapturedPaymentStatus(order.paymentStatus)
      ) {
        const originalInvoice = await Invoice.findOne({ orderId: order._id, type: 'invoice' });
        if (originalInvoice) {
          creditNote = await invoiceService.generateCreditNote(order, originalInvoice);
          if (creditNote && typeof creditNote.toObject === 'function') {
            creditNote = creditNote.toObject();
          }
        }
      }
    }

    if (!creditNote) {
      return res.fail('Credit note not found for this order', 404);
    }

    return res.ok({ invoice: await buildDocumentPayload(creditNote) });
  }),
);

/**
 * @openapi
 * /api/v1/invoices/order/{orderId}/credit-note/pdf:
 *   get:
 *     summary: Get credit note PDF by order id (Admin)
 *     tags: [Invoices]
 *     security: [ { bearerAuth: [] } ]
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
 *       404:
 *         description: Credit note not found
 */
router.get(
  '/order/:orderId/credit-note/pdf',
  adminLimiter,
  auth([ROLES.ADMIN]),
  validateId('orderId'),
  validate(pdfQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    let creditNote = await Invoice.findOne({ orderId: req.params.orderId, type: 'credit_note' }).lean();

    if (!creditNote) {
      // In case it hasn't been generated but the order is cancelled, we might generate it here.
      // Easiest is to just check if original invoice exists and attempt generation:
      const order = await Order.findById(req.params.orderId);
      if (
        order &&
        ['cancelled', 'refunded', 'returned'].includes(String(order.orderStatus || '').toLowerCase()) &&
        hasCapturedPaymentStatus(order.paymentStatus)
      ) {
        const originalInvoice = await Invoice.findOne({ orderId: order._id, type: 'invoice' });
        if (originalInvoice) {
           creditNote = await invoiceService.generateCreditNote(order, originalInvoice);
           if (creditNote && typeof creditNote.toObject === 'function') {
             creditNote = creditNote.toObject();
           }
        }
      }
    }

    if (!creditNote) {
      return res.fail('Credit note not found for this order', 404);
    }
    const download = String(req.query.download || '').toLowerCase() === 'true';
    return streamInvoicePdf(creditNote, res, { download });
  }),
);

router.get(
  '/my/order/:orderId',
  auth([ROLES.CUSTOMER, ROLES.ADMIN]),
  validateId('orderId'),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId).lean();

    if (!order) {
      return res.fail('Order not found', 404);
    }

    const isAdmin = String(req.user?.role || '').toLowerCase() === ROLES.ADMIN;
    if (!isAdmin && String(order.userId || '') !== String(req.user?.id || '')) {
      return res.fail('Invoice not found', 404);
    }

    let invoice = await Invoice.findOne({
      orderId: order._id,
      type: 'invoice',
    }).lean();

    if (!invoice && hasCapturedPaymentStatus(order.paymentStatus)) {
      const generated = await invoiceService.generateFromOrder(order);
      invoice = typeof generated?.toObject === 'function' ? generated.toObject() : generated;
    }

    if (!invoice) {
      return res.fail(
        'Invoice is not available yet. It becomes available after successful payment capture.',
        404,
      );
    }

    return res.ok({ invoice: await buildDocumentPayload(invoice) });
  }),
);

router.get(
  '/my/order/:orderId/pdf',
  auth([ROLES.CUSTOMER, ROLES.ADMIN]),
  validateId('orderId'),
  validate(pdfQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.fail('Order not found', 404);
    }

    const isAdmin = String(req.user?.role || '').toLowerCase() === ROLES.ADMIN;
    if (!isAdmin && String(order.userId || '') !== String(req.user?.id || '')) {
      return res.fail('Invoice not found', 404);
    }

    let invoice = await Invoice.findOne({
      orderId: order._id,
      type: 'invoice',
    }).lean();

    if (!invoice && hasCapturedPaymentStatus(order.paymentStatus)) {
      const generated = await invoiceService.generateFromOrder(order);
      invoice = typeof generated?.toObject === 'function' ? generated.toObject() : generated;
    }

    if (!invoice) {
      return res.fail(
        'Invoice is not available yet. It becomes available after successful payment capture.',
        404,
      );
    }

    const download = String(req.query.download || '').toLowerCase() === 'true';
    return streamInvoicePdf(invoice, res, { download });
  }),
);

module.exports = router;

