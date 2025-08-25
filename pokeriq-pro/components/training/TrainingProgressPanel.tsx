'use client';

import React from 'react';
import { 
  TrendingUp, 
  Target, 
  Star, 
  Award,
  Clock,
  BarChart3,
  Zap,
  Brain
} from 'lucide-react';

interface TrainingProgressPanelProps {
  skillData: {
    overall: { level: number; progress: number; };
    preflop: { level: number; progress: number; };
    postflop: { level: number; progress: number; };
    bluffing: { level: number; progress: number; };
  };
  todayStats: {
    handsPlayed: number;
    accuracy: number;
    timeSpent: number;
    skillPoints: number;
  };
  compact?: boolean;
}

export const TrainingProgressPanel: React.FC<TrainingProgressPanelProps> = ({
  skillData,
  todayStats,
  compact = false
}) => {
  const skillIcons = {
    overall: <Star className="w-4 h-4" />,
    preflop: <Target className="w-4 h-4" />,
    postflop: <Brain className="w-4 h-4" />,
    bluffing: <Zap className="w-4 h-4" />
  };

  const skillNames = {
    overall: '综合水平',
    preflop: '翻牌前',
    postflop: '翻牌后', 
    bluffing: '诈唬技巧'
  };

  const skillColors = {
    overall: 'from-purple-500 to-pink-600',
    preflop: 'from-blue-500 to-cyan-600',
    postflop: 'from-green-500 to-emerald-600',
    bluffing: 'from-orange-500 to-red-600'
  };

  const achievements = [
    { 
      id: 'first_win', 
      title: '首次胜利', 
      description: '赢得第一手牌',
      icon: '🎉',
      unlocked: true,
      rarity: 'common'
    },
    { 
      id: 'accuracy_master', 
      title: '精准大师', 
      description: '连续10手决策准确率>90%',
      icon: '🎯',
      unlocked: true,
      rarity: 'rare'
    },
    { 
      id: 'gto_student', 
      title: 'GTO学徒', 
      description: '完成50次GTO分析',
      icon: '🧠',
      unlocked: false,
      rarity: 'epic'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 技能进展 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
          技能进展
        </h3>
        
        <div className="space-y-4">
          {Object.entries(skillData).map(([skill, data]) => (
            <div key={skill} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="text-gray-600 dark:text-gray-400">
                    {skillIcons[skill as keyof typeof skillIcons]}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {skillNames[skill as keyof typeof skillNames]}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    Lv.{data.level}
                  </div>
                  <div className="text-xs text-gray-500">{data.progress}%</div>
                </div>
              </div>
              
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-2 bg-gradient-to-r ${skillColors[skill as keyof typeof skillColors]} transition-all duration-500 group-hover:shadow-lg`}
                  style={{width: `${data.progress}%`}}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* 技能点数和等级提升预告 */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
              今日技能点
            </span>
            <span className="text-lg font-bold text-blue-900 dark:text-blue-300">
              +{todayStats.skillPoints}
            </span>
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-400">
            再获得 {Math.max(0, (skillData.overall.level + 1) * 100 - todayStats.skillPoints)} 点升级到 Lv.{skillData.overall.level + 1}
          </div>
        </div>
      </div>

      {/* 今日统计 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
          今日表现
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {todayStats.handsPlayed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">手牌数</div>
            <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
              <div 
                className="h-1 bg-blue-500 rounded-full"
                style={{width: `${Math.min(100, (todayStats.handsPlayed / 50) * 100)}%`}}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {todayStats.accuracy}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">准确率</div>
            <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
              <div 
                className="h-1 bg-green-500 rounded-full"
                style={{width: `${todayStats.accuracy}%`}}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {todayStats.timeSpent}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">分钟</div>
            <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
              <div 
                className="h-1 bg-purple-500 rounded-full"
                style={{width: `${Math.min(100, (todayStats.timeSpent / 60) * 100)}%`}}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {skillData.overall.level}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">等级</div>
            <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-2">
              <div 
                className="h-1 bg-orange-500 rounded-full"
                style={{width: `${skillData.overall.progress}%`}}
              ></div>
            </div>
          </div>
        </div>

        {/* 每日目标进度 */}
        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              每日目标
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.min(100, Math.round((todayStats.handsPlayed / 50) * 100))}% 完成
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
            <div 
              className="h-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
              style={{width: `${Math.min(100, (todayStats.handsPlayed / 50) * 100)}%`}}
            ></div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            目标: 50手牌 | 已完成: {todayStats.handsPlayed}手
          </div>
        </div>
      </div>

      {/* 最新成就 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2 text-yellow-500" />
          最新成就
        </h3>
        
        <div className="space-y-3">
          {achievements.slice(0, compact ? 2 : 3).map((achievement) => {
            const rarityColors = {
              common: 'border-gray-300 bg-gray-50',
              rare: 'border-blue-300 bg-blue-50',
              epic: 'border-purple-300 bg-purple-50'
            };
            
            return (
              <div 
                key={achievement.id}
                className={`
                  p-3 rounded-lg border-2 transition-all
                  ${achievement.unlocked 
                    ? rarityColors[achievement.rarity] + ' opacity-100' 
                    : 'border-gray-200 bg-gray-100 opacity-50'
                  }
                `}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm">
                      {achievement.title}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {achievement.description}
                    </p>
                    {achievement.unlocked && (
                      <div className="text-xs text-green-600 font-medium mt-1">
                        ✓ 已解锁
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            查看所有成就 →
          </button>
        </div>
      </div>

      {/* 学习建议 */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-700">
        <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-3 flex items-center">
          <Target className="w-5 h-5 mr-2" />
          学习建议
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-800 dark:text-green-300">
              你的翻牌后技能还有提升空间，建议多练习后门听牌的处理
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-green-800 dark:text-green-300">
              在位置意识方面表现优秀，继续保持这种优势
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-green-800 dark:text-green-300">
              建议学习更多的平衡策略，提升诈唬频率的控制
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};