import { Layout } from '@/components/layout/Layout';

export const PageSkeleton = () => (
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
