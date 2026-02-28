import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Heart, ChevronRight, ShoppingCart } from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { getDisplayPrice, formatPrice } from '@/services/pricingService';
import { resolveProductImages } from '@/utils/media';
import { useAuth } from '@/context/AuthContext';
import { getProductIdentifier } from '@/utils/productType';

export const WishlistSection = () => {
  const { items, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const displayItems = items.slice(0, 3);

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    removeFromWishlist(product._id || product.id);
    toast.success('Moved to cart!');
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
      <div className="bg-secondary/30 px-5 py-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">My Wishlist</h3>
        {items.length > 0 && (
          <Link href="/wishlist">
            <Button variant="ghost" size="sm">
              View All ({items.length})
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>
      <div className="p-5">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Your wishlist is empty</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/categories">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {displayItems.map((product) => (
              <div
                key={product._id || product.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-secondary/20 hover:border-primary/30 transition-colors"
              >
                <Link href={`/product/${product.slug}`} className="flex-shrink-0">
                  <div className="relative w-14 h-14 rounded-lg bg-secondary overflow-hidden">
                    <Image
                      src={resolveProductImages(product.images || [])[0] || '/placeholder.jpg'}
                      alt={product.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${product.slug}`}>
                    <p className="text-sm font-medium truncate hover:text-primary transition-colors">
                      {product.name}
                    </p>
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {getProductIdentifier(product)}
                  </p>
                  <p className="text-sm font-semibold flex items-center mt-1">
                    {formatPrice(getDisplayPrice(product, user).price)}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="flex-shrink-0"
                  onClick={(e) => handleAddToCart(product, e)}
                  disabled={(product.stockQty || 0) <= 0}
                >
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {items.length > 3 && (
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/wishlist">
                  View {items.length - 3} more items
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
