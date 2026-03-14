/** @type {import('next').NextConfig} */

const IS_DEV = process.env.NODE_ENV !== 'production';
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!IS_DEV && !RAW_API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is required in production builds');
}

// Domains
const API_ORIGIN = RAW_API_URL
  ? new URL(RAW_API_URL).origin
  : 'http://localhost:5000';

// Security headers
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=(self "https://checkout.razorpay.com")',
      'usb=()',
    ].join(', '),
  },
  {
    key: 'Content-Security-Policy',
    value: [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://accounts.google.com`,
      `style-src 'self' 'unsafe-inline'`,
      IS_DEV ? `img-src 'self' data: blob: https: http:` : `img-src 'self' data: blob: https:`,
      `font-src 'self' data:`,
      `connect-src 'self' blob: data: ${API_ORIGIN} https://checkout.razorpay.com https://api.razorpay.com https://lumberjack.razorpay.com https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com wss: ws:`,
      `frame-src 'self' blob: data: https://checkout.razorpay.com https://api.razorpay.com https://accounts.google.com`,
      `worker-src 'self' blob:`,
      `frame-ancestors 'self'`,
      `form-action 'self'`,
      `base-uri 'self'`,
    ].join('; '),
  },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
];

const nextConfig = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
    ],
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      ...(IS_DEV ? [{ protocol: 'http', hostname: 'localhost' }] : []),
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
