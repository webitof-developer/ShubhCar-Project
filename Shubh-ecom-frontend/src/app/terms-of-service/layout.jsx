import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Terms of Service',
  description: 'Read our terms and conditions for using the platform and placing orders.',
  path: '/terms-of-service',
  keywords: ['terms of service', 'terms and conditions', 'legal'],
});

export default function TermsLayout({ children }) {
  return children;
}
