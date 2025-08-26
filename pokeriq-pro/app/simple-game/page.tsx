'use client';

import { useState } from 'react';
import { Card, DollarSign, Target, Trophy } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  chips: number;
  cards: string[];
  folded: boolean;
  position: string;
  bet: number;
}

interface GameState {
  pot: number;
  communityCards: string[];
  currentBet: number;
  street: 'preflop' | 'flop' | 'turn' | 'river';
  activePlayer: number;
  players: Player[];
}

export default function SimpleGamePage() {
  const [gameState, setGameState] = useState<GameState>({
    pot: 150,
    communityCards: ['A♠', '7♠', '2♣'],
    currentBet: 50,
    street: 'flop',
    activePlayer: 0,
    players: [
      { id: 0, name: '你', chips: 1000, cards: ['A♠', 'K♠'], folded: false, position: 'BTN', bet: 50 },
      { id: 1, name: 'AI对手', chips: 950, cards: ['?', '?'], folded: false, position: 'BB', bet: 50 },
    ]
  });

  const [gtoAdvice, setGtoAdvice] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getGTOAdvice = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gto/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameState: {
            street: gameState.street,
            pot: gameState.pot,
            players: gameState.players.map(p => ({
              id: p.id,
              position: p.position,
              stack: p.chips,
              invested: p.bet,
              holeCards: p.id === 0 ? p.cards.join('') : 'XX',
              folded: p.folded,
              allIn: false
            })),
            currentPlayer: 0,
            communityCards: gameState.communityCards.join(''),
            history: ['call']
          },
          iterations: 500
        })
      });

      const result = await response.json();
      setGtoAdvice(result);
    } catch (error) {
      console.error('GTO分析失败:', error);
    }
    setLoading(false);
  };

  const handleAction = (action: string, amount?: number) => {
    // 简化的动作处理
    if (action === 'fold') {
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => p.id === 0 ? { ...p, folded: true } : p)
      }));
    } else if (action === 'call') {
      const callAmount = gameState.currentBet - gameState.players[0].bet;
      setGameState(prev => ({
        ...prev,
        pot: prev.pot + callAmount,
        players: prev.players.map(p => p.id === 0 ? { ...p, chips: p.chips - callAmount, bet: prev.currentBet } : p)
      }));
    } else if (action === 'bet' || action === 'raise') {
      const betAmount = amount || gameState.currentBet * 2;
      setGameState(prev => ({
        ...prev,
        pot: prev.pot + betAmount,
        currentBet: betAmount,
        players: prev.players.map(p => p.id === 0 ? { ...p, chips: p.chips - betAmount, bet: betAmount } : p)
      }));
    }
    
    // 清除之前的GTO建议
    setGtoAdvice(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎮 PokerIQ Pro 游戏演示</h1>
          <p className="text-green-200">体验AI驱动的GTO分析系统</p>
        </div>

        {/* 游戏桌面 */}
        <div className="max-w-4xl mx-auto">
          {/* 底池和公共牌 */}
          <div className="bg-green-800 rounded-2xl p-8 mb-6 text-center border-4 border-yellow-500">
            <div className="mb-6">
              <div className="text-yellow-400 text-2xl font-bold mb-2">底池: ${gameState.pot}</div>
              <div className="text-green-200 text-lg">{gameState.street} - 当前下注: ${gameState.currentBet}</div>
            </div>
            
            {/* 公共牌 */}
            <div className="flex justify-center space-x-4">
              {gameState.communityCards.map((card, index) => (
                <div key={index} className="bg-white rounded-lg p-4 text-2xl font-bold text-gray-800 shadow-lg min-w-[60px] text-center">
                  {card}
                </div>
              ))}
              {[...Array(5 - gameState.communityCards.length)].map((_, index) => (
                <div key={`empty-${index}`} className="bg-gray-600 rounded-lg p-4 text-2xl font-bold text-gray-400 shadow-lg min-w-[60px] text-center">
                  ?
                </div>
              ))}
            </div>
          </div>

          {/* 玩家信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {gameState.players.map((player, index) => (
              <div key={player.id} className={`p-6 rounded-xl ${
                player.id === 0 ? 'bg-blue-800 border-2 border-blue-400' : 'bg-gray-800 border-2 border-gray-600'
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{player.name}</h3>
                    <p className="text-gray-300">{player.position} · ${player.chips}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold">已投入: ${player.bet}</div>
                    {player.folded && <div className="text-red-400 font-bold">已弃牌</div>}
                  </div>
                </div>
                
                {/* 玩家手牌 */}
                <div className="flex space-x-2">
                  {player.cards.map((card, cardIndex) => (
                    <div key={cardIndex} className={`rounded p-2 text-sm font-bold text-center min-w-[40px] ${
                      card === '?' ? 'bg-gray-600 text-gray-400' : 'bg-white text-gray-800'
                    }`}>
                      {card}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 动作按钮 */}
          {!gameState.players[0].folded && (
            <div className="bg-gray-900 rounded-xl p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-4">你的回合 - 选择动作:</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => handleAction('fold')}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                >
                  弃牌 (Fold)
                </button>
                <button
                  onClick={() => handleAction('call')}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                >
                  跟注 (Call ${gameState.currentBet - gameState.players[0].bet})
                </button>
                <button
                  onClick={() => handleAction('bet', gameState.pot * 0.5)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                >
                  下注 50% 底池 (${Math.round(gameState.pot * 0.5)})
                </button>
                <button
                  onClick={() => handleAction('bet', gameState.pot)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors"
                >
                  下注 1x 底池 (${gameState.pot})
                </button>
              </div>
            </div>
          )}

          {/* GTO建议面板 */}
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">🧠 GTO策略建议</h3>
              <button
                onClick={getGTOAdvice}
                disabled={loading || gameState.players[0].folded}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? '分析中...' : '获取GTO建议'}
              </button>
            </div>

            {gtoAdvice && gtoAdvice.success && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">迭代次数:</span>
                    <span className="ml-2 text-white font-bold">{gtoAdvice.data.iterations}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">计算时间:</span>
                    <span className="ml-2 text-white font-bold">{gtoAdvice.data.convergenceTime}ms</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-2">推荐策略:</h4>
                  <div className="space-y-2">
                    {gtoAdvice.data.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="bg-gray-800 p-3 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white capitalize">
                            {rec.action.replace('_', ' ')}
                          </span>
                          <div className="flex space-x-2">
                            <span className={`px-2 py-1 text-xs rounded font-bold ${
                              rec.frequency >= 50 
                                ? 'bg-green-500 text-white'
                                : rec.frequency >= 25
                                ? 'bg-yellow-500 text-black'
                                : 'bg-red-500 text-white'
                            }`}>
                              {rec.frequency}%
                            </span>
                            <span className="px-2 py-1 text-xs rounded bg-blue-500 text-white font-bold">
                              {rec.confidence}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm">{rec.reasoning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {gtoAdvice && !gtoAdvice.success && (
              <div className="bg-red-900 p-4 rounded-lg">
                <p className="text-red-200">GTO分析失败: {gtoAdvice.error}</p>
              </div>
            )}

            {!gtoAdvice && (
              <div className="text-gray-400 text-center py-8">
                点击"获取GTO建议"来查看AI推荐的最优策略
              </div>
            )}
          </div>

          {/* 功能说明 */}
          <div className="mt-8 bg-blue-900 p-6 rounded-xl">
            <h3 className="text-xl font-bold text-white mb-4">🎯 游戏特性</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-bold text-blue-200 mb-2">真实GTO算法</h4>
                <p className="text-blue-100">使用CFR算法计算博弈论最优策略，不是简化的规则</p>
              </div>
              <div>
                <h4 className="font-bold text-blue-200 mb-2">个性化分析</h4>
                <p className="text-blue-100">基于你的游戏风格和技能水平提供定制化建议</p>
              </div>
              <div>
                <h4 className="font-bold text-blue-200 mb-2">实时反馈</h4>
                <p className="text-blue-100">每个决策点都能获得专业的策略指导和推理</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}