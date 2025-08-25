import { useState, useEffect, useCallback } from 'react';
import { cache } from './redis';
import { cacheAside } from './strategies';

/**
 * React Hook for cached data
 * 自动处理缓存获取、加载状态和错误
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number;
    staleTime?: number;
    refetchOnMount?: boolean;
    refetchInterval?: number;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await cacheAside({
        key,
        ttl: options?.ttl,
        fetch: fetcher,
      });
      
      setData(result);
      setLastFetch(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options?.ttl]);

  // 初始加载
  useEffect(() => {
    if (options?.refetchOnMount !== false) {
      fetchData();
    }
  }, [fetchData, options?.refetchOnMount]);

  // 定期刷新
  useEffect(() => {
    if (options?.refetchInterval && options.refetchInterval > 0) {
      const interval = setInterval(fetchData, options.refetchInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, options?.refetchInterval]);

  // 检查是否过期
  const isStale = useCallback(() => {
    if (!options?.staleTime || !lastFetch) return false;
    return Date.now() - lastFetch > options.staleTime;
  }, [lastFetch, options?.staleTime]);

  // 手动刷新
  const refresh = useCallback(async () => {
    await cache.delete(key);
    await fetchData();
  }, [key, fetchData]);

  // 手动更新缓存
  const update = useCallback(async (newData: T) => {
    await cache.set(key, newData, options?.ttl);
    setData(newData);
    setLastFetch(Date.now());
  }, [key, options?.ttl]);

  return {
    data,
    loading,
    error,
    isStale: isStale(),
    refresh,
    update,
  };
}

/**
 * Hook for cache invalidation
 * 用于管理缓存失效
 */
export function useCacheInvalidation() {
  const invalidate = useCallback(async (key: string) => {
    return cache.delete(key);
  }, []);

  const invalidatePattern = useCallback(async (pattern: string) => {
    return cache.deletePattern(pattern);
  }, []);

  const invalidateMultiple = useCallback(async (keys: string[]) => {
    const promises = keys.map(key => cache.delete(key));
    await Promise.all(promises);
  }, []);

  return {
    invalidate,
    invalidatePattern,
    invalidateMultiple,
  };
}

/**
 * Hook for rate limiting
 * 用于客户端速率限制
 */
export function useRateLimit(
  identifier: string,
  limit: number,
  window: number = 60
) {
  const [isAllowed, setIsAllowed] = useState(true);
  const [remaining, setRemaining] = useState(limit);

  const checkLimit = useCallback(async () => {
    const key = `rate_limit:${identifier}`;
    
    try {
      const current = await cache.increment(key);
      
      if (current === 1) {
        await cache.expire(key, window);
      }
      
      const allowed = current ? current <= limit : true;
      setIsAllowed(allowed);
      setRemaining(Math.max(0, limit - (current || 0)));
      
      return allowed;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return true; // 失败时允许通过
    }
  }, [identifier, limit, window]);

  const reset = useCallback(async () => {
    const key = `rate_limit:${identifier}`;
    await cache.delete(key);
    setIsAllowed(true);
    setRemaining(limit);
  }, [identifier, limit]);

  return {
    isAllowed,
    remaining,
    checkLimit,
    reset,
  };
}

/**
 * Hook for optimistic updates
 * 乐观更新：先更新UI，后台同步
 */
export function useOptimisticCache<T>(
  key: string,
  initialData?: T
) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [syncing, setSyncing] = useState(false);

  const optimisticUpdate = useCallback(async (
    newData: T,
    persist: () => Promise<void>
  ) => {
    // 1. 立即更新UI
    setData(newData);
    
    // 2. 更新缓存
    await cache.set(key, newData);
    
    // 3. 后台同步到数据库
    setSyncing(true);
    try {
      await persist();
    } catch (error) {
      // 回滚
      const oldData = await cache.get<T>(key);
      if (oldData) {
        setData(oldData);
      }
      throw error;
    } finally {
      setSyncing(false);
    }
  }, [key]);

  return {
    data,
    syncing,
    optimisticUpdate,
  };
}

/**
 * Hook for cached pagination
 * 缓存分页数据
 */
export function useCachedPagination<T>(
  baseKey: string,
  fetcher: (page: number, pageSize: number) => Promise<{
    data: T[];
    total: number;
  }>,
  options?: {
    initialPage?: number;
    pageSize?: number;
    ttl?: number;
  }
) {
  const [page, setPage] = useState(options?.initialPage || 1);
  const [pageSize] = useState(options?.pageSize || 10);
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPage = useCallback(async (pageNum: number) => {
    const key = `${baseKey}:page:${pageNum}:size:${pageSize}`;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await cacheAside({
        key,
        ttl: options?.ttl,
        fetch: () => fetcher(pageNum, pageSize),
      });
      
      if (result) {
        setData(result.data);
        setTotal(result.total);
        setPage(pageNum);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [baseKey, fetcher, pageSize, options?.ttl]);

  // 初始加载
  useEffect(() => {
    fetchPage(page);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goToPage = useCallback((pageNum: number) => {
    fetchPage(pageNum);
  }, [fetchPage]);

  const refresh = useCallback(async () => {
    const key = `${baseKey}:page:${page}:size:${pageSize}`;
    await cache.delete(key);
    await fetchPage(page);
  }, [baseKey, page, pageSize, fetchPage]);

  return {
    data,
    total,
    page,
    pageSize,
    loading,
    error,
    goToPage,
    refresh,
    hasNext: page * pageSize < total,
    hasPrev: page > 1,
    totalPages: Math.ceil(total / pageSize),
  };
}