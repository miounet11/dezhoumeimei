'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  HelpCircle,
  Eye,
  Target,
  Zap,
  ChevronRight,
  X,
  MessageCircle
} from 'lucide-react';

interface HintData {
  id: string;
  type: 'tip' | 'warning' | 'question' | 'insight';
  title: string;
  content: string;
  details?: string;
  icon: React.ReactNode;
  color: string;
  priority: number;
}

interface SmartHintsProps {
  gameState: any;
  playerAction?: string;
  onHintDismiss?: (hintId: string) => void;
  onHintExpand?: (hintId: string) => void;
}

export default function SmartHints({ 
  gameState, 
  playerAction,
  onHintDismiss,
  onHintExpand 
}: SmartHintsProps) {
  const [hints, setHints] = useState<HintData[]>([]);
  const [expandedHint, setExpandedHint] = useState<string | null>(null);
  const [showThinkingBubble, setShowThinkingBubble] = useState(false);
  const [thinkingMessage, setThinkingMessage] = useState('');
  const [hintLevel, setHintLevel] = useState<'subtle' | 'normal' | 'detailed'>('normal');

  // 生成智能提示
  useEffect(() => {
    if (!gameState) return;

    const newHints: HintData[] = [];

    // 位置提示
    if (gameState.currentPlayer?.position === 'BTN') {
      newHints.push({
        id: 'position-btn',
        type: 'tip',
        title: '位置优势',
        content: '你在按钮位，拥有位置优势',
        details: '在按钮位，你将在翻牌后最后行动，这给了你信息优势。可以考虑扩大你的开牌范围。',
        icon: <Target className="w-5 h-5" />,
        color: 'blue',
        priority: 2
      });
    }

    // 底池赔率提示
    if (gameState.currentBet > 0 && gameState.pot > 0) {
      const potOdds = (gameState.currentBet / (gameState.pot + gameState.currentBet) * 100).toFixed(1);
      newHints.push({
        id: 'pot-odds',
        type: 'insight',
        title: '底池赔率',
        content: `需要 ${potOdds}% 胜率才能盈利跟注`,
        details: `当前底池 ${gameState.pot}，跟注需要 ${gameState.currentBet}。如果你的胜率高于 ${potOdds}%，跟注是有利可图的。`,
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'green',
        priority: 1
      });
    }

    // 对手行为分析
    if (gameState.history && gameState.history.length > 0) {
      const lastAction = gameState.history[gameState.history.length - 1];
      if (lastAction.type === 'RAISE') {
        newHints.push({
          id: 'opponent-aggressive',
          type: 'warning',
          title: '对手激进',
          content: '对手加注可能代表强牌',
          details: '面对加注，要考虑：1) 对手的形象和历史 2) 你的手牌强度 3) 位置关系 4) 筹码深度',
          icon: <AlertCircle className="w-5 h-5" />,
          color: 'orange',
          priority: 1
      });
      }
    }

    // 思考引导问题
    if (gameState.gamePhase === 'FLOP' && gameState.communityCards?.length === 3) {
      newHints.push({
        id: 'think-flop',
        type: 'question',
        title: '思考一下',
        content: '这个翻牌对谁更有利？',
        details: '分析翻牌质地：是否有同花听牌？顺子听牌？高牌还是低牌？湿润还是干燥？',
        icon: <HelpCircle className="w-5 h-5" />,
        color: 'purple',
        priority: 3
      });
    }

    setHints(newHints.sort((a, b) => a.priority - b.priority));
  }, [gameState]);

  // 显示思考气泡
  useEffect(() => {
    if (gameState?.isHeroTurn) {
      const messages = [
        '对手为什么这样打？🤔',
        '他的范围里有什么牌？',
        '我的牌在他眼中是什么？',
        '这里该激进还是保守？',
        '长期来看这样打对吗？'
      ];
      
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setThinkingMessage(randomMessage);
      setShowThinkingBubble(true);
      
      setTimeout(() => {
        setShowThinkingBubble(false);
      }, 5000);
    }
  }, [gameState?.isHeroTurn]);

  const handleHintClick = (hint: HintData) => {
    if (expandedHint === hint.id) {
      setExpandedHint(null);
    } else {
      setExpandedHint(hint.id);
      onHintExpand?.(hint.id);
    }
  };

  const dismissHint = (hintId: string) => {
    setHints(hints.filter(h => h.id !== hintId));
    onHintDismiss?.(hintId);
  };

  const getHintStyles = (hint: HintData) => {
    const colors = {
      blue: 'from-blue-400 to-blue-600 shadow-blue-500/25',
      green: 'from-green-400 to-emerald-600 shadow-green-500/25',
      orange: 'from-orange-400 to-orange-600 shadow-orange-500/25',
      purple: 'from-purple-400 to-purple-600 shadow-purple-500/25'
    };
    return colors[hint.color as keyof typeof colors] || colors.blue;
  };

  return (
    <>
      {/* 智能提示面板 */}
      <div className="fixed right-4 top-20 w-80 space-y-3 z-40">
        {/* 提示等级控制 */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              提示强度
            </span>
            <Lightbulb className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="flex space-x-2">
            {(['subtle', 'normal', 'detailed'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setHintLevel(level)}
                className={`
                  flex-1 py-1 px-2 rounded text-xs font-medium transition-all
                  ${hintLevel === level
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }
                `}
              >
                {level === 'subtle' ? '微妙' : level === 'normal' ? '适中' : '详细'}
              </button>
            ))}
          </div>
        </div>

        {/* 提示卡片 */}
        {hints.map((hint, index) => (
          <div
            key={hint.id}
            className={`
              transform transition-all duration-300 cursor-pointer
              ${index === 0 ? 'scale-105' : 'scale-100'}
              ${hintLevel === 'subtle' && index > 0 ? 'opacity-60' : 'opacity-100'}
            `}
            style={{
              animation: `slideInRight 0.3s ease-out ${index * 0.1}s both`
            }}
            onClick={() => handleHintClick(hint)}
          >
            <div className={`
              relative bg-gradient-to-r ${getHintStyles(hint)} 
              rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow
            `}>
              {/* 关闭按钮 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissHint(hint.id);
                }}
                className="absolute top-2 right-2 p-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>

              {/* 提示内容 */}
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="text-white">
                    {hint.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">
                    {hint.title}
                  </h4>
                  <p className="text-white/90 text-sm">
                    {hint.content}
                  </p>
                  
                  {/* 展开的详细内容 */}
                  {expandedHint === hint.id && hint.details && (
                    <div className="mt-3 p-3 bg-white/10 rounded-lg">
                      <p className="text-white/80 text-xs leading-relaxed">
                        {hint.details}
                      </p>
                    </div>
                  )}
                  
                  {/* 展开指示器 */}
                  {hint.details && (
                    <div className="flex items-center mt-2">
                      <span className="text-xs text-white/70">
                        {expandedHint === hint.id ? '收起' : '查看详情'}
                      </span>
                      <ChevronRight 
                        className={`
                          w-3 h-3 text-white/70 ml-1 transition-transform
                          ${expandedHint === hint.id ? 'rotate-90' : ''}
                        `}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 优先级指示器 */}
              {hint.priority === 1 && (
                <div className="absolute -top-1 -left-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 思考气泡 */}
      {showThinkingBubble && (
        <div 
          className="fixed left-1/2 top-32 transform -translate-x-1/2 z-50"
          style={{
            animation: 'fadeInUp 0.5s ease-out'
          }}
        >
          <div className="relative">
            <div className="bg-white dark:bg-gray-800 rounded-2xl px-6 py-4 shadow-xl">
              <div className="flex items-center space-x-3">
                <Brain className="w-6 h-6 text-purple-500 animate-pulse" />
                <p className="text-gray-800 dark:text-white font-medium">
                  {thinkingMessage}
                </p>
              </div>
            </div>
            {/* 气泡尾巴 */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="w-4 h-4 bg-white dark:bg-gray-800 rotate-45"></div>
            </div>
          </div>
        </div>
      )}

      {/* 教练对话框 */}
      <div className="fixed bottom-24 right-4 z-40">
        <button className="relative group">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all transform hover:scale-110">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          
          {/* 悬停提示 */}
          <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            AI教练在线
          </div>
        </button>
      </div>

      {/* 动画样式 */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </>
  );
}