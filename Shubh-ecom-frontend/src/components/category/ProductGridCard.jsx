import Link from 'next/link';
import { Star, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { getDisplayPrice, formatPrice } from '@/services/pricingService';
import { resolveProductImages } from '@/utils/media';
import { isOemProduct } from '@/utils/productType';
import WishlistButton from '@/components/product/WishlistButton';
import { Button } from '@/components/ui/button';

export const ProductGridCard = ({ product }) => {
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
      className="group flex flex-col bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted/40 overflow-hidden">
        <img
          src={img}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Type badge */}
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white ${isOem ? 'bg-blue-600' : 'bg-slate-600'}`}>
          {isOem ? 'OEM' : 'AM'}
        </span>
        {/* Discount badge */}
        {discountPct > 0 && (
          <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-500 text-white">
            -{discountPct}%
          </span>
        )}
        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded-md">Out of Stock</span>
          </div>
        )}
        {/* Cart / wishlist hover buttons */}
        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <WishlistButton
            product={product}
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-xl bg-background/90 backdrop-blur-sm border border-border/50 shadow"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 gap-1.5">
        {/* Brand */}
        {(product.manufacturerBrand || product.vehicleBrand) && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 truncate">
            {product.manufacturerBrand || product.vehicleBrand}
          </p>
        )}

        {/* Name */}
        <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* SKU / Part# */}
        {(product.sku || product.oemNumber) && (
          <p className="text-[10px] font-mono text-muted-foreground truncate">
            {product.oemNumber ? `Part# ${product.oemNumber}` : `SKU: ${product.sku}`}
          </p>
        )}

        {/* Star rating — always shown */}
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-0.5">
            {[1,2,3,4,5].map((s) => (
              <Star
                key={s}
                className={`w-2.5 h-2.5 ${s <= Math.round(ratingAvg) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30 fill-muted-foreground/10'}`}
              />
            ))}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {ratingAvg.toFixed(1)} ({ratingCount})
          </span>
        </div>

        {/* Stock */}
        <div className={`text-[10px] font-medium flex items-center gap-1 ${inStock ? 'text-green-600' : 'text-red-500'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
          {inStock ? (stockQty <= 10 ? `Only ${stockQty} left` : 'In Stock') : 'Out of Stock'}
        </div>

        {/* Price + CTA */}
        <div className="mt-auto pt-2 border-t border-border/30 flex items-end justify-between gap-2">
          <div>
            <div className="font-extrabold text-base text-foreground leading-none">{formatPrice(unitPrice)}</div>
            {mrp > unitPrice && (
              <div className="text-[10px] text-muted-foreground line-through mt-0.5">{formatPrice(mrp)}</div>
            )}
          </div>
          <Button
            size="sm"
            className={`h-8 px-3 text-xs font-bold rounded-xl flex-shrink-0 ${
              inStock ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            onClick={handleCart}
            disabled={!inStock}
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1" />
            {isInCart ? 'In Cart' : 'Add'}
          </Button>
        </div>
      </div>
    </Link>
  );
};
