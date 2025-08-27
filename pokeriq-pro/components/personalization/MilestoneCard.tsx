'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  CheckCircle,
  Circle,
  Star,
  Target,
  Calendar,
  TrendingUp,
  Clock,
  Zap,
  Flag,
  Lock,
  Unlock,
  ChevronRight
} from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetSkill: string;
  targetImprovement: number;
  estimatedTimeToComplete: number;
  prerequisites: string[];
  completed?: boolean;
  progress?: number;
  completedAt?: string;
  reward?: {
    type: 'badge' | 'points' | 'unlock';
    value: string | number;
    description: string;
  };
}

interface MilestoneCardProps {
  milestone: Milestone;
  isUnlocked?: boolean;
  showProgress?: boolean;
  compact?: boolean;
  onClick?: (milestone: Milestone) => void;
  className?: string;
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  isUnlocked = true,
  showProgress = true,
  compact = false,
  onClick,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getSkillDisplayName = (skill: string) => {
    const skillNames: Record<string, string> = {
      preflop: '翻前策略',
      postflop: '翻后游戏',
      psychology: '心理博弈',
      mathematics: '数学计算',
      bankroll: '资金管理',
      tournament: '锦标赛'
    };
    return skillNames[skill] || skill;
  };

  const getSkillColor = (skill: string) => {
    const colors: Record<string, string> = {
      preflop: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400',
      postflop: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
      psychology: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400',
      mathematics: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400',
      bankroll: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400',
      tournament: 'text-pink-600 bg-pink-100 dark:bg-pink-900/20 dark:text-pink-400'
    };
    return colors[skill] || 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-400';
  };

  const getTimeDisplay = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? `${mins}分钟` : ''}`;
    }
    return `${mins}分钟`;
  };

  const progressPercentage = milestone.progress || 0;
  const isCompleted = milestone.completed;

  return (
    <motion.div
      className={`
        relative overflow-hidden transition-all duration-300 cursor-pointer group
        ${compact ? 'p-4' : 'p-6'}
        ${isCompleted 
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700' 
          : isUnlocked
          ? 'bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
          : 'bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 opacity-75'
        }
        rounded-xl shadow-sm hover:shadow-md
        ${className}
      `}
      whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
      whileTap={{ scale: isUnlocked ? 0.98 : 1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => isUnlocked && onClick?.(milestone)}
    >
      {/* Lock Overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 bg-gray-900/10 dark:bg-gray-900/30 flex items-center justify-center z-10">
          <div className="text-center">
            <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              需完成前置里程碑
            </p>
          </div>
        </div>
      )}

      {/* Status Icon */}
      <div className="absolute top-4 right-4">
        {isCompleted ? (
          <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            <span>已完成</span>
          </div>
        ) : isUnlocked ? (
          <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
            <Circle className="w-3 h-3" />
            <span>{progressPercentage > 0 ? '进行中' : '可开始'}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs font-medium">
            <Lock className="w-3 h-3" />
            <span>已锁定</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-0">
        {/* Header */}
        <div className="flex items-start space-x-4 mb-4">
          <div className={`
            p-3 rounded-xl flex items-center justify-center
            ${isCompleted 
              ? 'bg-green-500 text-white' 
              : isUnlocked
              ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
            }
          `}>
            <Award className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-gray-900 dark:text-white ${compact ? 'text-sm' : 'text-lg'}`}>
              {milestone.title}
            </h3>
            <p className={`text-gray-600 dark:text-gray-400 mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
              {milestone.description}
            </p>
          </div>
        </div>

        {/* Target Skill */}
        <div className="mb-4">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSkillColor(milestone.targetSkill)}`}>
            <Target className="w-3 h-3 mr-1" />
            {getSkillDisplayName(milestone.targetSkill)}
          </span>
        </div>

        {/* Progress Bar */}
        {showProgress && !compact && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">进度</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {progressPercentage}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Milestone Details */}
        <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-2'} gap-3 mb-4`}>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              提升 +{milestone.targetImprovement} 分
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              约 {getTimeDisplay(milestone.estimatedTimeToComplete)}
            </span>
          </div>
        </div>

        {/* Reward Preview */}
        {milestone.reward && !compact && (
          <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
            <div className="flex items-center space-x-2">
              {milestone.reward.type === 'badge' ? (
                <Award className="w-4 h-4 text-yellow-600" />
              ) : milestone.reward.type === 'points' ? (
                <Star className="w-4 h-4 text-yellow-600" />
              ) : (
                <Unlock className="w-4 h-4 text-yellow-600" />
              )}
              
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  完成奖励
                </h4>
                <p className="text-xs text-yellow-700 dark:text-yellow-400">
                  {milestone.reward.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Prerequisites */}
        {milestone.prerequisites.length > 0 && !compact && !isCompleted && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <Flag className="w-4 h-4 mr-1" />
              前置要求
            </h4>
            <div className="space-y-1">
              {milestone.prerequisites.map((prereq, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  <span>{prereq}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completion Date */}
        {isCompleted && milestone.completedAt && !compact && (
          <div className="mb-4 flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
            <Calendar className="w-4 h-4" />
            <span>
              完成于 {new Date(milestone.completedAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        )}

        {/* Action Area */}
        {isUnlocked && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {isCompleted ? (
                <span className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>里程碑已达成</span>
                </span>
              ) : progressPercentage > 0 ? (
                <span className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                  <Zap className="w-4 h-4" />
                  <span>继续努力</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1">
                  <Star className="w-4 h-4" />
                  <span>开始挑战</span>
                </span>
              )}
            </div>

            {!isCompleted && (
              <motion.div
                animate={{ x: isHovered ? 4 : 0 }}
                className="flex items-center space-x-1 text-blue-600 dark:text-blue-400"
              >
                <span className="text-sm font-medium">
                  {progressPercentage > 0 ? '继续' : '开始'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Animated Background Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-xl opacity-0"
        animate={{ opacity: isHovered && isUnlocked ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default MilestoneCard;