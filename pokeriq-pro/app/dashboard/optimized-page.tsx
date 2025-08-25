import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getUserStats, getLeaderboard, safeDataFetch } from '@/lib/data/optimized-fetching';
import { generateBaseMetadata } from '@/lib/seo/metadata';
import { 
  StatsDataSuspense,
  LeaderboardSuspense,
  ChartDataSuspense,
  SuspenseWrapper 
} from '@/components/ui/SuspenseBoundaries';
import StatsCards from '@/components/dashboard/StatsCards';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import RecentGames from '@/components/dashboard/RecentGames';
import QuickActions from '@/components/dashboard/QuickActions';

// 生成页面元数据
export const metadata: Metadata = {
  ...generateBaseMetadata(
    '控制台', 
    '查看你的扑克统计数据、最近游戏和性能分析。开始新游戏或继续训练。',
    '/dashboard'
  ),
  keywords: ['扑克控制台', '游戏统计', '性能分析', '扑克数据'],
};

// 主要的控制台组件 - Server Component
export default async function OptimizedDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">控制台</h1>
          <p className="text-gray-600 mt-2">
            欢迎回来！查看你的游戏表现和开始新的训练。
          </p>
        </div>

        {/* 快速操作按钮 - 不需要数据获取，立即渲染 */}
        <div className="mb-8">
          <QuickActions />
        </div>

        {/* 统计卡片 - 使用Suspense流式渲染 */}
        <div className="mb-8">
          <StatsDataSuspense>
            <StatsCardsServer />
          </StatsDataSuspense>
        </div>

        {/* 主要内容网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 性能图表 */}
          <div>
            <ChartDataSuspense>
              <PerformanceChartServer />
            </ChartDataSuspense>
          </div>

          {/* 排行榜 */}
          <div>
            <LeaderboardSuspense>
              <LeaderboardServer />
            </LeaderboardSuspense>
          </div>
        </div>

        {/* 最近游戏 */}
        <div className="mt-8">
          <SuspenseWrapper
            fallback={
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
            }
          >
            <RecentGamesServer />
          </SuspenseWrapper>
        </div>
      </div>
    </div>
  );
}

// 服务器组件 - 获取统计数据
async function StatsCardsServer() {
  // 安全地获取用户统计数据
  const userStats = await safeDataFetch(
    () => getUserStats('current-user-id'),
    {
      handsPlayed: 0,
      winRate: 0,
      totalWinnings: 0,
      averagePot: 0,
      vpipPercentage: 0,
      pfr: 0,
      aggression: 0,
      level: 1,
      experience: 0,
    }
  );

  return <StatsCards stats={userStats} />;
}

// 服务器组件 - 获取性能图表数据
async function PerformanceChartServer() {
  const performanceData = await safeDataFetch(
    async () => {
      // 模拟获取性能数据
      const response = await fetch(`${process.env.API_BASE_URL}/api/user/performance`, {
        next: { revalidate: 300 }, // 5分钟缓存
      });
      if (!response.ok) throw new Error('Failed to fetch performance data');
      return response.json();
    },
    []
  );

  return <PerformanceChart data={performanceData} />;
}

// 服务器组件 - 获取排行榜数据
async function LeaderboardServer() {
  const leaderboardData = await safeDataFetch(
    () => getLeaderboard('weekly'),
    []
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">本周排行榜</h3>
      <div className="space-y-3">
        {leaderboardData?.slice(0, 10).map((player: any, index: number) => (
          <div 
            key={player.id} 
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
          >
            <div className="flex items-center space-x-3">
              <span className={`
                w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold
                ${index < 3 ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-600'}
              `}>
                {index + 1}
              </span>
              <span className="font-medium">{player.name}</span>
            </div>
            <span className="text-green-600 font-semibold">
              ${player.totalWinnings.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 服务器组件 - 获取最近游戏数据
async function RecentGamesServer() {
  const recentGames = await safeDataFetch(
    async () => {
      const response = await fetch(`${process.env.API_BASE_URL}/api/user/recent-games`, {
        next: { revalidate: 60 }, // 1分钟缓存
      });
      if (!response.ok) throw new Error('Failed to fetch recent games');
      return response.json();
    },
    []
  );

  return <RecentGames games={recentGames} />;
}