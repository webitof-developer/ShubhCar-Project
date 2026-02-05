// src/components/product/WishlistButton.jsx

"use client";
import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/context/WishlistContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function WishlistButton({ 
  product, 
  variant = "ghost",
  size = "icon",
  showLabel = false,
  className 
}) {
  const { items, addToWishlist, removeFromWishlist, isInWishlist: checkWishlist } = useWishlist();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if product is in wishlist
  useEffect(() => {
    if (product) {
      const productId = product._id || product.id;
      setIsInWishlist(Boolean(productId && checkWishlist(productId)));
    }
  }, [product, items, checkWishlist]);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product || isLoading) return;

    setIsLoading(true);

    try {
      // Debounce: Wait 300ms before allowing another toggle
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const productId = product._id || product.id;
      if (!productId) return;
      if (isInWishlist) {
        removeFromWishlist(productId);
        toast.success('Removed from wishlist');
      } else {
        addToWishlist(product);
        toast.success('Added to wishlist', {
          description: product.name
        });
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "group/wishlist transition-all duration-300 relative",
        showLabel && "gap-2",
        // Translucent background
        "bg-background/80 backdrop-blur-sm",
        // Hover: red heart outline (not filled)
        "hover:bg-background/90",
        // Active (wishlisted) state - red filled heart
        isInWishlist && "bg-background/80",
        className
      )}
      title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart 
        className={cn(
          "transition-all duration-300",
          showLabel ? "w-5 h-5" : "w-5 h-5",
          // Default: black/foreground color
          "text-foreground",
          // Hover: red outline (not filled)
          "group-hover/wishlist:text-red-500",
          // Active (wishlisted): red filled
          isInWishlist && "fill-current text-red-500",
        )} 
      />
      {showLabel && (
        <span className="font-medium">
          {isInWishlist ? 'SAVED' : 'ADD TO WISHLIST'}
        </span>
      )}
    </Button>
  );
}
