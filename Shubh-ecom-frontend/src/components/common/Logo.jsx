//src/components/common/Logo.jsx

"use client";
import { useState } from 'react';
import Image from 'next/image';
import { useSiteConfig } from '@/hooks/useSiteConfig';

/**
 * Logo Component - Config-Driven with Fallbacks
 * 
 * LOGIC:
 * 1. If config has site.logoText -> use that text
 * 2. Else if config has site.logo (image path) -> try to load image
 * 3. If image fails or doesn't exist -> auto-generate initials from site.name
 * 
 * USAGE:
 * <Logo size="sm" /> // 32px (mobile nav)
 * <Logo size="md" /> // 40px (header)
 * <Logo size="lg" /> // 48px (footer)
 * <Logo size="xl" /> // 64px (landing/about)
 */

const sizeMap = {
  sm: 'w-8 h-8 text-xs',       // 32px
  md: 'w-9 h-9 text-sm',       // 36px (default)
  lg: 'w-12 h-12 text-base',   // 48px
  xl: 'w-16 h-16 text-xl',     // 64px
  '2xl': 'w-20 h-20 text-2xl',     // 80px
  '3xl': 'w-30 h-30 text-3xl',     // 120px
};

export const Logo = ({ size = 'md', className = '', variant = 'dark' }) => {
  const [imageError, setImageError] = useState(false);

  // Get config values
  const { siteName, logoDark, logoLight, loading } = useSiteConfig();
  const logoPath = variant === 'light' ? logoLight : logoDark;

  /**
   * Generate initials from site name
   * Examples:
   * - "ShubhCars" -> "SC"
   * - "Auto Spares" -> "AS"
   * - "MyShop" -> "MS"
   */
  const getInitials = (name) => {
    if (!name) return 'AP'; // Fallback

    // Split by spaces or camelCase
    const words = name
      .replace(/([A-Z])/g, ' $1') // Insert space before capitals (ShubhCars -> Shubh Cars)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length >= 2) {
      // Multi-word: take first letter of first two words
      return (words[0][0] + words[1][0]).toUpperCase();
    }

    // Single word: take first two letters
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(siteName || 'AutoParts');
  const sizeClass = sizeMap[size] || sizeMap.md;

  // Use text logo if:
  // 1. No logo path provided (null/undefined)
  // 2. logoText is explicitly set
  // 3. Image failed to load
  const useTextLogo = !logoPath || imageError;

  // if (useTextLogo) {
  //   return (
  //     <div className={`${sizeClass} bg-primary rounded-lg flex items-center justify-center shadow-sm ${className}`}>
  //       <span className="text-primary-foreground font-bold leading-none">
  //         {initials}
  //       </span>
  //     </div>
  //   );
  // }

  // // Only try to load image if logoPath is valid
  // if (loading && !logoPath) {
  //   return (
  //     <div className={`${sizeClass} bg-primary rounded-lg flex items-center justify-center shadow-sm ${className}`} />
  //   );
  // }

  return (
    <div className={`${sizeClass} relative overflow-hidden  ${className}`}>
      <Image
        src={'/logo.png'}
        alt={`${siteName || 'Site'} logo`}
        fill
        className="object-contain"
        onError={() => setImageError(true)}
        priority
        unoptimized // Skip optimization for custom logos
      />
    </div>
  );
};

export default Logo;
