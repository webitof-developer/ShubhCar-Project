import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Categories',
  description: 'Browse spare parts by category and find products for your vehicle.',
  path: '/categories',
  keywords: ['parts categories', 'auto parts categories', 'shop by category'],
});

export default function CategoriesLayout({ children }) {
  return children;
}
