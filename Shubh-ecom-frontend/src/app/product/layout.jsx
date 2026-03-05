import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Product Details',
  description: 'View product specifications, compatibility, pricing, and availability.',
  path: '/product',
  keywords: ['product details', 'spare part details', 'compatibility'],
});

export default function ProductLayout({ children }) {
  return children;
}
