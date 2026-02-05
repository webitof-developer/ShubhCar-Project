"use client";
import { useState, useMemo, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, ChevronRight, FolderOpen, X, SlidersHorizontal, Package, Grid3X3, LayoutGrid } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { CategorySidebar } from '@/components/category/CategorySidebar';
import {
  getProducts,
  getProductsByCategory,
  searchProducts as searchProductsService
} from '@/services/productService';
import {
  getCategoryBySlug,
  getChildCategories,
  getCategoryBreadcrumb
} from '@/services/categoryService';
import { filterProductsByAccess } from '@/services/productAccessService';
import { useAuth } from '@/context/AuthContext';
import { getDisplayPrice } from '@/services/pricingService';
import { useVehicleSelection } from '@/context/VehicleContext';
import { VehicleSelectionBar } from '@/components/vehicle/VehicleSelectionBar';
import { getProductTypeLabel } from '@/utils/productType';

const PAGE_SIZE = 12;

const SubCategorySkeleton = () => (
  <Layout>
    <div className="bg-slate-50 border-b border-slate-200">
      <div className="container mx-auto px-4 py-4">
        <div className="h-5 w-64 bg-slate-200 rounded animate-pulse"></div>
      </div>
    </div>
    <div className="container mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="mb-8 space-y-3">
        <div className="h-8 w-1/3 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-4 w-1/4 bg-slate-100 rounded animate-pulse"></div>
      </div>

      {/* Vehicle Bar Skeleton */}
      <div className="max-w-4xl mx-auto h-16 bg-slate-100 rounded-lg animate-pulse mb-8"></div>

      <div className="flex gap-8">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:block w-64 shrink-0 space-y-6">
          <div className="h-[300px] border border-slate-100 bg-white rounded-xl p-5 animate-pulse">
            <div className="h-5 w-1/2 bg-slate-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-3">
                  <div className="w-5 h-5 bg-slate-100 rounded"></div>
                  <div className="h-5 w-3/4 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Grid Skeleton */}
        <div className="flex-1">
          <div className="flex justify-between mb-6">
            <div className="h-11 w-full max-w-sm bg-slate-100 rounded-lg animate-pulse"></div>
            <div className="hidden md:flex gap-2">
              <div className="h-11 w-11 bg-slate-100 rounded-lg animate-pulse"></div>
              <div className="h-11 w-40 bg-slate-100 rounded-lg animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-lg p-3 h-[380px] animate-pulse">
                <div className="w-full h-48 bg-slate-50 rounded-md mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
                  <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
                  <div className="h-6 w-1/3 bg-slate-200 rounded mt-4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </Layout>
);

const FilterContent = ({ allProducts, filterType, onToggleFilter }) => (
  <div className="space-y-6">
    <div>
      <h4 className="text-sm font-bold text-foreground mb-3 lg:mb-3 uppercase tracking-wide flex items-center gap-2">
        <div className="w-1 h-3 lg:h-4 bg-primary rounded-full"></div>
        Product Type
      </h4>
      <div className="space-y-3 lg:space-y-3">
        {['OEM', 'AFTERMARKET'].map(type => (
          <label key={type} className="flex items-center gap-3 cursor-pointer group py-0.5 lg:py-1">
            <Checkbox
              checked={filterType.includes(type)}
              onCheckedChange={(checked) => onToggleFilter(type, checked)}
              className="border-2 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary w-4 h-4 lg:w-5 lg:h-5"
            />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm lg:text-base text-foreground group-hover:text-primary transition-colors font-medium">
                {getProductTypeLabel(type)}
              </span>
              <span className="text-xs lg:text-sm text-muted-foreground bg-secondary/50 px-2 lg:px-2.5 py-0.5 rounded-full">
                {allProducts.filter(p => p.productType === type).length}
              </span>
            </div>
          </label>
        ))}
      </div>
    </div>
  </div>
);

