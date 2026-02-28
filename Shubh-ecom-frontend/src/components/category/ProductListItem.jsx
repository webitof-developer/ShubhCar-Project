import Link from 'next/link';
import { Star, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { getDisplayPrice, formatPrice } from '@/services/pricingService';
import { resolveProductImages } from '@/utils/media';
import { getProductIdentifier, getProductTypeShortTag, isOemProduct, isVehicleBasedProduct } from '@/utils/productType';
import WishlistButton from '@/components/product/WishlistButton';
import { Button } from '@/components/ui/button';
import { SafeImage } from '@/components/common/SafeImage';

export const ProductListItem = ({ product }) => {
  const { user } = useAuth();
  const { addToCart, cart } = useCart();
  const priceData = getDisplayPrice(product, user);
  const unitPrice = priceData.price;
  const images = resolveProductImages(product.images || []);
  const img = images[0] || '/placeholder.jpg';
  const stockQty = product.stockQty ?? 0;
  const inStock = stockQty > 0;
  const cartItems = cart?.items || [];
  const isInCart = cartItems.some((i) => (i.product?._id === product._id) || (i.productId === product._id));
  const ratingAvg = Number(product.ratingAvg || 0);
  const ratingCount = Number(product.ratingCount || 0);
  const mrp = product.retailPrice?.mrp || product.mrp || 0;
  const discountPct = mrp > unitPrice ? Math.round(((mrp - unitPrice) / mrp) * 100) : 0;
  const isOem = isOemProduct(product.productType);

  const handleCart = (e) => {
    e.preventDefault();
    if (isInCart) { window.location.href = '/cart'; return; }
    if (!inStock) { toast.error('Out of stock'); return; }
    addToCart(product, product.minOrderQty || 1);
    toast.success('Added to cart!');
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex gap-0 bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-200"
    >
      {/* ── Image panel ── */}
      <div className="relative w-36 md:w-44 flex-shrink-0 bg-muted/40 overflow-hidden min-h-[120px]">
        <SafeImage
          src={img}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 144px, 176px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Type badge pinned to top-left */}
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white ${isOem ? 'bg-blue-600' : 'bg-slate-600'}`}>
          {getProductTypeShortTag(product.productType)}
        </span>
        {/* Discount badge pinned to top-right */}
        {discountPct > 0 && (
          <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-500 text-white">
            -{discountPct}%
          </span>
        )}
        {/* Out of stock dim overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded-md">Out of Stock</span>
          </div>
        )}
      </div>

      {/* ── Details ── */}
      <div className="flex flex-1 min-w-0 flex-col sm:flex-row">

        {/* Left: meta */}
        <div className="flex-1 min-w-0 px-4 py-3 flex flex-col gap-1">

          {/* Brand */}
          {(product.manufacturerBrand || product.vehicleBrand) && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">
              {product.manufacturerBrand || product.vehicleBrand}
            </p>
          )}

          {/* Name */}
          <h3 className="font-bold text-sm md:text-[15px] text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-xs text-muted-foreground line-clamp-1">{product.shortDescription}</p>
          )}

          {/* Meta row: SKU · Part# */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
            {product.sku && (
              <span className="bg-muted/60 px-1.5 py-0.5 rounded font-mono">SKU: {product.sku}</span>
            )}
            {getProductIdentifier(product) !== 'N/A' && (
              <span className="bg-muted/60 px-1.5 py-0.5 rounded font-mono text-foreground/60">
                {isVehicleBasedProduct(product.productType) ? 'Part#' : 'Brand'} {getProductIdentifier(product)}
              </span>
            )}
          </div>

          {/* Rating — always shown */}
          <div className="flex items-center gap-2 mt-auto pt-1">
            <span className="flex items-center gap-0.5">
              {[1,2,3,4,5].map((s) => (
                <Star
                  key={s}
                  className={`w-3 h-3 ${s <= Math.round(ratingAvg) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30 fill-muted-foreground/10'}`}
                />
              ))}
            </span>
            <span className="text-xs text-muted-foreground">
              {ratingAvg.toFixed(1)} <span className="text-muted-foreground/60">({ratingCount} review{ratingCount !== 1 ? 's' : ''})</span>
            </span>
          </div>

          {/* Stock badge */}
          <div className={`inline-flex items-center gap-1 text-[11px] font-medium w-fit ${inStock ? 'text-green-600' : 'text-red-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
            {inStock ? `In Stock${stockQty <= 10 ? ` · Only ${stockQty} left` : ''}` : 'Out of Stock'}
          </div>
        </div>

        {/* Right: price + CTA */}
        <div className="flex flex-col items-end justify-between gap-3 px-4 py-3 sm:border-l border-border/30 flex-shrink-0 min-w-[130px]">
          <div className="text-right">
            <div className="text-xl font-extrabold text-foreground tracking-tight">{formatPrice(unitPrice)}</div>
            {mrp > unitPrice && (
              <div className="text-xs text-muted-foreground line-through">{formatPrice(mrp)}</div>
            )}
            {discountPct > 0 && (
              <div className="text-xs font-semibold text-green-600">Save {discountPct}%</div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 w-full">
            <Button
              size="sm"
              className={`w-full h-9 text-xs font-bold rounded-xl ${inStock ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
              onClick={handleCart}
              disabled={!inStock}
            >
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
              {isInCart ? 'In Cart' : inStock ? 'Add to Cart' : 'Unavailable'}
            </Button>
            <WishlistButton
              product={product}
              size="sm"
              variant="outline"
              className="w-full h-8 text-xs rounded-xl border-border/50"
            />
          </div>
        </div>
      </div>
    </Link>
  );
};
