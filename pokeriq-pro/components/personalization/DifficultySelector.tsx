'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  TrendingUp,
  Star,
  Zap,
  Brain,
  Activity,
  Settings,
  Info,
  ChevronDown,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('difficulty-selector');

interface DifficultyLevel {
  level: number;
  label: string;
  shortLabel: string;
  description: string;
  characteristics: string[];
  recommendedFor: string;
  expectedTime: number; // minutes
  successRate: number; // percentage
  skillRequirement: number; // minimum skill rating
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface UserSkillData {
  overallRating: number;
  skillDimensions: Record<string, number>;
  recentPerformance: number; // percentage
  adaptabilityScore: number; // 0-1
  preferredPace: 'slow' | 'medium' | 'fast';
}

interface DifficultySelectorProps {
  currentDifficulty: number;
  userSkillData: UserSkillData;
  contentType?: 'training' | 'assessment' | 'challenge' | 'lesson';
  skillFocus?: string[];
  onDifficultyChange: (level: number) => void;
  onAdaptiveMode?: (enabled: boolean) => void;
  showRecommendation?: boolean;
  showExplanation?: boolean;
  disabled?: boolean;
  className?: string;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  currentDifficulty,
  userSkillData,
  contentType = 'training',
  skillFocus = [],
  onDifficultyChange,
  onAdaptiveMode,
  showRecommendation = true,
  showExplanation = true,
  disabled = false,
  className = ''
}) => {
  const [selectedLevel, setSelectedLevel] = useState(currentDifficulty);
  const [recommendedLevel, setRecommendedLevel] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isAdaptiveMode, setIsAdaptiveMode] = useState(false);
  const [explanation, setExplanation] = useState('');

  const difficultyLevels: DifficultyLevel[] = [
    {
      level: 1,
      label: '新手入门',
      shortLabel: '新手',
      description: '适合刚接触扑克或该技能的玩家',
      characteristics: ['基础概念', '详细说明', '慢节奏', '大量提示'],
      recommendedFor: '初学者或新接触该技能领域的玩家',
      expectedTime: 15,
      successRate: 85,
      skillRequirement: 0,
      icon: <Star className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      level: 2,
      label: '基础练习',
      shortLabel: '基础',
      description: '有一定基础，需要巩固基本技能',
      characteristics: ['基础应用', '适度引导', '稳定节奏', '有效提示'],
      recommendedFor: '掌握基础概念，需要加强应用的玩家',
      expectedTime: 20,
      successRate: 75,
      skillRequirement: 800,
      icon: <Target className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      level: 3,
      label: '中级挑战',
      shortLabel: '中级',
      description: '具备中等水平，准备接受更复杂的挑战',
      characteristics: ['综合应用', '适度难度', '中等节奏', '选择性提示'],
      recommendedFor: '技能水平中等，想要进一步提升的玩家',
      expectedTime: 25,
      successRate: 65,
      skillRequirement: 1200,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20'
    },
    {
      level: 4,
      label: '高级训练',
      shortLabel: '高级',
      description: '高水平玩家，面对复杂情况和高级概念',
      characteristics: ['高级策略', '复杂场景', '快节奏', '最少提示'],
      recommendedFor: '技能水平较高，寻求专业提升的玩家',
      expectedTime: 35,
      successRate: 50,
      skillRequirement: 1500,
      icon: <Brain className="w-5 h-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    {
      level: 5,
      label: '专家挑战',
      shortLabel: '专家',
      description: '顶级难度，适合专业玩家和极具挑战性的场景',
      characteristics: ['专家级概念', '极端场景', '极速节奏', '无提示'],
      recommendedFor: '专业级玩家或寻求极限挑战的高手',
      expectedTime: 45,
      successRate: 35,
      skillRequirement: 1800,
      icon: <Zap className="w-5 h-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    }
  ];

  useEffect(() => {
    const recommended = calculateRecommendedDifficulty();
    setRecommendedLevel(recommended);
    generateExplanation(recommended);
  }, [userSkillData, contentType, skillFocus]);

  const calculateRecommendedDifficulty = (): number => {
    let baseLevel = 1;
    
    // Based on overall rating
    if (userSkillData.overallRating >= 1800) baseLevel = 5;
    else if (userSkillData.overallRating >= 1500) baseLevel = 4;
    else if (userSkillData.overallRating >= 1200) baseLevel = 3;
    else if (userSkillData.overallRating >= 800) baseLevel = 2;
    else baseLevel = 1;

    // Adjust based on recent performance
    if (userSkillData.recentPerformance >= 90) baseLevel = Math.min(5, baseLevel + 1);
    else if (userSkillData.recentPerformance <= 60) baseLevel = Math.max(1, baseLevel - 1);

    // Adjust based on skill focus
    if (skillFocus.length > 0) {
      const focusSkillRatings = skillFocus.map(skill => 
        userSkillData.skillDimensions[skill] || userSkillData.overallRating
      );
      const avgFocusRating = focusSkillRatings.reduce((sum, rating) => sum + rating, 0) / focusSkillRatings.length;
      
      if (avgFocusRating < userSkillData.overallRating * 0.8) {
        baseLevel = Math.max(1, baseLevel - 1);
      }
    }

    // Adjust based on content type
    const contentAdjustments = {
      training: 0,
      assessment: -1, // Start easier for assessments
      challenge: 1,   // More challenging by nature
      lesson: -1      // Educational content should be accessible
    };
    
    baseLevel = Math.max(1, Math.min(5, baseLevel + contentAdjustments[contentType]));

    // Adjust based on adaptability
    if (userSkillData.adaptabilityScore < 0.3) {
      baseLevel = Math.max(1, baseLevel - 1);
    }

    return baseLevel;
  };

  const generateExplanation = (recommendedLevel: number) => {
    const level = difficultyLevels[recommendedLevel - 1];
    let reasons = [];

    if (userSkillData.overallRating < level.skillRequirement) {
      reasons.push('您的整体技能水平建议从更基础的难度开始');
    } else if (userSkillData.overallRating > level.skillRequirement * 1.3) {
      reasons.push('以您的技能水平，可以尝试更高的难度');
    }

    if (userSkillData.recentPerformance >= 85) {
      reasons.push('您最近的表现很好，可以接受更大的挑战');
    } else if (userSkillData.recentPerformance <= 60) {
      reasons.push('建议先从简单难度重建信心');
    }

    if (skillFocus.length > 0) {
      const weakSkills = skillFocus.filter(skill => 
        (userSkillData.skillDimensions[skill] || 0) < userSkillData.overallRating * 0.8
      );
      if (weakSkills.length > 0) {
        reasons.push(`在${weakSkills.join('、')}技能方面需要加强基础`);
      }
    }

    setExplanation(reasons.join('；') || '基于您的整体表现推荐此难度');
  };

  const handleLevelChange = (level: number) => {
    setSelectedLevel(level);
    onDifficultyChange(level);
    logger.info('Difficulty level changed', { 
      from: currentDifficulty, 
      to: level, 
      recommended: recommendedLevel 
    });
  };

  const handleAdaptiveModeToggle = () => {
    const newMode = !isAdaptiveMode;
    setIsAdaptiveMode(newMode);
    onAdaptiveMode?.(newMode);
    
    if (newMode && recommendedLevel) {
      setSelectedLevel(recommendedLevel);
      onDifficultyChange(recommendedLevel);
    }
    
    logger.info('Adaptive mode toggled', { enabled: newMode });
  };

  const getDifficultyWarning = (level: number): string | null => {
    const difficulty = difficultyLevels[level - 1];
    const userRating = userSkillData.overallRating;
    
    if (userRating < difficulty.skillRequirement) {
      return '此难度可能超出您当前的技能水平，建议选择较低难度';
    }
    
    if (level >= 4 && userSkillData.recentPerformance < 70) {
      return '最近表现不佳，建议选择较低难度重建信心';
    }
    
    if (level <= 2 && userRating > 1500) {
      return '此难度可能过于简单，建议选择更有挑战性的难度';
    }
    
    return null;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-600" />
            难度设置
          </h3>
          {showExplanation && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              选择适合您当前水平的难度
            </p>
          )}
        </div>

        {/* Adaptive Mode Toggle */}
        {onAdaptiveMode && (
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">智能适配</label>
            <button
              onClick={handleAdaptiveModeToggle}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${isAdaptiveMode 
                  ? 'bg-blue-600' 
                  : 'bg-gray-200 dark:bg-gray-700'
                }
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${isAdaptiveMode ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        )}
      </div>

      {/* Recommended Difficulty Banner */}
      {showRecommendation && recommendedLevel && recommendedLevel !== selectedLevel && !isAdaptiveMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3"
        >
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                推荐难度：{difficultyLevels[recommendedLevel - 1].label}
              </h4>
              <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                {explanation}
              </p>
              <button
                onClick={() => handleLevelChange(recommendedLevel)}
                className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                采用推荐难度
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Difficulty Level Selector */}
      <div className="grid grid-cols-5 gap-2">
        {difficultyLevels.map(level => {
          const isSelected = selectedLevel === level.level;
          const isRecommended = recommendedLevel === level.level;
          const isDisabled = disabled;
          const warning = getDifficultyWarning(level.level);

          return (
            <motion.button
              key={level.level}
              onClick={() => !isDisabled && handleLevelChange(level.level)}
              whileHover={!isDisabled ? { scale: 1.02 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              disabled={isDisabled}
              className={`
                relative p-3 rounded-xl border-2 transition-all duration-200 text-center
                ${isSelected
                  ? `border-blue-500 bg-blue-50 dark:bg-blue-900/20 ${level.color}`
                  : isRecommended
                  ? `border-green-400 ${level.bgColor} ${level.color}`
                  : `border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 ${level.color}`
                }
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Recommended Badge */}
              {isRecommended && !isSelected && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  推荐
                </div>
              )}

              {/* Warning Indicator */}
              {warning && isSelected && (
                <div className="absolute -top-2 -left-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                </div>
              )}

              <div className="flex flex-col items-center space-y-1">
                {level.icon}
                <span className="font-medium text-sm">{level.shortLabel}</span>
                <span className="text-xs opacity-75">{level.level}</span>
              </div>

              {/* Success Rate Indicator */}
              <div className="mt-2">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div 
                    className={`h-1 rounded-full ${
                      level.successRate >= 75 ? 'bg-green-500' :
                      level.successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${level.successRate}%` }}
                  />
                </div>
                <span className="text-xs opacity-75 mt-1 block">
                  {level.successRate}% 成功率
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Level Details */}
      <AnimatePresence>
        {selectedLevel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${difficultyLevels[selectedLevel - 1].bgColor}`}>
                {difficultyLevels[selectedLevel - 1].icon}
              </div>
              
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {difficultyLevels[selectedLevel - 1].label}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {difficultyLevels[selectedLevel - 1].description}
                </p>

                {/* Characteristics */}
                <div className="mt-3">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    特点
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {difficultyLevels[selectedLevel - 1].characteristics.map(char => (
                      <span
                        key={char}
                        className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                      >
                        {char}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      预计 {difficultyLevels[selectedLevel - 1].expectedTime} 分钟
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {difficultyLevels[selectedLevel - 1].successRate}% 通过率
                    </span>
                  </div>
                </div>

                {/* Warning */}
                {getDifficultyWarning(selectedLevel) && (
                  <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        {getDifficultyWarning(selectedLevel)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adaptive Mode Info */}
      {isAdaptiveMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3"
        >
          <div className="flex items-start space-x-2">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-purple-800 dark:text-purple-200 text-sm">
                智能适配模式已启用
              </h4>
              <p className="text-purple-700 dark:text-purple-300 text-xs mt-1">
                系统将根据您的表现实时调整难度，确保最佳学习体验
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DifficultySelector;