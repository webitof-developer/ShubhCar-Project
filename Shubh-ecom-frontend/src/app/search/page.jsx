import { Suspense } from 'react';
import SearchPageClient from '@/components/search/SearchPageClient';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Search Products',
  description:
    'Search spare parts by product name, brand, OEM/OES number, and vehicle compatibility.',
  path: '/search',
  keywords: ['search parts', 'oem search', 'vehicle compatible parts'],
});

const SearchPageFallback = () => (
  <div className="container mx-auto px-4 py-10 text-sm text-muted-foreground">
    Loading search...
  </div>
);

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageClient />
    </Suspense>
  );
}

