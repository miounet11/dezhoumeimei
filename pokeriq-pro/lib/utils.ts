import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 样式合并工具
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export other utilities from the utils directory
export * from './utils/index';