'use client';

import React, { useState } from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  Play,
  Target,
  Brain,
  CheckCircle,
  X,
  Star,
  Award,
  BookOpen
} from 'lucide-react';

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps = [
    {
      id: 'welcome',
      title: '欢迎来到PokerIQ Pro！',
      description: '我们将通过简短的教程帮你了解智能训练系统的核心功能',
      content: (
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-6xl">♠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            开始你的扑克进化之旅
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
            PokerIQ Pro 使用最先进的AI技术和GTO（游戏理论最优）策略，
            为你提供个性化的扑克训练体验。无论你是初学者还是高手，
            都能在这里找到提升的空间。
          </p>
        </div>
      )
    },
    {
      id: 'training_modes',
      title: '三种核心训练模式',
      description: '了解不同的训练模式，找到最适合你的学习路径',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Play className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-green-800 dark:text-green-300 text-center mb-2">
                快速开始
              </h3>
              <p className="text-sm text-green-700 dark:text-green-400 text-center">
                15分钟快速训练，适合新手入门
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-blue-800 dark:text-blue-300 text-center mb-2">
                技能专项
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 text-center">
                针对特定技能的深度训练
              </p>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-purple-800 dark:text-purple-300 text-center mb-2">
                挑战模式
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-400 text-center">
                高难度训练，适合进阶玩家
              </p>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700">
            <h4 className="font-bold text-yellow-800 dark:text-yellow-300 mb-2">💡 建议</h4>
            <p className="text-yellow-700 dark:text-yellow-400 text-sm">
              如果你是新手，强烈建议从"快速开始"模式入门，系统会自动调整难度。
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'gto_feedback',
      title: '实时GTO分析反馈',
      description: '了解如何利用AI的实时分析来提升你的决策质量',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-200 dark:border-green-700">
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-8 h-8 text-green-600 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-2">
                  🎯 GTO分析结果
                </h3>
                <p className="text-green-800 dark:text-green-300 mb-3">
                  在按钮位置拿着顺子听牌，加注是最优选择，可以获得价值并保护手牌。
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-green-700 dark:text-green-400">你的动作</div>
                    <div className="text-green-600">加注</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-700 dark:text-green-400">最优动作</div>
                    <div className="text-green-600">加注</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-700 dark:text-green-400">胜率</div>
                    <div className="text-green-600">78%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2">实时分析</h4>
              <p className="text-blue-700 dark:text-blue-400">
                每次决策后，AI会立即分析你的选择，告诉你是否最优
              </p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2">详细解释</h4>
              <p className="text-blue-700 dark:text-blue-400">
                不只告诉你对错，还会解释背后的逻辑和策略原因
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'skill_progression',
      title: '技能进展可视化',
      description: '追踪你的学习进度，看到每一次的成长',
      content: (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              你的技能概览
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: '综合水平', level: 2, progress: 35, color: 'purple' },
                { name: '翻牌前', level: 1, progress: 25, color: 'blue' },
                { name: '翻牌后', level: 1, progress: 15, color: 'green' },
                { name: '诈唬技巧', level: 1, progress: 10, color: 'orange' }
              ].map((skill, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 relative">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600"></div>
                    <div 
                      className="absolute inset-0 rounded-full border-3 border-blue-500"
                      style={{
                        background: `conic-gradient(from 0deg, #3b82f6 ${skill.progress * 3.6}deg, transparent 0deg)`
                      }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        L{skill.level}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                    {skill.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {skill.progress}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <Award className="w-6 h-6 text-green-600 mb-2" />
              <h4 className="font-bold text-green-800 dark:text-green-300 text-sm mb-1">
                成就系统
              </h4>
              <p className="text-green-700 dark:text-green-400 text-xs">
                解锁各种成就，获得额外奖励
              </p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
              <BookOpen className="w-6 h-6 text-green-600 mb-2" />
              <h4 className="font-bold text-green-800 dark:text-green-300 text-sm mb-1">
                学习建议
              </h4>
              <p className="text-green-700 dark:text-green-400 text-xs">
                AI根据你的表现推荐学习内容
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'get_started',
      title: '开始你的训练之旅',
      description: '现在你已经了解了核心功能，让我们开始第一次训练吧！',
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              准备好了吗？
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
              建议从"快速开始"模式开始你的第一次训练。
              系统会根据你的表现自动调整难度，确保你获得最佳的学习体验。
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2">
              🎯 你的第一个目标
            </h4>
            <p className="text-blue-700 dark:text-blue-400 text-sm">
              完成15手牌的训练，达到70%以上的决策准确率
            </p>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentTutorialStep = tutorialSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentTutorialStep.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {currentTutorialStep.description}
            </p>
          </div>
          <button
            onClick={onSkip}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 进度条 */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              第 {currentStep + 1} 步，共 {tutorialSteps.length} 步
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
            <div 
              className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
              style={{width: `${((currentStep + 1) / tutorialSteps.length) * 100}%`}}
            ></div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-8">
          {currentTutorialStep.content}
        </div>

        {/* 底部导航 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>上一步</span>
          </button>

          <div className="flex space-x-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-blue-600 w-6'
                    : index < currentStep
                    ? 'bg-blue-400'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              ></div>
            ))}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onSkip}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              跳过教程
            </button>
            <button
              onClick={nextStep}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              <span>
                {currentStep === tutorialSteps.length - 1 ? '开始训练' : '下一步'}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};