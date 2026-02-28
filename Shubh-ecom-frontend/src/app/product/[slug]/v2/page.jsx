// src/app/product/[slug]/v2/page.jsx
// Product Detail V2 — Sticky right panel, Part# chip, low-stock urgency,
// trust badges, rating breakdown bars, toast-based add-to-cart.
// Route: /product/[slug]/v2

"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import {
  ChevronRight, ShieldCheck, Star,
  Minus, Plus, Info, ChevronLeft, CheckCircle2, Share2, Truck,
  RotateCcw, CreditCard, Package, AlertTriangle, Copy,
} from 'lucide-react';
import { getProductBySlug } from '@/services/productService';
import { useAuth } from '@/context/AuthContext';
import { isProductVisible } from '@/services/productAccessService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import VehicleCompatibility from '@/components/product/VehicleCompatibility';
import AlternativesSection from '@/components/product/AlternativesSection';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { ImagePreviewModal } from '@/components/product/ImagePreviewModal';
import WishlistButton from '@/components/product/WishlistButton';

import { useCart } from '@/context/CartContext';
import { getDisplayPrice, formatPrice } from '@/services/pricingService';
import { resolveProductImages, resolveAssetUrl } from '@/utils/media';
import { PRODUCT_TYPES, getProductIdentifier, getProductTypeShortTag, isOemProduct, isVehicleBasedProduct } from '@/utils/productType';
import { ProductSkeleton } from '@/components/product/ProductSkeleton';
import { ProductReviewsSectionV2 } from '@/components/product/ProductReviewsSectionV2';
import { ProductDetailTabs } from '@/components/product/ProductDetailTabs';
import { useProductReviews } from '@/hooks/useProductReviews';
import { SafeImage } from '@/components/common/SafeImage';

