'use client';

import { useEffect } from 'react';
import { Button, Result } from 'antd';
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 记录到监控系统
    console.error('App Error:', error);
    
    // 可以集成到Sentry或其他监控服务
    if (typeof window !== 'undefined') {
      // 只在客户端发送错误报告
      // Sentry.captureException(error);
    }
  }, [error]);
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-6">
        <Result
          status="error"
          title={
            <div className="text-white text-2xl font-bold">
              游戏遇到了问题
            </div>
          }
          subTitle={
            <div className="text-gray-400 mb-6">
              {process.env.NODE_ENV === 'development' ? (
                <details className="mt-4 p-4 bg-red-900/20 rounded-lg">
                  <summary className="text-red-400 cursor-pointer">
                    错误详情 (开发模式)
                  </summary>
                  <div className="mt-2 text-sm text-red-300 font-mono">
                    {error.message}
                  </div>
                  {error.digest && (
                    <div className="mt-1 text-xs text-red-400">
                      错误ID: {error.digest}
                    </div>
                  )}
                </details>
              ) : (
                '我们正在解决这个问题，请稍后重试'
              )}
            </div>
          }
          extra={[
            <Button 
              key="retry" 
              type="primary" 
              onClick={() => reset()}
              size="large"
              className="bg-blue-600 hover:bg-blue-700"
            >
              重试游戏
            </Button>,
            <Button 
              key="home" 
              onClick={() => window.location.href = '/'}
              size="large"
              className="ml-4"
            >
              返回主页
            </Button>,
          ]}
        />
        
        {/* 扑克装饰 */}
        <div className="flex justify-center mt-8 space-x-2 opacity-20">
          {['♠', '♥', '♦', '♣'].map((suit, index) => (
            <div 
              key={suit}
              className="text-4xl text-white animate-pulse"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {suit}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}