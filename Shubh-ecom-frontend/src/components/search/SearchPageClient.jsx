"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ProductCard } from '@/components/product/ProductCard';
import { VehicleSelectionBar } from '@/components/vehicle/VehicleSelectionBar';
import { useVehicleSelection } from '@/context/VehicleContext';
import { searchCatalogProducts } from '@/services/productService';
import { ChevronRight, ChevronDown, Home, Search, SlidersHorizontal, X } from 'lucide-react';

const PAGE_SIZE = 20;

const parseCsv = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const toCsv = (items = []) => items.filter(Boolean).join(',');

const normalizeFacet = (bucket) => ({
  key: String(bucket?.key || ''),
  label: String(bucket?.label || bucket?.key || ''),
  count: Number(bucket?.count || 0),
});

const FacetDropdown = ({ title, buckets, selected, onToggle }) => {
  const normalized = (buckets || []).map(normalizeFacet).filter((b) => b.key);
  const [open, setOpen] = useState(false);

  if (!normalized.length) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-sm font-semibold"
      >
        <span>{title}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="space-y-2 max-h-64 overflow-auto pr-1 mt-3">
          {normalized.map((bucket) => (
            <label
              key={bucket.key}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <Checkbox
                checked={selected.includes(bucket.key)}
                onCheckedChange={(checked) => onToggle(bucket.key, checked)}
              />
              <span className="truncate">{bucket.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {bucket.count}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selection } = useVehicleSelection();

  const q = (searchParams.get('q') || searchParams.get('search') || '').trim();
  const page = Number(searchParams.get('page') || 1);
  const sort = searchParams.get('sort') || 'relevance';

  const selectedTypes = parseCsv(searchParams.get('productType'));
  const selectedBrands = parseCsv(searchParams.get('manufacturerBrand'));
  const selectedVehicleBrands = parseCsv(searchParams.get('vehicleBrand'));
  const selectedCategories = parseCsv(searchParams.get('categoryId'));
  const selectedYears = parseCsv(searchParams.get('year'));

  const vehicleIds = selection?.vehicleIds || [];

  const [queryInput, setQueryInput] = useState(q);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
    facets: {
      productTypes: [],
      manufacturerBrands: [],
      vehicleBrands: [],
      categories: [],
      years: [],
    },
  });
  const [facetStore, setFacetStore] = useState({
    productTypes: [],
    manufacturerBrands: [],
    vehicleBrands: [],
    categories: [],
    years: [],
  });

  useEffect(() => {
    setQueryInput(q);
  }, [q]);

  useEffect(() => {
    setFacetStore({
      productTypes: [],
      manufacturerBrands: [],
      vehicleBrands: [],
      categories: [],
      years: [],
    });
  }, [q]);

  const applyParams = useCallback(
    (updates = {}) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      router.push(`/search?${params.toString()}`);
    },
    [router, searchParams],
  );

  const toggleInCsv = useCallback(
    (param, value, checked) => {
      const current = parseCsv(searchParams.get(param));
      const next = checked
        ? Array.from(new Set([...current, value]))
        : current.filter((item) => item !== value);
      applyParams({
        [param]: next.length ? toCsv(next) : '',
        page: 1,
      });
    },
    [applyParams, searchParams],
  );

  const clearAllFilters = useCallback(() => {
    applyParams({
      productType: '',
      manufacturerBrand: '',
      vehicleBrand: '',
      categoryId: '',
      year: '',
      page: 1,
    });
  }, [applyParams]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!q) {
        setResult((prev) => ({ ...prev, items: [], total: 0, totalPages: 0 }));
        return;
      }

      setLoading(true);
      try {
        const data = await searchCatalogProducts({
          query: q,
          page,
          limit: PAGE_SIZE,
          categoryId: selectedCategories.length ? toCsv(selectedCategories) : undefined,
          productType: selectedTypes.length ? toCsv(selectedTypes) : undefined,
          manufacturerBrand: selectedBrands.length ? toCsv(selectedBrands) : undefined,
          vehicleBrand: selectedVehicleBrands.length ? toCsv(selectedVehicleBrands) : undefined,
          year: selectedYears.length ? toCsv(selectedYears) : undefined,
          vehicleIds,
          sort,
        });
        if (active) {
          setResult(data);
          setFacetStore((prev) => {
            const mergeFacet = (oldList = [], newList = []) => {
              const map = new Map();
              [...oldList, ...newList].forEach((item) => {
                const bucket = normalizeFacet(item);
                if (!bucket.key) return;
                const existing = map.get(bucket.key);
                map.set(bucket.key, existing ? { ...existing, ...bucket } : bucket);
              });
              return Array.from(map.values()).sort((a, b) => b.count - a.count);
            };
            return {
              productTypes: mergeFacet(prev.productTypes, data?.facets?.productTypes || []),
              manufacturerBrands: mergeFacet(
                prev.manufacturerBrands,
                data?.facets?.manufacturerBrands || [],
              ),
              vehicleBrands: mergeFacet(prev.vehicleBrands, data?.facets?.vehicleBrands || []),
              categories: mergeFacet(prev.categories, data?.facets?.categories || []),
              years: mergeFacet(prev.years, data?.facets?.years || []),
            };
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [
    q,
    page,
    sort,
    selectedTypes.join(','),
    selectedBrands.join(','),
    selectedVehicleBrands.join(','),
    selectedCategories.join(','),
    selectedYears.join(','),
    vehicleIds.join(','),
  ]);

  const pagination = useMemo(() => {
    const pages = [];
    const totalPages = result.totalPages || 0;
    if (!totalPages) return pages;
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let p = start; p <= end; p += 1) pages.push(p);
    return pages;
  }, [page, result.totalPages]);

  const activeFilterCount =
    selectedTypes.length +
    selectedBrands.length +
    selectedVehicleBrands.length +
    selectedCategories.length +
    selectedYears.length;

  const onSubmitSearch = (event) => {
    event.preventDefault();
    const next = queryInput.trim();
    if (!next) return;
    applyParams({ q: next, page: 1 });
  };

  return (
    <Layout>
      <div className="border-b border-border/50 bg-muted/20">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            <span className="text-foreground font-medium">Search</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-4">
          <VehicleSelectionBar title="Selected Vehicle" />
        </div>

        <div className="flex gap-6">
          <aside className="hidden lg:block w-72 space-y-4 sticky top-24 self-start">
            <div className="rounded-xl border border-border/60 bg-card px-4 py-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Filters</span>
              </div>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAllFilters}>
                  Clear all
                </Button>
              )}
            </div>

            <FacetDropdown
              title="Brands"
              buckets={facetStore.manufacturerBrands}
              selected={selectedBrands}
              onToggle={(value, checked) => toggleInCsv('manufacturerBrand', value, checked)}
            />
            <FacetDropdown
              title="Vehicle Brands"
              buckets={facetStore.vehicleBrands}
              selected={selectedVehicleBrands}
              onToggle={(value, checked) => toggleInCsv('vehicleBrand', value, checked)}
            />
            <FacetDropdown
              title="Categories"
              buckets={facetStore.categories}
              selected={selectedCategories}
              onToggle={(value, checked) => toggleInCsv('categoryId', value, checked)}
            />
            <FacetDropdown
              title="Years"
              buckets={facetStore.years}
              selected={selectedYears}
              onToggle={(value, checked) => toggleInCsv('year', value, checked)}
            />
            <FacetDropdown
              title="Product Type"
              buckets={facetStore.productTypes}
              selected={selectedTypes}
              onToggle={(value, checked) => toggleInCsv('productType', value, checked)}
            />
          </aside>

          <section className="flex-1 min-w-0">
            <form onSubmit={onSubmitSearch} className="mb-5">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Search products, brands, categories, OEM/OES numbers..."
                  className="pl-9 h-11 rounded-xl"
                />
              </div>
            </form>

            <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {q ? `Search results for "${q}"` : 'Search Products'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {loading
                    ? 'Searching...'
                    : `${result.total || 0} product${result.total === 1 ? '' : 's'} found`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sort}
                  onChange={(e) => applyParams({ sort: e.target.value, page: 1 })}
                  className="h-9 rounded-lg border border-border/60 bg-card px-3 text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="created_desc">Newest</option>
                  <option value="created_asc">Oldest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedBrands.map((value) => (
                  <button
                    key={`mb-${value}`}
                    onClick={() => toggleInCsv('manufacturerBrand', value, false)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-1"
                  >
                    {value} <X className="w-3 h-3" />
                  </button>
                ))}
                {selectedCategories.map((value) => {
                  const category = facetStore.categories
                    .map(normalizeFacet)
                    .find((item) => item.key === value);
                  return (
                    <button
                      key={`cat-${value}`}
                      onClick={() => toggleInCsv('categoryId', value, false)}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-1"
                    >
                      {category?.label || value} <X className="w-3 h-3" />
                    </button>
                  );
                })}
                {selectedYears.map((value) => (
                  <button
                    key={`yr-${value}`}
                    onClick={() => toggleInCsv('year', value, false)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs px-2.5 py-1"
                  >
                    {value} <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}

            {!q && (
              <div className="rounded-xl border border-border/60 bg-card p-8 text-center text-muted-foreground">
                Enter a search term to find products.
              </div>
            )}

            {q && !loading && result.items.length === 0 && (
              <div className="rounded-xl border border-border/60 bg-card p-8 text-center">
                <p className="font-semibold">No products found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try a different keyword or clear filters.
                </p>
              </div>
            )}

            {q && result.items.length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                  {result.items.map((product) => (
                    <ProductCard key={product._id || product.id} product={product} />
                  ))}
                </div>

                {result.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => applyParams({ page: page - 1 })}
                    >
                      Previous
                    </Button>
                    {pagination.map((p) => (
                      <Button
                        key={p}
                        variant={p === page ? 'default' : 'outline'}
                        onClick={() => applyParams({ page: p })}
                      >
                        {p}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      disabled={page >= result.totalPages}
                      onClick={() => applyParams({ page: page + 1 })}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
