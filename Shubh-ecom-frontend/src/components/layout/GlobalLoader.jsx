 "use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSiteConfig } from '@/hooks/useSiteConfig';
import { useAuth } from '@/context/AuthContext';

/**
 * GlobalLoader: Full-screen overlay to prevent FOUC during auth initialization.
 * Shows a frosted glass background with a spinning wheel and bouncing dots.
 */
export const GlobalLoader = () => {
  const { siteName } = useSiteConfig();
  const { loading } = useAuth();
  
  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Only show when authentication is initializing
  // When loading becomes false, this component unmounts immediately.
  if (!loading) return null;

  // Asset path for the spinning wheel
  const logoSrc = '/newloader.png';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col items-center gap-6">
        
        {/* Logo Wheel Container: Spins continuously */}
        <div className="relative w-24 h-24 animate-spin duration-1000">
          <Image
            src={logoSrc}
            alt="Loading..."
            fill
            className="object-contain"
            priority
            sizes="96px"
          />
        </div>

        {/* Text and Indicator Container */}
        <div className="flex flex-col items-center gap-3">
          {/* Dynamic Loading Text */}
          <div className="text-xl font-semibold text-foreground animate-pulse">
             {siteName} is on the way...
          </div>
          
          {/* Bouncing Dots Indicator: Visual feedback of activity */}
          <div className="flex gap-2 mt-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
