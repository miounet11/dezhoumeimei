import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';

// API配置 - 使用安全的方式
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || `http://localhost:${process.env.PORT || 8820}/api`;

// 创建axios实例
const secureApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 重要：允许发送cookies
});

// 请求拦截器
secureApiClient.interceptors.request.use(
  (config) => {
    // 不再从localStorage读取token
    // httpOnly cookie会自动随请求发送
    
    // 添加CSRF token（如果存在）
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    // 添加请求ID用于调试
    config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
secureApiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 从响应头更新CSRF token
    const newCsrfToken = response.headers['x-csrf-token'];
    if (newCsrfToken) {
      setCsrfToken(newCsrfToken);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // 处理token过期
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 尝试刷新token
        await refreshToken();
        return secureApiClient(originalRequest);
      } catch (refreshError) {
        // 刷新失败，跳转到登录页
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 403:
          console.error('Access forbidden:', data.message);
          break;
        case 404:
          console.error('Resource not found:', data.message);
          break;
        case 429:
          console.error('Too many requests. Please try again later.');
          break;
        case 500:
          console.error('Server error. Please try again later.');
          break;
        default:
          console.error('API Error:', data.message || 'Unknown error');
      }
    } else if (error.request) {
      console.error('Network error. Please check your connection.');
    } else {
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// CSRF Token管理（使用sessionStorage而不是localStorage）
function getCsrfToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('csrf-token');
  }
  return null;
}

function setCsrfToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('csrf-token', token);
  }
}

// 刷新token
async function refreshToken(): Promise<void> {
  const response = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true }
  );
  
  if (response.data.csrfToken) {
    setCsrfToken(response.data.csrfToken);
  }
}

// API方法封装
export const secureApi = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => 
    secureApiClient.get(url, config),
    
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => 
    secureApiClient.post(url, data, config),
    
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => 
    secureApiClient.put(url, data, config),
    
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => 
    secureApiClient.delete(url, config),
    
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> => 
    secureApiClient.patch(url, data, config),
};

export default secureApiClient;