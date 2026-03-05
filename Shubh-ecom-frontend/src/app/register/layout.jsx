import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Register',
  description: 'Create your account to place orders and track deliveries.',
  path: '/register',
  keywords: ['register', 'create account', 'signup'],
});

export default function RegisterLayout({ children }) {
  return children;
}
