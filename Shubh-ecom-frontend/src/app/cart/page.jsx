//src/app/cart/page.jsx

"use client";
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { ChevronRight, Sparkles, Car } from 'lucide-react';
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
import { useSiteConfig } from '@/hooks/useSiteConfig';

const toId = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    return String(value._id || value.id || value.vehicleId || '');
  }
  return '';
};

const normalizeToken = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const collectProductSignals = (product) => {
  const vehicleIds = new Set();
  const vehicleTokens = new Set();
  const categories = new Set();
  const brands = new Set();

  const addId = (value) => {
    const id = toId(value);
    if (id) vehicleIds.add(id);
  };
  const addToken = (value) => {
    const token = normalizeToken(value);
    if (token) vehicleTokens.add(token);
  };

  if (!product || typeof product !== 'object') {
    return { vehicleIds, vehicleTokens, categories, brands };
  }

  addId(product.vehicleId);
  addId(product.vehicle?._id || product.vehicle?.id);
  if (Array.isArray(product.vehicleIds)) product.vehicleIds.forEach(addId);

  if (Array.isArray(product.compatibleVehicles)) {
    product.compatibleVehicles.forEach((entry) => {
      if (typeof entry === 'string') {
        addId(entry);
        return;
      }
      addId(entry?._id || entry?.id || entry?.vehicleId);
      addToken(entry?.model);
      addToken(entry?.variantName);
      addToken(entry?.vehicleBrand);
      addToken(entry?.display?.variantName);
      addToken(entry?.display?.modelName);
      addToken(entry?.display?.brandName);
    });
  }

  if (Array.isArray(product.compatibility)) {
    product.compatibility.forEach((entry) => {
      addToken(entry?.model);
      addToken(entry?.vehicleBrand);
      addToken(entry?.variantName);
    });
  }

  addToken(product.vehicleBrand);
  addToken(product.vehicleModel);
  addToken(product.model);

  const category = product.categorySlug || product.categoryName || product.category?.name;
  const categoryId = product.categoryId || product.category?._id || product.category?.id;
  const brand = product.manufacturerBrand || product.vehicleBrand;

  if (category) categories.add(normalizeToken(category));
  if (categoryId) categories.add(normalizeToken(categoryId));
  if (brand) brands.add(normalizeToken(brand));

  return { vehicleIds, vehicleTokens, categories, brands };
};

