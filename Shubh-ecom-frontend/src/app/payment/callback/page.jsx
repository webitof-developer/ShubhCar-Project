"use client";

/**
 * Payment Callback Page
 * 
 * Handles the redirect from payment gateway (or simulation).
 * Updates order status and redirects to appropriate result page.
 * 
 * Flow:
 * 1. Receives orderId, status, and method from payment gateway
 * 2. Verifies payment status with backend (TODO: implement backend endpoint)
 * 3. Updates order paymentStatus (pending → paid/failed)
 * 4. Clears cart on success
 * 5. Redirects to thank-you or payment-failed page
 */

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import APP_CONFIG from '@/config/app.config';
import { confirmPayment, getPaymentStatus } from '@/services/paymentService';

const PaymentCallbackContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const { accessToken } = useAuth();
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState(null);

  const orderId = searchParams.get('orderId');
  const status = searchParams.get('status'); // 'success' or 'failed'
  const paymentMethod = searchParams.get('method');
  const paymentId = searchParams.get('paymentId');

  useEffect(() => {
    // Validate required parameters
    if (!orderId || !status) {
      console.error('[PAYMENT_CALLBACK] Missing orderId or status');
      router.push('/checkout');
      return;
    }

    console.log('[PAYMENT_CALLBACK] Processing callback for order:', orderId);
    console.log('[PAYMENT_CALLBACK] Payment status:', status);

    const handleCallback = async () => {
      try {
        setProcessing(true);

        // Get pending order data from session
        const pendingOrderData = sessionStorage.getItem('pendingOrder');
        const orderData = pendingOrderData ? JSON.parse(pendingOrderData) : null;

        let resolvedStatus = status;

        if (paymentId && accessToken) {
          try {
            const confirmation = await confirmPayment(accessToken, paymentId);
            const normalized = confirmation?.status || '';
            if (normalized === 'success') {
              resolvedStatus = 'success';
            } else if (normalized === 'failed' || normalized === 'refunded') {
              resolvedStatus = 'failed';
            }
          } catch (confirmError) {
            console.error('[PAYMENT_CALLBACK] Confirm failed:', confirmError);
          }
        }

        if (resolvedStatus === 'success' && paymentId && accessToken) {
          // Poll backend for final payment status (webhook may take time)
          for (let attempt = 0; attempt < 5; attempt += 1) {
            const paymentStatus = await getPaymentStatus(accessToken, paymentId);
            const normalized = paymentStatus?.status || '';
            if (normalized === 'success') {
              resolvedStatus = 'success';
              break;
            }
            if (normalized === 'failed') {
              resolvedStatus = 'failed';
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        if (resolvedStatus === 'success') {
          // Payment successful
          console.log('[PAYMENT_CALLBACK] Payment successful');

          // TODO: Call backend to update order.paymentStatus to 'paid'
          // await fetch(`/api/orders/${orderId}/confirm-payment`, { method: 'POST' });

          // Store order data for thank-you page
          sessionStorage.setItem('lastOrder', JSON.stringify({
            orderNumber: orderData?.orderNumber || orderId,
            orderId: orderId,
            paymentMethod: paymentMethod || orderData?.paymentMethod,
            total: orderData?.total || 0,
            items: orderData?.items || 0,
          }));

          // Clear cart on successful payment
          clearCart();

          // Clean up pending order data
          sessionStorage.removeItem('pendingOrder');

          setResult('success');

          // Redirect to success page
          setTimeout(() => {
            router.push(APP_CONFIG.payments.redirects.success);
          }, 1500);

        } else {
          // Payment failed
          console.log('[PAYMENT_CALLBACK] Payment failed');

          // TODO: Call backend to update order.paymentStatus to 'failed'
          // await fetch(`/api/orders/${orderId}/fail-payment`, { method: 'POST' });

          // Store failure data for payment-failed page
          sessionStorage.setItem('failedPayment', JSON.stringify({
            orderId: orderId,
            orderNumber: orderData?.orderNumber || orderId,
            paymentMethod: paymentMethod || orderData?.paymentMethod,
            amount: orderData?.total || 0,
            reason: 'The payment gateway was unable to process your transaction.',
          }));

          setResult('failed');

          // Redirect to failure page
          setTimeout(() => {
            router.push(APP_CONFIG.payments.redirects.failure);
          }, 1500);
        }
      } catch (error) {
        console.error('[PAYMENT_CALLBACK] Error processing callback:', error);
        toast.error('Payment verification failed', {
          description: 'Please contact support if amount was deducted.',
        });

        // Redirect to checkout on error
        setTimeout(() => {
          router.push('/checkout');
        }, 2000);
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();
  }, [orderId, status, paymentMethod, router, clearCart, paymentId, accessToken]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Processing State */}
            {processing && (
              <>
                <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Verifying Payment</h1>
                <p className="text-muted-foreground">
                  Please wait while we confirm your payment...
                </p>
              </>
            )}

            {/* Success State */}
            {!processing && result === 'success' && (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2 text-green-600">Payment Successful!</h1>
                <p className="text-muted-foreground">
                  Redirecting to order confirmation...
                </p>
              </>
            )}

            {/* Failed State */}
            {!processing && result === 'failed' && (
              <>
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2 text-red-600">Payment Failed</h1>
                <p className="text-muted-foreground">
                  Redirecting to payment options...
                </p>
              </>
            )}

            {/* Order Info */}
            {orderId && (
              <div className="bg-secondary/20 rounded-lg p-4 mt-6">
                <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                <p className="font-mono text-sm font-medium">{orderId}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const PaymentCallbackPage = () => {
  return (
    <Suspense fallback={
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying...</p>
          </div>
        </div>
      </Layout>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
};

export default PaymentCallbackPage;
