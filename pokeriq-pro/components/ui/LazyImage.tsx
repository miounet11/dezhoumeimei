'use client';

import React, { useState, useRef, useEffect, forwardRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
  ImageOptimizer, 
  ImageLoadingState, 
  ImagePresets, 
  ImageOptimizationConfig,
  isImageOptimizationSupported
} from '@/lib/performance/image-optimization';

interface LazyImageProps extends React.ComponentProps<typeof Image> {
  src: string;
  alt: string;
  preset?: keyof typeof ImagePresets;
  aspectRatio?: number;
  showSkeleton?: boolean;
  enableProgressiveLoading?: boolean;
  onLoadComplete?: () => void;
  onError?: (error: Event) => void;
  fallbackSrc?: string;
  className?: string;
  containerClassName?: string;
}

/**
 * Advanced LazyImage component with progressive loading, skeleton states,
 * and optimized performance for Next.js applications
 */
export const LazyImage = forwardRef<HTMLImageElement, LazyImageProps>(
  ({
    src,
    alt,
    preset,
    aspectRatio,
    showSkeleton = true,
    enableProgressiveLoading = true,
    onLoadComplete,
    onError,
    fallbackSrc,
    className,
    containerClassName,
    width,
    height,
    sizes,
    quality,
    priority = false,
    placeholder = 'blur',
    ...props
  }, ref) => {
    const [loadingState, setLoadingState] = useState<ImageLoadingState>(ImageLoadingState.Loading);
    const [imageSrc, setImageSrc] = useState(src);
    const [isIntersecting, setIsIntersecting] = useState(priority); // Load immediately if priority
    const containerRef = useRef<HTMLDivElement>(null);
    const startTime = useRef(performance.now());

    // Apply preset configuration
    const presetConfig = preset ? ImagePresets[preset] : {};
    const optimizedConfig = ImageOptimizer.getOptimizedConfig({
      quality: quality || presetConfig.quality,
      sizes: sizes || presetConfig.sizes,
      priority: priority || presetConfig.priority,
      formats: presetConfig.formats,
      placeholder,
    });

    // Setup intersection observer for lazy loading
    useEffect(() => {
      if (!isImageOptimizationSupported() || priority || isIntersecting) {
        setIsIntersecting(true);
        return;
      }

      const observer = ImageOptimizer.createLazyLoadObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsIntersecting(true);
              observer?.disconnect();
            }
          });
        },
        { rootMargin: '50px 0px' }
      );

      if (observer && containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer?.disconnect();
    }, [priority, isIntersecting]);

    // Handle image load success
    const handleLoad = () => {
      setLoadingState(ImageLoadingState.Loaded);
      
      const performanceTracker = ImageOptimizer.trackImagePerformance(src, startTime.current);
      performanceTracker.onLoad();
      
      onLoadComplete?.();
    };

    // Handle image load error with fallback
    const handleError = (error: React.SyntheticEvent<HTMLImageElement>) => {
      setLoadingState(ImageLoadingState.Error);
      
      const performanceTracker = ImageOptimizer.trackImagePerformance(src, startTime.current);
      performanceTracker.onError(error.nativeEvent);
      
      // Try fallback if available
      if (fallbackSrc && imageSrc !== fallbackSrc) {
        setImageSrc(fallbackSrc);
        setLoadingState(ImageLoadingState.Loading);
        return;
      }
      
      onError?.(error.nativeEvent);
    };

    // Calculate aspect ratio for container
    const calculateAspectRatio = (): string | undefined => {
      if (aspectRatio) {
        return `${aspectRatio * 100}%`;
      }
      if (width && height) {
        return `${(Number(height) / Number(width)) * 100}%`;
      }
      return undefined;
    };

    // Skeleton component
    const Skeleton = () => (
      <div className="animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded">
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      </div>
    );

    // Error state component
    const ErrorState = () => (
      <div className="bg-gray-100 rounded flex items-center justify-center text-gray-500">
        <div className="text-center p-4">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-sm">Image failed to load</p>
        </div>
      </div>
    );

    const paddingBottom = calculateAspectRatio();
    const shouldShowImage = isIntersecting && loadingState !== ImageLoadingState.Error;
    const shouldShowSkeleton = showSkeleton && loadingState === ImageLoadingState.Loading && !isIntersecting;
    const shouldShowError = loadingState === ImageLoadingState.Error;

    return (
      <div 
        ref={containerRef}
        className={cn(
          'relative overflow-hidden',
          paddingBottom && 'w-full',
          containerClassName
        )}
        style={{ paddingBottom }}
      >
        {shouldShowSkeleton && <Skeleton />}
        
        {shouldShowError && <ErrorState />}
        
        {shouldShowImage && (
          <Image
            ref={ref}
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            sizes={optimizedConfig.sizes}
            quality={optimizedConfig.quality}
            priority={priority}
            placeholder={placeholder}
            blurDataURL={optimizedConfig.blurDataURL}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              'transition-opacity duration-300',
              loadingState === ImageLoadingState.Loading && enableProgressiveLoading && 'opacity-0',
              loadingState === ImageLoadingState.Loaded && 'opacity-100',
              paddingBottom && 'absolute inset-0 w-full h-full object-cover',
              className
            )}
            {...props}
          />
        )}
        
        {/* Progressive loading overlay */}
        {enableProgressiveLoading && loadingState === ImageLoadingState.Loading && isIntersecting && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        )}
      </div>
    );
  }
);

LazyImage.displayName = 'LazyImage';

/**
 * Optimized avatar image component
 */
export const AvatarImage = forwardRef<HTMLImageElement, Omit<LazyImageProps, 'preset'>>(
  (props, ref) => (
    <LazyImage
      ref={ref}
      preset="avatar"
      aspectRatio={1}
      {...props}
    />
  )
);

AvatarImage.displayName = 'AvatarImage';

/**
 * Hero image component with priority loading
 */
export const HeroImage = forwardRef<HTMLImageElement, Omit<LazyImageProps, 'preset' | 'priority'>>(
  (props, ref) => (
    <LazyImage
      ref={ref}
      preset="hero"
      priority={true}
      showSkeleton={false}
      {...props}
    />
  )
);

HeroImage.displayName = 'HeroImage';

/**
 * Gallery image component with optimized loading
 */
export const GalleryImage = forwardRef<HTMLImageElement, Omit<LazyImageProps, 'preset'>>(
  (props, ref) => (
    <LazyImage
      ref={ref}
      preset="gallery"
      enableProgressiveLoading={true}
      {...props}
    />
  )
);

GalleryImage.displayName = 'GalleryImage';

/**
 * Card image component for thumbnails and previews
 */
export const CardImage = forwardRef<HTMLImageElement, Omit<LazyImageProps, 'preset'>>(
  (props, ref) => (
    <LazyImage
      ref={ref}
      preset="card"
      aspectRatio={16/9}
      {...props}
    />
  )
);

CardImage.displayName = 'CardImage';

export default LazyImage;