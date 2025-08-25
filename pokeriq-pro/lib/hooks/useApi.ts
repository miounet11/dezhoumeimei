import { useState, useEffect, useCallback } from 'react';
import { ApiResponse } from '@/types';

interface UseApiOptions<T> {
  autoFetch?: boolean;
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  retryCount?: number;
  retryDelay?: number;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
  retry: () => Promise<void>;
}

export function useApi<T>(
  url: string,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const { 
    autoFetch = true, 
    initialData = null, 
    onSuccess, 
    onError,
    retryCount = 2,
    retryDelay = 1000
  } = options;
  
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (attempt: number = 0): Promise<void> => {
    if (attempt === 0) {
      setLoading(true);
      setError(null);
    }
    
    try {
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Handle non-200 responses gracefully
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('资源未找到');
        } else if (response.status === 401) {
          throw new Error('未授权访问');
        } else if (response.status >= 500) {
          throw new Error('服务器错误，请稍后再试');
        }
      }

      const result: ApiResponse<T> = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
        onSuccess?.(result.data);
      } else {
        const errorMsg = result.error || '获取数据失败';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '网络错误';
      
      // Retry logic for network errors
      if (attempt < retryCount && (errorMsg.includes('网络') || errorMsg.includes('服务器错误'))) {
        console.log(`API请求失败，${retryDelay}ms后进行第${attempt + 1}次重试...`);
        setTimeout(() => {
          fetchData(attempt + 1);
        }, retryDelay);
        return;
      }
      
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      if (attempt === 0) {
        setLoading(false);
      }
    }
  }, [url, onSuccess, onError, retryCount, retryDelay]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
  }, []);

  const retry = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    mutate,
    retry
  };
}