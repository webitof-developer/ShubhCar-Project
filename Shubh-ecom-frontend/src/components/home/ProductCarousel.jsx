//src/components/home/ProductCarousel.jsx

"use client";
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/ProductCard';


export const ProductCarousel = ({ title, subtitle, products, viewAllLink }) => {
  const scrollRef = useRef(null);

  // Fix: Reset scroll position when component mounts or products change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [products]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 280;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-8 md:py-12 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scroll('left')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => scroll('right')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {viewAllLink && (
              <Link href={viewAllLink} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Scroll container aligned with header */}
        <div
          ref={scrollRef}
          className="flex gap-2 md:gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0"
        >
          {products && products.length > 0 ? (
            <>
              {products.map((p, index) => (
                <div
                  key={p._id || p.id || index}
                  className="flex-shrink-0 w-[170px] md:w-[260px] snap-start animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </>
          ) : (
            <div className="w-full text-left py-12">
              <p className="text-muted-foreground text-sm">No products available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};