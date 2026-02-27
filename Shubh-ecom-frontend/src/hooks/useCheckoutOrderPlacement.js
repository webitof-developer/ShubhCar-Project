import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import APP_CONFIG from '@/config/app.config';
import * as orderService from '@/services/orderService';
import * as cartService from '@/services/cartService';
import { validateCart, handleError } from '@/utils/errorHandler';

export const useCheckoutOrderPlacement = ({
  items,
  accessToken,
  cartSource,
  clearCart,
  checkoutData,
  summary,
  router,
  setCurrentStep,
}) => {
  const [placingOrder, setPlacingOrder] = useState(false);
  const [redirectingAfterOrder, setRedirectingAfterOrder] = useState(false);

  const handlePaymentConfirm = useCallback(async (paymentMethod) => {
    if (placingOrder) {
      console.log('[CHECKOUT] Order already in progress, ignoring duplicate click');
      return;
    }

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

    try {
      const { getPaymentMethods } = await import('@/services/paymentService');
      const paymentData = await getPaymentMethods();
      const enabledMethods = (paymentData?.methods || []).filter((m) => m.enabled);
      const selectedMethodStillValid = enabledMethods.find((m) => m.code === paymentMethod);

      if (!selectedMethodStillValid) {
        toast.error('Payment method unavailable', {
          description: 'The selected payment method is no longer available. Please choose another.',
        });
        console.warn('[CHECKOUT] Payment method no longer enabled:', paymentMethod);
        setCurrentStep(3);
        return;
      }
    } catch (methodError) {
      console.error('[CHECKOUT] Failed to validate payment method:', methodError);
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

      const isOnlinePayment = paymentMethod !== 'cod';

      if (isOnlinePayment) {
        console.log('[CHECKOUT] Creating order for online payment:', paymentMethod);

        toast.loading('Creating your order...', {
          description: 'Please wait',
        });

        const order = await orderService.placeOrder(accessToken, orderPayload);

        console.log('[CHECKOUT] Order created with pending payment:', order.orderNumber);

        sessionStorage.setItem(
          'pendingOrder',
          JSON.stringify({
            orderId: order._id,
            orderNumber: order.orderNumber,
            paymentMethod,
            total: summary?.grandTotal || 0,
            items: items.length,
          }),
        );

        toast.dismiss();

        console.log('[CHECKOUT] Redirecting to payment processing...');
        setRedirectingAfterOrder(true);
        router.push(`/payment/process?orderId=${order._id}&method=${paymentMethod}`);
      } else {
        console.log('[CHECKOUT] Placing COD order...');

        const order = await orderService.placeOrder(accessToken, orderPayload);

        console.log('[CHECKOUT] Order placed successfully:', order.orderNumber);

        sessionStorage.setItem(
          'lastOrder',
          JSON.stringify({
            orderNumber: order.orderNumber,
            orderId: order._id,
            paymentMethod: 'cod',
            total: summary?.grandTotal || 0,
            items: items.length,
          }),
        );

        clearCart();
        toast.success('Order placed successfully!', {
          description: `Order #${order.orderNumber}`,
        });
        setRedirectingAfterOrder(true);
        router.push(APP_CONFIG.payments.redirects.success);
      }
    } catch (error) {
      console.error('[CHECKOUT] Order placement failed:', error);
      setRedirectingAfterOrder(false);

      const normalizedError = handleError(error, {
        page: 'checkout',
        action: 'place_order',
      });

      if (normalizedError.action === 'redirect_login') {
        setTimeout(() => {
          router.push('/login?returnTo=/checkout');
        }, 2000);
      }
    } finally {
      setPlacingOrder(false);
    }
  }, [placingOrder, items, checkoutData.addressId, summary, accessToken, cartSource, router, clearCart, setCurrentStep]);

  return {
    placingOrder,
    redirectingAfterOrder,
    handlePaymentConfirm,
  };
};

export default useCheckoutOrderPlacement;
