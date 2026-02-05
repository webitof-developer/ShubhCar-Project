//src/services/cmsService.js
import { cmsPages } from '@/data/cmsPages';

/**
 * CMS Service
 * All CMS page data access goes through this service.
 * Currently uses static data; will be replaced with API calls later.
 */

// Get page by slug
export const getPageBySlug = (slug) => {
  return cmsPages.find(p => p.slug === slug && p.isPublished);
};

// Get all published pages
export const getPublishedPages = () => {
  return cmsPages.filter(p => p.isPublished);
};

// Get pages for footer navigation
export const getFooterPages = () => {
  return cmsPages
    .filter(p => p.isPublished)
    .map(({ slug, title }) => ({ slug, title }));
};

// Get page SEO data
export const getPageSEO = (slug) => {
  const page = getPageBySlug(slug);
  if (!page) return null;
  
  return {
    title: page.metaTitle,
    description: page.metaDescription,
  };
};
