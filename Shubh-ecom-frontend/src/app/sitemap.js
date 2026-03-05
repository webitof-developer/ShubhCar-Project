import { absoluteUrl } from '@/lib/seo';

export default function sitemap() {
  const now = new Date();

  return [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: absoluteUrl('/products'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/categories'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/manufacturer-brands'), lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: absoluteUrl('/about-us'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/contact-us'), lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: absoluteUrl('/faq'), lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: absoluteUrl('/privacy-policy'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: absoluteUrl('/terms-of-service'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
