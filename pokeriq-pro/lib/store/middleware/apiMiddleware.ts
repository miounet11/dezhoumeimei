import { Middleware } from '@reduxjs/toolkit';

// API中间件，用于统一处理API调用的副作用
export const apiMiddleware: Middleware = (store) => (next) => (action) => {
  // 如果action包含API调用标识，则进行统一处理
  if (action.type.endsWith('/pending')) {
    // 可以在这里添加全局loading状态
    console.log('API call started:', action.type);
  } else if (action.type.endsWith('/fulfilled')) {
    // API调用成功的通用处理
    console.log('API call succeeded:', action.type);
  } else if (action.type.endsWith('/rejected')) {
    // API调用失败的通用处理
    console.error('API call failed:', action.type, action.payload);
    
    // 可以在这里添加全局错误处理
    if (action.payload === '未找到认证token' || action.payload === '无Token') {
      // 自动跳转到登录页
      window.location.href = '/auth/login';
    }
  }
  
  return next(action);
};