const ProductGridSkeleton = ({ compact }) => (
  <div className={`grid gap-3 md:gap-4 ${compact
    ? 'grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
    : 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-3'
    }`}>
    {Array.from({ length: 9 }).map((_, i) => (
      <div key={i} className="bg-white border border-slate-100 rounded-lg p-3 h-[380px] animate-pulse">
        <div className="w-full h-48 bg-slate-50 rounded-md mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
          <div className="h-4 w-1/2 bg-slate-100 rounded"></div>
          <div className="h-6 w-1/3 bg-slate-200 rounded mt-4"></div>
        </div>
      </div>
    ))}
  </div>
);

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
  const [gridSize, setGridSize] = useState('large');
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState(null);
  const [childCategories, setChildCategories] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);

  // Initial loading state to show skeleton prevents hydration/flicker issues
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadCategory = async () => {
      setInitialLoading(true);
      if (!slug) {
        setCategory(null);
        setChildCategories([]);
        setBreadcrumb([]);
        setInitialLoading(false);
        return;
      }
      try {
        const cat = await getCategoryBySlug(slug);
        setCategory(cat);
        const [children, crumbs] = await Promise.all([
          cat?._id ? getChildCategories(cat._id) : [],
          getCategoryBreadcrumb(slug),
        ]);
        setChildCategories(children || []);
        setBreadcrumb(crumbs || []);
      } catch (error) {
        console.error('[CATEGORY] Failed to load category:', error);
        setCategory(null);
        setChildCategories([]);
        setBreadcrumb([]);
      } finally {
        setInitialLoading(false);
      }
    };
    loadCategory();
  }, [slug]);

  const fetchProductsPage = async ({ targetPage, append = false } = {}) => {
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

    const normalized = Array.isArray(list) ? list : [];
    setProducts((prev) => (append ? [...prev, ...normalized] : normalized));
    setHasMore(normalized.length === PAGE_SIZE);
    setPage(targetPage);
  };

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      setLoadingProducts(true);
      setHasMore(true);
      setPage(1);
      try {
        await fetchProductsPage({ targetPage: 1, append: false });
      } catch (error) {
        console.error('[CATEGORY] Failed to load products:', error);
        if (active) {
          setProducts([]);
          setHasMore(false);
        }
      } finally {
        if (active) setLoadingProducts(false);
      }
    };
    loadProducts();
    return () => {
      active = false;
    };
  }, [slug, searchQuery, vehicleKey, filterType]);

  const filteredProducts = useMemo(() => {
    let result = filterProductsByAccess(products, user);

    if (inlineSearch.trim()) {
      const query = inlineSearch.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.manufacturerBrand?.toLowerCase().includes(query) ||
        p.oemNumber?.toLowerCase().includes(query) ||
        p.vehicleBrand?.toLowerCase().includes(query)
      );
    }

    const getPrice = (product) => getDisplayPrice(product, user).price || 0;

    if (sortBy === 'price-low') result.sort((a, b) => getPrice(a) - getPrice(b));
    if (sortBy === 'price-high') result.sort((a, b) => getPrice(b) - getPrice(a));
    if (sortBy === 'name-az') result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (sortBy === 'name-za') result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));

    return result;
  }, [products, filterType, sortBy, inlineSearch, user]);

  const clearAllFilters = () => {
    setFilterType([]);
    setInlineSearch('');
    setSortBy('relevance');
  };

  const handleFilterToggle = (type, checked) => {
    setFilterType(prev => checked ? [...prev, type] : prev.filter(t => t !== type));
  };

  const activeFiltersCount = filterType.length + (inlineSearch ? 1 : 0);
  const hasChildren = childCategories.length > 0;
  const hasProducts = filteredProducts.length > 0;
  // Only show empty state if NOT loading and actually empty
  const showEmptyState = !loadingProducts && !hasChildren && !hasProducts && !inlineSearch && filterType.length === 0;

  if (initialLoading) {
    return <SubCategorySkeleton />;
  }

  return (
    <Layout>
      {/* ... (Breadcrumbs) ... */}
      <div className="bg-secondary/30 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-1.5 text-sm flex-wrap">
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link>
            {breadcrumb.map((cat, index) => (
              <span key={cat._id || cat.id} className="flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                {index === breadcrumb.length - 1 ? (
                  <span className="text-foreground font-medium">{cat.name}</span>
                ) : (
                  <Link href={`/categories/${cat.slug}`} className="text-muted-foreground hover:text-primary transition-colors">{cat.name}</Link>
                )}
              </span>
            ))}
            {!category && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                <span className="text-foreground font-medium">
                  {searchQuery ? `Search: "${searchQuery}"` : 'All Parts'}
                </span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {category?.name || (searchQuery ? `Results for "${searchQuery}"` : 'All Parts')}
          </h1>
          <p className="text-muted-foreground">
            {loadingProducts
              ? "Loading products..."
              : hasChildren
                ? `Explore ${childCategories.length} sub-categories`
                : hasProducts
                  ? `${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''} available`
                  : isActive
                    ? 'No compatible products for the selected vehicle'
                    : 'No products in this category yet'
            }
          </p>
        </div>

        <VehicleSelectionBar title="Selected Vehicle" />

        {/* Empty State */}
        {showEmptyState ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border/50">
            <div className="w-20 h-20 mx-auto mb-6 bg-secondary rounded-2xl flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">No parts found</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              We couldn&apos;t find any parts in this category. Try browsing our other categories.
            </p>
            <Link href="/categories">
              <Button size="lg" className="rounded-lg">
                Browse All Categories
              </Button>
            </Link>
          </div>
        ) : null}

        {/* Sub-categories Section */}
        {hasChildren && (
          // ... (existing sub-categories JSX) ...
          <>
            <div className="lg:hidden mb-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full h-11 rounded-lg border-border/50">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Browse Categories
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <SheetHeader className="px-4 py-4 border-b border-border">
                    <SheetTitle>Categories</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto h-[calc(100vh-80px)]">
                    <CategorySidebar />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex gap-6 lg:gap-8">
              <div className="hidden lg:block">
                <CategorySidebar />
              </div>

              <div className="flex-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 max-w-6xl">
                  {childCategories.map((sub, index) => {
                    const subCount = sub.productCount || 0;
                    return (
                      <Link
                        key={sub._id || sub.id}
                        href={`/categories/${sub.slug}`}
                        className="group relative bg-card rounded-lg p-4 md:p-5 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <FolderOpen className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                          </div>

                          <div className="w-full">
                            <h3 className="font-semibold text-sm md:text-base text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">
                              {sub.name}
                            </h3>
                            {subCount > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {subCount} parts
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Products Section - Loading SKELETON or REAL Content */}
        {!hasChildren && (
          <>
            <div className="bg-card rounded-xl border border-border/50 p-3 md:p-4 mb-4">
              <div className="flex flex-col gap-3">
                {/* ... (Search and Controls Bar) ... */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={inlineSearch}
                      onChange={(e) => setInlineSearch(e.target.value)}
                      className="pl-10 pr-10 h-11 bg-secondary/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 rounded-lg"
                    />
                    {inlineSearch && (
                      <button
                        onClick={() => setInlineSearch('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">


                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="lg:hidden h-11 w-11 rounded-lg border-border/50 relative">
                          <SlidersHorizontal className="w-4 h-4" />
                          {filterType.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                              {filterType.length}
                            </span>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl lg:hidden p-0">
                        {/* ... Sheet Content ... */}
                        <SheetHeader className="px-6 py-5 border-b border-border/50 bg-secondary/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <SheetTitle className="text-xl font-bold">Filters</SheetTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {filterType.length > 0 ? `${filterType.length} active` : 'Refine your search'}
                              </p>
                            </div>
                            {filterType.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearAllFilters}
                                className="text-primary hover:text-primary/80"
                              >
                                Clear All
                              </Button>
                            )}
                          </div>
                        </SheetHeader>

                        <div className="px-6 py-6 overflow-y-auto h-[calc(80vh-180px)]">
                          <FilterContent allProducts={products} filterType={filterType} onToggleFilter={handleFilterToggle} />
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border/50">
                          <SheetTrigger asChild>
                            <Button className="w-full h-12 rounded-xl font-semibold">
                              Apply Filters
                              {filterType.length > 0 && ` (${filterType.length})`}
                            </Button>
                          </SheetTrigger>
                        </div>
                      </SheetContent>
                    </Sheet>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      {/* ... Select Content ... */}
                      <SelectTrigger className="w-[140px] sm:w-[160px] h-11 rounded-lg border-border/50 bg-background">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="name-az">Name: A to Z</SelectItem>
                        <SelectItem value="name-za">Name: Z to A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Filters:</span>
                    {inlineSearch && (
                      <button
                        onClick={() => setInlineSearch('')}
                        className="inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                      >
                        &quot;{inlineSearch.length > 12 ? inlineSearch.slice(0, 12) + '...' : inlineSearch}&quot;
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {filterType.map(type => (
                      <button
                        key={type}
                        onClick={() => setFilterType(prev => prev.filter(t => t !== type))}
                        className="inline-flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                      >
                        {getProductTypeLabel(type)}
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                    <button
                      onClick={clearAllFilters}
                      className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors ml-1"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-6 lg:gap-8">
              <aside className="hidden lg:block w-64 shrink-0">
                <div className="sticky top-20 bg-card rounded-xl border border-border/50 p-5">
                  <h2 className="font-semibold text-foreground mb-4 pb-3 border-b border-border/50">Filters</h2>
                  <FilterContent allProducts={products} filterType={filterType} onToggleFilter={handleFilterToggle} />
                </div>
              </aside>

              <div className="flex-1 min-w-0">
                {/* Condition: Loading products AND no products yet -> SKELETON */}
                {loadingProducts && products.length === 0 ? (
                  <ProductGridSkeleton compact={gridSize === 'compact'} />
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-xl border border-border/50">
                    <div className="w-16 h-16 mx-auto mb-4 bg-secondary rounded-xl flex items-center justify-center">
                      <Search className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {isActive ? "No compatible products" : "No matching products"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                      {isActive
                        ? "Try changing your vehicle selection or clear the filter."
                        : "Try adjusting your search terms or removing some filters"}
                    </p>
                    <Button variant="outline" onClick={clearAllFilters} className="rounded-lg">
                      Clear all filters
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className={`grid gap-3 md:gap-4 ${gridSize === 'compact'
                      ? 'grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                      : 'grid-cols-1 xs:grid-cols-2 lg:grid-cols-3'
                      }`}>
                      {filteredProducts.map((p, index) => (
                        <div
                          key={p._id || p.id}
                          className="animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <ProductCard product={p} compact={gridSize === 'compact'} />
                        </div>
                      ))}
                    </div>

                    {hasMore && (
                      <div className="text-center mt-10">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={async () => {
                            if (loadingMore || loadingProducts || !hasMore) return;
                            setLoadingMore(true);
                            try {
                              await fetchProductsPage({ targetPage: page + 1, append: true });
                            } finally {
                              setLoadingMore(false);
                            }
                          }}
                          className="rounded-lg min-w-[200px]"
                          disabled={loadingMore}
                        >
                          {loadingMore ? 'Loading...' : 'Show More Products'}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

const Category = () => {
  return (
    <Suspense fallback={<SubCategorySkeleton />}>
      <CategoryContent />
    </Suspense>
  );
};

export default Category;
