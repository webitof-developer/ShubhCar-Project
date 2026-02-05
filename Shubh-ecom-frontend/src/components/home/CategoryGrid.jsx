//src/components/home/CategoryGrid.jsx  

import Link from 'next/link';
import { Disc3, Cog, Filter, ArrowDownUp, Zap, Car, ChevronRight } from 'lucide-react';
import { getRootCategories } from '@/services/categoryService';

const iconMap = { Disc3, Cog, Filter, ArrowDownUp, Zap, Car };

export const CategoryGrid = async ({ categories } = {}) => {
  let rootCategories = Array.isArray(categories) ? categories : [];
  if (!rootCategories.length) {
    try {
      rootCategories = await getRootCategories();
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }
  return (
    <section className="py-8 md:py-12 bg-[#F6F8FB]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl md:text-2xl font-semibold">Popular Part Categories</h2>
          <Link
            href="/categories"
            className="text-sm md:text-base text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
          {rootCategories.slice(0, 12).map((cat, index) => {
            const Icon = iconMap[cat.icon || 'Car'] || Car;
            return (
              <Link key={cat._id || cat.id || index} href={`/categories/${cat.slug}`} className="group bg-white rounded-xl p-3 md:p-6 text-center border border-slate-100 transition-all hover:-translate-y-1 hover:shadow-md h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-medium text-foreground text-sm line-clamp-2">{cat.name}</h3>
                {cat.productCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{cat.productCount} parts</p>
                )}
              </Link>
            );
          })}

        </div>
      </div>
    </section>
  );
};
