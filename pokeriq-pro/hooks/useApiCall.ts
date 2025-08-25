import { useState, useCallback } from 'react';
import { ApiResponse } from '@/types';

interface UseApiCallState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiCallReturn<T> extends UseApiCallState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApiCall<T>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>
): UseApiCallReturn<T> {
  const [state, setState] = useState<UseApiCallState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiFunction(...args);
      
      if (response.success) {
        setState({
          data: response.data,
          loading: false,
          error: null,
        });
        return response.data;
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || '请求失败',
        });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      return null;
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}