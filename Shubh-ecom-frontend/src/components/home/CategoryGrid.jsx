//src/components/home/CategoryGrid.jsx

import Link from 'next/link';
import Image from 'next/image';
import {
  Disc3,
  Cog,
  Filter,
  ArrowDownUp,
  Zap,
  Car,
  ChevronRight,
} from 'lucide-react';
import { getRootCategories } from '@/services/categoryService';
import { resolveAssetUrl } from '@/utils/media';

const iconMap = { Disc3, Cog, Filter, ArrowDownUp, Zap, Car };

export const CategoryGrid = async ({ categories } = {}) => {
  let rootCategories = Array.isArray(categories) ? categories : [];
  if (!rootCategories.length) {
    try {
      rootCategories = await getRootCategories();
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }
  return (
    <section className='py-8 md:py-12 bg-[#F6F8FB]'>
      <div className='container mx-auto px-4'>
        <div className='flex items-center justify-between mb-8'>
          <h2 className='text-xl md:text-2xl font-semibold'>
            Popular Part Categories
          </h2>
          <Link
            href='/categories'
            className='text-sm md:text-base text-primary hover:text-primary/80 font-medium transition-colors flex items-center gap-1'>
            View All
            <ChevronRight className='w-4 h-4' />
          </Link>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6'>
          {rootCategories.slice(0, 12).map((cat, index) => {
            const Icon = iconMap[cat.icon || 'Car'] || Car;
            const categoryImage = cat.imageUrl || cat.image || null;
            const resolvedImage = categoryImage
              ? resolveAssetUrl(categoryImage)
              : null;
            return (
              <Link
                key={cat._id || cat.id || index}
                href={`/categories/${cat.slug}`}
                className='group relative flex flex-col items-center justify-center p-5 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300'>
                {/* Image or Icon Container */}
                <div className='relative mb-4 flex items-center justify-center w-20 h-20 md:w-24 md:h-24'>
                  {resolvedImage ? (
                    <Image
                      src={resolvedImage}
                      alt={cat.name}
                      fill
                      className='object-contain rounded-lg transition-transform duration-500 group-hover:scale-110'
                      sizes='(max-width: 768px) 80px, 96px'
                    />
                  ) : (
                    <div className='w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary/5 transition-colors duration-300'>
                      <Icon className='h-8 w-8 text-slate-400 group-hover:text-primary transition-colors duration-300' />
                    </div>
                  )}
                </div>

                {/* Text Content */}
                <h3 className='text-sm md:text-base font-bold text-slate-800 text-center leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2'>
                  {cat.name}
                </h3>

                {cat.productCount > 0 && (
                  <span className='mt-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 text-[10px] md:text-xs font-medium text-slate-500 border border-slate-100'>
                    {cat.productCount} parts
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
