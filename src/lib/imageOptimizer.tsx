import React, { useState } from 'react';

export const FALLBACK_CAMPING_PHOTO = '/images/camping_scenic_placeholder.svg';
export const SECONDARY_PHOTO_FALLBACK = '/images/real_bald_mountain.jpg';

/**
 * Extracts clean, raw direct image URL without proxies or query garbage
 */
export function getRawImageUrl(url: string | undefined | null): string {
  if (!url) return FALLBACK_CAMPING_PHOTO;
  if (
    url.includes('desert_spot.jpg') ||
    url.includes('meadow_spot.jpg') ||
    url.includes('hero_rv_camp.jpg') ||
    url.includes('unsplash.com') ||
    url.includes('pexels.com')
  ) {
    return FALLBACK_CAMPING_PHOTO;
  }
  return url.split('?')[0];
}

/**
 * Optimizes an image URL for high-speed delivery via Cloudflare CDN (wsrv.nl)
 * - Converts to WebP format
 * - Resizes to optimal dimensions
 * - Decodes URL first to prevent double-encoding bugs (%2528)
 * - Falls back cleanly to local SVG / WebP
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  options: { width?: number; quality?: number; height?: number } = {}
): string {
  if (!url) return FALLBACK_CAMPING_PHOTO;

  // Purge any empty, deleted mock photos, or stock photography (Unsplash/Pexels)
  if (
    url.includes('desert_spot.jpg') ||
    url.includes('meadow_spot.jpg') ||
    url.includes('hero_rv_camp.jpg') ||
    url.includes('unsplash.com') ||
    url.includes('pexels.com')
  ) {
    return FALLBACK_CAMPING_PHOTO;
  }

  // Already optimized via wsrv.nl
  if (url.startsWith('https://wsrv.nl/')) {
    if (options.width) {
      return url.replace(/&w=\d+/, `&w=${options.width}`);
    }
    return url;
  }

  // Data URLs, blobs, or local authentic photos in /images/
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/images/')) {
    return url;
  }

  const { width = 640, quality = 75 } = options;

  // Wikimedia or other remote http/https images
  if (url.startsWith('http://') || url.startsWith('https://')) {
    let cleanUrl = url.split('?')[0];
    try {
      // Decode first to prevent double encoding (%28 -> %2528)
      cleanUrl = decodeURIComponent(cleanUrl);
    } catch (e) {}
    const encoded = encodeURIComponent(cleanUrl);
    return `https://wsrv.nl/?url=${encoded}&w=${width}&output=webp&q=${quality}`;
  }

  return url;
}

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  quality?: number;
  priority?: boolean;
}

/**
 * Performant Image component with:
 * - Next-gen WebP CDN delivery
 * - Native browser lazy-loading
 * - Shimmer blur-up skeleton during load
 * - Resilient 2-tier fallback: wsrv -> direct URL -> scenic SVG placeholder
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 640,
  quality = 75,
  priority = false,
  className = '',
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState<number>(0); // 0: wsrv, 1: direct url, 2: fallback svg

  const optimizedSrc = getOptimizedImageUrl(src, { width, quality });
  const rawSrc = getRawImageUrl(src);

  let currentSrc = optimizedSrc;
  if (attempt === 1) {
    currentSrc = rawSrc !== optimizedSrc ? rawSrc : FALLBACK_CAMPING_PHOTO;
  } else if (attempt >= 2) {
    currentSrc = FALLBACK_CAMPING_PHOTO;
  }

  const handleError = () => {
    if (attempt === 0 && rawSrc !== currentSrc) {
      setAttempt(1);
    } else {
      setAttempt(2);
      setLoaded(true);
    }
  };

  return (
    <div className={`relative overflow-hidden bg-slate-100 dark:bg-dark-900 ${className}`}>
      {/* Shimmer Placeholder while loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-200/60 via-slate-100 to-slate-200/60 dark:from-dark-800 dark:via-dark-700 dark:to-dark-800 animate-pulse z-0" />
      )}

      <img
        src={currentSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};
