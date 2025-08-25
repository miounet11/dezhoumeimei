/**
 * 统一的 API 客户端
 * 整合所有 API 调用，使用一致的错误处理和日志记录
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse } from '@/types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('api-client');

// API 基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 
  `http://localhost:${process.env.PORT || 8820}/api`;

const DEFAULT_TIMEOUT = 10000; // 10秒超时

// 请求重试配置
interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    // 只重试网络错误和5xx错误
    return !error.response || (error.response.status >= 500);
  }
};

// 创建axios实例
class UnifiedApiClient {
  private client: AxiosInstance;
  private csrfToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // 允许发送cookies
    });

    this.setupInterceptors();
  }

  // 设置拦截器
  private setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 添加CSRF token
        if (this.csrfToken) {
          config.headers['X-CSRF-Token'] = this.csrfToken;
        }

        // 添加请求ID用于追踪
        const requestId = this.generateRequestId();
        config.headers['X-Request-ID'] = requestId;

        // 记录请求
        logger.debug({
          requestId,
          method: config.method,
          url: config.url,
          params: config.params,
        }, 'API request initiated');

        return config;
      },
      (error) => {
        logger.error({ error }, 'Request interceptor error');
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        // 更新CSRF token
        const newCsrfToken = response.headers['x-csrf-token'];
        if (newCsrfToken) {
          this.csrfToken = newCsrfToken;
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('csrf-token', newCsrfToken);
          }
        }

        // 记录响应
        const requestId = response.config.headers?.['X-Request-ID'];
        logger.debug({
          requestId,
          status: response.status,
          url: response.config.url,
        }, 'API response received');

        return response;
      },
      async (error: AxiosError) => {
        const requestId = error.config?.headers?.['X-Request-ID'];
        
        // 处理不同的错误情况
        if (error.response) {
          // 服务器返回了错误响应
          await this.handleResponseError(error, requestId as string);
        } else if (error.request) {
          // 请求已发送但没有收到响应
          logger.error({
            requestId,
            error: error.message,
          }, 'Network error - no response received');
        } else {
          // 请求配置出错
          logger.error({
            requestId,
            error: error.message,
          }, 'Request configuration error');
        }

        return Promise.reject(error);
      }
    );
  }

  // 处理响应错误
  private async handleResponseError(error: AxiosError, requestId: string) {
    const status = error.response?.status;
    const data = error.response?.data as any;

    switch (status) {
      case 401:
        logger.warn({ requestId }, 'Unauthorized - redirecting to login');
        // 尝试刷新token
        const refreshed = await this.refreshAuth();
        if (!refreshed && typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        break;

      case 403:
        logger.warn({ requestId, data }, 'Forbidden access');
        break;

      case 404:
        logger.warn({ requestId, url: error.config?.url }, 'Resource not found');
        break;

      case 429:
        logger.warn({ requestId }, 'Rate limit exceeded');
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        logger.error({
          requestId,
          status,
          data,
        }, 'Server error');
        break;

      default:
        logger.error({
          requestId,
          status,
          data,
        }, 'API error');
    }
  }

  // 刷新认证
  private async refreshAuth(): Promise<boolean> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        logger.info('Authentication refreshed successfully');
        return true;
      }
    } catch (error) {
      logger.error({ error }, 'Failed to refresh authentication');
    }
    return false;
  }

  // 生成请求ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 带重试的请求
  private async requestWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<AxiosResponse<T>> {
    let lastError: AxiosError | undefined;

    for (let i = 0; i <= retryConfig.retries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as AxiosError;

        if (i === retryConfig.retries) {
          break; // 最后一次重试失败
        }

        if (retryConfig.retryCondition && !retryConfig.retryCondition(lastError)) {
          break; // 不满足重试条件
        }

        // 等待后重试
        logger.info({
          attempt: i + 1,
          maxRetries: retryConfig.retries,
        }, 'Retrying request');

        await new Promise(resolve => setTimeout(resolve, retryConfig.retryDelay * (i + 1)));
      }
    }

    throw lastError;
  }

  // 初始化CSRF token
  async initializeCsrf(): Promise<void> {
    try {
      // 从sessionStorage恢复
      if (typeof window !== 'undefined') {
        this.csrfToken = sessionStorage.getItem('csrf-token');
      }

      // 如果没有，从服务器获取
      if (!this.csrfToken) {
        const response = await this.client.get('/auth/csrf');
        this.csrfToken = response.data.csrfToken;
      }
    } catch (error) {
      logger.error({ error }, 'Failed to initialize CSRF token');
    }
  }

  // ============ Public API Methods ============

  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.requestWithRetry(
      () => this.client.get<ApiResponse<T>>(url, config)
    );
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.requestWithRetry(
      () => this.client.post<ApiResponse<T>>(url, data, config)
    );
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.requestWithRetry(
      () => this.client.put<ApiResponse<T>>(url, data, config)
    );
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.requestWithRetry(
      () => this.client.patch<ApiResponse<T>>(url, data, config)
    );
    return response.data;
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.requestWithRetry(
      () => this.client.delete<ApiResponse<T>>(url, config)
    );
    return response.data;
  }

  // 文件上传
  async upload<T = any>(
    url: string,
    formData: FormData,
    onProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
    return response.data;
  }

  // 文件下载
  async download(
    url: string,
    filename?: string
  ): Promise<void> {
    const response = await this.client.get(url, {
      responseType: 'blob',
    });

    // 创建下载链接
    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename || 'download';
    link.click();
    window.URL.revokeObjectURL(link.href);
  }
}

// 创建单例实例
const apiClient = new UnifiedApiClient();

// 初始化CSRF token
if (typeof window !== 'undefined') {
  apiClient.initializeCsrf();
}

// 导出统一的API接口
export const api = {
  get: apiClient.get.bind(apiClient),
  post: apiClient.post.bind(apiClient),
  put: apiClient.put.bind(apiClient),
  patch: apiClient.patch.bind(apiClient),
  delete: apiClient.delete.bind(apiClient),
  upload: apiClient.upload.bind(apiClient),
  download: apiClient.download.bind(apiClient),
};

// 导出特定领域的API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  logout: () =>
    api.post('/auth/logout'),
  
  register: (data: any) =>
    api.post('/auth/register', data),
  
  refreshToken: () =>
    api.post('/auth/refresh'),
  
  getSession: () =>
    api.get('/auth/session'),
};

export const userApi = {
  getProfile: (userId: string) =>
    api.get(`/users/${userId}`),
  
  updateProfile: (userId: string, data: any) =>
    api.put(`/users/${userId}`, data),
  
  getStats: (userId: string) =>
    api.get(`/users/${userId}/stats`),
};

export const gameApi = {
  createSession: (data: any) =>
    api.post('/sessions', data),
  
  getSession: (sessionId: string) =>
    api.get(`/sessions/${sessionId}`),
  
  updateSession: (sessionId: string, data: any) =>
    api.patch(`/sessions/${sessionId}`, data),
};

export default api;