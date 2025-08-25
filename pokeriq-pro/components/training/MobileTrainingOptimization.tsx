'use client';

import React, { useState } from 'react';
import { 
  Play,
  ChevronUp,
  ChevronDown,
  Menu,
  X,
  Target,
  Brain,
  Star,
  Clock
} from 'lucide-react';

interface MobileTrainingOptimizationProps {
  children: React.ReactNode;
  showProgressPanel: boolean;
  onToggleProgressPanel: () => void;
}

export const MobileTrainingOptimization: React.FC<MobileTrainingOptimizationProps> = ({
  children,
  showProgressPanel,
  onToggleProgressPanel
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false);

  return (
    <div className="lg:hidden">
      {/* 移动端头部简化 */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI训练
          </h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleProgressPanel}
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* 移动端快捷统计 */}
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">L2</div>
            <div className="text-xs text-gray-500">等级</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">78%</div>
            <div className="text-xs text-gray-500">准确率</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">47</div>
            <div className="text-xs text-gray-500">今日手数</div>
          </div>
        </div>
      </div>

      {/* 快捷操作面板 */}
      {showQuickActions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white dark:bg-gray-800 rounded-t-2xl w-full p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">快捷操作</h3>
              <button
                onClick={() => setShowQuickActions(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <Play className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium text-green-800 dark:text-green-300">快速开始</div>
                  <div className="text-xs text-green-600 dark:text-green-400">15分钟快速训练</div>
                </div>
              </button>

              <button className="w-full flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <Target className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-blue-800 dark:text-blue-300">技能专项</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">针对性技能提升</div>
                </div>
              </button>

              <button className="w-full flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <Brain className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium text-purple-800 dark:text-purple-300">挑战模式</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">高难度对战</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主要内容 */}
      <div className="p-4">
        {children}
      </div>

      {/* 底部进展面板（可收缩） */}
      {showProgressPanel && (
        <div className="fixed bottom-20 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30">
          <button
            onClick={onToggleProgressPanel}
            className="w-full p-2 text-center border-b border-gray-200 dark:border-gray-700"
          >
            <ChevronDown className="w-5 h-5 mx-auto text-gray-400" />
          </button>
          
          <div className="p-4 max-h-64 overflow-y-auto">
            <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center">
              <Star className="w-4 h-4 mr-2 text-yellow-500" />
              今日进展
            </h4>
            
            <div className="space-y-3">
              {[
                { name: '翻牌前', progress: 25, level: 1 },
                { name: '翻牌后', progress: 15, level: 1 },
                { name: '诈唬', progress: 10, level: 1 }
              ].map((skill, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {skill.name} L{skill.level}
                  </span>
                  <div className="flex-1 mx-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div 
                      className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                      style={{width: `${skill.progress}%`}}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">{skill.progress}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 快速进展按钮（浮动） */}
      {!showProgressPanel && (
        <button
          onClick={onToggleProgressPanel}
          className="fixed bottom-24 right-4 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center z-30"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};