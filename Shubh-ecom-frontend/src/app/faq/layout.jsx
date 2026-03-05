import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'FAQ',
  description: 'Find answers to common questions about products, shipping, payments, and returns.',
  path: '/faq',
  keywords: ['faq', 'help center', 'support questions'],
});

export default function FaqLayout({ children }) {
  return children;
}
