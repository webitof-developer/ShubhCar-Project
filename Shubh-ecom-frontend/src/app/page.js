import { Suspense } from 'react';
import { Layout } from '@/components/layout/Layout';
import { HeroBanner } from '@/components/home/HeroBanner';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { TrustStrip } from '@/components/home/TrustStrip';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { DealsSection } from '@/components/home/DealsSection';
import { BrandsStrip } from '@/components/home/BrandsStrip';
import { getProducts } from '@/services/productService';
import { getRootCategories } from '@/services/categoryService';
import { getManufacturerBrands } from '@/services/brandService';

export const revalidate = 60;

const HomeSkeleton = () => {
  return (
    <div className="space-y-8 pb-12">
      {/* Hero Skeleton */}
      <div className="w-full h-[500px] md:h-[600px] bg-slate-100 animate-pulse"></div>

      {/* Trust Strip Skeleton */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-24 bg-slate-50 animate-pulse rounded-lg"></div>
      </div>

      {/* Categories Skeleton */}
      <div className="bg-[#F6F8FB] py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-6 w-20 bg-slate-200 rounded animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white h-40 rounded-xl border border-slate-100 p-6 flex flex-col items-center justify-center animate-pulse">
                <div className="w-16 h-16 rounded-full bg-slate-100 mb-4"></div>
                <div className="h-4 w-24 bg-slate-100 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Carousel Skeleton */}
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-6">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-slate-100 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[240px] md:w-[260px] bg-white h-[320px] rounded-lg border border-slate-100 p-4 animate-pulse">
              <div className="w-full h-40 bg-slate-100 rounded mb-4"></div>
              <div className="h-4 w-3/4 bg-slate-100 rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-slate-100 rounded mb-4"></div>
              <div className="h-8 w-full bg-slate-100 rounded mt-auto"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const HomeContent = async () => {
  // Parallel data fetching for optimized performance
  // We fetch only specific slices of data needed for each section
  const [
    featuredRes,
    newArrivalsRes,
    bestSellersRes,
    dealsRes,
    categoriesRes,
    brandsRes
  ] = await Promise.allSettled([
    getProducts({ page: 1, limit: 8, isFeatured: true }),
    getProducts({ page: 1, limit: 8, sort: 'newest' }),
    getProducts({ page: 1, limit: 8, isBestSeller: true }),
    getProducts({ page: 1, limit: 4, isOnSale: true }),
    getRootCategories(),
    getManufacturerBrands()
  ]);

  // Extract data with fallback to empty arrays
  const featuredProducts = featuredRes.status === 'fulfilled' ? (featuredRes.value || []) : [];
  const newArrivals = newArrivalsRes.status === 'fulfilled' ? (newArrivalsRes.value || []) : [];
  const bestSellers = bestSellersRes.status === 'fulfilled' ? (bestSellersRes.value || []) : [];
  const dealProducts = dealsRes.status === 'fulfilled' ? (dealsRes.value || []) : [];

  const rootCategories = categoriesRes.status === 'fulfilled' ? (categoriesRes.value || []) : [];

  let manufacturerBrands = [];
  if (brandsRes.status === 'fulfilled') {
    const data = brandsRes.value || {};
    manufacturerBrands = Array.isArray(data) ? data : (data.brands || []);
  }

  // Debug fetching errors if any
  if (featuredRes.status === 'rejected') console.error("Featured fetch failed:", featuredRes.reason);
  if (newArrivalsRes.status === 'rejected') console.error("New Arrivals fetch failed:", newArrivalsRes.reason);
  if (bestSellersRes.status === 'rejected') console.error("Best Sellers fetch failed:", bestSellersRes.reason);
  if (dealsRes.status === 'rejected') console.error("Deals fetch failed:", dealsRes.reason);

  return (
    <>
      <HeroBanner />
      <TrustStrip />
      <CategoryGrid categories={rootCategories} />

      <ProductCarousel
        title="Featured Products"
        subtitle="Wholesale pricing available for bulk orders"
        products={featuredProducts}
        viewAllLink="/products?isFeatured=true"
      />

      <DealsSection products={dealProducts} />

      <ProductCarousel
        title="New Arrivals"
        subtitle="Latest additions to our catalog"
        products={newArrivals}
        viewAllLink="/products?sort=newest"
      />

      <BrandsStrip brands={manufacturerBrands} />

      <ProductCarousel
        title="Best Sellers"
        subtitle="Most popular parts this month"
        products={bestSellers}
        viewAllLink="/products?isBestSeller=true"
      />
    </>
  );
}

const Index = async () => {
  return (
    <Layout>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </Layout>
  );
};

export default Index;