/* ── Trust Badges ────────────────────────────────────────────────────────── */
const TRUST_BADGES = [
  { icon: ShieldCheck, label: '100% Genuine' },
  { icon: RotateCcw,   label: 'Easy Returns' },
  { icon: Truck,       label: 'Fast Dispatch' },
  { icon: CreditCard,  label: 'Secure Payment' },
];
const ProductDetailV2 = () => {
  const { slug } = useParams();
  const router = useRouter();
  const { addToCart, cart } = useCart();
  const { user } = useAuth();

  const [product, setProduct]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [quantity, setQuantity]       = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [zoomed, setZoomed]           = useState(false);
  const [zoomPos, setZoomPos]         = useState({ x: 50, y: 50 });
  const scrollContainerRef            = useRef(null);
  const mainImageRef                  = useRef(null);

  /* ── Load product ── */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getProductBySlug(slug || '');
      setProduct(data);
      if (data) {
        const isWs = user?.customerType === 'wholesale';
        setQuantity(isWs ? (data.minWholesaleQty || data.minOrderQty || 1) : (data.minOrderQty || 1));
      }
      setLoading(false);
    };
    if (slug) load();
  }, [slug, user]);

  /* ── Load reviews ── */
  const {
    reviews,
    reviewStats,
    ratingAvg,
    ratingCount,
    refreshReviews,
  } = useProductReviews(product?._id, {
    silent: true,
    fallbackAvg: product?.ratingAvg,
    fallbackCount: product?.ratingCount,
  });

  /* ── Image scroll helpers ── */
  const scrollToImage = (idx) => {
    if (scrollContainerRef.current && images.length > 0) {
      const w = scrollContainerRef.current.scrollWidth / images.length;
      scrollContainerRef.current.scrollTo({ left: w * idx, behavior: 'smooth' });
    }
    setActiveImage(idx);
  };
  const handleScroll = () => {
    if (!scrollContainerRef.current || images.length === 0) return;
    const w = scrollContainerRef.current.scrollWidth / images.length;
    const idx = Math.round(scrollContainerRef.current.scrollLeft / w);
    if (idx !== activeImage) setActiveImage(idx);
  };

  /* ── Image zoom ── */
  const handleMouseMove = (e) => {
    const rect = mainImageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  /* ── Guard states ── */
  if (loading || !product) return <ProductSkeleton />;

  if (!isProductVisible(product, user)) return (
    <Layout>
      <div className="container py-16 text-center max-w-lg mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-10">
          <ShieldCheck className="w-14 h-14 mx-auto mb-4 text-amber-500" />
          <h1 className="text-xl font-bold mb-2 text-amber-800">Restricted Product</h1>
          <p className="text-amber-700 mb-6 text-sm">This product is available to wholesale customers only.</p>
          <Link href="/contact"><Button>Contact Sales</Button></Link>
        </div>
      </div>
    </Layout>
  );

  /* ── Derived data ── */
  const images     = resolveProductImages(product.images || []).length
    ? resolveProductImages(product.images || []) : ['/placeholder.jpg'];
  const stockQty   = product?.stockQty ?? 0;
  const inStock    = stockQty > 0;
  const lowStock   = inStock && stockQty <= 10;
  const priceData  = getDisplayPrice(product, user);
  const unitPrice  = priceData.price;
  const isWholesale = user?.customerType === 'wholesale';
  const minQty     = isWholesale ? (product.minWholesaleQty || product.minOrderQty || 1) : (product.minOrderQty || 1);
  const isInCart   = (cart?.items || []).some(i => i.product?._id === product._id || i.productId === product._id);
  const mrp        = product.mrp || product.retailPrice?.mrp || 0;
  const discountPct = mrp > unitPrice ? Math.round(((mrp - unitPrice) / mrp) * 100) : 0;
  const isOem      = isOemProduct(product.productType);

  const specs = [
    { label: 'Category',    value: product.category?.name },
    { label: 'Sub Category', value: product.subCategory?.name },
    { label: 'SKU',         value: product.sku },
    { label: 'HSN Code',    value: product.hsnCode },
    ...(isVehicleBasedProduct(product.productType)
      ? [
        { label: 'Vehicle Brand', value: product.vehicleBrand },
        {
          label: product.productType === PRODUCT_TYPES.OES ? 'OES Number' : 'OEM Number',
          value: product.productType === PRODUCT_TYPES.OES ? product.oesNumber : product.oemNumber,
        },
      ]
      : [{ label: 'Manufacturer', value: product.manufacturerBrand }]),
    { label: 'Weight',  value: product.weight ? `${product.weight} kg` : null },
    { label: 'Width',   value: product.width  ? `${product.width} cm`  : null },
    { label: 'Length',  value: product.length ? `${product.length} cm` : null },
    { label: 'Height',  value: product.height ? `${product.height} cm` : null },
    ...(product.attributes || []).map(a => ({ label: a.name, value: a.value })),
  ].filter(s => s.value);

  /* ── Handlers ── */
  const handleAddToCart = () => {
    if (isInCart) { router.push('/cart'); return; }
    if (quantity > stockQty) { toast.error(`Only ${stockQty} units available.`); return; }
    if (quantity < minQty)   { toast.error(`Minimum order quantity is ${minQty}.`); return; }
    addToCart(product, quantity);
    toast.success('Added to cart!', { description: `${product.name} × ${quantity}` });
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: product.name, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  /* ── Render ── */
  return (
    <Layout>
      <div className="bg-muted/20 min-h-screen">
        <div className="container mx-auto px-4 py-5 pb-28 md:pb-8">

          {/* ── Breadcrumb ── */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5 overflow-x-auto whitespace-nowrap no-scrollbar">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            {product.category && (
              <>
                <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                <Link href={`/categories/${product.category.slug || ''}`} className="hover:text-primary transition-colors">
                  {product.category.name}
                </Link>
              </>
            )}
            {product.subCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                <Link href={`/categories/${product.subCategory.slug || ''}`} className="hover:text-primary transition-colors">
                  {product.subCategory.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
            <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>

          {/* ── Main Grid ── */}
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 mb-10">

            {/* ── LEFT: Image Gallery ── */}
            <div className="lg:col-span-6 flex flex-col-reverse md:flex-row gap-3">
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[520px] pb-1 md:pb-0 scrollbar-hide snap-x md:snap-y snap-mandatory">
                  {images.map((img, i) => (
                    <button
                      key={img}
                      onClick={() => scrollToImage(i)}
                      className={`w-14 h-14 md:w-16 md:h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all snap-center ${
                        i === activeImage ? 'border-primary shadow-md' : 'border-border/50 hover:border-primary/40'
                      }`}
                    >
                      <div className="relative w-full h-full">
                        <SafeImage src={img} alt="" fill className="object-cover" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div
                ref={mainImageRef}
                className="flex-1 relative aspect-square bg-card border border-border/50 rounded-2xl overflow-hidden cursor-zoom-in group"
                onMouseEnter={() => setZoomed(true)}
                onMouseLeave={() => setZoomed(false)}
                onMouseMove={handleMouseMove}
                onClick={() => setIsPreviewOpen(true)}
              >
                {/* Scrollable image strip */}
                <div
                  ref={scrollContainerRef}
                  onScroll={handleScroll}
                  className="w-full h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide flex"
                >
                  <div className="flex h-full">
                    {images.map((img, i) => (
                      <div key={img} className="relative w-full h-full flex-shrink-0 snap-center">
                        <Image
                          src={img}
                          alt={`${product.name} ${i + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-contain select-none pointer-events-none"
                          draggable={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Zoom preview box (desktop only) */}
                {zoomed && (
                  <div
                    className="hidden md:block absolute inset-0 pointer-events-none overflow-hidden"
                    style={{
                      backgroundImage: `url(${images[activeImage]})`,
                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                      backgroundSize: '250%',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                )}

                {/* Type badge */}
                <span className={`absolute top-3 left-3 z-20 text-[11px] font-bold px-2 py-1 rounded-lg text-white shadow ${isOem ? 'bg-blue-600' : 'bg-slate-600'}`}>
                  {getProductTypeShortTag(product.productType)}
                </span>

                {/* Discount badge */}
                {discountPct > 0 && (
                  <span className="absolute top-3 right-3 z-20 text-[11px] font-bold px-2 py-1 rounded-lg bg-red-500 text-white shadow">
                    -{discountPct}%
                  </span>
                )}

                {/* Out of stock overlay */}
                {!inStock && (
                  <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                    <span className="text-white font-bold text-sm bg-black/60 px-4 py-2 rounded-xl">Out of Stock</span>
                  </div>
                )}

                {/* Prev / Next arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); scrollToImage(activeImage === 0 ? images.length - 1 : activeImage - 1); }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); scrollToImage(activeImage === images.length - 1 ? 0 : activeImage + 1); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Dot indicators */}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); scrollToImage(i); }}
                        className={`h-1.5 rounded-full transition-all ${i === activeImage ? 'bg-primary w-5' : 'bg-white/60 hover:bg-white/80 w-1.5'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Product Info (sticky) ── */}
            <div className="lg:col-span-6">
              <div className="lg:sticky lg:top-6 bg-card border border-border/50 rounded-2xl p-5 md:p-6 flex flex-col gap-4">

                {/* Brand row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!isVehicleBasedProduct(product.productType) && product.manufacturerBrand && (
                      product.brandLogo
                        ? <SafeImage src={resolveAssetUrl(product.brandLogo)} alt={product.manufacturerBrand} width={0} height={0} sizes="100vw" className="h-7 w-auto object-contain" />
                        : <span className="text-[11px] font-bold uppercase tracking-widest text-primary/80 bg-primary/10 px-2 py-1 rounded-md">{product.manufacturerBrand}</span>
                    )}
                    {isVehicleBasedProduct(product.productType) && product.vehicleBrand && (
                      <span className="text-[11px] font-bold uppercase tracking-widest text-primary/80 bg-primary/10 px-2 py-1 rounded-md">{product.vehicleBrand}</span>
                    )}
                  </div>
                  <button onClick={handleShare} className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Name */}
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground leading-snug mb-1.5">{product.name}</h1>
                  {/* Part# / SKU chip */}
                  <div className="flex flex-wrap gap-2">
                    {getProductIdentifier(product) !== 'N/A' && (
                      <span
                        className="font-mono text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg max-w-[180px] truncate"
                        title={`${isVehicleBasedProduct(product.productType) ? 'Part#' : 'Code'} ${getProductIdentifier(product)}`}
                      >
                        {isVehicleBasedProduct(product.productType) ? 'Part#' : 'Code'} {getProductIdentifier(product).length > 20 ? `${getProductIdentifier(product).slice(0, 20)}...` : getProductIdentifier(product)}
                      </span>
                    )}
                    {product.sku && (
                      <span className="font-mono text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-lg">
                        SKU: {product.sku}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg">
                    <div className="flex">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(ratingAvg) ? 'text-amber-400 fill-amber-400' : 'text-amber-200'}`} />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-amber-800 ml-1">{Number(ratingAvg).toFixed(1)}</span>
                    <span className="text-xs text-amber-600">({ratingCount})</span>
                  </div>
                </div>

                {/* Price block */}
                <div className="bg-muted/40 rounded-xl p-4 border border-border/30 py-5 my-3">
                  <div className="flex items-end gap-3 mb-2">
                    <span className="text-3xl font-extrabold text-foreground tracking-tight">{formatPrice(unitPrice)}</span>
                    {mrp > unitPrice && (
                      <div className="pb-0.5 flex items-center gap-2">
                        <span className="text-base text-muted-foreground line-through">{formatPrice(mrp)}</span>
                        <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
                          {discountPct}% off
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Inclusive of all taxes</p>

                  {/* Stock status */}
                  <div className="mt-3 flex items-center gap-1.5">
                    {!inStock ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600">
                        <span className="w-2 h-2 rounded-full bg-red-500" /> Out of Stock
                      </span>
                    ) : lowStock ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
                        <AlertTriangle className="w-3.5 h-3.5" /> Only {stockQty} left — order soon!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600">
                        <span className="w-2 h-2 rounded-full bg-green-500" /> In Stock ({stockQty} available)
                      </span>
                    )}
                  </div>
                </div>

                {/* Wholesale notice */}
                {isWholesale && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-blue-800">Wholesale Pricing Active</p>
                      <p className="text-xs text-blue-600">MOQ: {minQty} units · Bulk pricing enabled</p>
                    </div>
                  </div>
                )}

                {/* Short description */}
                {product.shortDescription && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{product.shortDescription}</p>
                )}

                {/* Qty + Add to Cart */}
                <div className="flex items-center gap-3 mb-4 pt-1">
                  {/* Qty stepper */}
                  <div className="flex items-center border border-border rounded-xl bg-background overflow-hidden shrink-0">
                    <button
                      onClick={() => setQuantity(q => Math.max(minQty, q - 1))}
                      disabled={quantity <= minQty}
                      className="p-2.5 hover:bg-muted transition-colors disabled:opacity-40"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-sm font-bold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(stockQty, q + 1))}
                      disabled={!inStock || quantity >= stockQty}
                      className="p-2.5 hover:bg-muted transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add to Cart */}
                  <Button
                    size="lg"
                    disabled={!inStock}
                    onClick={handleAddToCart}
                    className={`flex-1 h-11 font-bold rounded-xl ${
                      inStock
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    {isInCart ? 'Go to Cart' : !inStock ? 'Unavailable' : `Add to Cart · ${formatPrice(unitPrice * quantity)}`}
                  </Button>

                  {/* Wishlist */}
                  <WishlistButton
                    product={product}
                    size="icon"
                    variant="outline"
                    className="h-11 w-11 rounded-xl border-border/60 shrink-0"
                  />
                </div>

                {/* Trust badge strip */}
                <div className="grid grid-cols-4 gap-2 pt-1 border-t border-border/30 pt-6">
                  {TRUST_BADGES.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1 text-center">
                      <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary/70" />
                      </div>
                      <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>

          {/* ── Tabs: Description · Specs · Reviews ── */}
          <div className="mb-10 bg-card border border-border/50 rounded-2xl p-4 md:p-7">
                        <ProductDetailTabs
              variant="v2"
              reviewsCount={reviews.length}
              specs={specs}
              description={product.longDescription || product.shortDescription}
              reviewsContent={(
                <ProductReviewsSectionV2
                  reviews={reviews}
                  ratingAvg={ratingAvg}
                  ratingCount={ratingCount}
                  reviewStats={reviewStats}
                  product={product}
                  refreshReviews={refreshReviews}
                  previewCount={4}
                />
              )}
            />
          </div>

          {/* ── Vehicle Compatibility ── */}
          <div className="mb-10">
            <VehicleCompatibility productId={product._id} />
          </div>

          {/* ── Alternatives ── */}
          <AlternativesSection productId={product._id} />

          {/* ── Related Products ── */}
          <div className="mb-10">
            <RelatedProducts currentProduct={product} limit={5} />
          </div>

        </div>
      </div>

      {/* ── Image preview modal ── */}
      <ImagePreviewModal
        images={images}
        initialIndex={activeImage}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* ── Mobile sticky bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-3 pb-safe z-50 md:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xl font-extrabold text-foreground leading-none">{formatPrice(unitPrice)}</div>
            {mrp > unitPrice && (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-muted-foreground line-through">{formatPrice(mrp)}</span>
                <span className="text-xs text-green-600 font-bold">{discountPct}% off</span>
              </div>
            )}
          </div>
          <div className="flex items-center border border-border rounded-xl overflow-hidden shrink-0">
            <button onClick={() => setQuantity(q => Math.max(minQty, q - 1))} disabled={quantity <= minQty} className="p-2 disabled:opacity-40">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-sm font-bold">{quantity}</span>
            <button onClick={() => setQuantity(q => Math.min(stockQty, q + 1))} disabled={!inStock || quantity >= stockQty} className="p-2 disabled:opacity-40">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <WishlistButton product={product} size="icon" variant="outline" className="h-10 w-10 rounded-xl border-border/60 shrink-0" />
          <Button
            disabled={!inStock}
            onClick={handleAddToCart}
            className={`h-10 px-5 font-bold rounded-xl text-sm shrink-0 ${inStock ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            {isInCart ? 'View Cart' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetailV2;



