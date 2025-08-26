'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface UserStats {
  totalHands: number;
  totalGames: number;
  winRate: number;
  totalEarnings: number;
  currentStreak: number;
  bestStreak: number;
  vpip: number;
  pfr: number;
  af: number;
  threeBet: number;
  cbet: number;
  trainingHours: number;
}

interface RecentGame {
  id: number;
  type: string;
  result: string;
  earnings: number;
  date: string;
  status: 'win' | 'loss';
}

interface RecentAchievement {
  id: number;
  name: string;
  description: string;
  unlockedAt: string;
  icon: string;
}

interface LadderRank {
  currentRank: string;
  division: string;
  points: number;
  tier: string;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  isVip: boolean;
  dailyStreak: number;
  stats: UserStats;
  createdAt: string;
  lastLoginAt: string;
  recentGames: RecentGame[];
  recentAchievements: RecentAchievement[];
  ladderRank: LadderRank;
}

interface DailyTask {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  completed: boolean;
  xpReward: number;
}

interface LearningProgress {
  id: string;
  name: string;
  description: string;
  progress: number;
  isNew: boolean;
}

interface RecentGame {
  id: number;
  type: string;
  result: string;
  earnings: number;
  date: string;
  status: 'win' | 'loss' | 'draw';
}

interface RecentAchievement {
  id: number;
  name: string;
  description: string;
  unlockedAt: string;
  icon: string;
}

interface LadderRank {
  rank: number;
  name: string;
  points: number;
  tier: string;
}

