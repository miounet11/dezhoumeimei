'use client';

// Suppress specific Ant Design React 19 compatibility warnings
export function suppressAntdWarnings() {
  if (typeof window === 'undefined') return;

  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Suppress Ant Design React compatibility warnings
    if (
      message.includes('[antd: compatible]') ||
      message.includes('antd v5 support React is 16 ~ 18') ||
      message.includes('see https://u.ant.design/v5-for-19')
    ) {
      return;
    }
    
    originalWarn.apply(console, args);
  };

  console.error = function(...args) {
    const message = args.join(' ');
    
    // Suppress Ant Design React compatibility errors
    if (
      message.includes('[antd: compatible]') ||
      message.includes('antd v5 support React is 16 ~ 18') ||
      message.includes('see https://u.ant.design/v5-for-19')
    ) {
      return;
    }
    
    originalError.apply(console, args);
  };
}

// Auto-suppress on client side
if (typeof window !== 'undefined') {
  suppressAntdWarnings();
}