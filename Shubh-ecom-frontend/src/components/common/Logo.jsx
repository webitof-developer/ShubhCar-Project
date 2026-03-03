//src/components/common/Logo.jsx

"use client";
import Image from 'next/image';

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
  const sizeClass = sizeMap[size] || sizeMap.md;

  return (
    <div className={`${sizeClass} relative overflow-hidden  ${className}`}>
      <Image
        src={'/logo.png'}
        alt="Logo"
        fill
        className="object-contain"
        priority
        unoptimized // Skip optimization for custom logos
      />
    </div>
  );
};

export default Logo;
