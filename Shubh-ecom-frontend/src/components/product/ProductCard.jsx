//src/components/product/ProductCard.jsx

"use client";

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, ShieldCheck, ShoppingCart } from 'lucide-react';
import WishlistButton from '@/components/product/WishlistButton';
import { SafeImage } from '@/components/common/SafeImage';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { getDisplayPrice, formatPrice } from '@/services/pricingService';
import { resolveProductImages } from '@/utils/media';
import { getProductTypeLabel, isOemProduct, isVehicleBasedProduct } from '@/utils/productType';
import { toast } from 'sonner';


export const ProductCard = ({ product, className = '', compact = false }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Data safety: provide defaults for missing data
  if (!product) return null;

  const imageUrl = resolveProductImages(product?.images || [])[0] || '/placeholder.jpg';
  const productName = product?.name || 'Product';

  // Use pricingService for user-specific pricing
  const pricing = getDisplayPrice(product, user);
  const { price, type, savingsPercent, originalPrice } = pricing;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success('Added to cart', { description: `${productName}` });
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className={`group block bg-card rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
        {/* Main Image with Blur on Hover */}
        <SafeImage
          src={imageUrl}
          alt={productName}
          fill
          sizes="(max-width: 768px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-all duration-500"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 z-10 flex gap-2">
          <Badge
            variant={isOemProduct(product.productType) ? 'default' : 'secondary'}
            className="text-[10px] font-medium px-2 py-0.5 shadow-sm"
          >
            {isOemProduct(product.productType) ? (
              <><ShieldCheck className="w-3 h-3 mr-1" />{getProductTypeLabel(product.productType)}</>
            ) : (
              getProductTypeLabel(product.productType)
            )}
          </Badge>

          {savingsPercent && (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm">
              -{savingsPercent}%
            </span>
          )}
        </div>

        {/* Icon Buttons on Hover - Vertical Stack on Right */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Button
            onClick={handleAddToCart}
            size="icon"
            variant="ghost"
            className="w-10 h-10 rounded-full shadow-lg border-0 bg-background/90 backdrop-blur-sm hover:bg-background text-foreground hover:text-primary"
          >
            <ShoppingCart className="w-5 h-5 transition-all hover:fill-primary" strokeWidth={2} />
          </Button>

          <WishlistButton
            product={product}
            size="icon"
            variant="ghost"
            className="w-10 h-10 rounded-full shadow-lg border-0"
          />
        </div>
      </div>

      {/* Product Info */}
      <div className={compact ? 'p-2' : 'p-2.5 md:p-4'}>
        <h3 className={`font-semibold line-clamp-2 mb-1 text-foreground group-hover:text-primary transition-colors ${compact ? 'text-xs' : 'text-sm md:text-base'}`}>
          {productName}
        </h3>

        {!compact && (
          <p className="text-[10px] md:text-xs text-muted-foreground mb-1.5 line-clamp-1">
            {isOemProduct(product.productType)
              ? (product.vehicleBrand || 'N/A')
              : (isVehicleBasedProduct(product.productType)
                ? (product.vehicleBrand || product.manufacturerBrand || 'N/A')
                : (product.manufacturerBrand || 'N/A'))}
          </p>
        )}

        {/* Price and Rating Row */}
        <div className="flex flex-wrap items-baseline justify-between gap-y-1 mb-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className={`font-bold text-primary ${compact ? 'text-sm' : 'text-base md:text-lg'}`}>
              {formatPrice(price)}
            </span>
            {originalPrice && (
              <span className="text-[10px] md:text-xs text-muted-foreground line-through decoration-slate-400/50">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-0.5 bg-slate-100 rounded px-1 py-0.5 md:bg-transparent md:p-0">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span className="text-[10px] md:text-xs font-bold text-slate-700">
              {Number(product.ratingAvg || 0).toFixed(1)}
            </span>
            <span className="text-[10px] text-muted-foreground hidden md:inline-block">
              ({product.ratingCount || 0})
            </span>
          </div>
        </div>

        {/* Extra info / Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {(product.stockQty || 0) > 0 ? (
            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0 md:px-2 md:py-0.5 rounded md:rounded-full border border-emerald-200/50">
              In Stock
            </span>
          ) : (
            <span className="text-[10px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0 md:px-2 md:py-0.5 rounded md:rounded-full border border-rose-200/50">
              Out of Stock
            </span>
          )}

          {type === 'wholesale' && (
            <Badge variant="default" className="text-[10px] bg-blue-600 px-1 py-0 h-4 md:h-5 rounded-sm hover:bg-blue-700">
              Wholesale
            </Badge>
          )}

          {savingsPercent && (
            <span className="text-[10px] font-bold text-green-600 border border-green-200/50 px-1 py-0 rounded bg-green-50/50">
              {savingsPercent}% OFF
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};
