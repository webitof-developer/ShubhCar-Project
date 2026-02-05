"use client";

import { useEffect } from 'react';
import { useSiteConfig } from '@/hooks/useSiteConfig';

export const DynamicFavicon = () => {
  const { favicon } = useSiteConfig();

  useEffect(() => {
    if (!favicon || typeof document === 'undefined') return;

    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    if (link.href !== favicon) {
      link.href = favicon;
    }
  }, [favicon]);

  return null;
};
