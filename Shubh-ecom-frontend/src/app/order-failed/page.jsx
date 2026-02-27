"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { XCircle, AlertTriangle, ArrowLeft, RefreshCcw, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import APP_CONFIG from '@/config/app.config';

export default function PaymentFailedPage() {
  const router = useRouter();
  const [paymentData] = useState(() => {
    if (typeof window === 'undefined') return null;
    const storedPaymentData = sessionStorage.getItem('failedPayment');
    if (!storedPaymentData) return null;
    try {
      return JSON.parse(storedPaymentData);
    } catch (error) {
      console.error('[PAYMENT_FAILED] Failed to parse payment data:', error);
      return null;
    }
  });

  const handleRetry = () => {
    // Clear failed payment data
    sessionStorage.removeItem('failedPayment');
    // Redirect back to checkout
    router.push('/checkout');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Error Icon */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-4 animate-in zoom-in duration-300">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Payment Failed
            </h1>
            <p className="text-muted-foreground">
              We couldn&apos;t process your payment. Please try again or use a different payment method.
            </p>
          </div>

          {/* Failure Details Card */}
          <Card className="p-6 mb-6 border-zinc-200">
            <div className="space-y-4">
              {/* Error Message */}
              <div className="pb-4 border-b border-zinc-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Transaction Declined</p>
                    <p className="text-sm text-muted-foreground">
                      {paymentData?.reason || 'The payment gateway was unable to process your transaction. This could be due to insufficient funds, incorrect card details, or a technical issue.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Method Attempted */}
              {paymentData?.paymentMethod && (
                <div className="pb-4 border-b border-zinc-200">
                  <p className="text-sm text-muted-foreground mb-1">Payment Method Attempted</p>
                  <p className="font-medium capitalize">
                    {APP_CONFIG.payments.methods[paymentData.paymentMethod]?.displayName || paymentData.paymentMethod}
                  </p>
                </div>
              )}

              {/* Amount */}
              {paymentData?.amount && (
                <div className="pb-4 border-b border-zinc-200">
                  <p className="text-sm text-muted-foreground mb-1">Amount</p>
                  <p className="text-xl font-semibold">Rs. {paymentData.amount.toLocaleString()}</p>
                </div>
              )}

              {/* Alternative Options */}
              <div className="bg-warning/5 rounded-lg p-4">
                <h3 className="font-semibold mb-3">What You Can Do:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <RefreshCcw className="w-4 h-4 mt-0.5 flex-shrink-0 text-warning" />
                    <span><strong>Try Again:</strong> Click the retry button below to go back to checkout</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Badge className="mt-0.5 flex-shrink-0 bg-success text-white">COD</Badge>
                    <span><strong>Use Cash on Delivery:</strong> Pay when you receive your order</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Phone className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                    <span><strong>Contact Support:</strong> Call us at {APP_CONFIG.site.contact.phone}</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full" size="lg">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Retry Payment
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/cart" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Cart
                </Button>
              </Link>
              <Link href={`mailto:${APP_CONFIG.site.contact.email}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Your cart items are still saved. No charges were made to your account.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
