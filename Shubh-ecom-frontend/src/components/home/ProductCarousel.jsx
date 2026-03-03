//src/components/home/ProductCarousel.jsx

"use client";
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useEffect, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/ProductCard';


export const ProductCarousel = ({ title, subtitle, products, viewAllLink }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;

    const maxLeft = Math.max(0, node.scrollWidth - node.clientWidth);
    setCanScrollLeft(node.scrollLeft > 2);
    setCanScrollRight(node.scrollLeft < maxLeft - 2);
  }, []);

  // Fix: Reset scroll position when component mounts or products change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
      updateScrollButtons();
    }
  }, [products, updateScrollButtons]);

  useEffect(() => {
    updateScrollButtons();
    const node = scrollRef.current;
    if (!node) return;

    node.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      node.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      // scroll by most of the visible width, ensuring responsive jumps on all devices
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      window.setTimeout(updateScrollButtons, 250);
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
          <div className="flex items-center gap-1 sm:gap-2">
            {viewAllLink && (
              <Link href={viewAllLink} className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Scroll container aligned with header */}
        <div className="relative group/carousel">
          {/* Left Navigation Button */}
          <Button
            variant="outline"
            size="icon"
            className={`absolute left-1 md:left-2 lg:-left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/95 backdrop-blur-sm shadow-md border border-border opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 ${canScrollLeft ? 'hidden md:flex' : 'hidden'}`}
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Right Navigation Button */}
          <Button
            variant="outline"
            size="icon"
            className={`absolute right-1 md:right-2 lg:-right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/95 backdrop-blur-sm shadow-md border border-border opacity-0 group-hover/carousel:opacity-100 transition-all duration-200 ${canScrollRight ? 'hidden md:flex' : 'hidden'}`}
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <div
            ref={scrollRef}
            className="flex gap-2 md:gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-2 px-2 ps-2 md:mx-0 md:px-0 md:ps-0"
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
      </div>
    </section>
  );
};
