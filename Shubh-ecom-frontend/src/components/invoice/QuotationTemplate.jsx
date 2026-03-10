"use client";
import { forwardRef } from 'react';
import Image from 'next/image';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { formatPrice, getDisplayPrice } from '@/services/pricingService';
import { formatTaxBreakdown } from '@/services/taxDisplayService';
import { resolveAssetUrl } from '@/utils/media';

const QuotationTemplate = forwardRef(({ items = [], summary = {}, profile = {} }, ref) => {
  const { siteName } = useSiteConfig();

  // Use settings or defaults
  const settings = summary?.settings || {};
  const companyName = settings.invoice_company_name || `${siteName} India Pvt Ltd`;
  const addressLine1 = settings.invoice_company_address_line1 || '123, Industrial Area, Phase 2';
  const addressLine2 = settings.invoice_company_address_line2 || '';
  const city = settings.invoice_company_city || 'Gurugram';
  const state = settings.invoice_company_state || 'Haryana';
  const pincode = settings.invoice_company_pincode || '122001';
  const gstin = settings.invoice_company_gstin || 'GSTIN NOT CONFIGURED';
  const companyEmail = settings.invoice_company_email || 'support@example.com';
  const companyPhone = settings.invoice_company_phone || '1800123456';
  const companyWebsite = settings.invoice_company_website || '';

  // Generate Quote Details
  const now = new Date();
  const quoteNumber =
    summary?.quoteNumber ||
    `QT-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
  
  const quoteDate = now.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  // Valid Until (default 15 days from now or settings override)
  const validUntilDate = new Date(now);
  const validityDays = Number(settings.quotation_validity_days || 15);
  validUntilDate.setDate(validUntilDate.getDate() + validityDays);
  const validUntil = validUntilDate.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  // Tax display mode from backend settings
  const taxDisplayMode = settings.taxPriceDisplayCart || settings.taxPriceDisplayShop || 'excluding';
  const showIncludingTax = taxDisplayMode === 'including';

  // Summary values from backend (same source as cart page)
  const subtotal = summary?.subtotal || 0;                       // product price x qty
  const discount = summary?.discountAmount || 0;
  const taxAmount = summary?.taxAmount || 0;
  const shippingFee = summary?.shippingFee || 0;
  const grandTotal = summary?.grandTotal || summary?.total || 0;
  const taxBreakdown = summary?.taxBreakdown || summary?.taxDetails || {};

  // When including tax: subtotal shown = product price, Total = subtotal + shipping (tax already inside)
  // When excluding tax: subtotal shown = taxableAmount (net), Total = grandTotal (adds tax on top)
  const displaySubtotal = showIncludingTax ? subtotal : (summary?.taxableAmount || subtotal);
  const displayTotal = grandTotal || (showIncludingTax
    ? subtotal + shippingFee - discount
    : displaySubtotal + taxAmount + shippingFee - discount);

  // Terms & Notes
  const quotationTermsText = String(settings.quotation_terms || settings.invoice_terms || '').trim();
  const quotationNotesText = String(settings.quotation_notes || settings.invoice_notes || '').trim();
  const quotationTerms = quotationTermsText
    ? quotationTermsText.split('\n').map((line) => line.trim()).filter(Boolean)
    : [
      'Prices are valid for the stated validity period.',
      'Taxes and availability are subject to confirmation.',
    ];

  // Normalize logo URL so html2canvas can capture it reliably.
  const rawLogo = settings.invoice_logo_url || '/logodark.png';
  const resolvedLogo =
    (typeof rawLogo === 'string' &&
      rawLogo.startsWith('/') &&
      !rawLogo.startsWith('/uploads/') &&
      !rawLogo.startsWith('/api/proxy/'))
      ? rawLogo
      : (resolveAssetUrl(rawLogo) || '/logodark.png');
  const logo = (() => {
    if (!resolvedLogo) return '/logodark.png';
    if (resolvedLogo.startsWith('/api/proxy/')) return resolvedLogo;
    if (resolvedLogo.startsWith('/uploads/')) return `/api/proxy/__raw__${resolvedLogo}`;
    if (resolvedLogo.startsWith('http://') || resolvedLogo.startsWith('https://')) {
      try {
        const parsed = new URL(resolvedLogo);
        if (parsed.pathname.startsWith('/uploads/')) {
          return `/api/proxy/__raw__${parsed.pathname}${parsed.search}`;
        }
      } catch {
        return '/logodark.png';
      }
    }
    return resolvedLogo;
  })();

  return (
    <div ref={ref} className="bg-white text-sm leading-tight text-gray-900 p-8 print:p-6" id="quotation-template">
      {/* Force HEX colors for html2canvas compatibility (fixes 'lab'/'oklch' error) */}
      <style>{`
        /* Layout utilities needed for print-fallback rendering (no Tailwind stylesheet there) */
        .flex { display: flex !important; }
        .flex-row { flex-direction: row !important; }
        .flex-col { flex-direction: column !important; }
        .justify-between { justify-content: space-between !important; }
        .justify-end { justify-content: flex-end !important; }
        .items-start { align-items: flex-start !important; }
        .text-left { text-align: left !important; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        .inline-block { display: inline-block !important; }
        .block { display: block !important; }
        .w-full { width: 100% !important; }
        .w-12 { width: 3rem !important; }
        .w-16 { width: 4rem !important; }
        .w-20 { width: 5rem !important; }
        .w-24 { width: 6rem !important; }
        .w-28 { width: 7rem !important; }
        .w-80 { width: 20rem !important; }
        .max-w-2xl { max-width: 42rem !important; }
        .mx-auto { margin-left: auto !important; margin-right: auto !important; }
        .m-0 { margin: 0 !important; }
        .mb-1 { margin-bottom: 0.25rem !important; }
        .mb-2 { margin-bottom: 0.5rem !important; }
        .mb-4 { margin-bottom: 1rem !important; }
        .mb-6 { margin-bottom: 1.5rem !important; }
        .mt-1 { margin-top: 0.25rem !important; }
        .mt-2 { margin-top: 0.5rem !important; }
        .mt-4 { margin-top: 1rem !important; }
        .mt-5 { margin-top: 1.25rem !important; }
        .pt-4 { padding-top: 1rem !important; }
        .pt-5 { padding-top: 1.25rem !important; }
        .pb-1 { padding-bottom: 0.25rem !important; }
        .pb-4 { padding-bottom: 1rem !important; }
        .p-4 { padding: 1rem !important; }
        .p-8 { padding: 2rem !important; }
        .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
        .py-3 { padding-top: 0.75rem !important; padding-bottom: 0.75rem !important; }
        .px-3 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
        .rounded-lg { border-radius: 0.5rem !important; }
        .table-fixed { table-layout: fixed !important; border-collapse: collapse !important; }
        .leading-tight { line-height: 1.25 !important; }
        .whitespace-nowrap { white-space: nowrap !important; }
        .space-y-1 > * + * { margin-top: 0.25rem !important; }
        .space-y-1\\.5 > * + * { margin-top: 0.375rem !important; }
        .space-y-2 > * + * { margin-top: 0.5rem !important; }
        .text-\\[9px\\] { font-size: 9px !important; }
        .text-\\[10px\\] { font-size: 10px !important; }
        .text-\\[11px\\] { font-size: 11px !important; }
        .text-xs { font-size: 12px !important; }
        .text-sm { font-size: 14px !important; }
        .text-base { font-size: 16px !important; }
        .text-3xl { font-size: 38px !important; line-height: 1.1 !important; }
        .font-medium { font-weight: 500 !important; }
        .font-semibold { font-weight: 600 !important; }
        .font-bold { font-weight: 700 !important; }
        .uppercase { text-transform: uppercase !important; }
        .tracking-wide { letter-spacing: 0.025em !important; }
        .tracking-wider { letter-spacing: 0.05em !important; }

        .bg-white { background-color: #ffffff !important; }
        .bg-gray-50 { background-color: #f9fafb !important; }
        .bg-orange-500 { background-color: #f97316 !important; }
        .text-gray-900 { color: #111827 !important; }
        .text-gray-800 { color: #1f2937 !important; }
        .text-gray-600 { color: #4b5563 !important; }
        .text-gray-500 { color: #6b7280 !important; }
        .text-gray-400 { color: #9ca3af !important; }
        .text-orange-600 { color: #ea580c !important; }
        .text-black { color: #000000 !important; }
        .text-white { color: #ffffff !important; }
        .text-green-600 { color: #16a34a !important; }
        .border-gray-200 { border-color: #e5e7eb !important; }
        .border-gray-100 { border-color: #f3f4f6 !important; }
        .border { border: 1px solid #e5e7eb !important; }
        .border-b { border-bottom: 1px solid #e5e7eb !important; }
        .border-t { border-top: 1px solid #e5e7eb !important; }
        .border-y { border-top: 1px solid #e5e7eb !important; border-bottom: 1px solid #e5e7eb !important; }
        .border-b-2 { border-bottom-width: 2px !important; border-bottom-style: solid !important; }
        .border-t-2 { border-top-width: 2px !important; border-top-style: solid !important; }
      `}</style>
       {/* Header */}
      <div className="flex flex-row justify-between items-start mb-6 pb-4 border-b-2 border-gray-200">
        <div className="flex flex-col">
           <div className="mb-4">
             <Image
               src={logo}
               alt={companyName}
               width={200}
               height={56}
               unoptimized={true}
               className="h-14 w-auto object-contain"
             />
          </div>
          <div className="text-xs text-gray-600 leading-relaxed">
            <p className="font-bold text-gray-900 text-sm mb-1">{companyName}</p>
            <p>{addressLine1}</p>
            {addressLine2 && <p>{addressLine2}</p>}
            <p>{city}, {state} - {pincode}</p>
            {gstin && gstin !== 'GSTIN NOT CONFIGURED' && (
                <p>GSTIN: {gstin}</p>
            )}
            <p className="mt-1">
                 {companyEmail} | {companyPhone}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p
            className="inline-block rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide mb-2"
            style={{ backgroundColor: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' }}
          >
            Not a Tax Invoice
          </p>
          <h2 className="text-3xl font-bold text-black mb-6">QUOTATION</h2>
      <div className="text-xs mt-2 space-y-1.5">
        <p><span className="text-gray-500 w-24 inline-block">Quote No:</span> <span className="font-semibold">{quoteNumber}</span></p>
        <p><span className="text-gray-500 w-24 inline-block">Date:</span> <span className="font-semibold">{quoteDate}</span></p>
        <p><span className="text-gray-500 w-24 inline-block">Valid Until:</span> <span className="font-semibold text-orange-600">{validUntil}</span></p>
      </div>
    </div>
  </div>

      {/* Bill To (Current User or Guest) */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-100 pb-1">Quotation For</h3>
        <div className="text-xs leading-relaxed">
          {(() => {
            const displayName = profile?.name || profile?.fullName || 
                                (profile?.firstName ? `${profile.firstName} ${profile?.lastName || ''}`.trim() : null) ||
                                profile?.email || profile?.phone;
            
            return displayName ? (
             <>
                <p className="font-semibold text-gray-900 text-sm">{displayName}</p>
                {profile.email && <p className="text-gray-600">{profile.email}</p>}
                {profile.phone && <p className="text-gray-600">{profile.phone}</p>}
                {(profile.address || profile.addresses?.[0]) && (
                    <div className="mt-1 text-gray-500">
                        {profile.addresses?.[0]?.line1 && <p>{profile.addresses[0].line1}</p>}
                        {profile.addresses?.[0]?.city && <p>{profile.addresses[0].city}, {profile.addresses[0].state}</p>}
                    </div>
                )}
             </>
            ) : (
                <p className="text-gray-500 italic">Guest User</p>
            );
          })()}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-12" />
            <col />
            <col className="w-16" />
            <col className="w-24" />
            <col className="w-20" />
            <col className="w-28" />
          </colgroup>
          <thead>
            <tr className="bg-gray-50 border-y border-gray-200">
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase">#</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600 uppercase">Item Description</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600 uppercase">Qty</th>
              <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
              <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 uppercase">Tax</th>
              <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody>
          {items.map((item, index) => {
              const pricing = getDisplayPrice(item.product || item, profile);
              const unitPrice = pricing.price || item.price || 0;
              const itemQty = item.quantity || 1;

              // Infer effective tax rate from summary if not explicit on item
              let taxRate = item.taxPercent || 0;
              const summaryTaxable = summary?.taxableAmount || 0;
              const summaryTaxTotal = summary?.taxAmount || 0;
              if (!taxRate && summaryTaxable > 0 && summaryTaxTotal > 0) {
                taxRate = (summaryTaxTotal / summaryTaxable) * 100;
              }

              let displayUnitPrice, lineTax, lineTotal;
              const backendLineTotal = Number(item.lineTotal ?? item.total ?? 0) || 0;

              if (showIncludingTax) {
                // Price shown as-is (it's the product's selling price, tax conceptually inside)
                displayUnitPrice = unitPrice;
                lineTotal = backendLineTotal || (unitPrice * itemQty);
                // Tax shown informational - back-calculate from inclusive price
                const netUnit = taxRate > 0 ? unitPrice / (1 + taxRate / 100) : unitPrice;
                lineTax = (unitPrice - netUnit) * itemQty;
              } else {
                // Exclusive: unit price is base (net), tax added on top
                displayUnitPrice = unitPrice;
                lineTax = (unitPrice * taxRate / 100) * itemQty;
                lineTotal = backendLineTotal || (unitPrice * itemQty + lineTax);
              }

             return (
                <tr
                  key={index}
                  className="border-b border-gray-100 last:border-0"
                  style={{ backgroundColor: index % 2 === 1 ? '#fafafa' : '#ffffff' }}
                >
                  <td className="py-3 px-3 text-xs text-gray-500">{index + 1}</td>
                  <td className="py-3 px-3">
                    <p className="text-xs font-medium text-gray-900">{item.product?.name || item.name || 'Product'}</p>
                    {item.variant && <p className="text-[10px] text-gray-500">{item.variant.name}</p>}
                  </td>
                  <td className="py-3 px-3 text-center text-xs text-gray-600">{itemQty}</td>
                  <td className="py-3 px-3 text-right text-xs text-gray-600 whitespace-nowrap">{formatPrice(displayUnitPrice)}</td>
                  <td className="py-3 px-3 text-right text-xs text-gray-600 whitespace-nowrap">
                    {formatPrice(lineTax)}
                    <span className="text-[9px] block text-gray-400">
                      {taxRate ? `${Number(taxRate).toFixed(0)}%` : showIncludingTax ? 'incl.' : '-'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-xs font-medium text-gray-900 whitespace-nowrap">{formatPrice(lineTotal)}</td>
                </tr>
             );
          })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="flex justify-end mb-6">
        <div className="w-80 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {showIncludingTax ? 'Subtotal (incl. tax)' : 'Subtotal (excl. tax)'}
              </span>
              <span className="font-medium">{formatPrice(displaySubtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Promotional Discount</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            
            {/* Tax - separate line when excluding, informational when including */}
            {showIncludingTax ? (
              <div className="flex justify-between text-gray-500">
                <span>Tax (incl. in price)</span>
                <span>{formatPrice(taxAmount)}</span>
              </div>
            ) : (
              formatTaxBreakdown(taxBreakdown).map((component) => {
                const effectiveRate = displaySubtotal > 0 ? (component.value / displaySubtotal) * 100 : 0;
                const labelWithPercent = effectiveRate > 0 ? `${component.label} (${effectiveRate.toFixed(0)}%)` : component.label;
                return (
                  <div key={component.key} className="flex justify-between text-gray-500">
                    <span>{labelWithPercent}</span>
                    <span>{component.formatted}</span>
                  </div>
                );
              })
            )}

            <div className="flex justify-between">
              <span className="text-gray-600">Shipping Estimate</span>
              <span>{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span>
            </div>
            
            <div className="flex justify-between py-2 border-t-2 border-gray-300 mt-2 text-base">
              <span className="font-bold text-gray-900">Total Estimate</span>
              <span className="font-bold text-orange-600">{formatPrice(displayTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="mt-4 border-t border-gray-200 pt-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Terms & Notes</h3>
        <div className="text-[11px] text-gray-600 space-y-1">
          {quotationTerms.map((line, idx) => (
            <p key={`q-term-${idx}`} className="m-0">* {line}</p>
          ))}
          {quotationNotesText && (
            <p className="m-0"><strong>Note:</strong> {quotationNotesText}</p>
          )}
        </div>
      </div>

      {/* Footer Notes */}
      <div className="border-t border-gray-200 pt-5 text-center">
         <p className="text-xs font-medium text-gray-800 mb-2">Terms & Conditions</p>
         <div className="text-[10px] text-gray-500 space-y-1 max-w-2xl mx-auto">
            <p>1. This is a computer-generated quotation and does not require a signature.</p>
            <p>2. Prices are subject to change without prior notice.</p>
            <p>3. This quotation is valid until {validUntil}.</p>
            <p>4. Shipping charges are estimates and may vary at actual checkout based on location.</p>
         </div>
         <p className="text-xs text-gray-400 mt-4">Generated via {siteName}</p>
      </div>

    </div>
  );
});

QuotationTemplate.displayName = "QuotationTemplate";
export default QuotationTemplate;
