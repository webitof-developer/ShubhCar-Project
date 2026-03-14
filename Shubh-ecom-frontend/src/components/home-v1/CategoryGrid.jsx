"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { resolveAssetUrl } from '@/utils/media';

const CATEGORY_PLACEHOLDER_IMAGE = '/categoryplaceholder.png';

export const CategoryGrid = ({ categories = [] }) => {
  const [displayCategories, setDisplayCategories] = useState([]);

  useEffect(() => {
    if (categories?.length > 0) {
      const shuffled = [...categories].sort(() => 0.5 - Math.random());
      setDisplayCategories(shuffled.slice(0, 6));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (displayCategories.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Shop by Category</h2>
          <p className="text-slate-500 mt-2 text-sm">Find exactly what you need from our comprehensive catalog</p>
        </div>

        {/* Clean Grid Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {displayCategories.map((cat, index) => {
            const categoryImage = cat.imageUrl || cat.image || null;
            const usesDefaultImage = !categoryImage;
            const resolvedImage = categoryImage ? resolveAssetUrl(categoryImage) : CATEGORY_PLACEHOLDER_IMAGE;
            
            return (
              <Link
                key={cat._id || cat.id || index}
                href={`/categories/${cat.slug}`}
                className="group flex flex-col items-center justify-start p-4 bg-white rounded-xl border border-gray-100 hover:border-[#0073e6] hover:shadow-md transition-all duration-300"
                title={cat.name}
              >
                {/* Image Container */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 mb-3 flex items-center justify-center overflow-hidden rounded-lg">
                  <Image
                    src={resolvedImage}
                    alt={cat.name}
                    fill
                    className={`${usesDefaultImage ? 'object-cover' : 'object-contain'} scale-110 transition-transform duration-500 ease-out group-hover:scale-[1.50]`}
                    sizes="(max-width: 768px) 80px, 96px"
                  />
                </div>

                {/* Minimalist Text */}
                <h3 className="text-xs md:text-sm font-semibold text-slate-700 text-center leading-tight group-hover:text-[#0073e6] transition-colors line-clamp-2">
                  {cat.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
