'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/src/components/layout/AppLayout';
import { WelcomeInterface } from '../../components/training/WelcomeInterface';
import { QuickTrainingInterface } from '../../components/training/QuickTrainingInterface';
import { TrainingProgressPanel } from '../../components/training/TrainingProgressPanel';
import { GTOFeedbackPanel } from '../../components/training/GTOFeedbackPanel';
import { PersonalizedRecommendations } from '../../components/training/PersonalizedRecommendations';
import { OnboardingTutorial } from '../../components/onboarding/OnboardingTutorial';
import { MobileTrainingOptimization } from '../../components/training/MobileTrainingOptimization';
import { PokerTrainingEngine, GameAction, GamePlayer, Card, GameState } from '../../src/lib/training/poker-engine';
import { 
  Play, 
  Brain,
  TrendingUp, 
  Target,
  Award,
  Star,
  Zap,
  BookOpen,
  BarChart3,
  Clock,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

// 核心训练模式 - 简化为3个主要模式
type CoreTrainingMode = 
  | 'quick-start'     // 快速开始 - 适合新用户
  | 'skill-focus'     // 技能专项 - 针对特定技能
  | 'challenge'       // 挑战模式 - 高难度训练

// 简化的学习状态
interface SimplifiedLearningState {
  mode: CoreTrainingMode;
  currentSession: {
    handsPlayed: number;
    accuracy: number;
    focusSkill: string;
    timeSpent: number;
  };
  isActive: boolean;
  showTutorial: boolean;
}

// 核心技能数据
interface CoreSkillData {
  preflop: { level: number; progress: number; };
  postflop: { level: number; progress: number; };
  bluffing: { level: number; progress: number; };
  overall: { level: number; progress: number; };
}

export default function AITrainingPage() {
  // 核心状态管理 - 简化为最重要的状态
  const [learningState, setLearningState] = useState<SimplifiedLearningState>({
    mode: 'quick-start',
    currentSession: {
      handsPlayed: 0,
      accuracy: 0,
      focusSkill: 'overall',
      timeSpent: 0
    },
    isActive: false,
    showTutorial: true
  });

  // 核心技能数据
  const [skillData, setSkillData] = useState<CoreSkillData>({
    preflop: { level: 1, progress: 25 },
    postflop: { level: 1, progress: 15 },
    bluffing: { level: 1, progress: 10 },
    overall: { level: 2, progress: 35 }
  });

  // UI状态
  const [activePanel, setActivePanel] = useState<'training' | 'progress' | 'recommendations'>('training');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [showMobileProgress, setShowMobileProgress] = useState(false);
  
  // 训练数据
  const [todayStats, setTodayStats] = useState({
    handsPlayed: 47,
    accuracy: 78,
    timeSpent: 23,
    skillPoints: 125
  });

  // 核心功能函数
  const startTraining = (mode: CoreTrainingMode) => {
    setLearningState(prev => ({
      ...prev,
      mode,
      isActive: true,
      currentSession: {
        handsPlayed: 0,
        accuracy: 0,
        focusSkill: mode === 'skill-focus' ? 'preflop' : 'overall',
        timeSpent: 0
      }
    }));
    setSessionActive(true);
    setActivePanel('training');
  };

  const startOnboarding = () => {
    setShowOnboarding(true);
    setLearningState(prev => ({ ...prev, showTutorial: true }));
  };

  return (
    <>
      {/* 移动端优化界面 */}
      <div className="block lg:hidden">
        <MobileTrainingOptimization 
          showProgressPanel={showMobileProgress}
          onToggleProgressPanel={() => setShowMobileProgress(!showMobileProgress)}
        >
          {!sessionActive ? (
            <WelcomeInterface 
              onStartTraining={startTraining}
              onStartOnboarding={startOnboarding}
              skillData={skillData}
              todayStats={todayStats}
            />
          ) : (
            <QuickTrainingInterface 
              learningState={learningState}
              onSessionComplete={() => setSessionActive(false)}
            />
          )}
        </MobileTrainingOptimization>
      </div>

      {/* 桌面端界面 */}
      <div className="hidden lg:block">
        <AppLayout>
          <div className="min-h-screen max-w-7xl mx-auto">
            {/* 页面头部 - 简化设计 */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                    AI实战训练
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    智能训练系统，15分钟快速提升决策能力
                  </p>
                </div>
                
                {/* 核心数据展示 - 最多3个关键指标 */}
                <div className="hidden lg:flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                      {skillData.overall.level}
                    </div>
                    <div className="text-sm text-gray-500">总体等级</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500 mb-1">
                      {todayStats.accuracy}%
                    </div>
                    <div className="text-sm text-gray-500">今日准确率</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-500 mb-1">
                      {todayStats.handsPlayed}
                    </div>
                    <div className="text-sm text-gray-500">今日手数</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 主要内容区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左侧：核心训练界面 (2/3 宽度) */}
              <div className="lg:col-span-2">
                {!sessionActive ? (
                  <WelcomeInterface 
                    onStartTraining={startTraining}
                    onStartOnboarding={startOnboarding}
                    skillData={skillData}
                    todayStats={todayStats}
                  />
                ) : (
                  <QuickTrainingInterface 
                    learningState={learningState}
                    onSessionComplete={() => setSessionActive(false)}
                  />
                )}
              </div>

              {/* 右侧：辅助面板 (1/3 宽度) */}
              <div className="space-y-6">
                {/* 技能进展面板 */}
                <TrainingProgressPanel 
                  skillData={skillData}
                  todayStats={todayStats}
                  compact={true}
                />
                
                {/* 个性化推荐 */}
                <PersonalizedRecommendations 
                  userLevel={skillData.overall.level}
                  recentPerformance={todayStats.accuracy}
                />
              </div>
            </div>

            {/* 引导教程 */}
            {showOnboarding && (
              <OnboardingTutorial 
                onComplete={() => setShowOnboarding(false)}
                onSkip={() => setShowOnboarding(false)}
              />
            )}
          </div>
        </AppLayout>
      </div>
    </>
  );
}