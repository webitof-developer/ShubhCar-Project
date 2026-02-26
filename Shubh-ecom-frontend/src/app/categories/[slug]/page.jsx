// src/app/categories/[slug]/page.jsx
// Route: /categories/[slug]

"use client";
import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search, ChevronRight, FolderOpen, X, SlidersHorizontal,
  Package, Grid3X3, List, Home, Star, ShoppingCart,
  Folder, LayoutGrid,
} from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { CategorySidebar } from '@/components/category/CategorySidebar';
import {
  getProducts,
  getProductsByCategory,
  searchProducts as searchProductsService,
} from '@/services/productService';
import {
  getCategoryBySlug,
  getChildCategories,
  getCategoryBreadcrumb,
  getRootCategories,
} from '@/services/categoryService';
import { filterProductsByAccess } from '@/services/productAccessService';
import { useAuth } from '@/context/AuthContext';
import { getDisplayPrice, formatPrice } from '@/services/pricingService';
import { useVehicleSelection } from '@/context/VehicleContext';
import { VehicleSelectionBar } from '@/components/vehicle/VehicleSelectionBar';
import { getProductTypeLabel, getProductTypeBadge, isOemProduct } from '@/utils/productType';
import { resolveProductImages } from '@/utils/media';
import { Badge } from '@/components/ui/badge';
import WishlistButton from '@/components/product/WishlistButton';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

const PAGE_SIZE = 12;

