'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface OptimizedCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: ReactNode;
  className?: string;
  clickable?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'glass' | 'gradient' | 'elevated';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
}

export const OptimizedCard: React.FC<OptimizedCardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  className = '',
  clickable = false,
  onClick,
  variant = 'default',
  size = 'md',
  loading = false,
}) => {
  const baseStyles = `
    relative rounded-2xl transition-all duration-300 ease-out overflow-hidden
    ${clickable ? 'cursor-pointer' : ''}
  `;

  const sizeStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const variantStyles = {
    default: `
      bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700
      hover:shadow-xl hover:-translate-y-1 hover:border-gray-300 dark:hover:border-gray-600
      shadow-sm
    `,
    glass: `
      backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/50
      hover:bg-white/20 dark:hover:bg-gray-900/20 hover:shadow-2xl hover:-translate-y-2
      shadow-lg
    `,
    gradient: `
      bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-purple-500/10
      dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20
      border border-purple-200/50 dark:border-purple-700/50
      hover:from-purple-500/20 hover:via-pink-500/20 hover:to-purple-500/20
      hover:shadow-2xl hover:-translate-y-1
    `,
    elevated: `
      bg-white dark:bg-gray-900 border-0
      shadow-xl hover:shadow-2xl hover:-translate-y-2
      ring-1 ring-gray-200/50 dark:ring-gray-700/50
    `,
  };

  const cardContent = (
    <>
      {/* Header */}
      {(title || subtitle || headerAction) && (
        <div className="flex items-start justify-between mb-6">
          <div>
            {title && (
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 leading-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="flex-shrink-0 ml-4">
              {headerAction}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={loading ? 'animate-pulse' : ''}>
        {children}
      </div>

      {/* Subtle background pattern for enhanced visual interest */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 dark:opacity-10 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-full filter blur-3xl"></div>
      </div>
    </>
  );

  if (clickable) {
    return (
      <motion.div
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return (
    <div className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {cardContent}
    </div>
  );
};

// Enhanced Grid System
interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { xs: 1, sm: 2, lg: 3, xl: 4 },
  gap = 6,
  className = '',
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  const buildGridClasses = () => {
    const classes = ['grid'];
    
    if (cols.xs) classes.push(gridCols[cols.xs as keyof typeof gridCols]);
    if (cols.sm) classes.push(`sm:${gridCols[cols.sm as keyof typeof gridCols]}`);
    if (cols.md) classes.push(`md:${gridCols[cols.md as keyof typeof gridCols]}`);
    if (cols.lg) classes.push(`lg:${gridCols[cols.lg as keyof typeof gridCols]}`);
    if (cols.xl) classes.push(`xl:${gridCols[cols.xl as keyof typeof gridCols]}`);
    if (cols['2xl']) classes.push(`2xl:${gridCols[cols['2xl'] as keyof typeof gridCols]}`);
    
    classes.push(`gap-${gap}`);
    
    return classes.join(' ');
  };

  return (
    <div className={`${buildGridClasses()} ${className}`}>
      {children}
    </div>
  );
};

// Optimized Section Component
interface OptimizedSectionProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  spacing?: 'tight' | 'normal' | 'loose';
}

export const OptimizedSection: React.FC<OptimizedSectionProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  spacing = 'normal',
}) => {
  const spacingStyles = {
    tight: 'space-y-4',
    normal: 'space-y-6',
    loose: 'space-y-8',
  };

  return (
    <section className={`${spacingStyles[spacing]} ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
      
      <div>
        {children}
      </div>
    </section>
  );
};

// Enhanced Stats Grid
interface StatItemProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export const StatItem: React.FC<StatItemProps> = ({
  icon,
  label,
  value,
  trend,
  color = 'blue',
}) => {
  const colorStyles = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: 'text-blue-600 dark:text-blue-400',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
      ring: 'hover:ring-blue-500/20',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: 'text-green-600 dark:text-green-400',
      hover: 'hover:bg-green-100 dark:hover:bg-green-900/30',
      ring: 'hover:ring-green-500/20',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      icon: 'text-purple-600 dark:text-purple-400',
      hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
      ring: 'hover:ring-purple-500/20',
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      icon: 'text-orange-600 dark:text-orange-400',
      hover: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
      ring: 'hover:ring-orange-500/20',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: 'text-red-600 dark:text-red-400',
      hover: 'hover:bg-red-100 dark:hover:bg-red-900/30',
      ring: 'hover:ring-red-500/20',
    },
  };

  const styles = colorStyles[color];

  return (
    <OptimizedCard
      className={`
        ${styles.bg} ${styles.hover} ${styles.ring}
        transition-all duration-300 hover:ring-4 group cursor-pointer
      `}
      variant="default"
      size="md"
    >
      <div className="flex items-center justify-between">
        <div className={`
          w-14 h-14 ${styles.bg} rounded-2xl flex items-center justify-center
          group-hover:scale-110 transition-transform duration-300
        `}>
          <div className={`${styles.icon} transition-colors duration-300`}>
            {icon}
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
            {value}
          </p>
          
          {trend && (
            <div className={`
              flex items-center justify-end text-xs font-medium mt-1
              ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
            `}>
              <span className="mr-1">
                {trend.isPositive ? '↗' : '↘'}
              </span>
              {trend.value}% {trend.label}
            </div>
          )}
        </div>
      </div>
    </OptimizedCard>
  );
};