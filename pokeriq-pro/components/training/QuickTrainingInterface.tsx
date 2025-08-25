'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause,
  RotateCcw,
  TrendingUp,
  Target,
  Clock,
  Award,
  Star,
  Brain,
  CheckCircle,
  X,
  ArrowRight
} from 'lucide-react';

interface QuickTrainingInterfaceProps {
  learningState: {
    mode: 'quick-start' | 'skill-focus' | 'challenge';
    currentSession: {
      handsPlayed: number;
      accuracy: number;
      focusSkill: string;
      timeSpent: number;
    };
    isActive: boolean;
    showTutorial: boolean;
  };
  onSessionComplete: () => void;
}

export const QuickTrainingInterface: React.FC<QuickTrainingInterfaceProps> = ({
  learningState,
  onSessionComplete
}) => {
  const [gamePhase, setGamePhase] = useState<'preparing' | 'playing' | 'feedback' | 'completed'>('preparing');
  const [currentHand, setCurrentHand] = useState({
    playerCards: ['A♠', 'K♠'],
    communityCards: ['Q♠', 'J♠', '10♥'],
    pot: 150,
    currentBet: 50,
    position: 'Button'
  });
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showGTOFeedback, setShowGTOFeedback] = useState(false);
  const [sessionProgress, setSessionProgress] = useState(65); // 模拟进度

  // 模拟训练数据
  const sessionData = {
    targetHands: 25,
    currentHand: 16,
    correctDecisions: 12,
    averageThinkTime: 8.2,
    skillGain: 15,
    gtoFeedback: {
      action: selectedAction,
      optimal: selectedAction === 'RAISE',
      explanation: '在按钮位置拿着顺子听牌，加注是最优选择，可以获得价值并保护手牌。',
      equity: 78,
      evGain: +2.3
    }
  };

  const actions = [
    { id: 'FOLD', label: '弃牌', color: 'red', hotkey: 'F' },
    { id: 'CALL', label: '跟注', color: 'blue', hotkey: 'C' },
    { id: 'RAISE', label: '加注', color: 'green', hotkey: 'R' },
    { id: 'ALL_IN', label: '全下', color: 'purple', hotkey: 'A' }
  ];

  const handleAction = (action: string) => {
    setSelectedAction(action);
    setGamePhase('feedback');
    setShowGTOFeedback(true);
    
    // 2秒后自动进入下一手
    setTimeout(() => {
      setGamePhase('playing');
      setShowGTOFeedback(false);
      setSelectedAction(null);
      // 更新手牌数据
      setCurrentHand(prev => ({
        ...prev,
        playerCards: ['K♦', 'Q♦'],
        communityCards: ['9♠', '8♠', '7♥'],
        pot: 120,
        currentBet: 40
      }));
    }, 3000);
  };

  const renderCard = (card: string) => {
    const isRed = card.includes('♥') || card.includes('♦');
    return (
      <div className={`
        w-12 h-16 rounded-lg flex items-center justify-center font-bold text-sm
        ${isRed 
          ? 'bg-white text-red-600 border-2 border-red-300' 
          : 'bg-white text-gray-900 border-2 border-gray-300'
        }
        shadow-lg hover:scale-105 transition-transform
      `}>
        {card}
      </div>
    );
  };

  if (gamePhase === 'preparing') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            准备开始训练
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            AI正在为你准备个性化的训练场景...
          </p>
          <div className="w-64 mx-auto mb-6">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" style={{width: '75%'}}></div>
            </div>
          </div>
          <button
            onClick={() => setGamePhase('playing')}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-bold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            开始训练 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 训练进度条 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            训练进度
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {sessionData.currentHand}/{sessionData.targetHands} 手牌
          </span>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full">
          <div 
            className="h-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
            style={{width: `${sessionProgress}%`}}
          ></div>
        </div>
      </div>

      {/* 主游戏界面 */}
      <div className="bg-gradient-to-br from-green-800 via-green-900 to-emerald-900 rounded-2xl p-8 text-white relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.2)_70%)]"></div>
        
        <div className="relative z-10">
          {/* 游戏信息 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="px-3 py-1 bg-yellow-500 text-yellow-900 rounded-full text-sm font-bold">
                {currentHand.position}
              </div>
              <div className="text-lg">
                底池: <span className="font-bold">${currentHand.pot}</span>
              </div>
              <div className="text-lg">
                下注: <span className="font-bold">${currentHand.currentBet}</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>思考时间: 8.2s</span>
            </div>
          </div>

          {/* 公共牌 */}
          <div className="text-center mb-8">
            <h4 className="text-lg font-medium mb-4">公共牌</h4>
            <div className="flex justify-center space-x-2">
              {currentHand.communityCards.map((card, i) => (
                <div key={i}>
                  {renderCard(card)}
                </div>
              ))}
            </div>
          </div>

          {/* 玩家手牌 */}
          <div className="text-center mb-8">
            <h4 className="text-lg font-medium mb-4">你的手牌</h4>
            <div className="flex justify-center space-x-2">
              {currentHand.playerCards.map((card, i) => (
                <div key={i} className="transform scale-110">
                  {renderCard(card)}
                </div>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          {gamePhase === 'playing' && (
            <div className="flex justify-center space-x-4">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleAction(action.id)}
                  className={`
                    px-6 py-3 rounded-lg font-bold text-white transition-all transform hover:scale-105
                    ${action.color === 'red' ? 'bg-red-600 hover:bg-red-700' : ''}
                    ${action.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    ${action.color === 'green' ? 'bg-green-600 hover:bg-green-700' : ''}
                    ${action.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  `}
                >
                  {action.label}
                  <span className="ml-2 text-xs opacity-75">({action.hotkey})</span>
                </button>
              ))}
            </div>
          )}

          {/* GTO反馈 */}
          {showGTOFeedback && (
            <div className={`
              mt-6 p-6 rounded-xl border-2 
              ${sessionData.gtoFeedback.optimal 
                ? 'bg-green-100 border-green-400 text-green-800' 
                : 'bg-orange-100 border-orange-400 text-orange-800'
              }
            `}>
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-xl font-bold flex items-center">
                  {sessionData.gtoFeedback.optimal ? (
                    <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
                  ) : (
                    <X className="w-6 h-6 mr-2 text-orange-600" />
                  )}
                  GTO 分析结果
                </h4>
                <div className="text-right">
                  <div className="font-bold text-lg">{sessionData.gtoFeedback.equity}%</div>
                  <div className="text-sm">胜率</div>
                </div>
              </div>
              
              <p className="mb-4">{sessionData.gtoFeedback.explanation}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex space-x-4 text-sm">
                  <div>你的选择: <span className="font-bold">{sessionData.gtoFeedback.action}</span></div>
                  <div>EV变化: <span className={`font-bold ${sessionData.gtoFeedback.evGain > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {sessionData.gtoFeedback.evGain > 0 ? '+' : ''}{sessionData.gtoFeedback.evGain}
                  </span></div>
                </div>
                <div className="text-xs text-gray-600">3秒后继续下一手...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 会话统计 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">本次训练统计</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{sessionData.currentHand}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">已训练手数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((sessionData.correctDecisions / sessionData.currentHand) * 100)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">正确决策率</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{sessionData.averageThinkTime}s</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">平均思考时间</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">+{sessionData.skillGain}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">技能点获得</div>
          </div>
        </div>

        <div className="flex justify-center mt-6 space-x-4">
          <button
            onClick={() => setGamePhase('preparing')}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            暂停训练
          </button>
          <button
            onClick={onSessionComplete}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            结束训练
          </button>
        </div>
      </div>
    </div>
  );
};