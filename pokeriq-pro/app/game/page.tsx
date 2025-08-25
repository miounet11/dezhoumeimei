'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, Target, Trophy, Activity, Users } from 'lucide-react';
import AppLayout from '@/src/components/layout/AppLayout';
import ActionPanel from '@/components/game/ActionPanel';
import PlayerInfo from '@/components/game/PlayerInfo';

interface GameState {
  sessionId: string;
  players: any[];
  playerCards: string[];
  communityCards: string[];
  pot: number;
  currentBet: number;
  minRaise: number;
  street: string;
  actionOn: number;
  handNumber: number;
  isComplete?: boolean;
}

export default function GamePage() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [playerSeat] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    if (!gameState || loading || gameState.isComplete) return;

    if (gameState.actionOn !== playerSeat) {
      const pollGameState = async () => {
        try {
          const response = await fetch(`/api/game/state?sessionId=${gameState.sessionId}`);
          if (response.ok) {
            const data = await response.json();
            setGameState(prev => ({
              ...prev!,
              ...data.gameState
            }));
          }
        } catch (error) {
          console.error('Poll game state error:', error);
        }
      };

      const interval = setInterval(pollGameState, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState, loading, playerSeat]);

  const startNewGame = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录');
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gameType: 'CASH',
          stakes: '1/2',
          buyIn: 200,
          opponentId: 'ai-basic'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to start game: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.gameState) {
        setGameState(data.gameState);
        console.log('游戏开始！祝你好运！');
      } else {
        throw new Error(data.error || 'Invalid game state received');
      }
    } catch (error: any) {
      console.error('Start game error:', error);
      alert(`开始游戏失败: ${error?.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, amount?: number) => {
    if (!gameState) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('请先登录');
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/game/action', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: gameState.sessionId,
          action,
          amount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process action');
      }

      const data = await response.json();
      if (data.success && data.gameState) {
        setGameState(prev => ({
          ...prev!,
          ...data.gameState
        }));

        if (data.gameState.isComplete) {
          console.log('本手牌结束！');
        }
      } else {
        throw new Error(data.error || 'Invalid action response');
      }
    } catch (error: any) {
      console.error('Action error:', error);
      alert(`操作失败: ${error?.message || '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 p-6">
        {loading && !gameState ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
              </div>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">加载中...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">正在初始化游戏环境</p>
            </div>
          </div>
        ) : (
          <div>
            {/* 页面头部 */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 mb-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/20 transform hover:scale-105 transition-transform duration-300">
                    <Target size={32} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                      游戏中心
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                      实时扑克游戏与AI对手对战
                    </p>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl px-4 py-2 border border-green-200 dark:border-green-800">
                      <div className="text-sm text-gray-600 dark:text-gray-400">在线玩家</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">1,234</div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl px-4 py-2 border border-blue-200 dark:border-blue-800">
                      <div className="text-sm text-gray-600 dark:text-gray-400">活跃房间</div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">89</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="group bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200/50 dark:border-purple-700/50 shadow-xl backdrop-blur-sm hover:border-purple-300 dark:hover:border-purple-600 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {gameState?.players[playerSeat]?.stack?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">筹码余额</p>
                  </div>
                </div>
                <div className="w-full bg-purple-100 dark:bg-purple-900/30 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200/50 dark:border-blue-700/50 shadow-xl backdrop-blur-sm hover:border-blue-300 dark:hover:border-blue-600 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      {gameState?.pot?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">当前底池</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>实时更新</span>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border-2 border-green-200/50 dark:border-green-700/50 shadow-xl backdrop-blur-sm hover:border-green-300 dark:hover:border-green-600 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {gameState?.handNumber || '0'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">手牌编号</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                  <Trophy className="w-4 h-4" />
                  <span>游戏进行中</span>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl p-6 border-2 border-orange-200/50 dark:border-orange-700/50 shadow-xl backdrop-blur-sm hover:border-orange-300 dark:hover:border-orange-600 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent">
                      {gameState?.street === 'PREFLOP' ? '翻前' :
                       gameState?.street === 'FLOP' ? '翻牌' :
                       gameState?.street === 'TURN' ? '转牌' :
                       gameState?.street === 'RIVER' ? '河牌' : '等待'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">当前阶段</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span>进行中</span>
                </div>
              </div>
            </div>

            {!gameState ? (
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-12 text-center shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/20 transform hover:scale-105 transition-all duration-300">
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">准备开始游戏</h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">与智能AI对手对战，提升你的扑克技巧</p>
                
                {/* 游戏模式选择 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
                  <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-blue-200/50 dark:border-blue-700/50 hover:border-blue-300 dark:hover:border-blue-600 transform hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">快速对战</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">立即开始与AI对战</p>
                  </div>
                  
                  <div className="group bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200/50 dark:border-green-700/50 hover:border-green-300 dark:hover:border-green-600 transform hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform duration-300">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">训练模式</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">专注技巧提升</p>
                  </div>
                  
                  <div className="group bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-6 border-2 border-yellow-200/50 dark:border-yellow-700/50 hover:border-yellow-300 dark:hover:border-yellow-600 transform hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform duration-300">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">锦标赛</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">竞技模式挑战</p>
                  </div>
                </div>

                <button
                  onClick={startNewGame}
                  disabled={loading}
                  className="group px-12 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-2xl text-xl font-bold shadow-2xl shadow-purple-500/20 transform hover:scale-105 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:transform-none"
                >
                  <span className="flex items-center justify-center space-x-3">
                    <span>{loading ? '正在准备...' : '🚀 开始游戏'}</span>
                    {!loading && <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>}
                  </span>
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                      <span className="text-white text-lg">🎮</span>
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">游戏桌面</h2>
                  </div>
                  <div className="relative bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-700/50">
                    {/* 德州扑克桌面 */}
                    <div className="relative w-full h-full">
                      <div className="relative w-full max-w-6xl mx-auto h-[600px] bg-gradient-to-br from-green-800 to-green-900 rounded-3xl shadow-2xl overflow-hidden">
                        {/* 桌面装饰 */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
                        </div>
                        <div className="absolute inset-6 border-4 border-green-700 rounded-2xl"></div>

                        {/* 底池显示 */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
                          <div className="bg-black/50 rounded-lg px-6 py-3 backdrop-blur-sm">
                            <div className="text-sm text-gray-300">底池</div>
                            <div className="text-2xl font-bold text-yellow-400">${gameState.pot}</div>
                          </div>
                        </div>

                        {/* 公共牌 */}
                        {gameState.communityCards && gameState.communityCards.length > 0 && (
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-20">
                            <div className="flex space-x-2">
                              {gameState.communityCards.map((card, index) => (
                                <div key={index} className="relative">
                                  <div className="w-16 h-24 bg-white rounded-lg shadow-lg border border-gray-300 flex flex-col items-center justify-center">
                                    <div className={`text-2xl font-bold ${card.includes('♥') || card.includes('♦') ? 'text-red-500' : 'text-black'}`}>
                                      {card.replace(/[♥♦♠♣]/g, '')}
                                    </div>
                                    <div className={`text-3xl ${card.includes('♥') || card.includes('♦') ? 'text-red-500' : 'text-black'}`}>
                                      {card.match(/[♥♦♠♣]/)?.[0]}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 玩家位置 - 重新设计布局 */}
                        {gameState.players.map((player, index) => {
                          // 为每个位置定义坐标和标签
                          const positions = [
                            { 
                              style: { top: '80%', left: '50%' }, 
                              label: 'YOU', 
                              labelBg: 'bg-gradient-to-r from-yellow-400 to-orange-500',
                              isPlayer: true
                            },
                            { 
                              style: { top: '15%', left: '50%' }, 
                              label: 'BTN', 
                              description: '(庄家)',
                              labelBg: 'bg-gradient-to-r from-blue-500 to-blue-600'
                            }
                          ];

                          const position = positions[index] || positions[1];
                          const isCurrentPlayer = index === playerSeat;
                          const isActionOn = gameState.actionOn === index;

                          return (
                            <div
                              key={index}
                              className="absolute z-10"
                              style={{
                                ...position.style,
                                transform: 'translate(-50%, -50%)',
                                zIndex: isCurrentPlayer ? 20 : 10
                              }}
                            >
                              {/* 位置标签 */}
                              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-10">
                                {isCurrentPlayer ? (
                                  <div className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-bold text-sm shadow-xl animate-bounce">
                                    ⭐ YOU
                                  </div>
                                ) : (
                                  <div className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-xl border border-white/30 ${position.labelBg}`}>
                                    <span className="mr-1">{position.label}</span>
                                    {position.description && <span className="text-[10px]">{position.description}</span>}
                                  </div>
                                )}
                              </div>

                              {/* 玩家卡片 */}
                              <div className={`relative p-3 rounded-xl shadow-lg transition-all duration-300 ${
                                isCurrentPlayer 
                                  ? 'w-[140px] bg-gradient-to-br from-green-500 to-emerald-600 text-white border-3 border-yellow-400 scale-110'
                                  : player.folded 
                                  ? 'w-[110px] bg-gray-400 opacity-50'
                                  : 'w-[110px] bg-white border-2 border-gray-300 hover:border-gray-400'
                              } ${isActionOn ? 'ring-4 ring-yellow-400 ring-opacity-75' : ''}`}>
                                
                                {/* 玩家信息 */}
                                <div className="text-center mb-2">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-1 ${
                                    isCurrentPlayer 
                                      ? 'bg-white/20'
                                      : 'bg-gradient-to-br from-purple-400 to-pink-500 text-white'
                                  }`}>
                                    {isCurrentPlayer ? '👤' : '🤖'}
                                  </div>
                                  <div className={`font-bold text-xs truncate ${isCurrentPlayer ? 'text-white' : 'text-gray-900'}`}>
                                    {isCurrentPlayer ? '你' : `AI ${index + 1}`}
                                  </div>
                                  <div className={`text-xs ${isCurrentPlayer ? 'text-green-100' : 'text-gray-500'}`}>
                                    ${player.stack}
                                  </div>
                                </div>

                                {/* 手牌 */}
                                <div className="flex justify-center space-x-1 mb-2">
                                  {isCurrentPlayer && gameState.playerCards ? (
                                    gameState.playerCards.map((card, cardIndex) => (
                                      <div key={cardIndex} className="transform scale-75">
                                        <div className={`inline-block mx-1 px-3 py-2 rounded font-bold text-lg border-2 ${
                                          card.includes('♥') || card.includes('♦')
                                            ? 'bg-red-100 text-red-600 border-red-300'
                                            : 'bg-gray-800 text-white border-gray-600'
                                        }`}>
                                          {card}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    // 背面卡牌
                                    <>
                                      <div className="w-6 h-8 bg-blue-900 rounded text-white flex items-center justify-center text-xs">🂠</div>
                                      <div className="w-6 h-8 bg-blue-900 rounded text-white flex items-center justify-center text-xs">🂠</div>
                                    </>
                                  )}
                                </div>

                                {/* 当前下注显示 */}
                                {player.currentBet > 0 && (
                                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                                    <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                      ${player.currentBet}
                                    </div>
                                  </div>
                                )}

                                {/* 行动状态指示 */}
                                {isActionOn && (
                                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* 游戏阶段显示 */}
                        <div className="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-1">
                          <div className="text-xs text-gray-400">当前阶段</div>
                          <div className="text-sm text-white font-bold">
                            {gameState.street === 'PREFLOP' ? '翻前' :
                             gameState.street === 'FLOP' ? '翻牌' :
                             gameState.street === 'TURN' ? '转牌' :
                             gameState.street === 'RIVER' ? '河牌' : '摊牌'}
                          </div>
                        </div>

                        {/* 庄家按钮 */}
                        <div className="absolute w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-bold text-sm shadow-lg" 
                             style={{ left: 'calc(50% + 100px)', bottom: '15%' }}>
                          D
                        </div>
                      </div>
                    </div>
                    
                    {/* 悬浮操作面板 */}
                    {gameState.actionOn === playerSeat && !gameState.isComplete && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                        <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border-2 border-yellow-400/50 min-w-[400px]">
                          <div className="text-center mb-3">
                            <div className="flex items-center justify-center space-x-2 mb-2">
                              <span className="text-yellow-400 text-2xl animate-pulse">⚡</span>
                              <div className="text-yellow-400 text-xl font-bold">轮到你了！</div>
                              <span className="text-yellow-400 text-2xl animate-pulse">⚡</span>
                            </div>
                            <div className="text-white/90 text-sm">
                              当前下注: ${gameState.currentBet} | 跟注需要: ${gameState.currentBet - (gameState.players[playerSeat].currentBet || 0)}
                            </div>
                          </div>
                          
                          <div className="bg-gray-800/80 rounded-xl p-3">
                            <ActionPanel
                              currentBet={gameState.currentBet}
                              minRaise={gameState.minRaise}
                              playerStack={gameState.players[playerSeat].stack}
                              onAction={handleAction}
                              disabled={loading}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gameState.players.map((player, index) => (
                    <div key={index} className="group bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-all duration-300 ${
                          gameState.actionOn === index 
                            ? 'bg-gradient-to-br from-yellow-500 to-orange-600 shadow-yellow-500/20 animate-pulse' 
                            : index === playerSeat
                            ? 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/20'
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/20'
                        }`}>
                          <span className="text-white text-lg">
                            {index === playerSeat ? '👤' : '🤖'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {index === playerSeat ? '你' : `AI ${index + 1}`}
                          {gameState.actionOn === index && (
                            <span className="ml-2 text-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-1 rounded-full animate-pulse">
                              行动中
                            </span>
                          )}
                        </h3>
                      </div>
                      <PlayerInfo
                        player={player}
                        isActive={gameState.actionOn === index}
                        isHuman={index === playerSeat}
                      />
                    </div>
                  ))}
                </div>


                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <span className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 text-indigo-800 dark:text-indigo-200 px-4 py-2 rounded-xl font-semibold border border-indigo-200 dark:border-indigo-800">
                      🎯 手牌 #{gameState.handNumber}
                    </span>
                    <span className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-800 dark:text-purple-200 px-4 py-2 rounded-xl font-semibold border border-purple-200 dark:border-purple-800">
                      📍 {gameState.street === 'PREFLOP' ? '翻前' :
                         gameState.street === 'FLOP' ? '翻牌' :
                         gameState.street === 'TURN' ? '转牌' :
                         gameState.street === 'RIVER' ? '河牌' :
                         '摊牌'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {gameState.isComplete ? (
                      <button
                        onClick={startNewGame}
                        className="group px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transform hover:scale-105 active:scale-[0.98] transition-all duration-200"
                      >
                        <span className="flex items-center space-x-2">
                          <span>🎯 下一手</span>
                          <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                        </span>
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span>等待{gameState.players[gameState.actionOn]?.name}行动...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
