import { cache } from 'react'
import { connection } from 'next/server'

// Next.js 15 的 cache 函数用于缓存数据获取
export const getGameData = cache(async (gameId: string) => {
  // 模拟获取游戏数据
  const response = await fetch(`${process.env.API_BASE_URL}/api/game/${gameId}`, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch game data');
  }
  
  return response.json();
});

// 缓存用户统计数据
export const getUserStats = cache(async (userId: string) => {
  const response = await fetch(`${process.env.API_BASE_URL}/api/user/${userId}/stats`, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user stats');
  }
  
  return response.json();
});

// 缓存排行榜数据
export const getLeaderboard = cache(async (type: 'weekly' | 'monthly' | 'alltime' = 'weekly') => {
  const response = await fetch(`${process.env.API_BASE_URL}/api/leaderboard/${type}`, {
    headers: {
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }
  
  return response.json();
});

// 使用 connection() 进行动态渲染控制
export async function getDynamicGameState(gameId: string) {
  // 对于实时游戏状态，我们需要动态渲染
  await connection();
  
  const response = await fetch(`${process.env.API_BASE_URL}/api/game/${gameId}/state`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch game state');
  }
  
  return response.json();
}

// 用于AI训练数据的缓存函数
export const getTrainingData = cache(async (userId: string, sessionType: string) => {
  const response = await fetch(`${process.env.API_BASE_URL}/api/training/${userId}/${sessionType}`, {
    headers: {
      'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=360',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch training data');
  }
  
  return response.json();
});

// 缓存陪伴系统数据
export const getCompanionData = cache(async (userId: string) => {
  const response = await fetch(`${process.env.API_BASE_URL}/api/companions/${userId}`, {
    headers: {
      'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch companion data');
  }
  
  return response.json();
});

// 类型安全的数据获取封装
export interface GameState {
  gameId: string;
  players: Player[];
  communityCards: string[];
  pot: number;
  currentBet: number;
  street: 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN';
  actionOn: number;
  dealerButton: number;
}

export interface Player {
  id: string;
  name: string;
  stack: number;
  position: number;
  status: 'active' | 'folded' | 'allin';
  cards?: string[];
}

export interface UserStats {
  handsPlayed: number;
  winRate: number;
  totalWinnings: number;
  averagePot: number;
  vpipPercentage: number;
  pfr: number;
  aggression: number;
  level: number;
  experience: number;
}

// 带错误处理的数据获取工具
export async function safeDataFetch<T>(
  fetchFn: () => Promise<T>,
  fallback?: T
): Promise<T | null> {
  try {
    return await fetchFn();
  } catch (error) {
    console.error('Data fetch error:', error);
    return fallback || null;
  }
}