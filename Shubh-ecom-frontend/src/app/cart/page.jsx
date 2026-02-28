//src/app/cart/page.jsx

"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { getProducts } from '@/services/productService';
import { ProductCard } from '@/components/product/ProductCard';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import * as cartService from '@/services/cartService';
import * as checkoutDraftService from '@/services/checkoutDraftService';
import { getPublicCoupons } from '@/services/couponService';
import { getTaxSuffix } from '@/services/taxDisplayService';
import { CartSkeleton } from '@/components/cart/CartSkeleton';
import { CartItem } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { EmptyCartState } from '@/components/cart/EmptyCartState';
import { CartSuggestionsSidebar } from '@/components/cart/CartSuggestionsSidebar';

const Cart = () => {
  const router = useRouter();
  const [couponCode, setCouponCode] = useState('');
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  /* ... */
  const { items, removeFromCart, updateQuantity, addToCart, cartSource, loading, initializationLoading, subtotal: contextSubtotal } = useCart();
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const { user, isAuthenticated, accessToken } = useAuth();
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [creatingCheckoutDraft, setCreatingCheckoutDraft] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

  /* ... fetchSummary ... */
  const fetchSummary = useCallback(async () => {
    if (!items.length) {
      setSummary(null);
      return;
    }

    setSummaryLoading(true);
    try {
      if (cartSource === 'backend' && isAuthenticated && accessToken) {
        const data = await cartService.getCartSummary(accessToken);
        setSummary(data);
      } else {
        // Safe mapping for guest items
        const guestItems = items
          .map((item) => ({
            productId: item.product?._id || item.product?.id || item.productId || null,
            quantity: item.quantity,
          }))
          .filter(item => item.productId); // Filter out items with no valid ID

        if (guestItems.length > 0) {
          const data = await cartService.getGuestCartSummary({ items: guestItems });
          setSummary(data);
        } else {
          setSummary(null);
        }
      }
    } catch (error) {
      console.error('[CART] Failed to fetch summary', error);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [items, cartSource, isAuthenticated, accessToken]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        const list = await getPublicCoupons();
        setAvailableCoupons(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error('[CART] Failed to load coupons', error);
        setAvailableCoupons([]);
      }
    };
    loadCoupons();
  }, []);

  /* ... constants ... */
  const summarySubtotal = summary?.subtotal ?? contextSubtotal;
  const summaryDiscount = summary?.discountAmount ?? 0;
  const summaryTax = summary?.taxAmount ?? 0;
  const summaryTotal = summary?.grandTotal ?? contextSubtotal;
  const cartTaxDisplay = summary?.settings?.taxPriceDisplayCart || summary?.settings?.taxPriceDisplayShop || 'excluding';
  const cartTaxLabel = getTaxSuffix(cartTaxDisplay);
  const showIncludingTax = cartTaxDisplay === 'including';
  // grandTotal from backend is now correct for both modes
  // (including: subtotal + shipping, excluding: taxableAmount + tax + shipping)

  const formatCouponValue = (coupon) =>
    coupon?.discountType === 'percent'
      ? `${coupon.discountValue}% OFF`
      : `${formatPrice(coupon.discountValue || 0)} OFF`;

  /* ... handlers ... */
  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      toast.error('Please enter a coupon code');
      return;
    }

    if (!isAuthenticated || !accessToken || cartSource !== 'backend') {
      toast.error('Please login to apply coupons');
      return;
    }

    try {
      await cartService.applyCoupon(accessToken, code);
      setCouponCode('');
      await fetchSummary();
      toast.success(`Coupon "${code}" applied!`);
    } catch (error) {
      toast.error(error.message || 'Failed to apply coupon');
    }
  };

  const handleRemoveCoupon = async () => {
    if (!summary?.couponCode) return;
    if (!isAuthenticated || !accessToken || cartSource !== 'backend') return;

    try {
      await cartService.removeCoupon(accessToken);
      setCouponCode('');
      await fetchSummary();
      toast.success(`Coupon "${summary.couponCode}" removed`);
    } catch (error) {
      toast.error(error.message || 'Failed to remove coupon');
    }
  };

  const handleApplyCouponFromDialog = async (coupon) => {
    if (!isAuthenticated || !accessToken || cartSource !== 'backend') {
      toast.error('Please login to apply coupons');
      setCouponDialogOpen(false);
      return;
    }

    try {
      await cartService.applyCoupon(accessToken, coupon.code);
      setCouponDialogOpen(false);
      await fetchSummary();
      toast.success(`Coupon "${coupon.code}" applied!`);
    } catch (error) {
      toast.error(error.message || 'Failed to apply coupon');
    }
  };

  const handleCopyCouponCode = async (code) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
        setCopiedCoupon(code);
        setTimeout(() => setCopiedCoupon(null), 2000);
        toast.success('Coupon code copied!', {
          description: `${code} copied to clipboard`
        });
      } else {
        // Fallback to older method
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          document.body.removeChild(textArea);
          setCopiedCoupon(code);
          setTimeout(() => setCopiedCoupon(null), 2000);
          toast.success('Coupon code copied!', {
            description: `${code} copied to clipboard`
          });
        } catch (err) {
          document.body.removeChild(textArea);
          throw err;
        }
      }
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy coupon code', {
        description: 'Please try selecting and copying manually'
      });
    }
  };

  const handleProceedToCheckout = async () => {
    if (creatingCheckoutDraft) return;

    if (!isAuthenticated || !accessToken) {
      toast.error('Please login to continue checkout');
      router.push('/login?returnTo=/checkout');
      return;
    }

    try {
      setCreatingCheckoutDraft(true);

      if (cartSource !== 'backend' && items.length > 0) {
        await cartService.replaceCart(accessToken, items);
      }

      const draft = await checkoutDraftService.createDraft(accessToken, {});
      const draftId = draft?.draftId || draft?._id || draft?.id;

      if (!draftId) {
        throw new Error('Draft id missing in response');
      }

      router.push(`/checkout?draftId=${draftId}`);
    } catch (error) {
      console.error('[CART] Failed to create checkout draft', error);
      toast.error(error.message || 'Unable to start checkout right now');
    } finally {
      setCreatingCheckoutDraft(false);
    }
  };

  useEffect(() => {
    const loadSuggestions = async () => {
      const cartProductIds = items
        .map((item) => item?.product?._id || item?.product?.id)
        .filter(Boolean);
      const allProducts = await getProducts({ limit: 20 });
      const suggestions = allProducts
        .filter(p => !cartProductIds.includes(p._id || p.id))
        .slice(0, 4);
      setSuggestedProducts(suggestions);
    };
    loadSuggestions();
  }, [items]);

  if (loading || initializationLoading) {
    return <CartSkeleton />;
  }

  if (items.length === 0) {
    return (
      <Layout>
        <EmptyCartState />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-secondary/30 border-b border-border/50 mt-4">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Shopping Cart
            <span className="ml-2 text-lg font-normal text-muted-foreground">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid lg:grid-cols-[280px_1fr_380px] gap-6 lg:gap-8">
          {/* Left Sidebar - Suggested Products */}
          <div className="hidden lg:block">
            <CartSuggestionsSidebar
              products={suggestedProducts}
              user={user}
              onAddToCart={addToCart}
            />
          </div>

          {/* Cart Items - Middle Column */}
          <div className="space-y-4">
            {items.map((item, index) => (
              <CartItem key={item.id || item._id || index} item={item} index={index} user={user} removeFromCart={removeFromCart} updateQuantity={updateQuantity} summary={summary} cartTaxLabel={cartTaxLabel} />
            ))}
            <div className="pt-2">
              <Link href="/categories" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ChevronRight className="w-4 h-4 rotate-180" />Continue Shopping
              </Link>
            </div>
          </div>

          <div className="lg:col-span-1">
            <CartSummary items={items} summary={summary} user={user} cartTaxLabel={cartTaxLabel} showIncludingTax={showIncludingTax} summarySubtotal={summarySubtotal} summaryDiscount={summaryDiscount} summaryTax={summaryTax} summaryTotal={summaryTotal} couponCode={couponCode} setCouponCode={setCouponCode} handleApplyCoupon={handleApplyCoupon} handleRemoveCoupon={handleRemoveCoupon} couponDialogOpen={couponDialogOpen} setCouponDialogOpen={setCouponDialogOpen} availableCoupons={availableCoupons} handleApplyCouponFromDialog={handleApplyCouponFromDialog} handleCopyCouponCode={handleCopyCouponCode} copiedCoupon={copiedCoupon} formatCouponValue={formatCouponValue} onProceedToCheckout={handleProceedToCheckout} proceedLoading={creatingCheckoutDraft} />
          </div>
        </div>

        <div className="mt-10 md:mt-14">
          <div className="flex items-center gap-2 mb-6"><Sparkles className="w-5 h-5 text-primary" /><h2 className="text-xl md:text-2xl font-bold text-foreground">Related Products</h2></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {suggestedProducts.map((product, index) => (
              <div key={product._id || product.id} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
