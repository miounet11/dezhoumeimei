'use client';

import { useState, useEffect } from 'react';

interface UserData {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string | null;
  level: number;
  xp: number;
  isVip: boolean;
  vipExpiry: string | null;
  stats: {
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
  } | null;
  ladderRank: {
    currentRank: string;
    rankPoints: number;
    totalTests: number;
    avgScore: number;
    peakRank: string;
    peakPoints: number;
    globalPercentile: number;
    rankPercentile: number;
  } | null;
  companions: Array<{
    name: string;
    avatar: string;
    relationshipLevel: number;
    intimacyPoints: number;
    totalInteractions: number;
  }>;
  recentAchievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: string;
    unlockedAt: string;
    progress: number;
  }>;
  recentGames: Array<{
    id: string;
    gameType: string;
    buyIn: number;
    finalStack: number;
    handsPlayed: number;
    result: string;
    createdAt: string;
    endedAt: string;
  }>;
}

export function useUserData() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 首先检查是否有token
        const token = localStorage.getItem('token');
        if (!token) {
          // 如果没有token，尝试从localStorage获取基础用户信息
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const basicUser = JSON.parse(userStr);
              // 创建默认结构，避免硬编码数据
              setUserData({
                ...basicUser,
                stats: basicUser.stats || {
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
                ladderRank: null,
                companions: [],
                recentAchievements: [],
                recentGames: []
              });
            } catch (parseError) {
              console.error('Failed to parse user data:', parseError);
              setError('Failed to parse user data');
            }
          }
          setLoading(false);
          return;
        }

        // 调用profile API获取完整数据
        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUserData(data.data);
          } else {
            setError(data.error || 'Failed to fetch user data');
            
            // 回退到localStorage数据
            const userStr = localStorage.getItem('user');
            if (userStr) {
              try {
                const basicUser = JSON.parse(userStr);
                setUserData({
                  ...basicUser,
                  stats: basicUser.stats || {
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
                  ladderRank: null,
                  companions: [],
                  recentAchievements: [],
                  recentGames: []
                });
              } catch (parseError) {
                console.error('Failed to parse user data:', parseError);
              }
            }
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (fetchError) {
        console.error('Error fetching user data:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Unknown error');
        
        // 回退到localStorage数据
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const basicUser = JSON.parse(userStr);
            setUserData({
              ...basicUser,
              stats: basicUser.stats || {
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
              ladderRank: null,
              companions: [],
              recentAchievements: [],
              recentGames: []
            });
          } catch (parseError) {
            console.error('Failed to parse user data:', parseError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return { userData, loading, error, refetch: () => window.location.reload() };
}