/* ── Left Sidebar ────────────────────────────────────────────────────────── */
const LeftSidebar = ({ currentSlug, sidebarCategories, sidebarTitle, filterType, onToggleFilter, products, clearFilters }) => {
  // Scroll the active item into view inside the bounded <ul> on mount
  const activeItemRef = useCallback((node) => {
    if (node) node.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, []);

  return (
    <aside className="w-56 flex-shrink-0 hidden lg:block">
      {/*
        One sticky wrapper for the whole sidebar so the two cards never
        overlap each other. overflow-y-auto lets the sidebar itself scroll
        if the viewport is too short to show everything at once.
      */}
      <div
        className="sticky top-4 flex flex-col gap-3 overflow-y-auto [&::-webkit-scrollbar]:hidden"
        style={{ maxHeight: 'calc(100vh - 5rem)', scrollbarWidth: 'none' }}
      >
        {/* Category tree */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden flex-shrink-0">
          <div className="px-4 py-3 border-b border-border/30 bg-muted/30 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">{sidebarTitle || 'Categories'}</span>
          </div>
          <ul
            className="py-1 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none' }}
          >
            {(sidebarCategories || []).map((cat) => {
              const isActive = cat.slug === currentSlug;
              return (
                <li key={cat._id || cat.id} ref={isActive ? activeItemRef : null}>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className={`flex items-center justify-between gap-2 px-4 py-2 text-sm transition-colors group ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold border-r-2 border-primary'
                        : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Folder className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Product Type Filter */}
        <div className="bg-card rounded-xl border border-border/50 p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Type</h3>
            {filterType.length > 0 && (
              <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear</button>
            )}
          </div>
          <div className="space-y-2.5">
            {['OEM', 'AFTERMARKET'].map((type) => (
              <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  checked={filterType.includes(type)}
                  onCheckedChange={(checked) => onToggleFilter(type, checked)}
                  className="border-2 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary w-4 h-4"
                />
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                  {getProductTypeLabel(type)}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {(products || []).filter((p) => p.productType === type).length}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};


/* ── Product List Item (premium row card) ───────────────────────────────── */
const ProductListItem = ({ product }) => {
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
      <div className="relative w-36 md:w-44 flex-shrink-0 bg-muted/40 overflow-hidden">
        <img
          src={img}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 min-h-[120px]"
        />
        {/* Type badge pinned to top-left */}
        <span className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white ${isOem ? 'bg-blue-600' : 'bg-slate-600'}`}>
          {isOem ? 'OEM' : 'AM'}
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
            {product.oemNumber && (
              <span className="bg-muted/60 px-1.5 py-0.5 rounded font-mono text-foreground/60">
                Part# {product.oemNumber}
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

/* ── Product Grid Card ─────────────────────────────────────────────────────── */
const ProductGridCard = ({ product }) => {
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

/* ── Sub-Category Card grid ─────────────────────────────────────────────────── */
const SubCategoryGrid = ({ categories }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
    {categories.map((sub, i) => (
      <Link
        key={sub._id || sub.id || i}
        href={`/categories/${sub.slug}`}
        className="group flex flex-col items-center bg-card rounded-xl border border-border/50 hover:border-primary/40 hover:shadow-md transition-all p-4 text-center"
      >
        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
          {sub.image
            ? <img src={sub.image} alt={sub.name} className="w-10 h-10 object-contain" />
            : <FolderOpen className="w-7 h-7 text-primary" />
          }
        </div>
        <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1">
          {sub.name}
        </h3>
        {sub.productCount > 0 && (
          <span className="text-xs text-muted-foreground">{sub.productCount} parts</span>
        )}
      </Link>
    ))}
  </div>
);

/* ── Skeleton ───────────────────────────────────────────────────────────────── */
const PageSkeleton = () => (
  <Layout>
    <div className="container mx-auto px-4 py-6 flex gap-6 animate-pulse">
      <div className="w-56 hidden lg:block space-y-3">
        <div className="h-72 bg-muted rounded-xl" />
        <div className="h-32 bg-muted rounded-xl" />
      </div>
      <div className="flex-1 space-y-4">
        <div className="h-6 w-64 bg-muted rounded" />
        <div className="h-11 w-full bg-muted rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  </Layout>
);

/* ── Main Content Component ─────────────────────────────────────────────────── */
const CategoryContent = () => {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const searchQuery = searchParams?.get('search') || '';
  const { user } = useAuth();
  const { selection, isActive } = useVehicleSelection();
  const vehicleKey = (selection?.vehicleIds || []).join(',');

  const [sortBy, setSortBy] = useState('relevance');
  const [filterType, setFilterType] = useState([]);
  const [inlineSearch, setInlineSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState(null);
  const [childCategories, setChildCategories] = useState([]);
  const [siblingCategories, setSiblingCategories] = useState([]);
  const [parentCategory, setParentCategory] = useState(null);
  const [rootCategories, setRootCategories] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);

  /* Load root categories for sidebar fallback */
  useEffect(() => {
    getRootCategories().then((cats) => setRootCategories(Array.isArray(cats) ? cats : [])).catch(() => {});
  }, []);

  /* Load category meta */
  useEffect(() => {
    const load = async () => {
      setInitialLoading(true);
      setSiblingCategories([]); setParentCategory(null);
      if (!slug) { setInitialLoading(false); return; }
      try {
        const cat = await getCategoryBySlug(slug);
        setCategory(cat);
        const [children, crumbs] = await Promise.all([
          cat?._id ? getChildCategories(cat._id) : Promise.resolve([]),
          getCategoryBreadcrumb(slug),
        ]);
        const childList = children || [];
        setChildCategories(childList);
        setBreadcrumb(crumbs || []);

        // If this is a leaf (no children), show siblings in sidebar
        if (childList.length === 0 && crumbs && crumbs.length >= 2) {
          // Parent is second-to-last in breadcrumb
          const parentCrumb = crumbs[crumbs.length - 2];
          setParentCategory(parentCrumb);
          const siblings = await getChildCategories(parentCrumb._id);
          setSiblingCategories(siblings || []);
        } else if (childList.length === 0 && cat?.parentId) {
          // fallback: use parentId if no breadcrumb depth
          const siblings = await getChildCategories(cat.parentId);
          setSiblingCategories(siblings || []);
        }
      } catch (e) {
        console.error('[CategoryV2] meta load failed', e);
        setCategory(null); setChildCategories([]); setBreadcrumb([]);
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, [slug]);

  /* Load products */
  const fetchPage = async ({ targetPage, append = false } = {}) => {
    const vehicleIds = selection?.vehicleIds || [];
    const productType = filterType.length > 0 ? filterType.join(',') : undefined;
    let list = [];
    if (slug) {
      list = await getProductsByCategory(slug, { vehicleIds, productType, page: targetPage, limit: PAGE_SIZE });
    } else if (searchQuery) {
      list = await searchProductsService(searchQuery, { vehicleIds, productType, page: targetPage, limit: PAGE_SIZE });
    } else {
      list = await getProducts({ vehicleIds, productType, page: targetPage, limit: PAGE_SIZE });
    }
    const items = Array.isArray(list) ? list : [];
    setProducts((prev) => (append ? [...prev, ...items] : items));
    setHasMore(items.length === PAGE_SIZE);
    setPage(targetPage);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoadingProducts(true);
      setHasMore(true);
      setPage(1);
      try { await fetchPage({ targetPage: 1, append: false }); } catch (e) {
        if (active) { setProducts([]); setHasMore(false); }
      } finally {
        if (active) setLoadingProducts(false);
      }
    };
    load();
    return () => { active = false; };
  }, [slug, searchQuery, vehicleKey, filterType]);

  /* Derived / filtered list */
  const filteredProducts = useMemo(() => {
    let result = filterProductsByAccess(products, user);
    if (inlineSearch.trim()) {
      const q = inlineSearch.toLowerCase();
      result = result.filter((p) =>
        p.name?.toLowerCase().includes(q) ||
        p.manufacturerBrand?.toLowerCase().includes(q) ||
        p.oemNumber?.toLowerCase().includes(q)
      );
    }
    const getPrice = (p) => getDisplayPrice(p, user).price || 0;
    if (sortBy === 'price-low') result = [...result].sort((a, b) => getPrice(a) - getPrice(b));
    if (sortBy === 'price-high') result = [...result].sort((a, b) => getPrice(b) - getPrice(a));
    if (sortBy === 'name-az') result = [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (sortBy === 'name-za') result = [...result].sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    return result;
  }, [products, filterType, sortBy, inlineSearch, user]);

  const clearFilters = () => { setFilterType([]); setInlineSearch(''); setSortBy('relevance'); };
  const handleFilterToggle = (type, checked) => setFilterType((prev) => checked ? [...prev, type] : prev.filter((t) => t !== type));

  const activeFiltersCount = filterType.length + (inlineSearch ? 1 : 0);
  const hasChildren = childCategories.length > 0;
  const hasProducts = filteredProducts.length > 0;
  const showEmpty = !loadingProducts && !hasChildren && !hasProducts && !inlineSearch && filterType.length === 0;

  if (initialLoading) return <PageSkeleton />;

  return (
    <Layout>
      {/* ── Breadcrumb ── */}
      <div className="border-b border-border/50 bg-muted/20">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap overflow-x-auto whitespace-nowrap no-scrollbar">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            <Link href="/categories" className="hover:text-primary transition-colors">All Categories</Link>
            {breadcrumb.map((cat, i) => (
              <span key={cat._id || cat.id} className="flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                {i === breadcrumb.length - 1 ? (
                  <span className="text-foreground font-medium">{cat.name}</span>
                ) : (
                  <Link href={`/categories/${cat.slug}`} className="hover:text-primary transition-colors">{cat.name}</Link>
                )}
              </span>
            ))}
            {!category && (
              <>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                <span className="text-foreground font-medium">{searchQuery ? `"${searchQuery}"` : 'All Parts'}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-5 md:py-7">
        {/* ── Vehicle Bar ── */}
        <div className="mb-5">
          <VehicleSelectionBar title="Selected Vehicle" />
        </div>

        <div className="flex gap-5 lg:gap-6">
          {/* ── Left Sidebar ── */}
          {/* Logic:
            - Has children → show children (drill-down)
            - Leaf + has siblings → show siblings under parent
            - Fallback → show root categories
          */}
          <LeftSidebar
            currentSlug={slug}
            sidebarCategories={
              childCategories.length > 0
                ? childCategories
                : siblingCategories.length > 0
                  ? siblingCategories
                  : rootCategories
            }
            sidebarTitle={
              childCategories.length > 0
                ? 'Sub-categories'
                : parentCategory
                  ? parentCategory.name
                  : 'Categories'
            }
            filterType={filterType}
            onToggleFilter={handleFilterToggle}
            products={products}
            clearFilters={clearFilters}
          />

          {/* ── Main Area ── */}
          <div className="flex-1 min-w-0">
            {/* Page header */}
            <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  {category?.name || (searchQuery ? `Results for "${searchQuery}"` : 'All Parts')}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {loadingProducts
                    ? 'Loading products…'
                    : hasChildren
                      ? `${childCategories.length} sub-categories`
                      : hasProducts
                        ? `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} found`
                        : isActive
                          ? 'No compatible products for selected vehicle'
                          : 'No products yet'}
                </p>
              </div>
            </div>

            {/* Sub-categories */}
            {hasChildren && (
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Sub-categories</p>
                <SubCategoryGrid categories={childCategories} />
              </div>
            )}

            {/* Product controls toolbar */}
            {!hasChildren && (
              <>
                <div className="bg-card border border-border/50 rounded-xl px-3 py-2.5 mb-4">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search products…"
                        value={inlineSearch}
                        onChange={(e) => setInlineSearch(e.target.value)}
                        className="pl-9 pr-8 h-9 text-sm bg-muted/40 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-lg"
                      />
                      {inlineSearch && (
                        <button onClick={() => setInlineSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* View mode toggle */}
                      <div className="hidden sm:flex items-center border border-border/50 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                          title="List view"
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                          title="Grid view"
                        >
                          <Grid3X3 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Mobile filters sheet */}
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="icon" className="lg:hidden h-9 w-9 rounded-lg relative border-border/50">
                            <SlidersHorizontal className="w-4 h-4" />
                            {filterType.length > 0 && (
                              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {filterType.length}
                              </span>
                            )}
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl lg:hidden p-0">
                          <SheetHeader className="px-5 py-4 border-b border-border/50">
                            <div className="flex items-center justify-between">
                              <SheetTitle className="text-lg font-bold">Filters</SheetTitle>
                              {filterType.length > 0 && (
                                <button onClick={clearFilters} className="text-sm text-primary hover:underline">Clear All</button>
                              )}
                            </div>
                          </SheetHeader>
                          <div className="px-5 py-5 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Type</h4>
                            {['OEM', 'AFTERMARKET'].map((type) => (
                              <label key={type} className="flex items-center gap-3 cursor-pointer">
                                <Checkbox
                                  checked={filterType.includes(type)}
                                  onCheckedChange={(checked) => handleFilterToggle(type, checked)}
                                  className="border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary w-5 h-5"
                                />
                                <span className="text-base font-medium">{getProductTypeLabel(type)}</span>
                                <span className="ml-auto text-sm text-muted-foreground">{(products || []).filter((p) => p.productType === type).length}</span>
                              </label>
                            ))}
                          </div>
                        </SheetContent>
                      </Sheet>

                      {/* Sort */}
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[130px] sm:w-[150px] h-9 text-sm rounded-lg border-border/50 bg-background">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="relevance">Relevance</SelectItem>
                          <SelectItem value="price-low">Price: Low → High</SelectItem>
                          <SelectItem value="price-high">Price: High → Low</SelectItem>
                          <SelectItem value="name-az">Name: A → Z</SelectItem>
                          <SelectItem value="name-za">Name: Z → A</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Active filter chips */}
                  {activeFiltersCount > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2.5 mt-2.5 border-t border-border/30">
                      {inlineSearch && (
                        <button onClick={() => setInlineSearch('')} className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">
                          "{inlineSearch.length > 12 ? inlineSearch.slice(0, 12) + '…' : inlineSearch}" <X className="w-3 h-3" />
                        </button>
                      )}
                      {filterType.map((type) => (
                        <button key={type} onClick={() => setFilterType((prev) => prev.filter((t) => t !== type))}
                          className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">
                          {getProductTypeLabel(type)} <X className="w-3 h-3" />
                        </button>
                      ))}
                      <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-destructive ml-1 transition-colors">
                        Clear all
                      </button>
                    </div>
                  )}
                </div>

                {/* ── Product List / Grid ── */}
                {loadingProducts && products.length === 0 ? (
                  <div className="space-y-3 animate-pulse">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-32 bg-muted rounded-xl" />
                    ))}
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-xl border border-border/50">
                    {activeFiltersCount > 0 || inlineSearch ? (
                      <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    ) : (
                      <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    )}
                    <h3 className="text-lg font-semibold mb-1">
                      {activeFiltersCount > 0 || inlineSearch
                        ? isActive ? 'No compatible products' : 'No matching products'
                        : 'No parts found'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                      {activeFiltersCount > 0 || inlineSearch
                        ? isActive ? 'Try changing your vehicle or remove filters.' : 'Try adjusting your search or removing filters.'
                        : "We couldn't find any parts in this category."}
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      {(activeFiltersCount > 0 || inlineSearch) && (
                        <Button variant="outline" onClick={clearFilters} className="rounded-lg">Clear All Filters</Button>
                      )}
                      <Link href="/categories">
                        <Button className="rounded-lg">Browse Categories</Button>
                      </Link>
                    </div>
                  </div>
                ) : viewMode === 'list' ? (
                  <div className="space-y-3">
                    {filteredProducts.map((p) => <ProductListItem key={p._id || p.id} product={p} />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                    {filteredProducts.map((p) => (
                      <ProductGridCard key={p._id || p.id} product={p} />
                    ))}
                  </div>
                )}

                {/* Load more */}
                {hasMore && filteredProducts.length > 0 && (
                  <div className="text-center mt-8">
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-lg min-w-[200px]"
                      disabled={loadingMore}
                      onClick={async () => {
                        if (loadingMore || loadingProducts || !hasMore) return;
                        setLoadingMore(true);
                        try { await fetchPage({ targetPage: page + 1, append: true }); }
                        finally { setLoadingMore(false); }
                      }}
                    >
                      {loadingMore ? 'Loading…' : 'Show More Products'}
                    </Button>
                  </div>
                )}
              </>
            )}


          </div>
        </div>
      </div>
    </Layout>
  );
};

/* ── Page ─────────────────────────────────────────────────────────────────────── */
const CategorySlugPage = () => (
  <Suspense fallback={<PageSkeleton />}>
    <CategoryContent />
  </Suspense>
);

export default CategorySlugPage;
