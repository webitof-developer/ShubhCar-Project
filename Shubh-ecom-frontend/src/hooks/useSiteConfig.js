"use client";
import { useSiteConfigContext } from '@/context/SiteConfigContext';

/**
 * Centralized hook for accessing site configuration
 * NOW USES CONTEXT for caching
 */
export const useSiteConfig = () => {
  return useSiteConfigContext();
};

export default useSiteConfig;
