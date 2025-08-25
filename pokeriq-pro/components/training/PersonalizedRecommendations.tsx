'use client';

import React from 'react';
import { 
  Lightbulb, 
  TrendingUp,
  Target,
  BookOpen,
  Brain,
  Star,
  Clock,
  ArrowRight,
  Zap,
  Award
} from 'lucide-react';

interface PersonalizedRecommendationsProps {
  userLevel: number;
  recentPerformance: number;
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  userLevel,
  recentPerformance
}) => {
  // 基于用户等级和表现生成推荐
  const generateRecommendations = () => {
    const recommendations = [];

    // 基于表现的推荐
    if (recentPerformance < 70) {
      recommendations.push({
        id: 'improve_basics',
        type: 'skill',
        priority: 'high',
        title: '基础技能强化',
        description: '你的决策准确率偏低，建议重点练习基础概念',
        action: '开始基础训练',
        icon: <Target className="w-5 h-5" />,
        color: 'red',
        estimatedTime: '15-20分钟',
        difficulty: '简单'
      });
    } else if (recentPerformance > 85) {
      recommendations.push({
        id: 'advanced_concepts',
        type: 'challenge',
        priority: 'medium',
        title: '挑战高级概念',
        description: '你的表现很棒！可以尝试更高难度的训练',
        action: '进入挑战模式',
        icon: <Zap className="w-5 h-5" />,
        color: 'purple',
        estimatedTime: '30-45分钟',
        difficulty: '困难'
      });
    }

    // 基于等级的推荐
    if (userLevel < 3) {
      recommendations.push({
        id: 'position_play',
        type: 'lesson',
        priority: 'high',
        title: '位置意识训练',
        description: '学习不同位置的策略差异，这是扑克的基础',
        action: '学习位置策略',
        icon: <BookOpen className="w-5 h-5" />,
        color: 'blue',
        estimatedTime: '10分钟',
        difficulty: '简单'
      });
    } else if (userLevel >= 3 && userLevel < 8) {
      recommendations.push({
        id: 'gto_basics',
        type: 'skill',
        priority: 'medium',
        title: 'GTO策略入门',
        description: '开始学习游戏理论最优策略的基础概念',
        action: '学习GTO基础',
        icon: <Brain className="w-5 h-5" />,
        color: 'green',
        estimatedTime: '25分钟',
        difficulty: '中等'
      });
    }

    // 通用推荐
    recommendations.push({
      id: 'daily_challenge',
      type: 'challenge',
      priority: 'low',
      title: '每日挑战',
      description: '完成今日特殊挑战，获得额外技能点奖励',
      action: '开始挑战',
      icon: <Award className="w-5 h-5" />,
      color: 'yellow',
      estimatedTime: '5-10分钟',
      difficulty: '适中'
    });

    return recommendations.slice(0, 3); // 最多显示3个推荐
  };

  const recommendations = generateRecommendations();

  const getColorClasses = (color: string) => {
    const colors = {
      red: {
        bg: 'from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
        border: 'border-red-200 dark:border-red-700',
        text: 'text-red-700 dark:text-red-300',
        button: 'bg-red-600 hover:bg-red-700'
      },
      blue: {
        bg: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
        border: 'border-blue-200 dark:border-blue-700',
        text: 'text-blue-700 dark:text-blue-300',
        button: 'bg-blue-600 hover:bg-blue-700'
      },
      green: {
        bg: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
        border: 'border-green-200 dark:border-green-700',
        text: 'text-green-700 dark:text-green-300',
        button: 'bg-green-600 hover:bg-green-700'
      },
      purple: {
        bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
        border: 'border-purple-200 dark:border-purple-700',
        text: 'text-purple-700 dark:text-purple-300',
        button: 'bg-purple-600 hover:bg-purple-700'
      },
      yellow: {
        bg: 'from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
        border: 'border-yellow-200 dark:border-yellow-700',
        text: 'text-yellow-700 dark:text-yellow-300',
        button: 'bg-yellow-600 hover:bg-yellow-700'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      high: { label: '高优先级', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
      medium: { label: '中优先级', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
      low: { label: '低优先级', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' }
    };
    return badges[priority as keyof typeof badges] || badges.medium;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
        <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
        个性化推荐
      </h3>

      {/* 推荐说明 */}
      <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          基于你的等级 <span className="font-bold">Lv.{userLevel}</span> 和 
          <span className="font-bold"> {recentPerformance}%</span> 的准确率，
          AI为你推荐以下训练内容：
        </p>
      </div>

      {/* 推荐列表 */}
      <div className="space-y-4">
        {recommendations.map((rec, index) => {
          const colorClasses = getColorClasses(rec.color);
          const priorityBadge = getPriorityBadge(rec.priority);
          
          return (
            <div
              key={rec.id}
              className={`
                relative p-4 rounded-xl border transition-all duration-300 hover:shadow-md cursor-pointer
                bg-gradient-to-r ${colorClasses.bg} ${colorClasses.border}
              `}
            >
              {/* 优先级标签 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg bg-white/50 ${colorClasses.text}`}>
                    {rec.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold text-lg ${colorClasses.text} mb-1`}>
                      {rec.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {rec.description}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityBadge.color}`}>
                  {priorityBadge.label}
                </span>
              </div>

              {/* 详细信息 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {rec.estimatedTime}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {rec.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <button 
                className={`
                  w-full py-2 px-4 text-white font-medium rounded-lg transition-all
                  ${colorClasses.button} 
                  hover:transform hover:scale-105 flex items-center justify-center space-x-2
                `}
              >
                <span>{rec.action}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* 排序指示器 */}
              {index === 0 && rec.priority === 'high' && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 更多推荐 */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center justify-center space-x-1">
            <span>查看更多推荐</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 学习路径预览 */}
      <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
        <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-2 flex items-center">
          <TrendingUp className="w-4 h-4 mr-2" />
          推荐学习路径
        </h4>
        <div className="text-sm text-purple-700 dark:text-purple-400">
          {userLevel < 3 && '基础策略 → 位置意识 → 手牌强度评估'}
          {userLevel >= 3 && userLevel < 8 && 'GTO基础 → 范围分析 → 高级概念'}
          {userLevel >= 8 && '高级GTO → 剥削性策略 → 心理博弈'}
        </div>
      </div>
    </div>
  );
};