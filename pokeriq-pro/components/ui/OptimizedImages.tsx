'use client';

import Image from 'next/image';
import { useState, memo, useMemo, useCallback } from 'react';

interface OptimizedPokerImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  onError?: () => void;
}

// 优化的扑克图片组件，支持懒加载和错误处理
const OptimizedPokerImage = memo<OptimizedPokerImageProps>(function OptimizedPokerImage({
  src,
  alt,
  width = 64,
  height = 96,
  priority = false,
  className = '',
  onError,
}) {
  const [imageError, setImageError] = useState(false);
  
  // 缓存错误处理函数
  const handleError = useCallback(() => {
    setImageError(true);
    onError?.();
  }, [onError]);

  // 缓存占位符样式
  const placeholderStyle = useMemo(() => ({
    width,
    height,
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  }), [width, height]);

  if (imageError) {
    return (
      <div style={placeholderStyle} className={className}>
        <span className="text-gray-400 text-xs">图片错误</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={`rounded-lg ${className}`}
      onError={handleError}
      // Next.js 15 优化配置
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
      sizes={`(max-width: 768px) ${width}px, ${width}px`}
      style={{
        objectFit: 'contain',
      }}
    />
  );
});

// 扑克卡牌图片组件
interface PokerCardImageProps {
  card: string;
  size?: 'small' | 'medium' | 'large';
  priority?: boolean;
  className?: string;
}

export const PokerCardImage = memo<PokerCardImageProps>(function PokerCardImage({
  card,
  size = 'medium',
  priority = false,
  className = '',
}) {
  // 尺寸映射
  const sizeMap = useMemo(() => ({
    small: { width: 40, height: 56 },
    medium: { width: 64, height: 96 },
    large: { width: 96, height: 144 },
  }), []);

  const { width, height } = sizeMap[size];
  
  // 生成图片路径
  const imagePath = useMemo(() => {
    if (card === 'back') {
      return '/images/cards/card-back.webp';
    }
    return `/images/cards/${card}.webp`;
  }, [card]);

  // 生成alt文本
  const altText = useMemo(() => {
    if (card === 'back') {
      return '扑克牌背面';
    }
    const rank = card[0];
    const suit = card[1];
    const suitNames = { h: '红心', d: '方块', c: '梅花', s: '黑桃' };
    const rankNames = { 
      A: 'A', 
      K: 'K', 
      Q: 'Q', 
      J: 'J', 
      T: '10',
      '9': '9', '8': '8', '7': '7', '6': '6', 
      '5': '5', '4': '4', '3': '3', '2': '2' 
    };
    return `${suitNames[suit as keyof typeof suitNames]}${rankNames[rank as keyof typeof rankNames]}`;
  }, [card]);

  return (
    <OptimizedPokerImage
      src={imagePath}
      alt={altText}
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
});

// 头像图片组件
interface AvatarImageProps {
  src?: string;
  alt: string;
  size?: number;
  fallbackText?: string;
  priority?: boolean;
  className?: string;
}

export const AvatarImage = memo<AvatarImageProps>(function AvatarImage({
  src,
  alt,
  size = 40,
  fallbackText = '用户',
  priority = false,
  className = '',
}) {
  const [imageError, setImageError] = useState(false);

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  if (!src || imageError) {
    return (
      <div 
        className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {fallbackText.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={`rounded-full object-cover ${className}`}
      onError={handleError}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    />
  );
});

// 徽章图片组件
interface BadgeImageProps {
  badgeId: string;
  size?: 'small' | 'medium' | 'large';
  alt?: string;
  priority?: boolean;
  className?: string;
}

export const BadgeImage = memo<BadgeImageProps>(function BadgeImage({
  badgeId,
  size = 'medium',
  alt,
  priority = false,
  className = '',
}) {
  const sizeMap = useMemo(() => ({
    small: 32,
    medium: 48,
    large: 64,
  }), []);

  const imageSize = sizeMap[size];
  const imagePath = `/images/badges/${badgeId}.webp`;
  const altText = alt || `成就徽章 ${badgeId}`;

  return (
    <OptimizedPokerImage
      src={imagePath}
      alt={altText}
      width={imageSize}
      height={imageSize}
      priority={priority}
      className={`${className}`}
    />
  );
});

// 陪伴角色图片组件
interface CompanionImageProps {
  companionId: string;
  variant?: 'avatar' | 'full' | 'expression';
  size?: 'small' | 'medium' | 'large';
  priority?: boolean;
  className?: string;
}

export const CompanionImage = memo<CompanionImageProps>(function CompanionImage({
  companionId,
  variant = 'avatar',
  size = 'medium',
  priority = false,
  className = '',
}) {
  const sizeMap = useMemo(() => ({
    small: { width: 64, height: 64 },
    medium: { width: 128, height: 128 },
    large: { width: 256, height: 256 },
  }), []);

  const { width, height } = sizeMap[size];
  const imagePath = `/images/companions/${companionId}-${variant}.webp`;
  const altText = `陪伴角色 ${companionId}`;

  return (
    <OptimizedPokerImage
      src={imagePath}
      alt={altText}
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
});

export default OptimizedPokerImage;