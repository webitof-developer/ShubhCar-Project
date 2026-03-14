"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

export const PromoBanner = () => {
  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          
          {/* Promo 1 */}
          <Link href="/products?search=Engine+Oil" className="group relative block overflow-hidden rounded-xl h-[200px] sm:h-[240px] md:h-[280px]">
            <Image
              src="https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=1200"
              alt="Engine Oil Promo"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent p-6 sm:p-10 flex flex-col justify-center">
              <span className="inline-block bg-red-600 text-white text-xs sm:text-sm font-bold px-3 py-1 lg:px-4 lg:py-1.5 rounded-sm w-fit mb-4">
                Up to 30% off
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                Premium<br />Engine Oils
              </h3>
              <p className="hidden sm:block text-slate-200 text-sm max-w-xs mb-4">
                Keep your engine running smoothly with our top brands.
              </p>
              <div className="mt-auto md:mt-4 flex items-center text-white text-sm font-semibold opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                Shop now <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </Link>

          {/* Promo 2 */}
          <Link href="/products?search=Filter" className="group relative block overflow-hidden rounded-xl h-[200px] sm:h-[240px] md:h-[280px]">
            <Image
              src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200"
              alt="Filters Promo"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent p-6 sm:p-10 flex flex-col justify-center">
              <span className="inline-block bg-red-600 text-white text-xs sm:text-sm font-bold px-3 py-1 lg:px-4 lg:py-1.5 rounded-sm w-fit mb-4">
                Top Quality
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                Cabin & Air<br />Filters
              </h3>
              <p className="hidden sm:block text-slate-200 text-sm max-w-xs mb-4">
                Breathe easy and protect your engine. Find exact fits.
              </p>
              <div className="mt-auto md:mt-4 flex items-center text-white text-sm font-semibold opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                Shop now <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </Link>

        </div>
      </div>
    </section>
  );
};
