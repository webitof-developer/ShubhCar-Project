//src/components/home/DealsSection.jsx
import Link from 'next/link';
import { Clock, Flame } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';


export const DealsSection = ({ products }) => {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-slate-900 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-500/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-gradient-to-r from-orange-500/10 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Flame className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl md:text-3xl font-bold">Flash Deals</h2>
                <span className="bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider animate-bounce">Live</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>Ending in:</span>
                <span className="font-mono text-white font-bold bg-slate-800 px-2 py-0.5 rounded">12</span>:
                <span className="font-mono text-white font-bold bg-slate-800 px-2 py-0.5 rounded">45</span>:
                <span className="font-mono text-white font-bold bg-slate-800 px-2 py-0.5 rounded">30</span>
              </div>
            </div>
          </div>

          <Link href="/products?isOnSale=true" className="group flex items-center text-sm font-medium text-white/80 hover:text-white transition-colors">
            View All Offers
            <div className="w-8 h-[1px] bg-white/30 ml-3 group-hover:w-12 transition-all" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
          {products.slice(0, 4).map((p, index) => (
            <div key={p._id || p.id || index} className="transform hover:-translate-y-1 transition-transform duration-300">
              <ProductCard
                key={p._id}
                product={p}
                className="h-full bg-white text-slate-900 border-border"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};