//src/components/product/RelatedProducts.jsx

"use client";

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/product/ProductCard';
import { getRelatedProducts } from '@/services/productService';

export function RelatedProducts({ currentProduct, limit = 6 }) {
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!currentProduct?._id) return;
      const data = await getRelatedProducts(currentProduct._id, limit);
      setRelatedProducts(data || []);
    };
    load();
  }, [currentProduct?._id, limit]);

  if (!currentProduct || relatedProducts.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-zinc-200">
      <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
      
      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden overflow-x-auto -mx-4 px-4">
        <div className="flex gap-4 pb-4">
          {relatedProducts.map(product => (
            <div key={product._id || product.id} className="w-64 flex-shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {relatedProducts.map(product => (
          <ProductCard key={product._id || product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
