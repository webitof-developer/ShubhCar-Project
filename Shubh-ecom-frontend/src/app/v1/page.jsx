import { Suspense } from 'react';
import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home-v1/HeroSection';
import { CategoryGrid } from '@/components/home-v1/CategoryGrid';
import { BrandGrid } from '@/components/home-v1/BrandGrid';
import { PromoBanner } from '@/components/home-v1/PromoBanner';
import { FeaturedProducts } from '@/components/home-v1/FeaturedProducts';
import { TrustSection } from '@/components/home-v1/TrustSection';
import { ServiceGrid } from '@/components/home-v1/ServiceGrid';

import { getProducts } from '@/services/productService';
import { getRootCategories } from '@/services/categoryService';
import { getManufacturerBrands } from '@/services/brandService';
import { getPublicSettings } from '@/services/settingsService';
import { buildPageMetadata } from '@/lib/seo';

export const revalidate = 60;

export const metadata = buildPageMetadata({
  title: 'V1 Experimental Homepage',
  description: 'Shop OEM, OES, and aftermarket car spare parts with fast delivery and trusted quality support.',
  path: '/v1',
});

const HomeSkeleton = () => {
  return (
    <div className="space-y-8 pb-12">
      <div className="w-full h-[300px] md:h-[400px] bg-slate-900 animate-pulse"></div>
      <div className="container mx-auto px-4 border rounded-xl h-[400px] bg-slate-50 animate-pulse mt-8"></div>
    </div>
  );
};

const HomeContentV1 = async () => {
  const [
    featuredRes,
    newArrivalsRes,
    bestSellersRes,
    categoriesRes,
    brandsRes,
  ] = await Promise.allSettled([
    getProducts({ page: 1, limit: 12, isFeatured: true }),
    getProducts({ page: 1, limit: 12, sort: 'newest' }),
    getProducts({ page: 1, limit: 12, isBestSeller: true }),
    getRootCategories(),
    getManufacturerBrands(),
  ]);

  const featuredProducts = featuredRes.status === 'fulfilled' ? (featuredRes.value || []) : [];
  const newArrivals = newArrivalsRes.status === 'fulfilled' ? (newArrivalsRes.value || []) : [];
  const bestSellers = bestSellersRes.status === 'fulfilled' ? (bestSellersRes.value || []) : [];
  
  const rootCategories = categoriesRes.status === 'fulfilled' ? (categoriesRes.value || []) : [];
  let manufacturerBrands = [];
  if (brandsRes.status === 'fulfilled') {
    const data = brandsRes.value || {};
    manufacturerBrands = Array.isArray(data) ? data : (data.brands || []);
  }

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <HeroSection />
      
      {/* Category Grid block */}
      <CategoryGrid categories={rootCategories} />
      
      {/* Promotional block */}
      <PromoBanner />
      
      {/* Services block */}
      <ServiceGrid />
      
      {/* Manufacturer & Makes Block */}
      <BrandGrid brands={manufacturerBrands} />
      
      {/* First Featured Scroller */}
      {featuredProducts.length > 0 && (
        <FeaturedProducts title="New Products" products={featuredProducts} />
      )}

      {/* Latest Arrivals Scroller */}
      {newArrivals.length > 0 && (
        <FeaturedProducts title="Latest Arrivals" products={newArrivals} />
      )}
      
      {/* Manufacturer & Makes Block */}
      <BrandGrid brands={manufacturerBrands} />

      {/* Second Featured Scroller */}
      {bestSellers.length > 0 && (
        <FeaturedProducts title="Popular Products" products={bestSellers} />
      )}

      {/* Trust & Features Section */}
      <TrustSection />
    </div>
  );
};

const V1Index = async () => {
  return (
    <Layout>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContentV1 />
      </Suspense>
    </Layout>
  );
};

export default V1Index;
