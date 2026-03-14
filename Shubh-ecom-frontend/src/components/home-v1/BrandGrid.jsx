"use client";

import Link from 'next/link';
import Image from 'next/image';
import { resolveAssetUrl } from '@/utils/media';
import { ChevronRight } from 'lucide-react';

const POPULAR_MAKES = [
  'MARUTI SUZUKI', 'HYUNDAI', 'HONDA', 'TATA', 'MAHINDRA', 'TOYOTA', 'FORD', 'VOLKSWAGEN', 'SKODA', 'RENAULT', 'KIA', 'NISSAN', 'CHEVROLET', 'DATSUN'
];

export const BrandGrid = ({ brands = [] }) => {
  // Ensure we have an array
  const safeBrands = Array.isArray(brands) ? brands : [];
  
  // Show top 18 brands (3 rows of 6) for manufacturers like Boodmo
  const popularManufacturers = safeBrands
    .filter(b => b.isTopBrand)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .slice(0, 18);
    
  // Fallback if not enough top brands are marked
  const displayManufacturers = popularManufacturers.length >= 12 
    ? popularManufacturers 
    : safeBrands.slice(0, 18);

  return (
    <div className="py-12 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        
        {/* Popular Vehicle Makes Section */}
        <div className="mb-16">
          <div className="flex flex-col items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Popular vehicle makes</h2>
            <Link href="/brands" className="text-[#0073e6] text-sm font-medium hover:underline flex items-center">
              All vehicle makes <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {POPULAR_MAKES.map((make, idx) => (
              <Link
                key={idx}
                href={`/categories?make=${make.toLowerCase()}`}
                className="flex items-center justify-center p-3 sm:p-4 bg-white border border-gray-200 rounded text-xs sm:text-sm font-medium text-slate-700 hover:border-[#0073e6] hover:text-[#0073e6] hover:shadow-sm transition-all text-center"
              >
                {make}
              </Link>
            ))}
            <Link
              href="/brands"
              className="flex items-center justify-center p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded text-xs sm:text-sm font-medium text-slate-500 hover:bg-gray-100 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Popular Manufacturers Section (Parts Brands) */}
        <div>
          <div className="flex flex-col items-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Popular manufacturers</h2>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 sm:gap-6 lg:gap-8 items-center justify-items-center">
            {displayManufacturers.map((brand, idx) => {
              const bgWhiteStr = encodeURIComponent("bg-white");
              const defaultLogoSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                brand.name || "Brand"
              )}&background=${bgWhiteStr}&color=0f172a&font-size=0.4&bold=true`;
              
              const logoSrc = brand.logo 
                ? resolveAssetUrl(brand.logo) 
                : defaultLogoSrc;

              return (
                <Link
                  key={brand._id || brand.id || idx}
                  href={`/brands/${brand.slug || brand._id}`}
                  className="group flex items-center justify-center w-full h-[60px] sm:h-[80px] p-2 sm:p-4 bg-white hover:bg-gray-50 transition-colors rounded"
                  title={brand.name}
                >
                  <div className="relative w-full h-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                    <Image
                      src={logoSrc}
                      alt={`${brand.name} logo`}
                      fill
                      className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
                      sizes="(max-width: 768px) 80px, 120px"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
