"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ChevronRight, ShieldCheck, FileText, List, MessageSquare, Star, Minus, Plus, Info, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { getProductBySlug } from '@/services/productService';
import { useAuth } from '@/context/AuthContext';
import { isProductVisible } from '@/services/productAccessService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

import VehicleCompatibility from '@/components/product/VehicleCompatibility';
import AlternativesSection from '@/components/product/AlternativesSection';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { WriteReviewModal } from '@/components/product/WriteReviewModal';
import { getProductReviews, getReviewStats } from '@/services/reviewService';
import { ImagePreviewModal } from '@/components/product/ImagePreviewModal';
import WishlistButton from '@/components/product/WishlistButton';

import { useCart } from '@/context/CartContext';
import { getDisplayPrice, formatPrice } from '@/services/pricingService';
import { resolveProductImages, resolveAssetUrl } from '@/utils/media';
import { getTaxSuffix, getTaxHelpText } from '@/services/taxDisplayService';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { getProductTypeBadge, isOemProduct } from '@/utils/productType';

const ProductDetail = () => {
  const { slug } = useParams();
  const router = useRouter();
  const { addToCart, cart } = useCart();
  const { user } = useAuth();
  const { tax: siteTax } = useSiteConfig();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // States
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average: 0, total: 0, breakdown: {} });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      const productData = await getProductBySlug(slug || '');
      setProduct(productData);

      // Initialize quantity with MOQ if applicable
      if (productData) {
        const isWholesaleUser = user?.customerType === 'wholesale';
        const minQ = isWholesaleUser ? (productData.minWholesaleQty || productData.minOrderQty || 1) : (productData.minOrderQty || 1);
        setQuantity(minQ);
      }

      setLoading(false);
    };
    if (slug) loadProduct();
  }, [slug, user]);

  const refreshReviews = async () => {
    if (!product?._id) return;
    try {
      const list = await getProductReviews(product._id);
      const safeList = Array.isArray(list) ? list : [];
      const stats = getReviewStats(safeList);
      setReviews(safeList);
      setReviewStats(stats);
      setProduct((prev) =>
        prev ? { ...prev, ratingAvg: stats.average, ratingCount: stats.total } : prev,
      );
    } catch (error) {
      console.error('Failed to load reviews', error);
    }
  };

  useEffect(() => {
    refreshReviews();
  }, [product?._id]);

  if (!product && !loading) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Link href="/products" className="text-primary mt-4 inline-block">Browse Catalog</Link>
        </div>
      </Layout>
    );
  }

  const ProductSkeleton = () => (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-32 md:pb-6">
        {/* Breadcrumb Skeleton */}
        <div className="flex gap-2 mb-6 overflow-hidden">
          <div className="h-4 w-12 bg-slate-200 rounded animate-pulse shrink-0"></div>
          <div className="h-4 w-4 bg-slate-200 rounded animate-pulse shrink-0"></div>
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse shrink-0"></div>
          <div className="h-4 w-4 bg-slate-200 rounded animate-pulse shrink-0"></div>
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse shrink-0"></div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 mb-12">
          {/* Image Gallery Skeleton (Left) */}
          <div className="lg:col-span-12 xl:col-span-5 flex flex-col-reverse md:flex-row gap-4">
            {/* Thumbs */}
            <div className="hidden md:flex md:flex-col gap-2 overflow-hidden">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
            {/* Main Image */}
            <div className="flex-1 aspect-square bg-slate-100 rounded-2xl animate-pulse w-full"></div>
            {/* Mobile Thumbs */}
            <div className="flex md:hidden gap-2 overflow-x-auto pb-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-16 h-16 bg-slate-100 rounded-lg animate-pulse shrink-0"></div>
              ))}
            </div>
          </div>

          {/* Product Info Skeleton (Right) */}
          <div className="lg:col-span-12 xl:col-span-7 flex flex-col h-full">
            <div className="mb-auto">
              <div className="h-6 w-24 bg-slate-200 rounded mb-4 animate-pulse"></div>
              <div className="h-8 md:h-10 w-full md:w-3/4 bg-slate-200 rounded mb-4 animate-pulse"></div>

              <div className="flex gap-4 mb-6">
                <div className="h-6 w-32 bg-slate-100 rounded animate-pulse"></div>
                <div className="h-6 w-24 bg-slate-100 rounded animate-pulse"></div>
              </div>

              <div className="h-auto md:h-40 w-full bg-slate-50 rounded-xl mb-8 animate-pulse border border-slate-100 p-6">
                <div className="h-8 w-40 bg-slate-200 rounded mb-2"></div>
                <div className="h-4 w-24 bg-slate-200 rounded"></div>
              </div>

              <div className="space-y-2 mb-8">
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse"></div>
                <div className="h-4 w-full bg-slate-100 rounded animate-pulse"></div>
                <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4 mt-auto pt-6 border-t border-slate-100">
              <div className="h-12 w-32 bg-slate-100 rounded-lg animate-pulse"></div>
              <div className="h-12 flex-1 bg-slate-200 rounded-lg animate-pulse"></div>
              <div className="h-12 w-12 bg-slate-100 rounded-lg animate-pulse"></div>
            </div>

            {/* Mobile Sticky Skeleton */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-50 flex gap-4">
              <div className="h-12 flex-1 bg-slate-200 rounded-lg animate-pulse"></div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );

  if (loading || !product) {
    return <ProductSkeleton />;
  }

  if (!isProductVisible(product, user)) {
    return (
      <Layout>
        <div className="container py-16 text-center max-w-2xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-8">
            <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-amber-500" />
            <h1 className="text-2xl font-bold mb-2 text-amber-800">Restricted Product</h1>
            <p className="text-amber-700 mb-6">
              This product is available to wholesale customers only.
            </p>
            <Link href="/contact"><Button>Contact Sales</Button></Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Construct Specs Table Data
  const specs = product ? [
    { label: 'Category', value: product.category?.name },
    { label: 'Sub Category', value: product.subCategory?.name },
    { label: 'SKU', value: product.sku },
    { label: 'HSN', value: product.hsnCode },
    ...(isOemProduct(product.productType)
      ? [
        { label: 'Vehicle Brand', value: product.vehicleBrand },
        { label: 'OEM Number', value: product.oemNumber },
      ]
      : [
        { label: 'Manufacturer Brand', value: product.manufacturerBrand },
      ]),
    { label: 'Weight (kg)', value: product.weight },
    { label: 'Width', value: product.width ? `${product.width} cm` : null },
    { label: 'Length', value: product.length ? `${product.length} cm` : null },
    { label: 'Height', value: product.height ? `${product.height} cm` : null },
  ].filter(s => s.value) : [];

  // Merge dynamic attributes
  if (product && product.attributes && Array.isArray(product.attributes)) {
    product.attributes.forEach(attr => {
      if (attr.value) specs.push({ label: attr.name, value: attr.value });
    });
  }

  const images = product ? resolveProductImages(product.images || []) : [];
  const displayImages = images.length ? images : ['/placeholder.jpg'];
  const stockQty = product?.stockQty ?? 0;
  const inStock = stockQty > 0;

  // Pricing & User Role Logic
  const priceData = getDisplayPrice(product, user);
  const unitPrice = priceData.price;
  const isWholesale = user?.customerType === 'wholesale';
  const minQty = isWholesale ? (product.minWholesaleQty || product.minOrderQty || 1) : (product.minOrderQty || 1);
  const subtotal = (unitPrice || 0) * quantity;

  // Cart Logic
  const cartItems = cart?.items || [];
  const isInCart = cartItems.some(item => (item.product?._id === product._id) || (item.productId === product._id));

  // Tax display configuration
  const tax = siteTax || {};
  const displayShop = tax.displayShop || 'including';
  const taxLabel = getTaxSuffix(displayShop);
  const taxHelpText = getTaxHelpText(displayShop);

  const ratingAvg = reviewStats.average || product?.ratingAvg || 0;
  const ratingCount = reviewStats.total || product?.ratingCount || 0;

  const handleAddToCart = () => {
    if (isInCart) {
      router.push('/cart');
      return;
    }

    if (quantity > stockQty) {
      toast.error(`Only ${stockQty} units available.`);
      return;
    }

    if (quantity < minQty) {
      toast.error(`Minimum order quantity is ${minQty}`);
      return;
    }

    addToCart(product, quantity);
    setShowSuccessModal(true);
  };

  const scrollToImage = (index) => {
    if (scrollContainerRef.current && displayImages.length > 0) {
      const container = scrollContainerRef.current;
      const imageWidth = container.scrollWidth / displayImages.length;
      container.scrollTo({
        left: imageWidth * index,
        behavior: 'smooth'
      });
    }
    setActiveImage(index);
  };

  const handleScroll = () => {
    if (scrollContainerRef.current && displayImages.length > 0) {
      const container = scrollContainerRef.current;
      const imageWidth = container.scrollWidth / displayImages.length;
      const newIndex = Math.round(container.scrollLeft / imageWidth);
      if (newIndex !== activeImage) {
        setActiveImage(newIndex);
      }
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 pb-28 md:pb-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">
          <Link href="/" className="hover:text-primary transition-colors flex-shrink-0">Home</Link>

          {product.category && (
            <>
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
              <Link
                href={`/categories/${product.category.slug || product.categorySlug || ''}`}
                className="hover:text-primary transition-colors flex-shrink-0"
              >
                {product.category.name || 'Category'}
              </Link>
            </>
          )}

          {product.subCategory && (
            <>
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
              <Link
                href={`/categories/${product.subCategory.slug || ''}`}
                className="hover:text-primary transition-colors flex-shrink-0"
              >
                {product.subCategory.name || 'Subcategory'}
              </Link>
            </>
          )}

          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium text-foreground truncate">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 mb-12">
          {/* Image Gallery - Left Side (5 cols) - HYBRID: pageold layout + ProductHero badges */}
          <div className="lg:col-span-5 flex flex-col-reverse md:flex-row gap-4">
            {displayImages.length > 1 && (
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[500px] pb-2 md:pb-0 scrollbar-hide snap-x md:snap-y snap-mandatory">
                {displayImages.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => scrollToImage(i)}
                    className={`w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all snap-center ${i === activeImage ? 'border-primary' : 'border-border hover:border-primary/50'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 relative aspect-square bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden group">
              {/* ProductHero Badges */}
              <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 items-end">
                <Badge className={`${isOemProduct(product.productType) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-800'} text-white px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm transition-transform hover:scale-105`}>
                  {getProductTypeBadge(product.productType)}
                </Badge>
              </div>
              <div className="absolute bottom-4 left-4 z-20">
                <div className="bg-white/90 backdrop-blur-sm border border-slate-100 rounded-lg p-3 shadow-md flex items-start gap-3 max-w-[200px] transition-transform hover:scale-105 cursor-default">
                  <div className="mt-0.5 bg-blue-600 rounded-md p-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-tight mb-0.5">100% Genuine Parts</p>
                    {product.tags?.includes('Verified Fit') && (
                      <p className="text-[10px] font-medium text-slate-500">Verified Fit Guarantee</p>
                    )}
                  </div>
                </div>
              </div>

              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="w-full h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide cursor-zoom-in active:cursor-grabbing flex items-center bg-white"
              >
                <div className="flex h-full">
                  {displayImages.map((img, i) => (
                    <div
                      key={img}
                      className="w-full h-full flex-shrink-0 snap-center"
                      onClick={() => setIsPreviewOpen(true)}
                    >
                      <img
                        src={img}
                        alt={`${product.name} - Image ${i + 1}`}
                        className="w-full h-full object-cover select-none pointer-events-none"
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={() => scrollToImage(activeImage === 0 ? displayImages.length - 1 : activeImage - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background z-10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => scrollToImage(activeImage === displayImages.length - 1 ? 0 : activeImage + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background z-10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {displayImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {displayImages.map((_, i) => (
                    <button
                      key={`${i}-dot`}
                      onClick={() => scrollToImage(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === activeImage ? 'bg-primary w-6' : 'bg-white/60 hover:bg-white/80'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info - Right Side (7 cols) - RESTORED: ProductHero layout */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <div className="mb-auto">
              <div className="flex items-center gap-2 mb-3">
                {product.manufacturerBrand && !isOemProduct(product.productType) && (
                  <div className="flex items-center gap-2">
                    {product.brandLogo ? (
                      <img src={resolveAssetUrl(product.brandLogo)} alt={product.manufacturerBrand} className="h-8 w-auto object-contain" />
                    ) : (
                      <span className="font-bold text-slate-800 uppercase tracking-wide text-xs bg-slate-100 px-2 py-1 rounded">
                        {product.manufacturerBrand}
                      </span>
                    )}
                  </div>
                )}
                {isOemProduct(product.productType) && product.vehicleBrand && (
                  <span className="font-bold text-slate-800 uppercase tracking-wide text-xs bg-slate-100 px-2 py-1 rounded">
                    {product.vehicleBrand}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight mb-3">{product.name}</h1>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(ratingAvg) ? 'fill-current' : 'text-amber-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-amber-800 ml-1">({ratingCount} reviews)</span>
                </div>

                <Badge variant="secondary" className="bg-orange-100 text-orange-900 hover:bg-orange-200 border border-orange-200 rounded-md px-4 py-1 gap-1.5 h-full font-bold">
                  Shubh Choice <CheckCircle2 className="w-4 h-4 fill-orange-600 text-white ml-0.5" />
                </Badge>

                <div className="h-4 w-px bg-slate-200" />
                <span className="text-sm text-slate-500">SKU: {product.sku || 'N/A'}</span>
              </div>

              {/* Price Block */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-6 mb-8">
                <div className="flex items-end gap-3 mb-2">
                  <span className="text-3xl font-bold text-slate-900 tracking-tight">{formatPrice(unitPrice)}</span>
                  {product.mrp && product.mrp > unitPrice && (
                    <div className="flex flex-col items-start gap-1 pb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-slate-500 font-medium whitespace-nowrap">
                          MRP: <span className="line-through">{formatPrice(product.mrp)}</span>
                        </span>
                        <span className="bg-cyan-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                          -{Math.round(((product.mrp - unitPrice) / product.mrp) * 100)}%
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-white bg-slate-500 px-2 py-0.5 rounded">
                        Incl. of all taxes
                      </span>
                    </div>
                  )}
                </div>
                {!product.mrp && <p className="text-xs text-slate-500 mb-4">*Price includes all taxes</p>}

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className={`border-none px-3 py-1.5 gap-1.5 ${inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                    {inStock ? `In Stock (${stockQty})` : 'Out of Stock'}
                  </Badge>
                </div>
              </div>

              {/* Description Snippet */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">Short Description</h3>
                <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
                  {product.shortDescription || 'High-quality automotive part designed for performance and durability. Tested for compatibility and reliability.'}
                </p>
              </div>

              {isWholesale && (
                <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Wholesale Account Active</p>
                    <p className="text-xs text-blue-600">MOQ: {minQty} units apply. Bulk pricing is enabled.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions (Desktop) */}
            <div className="hidden md:flex items-center gap-4 mt-auto border-t border-slate-100 pt-6">
              <div className="flex items-center border border-slate-200 rounded-lg bg-white shadow-sm">
                <button
                  onClick={() => setQuantity(q => Math.max(minQty, q - 1))}
                  className="p-3 hover:bg-slate-50 text-slate-600 transition-colors rounded-l-lg disabled:opacity-50"
                  disabled={quantity <= minQty}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-14 text-center font-semibold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(stockQty, q + 1))}
                  className="p-3 hover:bg-slate-50 text-slate-600 transition-colors rounded-r-lg disabled:opacity-50"
                  disabled={quantity >= stockQty}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <Button
                size="lg"
                className="flex-1 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                {isInCart ? 'GO TO CART' : `ADD TO CART • ${formatPrice(unitPrice * quantity)}`}
              </Button>

              <div className="h-12 w-12 shrink-0">
                <WishlistButton product={product} size="lg" variant="outline" className="h-full w-full border-slate-200 hover:border-red-200 hover:text-red-500 rounded-lg" />
              </div>
            </div>
          </div>
        </div>


        {/* Tabs: Description, Specs, Reviews */}
        <div className="mb-16 bg-white border border-slate-100 rounded-2xl p-4 md:p-8">
          <Tabs defaultValue="desc" className="w-full">
            <div className="mb-8">
              <TabsList className="w-full h-auto p-1 bg-slate-50/50 border border-slate-100 rounded-xl flex justify-start gap-2 overflow-x-auto whitespace-nowrap no-scrollbar scroll-smooth">
                <TabsTrigger
                  value="desc"
                  className="rounded-lg border border-transparent data-[state=active]:border-blue-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 px-6 py-3 text-sm font-bold tracking-wide uppercase transition-all hover:text-slate-900 hover:bg-white/50 bg-transparent text-slate-500 gap-2 flex-none shadow-none data-[state=active]:shadow-none"
                >
                  <FileText className="w-4 h-4 opacity-70" /> Description
                </TabsTrigger>
                <TabsTrigger
                  value="specs"
                  className="rounded-lg border border-transparent data-[state=active]:border-blue-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 px-6 py-3 text-sm font-bold tracking-wide uppercase transition-all hover:text-slate-900 hover:bg-white/50 bg-transparent text-slate-500 gap-2 flex-none shadow-none data-[state=active]:shadow-none"
                >
                  <List className="w-4 h-4 opacity-70" /> Specifications
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-lg border border-transparent data-[state=active]:border-blue-200 data-[state=active]:bg-white data-[state=active]:text-slate-900 px-6 py-3 text-sm font-bold tracking-wide uppercase transition-all hover:text-slate-900 hover:bg-white/50 bg-transparent text-slate-500 gap-2 flex-none shadow-none data-[state=active]:shadow-none"
                >
                  <MessageSquare className="w-4 h-4 opacity-70" /> Reviews ({reviews.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="desc" className="mt-0 animate-in fade-in-50 duration-300 px-2">
              <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                {product.longDescription || product.shortDescription || <p className="text-slate-400 italic">No detailed description available for this product.</p>}
              </div>
            </TabsContent>

            <TabsContent value="specs" className="mt-0 animate-in fade-in-50 duration-300">
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-slate-900 w-1/3 border-b border-slate-100">Specification</th>
                      <th className="px-8 py-4 font-semibold text-slate-900 border-b border-slate-100">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {specs.map((spec, i) => (
                      <tr key={spec.label} className="hover:bg-blue-50/30 border-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-500 bg-slate-50/30">{spec.label}</td>
                        <td className="px-8 py-4 font-semibold text-slate-700">{spec.value}</td>
                      </tr>
                    ))}
                    {specs.length === 0 && (
                      <tr><td colSpan={2} className="px-6 py-8 text-center text-slate-400 bg-slate-50/30">No specifications listed.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-0 animate-in fade-in-50 duration-300">
              <div className="flex flex-col md:flex-row gap-12">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Customer Reviews</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-5 h-5 ${i < Math.round(ratingAvg) ? 'fill-current' : 'text-slate-200'}`} />
                          ))}
                        </div>
                        <p className="font-semibold text-slate-700">{Number(ratingAvg || 0).toFixed(1)} out of 5</p>
                        <span className="text-slate-400 mx-2">•</span>
                        <p className="text-slate-500">{ratingCount} ratings</p>
                      </div>
                    </div>
                    <WriteReviewModal
                      productId={product._id}
                      productName={product.name}
                      onSubmitted={refreshReviews}
                    />
                  </div>

                  <div className="space-y-6">
                    {reviews.map((r, i) => (
                      <div key={i} className="bg-white border border-slate-100 p-6 rounded-xl hover:shadow-sm transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex text-amber-400">
                                {[...Array(5)].map((_, stars) => <Star key={stars} className={`w-3.5 h-3.5 ${stars < r.rating ? 'fill-current' : 'text-slate-200'}`} />)}
                              </div>
                              <span className="font-bold text-slate-900 text-sm ml-1">{r.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span className="font-medium text-slate-600">{r.author || 'Anonymous'}</span>
                              <span>•</span>
                              <span>
                                {(r.createdAt || r.date)
                                  ? new Date(r.createdAt || r.date).toLocaleDateString()
                                  : '-'}
                              </span>
                            </div>
                          </div>
                          {r.verified && <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"><ShieldCheck className="w-3 h-3 mr-1" /> Verified</Badge>}
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">{r.content || r.comment}</p>
                      </div>
                    ))}
                    {reviews.length === 0 && (
                      <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium mb-1">No reviews yet</p>
                        <p className="text-sm text-slate-400">Be the first to share your experience with this product.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        {/* Vehicle Compatibility */}
        <div className="mb-12">
          <VehicleCompatibility productId={product._id} />
        </div>

        {/* Alternatives */}
        <AlternativesSection productId={product._id} />

        {/* Related Products */}
        <div className="mb-12">
          <RelatedProducts currentProduct={product} limit={5} />
        </div>

        {/* Mobile Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-safe z-50 md:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-2xl font-bold text-slate-900 leading-none mb-1">
                {formatPrice(unitPrice)}
              </div>
              {product.mrp > unitPrice && (
                <div className="text-xs text-slate-500">
                  <span className="line-through">{formatPrice(product.mrp)}</span>
                  <span className="text-green-600 font-bold ml-1">{Math.round(((product.mrp - unitPrice) / product.mrp) * 100)}% off</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <WishlistButton product={product} size="icon" variant="outline" className="h-12 w-12 border-slate-200 rounded-lg" />

              <Button
                className={`h-12 px-6 font-bold text-base shadow-lg ${inStock ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-slate-300'}`}
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                {isInCart ? 'View Cart' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        </div>

      </div>

      <ImagePreviewModal
        images={displayImages}
        initialIndex={activeImage}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md p-8 gap-6 shadow-xl border-slate-100 rounded-xl">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="rounded-full bg-transparent border-2 border-green-500 p-0.5">
                <CheckCircle2 className="w-5 h-5 text-green-500 fill-white" />
              </div>
              <DialogTitle>Added to Cart</DialogTitle>
            </div>
            <p className="text-slate-500 font-medium">
              <span className="font-bold text-slate-900">{product.name}</span> has been successfully added to your cart.
            </p>
          </div>

          <div className="flex justify-between items-center text-base font-medium text-slate-600">
            <span>Subtotal ({quantity} items):</span>
            <span className="font-bold text-slate-900 text-lg">{formatPrice(unitPrice * quantity)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <Button
              variant="outline"
              className="h-11 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 hover:text-slate-900"
              onClick={() => setShowSuccessModal(false)}
            >
              Continue Shopping
            </Button>
            <Button
              className="h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-200"
              onClick={() => router.push('/cart')}
            >
              Go to Cart
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>

  );
};

export default ProductDetail;
