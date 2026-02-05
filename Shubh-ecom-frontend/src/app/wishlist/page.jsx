//src/app/wishlist/page.jsx

"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import {
  Heart,
  ChevronLeft,
  ShoppingCart,
  Trash2,
  Package
} from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { getDisplayPrice, formatPrice } from '@/services/pricingService';
import { resolveProductImages } from '@/utils/media';

const Wishlist = () => {
  const router = useRouter();
  const [sortBy, setSortBy] = useState('date-added');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { items, removeFromWishlist, clearWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const getIdentifier = (product) => {
    if (!product) return '';
    return product.productType === 'OEM'
      ? (product.oemNumber || 'N/A')
      : (product.manufacturerBrand || 'N/A');
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  const handleRemove = (productId) => {
    removeFromWishlist(productId);
    toast.success('Removed from wishlist');
  };

  const handleMoveAllToCart = () => {
    items.forEach(product => {
      addToCart(product, 1);
    });
    clearWishlist();
    toast.success('All items moved to cart!');
  };

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = items.slice(startIndex, endIndex);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const WishlistSkeleton = () => (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-md animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-6 w-32 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-9 w-32 bg-slate-100 rounded animate-pulse"></div>
        </div>

        <div className="space-y-3">
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-secondary/30 rounded-lg">
            {[...Array(5)].map((_, i) => <div key={i} className="h-4 bg-slate-200/50 rounded animate-pulse col-span-2"></div>)}
          </div>

          {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-12 gap-4 items-center bg-card rounded-lg border border-border/50 p-4">
              <div className="col-span-12 md:col-span-1">
                <div className="w-20 h-20 md:w-16 md:h-16 bg-slate-100 rounded-lg animate-pulse"></div>
              </div>
              <div className="col-span-12 md:col-span-4 space-y-2">
                <div className="h-5 w-3/4 bg-slate-100 rounded animate-pulse"></div>
                <div className="h-3 w-1/2 bg-slate-50 rounded animate-pulse"></div>
              </div>
              <div className="col-span-6 md:col-span-2">
                <div className="h-6 w-20 bg-slate-100 rounded animate-pulse"></div>
              </div>
              <div className="col-span-6 md:col-span-2">
                <div className="h-4 w-16 bg-slate-100 rounded animate-pulse"></div>
              </div>
              <div className="col-span-10 md:col-span-2">
                <div className="h-9 w-full bg-slate-100 rounded animate-pulse"></div>
              </div>
              <div className="col-span-2 md:col-span-1">
                <div className="h-9 w-9 rounded-full bg-slate-100 animate-pulse mx-auto"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );

  if (loading) {
    return <WishlistSkeleton />;
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="w-16 h-16 mb-6 text-slate-300">
            <Heart className="w-full h-full stroke-[1.5]" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign in to view your wishlist</h2>
          <p className="text-slate-500 mb-8">View your saved items by signing in. </p>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-lg">Log In</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Wishlist</h1>
              <p className="text-sm text-muted-foreground">{items.length} items saved</p>
            </div>
          </div>
          {items.length > 0 && (
            <Button onClick={handleMoveAllToCart} size="sm">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Move All to Cart
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border/50">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6">Save items you love to your wishlist</p>
            <Link href="/categories">
              <Button>Browse Products</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-secondary/30 rounded-lg text-sm font-medium text-muted-foreground">
                <div className="col-span-1">IMAGE</div>
                <div className="col-span-4 text-center">PRODUCT</div>
                <div className="col-span-2">PRICE</div>
                <div className="col-span-2">STATUS</div>
                <div className="col-span-2">PURCHASE</div>
                <div className="col-span-1">REMOVE</div>
              </div>

              {currentItems.map((product) => (
                <div
                  key={product._id || product.id}
                  className="grid grid-cols-12 gap-4 items-center bg-card rounded-lg border border-border/50 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="col-span-12 md:col-span-1">
                    <Link href={`/product/${product.slug}`}>
                      <div className="w-20 h-20 md:w-16 md:h-16 bg-secondary rounded-lg overflow-hidden">
                        <img
                          src={resolveProductImages(product.images || [])[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                  </div>

                  <div className="col-span-12  md:col-span-4 md:text-center">
                    <Link href={`/product/${product.slug}`}>
                      <h3 className="font-semibold hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">{getIdentifier(product)}</p>
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <div className="text-xl font-bold text-primary">
                      {formatPrice(getDisplayPrice(product, user).price)}
                    </div>
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    {(product.stockQty || 0) > 0 ? (
                      <span className="text-sm text-success flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        In Stock
                      </span>
                    ) : (
                      <span className="text-sm text-destructive">Out of Stock</span>
                    )}
                  </div>

                  <div className="col-span-10 md:col-span-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      disabled={(product.stockQty || 0) <= 0}
                      className="w-full md:w-auto"
                    >
                      <ShoppingCart className="w-4 h-4 md:mr-0" />
                      <span className="hidden md:inline">Add </span>
                    </Button>
                  </div>

                  <div className="col-span-2 md:col-span-1 flex justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemove(product._id || product.id)}
                      className="rounded-full border-destructive/50 text-destructive hover:bg-destructive hover:text-white hover:border-destructive transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Wishlist;
