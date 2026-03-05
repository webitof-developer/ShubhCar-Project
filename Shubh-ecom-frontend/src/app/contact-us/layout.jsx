import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Contact Us',
  description: 'Get support for orders, returns, product fitment, and account help.',
  path: '/contact-us',
  keywords: ['contact support', 'customer care', 'help'],
});

export default function ContactUsLayout({ children }) {
  return children;
}
