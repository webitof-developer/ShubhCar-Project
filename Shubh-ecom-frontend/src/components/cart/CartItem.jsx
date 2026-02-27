import Link from 'next/link';
import { Star, ShieldCheck, Trash2, Minus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getProductTypeLabel, isOemProduct } from '@/utils/productType';
import { getDisplayPrice, formatPrice } from '@/services/pricingService';
import { resolveProductImages } from '@/utils/media';

export const CartItem = ({ item, index, user, removeFromCart, updateQuantity, summary, cartTaxLabel }) => {
  const product = item?.product;
  if (!product) return null;

  const pricing = getDisplayPrice(product, user);
  const { price: unitPrice, originalPrice, savingsPercent, type } = pricing;
  const productLink = product.slug ? `/product/${product.slug}` : '/products';

  return (
    <div className="bg-card rounded-xl border border-border/50 p-3 md:p-4 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex gap-4">
        {/* Image Container with Badges */}
        <Link href={productLink} className="w-24 h-24 md:w-32 md:h-32 bg-secondary rounded-lg overflow-hidden shrink-0 group relative block">
          <img
            src={resolveProductImages(product.images || [])[0]}
            alt={product.name || 'Product'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Badges Overlay */}
          <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
            <Badge
              variant={isOemProduct(product.productType) ? 'default' : 'secondary'}
              className="text-[10px] font-medium px-1.5 py-0.5 shadow-sm h-auto"
            >
              {isOemProduct(product.productType) ? (
                <><ShieldCheck className="w-3 h-3 mr-1" />{getProductTypeLabel(product.productType)}</>
              ) : (
                getProductTypeLabel(product.productType)
              )}
            </Badge>

            {savingsPercent && (
              <span className="bg-destructive text-destructive-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm w-fit">
                -{savingsPercent}%
              </span>
            )}
          </div>
        </Link>

        {/* Info Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={productLink} className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 text-sm md:text-base mb-1">
                  {product.name || 'Unnamed product'}
                </Link>

                {/* Vehicle Brand / Brand - Value Only */}
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  {product.productType === 'OEM'
                    ? (product.vehicleBrand || 'N/A')
                    : (product.manufacturerBrand || 'N/A')}
                </p>

                {/* Tags Row: Rating, Stock, Type */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {/* Rating */}
                  <div className="flex items-center gap-1 bg-secondary rounded px-1.5 py-0.5">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span className="text-xs font-bold text-foreground">
                      {Number(product.ratingAvg || 0).toFixed(1)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ({product.ratingCount || 0} reviews)
                    </span>
                  </div>

                  {/* Stock Status */}
                  {(product.stockQty || 0) > 0 ? (
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/50">
                      {(product.stockQty || 0) < 5 ? `Only ${product.stockQty} left` : 'In Stock'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/50">
                      Out of Stock
                    </span>
                  )}

                  {/* Wholesale Badge */}
                  {type === 'wholesale' && (
                    <Badge variant="default" className="text-[10px] bg-blue-600 px-1.5 py-0.5 h-auto rounded-sm hover:bg-blue-700">
                      Wholesale
                    </Badge>
                  )}
                </div>
              </div>
              <button 
                onClick={() => removeFromCart(item.id)} 
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0" 
                aria-label="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Price and Quantity Control Row */}
          <div className="flex items-end justify-between mt">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-base md:text-lg font-bold text-primary">
                  {formatPrice((unitPrice || 0) * item.quantity)}
                </span>
                {originalPrice && (
                  <span className="text-xs text-muted-foreground line-through decoration-slate-400/50">
                    {formatPrice((originalPrice || 0) * item.quantity)}
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-0.5">
                {formatPrice(unitPrice || 0)} each
                {summary && (
                  <span className="ml-1 text-success">({cartTaxLabel})</span>
                )}
              </p>
            </div>

            <div className="flex items-center bg-secondary/50 rounded-lg border border-border/50">
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2.5 hover:bg-secondary rounded-l-lg transition-colors disabled:opacity-50" disabled={item.quantity <= 1}>
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2.5 hover:bg-secondary rounded-r-lg transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
