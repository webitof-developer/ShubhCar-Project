"use client";

export const useSiteConfig = () => {
  return {
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || "Sparepart Ecom",
  };
};

export default useSiteConfig;
