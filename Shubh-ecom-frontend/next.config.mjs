/** @type {import('next').NextConfig} */

// ─── Domains ──────────────────────────────────────────────────────────────────
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : 'http://localhost:5000';

// ─── Security Headers ─────────────────────────────────────────────────────────
const securityHeaders = [
  // Prevent MIME-type sniffing
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
      'interest-cohort=()',
    ].join(', '),
  },

  {
    key: 'Content-Security-Policy',
    value: [
      // Only load content from our own origin by default
      `default-src 'self'`,

      // Scripts: self + Next.js internals + Razorpay SDK
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com`,

      // Styles: self + inline (Next.js injects critical CSS inline)
      `style-src 'self' 'unsafe-inline'`,

      // Images: self + data URIs + any HTTPS host (product images from CDN/S3)
      `img-src 'self' data: blob: https:`,

      // Fonts: self only (using local/system fonts, no Google Fonts)
      `font-src 'self' data:`,

      // API calls + WebSocket (Next.js HMR in dev) + Razorpay telemetry/status endpoints
      `connect-src 'self' ${API_ORIGIN} https://checkout.razorpay.com https://api.razorpay.com https://lumberjack.razorpay.com wss: ws:`,

      // Razorpay opens its own iframes for 3DS / OTP screens
      `frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com`,

      // Prevent other sites from framing us
      `frame-ancestors 'self'`,

      // Only allow form submissions to our own origin
      `form-action 'self'`,

      // Report CSP violations to console (upgrade to report-uri in prod)
      `base-uri 'self'`,
    ].join('; '),
  },

  // Block XSS in older browsers (belt-and-suspenders alongside CSP)
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
      '@radix-ui/react-tooltip'
    ],
  },
  
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }, // all HTTPS sources
      { protocol: 'http',  hostname: 'localhost' },
    ],
  },

  /**
   * Apply security headers to every route.
   */

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
