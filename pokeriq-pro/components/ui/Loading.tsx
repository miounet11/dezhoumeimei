'use client';

import { ReactNode } from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'green' | 'blue' | 'gray' | 'white';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'green',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    green: 'border-green-600 border-t-transparent',
    blue: 'border-blue-600 border-t-transparent',
    gray: 'border-gray-600 border-t-transparent',
    white: 'border-white border-t-transparent',
  };

  return (
    <div 
      className={`${sizeClasses[size]} ${colorClasses[color]} border-2 rounded-full animate-spin ${className}`}
    />
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  children: ReactNode;
  message?: string;
  backdrop?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  isLoading, 
  children, 
  message = '加载中...',
  backdrop = true 
}) => {
  return (
    <div className="relative">
      {children}
      
      {isLoading && (
        <div className={`absolute inset-0 flex items-center justify-center z-10 ${
          backdrop ? 'bg-white bg-opacity-75' : ''
        }`}>
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

interface LoadingPageProps {
  message?: string;
  showLogo?: boolean;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ 
  message = '正在加载...', 
  showLogo = true 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {showLogo && (
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl shadow-xl mb-4">
            <span className="text-4xl">🃏</span>
          </div>
        )}
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">PokerIQ Pro</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

interface LoadingButtonProps {
  isLoading: boolean;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading && (
        <LoadingSpinner size="sm" color="white" className="mr-2" />
      )}
      {children}
    </button>
  );
};