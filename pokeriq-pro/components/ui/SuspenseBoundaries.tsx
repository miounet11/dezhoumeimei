import { Suspense } from 'react';

// 通用的 Suspense 加载组件
interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function SuspenseWrapper({ 
  children, 
  fallback, 
  className = '' 
}: SuspenseWrapperProps) {
  return (
    <Suspense 
      fallback={
        fallback || (
          <div className={`animate-pulse ${className}`}>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        )
      }
    >
      {children}
    </Suspense>
  );
}

// 游戏数据加载 Suspense
export function GameDataSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="relative">
            {/* 扑克桌面加载动画 */}
            <div className="w-80 h-48 bg-gradient-to-br from-green-700 to-green-800 rounded-3xl shadow-2xl relative">
              <div className="absolute inset-4 border-4 border-green-600 rounded-2xl opacity-50"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-16 h-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-gray-600">加载游戏数据...</p>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// 统计数据加载 Suspense
export function StatsDataSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// 排行榜数据加载 Suspense
export function LeaderboardSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-1/3"></div>
          </div>
          <div className="divide-y">
            {Array.from({ length: 10 }, (_, index) => (
              <div key={index} className="p-4 flex items-center space-x-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-1/4 mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/6"></div>
                </div>
                <div className="h-4 bg-gray-300 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// 图表数据加载 Suspense
export function ChartDataSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// 陪伴系统数据加载 Suspense
export function CompanionDataSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-300 rounded w-full"></div>
                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// 训练数据加载 Suspense
export function TrainingDataSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          {/* 训练选项卡骨架 */}
          <div className="flex space-x-4 animate-pulse">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-10 bg-gray-300 rounded w-24"></div>
            ))}
          </div>
          
          {/* 训练内容骨架 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                    <div className="h-8 bg-gray-300 rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// 用户资料加载 Suspense
export function ProfileDataSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 用户信息头部骨架 */}
          <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-1"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          </div>
          
          {/* 统计卡片骨架 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

// 组合多个Suspense边界的高阶组件
interface MultipleSuspenseProps {
  children: React.ReactNode[];
  fallbacks?: React.ReactNode[];
  className?: string;
}

export function MultipleSuspense({ 
  children, 
  fallbacks = [], 
  className = '' 
}: MultipleSuspenseProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <SuspenseWrapper 
          key={index} 
          fallback={fallbacks[index]} 
          className="mb-6"
        >
          {child}
        </SuspenseWrapper>
      ))}
    </div>
  );
}