const Cart = () => {
  const router = useRouter();
  const [couponCode, setCouponCode] = useState('');
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(null);
  /* ... */
  const { items, removeFromCart, updateQuantity, addToCart, cartSource, loading, initializationLoading, subtotal: contextSubtotal } = useCart();
  const { tax: siteTax } = useSiteConfig();
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const { user, isAuthenticated, accessToken } = useAuth();
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponFxState, setCouponFxState] = useState(null); // 'applied' | 'removed' | null
  const [creatingCheckoutDraft, setCreatingCheckoutDraft] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  /* ... fetchSummary ... */
  const fetchSummary = useCallback(async () => {
    if (!items.length) {
      setSummary(null);
      return;
    }

    const guestItems = items
      .map((item) => ({
        productId: item.product?._id || item.product?.id || item.productId || null,
        quantity: item.quantity,
      }))
      .filter(item => item.productId);

    if (guestItems.length === 0) {
      setSummary(null);
      return;
    }

    setSummaryLoading(true);
    try {
      if (cartSource === 'backend' && isAuthenticated && accessToken) {
        const backendSummary = await cartService.getCartSummary(accessToken);
        const backendSubtotal = Number(backendSummary?.subtotal || 0);
        const backendItemsCount = Number(
          backendSummary?.itemCount ||
          backendSummary?.itemsCount ||
          backendSummary?.totalItems ||
          0,
        );
        const localItemsCount = guestItems.reduce((sum, entry) => sum + (Number(entry.quantity) || 0), 0);
        const localSubtotal = Number(contextSubtotal || 0);

        // Some backend responses intermittently reflect only a subset of cart rows.
        // Fall back to guest summary based on current local cart payload for accurate UI totals.
        const looksPartialByCount =
          localItemsCount > 1 &&
          backendItemsCount > 0 &&
          backendItemsCount < localItemsCount;
        const looksPartialBySubtotal =
          localSubtotal > 0 &&
          backendSubtotal > 0 &&
          backendSubtotal < localSubtotal;

        if (looksPartialByCount || looksPartialBySubtotal) {
          const guestSummary = await cartService.getGuestCartSummary({
            items: guestItems,
            couponCode: backendSummary?.couponCode || null,
          });
          setSummary({
            ...(guestSummary || {}),
            couponCode: backendSummary?.couponCode || guestSummary?.couponCode || null,
            discountAmount: backendSummary?.discountAmount ?? guestSummary?.discountAmount ?? 0,
          });
        } else {
          setSummary(backendSummary);
        }
      } else {
        const data = await cartService.getGuestCartSummary({ items: guestItems });
        setSummary(data);
      }
    } catch (error) {
      console.error('[CART] Failed to fetch summary', error);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [items, cartSource, isAuthenticated, accessToken, contextSubtotal]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    const loadCoupons = async () => {
      try {
        setCouponsLoading(true);
        const list = await getPublicCoupons();
        setAvailableCoupons(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error('[CART] Failed to load coupons', error);
        setAvailableCoupons([]);
      } finally {
        setCouponsLoading(false);
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
  const cartTaxLabel = getTaxSuffix(cartTaxDisplay, siteTax, summary?.settings);
  const showIncludingTax = cartTaxDisplay === 'including';
  const showTaxTotals = summary?.settings?.taxDisplayTotals !== false;
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
      setCouponLoading(true);
      await cartService.applyCoupon(accessToken, code);
      setCouponCode('');
      await fetchSummary();
      setCouponFxState('applied');
      toast.success(`Coupon "${code}" applied!`);
    } catch (error) {
      toast.error(error.message || 'Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    if (!summary?.couponCode) return;
    if (!isAuthenticated || !accessToken || cartSource !== 'backend') return;

    try {
      setCouponLoading(true);
      await cartService.removeCoupon(accessToken);
      setCouponCode('');
      await fetchSummary();
      setCouponFxState('removed');
      toast.success(`Coupon "${summary.couponCode}" removed`);
    } catch (error) {
      toast.error(error.message || 'Failed to remove coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyCouponFromDialog = async (coupon) => {
    if (!isAuthenticated || !accessToken || cartSource !== 'backend') {
      toast.error('Please login to apply coupons');
      setCouponDialogOpen(false);
      return;
    }

    try {
      setCouponLoading(true);
      await cartService.applyCoupon(accessToken, coupon.code);
      setCouponDialogOpen(false);
      await fetchSummary();
      setCouponFxState('applied');
      toast.success(`Coupon "${coupon.code}" applied!`);
    } catch (error) {
      toast.error(error.message || 'Failed to apply coupon');
    } finally {
      setCouponLoading(false);
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
    if (!couponFxState) return undefined;
    const id = setTimeout(() => setCouponFxState(null), 1400);
    return () => clearTimeout(id);
  }, [couponFxState]);

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const cartProducts = items
          .map((item) => item?.product)
          .filter(Boolean);

        const cartProductIds = new Set(
          cartProducts.map((product) => toId(product?._id || product?.id)).filter(Boolean),
        );

        const cartSignals = {
          vehicleIds: new Set(),
          vehicleTokens: new Set(),
          categories: new Set(),
          brands: new Set(),
        };

        cartProducts.forEach((product) => {
          const signals = collectProductSignals(product);
          signals.vehicleIds.forEach((id) => cartSignals.vehicleIds.add(id));
          signals.vehicleTokens.forEach((token) => cartSignals.vehicleTokens.add(token));
          signals.categories.forEach((category) => cartSignals.categories.add(category));
          signals.brands.forEach((brand) => cartSignals.brands.add(brand));
        });

        const vehicleIds = Array.from(cartSignals.vehicleIds);

        const [vehicleMatchedProducts, allProducts] = await Promise.all([
          vehicleIds.length ? getProducts({ limit: 60, vehicleIds }) : Promise.resolve([]),
          getProducts({ limit: 90 }),
        ]);

        const map = new Map();
        [...vehicleMatchedProducts, ...allProducts].forEach((product) => {
          const productId = toId(product?._id || product?.id);
          if (!productId || cartProductIds.has(productId)) return;
          map.set(productId, product);
        });

        const scored = Array.from(map.values())
          .map((product) => {
            const signals = collectProductSignals(product);
            let score = 0;

            const hasVehicleIdMatch = Array.from(signals.vehicleIds).some((id) =>
              cartSignals.vehicleIds.has(id),
            );
            if (hasVehicleIdMatch) score += 8;

            const hasVehicleTokenMatch = Array.from(signals.vehicleTokens).some((token) =>
              cartSignals.vehicleTokens.has(token),
            );
            if (hasVehicleTokenMatch) score += 5;

            const hasCategoryMatch = Array.from(signals.categories).some((category) =>
              cartSignals.categories.has(category),
            );
            if (hasCategoryMatch) score += 3;

            const hasBrandMatch = Array.from(signals.brands).some((brand) =>
              cartSignals.brands.has(brand),
            );
            if (hasBrandMatch) score += 2;

            if (!score && vehicleIds.length) score = 1;

            return { product, score, tie: Math.random() };
          })
          .sort((a, b) => b.score - a.score || a.tie - b.tie)
          .map((entry) => entry.product);

        setSuggestedProducts(scored.slice(0, 12));
      } catch (error) {
        console.error('[CART] Failed to load related suggestions', error);
        setSuggestedProducts([]);
      }
    };
    if (items.length) {
      loadSuggestions();
    } else {
      setSuggestedProducts([]);
    }
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
              <CartItem key={item.backendItemId || item.id || item._id || item?.product?._id || item?.product?.id || `cart-item-${index}`} item={item} index={index} user={user} removeFromCart={removeFromCart} updateQuantity={updateQuantity} summary={summary} cartTaxLabel={cartTaxLabel} />
            ))}
            <div className="pt-2">
              <Link href="/categories" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ChevronRight className="w-4 h-4 rotate-180" />Continue Shopping
              </Link>
            </div>
          </div>

          <div className="lg:col-span-1">
            <CartSummary items={items} summary={summary} user={user} cartTaxLabel={cartTaxLabel} showIncludingTax={showIncludingTax} showTaxTotals={showTaxTotals} summarySubtotal={summarySubtotal} summaryDiscount={summaryDiscount} summaryTax={summaryTax} summaryTotal={summaryTotal} couponCode={couponCode} setCouponCode={setCouponCode} handleApplyCoupon={handleApplyCoupon} handleRemoveCoupon={handleRemoveCoupon} couponDialogOpen={couponDialogOpen} setCouponDialogOpen={setCouponDialogOpen} availableCoupons={availableCoupons} couponsLoading={couponsLoading} handleApplyCouponFromDialog={handleApplyCouponFromDialog} handleCopyCouponCode={handleCopyCouponCode} copiedCoupon={copiedCoupon} formatCouponValue={formatCouponValue} onProceedToCheckout={handleProceedToCheckout} proceedLoading={creatingCheckoutDraft} couponLoading={couponLoading} summaryLoading={summaryLoading} couponFxState={couponFxState} />
          </div>
        </div>

        <div className="mt-10 md:mt-14">
          <div className="rounded-2xl border border-border/60 bg-linear-to-b from-secondary/35 to-background p-4 md:p-6">
            <div className="flex items-start md:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">Related Products</h2>
                  <p className="text-xs md:text-sm text-muted-foreground">Picked from compatibility and similar vehicle/cart items</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] md:text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Car className="w-3.5 h-3.5" />
                Smart Match
              </span>
            </div>

            {suggestedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 [&>*:nth-child(n+5)]:hidden md:[&>*:nth-child(n+7)]:hidden lg:[&>*:nth-child(n+9)]:hidden">
                {suggestedProducts.map((product, index) => (
                  <div key={product._id || product.id} className="animate-fade-in" style={{ animationDelay: `${index * 80}ms` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-8 text-center text-sm text-muted-foreground">
                No compatible related products found for current cart items.
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
