import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Privacy Policy',
  description: 'Understand how we collect, use, and protect your personal information.',
  path: '/privacy-policy',
  keywords: ['privacy policy', 'data privacy', 'policy'],
});

export default function PrivacyPolicyLayout({ children }) {
  return children;
}
