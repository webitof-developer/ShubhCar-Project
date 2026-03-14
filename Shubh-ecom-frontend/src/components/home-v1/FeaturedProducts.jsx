"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";

export const FeaturedProducts = ({ title = "New Products", products = [] }) => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [products]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      const scrollAmount = direction === "left" ? -clientWidth + 100 : clientWidth - 100;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkScroll, 350);
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
        </div>

        <div className="relative group/slider">
          {/* Navigation Arrows (visible on hover/large screens) */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-slate-600 shadow-lg opacity-0 transition-opacity disabled:opacity-0 sm:group-hover/slider:opacity-100 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0073e6]"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-slate-600 shadow-lg opacity-0 transition-opacity disabled:opacity-0 sm:group-hover/slider:opacity-100 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0073e6]"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Product Scroller */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex overflow-x-auto gap-4 md:gap-6 pb-6 pt-2 snap-x snap-mandatory mx-[-16px] px-[16px] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {products.map((product) => (
              <div key={product._id} className="snap-start shrink-0 w-[240px] md:w-[260px] pb-2">
                 {/* Reusing existing global ProductCard to avoid code duplication */}
                <ProductCard product={product} /> 
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