export function useUserData() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to prevent unnecessary effect runs
  const hasFetchedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize static data to prevent re-creation on every render
  const staticGameData = useMemo(() => ({
    recentGames: [
      { id: 1, type: '现金桌', result: '胜利', earnings: 320, date: '今天 14:30', status: 'win' as const },
      { id: 2, type: 'AI训练', result: '胜利', earnings: 150, date: '今天 12:15', status: 'win' as const },
      { id: 3, type: '锦标赛', result: '失败', earnings: -100, date: '昨天 21:00', status: 'loss' as const },
      { id: 4, type: 'GTO训练', result: '胜利', earnings: 200, date: '昨天 18:30', status: 'win' as const },
      { id: 5, type: '现金桌', result: '胜利', earnings: 450, date: '昨天 15:00', status: 'win' as const }
    ],
    recentAchievements: [
      { id: 1, name: '连胜大师', description: '连续获胜15场', unlockedAt: '2小时前', icon: '🔥' },
      { id: 2, name: 'GTO专家', description: 'GTO训练达到90%准确率', unlockedAt: '1天前', icon: '🎯' },
      { id: 3, name: '心理战大师', description: '成功读牌100次', unlockedAt: '3天前', icon: '🧠' },
      { id: 4, name: '数据分析师', description: '分析50局游戏数据', unlockedAt: '5天前', icon: '📊' },
      { id: 5, name: '时间管理者', description: '每日训练连续7天', unlockedAt: '1周前', icon: '⏰' }
    ],
    ladderRank: {
      currentRank: '钻石段位',
      division: 'Diamond III',
      points: 2750,
      tier: 'Elite'
    },
    friendsLeaderboard: [
      { rank: 1, name: 'Daniel N.', xp: 5280, avatar: '🎯' },
      { rank: 2, name: 'Phil I.', xp: 4920, avatar: '🚀' },
      { rank: 4, name: 'Tom D.', xp: 3100, avatar: '🎲' }
    ]
  }), []); // Empty dependency array since this data is truly static

  // Memoize daily tasks to prevent recreation
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => [
    {
      id: 'training_games',
      name: '完成5局训练',
      description: '完成训练游戏',
      progress: 3,
      target: 5,
      completed: false,
      xpReward: 100
    },
    {
      id: 'gto_accuracy',
      name: 'GTO准确率80%',
      description: '在GTO训练中达到80%准确率',
      progress: 75,
      target: 80,
      completed: false,
      xpReward: 150
    }
  ]);

  // Memoize learning progress
  const learningProgress = useMemo(() => [
    {
      id: 'position_strategy',
      name: '位置策略',
      description: '第3章: BTN vs BB',
      progress: 85,
      isNew: false
    },
    {
      id: 'three_bet',
      name: '3-bet策略',
      description: '已解锁新章节',
      progress: 15,
      isNew: true
    }
  ], []);

  // Extract static data from memoized object
  const { recentGames, recentAchievements, ladderRank, friendsLeaderboard } = staticGameData;


  const loadUserData = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (hasFetchedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Try to load from localStorage first (faster)
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        const user = JSON.parse(cachedUser);
        setUserData({
          ...user,
          level: Math.floor(user.xp / 1000) + 1,
          dailyStreak: user.dailyStreak || 7,
          stats: user.stats || {
            totalHands: 0,
            totalGames: 0,
            winRate: 0,
            totalEarnings: 0,
            currentStreak: 0,
            bestStreak: 0,
            vpip: 0,
            pfr: 0,
            af: 0,
            threeBet: 0,
            cbet: 0,
            trainingHours: 0
          },
          recentGames: user.recentGames || staticGameData.recentGames,
          recentAchievements: user.recentAchievements || staticGameData.recentAchievements,
          ladderRank: user.ladderRank || staticGameData.ladderRank
        });
      }

      // Always try to fetch from API regardless of token
      let apiDataLoaded = false;
      try {
        const response = await fetch('/api/user/profile', {
          headers: {
            'Content-Type': 'application/json'
          },
          signal: abortControllerRef.current.signal
        });

        if (response.ok && !abortControllerRef.current.signal.aborted) {
          const data = await response.json();
          if (data.success && data.data) {
            setUserData({
              ...data.data,
              level: Math.floor(data.data.xp / 1000) + 1,
              dailyStreak: data.data.dailyStreak || 7,
              recentGames: data.data.recentGames || staticGameData.recentGames,
              recentAchievements: data.data.recentAchievements || staticGameData.recentAchievements,
              ladderRank: data.data.ladderRank || staticGameData.ladderRank
            });
            apiDataLoaded = true;
          }
        }
      } catch (apiError) {
        console.log('API调用失败，使用默认数据');
      }

      // 如果API失败或没有加载缓存数据，设置默认用户数据
      if (!apiDataLoaded && !cachedUser) {
        const defaultUserData = {
          id: 'default_user',
          username: 'Guest Player',
          email: 'guest@pokeriq.pro',
          level: 5,
          xp: 4500,
          isVip: false,
          dailyStreak: 7,
          stats: {
            totalHands: 1250,
            totalGames: 89,
            winRate: 68.5,
            totalEarnings: 3240,
            currentStreak: 12,
            bestStreak: 18,
            vpip: 22.4,
            pfr: 18.2,
            af: 2.8,
            threeBet: 8.5,
            cbet: 75.2,
            trainingHours: 24
          },
          createdAt: '2024-01-15T10:30:00Z',
          lastLoginAt: new Date().toISOString(),
          recentGames: staticGameData.recentGames,
          recentAchievements: staticGameData.recentAchievements,
          ladderRank: staticGameData.ladderRank
        };
        setUserData(defaultUserData);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Failed to load user data:', err);
        setError('Failed to load user data');
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
        hasFetchedRef.current = true;
      }
    }
  }, []); // Remove dependencies that could cause infinite loops

  const updateGameStats = useCallback((gameResult: {
    won: boolean;
    xpGained: number;
    handsPlayed?: number;
    duration?: number;
  }) => {
    if (!userData) return;

    // Use functional update to ensure we have latest state
    setUserData(prevUserData => {
      if (!prevUserData) return prevUserData;
      
      const newStats = { ...prevUserData.stats };
      newStats.totalGames += 1;
      newStats.totalHands += gameResult.handsPlayed || 1;
      
      if (gameResult.won) {
        newStats.currentStreak += 1;
        newStats.bestStreak = Math.max(newStats.bestStreak, newStats.currentStreak);
      } else {
        newStats.currentStreak = 0;
      }

      newStats.winRate = (newStats.winRate * (newStats.totalGames - 1) + (gameResult.won ? 100 : 0)) / newStats.totalGames;

      const updatedUserData = {
        ...prevUserData,
        xp: prevUserData.xp + gameResult.xpGained,
        level: Math.floor((prevUserData.xp + gameResult.xpGained) / 1000) + 1,
        stats: newStats
      };

      // Batch localStorage update
      requestIdleCallback(() => {
        localStorage.setItem('user', JSON.stringify(updatedUserData));
      });

      return updatedUserData;
    });

    // Update daily tasks with functional update
    setDailyTasks(prev => prev.map(task => {
      if (task.id === 'training_games' && !task.completed) {
        const newProgress = task.progress + 1;
        return {
          ...task,
          progress: newProgress,
          completed: newProgress >= task.target
        };
      }
      return task;
    }));
  }, [userData?.id]); // Only depend on user ID to minimize re-creation

  const completeTask = useCallback((taskId: string) => {
    if (!userData) return;

    const task = dailyTasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    // Use functional update for better performance
    setUserData(prevUserData => {
      if (!prevUserData) return prevUserData;

      const updatedUserData = {
        ...prevUserData,
        xp: prevUserData.xp + task.xpReward,
        level: Math.floor((prevUserData.xp + task.xpReward) / 1000) + 1
      };

      // Batch localStorage update
      requestIdleCallback(() => {
        localStorage.setItem('user', JSON.stringify(updatedUserData));
      });

      return updatedUserData;
    });

    // Mark task as completed
    setDailyTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: true, progress: t.target } : t
    ));
  }, [userData?.id, dailyTasks]); // Stable dependencies

  useEffect(() => {
    loadUserData();

    // Cleanup function to cancel ongoing requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Memoize return object to prevent unnecessary re-renders in consuming components
  return useMemo(() => ({
    userData,
    loading,
    error,
    dailyTasks,
    learningProgress,
    friendsLeaderboard,
    recentGames,
    recentAchievements,
    ladderRank,
    updateGameStats,
    completeTask,
    reload: loadUserData
  }), [
    userData,
    loading,
    error,
    dailyTasks,
    learningProgress,
    friendsLeaderboard,
    recentGames,
    recentAchievements,
    ladderRank,
    updateGameStats,
    completeTask,
    loadUserData
  ]);
}