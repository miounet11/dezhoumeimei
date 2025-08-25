'use client';

import React from 'react';
import { 
  Play, 
  Brain,
  Target,
  TrendingUp,
  Star,
  Clock,
  Award,
  BookOpen,
  ChevronRight,
  Zap,
  Users
} from 'lucide-react';

interface WelcomeInterfaceProps {
  onStartTraining: (mode: 'quick-start' | 'skill-focus' | 'challenge') => void;
  onStartOnboarding: () => void;
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
}

export const WelcomeInterface: React.FC<WelcomeInterfaceProps> = ({
  onStartTraining,
  onStartOnboarding,
  skillData,
  todayStats
}) => {
  const trainingModes = [
    {
      id: 'quick-start',
      title: '快速开始',
      subtitle: '15分钟快速训练',
      description: '最适合新用户，快速体验AI对战和GTO反馈',
      icon: <Play className="w-8 h-8" />,
      color: 'from-green-500 to-emerald-600',
      badge: '推荐',
      features: ['智能难度调节', '实时GTO分析', '技能自动评估'],
      time: '15分钟',
      difficulty: '自适应'
    },
    {
      id: 'skill-focus',
      title: '技能专项',
      subtitle: '针对性技能提升',
      description: '专注提升特定技能：翻牌前、翻牌后或诈唬技巧',
      icon: <Target className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-600',
      badge: null,
      features: ['专项技能训练', '深度分析反馈', '进度可视化'],
      time: '20-30分钟',
      difficulty: '中等'
    },
    {
      id: 'challenge',
      title: '挑战模式',
      subtitle: '高强度对战训练',
      description: '与高级AI对手对战，适合有经验的玩家',
      icon: <Zap className="w-8 h-8" />,
      color: 'from-purple-500 to-pink-600',
      badge: 'PRO',
      features: ['高级AI对手', '复杂决策场景', '详细复盘分析'],
      time: '45分钟+',
      difficulty: '困难'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8 border border-purple-200 dark:border-purple-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              准备好提升你的扑克技能了吗？
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              选择适合你的训练模式，开始智能化的学习之旅
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center animate-pulse">
              <span className="text-4xl">♠️</span>
            </div>
          </div>
        </div>

        {/* 今日数据快览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {todayStats.handsPlayed}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">今日手数</div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">
              {todayStats.accuracy}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">准确率</div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {todayStats.timeSpent}分钟
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">学习时间</div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {todayStats.skillPoints}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">技能点</div>
          </div>
        </div>

        {/* 新用户引导按钮 */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onStartOnboarding}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-yellow-600 transition-all transform hover:scale-105"
          >
            <BookOpen className="w-4 h-4" />
            <span>新用户教程</span>
          </button>
          <div className="px-3 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg text-sm">
            💡 建议先完成新用户教程，了解训练系统
          </div>
        </div>
      </div>

      {/* 训练模式选择 */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <Target className="w-5 h-5 mr-2 text-blue-500" />
          选择训练模式
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {trainingModes.map((mode, index) => (
            <div
              key={mode.id}
              className="group relative bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 cursor-pointer overflow-hidden"
              onClick={() => onStartTraining(mode.id as any)}
            >
              {/* 背景渐变效果 */}
              <div className={`absolute inset-0 bg-gradient-to-r ${mode.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    {/* 图标 */}
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${mode.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      {mode.icon}
                    </div>
                    
                    {/* 主要信息 */}
                    <div>
                      <div className="flex items-center space-x-3 mb-1">
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                          {mode.title}
                        </h4>
                        {mode.badge && (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            mode.badge === '推荐' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                          }`}>
                            {mode.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                        {mode.subtitle}
                      </p>
                      <p className="text-gray-500 dark:text-gray-500 text-sm">
                        {mode.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* 开始箭头 */}
                  <div className="flex-shrink-0 p-2 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
                
                {/* 特性和元数据 */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* 特性列表 */}
                  <div className="flex flex-wrap gap-2">
                    {mode.features.map((feature, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  {/* 时间和难度 */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{mode.time}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>{mode.difficulty}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 悬停效果边框 */}
              <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                   style={{
                     background: `linear-gradient(45deg, transparent, transparent)`,
                     border: '2px solid transparent',
                     backgroundImage: `linear-gradient(white, white), linear-gradient(45deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
                     backgroundClip: 'padding-box, border-box',
                   }}>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 技能概览 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
          你的技能概览
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(skillData).map(([skill, data]) => {
            const skillNames = {
              overall: '综合水平',
              preflop: '翻牌前',
              postflop: '翻牌后',
              bluffing: '诈唬技巧'
            };
            
            return (
              <div key={skill} className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 relative">
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                  <div 
                    className="absolute inset-0 rounded-full border-4 border-blue-500 transform -rotate-90 transition-all duration-500"
                    style={{
                      background: `conic-gradient(from 0deg, #3b82f6 ${data.progress * 3.6}deg, transparent 0deg)`
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      L{data.level}
                    </span>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {skillNames[skill as keyof typeof skillNames]}
                </div>
                <div className="text-xs text-gray-500">
                  {data.progress}% 进度
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};