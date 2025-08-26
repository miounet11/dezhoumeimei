'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/src/components/layout/AppLayout';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import SocialFeatures from '@/components/dashboard/SocialFeatures';
import AchievementBadges from '@/components/dashboard/AchievementBadges';
import Leaderboard from '@/components/dashboard/Leaderboard';
import { 
  Trophy,
  Award,
  Star,
  Crown,
  Medal,
  Target,
  Users,
  Share2,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  Zap,
  Lock,
  Unlock,
  Gift,
  CheckCircle,
  Clock,
  Flame
} from 'lucide-react';
import { useUserData } from '@/lib/hooks/useUserData';
import { createLogger } from '@/lib/logger';
import { motion, AnimatePresence } from 'framer-motion';

const logger = createLogger('achievements-page');

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'skill' | 'milestone' | 'social' | 'special';
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  rarity: number; // percentage of users who have this achievement
  reward?: {
    type: 'xp' | 'badge' | 'unlock' | 'title';
    value: string | number;
  };
  prerequisites?: string[];
  nextTier?: string;
}

interface AchievementFilters {
  category: 'all' | 'skill' | 'milestone' | 'social' | 'special';
  status: 'all' | 'unlocked' | 'locked' | 'progress';
  difficulty: 'all' | 'bronze' | 'silver' | 'gold' | 'platinum';
  sortBy: 'recent' | 'difficulty' | 'progress' | 'rarity';
}

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-48"></div>
      ))}
    </div>
  </div>
);

