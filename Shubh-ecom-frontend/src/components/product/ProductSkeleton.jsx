import { Layout } from '@/components/layout/Layout';

export const ProductSkeleton = () => (
  <Layout>
    <div className="container mx-auto px-4 py-6 pb-32 md:pb-6">
      {/* Breadcrumb Skeleton */}
      <div className="flex gap-2 mb-6 overflow-hidden">
        <div className="h-4 w-12 bg-slate-200 rounded animate-pulse shrink-0"></div>
        <div className="h-4 w-4 bg-slate-200 rounded animate-pulse shrink-0"></div>
        <div className="h-4 w-24 bg-slate-200 rounded animate-pulse shrink-0"></div>
        <div className="h-4 w-4 bg-slate-200 rounded animate-pulse shrink-0"></div>
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse shrink-0"></div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 mb-12">
        {/* Image Gallery Skeleton (Left) */}
        <div className="lg:col-span-12 xl:col-span-5 flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbs */}
          <div className="hidden md:flex md:flex-col gap-2 overflow-hidden">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
          {/* Main Image */}
          <div className="flex-1 aspect-square bg-slate-100 rounded-2xl animate-pulse w-full"></div>
          {/* Mobile Thumbs */}
          <div className="flex md:hidden gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-16 h-16 bg-slate-100 rounded-lg animate-pulse shrink-0"></div>
            ))}
          </div>
        </div>

        {/* Product Info Skeleton (Right) */}
        <div className="lg:col-span-12 xl:col-span-7 flex flex-col h-full">
          <div className="mb-auto">
            <div className="h-6 w-24 bg-slate-200 rounded mb-4 animate-pulse"></div>
            <div className="h-8 md:h-10 w-full md:w-3/4 bg-slate-200 rounded mb-4 animate-pulse"></div>

            <div className="flex gap-4 mb-6">
              <div className="h-6 w-32 bg-slate-100 rounded animate-pulse"></div>
              <div className="h-6 w-24 bg-slate-100 rounded animate-pulse"></div>
            </div>

            <div className="h-auto md:h-40 w-full bg-slate-50 rounded-xl mb-8 animate-pulse border border-slate-100 p-6">
              <div className="h-8 w-40 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 w-24 bg-slate-200 rounded"></div>
            </div>

            <div className="space-y-2 mb-8">
              <div className="h-4 w-full bg-slate-100 rounded animate-pulse"></div>
              <div className="h-4 w-full bg-slate-100 rounded animate-pulse"></div>
              <div className="h-4 w-2/3 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 mt-auto pt-6 border-t border-slate-100">
            <div className="h-12 w-32 bg-slate-100 rounded-lg animate-pulse"></div>
            <div className="h-12 flex-1 bg-slate-200 rounded-lg animate-pulse"></div>
            <div className="h-12 w-12 bg-slate-100 rounded-lg animate-pulse"></div>
          </div>

          {/* Mobile Sticky Skeleton */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-50 flex gap-4">
            <div className="h-12 flex-1 bg-slate-200 rounded-lg animate-pulse"></div>
          </div>

        </div>
      </div>
    </div>
  </Layout>
);
