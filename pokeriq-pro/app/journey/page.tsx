'use client';

import React, { useState } from 'react';
import AppLayout from '@/src/components/layout/AppLayout';
import { 
  Lock, 
  CheckCircle, 
  PlayCircle, 
  Star, 
  Trophy,
  Zap,
  Target,
  Brain,
  TrendingUp,
  Users,
  ChevronRight,
  Crown,
  Sparkles,
  Award
} from 'lucide-react';

interface SkillNode {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  icon: React.ReactNode;
  level: number;
  xpReward: number;
  lessons: number;
  completedLessons: number;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  requiredNodes?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master';
  targetPage: 'study' | 'gto-training' | 'ai-training' | 'analytics' | 'achievements';
  learningGoals: string[];
}

export default function JourneyPage() {
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [userProgress, setUserProgress] = useState({
    level: 15,
    totalXP: 3420,
    completedNodes: 12,
    currentStreak: 7,
    totalPlayTime: 186
  });

  const skillTree: SkillNode[] = [
    // 初级路径
    {
      id: 'basics',
      title: '扑克基础',
      description: '学习德州扑克的基本规则和手牌排名',
      detailedDescription: '全面掌握德州扑克的基础知识，包括游戏规则、手牌强弱、下注结构等核心概念。这是所有扑克学习的基石，将在扑克学院中通过理论学习和互动练习来完成。',
      icon: <Star className="w-6 h-6" />,
      level: 1,
      xpReward: 100,
      lessons: 5,
      completedLessons: 5,
      status: 'completed',
      difficulty: 'beginner',
      targetPage: 'study',
      learningGoals: [
        '掌握德州扑克的基本规则和游戏流程',
        '理解手牌排名和强弱比较',
        '熟悉盲注、位置等基本概念',
        '学会基础的下注和行动选择'
      ]
    },
    {
      id: 'position',
      title: '位置策略',
      description: '理解位置优势和不同位置的打法',
      detailedDescription: '深入理解扑克桌上位置的重要性，学习如何利用位置优势制定策略。位置是扑克中最重要的概念之一，将在扑克学院中通过案例分析和实例演示来学习。',
      icon: <Target className="w-6 h-6" />,
      level: 2,
      xpReward: 150,
      lessons: 8,
      completedLessons: 8,
      status: 'completed',
      difficulty: 'beginner',
      targetPage: 'study',
      requiredNodes: ['basics'],
      learningGoals: [
        '理解早期、中期、后期位置的特点',
        '学会根据位置调整起手牌范围',
        '掌握位置相对强弱的判断',
        '学习如何利用位置优势获得信息'
      ]
    },
    {
      id: 'preflop',
      title: '翻前策略',
      description: '掌握起手牌选择和翻前加注策略',
      detailedDescription: '学习翻前阶段的核心策略，包括起手牌选择、加注尺度、3-bet和4-bet的基础应用。这是实战中最关键的技能之一，将在AI实战训练中通过大量的模拟对局来练习。',
      icon: <Brain className="w-6 h-6" />,
      level: 3,
      xpReward: 200,
      lessons: 10,
      completedLessons: 6,
      status: 'in-progress',
      difficulty: 'beginner',
      targetPage: 'ai-training',
      requiredNodes: ['position'],
      learningGoals: [
        '掌握各位置的起手牌范围',
        '学会合理的开局加注尺度',
        '理解何时跟注、何时弃牌',
        '掌握基础的翻前3-bet策略'
      ]
    },
    
    // 中级路径
    {
      id: 'pot-odds',
      title: '底池赔率',
      description: '计算底池赔率和期望值',
      detailedDescription: '掌握扑克中最重要的数学概念，学会快速计算底池赔率、隐含赔率和期望值。这些技能将帮助你做出更准确的决策，将在数据分析模块中通过数学工具和实例计算来学习。',
      icon: <TrendingUp className="w-6 h-6" />,
      level: 4,
      xpReward: 250,
      lessons: 12,
      completedLessons: 0,
      status: 'available',
      difficulty: 'intermediate',
      targetPage: 'analytics',
      requiredNodes: ['preflop'],
      learningGoals: [
        '掌握底池赔率的快速计算方法',
        '理解隐含赔率和反向隐含赔率',
        '学会运用期望值分析决策',
        '掌握outs计算和胜率评估'
      ]
    },
    {
      id: 'betting-patterns',
      title: '下注模式',
      description: '识别和利用对手的下注模式',
      detailedDescription: '学习读取对手的下注模式和行为特征，识别不同类型玩家的打法风格。通过AI实战训练，你将在真实的对局环境中练习观察和利用对手的弱点。',
      icon: <Users className="w-6 h-6" />,
      level: 5,
      xpReward: 300,
      lessons: 15,
      completedLessons: 0,
      status: 'available',
      difficulty: 'intermediate',
      targetPage: 'ai-training',
      requiredNodes: ['pot-odds'],
      learningGoals: [
        '识别紧凶、松凶、紧弱、松弱等玩家类型',
        '学会观察下注尺度和时间的tell',
        '掌握针对不同对手的调整策略',
        '理解位置对下注模式的影响'
      ]
    },
    {
      id: '3bet-strategy',
      title: '3-Bet策略',
      description: '高级的3-bet和4-bet策略',
      detailedDescription: '深入学习翻前3-bet和4-bet的高级应用，包括价值3-bet、诈唬3-bet的平衡，以及面对3-bet时的最优应对策略。在AI实战训练中通过大量练习掌握这些高级技巧。',
      icon: <Zap className="w-6 h-6" />,
      level: 6,
      xpReward: 350,
      lessons: 10,
      completedLessons: 0,
      status: 'locked',
      difficulty: 'intermediate',
      targetPage: 'ai-training',
      requiredNodes: ['betting-patterns'],
      learningGoals: [
        '掌握3-bet的价值范围和诈唬范围',
        '学会根据对手调整3-bet频率',
        '理解4-bet的时机和尺度选择',
        '掌握面对aggression时的防守策略'
      ]
    },
    
    // 高级路径
    {
      id: 'gto-basics',
      title: 'GTO基础',
      description: '博弈论最优策略入门',
      detailedDescription: '学习Game Theory Optimal（GTO）的核心概念，理解均衡策略在扑克中的应用。在GTO训练中心中通过专业工具和模拟器学习最优打法，让你的策略更加科学和无懈可击。',
      icon: <Award className="w-6 h-6" />,
      level: 7,
      xpReward: 500,
      lessons: 20,
      completedLessons: 0,
      status: 'locked',
      difficulty: 'advanced',
      targetPage: 'gto-training',
      requiredNodes: ['3bet-strategy'],
      learningGoals: [
        '理解GTO的基本概念和优势',
        '掌握翻牌纹理和范围构建',
        '学会使用solver工具进行分析',
        '能够在实战中应用GTO原理'
      ]
    },
    {
      id: 'exploitation',
      title: '剥削策略',
      description: '识别和剥削对手的弱点',
      detailedDescription: '在掌握GTO基础后，学会如何针对具体对手的弱点进行剥削。通过AI实战训练，你将学会在不同对手面前灵活调整策略，获得更高的胜率和盈利。',
      icon: <Target className="w-6 h-6" />,
      level: 8,
      xpReward: 600,
      lessons: 18,
      completedLessons: 0,
      status: 'locked',
      difficulty: 'advanced',
      targetPage: 'ai-training',
      requiredNodes: ['gto-basics'],
      learningGoals: [
        '学会快速识别对手类型和弱点',
        '掌握针对性调整策略的方法',
        '理解何时偏离 GTO，何时坚持均衡',
        '能够在实战中灵活应用剥削策略'
      ]
    },
    {
      id: 'tournament',
      title: '锦标赛策略',
      description: 'MTT和SNG的专业打法',
      detailedDescription: '专为锦标赛设计的高级策略，包括ICM模型、泡沫阶段策略、终桥游戏等。通过AI实战训练模拟真实的锦标赛环境，让你在各种条件下都能做出最优决策。',
      icon: <Trophy className="w-6 h-6" />,
      level: 9,
      xpReward: 750,
      lessons: 25,
      completedLessons: 0,
      status: 'locked',
      difficulty: 'advanced',
      targetPage: 'ai-training',
      requiredNodes: ['exploitation'],
      learningGoals: [
        '掌握ICM模型和锐码价值计算',
        '学会泡沫阶段的保存策略',
        '理解终桥游戏的特殊考量',
        '能够针对不同阶段调整打法'
      ]
    },
    
    // 大师路径
    {
      id: 'mental-game',
      title: '心理博弈',
      description: '掌握扑克心理学和情绪控制',
      detailedDescription: '扑克的最高境界是心理博弈。学习如何管理情绪、应对压力、保持冷静的判断力。在AI实战训练中通过模拟高压情况，训练你的心理素质和抗压能力。',
      icon: <Brain className="w-6 h-6" />,
      level: 10,
      xpReward: 1000,
      lessons: 15,
      completedLessons: 0,
      status: 'locked',
      difficulty: 'master',
      targetPage: 'ai-training',
      requiredNodes: ['tournament'],
      learningGoals: [
        '学会管理Tilt和情绪波动',
        '掌握资金管理和风险控制',
        '理解心理游戏和Bluffing的艺术',
        '培养镇定和耐心的比赛心态'
      ]
    },
    {
      id: 'pro-masterclass',
      title: '职业大师课',
      description: '成为职业牌手的终极指南',
      detailedDescription: '扑克学习的终极课程，涵盖职业级别的所有技能和知识。从高级策略到职业规划，从在线扑克到现场比赛，全面提升你的综合实力。通过AI实战训练的高强度练习，让你具备职业牌手的水平。',
      icon: <Crown className="w-6 h-6" />,
      level: 11,
      xpReward: 2000,
      lessons: 30,
      completedLessons: 0,
      status: 'locked',
      difficulty: 'master',
      targetPage: 'ai-training',
      requiredNodes: ['mental-game'],
      learningGoals: [
        '掌握职业级别的高级策略和技巧',
        '学会职业生涯规划和资金管理',
        '理解现场比赛和在线扑克的差异',
        '具备在各种环境下竞争的能力'
      ]
    }
  ];

  const difficultyColors = {
    beginner: 'from-green-400 to-emerald-500',
    intermediate: 'from-blue-400 to-indigo-500',
    advanced: 'from-purple-400 to-pink-500',
    master: 'from-yellow-400 to-orange-500'
  };

  const difficultyLabels = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级',
    master: '大师'
  };

  const handleNodeClick = (node: SkillNode) => {
    if (node.status !== 'locked') {
      setSelectedNode(node);
    }
  };

  const handleStartLesson = () => {
    if (selectedNode) {
      // 根据节点的targetPage属性决定跳转路径
      let targetPath = '/ai-training'; // 默认路径
      
      switch (selectedNode.targetPage) {
        case 'study':
          targetPath = '/study';
          break;
        case 'gto-training':
          targetPath = '/gto-training';
          break;
        case 'analytics':
          targetPath = '/analytics';
          break;
        case 'achievements':
          targetPath = '/achievements';
          break;
        case 'ai-training':
        default:
          targetPath = '/ai-training';
          break;
      }
      
      // 添加页面导航提示
      const pageNames = {
        '/study': '扑克学院',
        '/gto-training': 'GTO训练中心',
        '/analytics': '数据分析',
        '/achievements': '成就系统',
        '/ai-training': 'AI实战训练'
      };
      
      console.log(`即将跳转到${pageNames[targetPath]}学习: ${selectedNode.title}`);
      window.location.href = `${targetPath}?lesson=${selectedNode.id}&title=${encodeURIComponent(selectedNode.title)}`;
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen max-w-full">
        {/* 页面标题和统计 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                学习之旅
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                系统化学习德州扑克，从新手到职业
              </p>
            </div>
            
            {/* 进度统计 */}
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{userProgress.completedNodes}</p>
                <p className="text-sm text-gray-500">已完成</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">{userProgress.currentStreak}🔥</p>
                <p className="text-sm text-gray-500">连续天数</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-500">{userProgress.totalXP}</p>
                <p className="text-sm text-gray-500">总经验</p>
              </div>
            </div>
          </div>

          {/* 当前目标提示 */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Sparkles className="w-8 h-8" />
                <div>
                  <p className="font-semibold text-lg">今日目标</p>
                  <p className="text-sm opacity-90">完成"翻前策略"章节，获得200 XP</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors">
                继续学习
              </button>
            </div>
          </div>
        </div>

        {/* 技能树展示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {skillTree.map((node) => (
            <div
              key={node.id}
              onClick={() => handleNodeClick(node)}
              className={`
                relative p-6 rounded-xl border-2 transition-all cursor-pointer
                ${node.status === 'locked' 
                  ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 opacity-60' 
                  : node.status === 'completed'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600'
                  : node.status === 'in-progress'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 ring-2 ring-blue-400 ring-offset-2'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg'
                }
              `}
            >
              {/* 状态图标 */}
              {node.status === 'locked' && (
                <div className="absolute -top-3 -right-3">
                  <Lock className="w-6 h-6 text-gray-400" />
                </div>
              )}
              {node.status === 'completed' && (
                <div className="absolute -top-3 -right-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              )}
              {node.status === 'in-progress' && (
                <div className="absolute -top-3 -right-3">
                  <PlayCircle className="w-6 h-6 text-blue-500 animate-pulse" />
                </div>
              )}

              {/* 难度标签和目标页面 */}
              <div className="mb-3 flex items-center justify-between">
                <span className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white
                  bg-gradient-to-r ${difficultyColors[node.difficulty]}
                `}>
                  {difficultyLabels[node.difficulty]}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {node.targetPage === 'study' ? '扑克学院' :
                   node.targetPage === 'gto-training' ? 'GTO中心' :
                   node.targetPage === 'analytics' ? '数据分析' :
                   node.targetPage === 'achievements' ? '成就系统' :
                   'AI训练'}
                </span>
              </div>

              {/* 图标和标题 */}
              <div className="flex items-center space-x-3 mb-3">
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center
                  bg-gradient-to-br ${difficultyColors[node.difficulty]}
                `}>
                  <div className="text-white">
                    {node.icon}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {node.title}
                  </h3>
                  <p className="text-xs text-gray-500">Level {node.level}</p>
                </div>
              </div>

              {/* 描述 */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {node.description}
              </p>

              {/* 进度条 */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>进度</span>
                  <span>{node.completedLessons}/{node.lessons} 课程</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`
                      h-full transition-all duration-500
                      bg-gradient-to-r ${difficultyColors[node.difficulty]}
                    `}
                    style={{ width: `${(node.completedLessons / node.lessons) * 100}%` }}
                  />
                </div>
              </div>

              {/* XP奖励 */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  奖励
                </span>
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {node.xpReward} XP
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 选中节点的详细面板 */}
        {selectedNode && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* 头部 */}
              <div className={`
                p-6 text-white
                bg-gradient-to-r ${difficultyColors[selectedNode.difficulty]}
              `}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                      {selectedNode.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedNode.title}</h2>
                      <p className="text-white/80">Level {selectedNode.level}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedNode(null)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-white/90 mb-3">{selectedNode.description}</p>
                <p className="text-white/80 text-sm">{selectedNode.detailedDescription}</p>
              </div>

              {/* 内容 */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {/* 课程列表 */}
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  课程内容
                </h3>
                <div className="space-y-3 mb-6">
                  {Array.from({ length: Math.min(5, selectedNode.lessons) }).map((_, i) => (
                    <div 
                      key={i}
                      className={`
                        flex items-center space-x-3 p-3 rounded-lg
                        ${i < selectedNode.completedLessons 
                          ? 'bg-green-50 dark:bg-green-900/20' 
                          : 'bg-gray-50 dark:bg-gray-800'
                        }
                      `}
                    >
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        ${i < selectedNode.completedLessons 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-500'
                        }
                      `}>
                        {i < selectedNode.completedLessons ? '✓' : i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          第{i + 1}课：{
                            i === 0 ? '基础概念' :
                            i === 1 ? '实战演练' :
                            i === 2 ? '高级技巧' :
                            i === 3 ? '案例分析' :
                            '综合练习'
                          }
                        </p>
                        <p className="text-sm text-gray-500">
                          预计时间：15分钟
                        </p>
                      </div>
                      {i < selectedNode.completedLessons && (
                        <span className="text-green-500 font-medium">+20 XP</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* 学习目标 */}
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  学习目标
                </h3>
                <ul className="space-y-2 mb-6">
                  {selectedNode.learningGoals.map((goal, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {goal}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* 奖励 */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    完成奖励
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-1" />
                      <p className="text-sm font-bold">{selectedNode.xpReward} XP</p>
                    </div>
                    <div className="text-center">
                      <Trophy className="w-8 h-8 text-orange-500 mx-auto mb-1" />
                      <p className="text-sm font-bold">新成就</p>
                    </div>
                    <div className="text-center">
                      <Star className="w-8 h-8 text-purple-500 mx-auto mb-1" />
                      <p className="text-sm font-bold">技能点+1</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部操作 */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">预计完成时间：</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.ceil((selectedNode.lessons - selectedNode.completedLessons) * 15)} 分钟
                    </span>
                  </div>
                  <button
                    onClick={handleStartLesson}
                    disabled={selectedNode.status === 'locked'}
                    className={`
                      px-6 py-3 rounded-lg font-medium transition-all flex items-center space-x-2
                      ${selectedNode.status === 'locked'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                      }
                    `}
                  >
                    <span>
                      {selectedNode.status === 'in-progress' ? '继续学习' :
                       selectedNode.status === 'completed' ? '复习' :
                       '开始学习'}
                      {selectedNode.status !== 'locked' && (
                        <span className="ml-1 text-xs opacity-80">
                          (前往{selectedNode.targetPage === 'study' ? '扑克学院' :
                                selectedNode.targetPage === 'gto-training' ? 'GTO训练中心' :
                                selectedNode.targetPage === 'analytics' ? '数据分析' :
                                selectedNode.targetPage === 'achievements' ? '成就系统' :
                                'AI实战训练'})
                        </span>
                      )}
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}