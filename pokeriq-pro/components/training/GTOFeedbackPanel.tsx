'use client';

import React, { useState } from 'react';
import { 
  Brain,
  CheckCircle,
  AlertTriangle,
  X,
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  Eye,
  Lightbulb,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface GTOFeedbackPanelProps {
  feedback: {
    action: string;
    optimal: boolean;
    explanation: string;
    equity: number;
    evGain: number;
    optimalAction: string;
    alternatives: Array<{
      action: string;
      equity: number;
      frequency: number;
    }>;
    reasoning: {
      position: string;
      boardTexture: string;
      handStrength: string;
      opponentTendencies: string;
    };
  };
  onClose?: () => void;
  compact?: boolean;
}

export const GTOFeedbackPanel: React.FC<GTOFeedbackPanelProps> = ({
  feedback,
  onClose,
  compact = false
}) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'alternatives' | 'reasoning'>('analysis');

  const getPerformanceColor = (optimal: boolean) => {
    return optimal 
      ? 'from-green-500 to-emerald-600' 
      : 'from-orange-500 to-red-600';
  };

  const getPerformanceIcon = (optimal: boolean) => {
    return optimal 
      ? <CheckCircle className="w-6 h-6 text-green-600" />
      : <AlertTriangle className="w-6 h-6 text-orange-600" />;
  };

  const renderAnalysisTab = () => (
    <div className="space-y-4">
      {/* 主要结果 */}
      <div className={`p-4 rounded-xl bg-gradient-to-r ${getPerformanceColor(feedback.optimal)} text-white`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getPerformanceIcon(feedback.optimal)}
            <div>
              <h3 className="text-xl font-bold">
                {feedback.optimal ? '决策正确!' : '可以优化'}
              </h3>
              <p className="text-sm opacity-90">
                {feedback.optimal ? '你的选择符合GTO策略' : '有更好的选择'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{feedback.equity}%</div>
            <div className="text-sm opacity-90">胜率</div>
          </div>
        </div>
      </div>

      {/* 详细分析 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center">
          <Brain className="w-5 h-5 mr-2 text-purple-500" />
          GTO分析详情
        </h4>
        
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="text-gray-600 dark:text-gray-400 mb-1">你的选择</div>
              <div className="font-bold text-gray-900 dark:text-white">{feedback.action}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="text-gray-600 dark:text-gray-400 mb-1">最优选择</div>
              <div className="font-bold text-green-600">{feedback.optimalAction}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="text-gray-600 dark:text-gray-400 mb-1">EV变化</div>
              <div className={`font-bold ${feedback.evGain >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
                {feedback.evGain >= 0 ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                {feedback.evGain >= 0 ? '+' : ''}{feedback.evGain.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <h5 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center">
              <Lightbulb className="w-4 h-4 mr-2" />
              策略解释
            </h5>
            <p className="text-blue-700 dark:text-blue-400 text-sm leading-relaxed">
              {feedback.explanation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlternativesTab = () => (
    <div className="space-y-4">
      <h4 className="font-bold text-gray-900 dark:text-white flex items-center">
        <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
        所有选择的胜率分析
      </h4>
      
      <div className="space-y-3">
        {feedback.alternatives.map((alt, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className={`font-bold ${alt.action === feedback.action ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
                  {alt.action}
                  {alt.action === feedback.action && ' (你的选择)'}
                  {alt.action === feedback.optimalAction && ' (推荐)'}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  频率: {alt.frequency}%
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {alt.equity}%
                </span>
              </div>
            </div>
            
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div 
                className={`h-2 rounded-full ${
                  alt.action === feedback.optimalAction 
                    ? 'bg-green-500' 
                    : alt.action === feedback.action
                    ? 'bg-blue-500'
                    : 'bg-gray-400'
                }`}
                style={{width: `${alt.equity}%`}}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700">
        <p className="text-yellow-800 dark:text-yellow-300 text-sm">
          💡 <strong>理解频率:</strong> GTO策略并不总是选择单一动作，而是按一定频率混合使用不同动作来保持平衡。
        </p>
      </div>
    </div>
  );

  const renderReasoningTab = () => (
    <div className="space-y-4">
      <h4 className="font-bold text-gray-900 dark:text-white flex items-center">
        <Eye className="w-5 h-5 mr-2 text-purple-500" />
        深度分析
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h5 className="font-bold text-gray-900 dark:text-white mb-2">位置分析</h5>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {feedback.reasoning.position}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h5 className="font-bold text-gray-900 dark:text-white mb-2">牌面质地</h5>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {feedback.reasoning.boardTexture}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h5 className="font-bold text-gray-900 dark:text-white mb-2">手牌强度</h5>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {feedback.reasoning.handStrength}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h5 className="font-bold text-gray-900 dark:text-white mb-2">对手倾向</h5>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {feedback.reasoning.opponentTendencies}
          </p>
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
        <h5 className="font-bold text-purple-800 dark:text-purple-300 mb-2">学习要点</h5>
        <ul className="text-purple-700 dark:text-purple-400 text-sm space-y-1">
          <li>• 位置越晚，可以游戏的手牌范围越宽</li>
          <li>• 湿润牌面需要更谨慎，干燥牌面可以更激进</li>
          <li>• 根据对手的打法调整你的策略</li>
          <li>• 考虑长期期望值，而不只是当前手牌的强度</li>
        </ul>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className={`p-4 rounded-lg ${feedback.optimal ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} border`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getPerformanceIcon(feedback.optimal)}
            <div>
              <div className="font-bold text-sm">
                {feedback.optimal ? '决策正确' : '可以优化'}
              </div>
              <div className="text-xs text-gray-600">
                胜率: {feedback.equity}% | EV: {feedback.evGain >= 0 ? '+' : ''}{feedback.evGain.toFixed(1)}
              </div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
          <Brain className="w-6 h-6 mr-2 text-purple-500" />
          GTO 实时分析
        </h3>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 标签导航 */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'analysis', label: '分析结果', icon: <Target className="w-4 h-4" /> },
          { id: 'alternatives', label: '选择对比', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'reasoning', label: '深度解析', icon: <Eye className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/30'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        {activeTab === 'analysis' && renderAnalysisTab()}
        {activeTab === 'alternatives' && renderAlternativesTab()}
        {activeTab === 'reasoning' && renderReasoningTab()}
      </div>
    </div>
  );
};