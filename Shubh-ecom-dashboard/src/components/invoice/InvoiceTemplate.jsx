//src/components/invoice/InvoiceTemplate.jsx
"use client";
import { forwardRef } from 'react';
import Image from 'next/image';
import { formatPrice } from '@/services/pricingService';
import { formatTaxBreakdown } from '@/services/taxDisplayService';

const formatCancellationReason = (value) =>
  String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

const formatDocumentStatus = (value) =>
  String(value || 'issued')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

const getPaymentReferenceRows = (order = {}) => {
  const snapshot = order.paymentSnapshot || {};
  const method = String(snapshot.paymentMethod || order.paymentMethod || '').toLowerCase();
  const rows = [
    ['Payment Method', snapshot.paymentMethod || order.paymentMethod || '-'],
    ['Payment Status', snapshot.status || order.paymentStatus || '-'],
  ];

  if (snapshot.gateway) rows.push(['Gateway', String(snapshot.gateway).toUpperCase()]);
  if (snapshot.transactionId) rows.push(['Transaction ID', snapshot.transactionId]);
  if (snapshot.gatewayOrderId) rows.push(['Gateway Order ID', snapshot.gatewayOrderId]);
  if (snapshot.capturedAt) {
    rows.push(['Captured On', new Date(snapshot.capturedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })]);
  }
  if (method === 'cod' && snapshot.manualReference) {
    rows.push(['Collection Reference', snapshot.manualReference]);
  }

  return rows;
};

