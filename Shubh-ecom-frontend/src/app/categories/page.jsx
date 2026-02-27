// src/app/categories/page.jsx
// Route: /categories

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Layout } from '@/components/layout/Layout';
import { getRootCategories } from '@/services/categoryService';
import { ChevronRight, Folder, Search, Home, LayoutGrid } from 'lucide-react';

export const revalidate = 60;

// â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Sidebar = ({ categories }) => (
  <aside className="w-56 flex-shrink-0 hidden lg:block">
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden sticky top-4">
      {/* Sidebar header */}
      <div className="px-4 py-3 border-b border-border/50 bg-muted/30 flex items-center gap-2">
        <LayoutGrid className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">All Categories</span>
      </div>

      {/* Category list */}
      <ul className="py-1 max-h-[calc(100vh-200px)] overflow-y-auto">
        {categories.map((cat) => (
          <li key={cat._id || cat.id}>
            <Link
              href={`/categories/${cat.slug}`}
              className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors group"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Folder className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/50 group-hover:text-primary/50" />
                <span className="truncate">{cat.name}</span>
              </span>
              <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </aside>
);

// â”€â”€ Main Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CategoriesContent = async () => {
  let categories = [];
  try {
    categories = await getRootCategories();
  } catch (e) {
    console.error('[Categories] fetch failed', e);
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
          <Home className="w-3.5 h-3.5" /> Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        <span className="text-foreground font-medium">All Categories</span>
      </nav>

      <div className="flex gap-6">
        {/* Sidebar */}
        <Sidebar categories={categories} />

        {/* Main grid */}
        <div className="flex-1 min-w-0">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Car Parts Categories</h1>
            <p className="text-sm text-muted-foreground">
              Browse {categories.length} main categories
            </p>
          </div>

          {/* Trodo-style: icon grid with image placeholder */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {categories.map((cat, i) => (
              <Link
                key={cat._id || cat.id || i}
                href={`/categories/${cat.slug}`}
                className="group flex flex-col items-center bg-card rounded-xl border border-border/50 hover:border-primary/40 hover:shadow-md transition-all p-5 text-center"
              >
                {/* Category image / icon */}
                <div className="w-20 h-20 mb-3 rounded-xl bg-muted/40 flex items-center justify-center overflow-hidden group-hover:bg-primary/10 transition-colors">
                  {cat.image ? (
                    <div className="relative w-full h-full">
                      <Image src={cat.image} alt={cat.name} fill className="object-contain p-2" />
                    </div>
                  ) : (
                    <Folder className="w-9 h-9 text-muted-foreground/50 group-hover:text-primary/70 transition-colors" />
                  )}
                </div>

                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1">
                  {cat.name}
                </h3>

                {cat.productCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {cat.productCount} parts
                  </span>
                )}
              </Link>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-20 bg-card rounded-xl border border-border/50">
              <Folder className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No categories found</h2>
              <p className="text-sm text-muted-foreground">Check back soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Skeleton = () => (
  <div className="container mx-auto px-4 py-8 flex gap-6 animate-pulse">
    <div className="w-56 hidden lg:block bg-muted rounded-xl h-96" />
    <div className="flex-1 grid grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="bg-muted rounded-xl h-36" />
      ))}
    </div>
  </div>
);

const CategoriesPage = async () => (
  <Layout>
    <div className="bg-muted/20 min-h-screen">
      <Suspense fallback={<Skeleton />}>
        <CategoriesContent />
      </Suspense>
    </div>
  </Layout>
);

export default CategoriesPage;

