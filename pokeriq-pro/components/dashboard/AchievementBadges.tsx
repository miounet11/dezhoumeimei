'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Award, 
  Trophy, 
  Star, 
  Medal, 
  Crown, 
  Target,
  Lock,
  Unlock,
  Sparkles,
  Filter,
  Search,
  ChevronRight,
  Calendar,
  TrendingUp,
  Zap
} from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  icon: string;
  progress: number;
  completed: boolean;
  unlockedAt?: string;
  requirement: any;
  reward?: any;
  points?: number;
}

interface AchievementBadgesProps {
  userId: string;
  showAll?: boolean;
  maxDisplay?: number;
  className?: string;
}

const rarityColors = {
  COMMON: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
  RARE: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  EPIC: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  LEGENDARY: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  MYTHIC: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
};

const categoryIcons = {
  TRAINING: Target,
  STATS: TrendingUp,
  SPECIAL: Star,
  MILESTONE: Trophy,
  SOCIAL: Award,
  COLLECTION: Medal,
};

export default function AchievementBadges({ 
  userId, 
  showAll = false, 
  maxDisplay = 6, 
  className = '' 
}: AchievementBadgesProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filteredAchievements, setFilteredAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredAchievement, setHoveredAchievement] = useState<string | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, [userId]);

  useEffect(() => {
    filterAchievements();
  }, [achievements, selectedCategory, selectedRarity, showCompleted, searchTerm]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/achievements/${userId}?includeCompleted=true`);

      if (!response.ok) {
        throw new Error(`Failed to fetch achievements: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setAchievements(data.data.achievements);
      } else {
        throw new Error(data.error || 'Failed to fetch achievements');
      }
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError(err instanceof Error ? err.message : 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const filterAchievements = () => {
    let filtered = [...achievements];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    // Filter by rarity
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(a => a.rarity === selectedRarity);
    }

    // Filter by completion status
    if (!showCompleted) {
      filtered = filtered.filter(a => !a.completed);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(term) || 
        a.description.toLowerCase().includes(term)
      );
    }

    // Sort by completion status, rarity, and progress
    filtered.sort((a, b) => {
      // Completed achievements first
      if (a.completed !== b.completed) {
        return a.completed ? -1 : 1;
      }
      
      // Then by rarity (higher rarity first)
      const rarityOrder = ['MYTHIC', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON'];
      const rarityDiff = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
      if (rarityDiff !== 0) return rarityDiff;
      
      // Then by progress (higher progress first for uncompleted)
      return b.progress - a.progress;
    });

    // Limit display if not showing all
    if (!showAll && maxDisplay) {
      filtered = filtered.slice(0, maxDisplay);
    }

    setFilteredAchievements(filtered);
  };

  const getAchievementIcon = (achievement: Achievement) => {
    const CategoryIcon = categoryIcons[achievement.category as keyof typeof categoryIcons] || Award;
    return CategoryIcon;
  };

  const getRarityDisplay = (rarity: string) => {
    const colors = rarityColors[rarity as keyof typeof rarityColors] || rarityColors.COMMON;
    return colors;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load achievements</p>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
        <button 
          onClick={fetchAchievements}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const categories = Array.from(new Set(achievements.map(a => a.category)));
  const rarities = Array.from(new Set(achievements.map(a => a.rarity)));
  
  const completedCount = achievements.filter(a => a.completed).length;
  const totalPoints = achievements
    .filter(a => a.completed)
    .reduce((sum, a) => sum + (a.points || 0), 0);

  return (
    <div className={className}>
      {/* Stats Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span className="text-lg font-semibold text-gray-900">
              {completedCount} of {achievements.length} Unlocked
            </span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              {totalPoints} Points
            </span>
          </div>
        </div>
        
        {showAll && (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search achievements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Filter className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* Filters */}
      {showAll && (
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0) + category.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Rarity:</label>
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Rarities</option>
              {rarities.map(rarity => (
                <option key={rarity} value={rarity}>
                  {rarity.charAt(0) + rarity.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showCompleted"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showCompleted" className="text-sm font-medium text-gray-700">
              Show completed
            </label>
          </div>
        </div>
      )}

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement, index) => {
          const IconComponent = getAchievementIcon(achievement);
          const rarityColors = getRarityDisplay(achievement.rarity);
          const isHovered = hoveredAchievement === achievement.id;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onHoverStart={() => setHoveredAchievement(achievement.id)}
              onHoverEnd={() => setHoveredAchievement(null)}
              className={`relative p-4 rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                achievement.completed
                  ? `${rarityColors.bg} ${rarityColors.border} shadow-md`
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              } ${isHovered ? 'transform scale-105 shadow-lg' : ''}`}
            >
              {/* Rarity Badge */}
              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                achievement.completed ? rarityColors.bg : 'bg-gray-200'
              } ${achievement.completed ? rarityColors.text : 'text-gray-600'}`}>
                {achievement.rarity.charAt(0) + achievement.rarity.slice(1).toLowerCase()}
              </div>

              {/* Achievement Icon */}
              <div className={`flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
                achievement.completed 
                  ? rarityColors.bg 
                  : 'bg-gray-200'
              }`}>
                {achievement.completed ? (
                  <IconComponent className={`w-6 h-6 ${rarityColors.text}`} />
                ) : (
                  <Lock className="w-6 h-6 text-gray-500" />
                )}
                
                {achievement.completed && (
                  <div className="absolute -top-1 -right-1">
                    <Zap className="w-4 h-4 text-yellow-500" />
                  </div>
                )}
              </div>

              {/* Achievement Info */}
              <div className="mb-3">
                <h3 className={`font-semibold text-sm mb-1 ${
                  achievement.completed ? 'text-gray-900' : 'text-gray-600'
                }`}>
                  {achievement.name}
                </h3>
                <p className={`text-xs ${
                  achievement.completed ? 'text-gray-600' : 'text-gray-500'
                }`}>
                  {achievement.description}
                </p>
              </div>

              {/* Progress Bar */}
              {!achievement.completed && (
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-600">Progress</span>
                    <span className="text-xs font-medium text-gray-800">
                      {Math.round(achievement.progress * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(achievement.progress * 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Achievement Details */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  {achievement.points && (
                    <span className="flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>{achievement.points} pts</span>
                    </span>
                  )}
                  {achievement.completed && achievement.unlockedAt && (
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(achievement.unlockedAt)}</span>
                    </span>
                  )}
                </div>
                
                {achievement.completed && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Unlock className="w-3 h-3" />
                    <span className="text-xs font-medium">Unlocked</span>
                  </div>
                )}
              </div>

              {/* Hover Tooltip */}
              {isHovered && achievement.reward && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg min-w-48"
                >
                  <div className="text-center">
                    <div className="font-medium mb-1">Rewards:</div>
                    {achievement.reward.coins && (
                      <div>💰 {achievement.reward.coins} coins</div>
                    )}
                    {achievement.reward.xp && (
                      <div>⚡ {achievement.reward.xp} XP</div>
                    )}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-8">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No achievements match your current filters</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Show More Button */}
      {!showAll && achievements.length > maxDisplay && (
        <div className="text-center mt-6">
          <button 
            onClick={() => window.location.href = '/achievements'}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            View All Achievements
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
}