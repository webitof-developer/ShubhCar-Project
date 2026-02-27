"use client";
import { forwardRef } from 'react';
import Image from 'next/image';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { formatPrice, getDisplayPrice } from '@/services/pricingService';
import { formatTaxBreakdown } from '@/services/taxDisplayService';

const QuotationTemplate = forwardRef(({ items = [], summary = {}, profile = {} }, ref) => {
  const { siteName, logoDark, logoLight } = useSiteConfig();

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
  const companyPhone = settings.invoice_company_phone || '+91 1800-123-4567';
  const companyWebsite = settings.invoice_company_website || '';

  // Generate Quote Details
  const now = new Date();
  const quoteNumber = `QT-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  const quoteDate = now.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  // Valid Until (15 days from now)
  const validUntilDate = new Date(now);
  validUntilDate.setDate(validUntilDate.getDate() + 15);
  const validUntil = validUntilDate.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  // Tax display mode from backend settings
  const taxDisplayMode = settings.taxPriceDisplayCart || settings.taxPriceDisplayShop || 'excluding';
  const showIncludingTax = taxDisplayMode === 'including';

  // Summary values from backend (same source as cart page)
  const subtotal = summary?.subtotal || 0;                       // product price Ã— qty
  const discount = summary?.discountAmount || 0;
  const taxAmount = summary?.taxAmount || 0;
  const shippingFee = summary?.shippingFee || 0;
  const grandTotal = summary?.grandTotal || summary?.total || 0;
  const taxBreakdown = summary?.taxBreakdown || summary?.taxDetails || {};

  // When including tax: subtotal shown = product price, Total = subtotal + shipping (tax already inside)
  // When excluding tax: subtotal shown = taxableAmount (net), Total = grandTotal (adds tax on top)
  const displaySubtotal = showIncludingTax ? subtotal : (summary?.taxableAmount || subtotal);
  const displayTotal = showIncludingTax
    ? subtotal + shippingFee - discount
    : grandTotal;

  // Logo
  const logo = settings.invoice_logo_url || logoDark || logoLight;

  return (
    <div ref={ref} className="bg-white text-sm leading-tight text-gray-900 p-8 print:p-8" id="quotation-template">
      {/* Force HEX colors for html2canvas compatibility (fixes 'lab'/'oklch' error) */}
      <style>{`
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
      `}</style>
       {/* Header */}
      <div className="flex flex-row justify-between items-start mb-8 pb-6 border-b-2 border-gray-200">
        <div className="flex flex-col">
           <div className="mb-4">
             {logo ? (
              <Image src={logo} alt={companyName} width={0} height={0} sizes="100vw" className="h-14 w-auto object-contain" />
            ) : (
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">{companyName.substring(0, 2).toUpperCase()}</span>
              </div>
            )}
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
          <h2 className="text-3xl font-bold text-black mb-10">QUOTATION</h2>
          <div className="text-xs mt-10 space-y-1.5">
            <p><span className="text-gray-500 w-24 inline-block">Quote No:</span> <span className="font-semibold">{quoteNumber}</span></p>
            <p><span className="text-gray-500 w-24 inline-block">Date:</span> <span className="font-semibold">{quoteDate}</span></p>
            <p><span className="text-gray-500 w-24 inline-block">Valid Until:</span> <span className="font-semibold text-orange-600">{validUntil}</span></p>
          </div>
        </div>
      </div>

      {/* Bill To (Current User or Guest) */}
      <div className="mb-8">
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
      <div className="mb-8">
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
              <th className="text-right py-3 px-3 text-xs font-semibold text-gray-600 uppercase">Tax (%)</th>
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

              if (showIncludingTax) {
                // Price shown as-is (it's the product's selling price, tax conceptually inside)
                displayUnitPrice = unitPrice;
                lineTotal = unitPrice * itemQty;
                // Tax shown informational â€” back-calculate from inclusive price
                const netUnit = taxRate > 0 ? unitPrice / (1 + taxRate / 100) : unitPrice;
                lineTax = (unitPrice - netUnit) * itemQty;
              } else {
                // Exclusive: unit price is base (net), tax added on top
                displayUnitPrice = unitPrice;
                lineTax = (unitPrice * taxRate / 100) * itemQty;
                lineTotal = unitPrice * itemQty + lineTax;
              }

             return (
                <tr key={index} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-3 text-xs text-gray-500">{index + 1}</td>
                  <td className="py-3 px-3">
                    <p className="text-xs font-medium text-gray-900">{item.product?.name || item.name || 'Product'}</p>
                    {item.variant && <p className="text-[10px] text-gray-500">{item.variant.name}</p>}
                  </td>
                  <td className="py-3 px-3 text-center text-xs text-gray-600">{itemQty}</td>
                  <td className="py-3 px-3 text-right text-xs text-gray-600 whitespace-nowrap">{formatPrice(displayUnitPrice)}</td>
                  <td className="py-3 px-3 text-right text-xs text-gray-600 whitespace-nowrap">
                    {formatPrice(lineTax)}
                    {showIncludingTax && <span className="text-[9px] block text-gray-400">incl.</span>}
                  </td>
                  <td className="py-3 px-3 text-right text-xs font-medium text-gray-900 whitespace-nowrap">{formatPrice(lineTotal)}</td>
                </tr>
             );
          })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="flex justify-end mb-8">
        <div className="w-80 bg-gray-50 p-4 rounded-lg">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {showIncludingTax ? 'Subtotal (incl. tax)' : 'Subtotal (excl. tax)'}
              </span>
              <span className="font-medium">{formatPrice(displaySubtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(discount)}</span>
              </div>
            )}
            
            {/* Tax â€” separate line when excluding, informational when including */}
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
            
            <div className="flex justify-between py-2 border-t border-gray-200 mt-2 text-base">
              <span className="font-bold text-gray-900">Total Estimate</span>
              <span className="font-bold text-orange-600">{formatPrice(displayTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="border-t border-gray-200 pt-6 text-center">
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
