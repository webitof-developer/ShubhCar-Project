import Link from 'next/link';
import { ChevronRight, Folder, LayoutGrid } from 'lucide-react';
import { getProductTypeLabel } from '@/utils/productType';
import { Checkbox } from '@/components/ui/checkbox';
import { useCallback } from 'react';

export const LeftSidebar = ({
  currentSlug,
  sidebarCategories,
  sidebarTitle,
  filterType,
  onToggleFilter,
  products,
  clearFilters,
}) => {
  const PRODUCT_TYPE_OPTIONS = ['OEM', 'OES', 'AFTERMARKET'];
  // Scroll the active item into view inside the bounded <ul> on mount
  const activeItemRef = useCallback((node) => {
    if (node) node.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, []);

  return (
    <aside className='w-56 flex-shrink-0 hidden lg:block'>
      {/*
        One sticky wrapper for the whole sidebar so the two cards never
        overlap each other. overflow-y-auto lets the sidebar itself scroll
        if the viewport is too short to show everything at once.
      */}
      <div
        className='sticky top-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar'
        style={{ maxHeight: 'calc(100vh - 5rem)' }}>
        {/* Category tree */}
        <div className='bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-shrink-0'>
          <div className='px-5 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center gap-2'>
            <h3 className='text-sm font-bold text-slate-800 tracking-wide uppercase'>
              {sidebarTitle || 'Categories'}
            </h3>
          </div>
          <ul className='py-2 max-h-64 overflow-y-auto custom-scrollbar'>
            {(sidebarCategories || []).map((cat) => {
              const isActive = cat.slug === currentSlug;
              return (
                <li
                  key={cat._id || cat.id}
                  ref={isActive ? activeItemRef : null}>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className={`flex items-center justify-between gap-2 px-5 py-2.5 text-sm transition-colors group ${
                      isActive
                        ? 'bg-primary/5 text-primary font-bold border-l-4 border-primary'
                        : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                    }`}>
                    <span className='flex items-center gap-2.5 min-w-0'>
                      <Folder
                        className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`}
                      />
                      <span className='truncate'>{cat.name}</span>
                    </span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 flex-shrink-0 transition-opacity ${isActive ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-100'}`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Product Type Filter */}
        <div className='bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex-shrink-0'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-[11px] font-bold uppercase tracking-wider text-slate-500'>
              Filters
            </h3>
            {filterType.length > 0 && (
              <button
                onClick={clearFilters}
                className='text-[11px] font-bold text-primary hover:underline'>
                CLEAR
              </button>
            )}
          </div>
          <div className='space-y-3'>
            <h4 className='text-xs font-semibold text-slate-800 mb-2'>
              Product Type
            </h4>
            {PRODUCT_TYPE_OPTIONS.map((type) => (
              <label
                key={type}
                className='flex items-center gap-3 cursor-pointer group'>
                <Checkbox
                  checked={filterType.includes(type)}
                  onCheckedChange={(checked) => onToggleFilter(type, checked)}
                  className='border-2 border-slate-200 data-[state=checked]:bg-primary data-[state=checked]:border-primary w-4 h-4 rounded-sm transition-colors'
                />
                <span className='text-sm font-medium text-slate-700 group-hover:text-primary transition-colors'>
                  {getProductTypeLabel(type)}
                </span>
                <span className='ml-auto text-xs font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded-md'>
                  {
                    (products || []).filter((p) => p.productType === type)
                      .length
                  }
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
