"use client";

import { Skeleton } from '@/components/ui/skeleton';

export const ProfilePageSkeleton = () => {
  return (
    <>
      <div className="bg-secondary/30 border-b border-border/50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-card rounded-xl border border-border/50 p-6 space-y-6">
              <div className="flex flex-col items-center">
                <Skeleton className="h-24 w-24 rounded-full mb-4" />
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="space-y-4 pt-4 border-t border-border/50">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-9 space-y-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
