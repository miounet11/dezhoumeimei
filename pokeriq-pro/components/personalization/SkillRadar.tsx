'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Radar,
  Target,
  TrendingUp,
  Star,
  Eye,
  RotateCcw,
  Info,
  Zap,
  Award
} from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('skill-radar');

interface SkillData {
  skill: string;
  current: number;
  target?: number;
  percentile: number;
  trend: number;
  confidence: number;
  description: string;
}

interface SkillRadarProps {
  userId: string;
  showTargets?: boolean;
  showComparison?: boolean;
  compact?: boolean;
  className?: string;
}

export const SkillRadar: React.FC<SkillRadarProps> = ({
  userId,
  showTargets = false,
  showComparison = false,
  compact = false,
  className = ''
}) => {
  const [skillData, setSkillData] = useState<SkillData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillData | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Skill configuration
  const skills: Array<{ key: string; name: string; color: string; icon: React.ReactNode }> = [
    { key: 'preflop', name: '翻前策略', color: '#3B82F6', icon: <Target className="w-4 h-4" /> },
    { key: 'postflop', name: '翻后游戏', color: '#10B981', icon: <Zap className="w-4 h-4" /> },
    { key: 'psychology', name: '心理博弈', color: '#8B5CF6', icon: <Eye className="w-4 h-4" /> },
    { key: 'mathematics', name: '数学计算', color: '#EF4444', icon: <Target className="w-4 h-4" /> },
    { key: 'bankroll', name: '资金管理', color: '#F59E0B', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'tournament', name: '锦标赛', color: '#EC4899', icon: <Award className="w-4 h-4" /> }
  ];

  useEffect(() => {
    loadSkillData();
  }, [userId]);

  const loadSkillData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/personalization/skills?userId=${userId}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSkillData(result.data);
        }
      }

      // Mock data for development
      const mockData: SkillData[] = [
        {
          skill: 'preflop',
          current: 1180,
          target: 1300,
          percentile: 72,
          trend: 5.4,
          confidence: 0.85,
          description: '翻前决策准确率良好，位置意识有待加强'
        },
        {
          skill: 'postflop',
          current: 1050,
          target: 1200,
          percentile: 58,
          trend: 7.1,
          confidence: 0.76,
          description: '翻后游戏进步显著，价值下注时机把握不错'
        },
        {
          skill: 'psychology',
          current: 1280,
          target: 1350,
          percentile: 81,
          trend: 3.2,
          confidence: 0.92,
          description: '心理素质优秀，读牌能力突出'
        },
        {
          skill: 'mathematics',
          current: 950,
          target: 1100,
          percentile: 45,
          trend: 2.8,
          confidence: 0.68,
          description: '数学基础需要加强，底池赔率计算还需练习'
        },
        {
          skill: 'bankroll',
          current: 1350,
          target: 1400,
          percentile: 88,
          trend: 1.5,
          confidence: 0.94,
          description: '资金管理意识很强，风险控制能力优秀'
        },
        {
          skill: 'tournament',
          current: 880,
          target: 1000,
          percentile: 35,
          trend: 4.2,
          confidence: 0.52,
          description: '锦标赛经验不足，ICM概念需要深入学习'
        }
      ];

      setSkillData(mockData);
      logger.info('Skill data loaded successfully', { userId });
    } catch (error) {
      logger.error('Error loading skill data:', error);
      setError('加载技能数据失败');
    } finally {
      setLoading(false);
    }
  };

  // SVG dimensions
  const size = compact ? 200 : 280;
  const center = size / 2;
  const maxRadius = compact ? 80 : 120;

  // Create radar chart points
  const createRadarPoints = (data: SkillData[], useTarget = false) => {
    return data.map((skill, index) => {
      const angle = (index * 60) - 90; // 60 degrees apart, start from top
      const radians = (angle * Math.PI) / 180;
      const value = useTarget ? (skill.target || skill.current) : skill.current;
      const normalizedValue = Math.min(value / 1500, 1); // Normalize to 0-1 scale
      const radius = normalizedValue * maxRadius;
      
      return {
        x: center + radius * Math.cos(radians),
        y: center + radius * Math.sin(radians),
        skill: skill.skill,
        value: value,
        angle: angle
      };
    });
  };

  const currentPoints = createRadarPoints(skillData);
  const targetPoints = showTargets ? createRadarPoints(skillData, true) : [];

  // Create polygon path
  const createPolygonPath = (points: typeof currentPoints) => {
    if (points.length === 0) return '';
    return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ') + ' Z';
  };

  // Grid circles
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className={`bg-gray-200 dark:bg-gray-700 rounded-full ${compact ? 'h-48' : 'h-64'} w-full`}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className={compact ? 'p-4' : 'p-6'}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`font-bold text-gray-900 dark:text-white flex items-center ${compact ? 'text-lg' : 'text-xl'}`}>
              <Radar className={`mr-2 text-purple-600 ${compact ? 'w-5 h-5' : 'w-6 h-6'}`} />
              技能雷达图
            </h3>
            {!compact && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                全面展示各项技能水平和发展趋势
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!compact && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setShowTooltip(!showTooltip)}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    showTooltip 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                  title="显示详细信息"
                >
                  <Info className="w-4 h-4" />
                </button>
                
                <button
                  onClick={loadSkillData}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                  title="刷新数据"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              {/* Background circles */}
              {gridLevels.map((level, index) => (
                <circle
                  key={index}
                  cx={center}
                  cy={center}
                  r={level * maxRadius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.2"
                  className="text-gray-300 dark:text-gray-600"
                />
              ))}

              {/* Grid lines */}
              {skills.map((_, index) => {
                const angle = (index * 60) - 90;
                const radians = (angle * Math.PI) / 180;
                const x2 = center + maxRadius * Math.cos(radians);
                const y2 = center + maxRadius * Math.sin(radians);
                
                return (
                  <line
                    key={index}
                    x1={center}
                    y1={center}
                    x2={x2}
                    y2={y2}
                    stroke="currentColor"
                    strokeWidth="1"
                    opacity="0.2"
                    className="text-gray-300 dark:text-gray-600"
                  />
                );
              })}

              {/* Target polygon (if enabled) */}
              {showTargets && targetPoints.length > 0 && (
                <motion.path
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  d={createPolygonPath(targetPoints)}
                  fill="url(#targetGradient)"
                  stroke="#6B7280"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              )}

              {/* Current skill polygon */}
              {currentPoints.length > 0 && (
                <motion.path
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.6, scale: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  d={createPolygonPath(currentPoints)}
                  fill="url(#skillGradient)"
                  stroke="#8B5CF6"
                  strokeWidth="2"
                />
              )}

              {/* Skill points */}
              {currentPoints.map((point, index) => {
                const skill = skills[index];
                const skillInfo = skillData[index];
                
                return (
                  <g key={point.skill}>
                    {/* Point */}
                    <motion.circle
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                      cx={point.x}
                      cy={point.y}
                      r={compact ? 4 : 6}
                      fill={skill.color}
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer hover:r-8 transition-all duration-200"
                      onMouseEnter={() => setSelectedSkill(skillInfo)}
                      onMouseLeave={() => setSelectedSkill(null)}
                    />
                    
                    {/* Skill label */}
                    <text
                      x={center + (maxRadius + 20) * Math.cos(((index * 60) - 90) * Math.PI / 180)}
                      y={center + (maxRadius + 20) * Math.sin(((index * 60) - 90) * Math.PI / 180)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-current text-gray-700 dark:text-gray-300 text-xs font-medium"
                    >
                      {skill.name}
                    </text>
                  </g>
                );
              })}

              {/* Gradients */}
              <defs>
                <radialGradient id="skillGradient" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.4" />
                </radialGradient>
                
                {showTargets && (
                  <radialGradient id="targetGradient" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#6B7280" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#6B7280" stopOpacity="0.2" />
                  </radialGradient>
                )}
              </defs>
            </svg>

            {/* Hover tooltip */}
            {selectedSkill && showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-gray-900 text-white text-sm rounded-lg px-3 py-2 z-10 max-w-xs"
              >
                <h4 className="font-medium mb-1">
                  {skills.find(s => s.key === selectedSkill.skill)?.name}
                </h4>
                <p className="text-xs text-gray-300 mb-2">
                  {selectedSkill.description}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>当前: {selectedSkill.current}</div>
                  <div>排名: {selectedSkill.percentile}%</div>
                  <div>趋势: +{selectedSkill.trend}%</div>
                  <div>置信度: {Math.round(selectedSkill.confidence * 100)}%</div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Skills Legend */}
        {!compact && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {skillData.map((skill, index) => {
              const skillConfig = skills.find(s => s.key === skill.skill);
              
              return (
                <motion.div
                  key={skill.skill}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: skillConfig?.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {skillConfig?.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                      <span>{skill.current}分</span>
                      <span className={`flex items-center space-x-1 ${
                        skill.trend > 0 ? 'text-green-600' : skill.trend < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {skill.trend > 0 ? '↗' : skill.trend < 0 ? '↘' : '→'}
                        <span>{Math.abs(skill.trend)}%</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      前{skill.percentile}%
                    </div>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.round(skill.confidence * 5)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {!compact && skillData.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(skillData.reduce((sum, skill) => sum + skill.current, 0) / skillData.length)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">平均评分</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {skillData.filter(skill => skill.trend > 0).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">提升技能</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(skillData.reduce((sum, skill) => sum + skill.percentile, 0) / skillData.length)}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">平均排名</p>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(skillData.reduce((sum, skill) => sum + skill.confidence, 0) / skillData.length * 100)}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">评估置信度</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-5 h-5 text-red-600 dark:text-red-400 mr-3">⚠</div>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillRadar;