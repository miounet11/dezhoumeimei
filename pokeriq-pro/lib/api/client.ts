import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse } from '@/types';

// API配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // 统一错误处理
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('token');
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          break;
        case 403:
          console.error('访问被拒绝');
          break;
        case 404:
          console.error('请求的资源不存在');
          break;
        case 429:
          console.error('请求过于频繁，请稍后再试');
          break;
        case 500:
          console.error('服务器内部错误');
          break;
        default:
          console.error(`请求失败: ${status}`);
      }
      
      return Promise.reject({
        message: data?.message || data?.error || '请求失败',
        status,
        data
      });
    } else if (error.request) {
      // 网络错误
      console.error('网络连接失败');
      return Promise.reject({
        message: '网络连接失败，请检查网络设置',
        status: 0
      });
    } else {
      // 其他错误
      console.error('请求配置错误:', error.message);
      return Promise.reject({
        message: error.message || '请求失败',
        status: -1
      });
    }
  }
);

// 通用API方法
class APIClient {
  // GET请求
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.get(url, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // POST请求
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.post(url, data, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // PUT请求
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.put(url, data, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // PATCH请求
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.patch(url, data, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // DELETE请求
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await apiClient.delete(url, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 处理成功响应
  private handleResponse<T>(response: AxiosResponse): ApiResponse<T> {
    const { data, status } = response;
    
    // 如果响应数据已经是标准格式
    if (data && typeof data === 'object' && 'success' in data) {
      return data;
    }
    
    // 否则包装为标准格式
    return {
      success: status >= 200 && status < 300,
      data: data,
      message: 'Success'
    };
  }

  // 处理错误响应
  private handleError(error: any): ApiResponse<any> {
    return {
      success: false,
      data: null,
      error: error.message || '请求失败',
      message: error.message || '请求失败'
    };
  }

  // 上传文件
  async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // 下载文件
  async downloadFile(url: string, filename?: string): Promise<void> {
    try {
      const response = await apiClient.get(url, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('下载失败:', error);
      throw error;
    }
  }

  // 批量请求
  async batch(requests: Array<() => Promise<any>>): Promise<any[]> {
    try {
      return await Promise.all(requests.map(request => request()));
    } catch (error) {
      console.error('批量请求失败:', error);
      throw error;
    }
  }

  // 获取请求取消token
  getCancelToken() {
    return axios.CancelToken.source();
  }
}

// 创建API客户端实例
export const api = new APIClient();

// 导出axios实例供其他地方使用
export { apiClient };

// 工具函数：构建查询参数
export const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  return searchParams.toString();
};

// 工具函数：获取错误信息
export const getErrorMessage = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return '未知错误';
};