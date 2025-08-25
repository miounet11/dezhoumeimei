import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 样式合并工具
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 时间格式化工具
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatTimeAgo = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return '刚刚';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return formatDate(date);
  }
};

// 数字格式化工具
export const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-CN');
};

export const formatPercent = (num: number, decimals = 1): string => {
  return `${num.toFixed(decimals)}%`;
};

export const formatCurrency = (amount: number, currency = '¥'): string => {
  return `${currency}${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
};

// 扑克相关工具函数
export const getCardDisplayValue = (rank: string): string => {
  const rankMap: Record<string, string> = {
    'A': 'A',
    'K': 'K',
    'Q': 'Q',
    'J': 'J',
    '10': '10',
    '9': '9',
    '8': '8',
    '7': '7',
    '6': '6',
    '5': '5',
    '4': '4',
    '3': '3',
    '2': '2'
  };
  return rankMap[rank] || rank;
};

export const getSuitSymbol = (suit: string): string => {
  const suitMap: Record<string, string> = {
    'hearts': '♥️',
    'diamonds': '♦️',
    'clubs': '♣️',
    'spades': '♠️'
  };
  return suitMap[suit] || suit;
};

export const getSuitColor = (suit: string): string => {
  return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-black dark:text-white';
};

// 胜率计算
export const calculateWinRate = (wins: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((wins / total) * 100 * 10) / 10;
};

// BB/100计算
export const calculateBBPer100 = (profit: number, handsPlayed: number, bigBlind: number = 1): number => {
  if (handsPlayed === 0) return 0;
  return Math.round((profit / bigBlind / handsPlayed * 100) * 100) / 100;
};

// 底池赔率计算
export const calculatePotOdds = (betSize: number, potSize: number): number => {
  const totalPot = potSize + betSize;
  return Math.round((betSize / totalPot) * 100 * 10) / 10;
};

// 成牌概率计算（简化版）
export const calculateOuts = (outs: number, cards: number = 2): number => {
  // 简化的成牌概率计算
  // Turn: (outs * 2 + 1)%
  // River: (outs * 2)%
  if (cards === 2) {
    return Math.round((outs * 4) * 10) / 10; // Turn + River
  } else if (cards === 1) {
    return Math.round((outs * 2) * 10) / 10; // River only
  }
  return 0;
};

// 验证工具
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('密码长度至少6位');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码需要包含大写字母');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码需要包含小写字母');
  }
  
  if (!/\d/.test(password)) {
    errors.push('密码需要包含数字');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUsername = (username: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (username.length < 3) {
    errors.push('用户名长度至少3位');
  }
  
  if (username.length > 20) {
    errors.push('用户名长度不能超过20位');
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('用户名只能包含字母、数字和下划线');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// 深拷贝工具
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
};

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// 随机工具
export const getRandomId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 本地存储工具
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    if (typeof window === 'undefined') return defaultValue || null;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      console.error(`Error getting item from localStorage:`, error);
      return defaultValue || null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item to localStorage:`, error);
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item from localStorage:`, error);
    }
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.clear();
    } catch (error) {
      console.error(`Error clearing localStorage:`, error);
    }
  }
};

// URL工具
export const getQueryParams = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(window.location.search);
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
};

export const updateQueryParams = (params: Record<string, string | undefined>): void => {
  if (typeof window === 'undefined') return;
  
  const url = new URL(window.location.href);
  const searchParams = url.searchParams;
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      searchParams.delete(key);
    } else {
      searchParams.set(key, value);
    }
  });
  
  window.history.replaceState({}, '', url.toString());
};

// 设备检测
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

export const isTablet = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > 768 && window.innerWidth <= 1024;
};

export const isDesktop = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > 1024;
};