'use client';

import React, { useState } from 'react';
import { LoadingSpinner } from './Loading';

interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  hapticFeedback?: boolean;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  hapticFeedback = true,
  children,
  leftIcon,
  rightIcon,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Haptic feedback for mobile devices
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Visual press feedback
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);

    if (onClick) {
      onClick(e);
    }
  };

  const baseStyles = `
    relative inline-flex items-center justify-center font-medium rounded-xl
    transition-all duration-200 ease-out transform focus:outline-none focus:ring-4
    active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
    overflow-hidden group
  `;

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg
      hover:from-purple-700 hover:to-pink-700 hover:shadow-xl hover:-translate-y-0.5
      focus:ring-purple-500/50 active:shadow-lg
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent
      before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
    `,
    secondary: `
      bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600
      hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-md hover:-translate-y-0.5
      focus:ring-gray-500/50
    `,
    success: `
      bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg
      hover:from-green-600 hover:to-emerald-600 hover:shadow-xl hover:-translate-y-0.5
      focus:ring-green-500/50
    `,
    warning: `
      bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg
      hover:from-yellow-600 hover:to-orange-600 hover:shadow-xl hover:-translate-y-0.5
      focus:ring-yellow-500/50
    `,
    danger: `
      bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg
      hover:from-red-600 hover:to-red-700 hover:shadow-xl hover:-translate-y-0.5
      focus:ring-red-500/50
    `,
  };

  return (
    <button
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${isPressed ? 'animate-pulse scale-95' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {/* Ripple effect */}
      <span className="absolute inset-0 overflow-hidden rounded-xl">
        <span className="absolute inset-0 bg-white/20 transform scale-0 rounded-full group-active:scale-100 transition-transform duration-300 ease-out"></span>
      </span>

      {/* Button content */}
      <span className="relative flex items-center justify-center gap-2">
        {loading ? (
          <LoadingSpinner size="sm" color="white" />
        ) : leftIcon ? (
          <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
            {leftIcon}
          </span>
        ) : null}
        
        <span className="transition-all duration-200 group-hover:tracking-wide">
          {children}
        </span>
        
        {!loading && rightIcon && (
          <span className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5">
            {rightIcon}
          </span>
        )}
      </span>

      {/* Subtle gradient shine effect */}
      <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></span>
    </button>
  );
};

// Enhanced Input with better feedback
interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  error,
  success,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200">
          {label}
        </label>
      )}
      
      <div className="relative group">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200">
            {leftIcon}
          </div>
        )}
        
        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`
            w-full px-3 py-2.5 ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''}
            border border-gray-300 dark:border-gray-600 rounded-xl
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            transition-all duration-200 ease-out
            focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500
            hover:border-gray-400 dark:hover:border-gray-500
            ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}
            ${success ? 'border-green-500 focus:ring-green-500/20 focus:border-green-500' : ''}
            ${isFocused ? 'shadow-lg transform scale-[1.01]' : ''}
            placeholder:text-gray-400 dark:placeholder:text-gray-500
          `}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors duration-200">
            {rightIcon}
          </div>
        )}
        
        {/* Enhanced focus ring */}
        <div className={`absolute inset-0 rounded-xl transition-opacity duration-200 pointer-events-none ${
          isFocused ? 'opacity-100' : 'opacity-0'
        } bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 animate-pulse`}></div>
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1 animate-in slide-in-from-left duration-200">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 animate-in slide-in-from-left duration-200">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {success}
        </p>
      )}
    </div>
  );
};