const InvoiceTemplate = forwardRef(({ order, items = [], address, settings = {} }, ref) => {
  if (!order) return null;
  const isCreditNote = order.type === 'credit_note';
  const documentTitle = isCreditNote ? (settings.credit_note_title || 'CREDIT NOTE') : 'TAX INVOICE';
  const documentNumberLabel = isCreditNote ? 'Credit Note No' : 'Invoice No';
  const documentDateLabel = isCreditNote ? 'Credit Note Date' : 'Invoice Date';

  // Use settings with fallbacks
  const companyName = settings.invoice_company_name || `India Pvt Ltd`;
  const addressLine1 = settings.invoice_company_address_line1 || '123, Industrial Area, Phase 2';
  const addressLine2 = settings.invoice_company_address_line2 || '';
  const city = settings.invoice_company_city || 'Gurugram';
  const state = settings.invoice_company_state || 'Haryana';
  const pincode = settings.invoice_company_pincode || '122001';
  const gstin = settings.invoice_company_gstin || 'GSTIN NOT CONFIGURED';
  const companyEmail = settings.invoice_company_email || 'support@example.com';
  const companyPhone = settings.invoice_company_phone || '1800123456';
  const companyWebsite = settings.invoice_company_website || '';
  const termsText = String(isCreditNote ? (settings.credit_note_terms || settings.invoice_terms || '') : (settings.invoice_terms || '')).trim();
  const notesText = String(isCreditNote ? (settings.credit_note_notes || settings.invoice_notes || '') : (settings.invoice_notes || '')).trim();
  const creditNoteInfoTitle = settings.credit_note_info_title || 'Credit note information';
  const creditNoteInfoBody =
    settings.credit_note_info_body ||
    'This credit note reverses the original invoice for accounting and tax purposes. Refund settlement, if applicable, is tracked separately against the original payment method.';
  const termsLines = termsText
    ? termsText.split('\n').map((line) => line.trim()).filter(Boolean)
    : [
      'Goods once sold will not be taken back or exchanged.',
      'All disputes are subject to Gurugram jurisdiction.',
      'This is a computer generated invoice.',
    ];

  const invoiceNumber = order.invoiceNumber || `INV-${order.orderNumber || order._id}`;
  const invoiceDateSource = order.placedAt || order.createdAt;
  const invoiceDate = invoiceDateSource ? new Date(invoiceDateSource).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }) : 'N/A';

  // Invoice subtotal should use the persisted order subtotal from backend.
  const subtotal = Number(
    order.subtotal ??
    order.taxableAmount ??
    Math.max(0, (order.grandTotal || 0) - (order.shippingFee || 0) - (order.taxAmount || 0)),
  ) || 0;
  const discount = order.discountAmount || 0;
  const taxAmount = order.taxAmount || 0;
  const shippingFee = order.shippingFee || 0;
  const grandTotal = order.grandTotal || 0;
  const taxBreakdown = order.taxBreakdown || { cgst: 0, sgst: 0, igst: 0 };
  const refundMeta = order.refundMeta || {};
  const paymentReferenceRows = getPaymentReferenceRows(order);
  const pricesIncludeTax =
    Math.abs((subtotal - discount + shippingFee) - grandTotal) < 0.01;
  const subtotalLabel = pricesIncludeTax ? 'Subtotal (Incl. Tax)' : 'Subtotal';
  const taxLabel = pricesIncludeTax ? 'Included Tax' : 'Tax';

  // Use uploaded invoice logo, else fallback
  const logo = settings.invoice_logo_url || '/logodark.png';

  // Inline styles for print specific overrides that might conflict with Bootstrap components
  const printStyles = `
    @media print {
      @page { margin: 2mm; size: A4; }
      .print-col-6 { width: 50% !important; float: left; }
      .print-row::after { content: ""; clear: both; display: table; }
      .print-mb-3 { margin-bottom: 0.75rem !important; }
      .print-pb-2 { padding-bottom: 0.5rem !important; }
      .print-p-10 { padding: 0.5rem !important; }
      .print-text-11 { font-size: 11px !important; }
      .print-compact-box { padding: 0.625rem !important; margin-bottom: 0.75rem !important; }
      .print-no-break { break-inside: avoid-page; page-break-inside: avoid; }
      .print-footer-stack { break-inside: avoid-page; page-break-inside: avoid; }
    }
  `;

  return (
    <div ref={ref} className="bg-white text-dark p-4 p-md-5 print-p-10" id="invoice-template" style={{ fontSize: '13px', lineHeight: '1.4' }}>
      <style>{printStyles}</style>

      {/* Header section */}
      <div className="d-flex justify-content-between align-items-start mb-4 pb-3 border-bottom print-mb-3 print-pb-2 print-row">
        <div className="print-col-6">
          <div className="d-flex align-items-center gap-3 mb-2">
            <Image src={logo} alt={companyName} width={200} height={56} priority={true} unoptimized={true} style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="mt-3 text-muted small" style={{ fontSize: '12px' }}>
            <p className="mb-0">{companyName}</p>
            <p className="mb-0">{addressLine1}</p>
            {addressLine2 && <p className="mb-0">{addressLine2}</p>}
            <p className="mb-0">{city}, {state} - {pincode}</p>
            <p className="mb-0 mt-1">GSTIN: {gstin}</p>
          </div>
        </div>
        <div className="text-end print-col-6">
          <h2 className="fw-bold text-dark mt-2 mb-4" style={{ fontSize: '24px' }}>{documentTitle}</h2>
          <div className="small text-muted" style={{ fontSize: '12px' }}>
            <p className="mb-1">{documentNumberLabel}: <span className="fw-bold text-dark">{invoiceNumber}</span></p>
            <p className="mb-1">{documentDateLabel}: <span className="fw-bold text-dark">{invoiceDate}</span></p>
            <p className="mb-0">Order No: <span className="fw-bold text-dark">{order.orderNumber}</span></p>
            <p className="mb-0 mt-1">Document Status: <span className="fw-bold text-dark">{formatDocumentStatus(order.status)}</span></p>
            {isCreditNote && order.relatedInvoiceNumber ? (
              <p className="mb-0 mt-1">Original Invoice: <span className="fw-bold text-dark">{order.relatedInvoiceNumber}</span></p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Addresses section */}
      <div className="row mb-4 print-row print-mb-3">
        <div className="col-6 print-col-6">
          <h6 className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Bill To</h6>
          <div className="small text-muted" style={{ fontSize: '12px' }}>
            <p className="fw-bold text-dark mb-1">{address?.fullName || '-'}</p>
            <p className="mb-0">{address?.line1 || '-'}</p>
            {address?.line2 && <p className="mb-0">{address.line2}</p>}
            <p className="mb-0">{address?.city || '-'}, {address?.state || '-'} - {address?.postalCode || '-'}</p>
            <p className="mb-0 mt-1">Phone: {address?.phone || '-'}</p>
          </div>
        </div>
        <div className="col-6 print-col-6 text-end">
          <h6 className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Ship To</h6>
          <div className="small text-muted" style={{ fontSize: '12px' }}>
            <p className="fw-bold text-dark mb-1">{address?.fullName || '-'}</p>
            <p className="mb-0">{address?.line1 || '-'}</p>
            {address?.line2 && <p className="mb-0">{address.line2}</p>}
            <p className="mb-0">{address?.city || '-'}, {address?.state || '-'} - {address?.postalCode || '-'}</p>
            <p className="mb-0 mt-1">Phone: {address?.phone || '-'}</p>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="mb-4">
        <div className="table-responsive">
          <table className="table table-sm table-borderless mb-0">
            <thead className="bg-light">
              <tr>
                <th className="py-2 px-2 text-muted text-uppercase" style={{ fontSize: '12px', width: '5%' }}>#</th>
                <th className="py-2 px-2 text-muted text-uppercase" style={{ fontSize: '12px', width: '35%' }}>Item Description</th>
                <th className="py-2 px-2 text-muted text-uppercase text-center" style={{ fontSize: '12px', width: '10%' }}>Qty</th>
                <th className="py-2 px-2 text-muted text-uppercase text-end" style={{ fontSize: '12px', width: '15%' }}>Unit Price</th>
                <th className="py-2 px-2 text-muted text-uppercase text-end" style={{ fontSize: '12px', width: '15%' }}>{taxLabel}</th>
                <th className="py-2 px-2 text-muted text-uppercase text-end" style={{ fontSize: '12px', width: '20%' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const grossLineAmount = Number(item.price || 0) * Number(item.quantity || 0);
                const displayLineAmount = pricesIncludeTax
                  ? grossLineAmount
                  : Number(item.total || grossLineAmount);

                return (
                <tr key={item._id || item.id || index} className="border-bottom">
                  <td className="py-2 px-2 text-muted align-middle" style={{ fontSize: '13px' }}>{index + 1}</td>
                  <td className="py-2 px-2 align-middle">
                    <p className="mb-0 fw-medium text-dark text-truncate" style={{ fontSize: '13px', maxWidth: '250px' }}>{item.product?.name || 'Product'}</p>
                  </td>
                  <td className="py-2 px-2 text-center text-muted align-middle" style={{ fontSize: '13px' }}>{item.quantity}</td>
                  <td className="py-2 px-2 text-end text-muted text-nowrap align-middle" style={{ fontSize: '13px' }}>{formatPrice(item.price || 0)}</td>
                  <td className="py-2 px-2 text-end text-muted text-nowrap align-middle" style={{ fontSize: '13px' }}>
                    {formatPrice(item.taxAmount || 0)}
                    <span className="d-block text-muted" style={{ fontSize: '10px' }}>
                      ({item.taxPercent || 0}%)
                    </span>
                  </td>
                  <td className="py-2 px-2 text-end fw-medium text-dark text-nowrap align-middle" style={{ fontSize: '13px' }}>{formatPrice(displayLineAmount)}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals section */}
      <div className="d-flex justify-content-end mb-4">
        <div style={{ width: '280px' }}>
          <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '13px' }}>
            <span className="text-muted">{subtotalLabel}</span>
            <span className="fw-medium text-dark">{formatPrice(subtotal)}</span>
          </div>
          
          {discount > 0 && (
            <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '13px' }}>
              <span className="text-success">Discount</span>
              <span className="text-success">-{formatPrice(discount)}</span>
            </div>
          )}

          {formatTaxBreakdown(taxBreakdown).map((component) => (
            <div key={component.key} className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '13px' }}>
              <span className="text-muted">
                {pricesIncludeTax ? `Included ${component.label}` : component.label}
              </span>
              <span className="text-dark">{component.formatted}</span>
            </div>
          ))}
          
          <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '13px' }}>
            <span className="text-muted">Shipping</span>
            <span className="text-dark">{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span>
          </div>
          
          <div className="d-flex justify-content-between pt-2 mt-2 border-top border-dark" style={{ borderTopWidth: '2px !important' }}>
            <span className="fw-bold text-dark" style={{ fontSize: '16px' }}>Grand Total</span>
            <span className="fw-bold text-dark" style={{ fontSize: '16px' }}>{formatPrice(grandTotal)}</span>
          </div>
        </div>
      </div>

      {isCreditNote ? (
        <div className="mb-4 rounded border border-info-subtle bg-info-subtle px-3 py-2 print-compact-box print-no-break" style={{ fontSize: '12px' }}>
          <p className="mb-1 fw-semibold text-dark">{creditNoteInfoTitle}</p>
          <p className="mb-0 text-muted">
            {creditNoteInfoBody}
          </p>
          {order.cancelReason ? (
            <p className="mb-0 mt-2 text-muted">
              <strong className="text-dark">Cancellation reason:</strong> {formatCancellationReason(order.cancelReason)}
            </p>
          ) : null}
          {order.cancelDetails ? (
            <p className="mb-0 mt-1 text-muted">
              <strong className="text-dark">Additional note:</strong> {order.cancelDetails}
            </p>
          ) : null}
          {refundMeta.refundReference || refundMeta.refundMode || refundMeta.refundTransactionId ? (
            <p className="mb-0 mt-1 text-muted">
              <strong className="text-dark">Refund Reference:</strong>{' '}
              {refundMeta.refundReference || refundMeta.refundTransactionId || refundMeta.refundMode}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Footer Info */}
      <div className="print-footer-stack">
        <div className="row mt-4 pt-3 border-top print-row">
          <div className="col-6 print-col-6">
            <h6 className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Payment Information</h6>
            <div className="small text-muted" style={{ fontSize: '12px' }}>
              {paymentReferenceRows.map(([label, value]) => (
                <p key={label} className="mb-0">{label}: <span className="text-dark">{value}</span></p>
              ))}
            </div>
          </div>
          <div className="col-6 print-col-6">
            <h6 className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Terms & Conditions</h6>
            <div className="text-muted" style={{ fontSize: '10px', lineHeight: '1.5' }}>
              {termsLines.map((line, idx) => (
                <p key={`term-${idx}`} className="mb-0">* {line}</p>
              ))}
              {notesText && (
                <p className="mb-0 mt-1"><strong>Note:</strong> {notesText}</p>
              )}
            </div>
          </div>
        </div>

        <div className="text-center mt-3 pt-3 border-top">
          <p className="text-muted mb-1" style={{ fontSize: '12px' }}>Thank you for shopping with {companyName}!</p>
          <p className="text-muted mb-0" style={{ fontSize: '10px' }}>
            For queries, contact: {companyEmail} | {companyPhone}
            {companyWebsite && ` | ${companyWebsite}`}
          </p>
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
