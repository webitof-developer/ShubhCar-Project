//src/app/order-confirmation/page.jsx

"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Package, Home, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import * as orderService from '@/services/orderService';
import { handleError } from '@/utils/errorHandler';
import { formatPrice } from '@/services/pricingService';
import { getTaxLabel } from '@/services/taxDisplayService';
import { getOrderStatusLabel } from '@/constants/orderStatus';

const OrderConfirmationContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { accessToken, isAuthenticated, loading: authLoading } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      router.push('/');
      return;
    }

    const fetchOrder = async () => {
      if (authLoading) {
        return;
      }

      if (!accessToken || !isAuthenticated) {
        setError({
          type: 'auth',
          message: 'Please log in to view your order',
        });
        setTimeout(() => {
          router.push(`/login?returnTo=/order-confirmation?orderId=${orderId}`);
        }, 2000);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const orderData = await orderService.getOrder(accessToken, orderId);
        if (orderData?.order) {
          setOrder(orderData.order);
        } else {
          setError({
            type: 'not_found',
            message: 'Order not found',
          });
        }
      } catch (err) {
        const normalizedError = handleError(err, {
          page: 'order_confirmation',
          action: 'fetch_order',
        });

        setError({
          type: normalizedError.type,
          message: normalizedError.message,
        });

        if (normalizedError.action === 'redirect_login') {
          setTimeout(() => {
            router.push(`/login?returnTo=/order-confirmation?orderId=${orderId}`);
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, accessToken, isAuthenticated, authLoading, router]);

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your order...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-2xl">
          <Card className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">
              {error.type === 'auth' ? 'Authentication Required' : 'Order Not Found'}
            </h2>
            <p className="text-muted-foreground mb-6">{error.message}</p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              {error.type !== 'auth' && (
                <Link href="/orders">
                  <Button>
                    <Package className="w-4 h-4 mr-2" />
                    View All Orders
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Order not found</p>
          <Link href="/" className="mt-4 inline-block">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const subtotal = order.subtotal || 0;
  const tax = order.taxAmount || 0;
  const shipping = order.shippingFee || 0;
  const total = order.grandTotal || 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Order Placed Successfully!</h1>
          <p className="text-muted-foreground">
            Thank you for your order. We&apos;ll send you a confirmation email shortly.
          </p>
        </div>

        <Card className="p-4 md:p-6 mb-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-lg font-semibold">{order.orderNumber}</p>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground">Order Status</p>
              <p className="text-sm font-medium capitalize">
                {getOrderStatusLabel(order.orderStatus)}
              </p>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{getTaxLabel()}</span>
                <span className="font-medium">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium text-green-600">
                  {shipping === 0 ? 'Free' : formatPrice(shipping)}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-base pt-2">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-semibold mb-1">Payment Method</p>
              <p className="text-sm text-muted-foreground capitalize">
                {order.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 'Online Payment'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Payment Status: <span className="capitalize">{order.paymentStatus}</span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6 mb-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">What Happens Next?</h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400">1.</span>
              <span>You&apos;ll receive an order confirmation email with tracking details</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400">2.</span>
              <span>Your order will be processed and shipped within 1-2 business days</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400">3.</span>
              <span>You can track your order status in your orders page</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400">4.</span>
              <span>
                {order.paymentMethod === 'cod'
                  ? 'Pay with cash when you receive your order'
                  : 'Payment has been processed successfully'}
              </span>
            </li>
          </ul>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link href="/orders" className="flex-1">
            <Button className="w-full">
              <Package className="w-4 h-4 mr-2" />
              View Orders
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

const OrderConfirmation = () => {
  return (
    <Suspense fallback={
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
};

export default OrderConfirmation;
