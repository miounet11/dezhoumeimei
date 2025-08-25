import { Suspense } from 'react';

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="relative">
        {/* 扑克牌加载动画 */}
        <div className="flex space-x-2">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className="w-16 h-24 bg-gradient-to-b from-white to-gray-100 rounded-lg shadow-lg animate-pulse"
              style={{
                animationDelay: `${index * 0.2}s`,
                animationDuration: '1.5s',
              }}
            >
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg opacity-80 flex items-center justify-center">
                <div className="text-white text-xs font-bold">♠</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* 加载文本 */}
        <div className="mt-6 text-center">
          <div className="text-white text-lg font-semibold animate-pulse">
            PokerIQ Pro 正在加载...
          </div>
          <div className="text-gray-400 text-sm mt-2">
            准备你的最佳策略
          </div>
        </div>
        
        {/* 旋转指示器 */}
        <div className="absolute -top-4 -right-4">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  );
}