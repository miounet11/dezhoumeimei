'use client';

import React, { useState } from 'react';
import AppLayout from '@/src/components/layout/AppLayout';
import { 
  Brain, 
  BarChart3, 
  Users, 
  Eye, 
  Layers, 
  TrendingUp,
  Settings,
  HelpCircle,
  Zap,
  Target,
  Activity,
  BookOpen,
  Calculator,
  Trophy,
  ChevronRight,
  Globe
} from 'lucide-react';

type ViewType = 'overview' | 'ranges' | 'simulator' | 'frequency' | 'analysis' | 'texture' | 'history';

interface GTOModule {
  id: ViewType;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  icon: React.ReactNode;
  color: string;
  stats?: {
    label: string;
    value: string;
  };
}

export default function GTOTrainingPage() {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [selectedPosition, setSelectedPosition] = useState<string>('BTN');
  const [opponentCount, setOpponentCount] = useState(5);

  const modules: GTOModule[] = [
    {
      id: 'overview',
      title: 'GTO概览',
      titleEn: 'GTO Overview',
      description: '学习博弈论最优策略的核心概念',
      descriptionEn: 'Learn core concepts of Game Theory Optimal strategy',
      icon: <Brain className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-600',
      stats: { label: '掌握度', value: '76%' }
    },
    {
      id: 'ranges',
      title: '手牌范围',
      titleEn: 'Hand Ranges',
      description: '各位置的GTO开牌和3-bet范围',
      descriptionEn: 'GTO opening and 3-bet ranges by position',
      icon: <Layers className="w-6 h-6" />,
      color: 'from-blue-500 to-indigo-600',
      stats: { label: '准确率', value: '82%' }
    },
    {
      id: 'simulator',
      title: '策略模拟器',
      titleEn: 'Strategy Simulator',
      description: '实时计算最优策略和EV',
      descriptionEn: 'Real-time optimal strategy and EV calculation',
      icon: <Calculator className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-600',
      stats: { label: '模拟局数', value: '1.2K' }
    },
    {
      id: 'frequency',
      title: '频率训练',
      titleEn: 'Frequency Training',
      description: '学习最优频率分配和平衡策略',
      descriptionEn: 'Learn optimal frequency distribution and balanced strategy',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-600',
      stats: { label: '准确率', value: '87%' }
    },
    {
      id: 'analysis',
      title: '对手分析',
      titleEn: 'Opponent Analysis',
      description: '识别和剥削对手的偏差',
      descriptionEn: 'Identify and exploit opponent deviations',
      icon: <Eye className="w-6 h-6" />,
      color: 'from-orange-500 to-red-600',
      stats: { label: '剥削收益', value: '+15%' }
    },
    {
      id: 'texture',
      title: '牌面分析',
      titleEn: 'Board Texture',
      description: '不同牌面结构的GTO打法',
      descriptionEn: 'GTO play on different board textures',
      icon: <Activity className="w-6 h-6" />,
      color: 'from-teal-500 to-cyan-600',
      stats: { label: '识别速度', value: '2.3s' }
    },
    {
      id: 'history',
      title: '历史复盘',
      titleEn: 'Hand History',
      description: '分析你的历史手牌并找出漏洞',
      descriptionEn: 'Analyze your hand history and find leaks',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-indigo-500 to-purple-600',
      stats: { label: '已分析', value: '456手' }
    }
  ];

  const positions = ['UTG', 'UTG+1', 'MP', 'CO', 'BTN', 'SB', 'BB'];

  const getContent = () => {
    switch(activeView) {
      case 'overview':
        return <GTOOverview language={language} />;
      case 'ranges':
        return <HandRanges language={language} position={selectedPosition} />;
      case 'simulator':
        return <StrategySimulator language={language} />;
      case 'analysis':
        return <OpponentAnalysis language={language} />;
      case 'frequency':
        return <FrequencyTraining language={language} />;
      case 'texture':
        return <BoardTextureAnalysis language={language} />;
      case 'history':
        return <HandHistory language={language} />;
      default:
        return <GTOOverview language={language} />;
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen max-w-full">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {language === 'zh' ? 'GTO训练中心' : 'GTO Training Center'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'zh' 
                  ? '掌握博弈论最优策略，成为不可剥削的玩家' 
                  : 'Master Game Theory Optimal strategy and become unexploitable'}
              </p>
            </div>
            
            {/* 语言切换 */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span className="font-medium">{language === 'zh' ? 'EN' : '中文'}</span>
              </button>
              
              <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-8 h-8" />
                <span className="text-2xl font-bold">3.2</span>
              </div>
              <p className="text-sm opacity-90">{language === 'zh' ? '平均EV' : 'Average EV'}</p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-8 h-8" />
                <span className="text-2xl font-bold">78%</span>
              </div>
              <p className="text-sm opacity-90">{language === 'zh' ? 'GTO准确率' : 'GTO Accuracy'}</p>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-8 h-8" />
                <span className="text-2xl font-bold">24</span>
              </div>
              <p className="text-sm opacity-90">{language === 'zh' ? '连胜记录' : 'Win Streak'}</p>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-8 h-8" />
                <span className="text-2xl font-bold">1.5K</span>
              </div>
              <p className="text-sm opacity-90">{language === 'zh' ? '训练手数' : 'Hands Trained'}</p>
            </div>
          </div>
        </div>

        {/* 模块选择 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => setActiveView(module.id)}
              className={`
                relative p-6 rounded-xl border-2 transition-all hover:shadow-lg hover:-translate-y-1
                ${activeView === module.id 
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                }
              `}
            >
              <div className={`
                w-14 h-14 rounded-xl bg-gradient-to-br ${module.color} 
                flex items-center justify-center text-white mb-4
              `}>
                {module.icon}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {language === 'zh' ? module.title : module.titleEn}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {language === 'zh' ? module.description : module.descriptionEn}
              </p>
              
              {module.stats && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-500">{module.stats.label}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {module.stats.value}
                  </span>
                </div>
              )}
              
              {activeView === module.id && (
                <div className="absolute top-3 right-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          {getContent()}
        </div>
      </div>
    </AppLayout>
  );
}

// GTO概览组件
function GTOOverview({ language }: { language: 'zh' | 'en' }) {
  const concepts = [
    {
      title: language === 'zh' ? '平衡策略' : 'Balanced Strategy',
      description: language === 'zh' 
        ? '混合你的价值下注和诈唬，让对手无法剥削' 
        : 'Mix value bets and bluffs to be unexploitable',
      progress: 85
    },
    {
      title: language === 'zh' ? '频率控制' : 'Frequency Control',
      description: language === 'zh' 
        ? '使用正确的下注和跟注频率' 
        : 'Use correct betting and calling frequencies',
      progress: 72
    },
    {
      title: language === 'zh' ? '范围构建' : 'Range Construction',
      description: language === 'zh' 
        ? '在每个位置构建平衡的手牌范围' 
        : 'Build balanced ranges for each position',
      progress: 90
    },
    {
      title: language === 'zh' ? 'EV最大化' : 'EV Maximization',
      description: language === 'zh' 
        ? '做出期望值最高的决策' 
        : 'Make decisions with highest expected value',
      progress: 78
    }
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {language === 'zh' ? 'GTO核心概念' : 'GTO Core Concepts'}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {concepts.map((concept, index) => (
          <div key={index} className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {concept.title}
              </h3>
              <span className="text-sm font-medium text-purple-600">
                {concept.progress}%
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {concept.description}
            </p>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-600 transition-all duration-500"
                style={{ width: `${concept.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 学习路径 */}
      <div className="mt-8 space-y-6">
        <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            {language === 'zh' ? '今日学习建议' : "Today's Learning Suggestion"}
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {language === 'zh' 
              ? '基于你的进度，建议今天重点学习"3-bet防守范围"。这将帮助你在面对激进对手时做出更好的决策。'
              : 'Based on your progress, we recommend focusing on "3-bet defense ranges" today. This will help you make better decisions against aggressive opponents.'}
          </p>
          <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors">
            {language === 'zh' ? '开始学习' : 'Start Learning'} →
          </button>
        </div>

        {/* 学习路径进度 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {language === 'zh' ? 'GTO学习路径' : 'GTO Learning Path'}
          </h3>
          
          <div className="space-y-4">
            {[
              {
                level: 1,
                title: language === 'zh' ? '基础概念' : 'Basic Concepts',
                description: language === 'zh' ? '理解GTO基本原理和术语' : 'Understand GTO principles and terminology',
                progress: 100,
                status: 'completed',
                topics: ['Nash均衡', '未剥削性', '混合策略', '期望值']
              },
              {
                level: 2,
                title: language === 'zh' ? '起手牌选择' : 'Starting Hand Selection',
                description: language === 'zh' ? '学习各位置的GTO起手牌范围' : 'Learn GTO starting hand ranges by position',
                progress: 85,
                status: 'current',
                topics: ['位置范围', '3-bet策略', '跛入策略', '盲注防守']
              },
              {
                level: 3,
                title: language === 'zh' ? '翻牌策略' : 'Flop Strategy',
                description: language === 'zh' ? '掌握翻牌圈的GTO决策' : 'Master GTO decisions on the flop',
                progress: 45,
                status: 'next',
                topics: ['持续下注', '加注频率', '慢打策略', '诈唬选择']
              },
              {
                level: 4,
                title: language === 'zh' ? '转牌技巧' : 'Turn Play',
                description: language === 'zh' ? '转牌圈的高级GTO应用' : 'Advanced GTO applications on the turn',
                progress: 15,
                status: 'locked',
                topics: ['双筒诈唬', '价值下注', '底池控制', '位置优势']
              },
              {
                level: 5,
                title: language === 'zh' ? '河牌精通' : 'River Mastery',
                description: language === 'zh' ? '河牌圈的完美GTO执行' : 'Perfect GTO execution on the river',
                progress: 0,
                status: 'locked',
                topics: ['价值诈唬比例', '阻断牌', '河牌加注', '薄价值']
              },
              {
                level: 6,
                title: language === 'zh' ? '实战应用' : 'Real Game Application',
                description: language === 'zh' ? '将GTO理论应用到实战中' : 'Apply GTO theory to real games',
                progress: 0,
                status: 'locked',
                topics: ['对手调整', '剥削策略', '心理战', '筹码管理']
              }
            ].map((path) => (
              <div key={path.level} className={`relative p-4 rounded-lg border-2 transition-all ${
                path.status === 'completed' 
                  ? 'border-green-200 bg-green-50 dark:bg-green-900/10'
                  : path.status === 'current'
                  ? 'border-purple-200 bg-purple-50 dark:bg-purple-900/10'
                  : path.status === 'next'
                  ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/10'
                  : 'border-gray-200 bg-gray-50 dark:bg-gray-700 opacity-60'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      path.status === 'completed'
                        ? 'bg-green-500 text-white'
                        : path.status === 'current'
                        ? 'bg-purple-500 text-white'
                        : path.status === 'next'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-400 text-white'
                    }`}>
                      {path.status === 'completed' ? '✓' : path.level}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{path.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{path.description}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {path.progress}%
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      path.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : path.status === 'current'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                        : path.status === 'next'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-100'
                    }`}>
                      {path.status === 'completed' 
                        ? (language === 'zh' ? '已完成' : 'Completed')
                        : path.status === 'current'
                        ? (language === 'zh' ? '进行中' : 'Current')
                        : path.status === 'next'
                        ? (language === 'zh' ? '下一个' : 'Next')
                        : (language === 'zh' ? '锁定' : 'Locked')}
                    </div>
                  </div>
                </div>
                
                {/* 进度条 */}
                {path.progress > 0 && (
                  <div className="mb-3">
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          path.status === 'completed' 
                            ? 'bg-green-500'
                            : path.status === 'current'
                            ? 'bg-purple-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${path.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* 主题标签 */}
                <div className="flex flex-wrap gap-2">
                  {path.topics.map((topic, index) => (
                    <span key={index} className="text-xs px-2 py-1 bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded border">
                      {topic}
                    </span>
                  ))}
                </div>

                {/* 开始学习按钮 */}
                {(path.status === 'current' || path.status === 'next') && (
                  <button className="mt-3 px-3 py-1 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded font-medium hover:from-purple-700 hover:to-pink-700 transition-colors">
                    {language === 'zh' ? '继续学习' : 'Continue Learning'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 手牌范围组件
function HandRanges({ language, position }: { language: 'zh' | 'en'; position: string }) {
  const [rangeType, setRangeType] = useState<'open' | '3bet' | 'defend'>('open');
  const [selectedHands, setSelectedHands] = useState<string[]>([]);
  const [dragSelection, setDragSelection] = useState<{
    start: { row: number; col: number } | null;
    current: { row: number; col: number } | null;
    isSelecting: boolean;
  }>({ start: null, current: null, isSelecting: false });
  
  // 13x13手牌矩阵
  const handMatrix = [
    ['AA', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s'],
    ['AKo', 'KK', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s'],
    ['AQo', 'KQo', 'QQ', 'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s'],
    ['AJo', 'KJo', 'QJo', 'JJ', 'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s'],
    ['ATo', 'KTo', 'QTo', 'JTo', 'TT', 'T9s', 'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s'],
    ['A9o', 'K9o', 'Q9o', 'J9o', 'T9o', '99', '98s', '97s', '96s', '95s', '94s', '93s', '92s'],
    ['A8o', 'K8o', 'Q8o', 'J8o', 'T8o', '98o', '88', '87s', '86s', '85s', '84s', '83s', '82s'],
    ['A7o', 'K7o', 'Q7o', 'J7o', 'T7o', '97o', '87o', '77', '76s', '75s', '74s', '73s', '72s'],
    ['A6o', 'K6o', 'Q6o', 'J6o', 'T6o', '96o', '86o', '76o', '66', '65s', '64s', '63s', '62s'],
    ['A5o', 'K5o', 'Q5o', 'J5o', 'T5o', '95o', '85o', '75o', '65o', '55', '54s', '53s', '52s'],
    ['A4o', 'K4o', 'Q4o', 'J4o', 'T4o', '94o', '84o', '74o', '64o', '54o', '44', '43s', '42s'],
    ['A3o', 'K3o', 'Q3o', 'J3o', 'T3o', '93o', '83o', '73o', '63o', '53o', '43o', '33', '32s'],
    ['A2o', 'K2o', 'Q2o', 'J2o', 'T2o', '92o', '82o', '72o', '62o', '52o', '42o', '32o', '22']
  ];

  // 根据位置和类型获取GTO范围
  const getGTORange = (pos: string, type: 'open' | '3bet' | 'defend'): string[] => {
    // 简化的GTO范围 - 实际应用中应该从数据库或配置文件读取
    const ranges = {
      'BTN': {
        'open': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'ATo', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'KQs', 'KQo', 'KJs', 'KJo', 'KTs', 'K9s', 'QJs', 'QJo', 'QTs', 'JTs', 'T9s', '98s'],
        '3bet': ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs', 'A5s', 'A4s', 'KQs', 'K5s', 'K4s'],
        'defend': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'KQs', 'KJs', 'QJs']
      },
      'CO': {
        'open': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'KQs', 'KJs', 'KJo', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s'],
        '3bet': ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'A5s', 'A4s'],
        'defend': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'KQs', 'KJs']
      },
      'UTG': {
        'open': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'KQs'],
        '3bet': ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'],
        'defend': ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'AQo']
      }
    };
    
    return ranges[pos as keyof typeof ranges]?.[type] || [];
  };

  // 获取手牌在当前范围中的颜色
  const getHandColor = (hand: string) => {
    const gtoRange = getGTORange(position, rangeType);
    const isSelected = selectedHands.includes(hand);
    const isInGTORange = gtoRange.includes(hand);
    
    if (isSelected) return 'bg-blue-500 text-white';
    if (isInGTORange) {
      if (['AA', 'KK', 'QQ', 'AKs', 'AKo'].includes(hand)) return 'bg-green-500 text-white';
      if (['JJ', 'TT', 'AQs', 'AQo', 'AJs'].includes(hand)) return 'bg-green-400 text-white';
      return 'bg-green-300 text-gray-800';
    }
    
    return 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  // 处理手牌点击
  const handleHandClick = (hand: string) => {
    setSelectedHands(prev => 
      prev.includes(hand) 
        ? prev.filter(h => h !== hand)
        : [...prev, hand]
    );
  };

  // 处理拖拽开始
  const handleMouseDown = (row: number, col: number) => {
    setDragSelection({
      start: { row, col },
      current: { row, col },
      isSelecting: true
    });
  };

  // 处理拖拽移动
  const handleMouseEnter = (row: number, col: number) => {
    if (!dragSelection.isSelecting) return;
    setDragSelection(prev => ({
      ...prev,
      current: { row, col }
    }));
  };

  // 处理拖拽结束
  const handleMouseUp = () => {
    if (!dragSelection.isSelecting || !dragSelection.start || !dragSelection.current) {
      setDragSelection({ start: null, current: null, isSelecting: false });
      return;
    }
    
    const minRow = Math.min(dragSelection.start.row, dragSelection.current.row);
    const maxRow = Math.max(dragSelection.start.row, dragSelection.current.row);
    const minCol = Math.min(dragSelection.start.col, dragSelection.current.col);
    const maxCol = Math.max(dragSelection.start.col, dragSelection.current.col);
    
    const newSelection: string[] = [];
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        newSelection.push(handMatrix[row][col]);
      }
    }
    
    setSelectedHands(prev => {
      const combined = [...new Set([...prev, ...newSelection])];
      return combined;
    });
    
    setDragSelection({ start: null, current: null, isSelecting: false });
  };

  // 检查是否在拖拽选择范围内
  const isCellInDragSelection = (row: number, col: number): boolean => {
    if (!dragSelection.start || !dragSelection.current) return false;
    
    const minRow = Math.min(dragSelection.start.row, dragSelection.current.row);
    const maxRow = Math.max(dragSelection.start.row, dragSelection.current.row);
    const minCol = Math.min(dragSelection.start.col, dragSelection.current.col);
    const maxCol = Math.max(dragSelection.start.col, dragSelection.current.col);
    
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  };

  // 预设范围快捷按钮
  const loadPresetRange = (preset: string) => {
    const presets = {
      'tight': ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'],
      'standard': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'KQs'],
      'loose': getGTORange(position, rangeType),
      'clear': []
    };
    setSelectedHands(presets[preset as keyof typeof presets] || []);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === 'zh' ? `${position}位置手牌范围构建器` : `${position} Position Range Builder`}
        </h2>
        
        <div className="flex space-x-2">
          {(['open', '3bet', 'defend'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setRangeType(type);
                setSelectedHands(getGTORange(position, type));
              }}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${rangeType === type 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }
              `}
            >
              {type === 'open' ? (language === 'zh' ? '开池' : 'Open') :
               type === '3bet' ? '3-Bet' :
               language === 'zh' ? '防守' : 'Defend'}
            </button>
          ))}
        </div>
      </div>

      {/* 预设范围按钮 */}
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {language === 'zh' ? '预设范围:' : 'Preset Ranges:'}
        </span>
        {['tight', 'standard', 'loose', 'clear'].map((preset) => (
          <button
            key={preset}
            onClick={() => loadPresetRange(preset)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            {preset === 'tight' ? (language === 'zh' ? '紧' : 'Tight') :
             preset === 'standard' ? (language === 'zh' ? '标准' : 'Standard') :
             preset === 'loose' ? (language === 'zh' ? '松' : 'Loose') :
             language === 'zh' ? '清空' : 'Clear'}
          </button>
        ))}
      </div>

      {/* 手牌矩阵 */}
      <div className="grid grid-cols-13 gap-1 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl select-none">
        {handMatrix.map((row, i) => 
          row.map((hand, j) => {
            const isInDragSelection = isCellInDragSelection(i, j);
            return (
              <button
                key={`${i}-${j}`}
                onMouseDown={() => handleMouseDown(i, j)}
                onMouseEnter={() => handleMouseEnter(i, j)}
                onMouseUp={handleMouseUp}
                onClick={() => handleHandClick(hand)}
                className={`
                  aspect-square rounded text-xs font-bold flex items-center justify-center
                  transition-all duration-200 cursor-pointer hover:scale-105
                  ${getHandColor(hand)}
                  ${isInDragSelection ? 'ring-2 ring-purple-400 ring-inset' : ''}
                `}
              >
                {hand}
              </button>
            );
          })
        )}
      </div>

      {/* 范围统计和图例 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 统计信息 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            {language === 'zh' ? '范围统计' : 'Range Statistics'}
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '选中手牌:' : 'Selected Hands:'}
              </span>
              <span className="text-sm font-medium">{selectedHands.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '范围百分比:' : 'Range Percentage:'}
              </span>
              <span className="text-sm font-medium">
                {((selectedHands.length / 169) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '组合数:' : 'Combinations:'}
              </span>
              <span className="text-sm font-medium">
                {selectedHands.reduce((total, hand) => {
                  if (hand.length === 2) return total + 6; // 对子
                  if (hand.endsWith('s')) return total + 4; // 同花
                  if (hand.endsWith('o')) return total + 12; // 不同花
                  return total;
                }, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* 图例 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            {language === 'zh' ? '颜色图例' : 'Color Legend'}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '顶级强牌' : 'Premium Hands'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-400 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '强牌' : 'Strong Hands'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-300 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? 'GTO范围' : 'GTO Range'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '已选中' : 'Selected'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 策略模拟器组件
function StrategySimulator({ language }: { language: 'zh' | 'en' }) {
  const [scenario, setScenario] = useState({
    position: 'BTN',
    stackSize: 100,
    potSize: 3,
    toCall: 0,
    street: 'preflop',
    opponents: 1,
    holeCards: '',
    boardCards: ''
  });
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState('custom');

  // 预设经典场景
  const classicScenarios = {
    'btn-vs-bb': {
      name: language === 'zh' ? 'BTN vs BB 单挑' : 'BTN vs BB Heads Up',
      description: language === 'zh' ? '按钮位对抗大盲位的单挑底池' : 'Button vs Big Blind heads-up pot',
      position: 'BTN',
      stackSize: 100,
      potSize: 3,
      toCall: 1,
      street: 'preflop',
      opponents: 1
    },
    '3bet-pot': {
      name: language === 'zh' ? '3-bet底池' : '3-bet Pot',
      description: language === 'zh' ? '面对3-bet后的策略决策' : 'Strategy decisions in 3-bet pots',
      position: 'CO',
      stackSize: 100,
      potSize: 14,
      toCall: 8,
      street: 'preflop',
      opponents: 1
    },
    'flop-cbet': {
      name: language === 'zh' ? '翻牌持续下注' : 'Flop C-bet',
      description: language === 'zh' ? '作为翻牌前进攻者的持续下注' : 'Continuation betting as preflop aggressor',
      position: 'BTN',
      stackSize: 100,
      potSize: 6,
      toCall: 0,
      street: 'flop',
      opponents: 1
    },
    'river-bluff': {
      name: language === 'zh' ? '河牌诈唬' : 'River Bluff',
      description: language === 'zh' ? '河牌的价值下注和诈唬平衡' : 'Value betting and bluff balance on river',
      position: 'BTN',
      stackSize: 100,
      potSize: 20,
      toCall: 0,
      street: 'river',
      opponents: 1
    }
  };

  // 模拟分析
  const analyzeScenario = () => {
    if (!scenario.holeCards || scenario.holeCards.length < 2) {
      alert(language === 'zh' ? '请输入手牌' : 'Please enter hole cards');
      return;
    }
    
    setIsAnalyzing(true);
    
    // 模拟分析过程
    setTimeout(() => {
      const mockAnalysis = {
        optimalAction: {
          action: 'bet',
          frequency: 65,
          sizing: scenario.potSize * 0.75,
          ev: 2.3,
          reasoning: language === 'zh' 
            ? '基于手牌强度和位置优势，应该进行价值下注'
            : 'Based on hand strength and position, should value bet'
        },
        alternatives: [
          {
            action: 'check',
            frequency: 25,
            ev: 1.8,
            reasoning: language === 'zh' ? '控制底池，诱导对手犯错' : 'Control pot size, induce opponent mistakes'
          },
          {
            action: 'fold',
            frequency: 10,
            ev: 0,
            reasoning: language === 'zh' ? '面对强烈抵抗时的保守选择' : 'Conservative choice against strong resistance'
          }
        ],
        equity: 67.5,
        potOdds: (scenario.toCall / (scenario.potSize + scenario.toCall)) * 100,
        boardTexture: {
          type: 'dry',
          connectivity: 3,
          flushDraws: 0,
          straightDraws: 1
        }
      };
      
      setAnalysis(mockAnalysis);
      setIsAnalyzing(false);
    }, 1500);
  };

  // 加载预设场景
  const loadScenario = (scenarioKey: string) => {
    if (scenarioKey === 'custom') {
      setSelectedScenario('custom');
      return;
    }
    
    const preset = classicScenarios[scenarioKey as keyof typeof classicScenarios];
    setScenario(prev => ({ ...prev, ...preset }));
    setSelectedScenario(scenarioKey);
    setAnalysis(null);
  };

  return (
    <div className="space-y-6">
      {/* 场景选择 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {language === 'zh' ? 'GTO策略模拟器' : 'GTO Strategy Simulator'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {language === 'zh' 
            ? '选择经典场景或自定义设置，获得精确的GTO分析和建议'
            : 'Choose classic scenarios or custom settings for precise GTO analysis and recommendations'}
        </p>

        {/* 预设场景 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => loadScenario('custom')}
            className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
              selectedScenario === 'custom'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="font-semibold text-gray-900 dark:text-white">
              {language === 'zh' ? '自定义场景' : 'Custom Scenario'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'zh' ? '创建你自己的训练场景' : 'Create your own training scenario'}
            </div>
          </button>
          
          {Object.entries(classicScenarios).map(([key, scenario]) => (
            <button
              key={key}
              onClick={() => loadScenario(key)}
              className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                selectedScenario === key
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="font-semibold text-gray-900 dark:text-white mb-1">
                {scenario.name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {scenario.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 场景设置 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {language === 'zh' ? '场景设置' : 'Scenario Setup'}
          </h3>
          
          <div className="space-y-4">
            {/* 手牌输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'zh' ? '你的手牌 (如: AhKs)' : 'Your Hole Cards (e.g. AhKs)'}
              </label>
              <input
                type="text"
                value={scenario.holeCards}
                onChange={(e) => setScenario(prev => ({ ...prev, holeCards: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                placeholder={language === 'zh' ? '输入手牌...' : 'Enter hole cards...'}
              />
            </div>

            {/* 公共牌 */}
            {scenario.street !== 'preflop' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '公共牌 (如: AsKhQd)' : 'Board Cards (e.g. AsKhQd)'}
                </label>
                <input
                  type="text"
                  value={scenario.boardCards}
                  onChange={(e) => setScenario(prev => ({ ...prev, boardCards: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder={language === 'zh' ? '输入公共牌...' : 'Enter board cards...'}
                />
              </div>
            )}

            {/* 位置和对手 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '位置' : 'Position'}
                </label>
                <select
                  value={scenario.position}
                  onChange={(e) => setScenario(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="UTG">UTG</option>
                  <option value="MP">MP</option>
                  <option value="CO">CO</option>
                  <option value="BTN">BTN</option>
                  <option value="SB">SB</option>
                  <option value="BB">BB</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '对手数' : 'Opponents'}
                </label>
                <select
                  value={scenario.opponents}
                  onChange={(e) => setScenario(prev => ({ ...prev, opponents: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                >
                  {[1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 底池和筹码 */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '筹码(BB)' : 'Stack(BB)'}
                </label>
                <input
                  type="number"
                  value={scenario.stackSize}
                  onChange={(e) => setScenario(prev => ({ ...prev, stackSize: parseInt(e.target.value) || 100 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '底池' : 'Pot Size'}
                </label>
                <input
                  type="number"
                  value={scenario.potSize}
                  onChange={(e) => setScenario(prev => ({ ...prev, potSize: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'zh' ? '需跟注' : 'To Call'}
                </label>
                <input
                  type="number"
                  value={scenario.toCall}
                  onChange={(e) => setScenario(prev => ({ ...prev, toCall: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* 街道选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'zh' ? '当前街道' : 'Current Street'}
              </label>
              <div className="flex space-x-2">
                {['preflop', 'flop', 'turn', 'river'].map((street) => (
                  <button
                    key={street}
                    onClick={() => setScenario(prev => ({ ...prev, street }))}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      scenario.street === street
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {street.charAt(0).toUpperCase() + street.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={analyzeScenario}
              disabled={isAnalyzing}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing 
                ? (language === 'zh' ? '分析中...' : 'Analyzing...') 
                : (language === 'zh' ? '分析场景' : 'Analyze Scenario')}
            </button>
          </div>
        </div>

        {/* 分析结果 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {language === 'zh' ? 'GTO分析结果' : 'GTO Analysis Results'}
          </h3>
          
          {isAnalyzing ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  {language === 'zh' ? '正在计算最优策略...' : 'Calculating optimal strategy...'}
                </p>
              </div>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              {/* 最优行动 */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {language === 'zh' ? '推荐行动' : 'Recommended Action'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {analysis.optimalAction.frequency}% {language === 'zh' ? '频率' : 'frequency'}
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {analysis.optimalAction.action.toUpperCase()}
                  {analysis.optimalAction.sizing && (
                    <span className="ml-2 text-sm font-normal">
                      ${analysis.optimalAction.sizing.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  EV: +{analysis.optimalAction.ev.toFixed(2)}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {analysis.optimalAction.reasoning}
                </div>
              </div>

              {/* 替代选择 */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {language === 'zh' ? '其他选择' : 'Alternative Actions'}
                </h4>
                <div className="space-y-2">
                  {analysis.alternatives.map((alt: any, index: number) => (
                    <div key={index} className="bg-white dark:bg-gray-700 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{alt.action.toUpperCase()}</span>
                        <span className="text-sm text-gray-500">
                          {alt.frequency}% | EV: {alt.ev > 0 ? '+' : ''}{alt.ev.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {alt.reasoning}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 技术统计 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-700 rounded p-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'zh' ? '胜率' : 'Equity'}
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {analysis.equity.toFixed(1)}%
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-700 rounded p-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'zh' ? '底池赔率' : 'Pot Odds'}
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {analysis.potOdds.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'zh' 
                  ? '输入场景参数并点击分析获得GTO建议' 
                  : 'Enter scenario parameters and click analyze for GTO recommendations'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 频率训练组件
function FrequencyTraining({ language }: { language: 'zh' | 'en' }) {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [userAction, setUserAction] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  // 频率训练场景
  const frequencyScenarios = [
    {
      id: 1,
      title: language === 'zh' ? 'BTN对BB 3-bet频率' : 'BTN vs BB 3-bet Frequency',
      description: language === 'zh' ? '在按钮位面对大盲位加注时，你应该用什么频率进行3-bet？' : 'When facing a raise from BB in BTN, what frequency should you 3-bet?',
      correctFrequency: 12,
      explanation: language === 'zh' ? '根据GTO理论，在这个位置应该用约12%的频率进行3-bet以保持平衡' : 'According to GTO theory, you should 3-bet about 12% of the time in this position to maintain balance',
      valueRange: '8-10%',
      bluffRange: '2-4%'
    },
    {
      id: 2,
      title: language === 'zh' ? '翻牌持续下注频率' : 'Flop C-bet Frequency',
      description: language === 'zh' ? '作为翻牍前进攻者，在干燥牌面上你应该用什么频率持续下注？' : 'As the preflop aggressor on a dry board, what frequency should you c-bet?',
      correctFrequency: 75,
      explanation: language === 'zh' ? '在干燥牌面上，作为翻牌前进攻者应该高频率（75%左右）进行持续下注' : 'On dry boards, the preflop aggressor should c-bet at high frequency (around 75%)',
      valueRange: '50-55%',
      bluffRange: '20-25%'
    },
    {
      id: 3,
      title: language === 'zh' ? '河牌诈唬频率' : 'River Bluff Frequency',
      description: language === 'zh' ? '在河牌上作为最后行动者，你应该用什么频率诈唬？' : 'On the river as the last to act, what frequency should you bluff?',
      correctFrequency: 25,
      explanation: language === 'zh' ? '河牌诈唬频率应该根据底池赔率来决定，通常在25%左右保持平衡' : 'River bluff frequency should be determined by pot odds, usually around 25% to maintain balance',
      valueRange: '0%',
      bluffRange: '25%'
    }
  ];

  const currentScene = frequencyScenarios[currentScenario];

  const submitAnswer = (frequency: number) => {
    const tolerance = 5; // 5%容错
    const isCorrect = Math.abs(frequency - currentScene.correctFrequency) <= tolerance;
    
    if (isCorrect) {
      setScore(prev => prev + 10);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
    
    setUserAction(frequency.toString());
    setShowResult(true);
  };

  const nextScenario = () => {
    setCurrentScenario((prev) => (prev + 1) % frequencyScenarios.length);
    setUserAction(null);
    setShowResult(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'zh' ? 'GTO频率训练' : 'GTO Frequency Training'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'zh' ? '学习最优的行动频率分配' : 'Learn optimal action frequency distribution'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600">{score}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {language === 'zh' ? '分数' : 'Score'}
          </div>
          <div className="text-lg font-semibold text-orange-600">{streak}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {language === 'zh' ? '连续' : 'Streak'}
          </div>
        </div>
      </div>

      {/* 当前场景 */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentScene.title}
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {currentScenario + 1} / {frequencyScenarios.length}
          </span>
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          {currentScene.description}
        </p>

        {!showResult ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {language === 'zh' ? '选择你认为正确的频率:' : 'Choose the frequency you think is correct:'}
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                {[10, 15, 25, 35, 50, 65, 75, 85].map((freq) => (
                  <button
                    key={freq}
                    onClick={() => submitAnswer(freq)}
                    className="py-3 px-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all font-semibold"
                  >
                    {freq}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 结果显示 */}
            <div className={`p-4 rounded-lg border-l-4 ${
              Math.abs(parseInt(userAction || '0') - currentScene.correctFrequency) <= 5
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : 'border-red-500 bg-red-50 dark:bg-red-900/20'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">
                  {Math.abs(parseInt(userAction || '0') - currentScene.correctFrequency) <= 5
                    ? (language === 'zh' ? '正确!' : 'Correct!')
                    : (language === 'zh' ? '不正确' : 'Incorrect')}
                </span>
                <span className="text-sm">
                  {language === 'zh' ? '你的答案' : 'Your Answer'}: {userAction}%
                </span>
              </div>
              
              <div className="mb-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {language === 'zh' ? '正确频率' : 'Correct Frequency'}: {currentScene.correctFrequency}%
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-green-600">
                    {language === 'zh' ? '价值' : 'Value'}: {currentScene.valueRange}
                  </span>
                  <span className="text-orange-600">
                    {language === 'zh' ? '诈唬' : 'Bluff'}: {currentScene.bluffRange}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {currentScene.explanation}
              </p>
            </div>
            
            <button
              onClick={nextScenario}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors"
            >
              {language === 'zh' ? '下一题' : 'Next Question'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 对手分析组件
function OpponentAnalysis({ language }: { language: 'zh' | 'en' }) {
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);
  const [opponentStats, setOpponentStats] = useState({
    vpip: '',
    pfr: '',
    threeBet: '',
    aggression: '',
    hands: ''
  });
  const [analysis, setAnalysis] = useState<any>(null);
  
  // 对手类型模板
  const opponentTypes = {
    'tight-aggressive': {
      name: language === 'zh' ? '紧凶型 (TAG)' : 'Tight Aggressive (TAG)',
      stats: { vpip: 22, pfr: 18, threeBet: 8, aggression: 3.2 },
      description: language === 'zh' ? '仅用强牌游戏，但非常激进' : 'Plays only strong hands but very aggressive',
      exploits: [
        language === 'zh' ? '与他们3-bet时要非常谨慎' : 'Be very cautious when they 3-bet',
        language === 'zh' ? '在位置上偷盲注' : 'Steal blinds when in position',
        language === 'zh' ? '避免在他们主动下注时跟注' : 'Avoid calling their bets with marginal hands'
      ]
    },
    'loose-aggressive': {
      name: language === 'zh' ? '松凶型 (LAG)' : 'Loose Aggressive (LAG)',
      stats: { vpip: 35, pfr: 28, threeBet: 12, aggression: 3.8 },
      description: language === 'zh' ? '用很多手牌游戏且非常激进' : 'Plays many hands and very aggressive',
      exploits: [
        language === 'zh' ? '用更宽的范围跟注他们的下注' : 'Call their bets with wider range',
        language === 'zh' ? '在有位置时加大压力' : 'Apply more pressure when in position',
        language === 'zh' ? '避免与他们进行诈唬战' : 'Avoid bluffing wars against them'
      ]
    },
    'tight-passive': {
      name: language === 'zh' ? '紧弱型 (Rock)' : 'Tight Passive (Rock)',
      stats: { vpip: 15, pfr: 8, threeBet: 3, aggression: 1.5 },
      description: language === 'zh' ? '仅用强牌且很少加注' : 'Plays only strong hands and rarely raises',
      exploits: [
        language === 'zh' ? '频繁偷盲注' : 'Steal blinds frequently',
        language === 'zh' ? '当他们加注时立即弃牌' : 'Fold immediately when they raise',
        language === 'zh' ? '用较弱的手牌跟注他们' : 'Call them with weaker hands'
      ]
    },
    'loose-passive': {
      name: language === 'zh' ? '松弱型 (Fish)' : 'Loose Passive (Fish)',
      stats: { vpip: 45, pfr: 12, threeBet: 2, aggression: 1.2 },
      description: language === 'zh' ? '用很多手牌但很少加注' : 'Plays many hands but rarely raises',
      exploits: [
        language === 'zh' ? '仅用强牌进行价值下注' : 'Only value bet with strong hands',
        language === 'zh' ? '避免诈唬' : 'Avoid bluffing',
        language === 'zh' ? '用较宽的范围跟注' : 'Call with wider range'
      ]
    }
  };

  const analyzeOpponent = () => {
    if (!opponentStats.vpip || !opponentStats.pfr) {
      alert(language === 'zh' ? '请输入VPIP和PFR数据' : 'Please enter VPIP and PFR data');
      return;
    }
    
    const vpip = parseFloat(opponentStats.vpip);
    const pfr = parseFloat(opponentStats.pfr);
    const threeBet = parseFloat(opponentStats.threeBet) || 5;
    const aggression = parseFloat(opponentStats.aggression) || 2;
    
    // 简单的对手分类逻辑
    let type = 'tight-passive';
    
    if (vpip >= 30) {
      type = aggression >= 2.5 ? 'loose-aggressive' : 'loose-passive';
    } else if (vpip >= 18) {
      type = aggression >= 2.5 ? 'tight-aggressive' : 'tight-passive';
    }
    
    const opponentType = opponentTypes[type as keyof typeof opponentTypes];
    
    setAnalysis({
      type,
      classification: opponentType,
      stats: { vpip, pfr, threeBet, aggression },
      recommendations: opponentType.exploits,
      tendencies: {
        preflop: vpip > 25 ? (language === 'zh' ? '非常松' : 'Very loose') : vpip > 18 ? (language === 'zh' ? '标准' : 'Standard') : (language === 'zh' ? '紧' : 'Tight'),
        aggression: aggression > 3 ? (language === 'zh' ? '非常激进' : 'Very aggressive') : aggression > 2 ? (language === 'zh' ? '激进' : 'Aggressive') : (language === 'zh' ? '被动' : 'Passive'),
        threeBet: threeBet > 8 ? (language === 'zh' ? '高频率' : 'High frequency') : threeBet > 5 ? (language === 'zh' ? '标准' : 'Standard') : (language === 'zh' ? '低频率' : 'Low frequency')
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {language === 'zh' ? '对手分析系统' : 'Opponent Analysis System'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'zh' ? '分析对手的打法特点并生成剥削策略' : 'Analyze opponent playing style and generate exploitation strategies'}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 对手类型选择 */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {language === 'zh' ? '对手类型模板' : 'Opponent Type Templates'}
          </h3>
          
          <div className="grid gap-3">
            {Object.entries(opponentTypes).map(([key, type]) => (
              <button
                key={key}
                onClick={() => {
                  setSelectedOpponent(key);
                  setOpponentStats({
                    vpip: type.stats.vpip.toString(),
                    pfr: type.stats.pfr.toString(),
                    threeBet: type.stats.threeBet.toString(),
                    aggression: type.stats.aggression.toString(),
                    hands: '1000'
                  });
                }}
                className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                  selectedOpponent === key
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  {type.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {type.description}
                </div>
                <div className="flex space-x-4 text-xs">
                  <span>VPIP: {type.stats.vpip}%</span>
                  <span>PFR: {type.stats.pfr}%</span>
                  <span>3B: {type.stats.threeBet}%</span>
                  <span>AF: {type.stats.aggression}</span>
                </div>
              </button>
            ))}
          </div>
          
          {/* 自定义数据输入 */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              {language === 'zh' ? '或输入自定义数据' : 'Or Enter Custom Data'}
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  VPIP %
                </label>
                <input
                  type="number"
                  value={opponentStats.vpip}
                  onChange={(e) => setOpponentStats(prev => ({ ...prev, vpip: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  placeholder="25"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  PFR %
                </label>
                <input
                  type="number"
                  value={opponentStats.pfr}
                  onChange={(e) => setOpponentStats(prev => ({ ...prev, pfr: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  placeholder="18"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  3-Bet %
                </label>
                <input
                  type="number"
                  value={opponentStats.threeBet}
                  onChange={(e) => setOpponentStats(prev => ({ ...prev, threeBet: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  placeholder="6"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'zh' ? '激进因子' : 'Aggression Factor'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={opponentStats.aggression}
                  onChange={(e) => setOpponentStats(prev => ({ ...prev, aggression: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  placeholder="2.5"
                />
              </div>
            </div>
            
            <button
              onClick={analyzeOpponent}
              className="w-full mt-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-medium hover:from-orange-700 hover:to-red-700 transition-colors"
            >
              {language === 'zh' ? '分析对手' : 'Analyze Opponent'}
            </button>
          </div>
        </div>

        {/* 分析结果 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {language === 'zh' ? '分析结果' : 'Analysis Results'}
          </h3>
          
          {analysis ? (
            <div className="space-y-4">
              {/* 对手分类 */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="w-5 h-5 text-orange-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {analysis.classification.name}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {analysis.classification.description}
                </p>
              </div>

              {/* 统计数据 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-700 rounded p-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'zh' ? '翻牌前风格' : 'Preflop Style'}
                  </div>
                  <div className="font-semibold">{analysis.tendencies.preflop}</div>
                </div>
                
                <div className="bg-white dark:bg-gray-700 rounded p-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'zh' ? '激进程度' : 'Aggression'}
                  </div>
                  <div className="font-semibold">{analysis.tendencies.aggression}</div>
                </div>
              </div>

              {/* 剥削策略 */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {language === 'zh' ? '剥削策略建议' : 'Exploitation Strategies'}
                </h4>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'zh' 
                  ? '选择对手类型或输入统计数据开始分析' 
                  : 'Choose opponent type or enter stats to start analysis'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 牌面分析组件
function BoardTextureAnalysis({ language }: { language: 'zh' | 'en' }) {
  const [boardCards, setBoardCards] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);

  // 经典牌面示例
  const classicBoards = {
    'dry-high': {
      cards: 'A72',
      name: language === 'zh' ? '干燥高牌面' : 'Dry High Board',
      description: language === 'zh' ? '传统的干燥高牌面，连着性和同花可能性很低' : 'Classic dry high board with low connectivity and flush potential'
    },
    'wet-connected': {
      cards: '9h8s7d',
      name: language === 'zh' ? '湿润连着牌面' : 'Wet Connected Board',
      description: language === 'zh' ? '具有很多同花和顺子听牌的湿润牌面' : 'Wet board with many straight and flush draws'
    },
    'paired': {
      cards: 'Kh8s8d',
      name: language === 'zh' ? '对子牌面' : 'Paired Board',
      description: language === 'zh' ? '包含一对的牌面，增加了葡萄的可能性' : 'Board with a pair, increasing full house possibilities'
    },
    'monotone': {
      cards: 'QsJs5s',
      name: language === 'zh' ? '单色牌面' : 'Monotone Board',
      description: language === 'zh' ? '三张同花色的牌面，同花可能性很高' : 'Three cards of same suit, high flush potential'
    },
    'rainbow-low': {
      cards: '6h4d2c',
      name: language === 'zh' ? '彩虹低牌面' : 'Rainbow Low Board',
      description: language === 'zh' ? '三种花色的低牌面，非常干燥' : 'Three different suits low board, very dry'
    }
  };

  const analyzeBoard = (cards?: string) => {
    const cardsToAnalyze = cards || boardCards;
    if (!cardsToAnalyze || cardsToAnalyze.length < 3) {
      alert(language === 'zh' ? '请输入至少三张牌' : 'Please enter at least three cards');
      return;
    }
    
    // 模拟分析逻辑
    const mockAnalysis = {
      texture: {
        type: 'dry',
        connectivity: 2,
        suitedness: 1,
        pairs: 0,
        highCards: 1,
        straightDraws: 1,
        flushDraws: 0
      },
      recommendations: {
        betFrequency: 75,
        checkFrequency: 25,
        optimalBetSize: 0.67,
        reasoning: language === 'zh' 
          ? '在这个干燥的牌面上，作为翻牌前进攻者应该高频率持续下注'
          : 'On this dry board, the preflop aggressor should continuation bet at high frequency'
      },
      ranges: {
        valueHands: ['AA', 'KK', 'QQ', 'JJ', 'AK', 'AQ'],
        bluffHands: ['A5s', 'A4s', 'KJ', 'QJ'],
        checkHands: ['TT', '99', '88', 'AJ', 'KQ']
      },
      equityDistribution: {
        strongHands: 25,
        mediumHands: 35,
        weakHands: 40
      },
      boardCards: cardsToAnalyze
    };
    
    setAnalysis(mockAnalysis);
  };

  const loadBoard = (boardKey: string) => {
    const board = classicBoards[boardKey as keyof typeof classicBoards];
    setBoardCards(board.cards);
    setSelectedBoard(boardKey);
    analyzeBoard(board.cards);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {language === 'zh' ? '牌面结构分析器' : 'Board Texture Analyzer'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'zh' 
            ? '分析不同牌面结构下的GTO最优策略' 
            : 'Analyze GTO optimal strategies on different board textures'}
        </p>
      </div>

      {/* 经典牌面示例 */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          {language === 'zh' ? '经典牌面示例' : 'Classic Board Examples'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(classicBoards).map(([key, board]) => (
            <button
              key={key}
              onClick={() => loadBoard(key)}
              className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                selectedBoard === key
                  ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="font-mono text-lg font-bold text-center mb-2 text-purple-600">
                {board.cards}
              </div>
              <div className="font-medium text-gray-900 dark:text-white mb-1">
                {board.name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {board.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 输入区域 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {language === 'zh' ? '自定义牌面输入' : 'Custom Board Input'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {language === 'zh' ? '牌面牌 (如: AhKs7d 或 AK7)' : 'Board Cards (e.g. AhKs7d or AK7)'}
              </label>
              <input
                type="text"
                value={boardCards}
                onChange={(e) => setBoardCards(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white text-lg font-mono"
                placeholder={language === 'zh' ? '输入牌面...' : 'Enter board...'}
              />
            </div>
            
            <button
              onClick={() => analyzeBoard()}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-cyan-700 transition-colors"
            >
              {language === 'zh' ? '分析牌面' : 'Analyze Board'}
            </button>
          </div>
        </div>

        {/* 分析结果 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {language === 'zh' ? '分析结果' : 'Analysis Results'}
          </h3>
          
          {analysis ? (
            <div className="space-y-4">
              {/* 牌面特征 */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Activity className="w-5 h-5 text-teal-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {language === 'zh' ? '牌面特征' : 'Board Characteristics'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'zh' ? '类型' : 'Type'}
                    </div>
                    <div className="font-semibold capitalize">{analysis.texture.type}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'zh' ? '连接性' : 'Connectivity'}
                    </div>
                    <div className="font-semibold">{analysis.texture.connectivity}/5</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'zh' ? '同花性' : 'Suitedness'}
                    </div>
                    <div className="font-semibold">{analysis.texture.suitedness}/3</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'zh' ? '高牌数' : 'High Cards'}
                    </div>
                    <div className="font-semibold">{analysis.texture.highCards}</div>
                  </div>
                </div>
              </div>

              {/* GTO建议 */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  {language === 'zh' ? 'GTO策略建议' : 'GTO Strategy Recommendations'}
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'zh' ? '下注频率' : 'Bet Frequency'}
                    </span>
                    <span className="font-semibold">{analysis.recommendations.betFrequency}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'zh' ? '最优下注尺寸' : 'Optimal Bet Size'}
                    </span>
                    <span className="font-semibold">{analysis.recommendations.optimalBetSize}x {language === 'zh' ? '底池' : 'pot'}</span>
                  </div>
                  
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-600 rounded text-sm">
                    {analysis.recommendations.reasoning}
                  </div>
                </div>
              </div>

              {/* 手牌范围分配 */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  {language === 'zh' ? '手牌范围分配' : 'Hand Range Distribution'}
                </h4>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-green-600">
                        {language === 'zh' ? '价值下注' : 'Value Bet'}
                      </span>
                      <span className="text-sm font-medium">{analysis.ranges.valueHands.length} {language === 'zh' ? '手牌' : 'hands'}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {analysis.ranges.valueHands.join(', ')}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-orange-600">
                        {language === 'zh' ? '诈唬' : 'Bluff'}
                      </span>
                      <span className="text-sm font-medium">{analysis.ranges.bluffHands.length} {language === 'zh' ? '手牌' : 'hands'}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {analysis.ranges.bluffHands.join(', ')}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-blue-600">
                        {language === 'zh' ? '过牌/控制底池' : 'Check/Pot Control'}
                      </span>
                      <span className="text-sm font-medium">{analysis.ranges.checkHands.length} {language === 'zh' ? '手牌' : 'hands'}</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {analysis.ranges.checkHands.join(', ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* 胜率分布 */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  {language === 'zh' ? '胜率分布' : 'Equity Distribution'}
                </h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-green-600">
                      {language === 'zh' ? '强手' : 'Strong Hands'}
                    </span>
                    <span className="text-sm font-medium">{analysis.equityDistribution.strongHands}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: `${analysis.equityDistribution.strongHands}%`}}></div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-yellow-600">
                      {language === 'zh' ? '中等手' : 'Medium Hands'}
                    </span>
                    <span className="text-sm font-medium">{analysis.equityDistribution.mediumHands}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: `${analysis.equityDistribution.mediumHands}%`}}></div>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-red-600">
                      {language === 'zh' ? '弱手' : 'Weak Hands'}
                    </span>
                    <span className="text-sm font-medium">{analysis.equityDistribution.weakHands}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{width: `${analysis.equityDistribution.weakHands}%`}}></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'zh' 
                  ? '选择经典牌面或输入自定义牌面开始分析' 
                  : 'Select a classic board or enter custom board to start analysis'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 历史复盘组件
function HandHistory({ language }: { language: 'zh' | 'en' }) {
  const [uploadedHands, setUploadedHands] = useState<any[]>([]);
  const [selectedHand, setSelectedHand] = useState<any>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [filterType, setFilterType] = useState('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 模拟手牌历史数据
  const mockHandHistory = [
    {
      id: 1,
      date: '2024-01-15 14:30',
      position: 'BTN',
      holeCards: ['Ah', 'Ks'],
      board: ['Qh', 'Jd', '9s', '8c', '7h'],
      action: '加注-跟注-加注',
      pot: 45.5,
      result: -12.5,
      stakes: 'NL25',
      gtoDeviation: 15,
      street: 'river',
      mistake: true
    },
    {
      id: 2,
      date: '2024-01-15 15:45',
      position: 'CO',
      holeCards: ['Kd', 'Qc'],
      board: ['Ac', '8h', '3d'],
      action: '加注-弃牌',
      pot: 8.0,
      result: -3.0,
      stakes: 'NL25',
      gtoDeviation: 5,
      street: 'flop',
      mistake: false
    },
    {
      id: 3,
      date: '2024-01-15 16:20',
      position: 'SB',
      holeCards: ['9h', '9c'],
      board: ['Td', '5s', '2h', 'Jc'],
      action: '跟注-加注-跟注',
      pot: 28.5,
      result: +15.5,
      stakes: 'NL25',
      gtoDeviation: 8,
      street: 'turn',
      mistake: false
    }
  ];

  React.useEffect(() => {
    setUploadedHands(mockHandHistory);
  }, []);

  const analyzeHand = (hand: any) => {
    setSelectedHand(hand);
    setIsAnalyzing(true);
    
    setTimeout(() => {
      const mockAnalysis = {
        handId: hand.id,
        gtoAction: {
          street: hand.street,
          recommendedAction: language === 'zh' ? '跟注' : 'Call',
          actualAction: language === 'zh' ? '加注' : 'Raise',
          evDifference: -2.3,
          reasoning: language === 'zh' 
            ? '在这个位置和牌面上，跟注比加注的EV更高，因为对手的范围很强'
            : 'In this position and board, calling has higher EV than raising due to opponent\'s strong range'
        },
        mistakes: [
          {
            street: 'river',
            error: language === 'zh' ? '过度加注' : 'Over-aggressive betting',
            impact: -2.3,
            suggestion: language === 'zh' 
              ? '应该考虑跟注或者过牌，而不是加注'
              : 'Should consider calling or checking instead of raising'
          }
        ],
        leaks: [
          {
            type: language === 'zh' ? '河牌过度加注' : 'River over-betting',
            frequency: '18%',
            costPerHand: -1.2,
            suggestion: language === 'zh' 
              ? '在河牌上需要更加谨慎的加注频率'
              : 'Need more cautious betting frequency on river'
          }
        ],
        alternativeLines: [
          {
            action: language === 'zh' ? '跟注' : 'Call',
            ev: +0.8,
            description: language === 'zh' 
              ? '简单跟注可以减少方差并保持一定收益'
              : 'Simple call reduces variance while maintaining some profit'
          },
          {
            action: language === 'zh' ? '过牌' : 'Check',
            ev: -0.2,
            description: language === 'zh' 
              ? '过牌可以避免被反加并控制底池'
              : 'Checking avoids getting raised and controls pot size'
          }
        ]
      };
      
      setAnalysisResults(mockAnalysis);
      setIsAnalyzing(false);
    }, 2000);
  };

  const filteredHands = uploadedHands.filter(hand => {
    switch(filterType) {
      case 'mistakes': return hand.mistake;
      case 'winning': return hand.result > 0;
      case 'losing': return hand.result < 0;
      default: return true;
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 在真实应用中，这里会解析手牌历史文件
      alert(language === 'zh' ? '文件上传成功！这里使用模拟数据展示。' : 'File uploaded successfully! Using mock data for demonstration.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'zh' ? '历史手牌复盘' : 'Hand History Review'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'zh' 
              ? 'AI分析你的历史手牌，找出漏洞并提供改进建议' 
              : 'AI analyzes your hand history to find leaks and provide improvement suggestions'}
          </p>
        </div>
        
        {/* 上传按钮 */}
        <div>
          <input
            type="file"
            accept=".txt,.csv,.json"
            onChange={handleFileUpload}
            className="hidden"
            id="hand-history-upload"
          />
          <label
            htmlFor="hand-history-upload"
            className="cursor-pointer px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-colors"
          >
            {language === 'zh' ? '上传历史' : 'Upload History'}
          </label>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {language === 'zh' ? '过滤:' : 'Filter:'}
        </span>
        {[
          { key: 'all', label: language === 'zh' ? '全部' : 'All' },
          { key: 'mistakes', label: language === 'zh' ? '错误' : 'Mistakes' },
          { key: 'winning', label: language === 'zh' ? '赢牌' : 'Winning' },
          { key: 'losing', label: language === 'zh' ? '输牌' : 'Losing' }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setFilterType(filter.key)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              filterType === filter.key
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 手牌列表 */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {language === 'zh' ? '手牌列表' : 'Hand List'} ({filteredHands.length})
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredHands.map((hand) => (
              <button
                key={hand.id}
                onClick={() => analyzeHand(hand)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                  selectedHand?.id === hand.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                } ${
                  hand.mistake ? 'border-l-4 border-l-red-500' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono font-bold">
                      {hand.holeCards.join('')}
                    </span>
                    <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {hand.position}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {hand.stakes}
                    </span>
                  </div>
                  
                  <div className={`text-sm font-semibold ${
                    hand.result > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {hand.result > 0 ? '+' : ''}{hand.result}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                  <span>{hand.date}</span>
                  <div className="flex items-center space-x-2">
                    {hand.mistake && (
                      <span className="text-red-500 text-xs">
                        {language === 'zh' ? '错误' : 'Mistake'}
                      </span>
                    )}
                    <span>GTO偏差: {hand.gtoDeviation}%</span>
                  </div>
                </div>
                
                <div className="mt-2 text-sm text-gray-500">
                  {language === 'zh' ? '牌面' : 'Board'}: {hand.board.join(' ')}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 分析结果 */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            {language === 'zh' ? 'AI分析结果' : 'AI Analysis Results'}
          </h3>
          
          {isAnalyzing ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  {language === 'zh' ? 'AI正在分析手牌...' : 'AI is analyzing the hand...'}
                </p>
              </div>
            </div>
          ) : analysisResults ? (
            <div className="space-y-4">
              {/* GTO对比 */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {language === 'zh' ? 'GTO对比' : 'GTO Comparison'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'zh' ? '推荐行动' : 'Recommended Action'}:
                    </span>
                    <span className="font-medium text-green-600">
                      {analysisResults.gtoAction.recommendedAction}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'zh' ? '实际行动' : 'Actual Action'}:
                    </span>
                    <span className="font-medium text-red-600">
                      {analysisResults.gtoAction.actualAction}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      EV差异:
                    </span>
                    <span className="font-medium text-red-600">
                      {analysisResults.gtoAction.evDifference.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-600 rounded text-sm">
                  {analysisResults.gtoAction.reasoning}
                </div>
              </div>

              {/* 错误分析 */}
              {analysisResults.mistakes.length > 0 && (
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    {language === 'zh' ? '错误分析' : 'Mistake Analysis'}
                  </h4>
                  
                  {analysisResults.mistakes.map((mistake: any, index: number) => (
                    <div key={index} className="border-l-4 border-red-500 pl-4 mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-red-600">{mistake.error}</span>
                        <span className="text-sm text-red-500">-{Math.abs(mistake.impact).toFixed(2)} EV</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {mistake.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* 替代方案 */}
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  {language === 'zh' ? '替代方案' : 'Alternative Lines'}
                </h4>
                
                <div className="space-y-2">
                  {analysisResults.alternativeLines.map((line: any, index: number) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-600 rounded">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{line.action}</span>
                        <span className={`text-sm font-medium ${
                          line.ev > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {line.ev > 0 ? '+' : ''}{line.ev.toFixed(2)} EV
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {line.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 漏洞统计 */}
              {analysisResults.leaks.length > 0 && (
                <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    {language === 'zh' ? '漏洞统计' : 'Leak Statistics'}
                  </h4>
                  
                  {analysisResults.leaks.map((leak: any, index: number) => (
                    <div key={index} className="border-l-4 border-yellow-500 pl-4 mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-yellow-600">{leak.type}</span>
                        <div className="text-sm">
                          <span className="text-gray-500">{leak.frequency}</span>
                          <span className="ml-2 text-red-500">{leak.costPerHand}/手</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {leak.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : selectedHand ? (
            <div className="text-center py-12">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  {language === 'zh' ? '准备分析...' : 'Preparing analysis...'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'zh' 
                  ? '选择一手牌进行AI分析' 
                  : 'Select a hand for AI analysis'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}