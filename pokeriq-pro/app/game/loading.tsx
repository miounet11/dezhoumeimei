import React from 'react';

export default function GameLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center">
      <div className="relative">
        {/* 扑克桌面 */}
        <div className="w-96 h-64 bg-gradient-to-br from-green-700 to-green-800 rounded-3xl shadow-2xl relative">
          {/* 桌面边框 */}
          <div className="absolute inset-4 border-4 border-green-600 rounded-2xl"></div>
          
          {/* 中央loading区域 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {/* 旋转的扑克牌 */}
            <div className="relative w-20 h-28">
              <div className="absolute inset-0 bg-white rounded-lg shadow-lg animate-spin">
                <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                  A
                </div>
              </div>
            </div>
          </div>
          
          {/* 装饰性扑克牌位置 */}
          <div className="absolute top-4 left-8 w-8 h-12 bg-white/20 rounded animate-pulse"></div>
          <div className="absolute top-4 right-8 w-8 h-12 bg-white/20 rounded animate-pulse delay-200"></div>
          <div className="absolute bottom-4 left-8 w-8 h-12 bg-white/20 rounded animate-pulse delay-400"></div>
          <div className="absolute bottom-4 right-8 w-8 h-12 bg-white/20 rounded animate-pulse delay-600"></div>
        </div>
        
        {/* 加载信息 */}
        <div className="mt-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            正在加载游戏桌...
          </h3>
          <p className="text-green-300">
            准备你的最佳策略
          </p>
          
          {/* 进度点 */}
          <div className="flex justify-center mt-4 space-x-2">
            {[0, 1, 2, 3].map((index) => (
              <div
                key={index}
                className="w-3 h-3 bg-green-400 rounded-full animate-pulse"
                style={{
                  animationDelay: `${index * 0.2}s`,
                  animationDuration: '1.5s',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}