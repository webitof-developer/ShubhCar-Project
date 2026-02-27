/** @type {import('next').NextConfig} */

// ─── Domains ──────────────────────────────────────────────────────────────────
// Add your production API and CDN domains here.
// These are injected into Content-Security-Policy at build time.
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : 'http://localhost:5000';

// ─── Security Headers ─────────────────────────────────────────────────────────
const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Disallow embedding this site in iframes (except Razorpay uses iframes
  // from its own origin — handled separately via CSP frame-ancestors)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },

  // Limit referrer information sent to third parties
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Force HTTPS for 2 years (only effective in production behind HTTPS)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },

  // Disable browser features we don't use
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=(self "https://checkout.razorpay.com")',
      'usb=()',
      'interest-cohort=()',   // disable FLoC
    ].join(', '),
  },

  // ── Content Security Policy ────────────────────────────────────────────────
  // NOTE: 'unsafe-inline' and 'unsafe-eval' are required by Next.js
  // for its internal script injection in dev AND production (until nonce
  // middleware is added). Tighten once nonce-based CSP is implemented.
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

      // API calls + WebSocket (Next.js HMR in dev)
      `connect-src 'self' ${API_ORIGIN} https://checkout.razorpay.com wss: ws:`,

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
  /**
   * Allow next/image to load images from any HTTPS host.
   * Product images can come from arbitrary CDN/S3 buckets.
   * Tighten this to specific hostnames once CDN domains are stable.
   */
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
