'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  Calendar, 
  Filter,
  ChevronUp,
  ChevronDown,
  User,
  Award,
  Target,
  BookOpen,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';

interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
  metadata?: any;
  category: string;
  period: string;
}

interface LeaderboardProps {
  userId: string;
  defaultCategory?: string;
  defaultPeriod?: string;
  maxEntries?: number;
  showUserRank?: boolean;
  className?: string;
}

const categoryConfig = {
  winRate: { 
    label: 'Win Rate', 
    icon: TrendingUp, 
    suffix: '%', 
    description: 'Success rate in games',
    color: 'text-green-600'
  },
  profit: { 
    label: 'Total Earnings', 
    icon: Trophy, 
    prefix: '$', 
    description: 'Total money earned',
    color: 'text-yellow-600'
  },
  hands: { 
    label: 'Hands Played', 
    icon: Target, 
    suffix: ' hands', 
    description: 'Total hands played',
    color: 'text-blue-600'
  },
  achievements: { 
    label: 'Achievement Points', 
    icon: Award, 
    suffix: ' pts', 
    description: 'Points from achievements',
    color: 'text-purple-600'
  },
  trainingHours: { 
    label: 'Training Time', 
    icon: Clock, 
    suffix: ' hrs', 
    description: 'Hours spent training',
    color: 'text-indigo-600'
  },
  courseCompletion: { 
    label: 'Courses Completed', 
    icon: BookOpen, 
    suffix: ' courses', 
    description: 'Number of courses completed',
    color: 'text-teal-600'
  }
};

const periodConfig = {
  'daily': { label: 'Today', duration: 'day' },
  'weekly': { label: 'This Week', duration: 'week' },
  'monthly': { label: 'This Month', duration: 'month' },
  'all-time': { label: 'All Time', duration: 'lifetime' }
};

const rankIcons = {
  1: Crown,
  2: Medal,
  3: Medal
};

const rankColors = {
  1: 'text-yellow-500',
  2: 'text-gray-400',
  3: 'text-amber-600'
};

export default function Leaderboard({ 
  userId,
  defaultCategory = 'winRate',
  defaultPeriod = 'all-time',
  maxEntries = 50,
  showUserRank = true,
  className = ''
}: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<{
    entries: LeaderboardEntry[];
    userRank?: number;
  }>({ entries: [] });
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedCategory, selectedPeriod]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        category: selectedCategory,
        period: selectedPeriod,
        limit: maxEntries.toString(),
        includeUser: showUserRank.toString()
      });

      const response = await fetch(`/api/dashboard/social/leaderboard?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setLeaderboardData(data.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score: number, category: string): string => {
    const config = categoryConfig[category as keyof typeof categoryConfig];
    if (!config) return score.toString();

    const formattedScore = category === 'winRate' 
      ? score.toFixed(1) 
      : score.toLocaleString();

    return `${config.prefix || ''}${formattedScore}${config.suffix || ''}`;
  };

  const getRankDisplay = (rank: number) => {
    if (rank <= 3) {
      const RankIcon = rankIcons[rank as keyof typeof rankIcons];
      const color = rankColors[rank as keyof typeof rankColors];
      return (
        <div className="flex items-center justify-center w-8 h-8">
          <RankIcon className={`w-6 h-6 ${color}`} />
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-semibold text-gray-600">
        {rank}
      </div>
    );
  };

  const getUserRankDisplay = () => {
    if (!showUserRank || !leaderboardData.userRank) return null;

    const isInTopList = leaderboardData.entries.some(entry => entry.userId === userId);
    if (isInTopList) return null;

    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-sm font-semibold text-blue-600">
              {leaderboardData.userRank}
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900">Your Rank</span>
            </div>
          </div>
          <div className="text-sm text-blue-600 font-medium">
            Rank #{leaderboardData.userRank}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load leaderboard</p>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
        <button 
          onClick={fetchLeaderboard}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const currentCategory = categoryConfig[selectedCategory as keyof typeof categoryConfig];
  const currentPeriod = periodConfig[selectedPeriod as keyof typeof periodConfig];

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${
            selectedCategory === 'winRate' ? 'from-green-500 to-emerald-500' :
            selectedCategory === 'profit' ? 'from-yellow-500 to-amber-500' :
            selectedCategory === 'achievements' ? 'from-purple-500 to-violet-500' :
            'from-blue-500 to-indigo-500'
          }`}>
            {currentCategory && <currentCategory.icon className="w-6 h-6 text-white" />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {currentCategory?.label} Leaderboard
            </h3>
            <p className="text-sm text-gray-500">
              {currentCategory?.description} • {currentPeriod?.label}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPrivacySettings(!showPrivacySettings)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Privacy Settings"
          >
            {isPublic ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
          <button
            onClick={fetchLeaderboard}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category and Period Selectors */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(categoryConfig).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(periodConfig).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Privacy Settings */}
      {showPrivacySettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Leaderboard Visibility</h4>
              <p className="text-sm text-gray-600">
                Control whether your scores appear on public leaderboards
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="publicVisibility"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="publicVisibility" className="text-sm font-medium text-gray-700">
                Show on leaderboards
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard Entries */}
      <div className="space-y-2">
        {leaderboardData.entries.map((entry, index) => {
          const isCurrentUser = entry.userId === userId;
          const isExpanded = expandedEntry === entry.userId;
          
          return (
            <motion.div
              key={`${entry.userId}-${entry.period}-${entry.category}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                isCurrentUser 
                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }`}
            >
              <div 
                className="flex items-center space-x-4 cursor-pointer"
                onClick={() => setExpandedEntry(isExpanded ? null : entry.userId)}
              >
                {/* Rank */}
                <div className="flex-shrink-0">
                  {getRankDisplay(entry.rank)}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    {entry.avatar ? (
                      <img
                        src={entry.avatar}
                        alt={entry.username}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className={`font-medium truncate ${
                        isCurrentUser ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {entry.username}
                        {isCurrentUser && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Rank #{entry.rank}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="flex-shrink-0 text-right">
                  <div className={`text-lg font-bold ${currentCategory?.color || 'text-gray-900'}`}>
                    {formatScore(entry.score, selectedCategory)}
                  </div>
                  {entry.rank <= 3 && (
                    <div className="flex items-center justify-end mt-1">
                      <Zap className="w-3 h-3 text-yellow-500 mr-1" />
                      <span className="text-xs text-yellow-600 font-medium">Top 3</span>
                    </div>
                  )}
                </div>

                {/* Expand Icon */}
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && entry.metadata && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(entry.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="font-medium text-gray-900">
                          {typeof value === 'number' ? value.toLocaleString() : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* User Rank Display */}
      {getUserRankDisplay()}

      {/* Empty State */}
      {leaderboardData.entries.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No data available for this period</p>
          <p className="text-sm text-gray-500 mt-2">
            Try playing some games or completing achievements to appear on the leaderboard
          </p>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-center text-xs text-gray-500 mt-6">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}