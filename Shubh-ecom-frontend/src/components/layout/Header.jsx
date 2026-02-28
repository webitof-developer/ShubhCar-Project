//src/components/layout/Header.jsx

"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ShoppingCart, User, X, LogOut, Heart, Loader, ChevronRight, Star, BadgeCheck, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { searchProducts } from '@/services/productService';
import { getDisplayPrice, formatPrice } from '@/services/pricingService';
import { getProductIdentifier, getProductTypeLabel, isOemProduct, isVehicleBasedProduct } from '@/utils/productType';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import Image from 'next/image';

const SearchResultsDropdown = ({ results, isLoading, isVisible, onClose, query, user }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-3 bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
      {isLoading ? (
        <div className="p-6 flex flex-col items-center justify-center text-muted-foreground">
          <Loader className="animate-spin h-6 w-6 mb-2 text-primary" />
          <span className="text-sm font-medium">Searching...</span>
        </div>
      ) : results.length > 0 ? (
        <div className="max-h-[65vh] overflow-y-auto scrollbar-hide">
          <div className="p-2 space-y-1">
            {results.map((product) => {
              const { price, type, originalPrice } = getDisplayPrice(product, user);
              const isWholesale = type === 'wholesale';
              const inStock = product.stockStatus !== 'OUT_OF_STOCK';
              const isOem = isOemProduct(product.productType);

              // Fallback for MRP/Original price logic
              const showOriginalPrice = originalPrice || product.mrp || (product.retailPrice > price ? product.retailPrice : null);

              return (
                <Link
                  href={`/product/${product.slug}`}
                  key={product._id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/50 group transition-all duration-200 border border-transparent hover:border-border/50"
                  onClick={onClose}
                >
                  <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-white border border-border/40 shadow-sm group-hover:shadow-md transition-shadow">
                    <Image
                      src={product.images?.[0]?.url || '/placeholder.png'}
                      alt={product.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full gap-1">
                    <div>
                      {/* Top Row: Badge + Rating */}
                      <div className="flex items-center justify-between mb-1">
                        <Badge
                          variant={isOem ? 'default' : 'secondary'}
                          className="text-[10px] font-medium px-2 py-0.5 shadow-sm h-5"
                        >
                          {isOem ? (
                            <><ShieldCheck className="w-3 h-3 mr-1" />{getProductTypeLabel(product.productType)}</>
                          ) : (
                            getProductTypeLabel(product.productType)
                          )}
                        </Badge>

                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-medium text-muted-foreground">
                            {Number(product.ratingAvg || 0).toFixed(1)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ({product.ratingCount || 0})
                          </span>
                        </div>
                      </div>

                      {/* Product Name */}
                      <p className="font-semibold text-sm line-clamp-1 text-foreground group-hover:text-primary transition-colors">
                        {product.name}
                      </p>

                      {/* Details: Brand • Part Number */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="truncate max-w-[100px]">
                          {isVehicleBasedProduct(product.productType)
                            ? (product.vehicleBrand || product.manufacturerBrand || 'N/A')
                            : (product.manufacturerBrand || 'N/A')}
                        </span>
                        <span>•</span>
                        <span className="font-mono bg-muted px-1 rounded">{getProductIdentifier(product)}</span>
                      </div>

                      {/* Category */}
                      {product.categorySlug && (
                        <div className="text-[10px] text-muted-foreground mt-1 truncate opacity-80">
                          in <span className="font-medium">{product.categorySlug.replace(/-/g, ' ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side: Price + Stock */}
                  <div className="text-right shrink-0 flex flex-col items-end justify-between h-full gap-2 self-stretch pt-1">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-base text-primary">
                        {formatPrice(price)}
                      </span>

                      {showOriginalPrice && showOriginalPrice > price && (
                        <span className="text-xs text-muted-foreground line-through decoration-destructive/50">
                          {formatPrice(showOriginalPrice)}
                        </span>
                      )}

                      {isWholesale && (
                        <Badge variant="outline" className="text-[10px] px-1 h-5 mt-1 border-primary/20 text-primary bg-primary/5">
                          Wholesale
                        </Badge>
                      )}
                    </div>

                    <span className={cn(
                      "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border mb-1",
                      inStock
                        ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                        : "text-red-600 border-red-200 bg-red-50"
                    )}>
                      {inStock ? <BadgeCheck className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
          <Link
            href={`/categories?search=${encodeURIComponent(query)}`}
            className="flex items-center justify-between px-4 py-3 bg-secondary/30 hover:bg-secondary/60 border-t border-border/50 text-sm font-medium text-primary transition-colors cursor-pointer"
            onClick={onClose}
          >
            <span>View all items for "{query}"</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="p-8 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-3">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No matches found</p>
          <p className="text-xs text-muted-foreground mt-1">Try checking your spelling or use different keywords.</p>
        </div>
      )}
    </div>
  );
};

const Header = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Search State
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const { siteName } = useSiteConfig();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const isAuthReady = hasMounted && isAuthenticated;
  const authUser = isAuthReady ? user : null;

  // Handle Focus Search Intent from Mobile Bottom Nav
  useEffect(() => {
    const handleOpenSearch = () => {
      setIsSearchOpen(true);
      // Optional: focus the input if possible, but state change usually triggers render which shows the input
    };

    window.addEventListener('open-mobile-search', handleOpenSearch);

    // Also keep the param check as valid fallback/direct link support
    if (searchParams?.get('focus') === 'search') {
      setIsSearchOpen(true);
    }

    return () => {
      window.removeEventListener('open-mobile-search', handleOpenSearch);
    };
  }, [searchParams]);

  // Handle Search Fetching
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        setShowResults(true);
        try {
          // Pass limit: 6 for a quick preview
          const results = await searchProducts(searchQuery, { limit: 6 });
          setSearchResults(results);
        } catch (error) {
          console.error("Search error", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Handle Click Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside the search container
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(false);
      router.push(`/categories?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
    toast.success('Logged out successfully');
    router.push('/');
  };

  const displayName = isAuthReady && authUser
    ? `${authUser.firstName ?? ''} ${authUser.lastName ?? ''}`.trim() || authUser.email || 'User'
    : '';

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-20 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0 transition-opacity hover:opacity-90">
              <div className="relative h-10 w-32 md:h-12 md:w-40">
                <Image
                  src="/logodark.png"
                  alt={`${siteName || 'Site'} Logo`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 items-center justify-center max-w-2xl px-8" ref={searchRef}>
              <form onSubmit={handleSearch} className="w-full relative group">
                <div className="relative z-50">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                  <Input
                    type="search"
                    placeholder="Search parts, brands, OEM numbers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length > 1 && setShowResults(true)}
                    className="w-full pl-12 pr-4 h-11 bg-secondary/30 hover:bg-secondary/50 focus:bg-background border-transparent focus:border-primary/20 rounded-full shadow-sm focus:shadow-md transition-all duration-300 placeholder:text-muted-foreground/70"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-focus-within:block">
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">Enter</span>
                  </div>
                </div>
                {/* Desktop Dropdown */}
                <SearchResultsDropdown
                  results={searchResults}
                  isLoading={isSearching}
                  isVisible={showResults}
                  onClose={() => setShowResults(false)}
                  query={searchQuery}
                  user={user}
                />
              </form>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Mobile Search Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full hover:bg-secondary/80 text-foreground/80"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
              </Button>

              {/* Wishlist */}
              <Link href="/wishlist">
                <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-secondary/80 text-foreground/80 hover:text-primary transition-colors">
                  <Heart className="h-5 w-5 md:h-6 md:w-6" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-[2px] right-[2px] h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-background animate-in zoom-in-50 duration-300">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Cart */}
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-secondary/80 text-foreground/80 hover:text-primary transition-colors">
                  <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
                  {itemCount > 0 && (
                    <span className="absolute top-[2px] right-[2px] h-4 w-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-background animate-in zoom-in-50 duration-300">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Auth: User Menu */}
              {isAuthReady ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-secondary/80 text-foreground/80 hover:text-primary transition-colors focus-visible:ring-0">
                      <User className="h-5 w-5 md:h-6 md:w-6" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-2 border-border/50 shadow-xl bg-background/95 backdrop-blur-md rounded-xl mt-2">
                    <div className="px-3 py-2.5 bg-secondary/30 rounded-lg mb-2">
                      <p className="text-sm font-semibold truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate opacity-80">
                        {authUser?.email || authUser?.phone}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-primary/10 focus:text-primary">
                        <Link href="/profile" className="flex items-center w-full">
                          My Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-primary/10 focus:text-primary">
                        <Link href="/orders" className="flex items-center w-full">
                          My Orders
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer focus:bg-primary/10 focus:text-primary">
                        <Link href="/wishlist" className="flex items-center w-full">
                          My Wishlist
                        </Link>
                      </DropdownMenuItem>
                    </div>

                    <DropdownMenuSeparator className="my-2 bg-border/50" />

                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg"
                      onClick={() => setShowLogoutDialog(true)}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login" className="ml-2">
                  <Button size="sm" className="rounded-full px-6 font-medium shadow-md hover:shadow-lg transition-all duration-300 bg-primary hover:bg-primary/90">
                    <User className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Search Bar - Expandable */}
          <div
            className={cn(
              "md:hidden overflow-hidden transition-all duration-300 ease-in-out origin-top",
              isSearchOpen ? "max-h-[600px] opacity-100 mb-4" : "max-h-0 opacity-0"
            )}
          >
            <form onSubmit={handleSearch} className="pb-2 relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search parts, brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length > 1 && setShowResults(true)}
                  className="w-full pl-10 pr-4 h-10 bg-secondary/50 border-transparent rounded-full focus:bg-background focus:border-primary/20 shadow-sm"
                  autoFocus={isSearchOpen}
                />
              </div>
              {/* Mobile Dropdown - Rendered relatively within the expanded zone */}
              <div className="mt-2">
                <SearchResultsDropdown
                  results={searchResults}
                  isLoading={isSearching}
                  isVisible={showResults}
                  onClose={() => setShowResults(false)}
                  query={searchQuery}
                  user={user}
                />
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="rounded-2xl border-border/50 shadow-2xl bg-background/95 backdrop-blur-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Logout?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to logout from your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-border/50 hover:bg-secondary/80">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md">Yes, Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Header;
