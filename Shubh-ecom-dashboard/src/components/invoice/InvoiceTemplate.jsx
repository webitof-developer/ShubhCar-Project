//src/components/invoice/InvoiceTemplate.jsx
"use client";
import { forwardRef } from 'react';
import Image from 'next/image';
import { formatPrice } from '@/services/pricingService';
import { formatTaxBreakdown } from '@/services/taxDisplayService';

const InvoiceTemplate = forwardRef(({ order, items = [], address, settings = {} }, ref) => {
  if (!order) return null;

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

  const invoiceNumber = `INV-${order.orderNumber || order._id}`;
  const invoiceDateSource = order.placedAt || order.createdAt;
  const invoiceDate = invoiceDateSource ? new Date(invoiceDateSource).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }) : 'N/A';

  // Display taxable amount as subtotal for consistency with cart/checkout
  const subtotal = order.taxableAmount || (Math.max(0, (order.grandTotal || 0) - (order.shippingFee || 0) - (order.taxAmount || 0))) || 0;
  const discount = order.discountAmount || 0;
  const taxAmount = order.taxAmount || 0;
  const shippingFee = order.shippingFee || 0;
  const grandTotal = order.grandTotal || 0;
  const taxBreakdown = order.taxBreakdown || { cgst: 0, sgst: 0, igst: 0 };

  // Use uploaded invoice logo, else fallback
  const logo = settings.invoice_logo_url || '/logodark.png';

  // Inline styles for print specific overrides that might conflict with Bootstrap components
  const printStyles = `
    @media print {
      @page { margin: 10mm; size: A4; }
      .print-col-6 { width: 50% !important; float: left; }
      .print-row::after { content: ""; clear: both; display: table; }
      .print-mb-3 { margin-bottom: 1rem !important; }
      .print-pb-2 { padding-bottom: 0.5rem !important; }
      .print-p-10 { padding: 2rem !important; }
      .print-text-11 { font-size: 11px !important; }
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
          <h2 className="fw-bold text-dark mt-2 mb-4" style={{ fontSize: '24px' }}>TAX INVOICE</h2>
          <div className="small text-muted" style={{ fontSize: '12px' }}>
            <p className="mb-1">Invoice No: <span className="fw-bold text-dark">{invoiceNumber}</span></p>
            <p className="mb-1">Invoice Date: <span className="fw-bold text-dark">{invoiceDate}</span></p>
            <p className="mb-0">Order No: <span className="fw-bold text-dark">{order.orderNumber}</span></p>
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
                <th className="py-2 px-2 text-muted text-uppercase text-end" style={{ fontSize: '12px', width: '15%' }}>Tax</th>
                <th className="py-2 px-2 text-muted text-uppercase text-end" style={{ fontSize: '12px', width: '20%' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
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
                  <td className="py-2 px-2 text-end fw-medium text-dark text-nowrap align-middle" style={{ fontSize: '13px' }}>{formatPrice(item.total || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals section */}
      <div className="d-flex justify-content-end mb-4">
        <div style={{ width: '280px' }}>
          <div className="d-flex justify-content-between py-1 border-bottom" style={{ fontSize: '13px' }}>
            <span className="text-muted">Subtotal</span>
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
              <span className="text-muted">{component.label}</span>
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

      {/* Footer Info */}
      <div className="row mt-4 pt-3 border-top print-row">
        <div className="col-6 print-col-6">
          <h6 className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Payment Information</h6>
          <div className="small text-muted" style={{ fontSize: '12px' }}>
            <p className="mb-0">Payment Method: <span className="text-dark">{order.paymentMethod}</span></p>
            <p className="mb-0">Payment Status: <span className="text-success fw-medium">{order.paymentStatus}</span></p>
          </div>
        </div>
        <div className="col-6 print-col-6">
          <h6 className="text-muted text-uppercase fw-bold mb-2" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>Terms & Conditions</h6>
          <div className="text-muted" style={{ fontSize: '10px', lineHeight: '1.5' }}>
            <p className="mb-0">* Goods once sold will not be taken back or exchanged.</p>
            <p className="mb-0">* All disputes are subject to Gurugram jurisdiction.</p>
            <p className="mb-0">* This is a computer generated invoice.</p>
          </div>
        </div>
      </div>

      <div className="text-center mt-4 pt-4 border-top">
        <p className="text-muted mb-1" style={{ fontSize: '12px' }}>Thank you for shopping with {companyName}!</p>
        <p className="text-muted" style={{ fontSize: '10px' }}>
          For queries, contact: {companyEmail} | {companyPhone}
          {companyWebsite && ` | ${companyWebsite}`}
        </p>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
