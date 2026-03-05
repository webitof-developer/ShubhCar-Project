import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Shopping Cart',
  description: 'Review items in your cart and proceed to secure checkout.',
  path: '/cart',
  keywords: ['shopping cart', 'checkout cart', 'auto parts cart'],
});

export default function CartLayout({ children }) {
  return children;
}
