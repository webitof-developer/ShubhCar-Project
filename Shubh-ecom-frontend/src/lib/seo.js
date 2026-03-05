const SITE_NAME = 'ShubhCars';
const SITE_DESCRIPTION =
  'Buy genuine car spare parts online at ShubhCars. Fast shipping, trusted brands, and competitive prices across categories.';
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_FRONTEND_URL ||
  'http://localhost:3000';
const DEFAULT_OG_IMAGE = '/logo.png';

const trimSlashes = (value = '') => value.replace(/\/+$/, '');

export const getSiteUrl = () => trimSlashes(SITE_URL);

export const absoluteUrl = (path = '/') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
};

export const buildPageMetadata = ({
  title,
  description,
  path = '/',
  keywords = [],
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
} = {}) => {
  const finalTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const finalDescription = description || SITE_DESCRIPTION;
  const canonical = absoluteUrl(path);
  const ogImage = image?.startsWith('http') ? image : absoluteUrl(image);

  return {
    title: finalTitle,
    description: finalDescription,
    keywords,
    alternates: { canonical },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: { index: false, follow: false, noimageindex: true },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-snippet': -1,
            'max-image-preview': 'large',
            'max-video-preview': -1,
          },
        },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_IN',
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDescription,
      images: [ogImage],
    },
  };
};

export { SITE_NAME, SITE_DESCRIPTION, DEFAULT_OG_IMAGE };
