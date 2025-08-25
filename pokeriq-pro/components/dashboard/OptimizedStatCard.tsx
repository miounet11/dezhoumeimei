'use client';

import React, { memo, useMemo } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorScheme: {
    from: string;
    to: string;
    iconBg: string;
    text: string;
  };
  animationDelay?: number;
  animatedValue?: number;
}

// Memoized animation counter component
const AnimatedCounter = memo(({ 
  value, 
  suffix = '' 
}: { 
  value: number; 
  suffix?: string; 
}) => {
  const displayValue = useMemo(() => {
    return value.toLocaleString() + suffix;
  }, [value, suffix]);

  return <span>{displayValue}</span>;
});

AnimatedCounter.displayName = 'AnimatedCounter';

// Memoized stat card component
const OptimizedStatCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  colorScheme,
  animationDelay = 0,
  animatedValue
}: StatCardProps) => {
  // Memoize styles to prevent recalculation
  const cardStyles = useMemo(() => ({
    animationDelay: `${animationDelay}ms`,
  }), [animationDelay]);

  const gradientClasses = useMemo(() => ({
    border: `from-${colorScheme.from} via-${colorScheme.to} to-${colorScheme.from}`,
    iconBg: `from-${colorScheme.iconBg} to-${colorScheme.iconBg.replace('-100', '-50')} dark:from-${colorScheme.iconBg.replace('-100', '-900/40')} dark:to-${colorScheme.iconBg.replace('-100', '-800/30')}`,
    text: colorScheme.text,
    hoverText: `group-hover:text-${colorScheme.text}`,
  }), [colorScheme]);

  const displayValue = useMemo(() => {
    if (typeof animatedValue === 'number') {
      return <AnimatedCounter value={animatedValue} suffix={typeof value === 'string' && value.includes('%') ? '%' : ''} />;
    }
    return value;
  }, [value, animatedValue]);

  const trendElement = useMemo(() => {
    if (!trend) return null;
    
    return (
      <span 
        className={`text-${trend.isPositive ? 'green' : 'red'}-500 font-semibold bg-${trend.isPositive ? 'green' : 'red'}-50 dark:bg-${trend.isPositive ? 'green' : 'red'}-900/20 px-2 py-0.5 rounded-full group-hover:animate-pulse`}
      >
        {trend.isPositive ? '↑' : '↓'} {trend.value}
      </span>
    );
  }, [trend]);

  return (
    <div 
      className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2 overflow-hidden active:scale-[0.98] cursor-pointer"
      style={cardStyles}
    >
      {/* Dynamic gradient border on hover */}
      <div className={`absolute inset-0 bg-gradient-to-r ${gradientClasses.border} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      <div className="absolute inset-[1px] bg-white dark:bg-gray-900 rounded-2xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-14 h-14 bg-gradient-to-br ${gradientClasses.iconBg} rounded-2xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-[5deg] transition-all duration-300`}>
            <Icon className={`w-7 h-7 text-${gradientClasses.text} dark:text-${gradientClasses.text.replace('600', '400')} group-hover:animate-pulse`} />
          </div>
          <span className={`text-sm font-medium text-gray-500 dark:text-gray-400 ${gradientClasses.hoverText} transition-colors duration-300`}>
            {title}
          </span>
        </div>
        
        <div className={`text-3xl font-bold text-gray-900 dark:text-white mb-2 ${gradientClasses.hoverText} transition-colors duration-300`}>
          {displayValue}
        </div>
        
        {trend && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {trendElement} 较上周
          </div>
        )}
      </div>
    </div>
  );
});

OptimizedStatCard.displayName = 'OptimizedStatCard';

export default OptimizedStatCard;