const AchievementCard = ({ 
  achievement, 
  onClick 
}: { 
  achievement: Achievement; 
  onClick: (achievement: Achievement) => void;
}) => {
  const difficultyColors = {
    bronze: 'from-orange-600 to-yellow-600',
    silver: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-purple-500 to-indigo-600'
  };

  const categoryIcons = {
    skill: Target,
    milestone: Star,
    social: Users,
    special: Crown
  };

  const CategoryIcon = categoryIcons[achievement.category];
  const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all duration-300
        ${achievement.unlocked 
          ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 shadow-lg' 
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
        }
      `}
      onClick={() => onClick(achievement)}
    >
      {/* Rarity Badge */}
      {achievement.rarity <= 10 && (
        <div className="absolute top-2 right-2 z-10">
          <div className="px-2 py-1 bg-purple-600 text-white rounded-full text-xs font-medium">
            Rare {achievement.rarity}%
          </div>
        </div>
      )}

      {/* Lock Overlay for locked achievements */}
      {!achievement.unlocked && achievement.progress === 0 && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10">
          <Lock className="w-8 h-8 text-gray-300" />
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`
            p-3 rounded-xl bg-gradient-to-r ${difficultyColors[achievement.difficulty]} text-white
            ${!achievement.unlocked && 'opacity-50'}
          `}>
            <span className="text-2xl">{achievement.icon}</span>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-1 text-yellow-600">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">{achievement.points} pts</span>
            </div>
            <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 mt-1">
              <CategoryIcon className="w-3 h-3" />
              <span className="text-xs capitalize">{achievement.category}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className={`
            font-bold text-lg mb-2
            ${achievement.unlocked 
              ? 'text-gray-900 dark:text-white' 
              : 'text-gray-600 dark:text-gray-400'
            }
          `}>
            {achievement.name}
          </h3>
          <p className={`
            text-sm
            ${achievement.unlocked 
              ? 'text-gray-700 dark:text-gray-300' 
              : 'text-gray-500 dark:text-gray-500'
            }
          `}>
            {achievement.description}
          </p>
        </div>

        {/* Progress */}
        {!achievement.unlocked && achievement.progress > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {achievement.progress}/{achievement.maxProgress}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {Math.round(progressPercentage)}% complete
            </div>
          </div>
        )}

        {/* Unlocked Status */}
        {achievement.unlocked && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Unlocked</span>
            </div>
            {achievement.unlockedAt && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(achievement.unlockedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {/* Reward */}
        {achievement.reward && achievement.unlocked && (
          <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
              <Gift className="w-4 h-4" />
              <span className="text-sm">
                Reward: {achievement.reward.type === 'xp' && `+${achievement.reward.value} XP`}
                {achievement.reward.type === 'badge' && `${achievement.reward.value} badge`}
                {achievement.reward.type === 'unlock' && `Unlocked ${achievement.reward.value}`}
                {achievement.reward.type === 'title' && `Title: ${achievement.reward.value}`}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const FilterPanel = ({ 
  filters, 
  onFiltersChange,
  searchQuery,
  onSearchChange 
}: { 
  filters: AchievementFilters; 
  onFiltersChange: (filters: AchievementFilters) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) => onFiltersChange({ ...filters, category: e.target.value as any })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="skill">Skills</option>
          <option value="milestone">Milestones</option>
          <option value="social">Social</option>
          <option value="special">Special</option>
        </select>

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as any })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="unlocked">Unlocked</option>
          <option value="locked">Locked</option>
          <option value="progress">In Progress</option>
        </select>

        {/* Difficulty */}
        <select
          value={filters.difficulty}
          onChange={(e) => onFiltersChange({ ...filters, difficulty: e.target.value as any })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Difficulties</option>
          <option value="bronze">Bronze</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="platinum">Platinum</option>
        </select>

        {/* Sort */}
        <select
          value={filters.sortBy}
          onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value as any })}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="recent">Recently Unlocked</option>
          <option value="difficulty">By Difficulty</option>
          <option value="progress">By Progress</option>
          <option value="rarity">By Rarity</option>
        </select>
      </div>
    </div>
  );
};

const AchievementModal = ({ 
  achievement, 
  isOpen, 
  onClose 
}: { 
  achievement: Achievement | null; 
  isOpen: boolean; 
  onClose: () => void;
}) => {
  if (!isOpen || !achievement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full mx-4"
      >
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">{achievement.icon}</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {achievement.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {achievement.description}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-medium">Category</span>
            <span className="capitalize">{achievement.category}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-medium">Difficulty</span>
            <span className="capitalize">{achievement.difficulty}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-medium">Points</span>
            <span>{achievement.points} XP</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="font-medium">Rarity</span>
            <span>{achievement.rarity}% of users</span>
          </div>
          
          {achievement.prerequisites && achievement.prerequisites.length > 0 && (
            <div className="py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="font-medium block mb-2">Prerequisites</span>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400">
                {achievement.prerequisites.map((prereq, index) => (
                  <li key={index}>{prereq}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
};

function AchievementsPageContent() {
  const { userData } = useUserData();
  const searchParams = useSearchParams();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filters, setFilters] = useState<AchievementFilters>({
    category: 'all',
    status: 'all',
    difficulty: 'all',
    sortBy: 'recent'
  });

  useEffect(() => {
    // Initialize filters from URL
    const category = searchParams.get('category') as AchievementFilters['category'] || 'all';
    const status = searchParams.get('status') as AchievementFilters['status'] || 'all';
    
    setFilters(prev => ({ ...prev, category, status }));
  }, [searchParams]);

  useEffect(() => {
    fetchAchievements();
  }, [userData]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock achievements data
      const mockAchievements: Achievement[] = [
        {
          id: '1',
          name: 'First Steps',
          description: 'Complete your first poker course',
          category: 'milestone',
          difficulty: 'bronze',
          points: 100,
          icon: '🎯',
          unlocked: true,
          unlockedAt: '2024-08-20T10:00:00Z',
          progress: 1,
          maxProgress: 1,
          rarity: 95,
          reward: { type: 'xp', value: 100 }
        },
        {
          id: '2',
          name: 'Position Master',
          description: 'Demonstrate mastery of positional play in 50 hands',
          category: 'skill',
          difficulty: 'gold',
          points: 500,
          icon: '🏆',
          unlocked: true,
          unlockedAt: '2024-08-22T15:30:00Z',
          progress: 50,
          maxProgress: 50,
          rarity: 25,
          reward: { type: 'title', value: 'Position Expert' }
        },
        {
          id: '3',
          name: 'Study Streak',
          description: 'Study poker for 30 consecutive days',
          category: 'milestone',
          difficulty: 'silver',
          points: 300,
          icon: '🔥',
          unlocked: false,
          progress: 18,
          maxProgress: 30,
          rarity: 45
        },
        {
          id: '4',
          name: 'Bluff Detective',
          description: 'Successfully identify 100 opponent bluffs',
          category: 'skill',
          difficulty: 'platinum',
          points: 1000,
          icon: '🕵️',
          unlocked: false,
          progress: 67,
          maxProgress: 100,
          rarity: 8,
          reward: { type: 'badge', value: 'Master Detective' }
        },
        {
          id: '5',
          name: 'Social Butterfly',
          description: 'Share your progress on social media 10 times',
          category: 'social',
          difficulty: 'bronze',
          points: 150,
          icon: '🦋',
          unlocked: false,
          progress: 3,
          maxProgress: 10,
          rarity: 60
        },
        {
          id: '6',
          name: 'Tournament Champion',
          description: 'Win your first tournament',
          category: 'special',
          difficulty: 'gold',
          points: 750,
          icon: '👑',
          unlocked: false,
          progress: 0,
          maxProgress: 1,
          rarity: 15,
          prerequisites: ['Complete 5 tournament courses', 'Achieve 70% win rate'],
          reward: { type: 'unlock', value: 'Elite Tournament Access' }
        },
        {
          id: '7',
          name: 'Knowledge Collector',
          description: 'Complete 25 different poker courses',
          category: 'milestone',
          difficulty: 'platinum',
          points: 800,
          icon: '📚',
          unlocked: false,
          progress: 12,
          maxProgress: 25,
          rarity: 12
        },
        {
          id: '8',
          name: 'Perfect Score',
          description: 'Achieve 100% on any assessment',
          category: 'skill',
          difficulty: 'silver',
          points: 400,
          icon: '⭐',
          unlocked: true,
          unlockedAt: '2024-08-25T12:00:00Z',
          progress: 1,
          maxProgress: 1,
          rarity: 35,
          reward: { type: 'xp', value: 400 }
        }
      ];
      
      setAchievements(mockAchievements);
      logger.info('Achievements loaded', { count: mockAchievements.length });
    } catch (error) {
      logger.error('Error fetching achievements:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch achievements');
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements
    .filter(achievement => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!achievement.name.toLowerCase().includes(query) && 
            !achievement.description.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      if (filters.category !== 'all' && achievement.category !== filters.category) {
        return false;
      }
      
      if (filters.status !== 'all') {
        if (filters.status === 'unlocked' && !achievement.unlocked) return false;
        if (filters.status === 'locked' && achievement.unlocked) return false;
        if (filters.status === 'progress' && (achievement.unlocked || achievement.progress === 0)) return false;
      }
      
      if (filters.difficulty !== 'all' && achievement.difficulty !== filters.difficulty) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'recent':
          if (a.unlocked && b.unlocked) {
            return new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime();
          }
          return (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0);
        case 'difficulty':
          const difficultyOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4 };
          return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
        case 'progress':
          const aProgress = a.progress / a.maxProgress;
          const bProgress = b.progress / b.maxProgress;
          return bProgress - aProgress;
        case 'rarity':
          return a.rarity - b.rarity;
        default:
          return 0;
      }
    });

  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setModalOpen(true);
  };

  const stats = {
    total: achievements.length,
    unlocked: achievements.filter(a => a.unlocked).length,
    inProgress: achievements.filter(a => !a.unlocked && a.progress > 0).length,
    totalPoints: achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0)
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Failed to Load Achievements
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchAchievements}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Trophy className="w-7 h-7 mr-3 text-yellow-600" />
            Achievements & Social
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your progress and connect with the poker learning community
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-yellow-600">{stats.totalPoints}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Points</div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.unlocked}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Unlocked</div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">In Progress</div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Available</div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(stats.unlocked / stats.total * 100)}%</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Completion</div>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel 
        filters={filters}
        onFiltersChange={setFilters}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Achievements Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Achievements ({filteredAchievements.length})
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredAchievements.map(achievement => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                onClick={handleAchievementClick}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Achievements Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}
      </div>

      {/* Social Features Section */}
      <div className="mt-12">
        <SocialFeatures userId={userData?.id || 'current-user'} />
      </div>

      {/* Achievement Modal */}
      <AnimatePresence>
        {modalOpen && (
          <AchievementModal
            achievement={selectedAchievement}
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AchievementsPage() {
  const { userData } = useUserData();

  return (
    <AppLayout>
      <DashboardLayout 
        userId={userData?.id || 'current-user'}
        className="min-h-screen"
      >
        <Suspense fallback={<LoadingSkeleton />}>
          <AchievementsPageContent />
        </Suspense>
      </DashboardLayout>
    </AppLayout>
  );
}