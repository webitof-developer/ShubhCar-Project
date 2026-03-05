import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import APP_CONFIG from '@/config/app.config';
import * as orderService from '@/services/orderService';
import * as cartService from '@/services/cartService';
import * as checkoutDraftService from '@/services/checkoutDraftService';
import { validateCart, handleError } from '@/utils/errorHandler';
import { logger } from '@/utils/logger';

export const useCheckoutOrderPlacement = ({
  items,
  accessToken,
  cartSource,
  clearCart,
  checkoutData,
  summary,
  checkoutDraftId,
  router,
  setCurrentStep,
}) => {
  const [placingOrder, setPlacingOrder] = useState(false);
  const [redirectingAfterOrder, setRedirectingAfterOrder] = useState(false);

  const handlePaymentConfirm = useCallback(async (paymentMethod) => {
    if (placingOrder) {
      return;
    }

    const cartValidation = validateCart(items);
    if (!cartValidation.valid) {
      toast.error('Cart Validation Failed', {
        description: cartValidation.error,
      });
      logger.error('[CHECKOUT] Cart validation failed:', cartValidation.error);
      return;
    }

    if (!checkoutData.addressId) {
      toast.error('Missing shipping address', {
        description: 'Please select a shipping address before placing your order.',
      });
      logger.error('[CHECKOUT] Missing shipping address id');
      return;
    }

    if (!summary || !summary.cartId) {
      toast.error('Cart not ready', {
        description: 'Cart summary is missing. Please refresh and try again.',
      });
      logger.error('[CHECKOUT] Missing cart summary/cartId', { summary });
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
      logger.error('[CHECKOUT] Invalid totals in summary', totals);
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
        logger.warn('[CHECKOUT] Payment method no longer enabled:', paymentMethod);
        setCurrentStep(3);
        return;
      }
    } catch (methodError) {
      logger.error('[CHECKOUT] Failed to validate payment method:', methodError);
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
          logger.error('[CHECKOUT] Failed to sync cart before order:', syncError);
          toast.error('Unable to sync cart. Please try again.');
          return;
        }
      }

      const orderPayload = {
        paymentMethod,
        shippingAddressId: checkoutData.addressId,
        billingAddressId: checkoutData.addressId,
        checkoutDraftId: checkoutDraftId || undefined,
        notes: '',
        cartId: summary.cartId,
        totals,
        couponCode: summary?.couponCode || undefined,
      };

      const isOnlinePayment = paymentMethod !== 'cod';

      if (isOnlinePayment) {
        const order = await orderService.placeOrder(accessToken, orderPayload);

        sessionStorage.setItem(
          'pendingOrder',
          JSON.stringify({
            orderId: order._id,
            orderNumber: order.orderNumber,
            paymentMethod,
            checkoutDraftId: checkoutDraftId || null,
            total: summary?.grandTotal || 0,
            items: items.length,
          }),
        );
        setRedirectingAfterOrder(true);
        const draftQuery = checkoutDraftId ? `&draftId=${encodeURIComponent(checkoutDraftId)}` : '';
        router.push(`/payment/process?orderId=${order._id}&method=${paymentMethod}${draftQuery}`);
      } else {

        const order = await orderService.placeOrder(accessToken, orderPayload);

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
      logger.error('[CHECKOUT] Order placement failed:', error);
      setRedirectingAfterOrder(false);
      const isDraftAlreadyProcessed =
        Number(error?.status) === 409 &&
        (String(error?.code || '').toUpperCase() === 'DRAFT_INVALID' ||
          /checkout draft already processed/i.test(String(error?.message || '')));
      const isOnlinePayment = paymentMethod !== 'cod';

      if (isOnlinePayment && checkoutDraftId && accessToken && isDraftAlreadyProcessed) {
        try {
          const draft = await checkoutDraftService.getDraft(accessToken, checkoutDraftId);
          const draftOrderId = draft?.orderId ? String(draft.orderId) : null;
          const draftStatus = String(draft?.status || '').toLowerCase();

          if (draftOrderId && (draftStatus === 'pending' || draftStatus === 'paid')) {
            sessionStorage.setItem(
              'pendingOrder',
              JSON.stringify({
                orderId: draftOrderId,
                paymentMethod,
                checkoutDraftId,
                total: summary?.grandTotal || 0,
                items: items.length,
              }),
            );

            toast.info('Order already created. Continuing payment...');
            setRedirectingAfterOrder(true);
            router.push(
              `/payment/process?orderId=${encodeURIComponent(draftOrderId)}&method=${paymentMethod}&draftId=${encodeURIComponent(checkoutDraftId)}`,
            );
            return;
          }
        } catch (draftLoadError) {
          logger.error('[CHECKOUT] Failed to recover processed draft flow:', draftLoadError);
        }
      }

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
  }, [placingOrder, items, checkoutData.addressId, summary, accessToken, cartSource, checkoutDraftId, router, clearCart, setCurrentStep]);

  return {
    placingOrder,
    redirectingAfterOrder,
    handlePaymentConfirm,
  };
};

export default useCheckoutOrderPlacement;

