import { Layout } from '@/components/layout/Layout';

export const CartSkeleton = () => (
  <Layout>
    <div className="bg-slate-50 border-b border-slate-200 mt-4">
      <div className="container mx-auto px-4 py-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
      </div>
    </div>
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-[280px_1fr_380px] gap-8">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:block">
          <div className="bg-white rounded-xl border border-slate-100 p-4 h-[300px] animate-pulse">
            <div className="h-5 w-32 bg-slate-200 rounded mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-2">
                  <div className="w-16 h-16 bg-slate-100 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-full bg-slate-100 rounded"></div>
                    <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Items Skeleton */}
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-28 h-28 bg-slate-100 rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between">
                    <div className="h-5 w-2/3 bg-slate-200 rounded"></div>
                    <div className="w-8 h-8 rounded bg-slate-100"></div>
                  </div>
                  <div className="h-4 w-1/3 bg-slate-100 rounded"></div>
                  <div className="flex justify-between items-end mt-4">
                    <div className="h-6 w-24 bg-slate-200 rounded"></div>
                    <div className="h-10 w-28 bg-slate-100 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Skeleton */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-100 p-5 animate-pulse space-y-4">
            <div className="h-5 w-32 bg-slate-200 rounded mb-4"></div>
            <div className="h-8 w-full bg-slate-100 rounded"></div>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between"><div className="h-4 w-20 bg-slate-100 rounded"></div><div className="h-4 w-16 bg-slate-100 rounded"></div></div>
              <div className="flex justify-between"><div className="h-4 w-20 bg-slate-100 rounded"></div><div className="h-4 w-16 bg-slate-100 rounded"></div></div>
              <div className="border-t border-slate-100 pt-3">
                <div className="flex justify-between"><div className="h-6 w-16 bg-slate-200 rounded"></div><div className="h-6 w-24 bg-slate-200 rounded"></div></div>
              </div>
            </div>
            <div className="h-12 w-full bg-slate-200 rounded-lg mt-4"></div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
);
