import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { resolveAssetUrl } from '@/utils/media';

export const BrandsStrip = ({ brands = [] }) => {
  // Use real brands if available, take top 18 for 2 rows x 9 cols (grid)
  // Or responsive equivalent
  const displayBrands = brands.length > 0 ? brands.slice(0, 18) : [];

  if (displayBrands.length === 0) return null;

  return (
    <section className="py-8 md:py-12 bg-background">
      <div className="container mx-auto px-4 mb-6 flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-semibold">
          Shop by Top Manufacturer Brands
        </h2>
        <Link href="/manufacturer-brands" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="container mx-auto px-4">
        {/* Grid layout: 3 cols (mobile), 6 cols (tablet), 9 cols (desktop) */}
        <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-2 sm:gap-4 md:gap-6">
          {displayBrands.map((brand, index) => {
            const imageUrl = brand.logo || brand.image;
            const finalImage = imageUrl ? resolveAssetUrl(imageUrl) : null;

            return (
              <Link
                href={`/products?manufacturerBrand=${encodeURIComponent(brand.name)}`}
                key={`${brand._id || brand.name}-${index}`}
                className="flex flex-col items-center gap-3 cursor-pointer group"
              >
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl bg-card flex items-center justify-center overflow-hidden border border-border group-hover:border-primary/50 transition-all duration-300">
                  {finalImage ? (
                    <Image
                      src={finalImage}
                      alt={brand.name}
                      fill
                      sizes="(max-width: 768px) 80px, 96px"
                      className="object-contain p-4 grayscale group-hover:grayscale-0 transition-all duration-300 opacity-70 group-hover:opacity-100"
                    />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground group-hover:text-primary transition-colors uppercase">
                      {(brand.name || 'BR').substring(0, 2)}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap text-center truncate w-full px-1">
                  {brand.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
