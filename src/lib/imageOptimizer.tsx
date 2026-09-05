import React, { useState } from 'react';

/**
 * Optimizes an image URL for high-speed delivery via Cloudflare CDN (wsrv.nl)
 * - Converts to WebP format
 * - Resizes to optimal dimensions
 * - Compresses with zero perceptible quality loss
 * - Caches on Cloudflare edge servers globally
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  options: { width?: number; quality?: number; height?: number } = {}
): string {
  // Purge any empty, deleted mock photos, or stock photography (Unsplash/Pexels)
  if (
    !url ||
    url.includes('desert_spot.jpg') ||
    url.includes('meadow_spot.jpg') ||
    url.includes('hero_rv_camp.jpg') ||
    url.includes('unsplash.com') ||
    url.includes('pexels.com')
  ) {
    return '/images/real_bald_mountain.jpg';
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
    const cleanUrl = url.split('?')[0];
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
 * - Async decoding (prevents scrolling jank)
 * - Shimmer blur-up skeleton during load
 * - Graceful fallback on error
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
  const [error, setError] = useState(false);

  const optimizedSrc = getOptimizedImageUrl(src, { width, quality });

  const fallbackRealPhoto = '/images/real_bald_mountain.jpg';

  return (
    <div className={`relative overflow-hidden bg-dark-200/60 ${className}`}>
      {/* Shimmer Placeholder while loading */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-dark-200 via-dark-100 to-dark-200 animate-pulse" />
      )}

      <img
        src={error ? fallbackRealPhoto : optimizedSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};
