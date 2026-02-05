import { Suspense } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { getRootCategories } from '@/services/categoryService';
import { searchProducts } from '@/services/productService';
import { Folder, ChevronRight, Search } from 'lucide-react';
import { VehicleSelectionBar } from "@/components/vehicle/VehicleSelectionBar";
import { ProductCard } from '@/components/product/ProductCard';

export const revalidate = 60;

const CategorySkeleton = () => {
  return (
    <>
      <div className="text-center mb-10 md:mb-12 animate-pulse">
        <div className="h-10 bg-slate-200 w-64 mx-auto rounded mb-3"></div>
        <div className="h-6 bg-slate-100 w-96 mx-auto rounded mb-8"></div>
        <div className="max-w-4xl mx-auto h-16 bg-slate-100 rounded-lg"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-slate-100 h-40 flex flex-col items-center justify-center animate-pulse">
            <div className="w-16 h-16 rounded-full bg-slate-100 mb-4"></div>
            <div className="h-4 w-24 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>
    </>
  );
};

const SearchResults = async ({ query, vehicleIds }) => {
  // Optimization: Fetch only updated slice or use dedicated search endpoint with limits
  // Here we limit simply to first 20 for speed improvement over fetching ALL pages
  const results = await searchProducts(query, { vehicleIds, page: 1, limit: 20 });
  const products = results.products || results || [];

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-100">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-50 rounded-xl flex items-center justify-center">
          <Search className="w-7 h-7 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No matching products</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
          Try adjusting your search terms or checking different categories.
        </p>
        <Link href="/categories">
          <Button variant="outline" className="rounded-lg">Clear Search</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-bold mb-6 text-slate-900">Search Results for &quot;{query}&quot; ({products.length})</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {products.map((p, index) => (
          <ProductCard key={p._id || p.id || index} product={p} />
        ))}
      </div>
    </>
  );
};

const AllCategoriesContent = async ({ query }) => {
  const vehicleIds = [];

  if (query) {
    return <SearchResults query={query} vehicleIds={vehicleIds} />;
  }

  // Optimize: directly using the service which should be fast. 
  // No complex waterfall here needed as it's a single resource.
  let rootCategories = [];
  try {
    rootCategories = await getRootCategories();
  } catch (e) {
    console.error("Categories fetch failed", e);
  }

  return (
    <>
      <div className="text-center mb-10 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Car Parts Categories
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
          Browse our complete range of {rootCategories.length} main categories
        </p>

        {/* Selected Vehicle Bar */}
        <div className="max-w-4xl mx-auto text-left">
          <VehicleSelectionBar />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {rootCategories.map((category, index) => (
          <Link
            key={category._id || category.id || index}
            href={`/categories/${category.slug}`}
            className="group flex flex-col items-center justify-center bg-white rounded-xl p-6 border border-slate-100 transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Folder className="w-7 h-7" strokeWidth={1.5} />
            </div>

            <h3 className="font-medium text-slate-900 text-center text-sm md:text-base px-1 leading-snug">
              {category.name}
            </h3>
          </Link>
        ))}
      </div>
    </>
  );
};

const AllCategories = async (props) => {
  const searchParams = await props.searchParams;
  const query = searchParams?.search || '';

  return (
    <Layout>
      <div className="bg-[#F6F8FB] min-h-screen">
        <div className="border-b border-slate-200">
          <div className="container mx-auto px-4 py-4">
            <nav className="flex items-center gap-1.5 text-sm flex-wrap">
              <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
              <span className="text-foreground font-medium">All Categories</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 md:py-12">
          <Suspense fallback={<CategorySkeleton />}>
            <AllCategoriesContent query={query} />
          </Suspense>
        </div>
      </div>
    </Layout>
  );
};

export default AllCategories;
