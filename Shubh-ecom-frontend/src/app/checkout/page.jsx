"use client";

/**
 * Checkout Page - Phase 6 Stabilization
 * 
 * CART-ORDER CONTRACT (Current State):
 * - Cart is stored in FRONTEND localStorage (CartContext)
 * - Backend expects cart in Cart collection (NOT YET IMPLEMENTED)
 * - Order placement sends addressId + minimal data
 * - Cart items are validated before submission
 * 
 * TODO: CART_SYNC - When implementing backend cart sync:
 * 1. Sync cart to backend Cart collection before checkout
 * 2. Remove cart validation (backend will validate)
 * 3. Backend will read cart from Cart collection during order placement
 * 4. Frontend cart becomes mirror of backend cart
 * 
 * ASSUMPTIONS:
 * - Cart items have valid product references
 * - Prices exist on product pricing fields
 * - Quantities are positive integers
 * - addressId is valid and exists in UserAddress collection
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';
import { AddressStep } from '@/components/checkout/AddressStep';
import { OrderPreview } from '@/components/checkout/OrderPreview';
import { PaymentStep } from '@/components/checkout/PaymentStep';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import * as orderService from '@/services/orderService';
import { validateCart, handleError } from '@/utils/errorHandler';
import APP_CONFIG from '@/config/app.config';
import * as cartService from '@/services/cartService';

// Step definitions - owned by page
const CHECKOUT_STEPS = [
  { id: 1, name: 'Address', label: 'Shipping' },
  { id: 2, name: 'Preview', label: 'Review Order' },
  { id: 3, name: 'Payment', label: 'Payment' },
];

const Checkout = () => {
  const router = useRouter();
  const { items, clearCart, cartSource } = useCart();
  const { isAuthenticated, accessToken, loading: authLoading } = useAuth();
  
  // Page owns all state
  const [currentStep, setCurrentStep] = useState(1);
  const [checkoutData, setCheckoutData] = useState({
    addressId: null, // Changed from address object to addressId
    paymentMethod: 'cod',
  });
  const [placingOrder, setPlacingOrder] = useState(false);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Auth check - redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('[CHECKOUT] User not authenticated, redirecting to login');
      router.push('/login?returnTo=/checkout');
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchSummary = useCallback(async () => {
    if (!accessToken) return;
    if (!items.length) {
      setSummary(null);
      return;
    }
    setSummaryLoading(true);
    try {
      const data = await cartService.getCartSummary(accessToken, checkoutData.addressId);
      setSummary(data);
    } catch (error) {
      console.error('[CHECKOUT] Failed to fetch summary:', error);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [accessToken, items, checkoutData.addressId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Step navigation handlers
  const handleAddressNext = (addressId) => {
    // Now receives addressId instead of full address object
    setCheckoutData((prev) => ({ ...prev, addressId }));
    setCurrentStep(2);
  };

  const handlePreviewBack = () => {
    setCurrentStep(1);
  };

  const handlePreviewNext = () => {
    setCurrentStep(3);
  };

  const handlePaymentBack = () => {
    setCurrentStep(2);
  };

  const handlePaymentConfirm = async (paymentMethod) => {
    /**
     * Phase 14: Payment Gateway Simulation
     * - COD: Normal checkout flow (existing)
     * - Online Payment: Simulate payment gateway redirect with timeout
     * - No real payment SDKs or backend payment logic
     */

    // Prevent duplicate submissions
    if (placingOrder) {
      console.log('[CHECKOUT] Order already in progress, ignoring duplicate click');
      return;
    }

    // Validate cart items (Phase 6: Frontend validation)
    // TODO: CART_SYNC - Remove this validation when backend cart sync is implemented
    const cartValidation = validateCart(items);
    if (!cartValidation.valid) {
      toast.error('Cart Validation Failed', {
        description: cartValidation.error,
      });
      console.error('[CHECKOUT] Cart validation failed:', cartValidation.error);
      return;
    }

    if (!checkoutData.addressId) {
      toast.error('Missing shipping address', {
        description: 'Please select a shipping address before placing your order.',
      });
      console.error('[CHECKOUT] Missing shipping address id');
      return;
    }

    if (!summary || !summary.cartId) {
      toast.error('Cart not ready', {
        description: 'Cart summary is missing. Please refresh and try again.',
      });
      console.error('[CHECKOUT] Missing cart summary/cartId', { summary });
      return;
    }

    const totals = {
      subtotal: summary.subtotal,
      taxAmount: summary.taxAmount,
      shippingFee: summary.shippingFee,
      grandTotal: summary.grandTotal,
    };
    const totalsValid = Object.values(totals).every((value) => Number.isFinite(value));
    if (!totalsValid) {
      toast.error('Invalid totals', {
        description: 'Order totals are invalid. Please refresh and try again.',
      });
      console.error('[CHECKOUT] Invalid totals in summary', totals);
      return;
    }

    // Validate payment method is still available (edge case: admin disabled mid-checkout)
    try {
      const { getPaymentMethods } = await import('@/services/paymentService');
      const paymentData = await getPaymentMethods();
      const enabledMethods = (paymentData?.methods || []).filter(m => m.enabled);
      const selectedMethodStillValid = enabledMethods.find(m => m.code === paymentMethod);
      
      if (!selectedMethodStillValid) {
        toast.error('Payment method unavailable', {
          description: 'The selected payment method is no longer available. Please choose another.',
        });
        console.warn('[CHECKOUT] Payment method no longer enabled:', paymentMethod);
        setCurrentStep(3); // Go back to payment step
        return;
      }
    } catch (methodError) {
      console.error('[CHECKOUT] Failed to validate payment method:', methodError);
      // Continue anyway - backend will validate
    }


    setPlacingOrder(true);

    try {
      const hasValidBackendItems = items.every((item) => {
        const productId = item.product?._id || item.product?.id || item.productId;
        return typeof productId === 'string' && productId.length === 24;
      });

      if (!hasValidBackendItems) {
        toast.error('Some items cannot be ordered', {
          description: 'Please remove demo items from cart and try again.',
        });
        return;
      }

      if (accessToken && items.length > 0) {
        try {
          const backendCart = await cartService.getCart(accessToken);
          const backendCount = backendCart?.items?.length || 0;
          if (backendCount === 0 || cartSource !== 'backend') {
            await cartService.replaceCart(accessToken, items);
          }
        } catch (syncError) {
          console.error('[CHECKOUT] Failed to sync cart before order:', syncError);
          toast.error('Unable to sync cart. Please try again.');
          return;
        }
      }

      const orderPayload = {
        paymentMethod,
        shippingAddressId: checkoutData.addressId,
        billingAddressId: checkoutData.addressId,
        notes: '',
        cartId: summary.cartId,
        totals,
        couponCode: summary?.couponCode || undefined,
      };

      // Check if this is an online payment method (not COD)
      const isOnlinePayment = paymentMethod !== 'cod';
      
      if (isOnlinePayment) {
        // ONLINE PAYMENT FLOW - FIXED (Order First, Payment Later)
        console.log('[CHECKOUT] Creating order for online payment:', paymentMethod);
        
        toast.loading('Creating your order...', {
          description: 'Please wait',
        });

        // 1. CREATE ORDER FIRST (with paymentStatus: 'pending')
        const order = await orderService.placeOrder(accessToken, orderPayload);

        console.log('[CHECKOUT] Order created with pending payment:', order.orderNumber);

        // 2. Store order data for payment processing
        sessionStorage.setItem('pendingOrder', JSON.stringify({
          orderId: order._id,
          orderNumber: order.orderNumber,
          paymentMethod,
          total: summary?.grandTotal || 0,
          items: items.length,
        }));

        toast.dismiss();
        
        // 3. Redirect to payment processing page
        console.log('[CHECKOUT] Redirecting to payment processing...');
        router.push(`/payment/process?orderId=${order._id}&method=${paymentMethod}`);
        
        // Note: Cart will be cleared AFTER successful payment in callback
      } else {
        // COD FLOW (Existing behavior - no simulation)
        console.log('[CHECKOUT] Placing COD order...');
        
        const order = await orderService.placeOrder(accessToken, orderPayload);

        console.log('[CHECKOUT] Order placed successfully:', order.orderNumber);

        sessionStorage.setItem('lastOrder', JSON.stringify({
          orderNumber: order.orderNumber,
          orderId: order._id,
          paymentMethod: 'cod',
          total: summary?.grandTotal || 0,
          items: items.length,
        }));

        clearCart();
        toast.success('Order placed successfully!', {
          description: `Order #${order.orderNumber}`,
        });
        router.push(APP_CONFIG.payments.redirects.success);
      }
    } catch (error) {
      console.error('[CHECKOUT] Order placement failed:', error);
      
      // Centralized error handling (Phase 6)
      const normalizedError = handleError(error, {
        page: 'checkout',
        action: 'place_order',
      });

      // Handle auth errors - redirect to login
      if (normalizedError.action === 'redirect_login') {
        setTimeout(() => {
          router.push('/login?returnTo=/checkout');
        }, 2000);
      }

      // Don't clear cart on error - allow retry
    } finally {
      setPlacingOrder(false);
    }
  };

  const renderContent = () => {
    if (authLoading) {
      return (
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (items.length === 0) {
      return (
        <div className="container mx-auto px-4 py-16 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Add some products to checkout
          </p>
          <Link href="/">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      );
    }

    return (
      <>
        {/* Header */}
        <div className="bg-secondary/30 border-b border-border/50">
          <div className="container mx-auto px-4 py-4 md:py-6">
            <h1 className="text-xl md:text-2xl font-bold">Checkout</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Complete your order in {CHECKOUT_STEPS.length - currentStep + 1} step
              {CHECKOUT_STEPS.length - currentStep + 1 > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="container mx-auto py-6 md:py-8">
          {/* Purely presentational stepper - no logic */}
          <CheckoutStepper currentStep={currentStep} steps={CHECKOUT_STEPS} />

          {/* Step Content */}
          <div className="mt-6 md:mt-8">
            {currentStep === 1 && (
              <AddressStep
                onNext={handleAddressNext}
                initialAddressId={checkoutData.addressId}
              />
            )}

            {currentStep === 2 && (
              <OrderPreview
                address={checkoutData.addressId}
                cartItems={items}
                summary={summary}
                summaryLoading={summaryLoading}
                onBack={handlePreviewBack}
                onNext={handlePreviewNext}
              />
            )}

            {currentStep === 3 && (
              <PaymentStep onBack={handlePaymentBack} onConfirm={handlePaymentConfirm} />
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
};

export default Checkout;
