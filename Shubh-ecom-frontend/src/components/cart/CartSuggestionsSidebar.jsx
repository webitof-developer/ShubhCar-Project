"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDisplayPrice, formatPrice } from '@/services/pricingService';
import { resolveProductImages } from '@/utils/media';

export const CartSuggestionsSidebar = ({ products, user, onAddToCart }) => {
  return (
    <div className="sticky top-4">
      <div className="bg-card rounded-xl border border-border/50 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">You May Like</h3>
        </div>
        <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
          {products.slice(0, 6).map((product, index) => {
            if (!product) return null;
            const displayPrice = getDisplayPrice(product, user);
            const productLink = product.slug ? `/product/${product.slug}` : '/products';
            return (
              <div key={product._id || product.id || index} className="group p-2 hover:bg-secondary/50 rounded-lg transition-colors">
                <Link href={productLink} className="flex gap-2">
                  <div className="relative w-16 h-16 shrink-0 rounded bg-secondary overflow-hidden">
                    <Image
                      src={resolveProductImages(product.images || [])[0] || '/placeholder.jpg'}
                      alt={product.name || 'Product'}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors mb-1">
                      {product.name || 'Unnamed product'}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      {formatPrice(displayPrice.price)}
                    </p>
                  </div>
                </Link>
                <Button
                  size="sm"
                  className="w-40 mt-2 h-8 text-xs "
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
        </div>
      </div>
    </div>
  );
};
