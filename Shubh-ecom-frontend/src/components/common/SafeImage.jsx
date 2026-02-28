"use client";

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';

export const SafeImage = ({
  src,
  fallbackSrc = '/placeholder.jpg',
  unoptimized,
  onError,
  ...props
}) => {
  const initialSrc = useMemo(() => (src || fallbackSrc), [src, fallbackSrc]);
  const [currentSrc, setCurrentSrc] = useState(initialSrc);

  useEffect(() => {
    setCurrentSrc(initialSrc);
  }, [initialSrc]);

  const shouldUnopt = typeof unoptimized === 'boolean'
    ? unoptimized
    : (typeof currentSrc === 'string' && currentSrc.startsWith('/api/proxy/'));

  return (
    <Image
      {...props}
      src={currentSrc || fallbackSrc}
      unoptimized={shouldUnopt}
      onError={(event) => {
        if (typeof onError === 'function') {
          onError(event);
        }
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
    />
  );
};
