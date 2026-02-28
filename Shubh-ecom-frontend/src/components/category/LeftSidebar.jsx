import Link from 'next/link';
import { ChevronRight, Folder, LayoutGrid } from 'lucide-react';
import { getProductTypeLabel } from '@/utils/productType';
import { Checkbox } from '@/components/ui/checkbox';
import { useCallback } from 'react';

export const LeftSidebar = ({ currentSlug, sidebarCategories, sidebarTitle, filterType, onToggleFilter, products, clearFilters }) => {
  const PRODUCT_TYPE_OPTIONS = ['OEM', 'OES', 'AFTERMARKET'];
  // Scroll the active item into view inside the bounded <ul> on mount
  const activeItemRef = useCallback((node) => {
    if (node) node.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, []);

  return (
    <aside className="w-56 flex-shrink-0 hidden lg:block">
      {/*
        One sticky wrapper for the whole sidebar so the two cards never
        overlap each other. overflow-y-auto lets the sidebar itself scroll
        if the viewport is too short to show everything at once.
      */}
      <div
        className="sticky top-4 flex flex-col gap-3 overflow-y-auto [&::-webkit-scrollbar]:hidden"
        style={{ maxHeight: 'calc(100vh - 5rem)', scrollbarWidth: 'none' }}
      >
        {/* Category tree */}
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden flex-shrink-0">
          <div className="px-4 py-3 border-b border-border/30 bg-muted/30 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">{sidebarTitle || 'Categories'}</span>
          </div>
          <ul
            className="py-1 max-h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none' }}
          >
            {(sidebarCategories || []).map((cat) => {
              const isActive = cat.slug === currentSlug;
              return (
                <li key={cat._id || cat.id} ref={isActive ? activeItemRef : null}>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className={`flex items-center justify-between gap-2 px-4 py-2 text-sm transition-colors group ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold border-r-2 border-primary'
                        : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Folder className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Product Type Filter */}
        <div className="bg-card rounded-xl border border-border/50 p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Type</h3>
            {filterType.length > 0 && (
              <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear</button>
            )}
          </div>
          <div className="space-y-2.5">
            {PRODUCT_TYPE_OPTIONS.map((type) => (
              <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox
                  checked={filterType.includes(type)}
                  onCheckedChange={(checked) => onToggleFilter(type, checked)}
                  className="border-2 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary w-4 h-4"
                />
                <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                  {getProductTypeLabel(type)}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {(products || []).filter((p) => p.productType === type).length}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
