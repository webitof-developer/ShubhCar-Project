"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import InvoiceTemplate from '@/components/invoice/InvoiceTemplate';
import { InvoiceShell } from '@/components/invoice/InvoiceShell';
import { Download, ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/app.config';
import './print.css';
import { logger } from '@/utils/logger';

const InvoicePage = () => {
  const { orderId } = useParams();
  const router = useRouter();
  const { accessToken, isAuthenticated, loading: authLoading } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [settings, setSettings] = useState({});
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  const [viewerMessage, setViewerMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      if (authLoading) return;
      if (!isAuthenticated || !orderId) {
        setInvoiceLoading(false);
        return;
      }

      try {
        const invoiceResponse = await fetch(`${API_BASE_URL}/invoices/my/order/${orderId}`, {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
          credentials: 'include',
        });

        if (!invoiceResponse.ok) {
          const body = await invoiceResponse.json().catch(() => ({}));
          setViewerMessage(
            body?.message ||
              'Invoice is not available yet. It becomes available after successful payment capture.',
          );
          setInvoice(null);
          return;
        }

        const invoicePayload = await invoiceResponse.json();
        setInvoice(invoicePayload?.data?.invoice || invoicePayload?.invoice || null);

        try {
          const response = await fetch(`${API_BASE_URL}/settings/public`);
          if (response.ok) {
            const settingsData = await response.json();
            setSettings(settingsData.data || settingsData || {});
          }
        } catch (err) {
          logger.error('Failed to fetch invoice settings:', err);
        }
      } catch (error) {
        logger.error('Failed to load invoice:', error);
        setInvoice(null);
      } finally {
        setInvoiceLoading(false);
      }
    };

    load();
  }, [orderId, accessToken, isAuthenticated, authLoading]);

  const handlePdfAction = () => {
    window.print();
  };

  if (authLoading || invoiceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading invoice...</span>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-lg px-4">
          <h1 className="text-2xl font-bold mb-4">Invoice Unavailable</h1>
          <p className="text-sm text-muted-foreground mb-4">
            {viewerMessage || 'Invoice not found for this order.'}
          </p>
          <Button onClick={() => router.push('/orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const adaptedOrder = {
    _id: invoice._id,
    type: invoice.type,
    status: invoice.status || 'issued',
    invoiceNumber: invoice.invoiceNumber,
    orderNumber: invoice.orderSnapshot?.orderNumber || invoice.invoiceNumber || invoice._id,
    relatedInvoiceNumber: invoice.displayMeta?.originalInvoiceNumber || '',
    placedAt: invoice.orderSnapshot?.placedAt || invoice.issuedAt || invoice.createdAt,
    createdAt: invoice.createdAt,
    paymentMethod: invoice.paymentSnapshot?.paymentMethod || invoice.orderSnapshot?.paymentMethod || '-',
    paymentStatus: invoice.paymentSnapshot?.status || '-',
    subtotal: Number(invoice.totals?.subtotal || 0),
    discountAmount: Number(invoice.totals?.discountTotal || 0),
    taxAmount: Number(invoice.totals?.taxTotal || 0),
    shippingFee: Number(invoice.totals?.shippingFee || 0),
    grandTotal: Number(invoice.totals?.grandTotal || 0),
    taxBreakdown: invoice.totals?.taxBreakdown || { cgst: 0, sgst: 0, igst: 0 },
    paymentSnapshot: invoice.paymentSnapshot || null,
    refundMeta: invoice.refundMeta || {},
    cancelReason: invoice.displayMeta?.refundReason || '',
    cancelDetails: invoice.displayMeta?.cancelDetails || '',
  };

  const adaptedItems = (invoice.items || []).map((item, index) => ({
    _id: `${item.sku || 'item'}-${index}`,
    product: { name: item.name || 'Product' },
    quantity: Number(item.quantity || 0),
    price: Number(item.unitPrice || 0),
    taxAmount: Number(item.taxAmount || 0),
    taxPercent: Number(item.taxPercent || 0),
    total: Number(item.lineTotal || 0),
  }));

  const customerAddress = invoice.customerSnapshot?.address || {};
  const adaptedAddress = {
    fullName: invoice.customerSnapshot?.name || '-',
    line1: customerAddress.line1 || customerAddress.addressLine1 || '-',
    line2: customerAddress.line2 || customerAddress.addressLine2 || '',
    city: customerAddress.city || '-',
    state: customerAddress.state || '-',
    postalCode: customerAddress.postalCode || customerAddress.pincode || customerAddress.zip || '-',
    phone: invoice.customerSnapshot?.phone || '-',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b print:hidden sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.push('/orders')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Orders
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePdfAction}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button onClick={handlePdfAction}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 print:p-0 invoice-wrapper">
        <div className="max-w-4xl mx-auto">
          <InvoiceShell>
            <InvoiceTemplate
              order={adaptedOrder}
              items={adaptedItems}
              address={adaptedAddress}
              settings={settings}
            />
          </InvoiceShell>
        </div>
      </div>
    </div>
  );
};

export default InvoicePage;
