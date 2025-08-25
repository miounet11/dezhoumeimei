'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, X, Sparkles, Target, Trophy, BarChart3, Zap } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string; // CSS选择器，用于高亮目标元素
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '欢迎来到 PokerIQ Pro！',
    description: '让我们快速了解平台的核心功能，助您成为德州扑克高手。',
    icon: <Sparkles className="w-8 h-8 text-yellow-500" />
  },
  {
    id: 'training',
    title: 'AI智能训练',
    description: '与15种不同风格的AI对手对战，实时获得策略建议和决策分析。',
    icon: <Target className="w-8 h-8 text-blue-500" />,
    target: '[data-tour="training"]',
    position: 'bottom'
  },
  {
    id: 'analytics',
    title: '数据分析中心',
    description: '深度分析您的游戏数据，包括VPIP、PFR、AF等专业指标。',
    icon: <BarChart3 className="w-8 h-8 text-green-500" />,
    target: '[data-tour="analytics"]',
    position: 'bottom'
  },
  {
    id: 'achievements',
    title: '成就系统',
    description: '解锁成就，追踪进度，从新手到传奇的10年成长之路。',
    icon: <Trophy className="w-8 h-8 text-purple-500" />,
    target: '[data-tour="achievements"]',
    position: 'bottom'
  },
  {
    id: 'start',
    title: '准备开始了！',
    description: '现在您已经了解了基础功能，让我们开始您的扑克之旅吧！',
    icon: <Zap className="w-8 h-8 text-orange-500" />
  }
];

interface OnboardingFlowProps {
  onComplete?: () => void;
  autoStart?: boolean;
}

export default function OnboardingFlow({ onComplete, autoStart = true }: OnboardingFlowProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // 检查是否已完成引导
    const hasCompleted = localStorage.getItem('onboarding_completed');
    if (!hasCompleted && autoStart) {
      setTimeout(() => setIsActive(true), 1000);
    }
  }, [autoStart]);

  useEffect(() => {
    if (isActive) {
      const step = onboardingSteps[currentStep];
      if (step.target) {
        const element = document.querySelector(step.target) as HTMLElement;
        if (element) {
          setHighlightedElement(element);
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // 添加高亮效果
          element.classList.add('onboarding-highlight');
        }
      }
    }

    return () => {
      if (highlightedElement) {
        highlightedElement.classList.remove('onboarding-highlight');
      }
    };
  }, [currentStep, isActive]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    if (window.confirm('确定要跳过新手引导吗？您可以随时在设置中重新启动。')) {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setIsActive(false);
    onComplete?.();
    
    // 清除高亮
    if (highlightedElement) {
      highlightedElement.classList.remove('onboarding-highlight');
    }
  };

  if (!isActive) return null;

  const currentStepData = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  return (
    <>
      {/* 背景遮罩 */}
      <div className="fixed inset-0 bg-black/50 z-[9998] transition-opacity" />
      
      {/* 引导卡片 */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 pointer-events-auto animate-slide-up">
          {/* 进度条 */}
          <div className="h-2 bg-gray-200 rounded-t-2xl overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-8">
            {/* 关闭按钮 */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 图标 */}
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                {currentStepData.icon}
              </div>
            </div>

            {/* 内容 */}
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-4">
              {currentStepData.title}
            </h3>
            <p className="text-gray-600 text-center mb-8">
              {currentStepData.description}
            </p>

            {/* 操作按钮 */}
            <div className="flex gap-4">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  上一步
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition flex items-center justify-center gap-2"
              >
                {currentStep === onboardingSteps.length - 1 ? '开始使用' : '下一步'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 步骤指示器 */}
            <div className="flex justify-center gap-2 mt-6">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep 
                      ? 'w-8 bg-green-600' 
                      : index < currentStep 
                      ? 'bg-green-400' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 样式 */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }

        .onboarding-highlight {
          position: relative;
          z-index: 10000 !important;
          box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.4), 0 0 20px rgba(34, 197, 94, 0.3) !important;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .onboarding-highlight::after {
          content: '';
          position: absolute;
          inset: -4px;
          border: 2px solid rgb(34, 197, 94);
          border-radius: 10px;
          pointer-events: none;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </>
  );
}