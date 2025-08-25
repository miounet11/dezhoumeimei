import { Suspense } from 'react';

function AnalyticsLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 统计卡片骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
          </div>
        ))}
      </div>
      
      {/* 图表骨架 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题骨架 */}
        <div className="mb-8">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse"></div>
        </div>
        
        {/* 主要内容骨架 */}
        <AnalyticsLoadingSkeleton />
        
        {/* 加载提示 */}
        <div className="flex items-center justify-center mt-12">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600 font-medium">正在加载分析数据...</span>
          </div>
        </div>
      </div>
    </div>
  );
}