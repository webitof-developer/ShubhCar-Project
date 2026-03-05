import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Login',
  description: 'Sign in to access your account, orders, and saved addresses.',
  path: '/login',
  keywords: ['login', 'sign in', 'customer account'],
});

export default function LoginLayout({ children }) {
  return children;
}
