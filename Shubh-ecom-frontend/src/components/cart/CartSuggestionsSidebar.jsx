"use client";

import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDisplayPrice, formatPrice } from '@/services/pricingService';
import { resolveProductImages } from '@/utils/media';
import { SafeImage } from '@/components/common/SafeImage';

export const CartSuggestionsSidebar = ({ products, user, onAddToCart }) => {
  return (
    <div className="sticky top-4">
      <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm">
        <div className="flex items-start gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-foreground">You May Like</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Based on items in your cart</p>
          </div>
        </div>
        <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto scrollbar-hide pr-1">
          {products.slice(0, 6).map((product, index) => {
            if (!product) return null;
            const displayPrice = getDisplayPrice(product, user);
            const productLink = product.slug ? `/product/${product.slug}` : '/products';
            const brandLabel = product.vehicleBrand || product.manufacturerBrand || 'Auto Part';
            return (
              <div key={product._id || product.id || index} className="group p-2.5 border border-border/50 hover:border-primary/30 hover:bg-secondary/35 rounded-xl transition-all">
                <Link href={productLink} className="flex items-start gap-2">
                  <div className="relative w-16 h-16 shrink-0 rounded-lg bg-secondary overflow-hidden border border-border/30">
                    <SafeImage
                      src={resolveProductImages(product.images || [])[0] || '/placeholder.jpg'}
                      alt={product.name || 'Product'}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-muted-foreground mb-1">{brandLabel}</p>
                    <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors mb-1.5 leading-4">
                      {product.name || 'Unnamed product'}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-primary">
                        {formatPrice(displayPrice.price)}
                      </p>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
                <Button
                  size="sm"
                  className="w-full mt-2.5 h-8 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    onAddToCart(product);
                  }}
                >
                  Add to Cart
                </Button>
              </div>
            );
          })}
          {products.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground text-center">
              Add more vehicle items to get better recommendations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
