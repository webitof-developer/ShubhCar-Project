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

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import * as cartService from '@/services/cartService';
import * as checkoutDraftService from '@/services/checkoutDraftService';
import { useCheckoutOrderPlacement } from '@/hooks/useCheckoutOrderPlacement';
import { toast } from 'sonner';

// Step definitions - owned by page
const CHECKOUT_STEPS = [
  { id: 1, name: 'Address', label: 'Shipping' },
  { id: 2, name: 'Preview', label: 'Review Order' },
  { id: 3, name: 'Payment', label: 'Payment' },
];

const CheckoutInner = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draftId');
  const { items, clearCart, cartSource } = useCart();
  const { isAuthenticated, accessToken, loading: authLoading } = useAuth();
  
  // Page owns all state
  const [currentStep, setCurrentStep] = useState(1);
  const [checkoutData, setCheckoutData] = useState({
    addressId: null, // Changed from address object to addressId
    paymentMethod: 'cod',
  });
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const { placingOrder, redirectingAfterOrder, handlePaymentConfirm } = useCheckoutOrderPlacement({
    items,
    accessToken,
    cartSource,
    clearCart,
    checkoutData,
    summary,
    checkoutDraftId: draftId,
    router,
    setCurrentStep,
  });

  // Auth check - redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      console.log('[CHECKOUT] User not authenticated, redirecting to login');
      const returnTo = draftId ? `/checkout?draftId=${draftId}` : '/checkout';
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [isAuthenticated, authLoading, router, draftId]);

  useEffect(() => {
    const loadDraft = async () => {
      if (!draftId || !isAuthenticated || !accessToken) return;

      setDraftLoading(true);
      try {
        const draft = await checkoutDraftService.getDraft(accessToken, draftId);
        const shippingAddressId = draft?.addressIds?.shippingAddressId || null;

        if (shippingAddressId) {
          setCheckoutData((prev) => ({
            ...prev,
            addressId: prev.addressId || shippingAddressId,
          }));
        }
      } catch (error) {
        console.error('[CHECKOUT] Failed to load checkout draft:', error);
        toast.error(error.message || 'Checkout draft is unavailable');
        router.push('/cart');
      } finally {
        setDraftLoading(false);
      }
    };

    loadDraft();
  }, [draftId, isAuthenticated, accessToken, router]);

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

  const renderContent = () => {
    if (authLoading || draftLoading) {
      return (
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    if (placingOrder || redirectingAfterOrder) {
      return (
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Processing your order, please wait...</p>
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

  return renderContent();
};

export default function CheckoutPage() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }
      >
        <CheckoutInner />
      </Suspense>
    </Layout>
  );
}

