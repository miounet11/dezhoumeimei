'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/lib/socket/useSocket';
import AppLayout from '@/src/components/layout/AppLayout';

export default function BattlePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [buyInAmount, setBuyInAmount] = useState(200);
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  const {
    connected,
    roomId,
    gameState,
    messages,
    myCards,
    joinRoom,
    leaveRoom,
    sendMessage,
    fold,
    check,
    call,
    raise,
    allIn,
  } = useSocket({ token: token || undefined });

  useEffect(() => {
    // 获取token - 从localStorage获取，与登录系统一致
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!accessToken) {
      router.push('/auth/login');
      return;
    }
    setToken(accessToken);
  }, [router]);

  const handleJoinRoom = () => {
    if (!roomIdInput) {
      alert('请输入房间号');
      return;
    }
    joinRoom(roomIdInput, buyInAmount);
    setShowJoinDialog(false);
  };

  const handleQuickJoin = () => {
    // 生成随机房间号
    const randomRoomId = `room_${Math.random().toString(36).substr(2, 9)}`;
    joinRoom(randomRoomId, buyInAmount);
  };

  const getCurrentPlayer = () => {
    if (!gameState || !gameState.players) return null;
    return gameState.players[gameState.currentPlayer];
  };

  const isMyTurn = () => {
    if (!gameState || !token) return false;
    const currentPlayer = getCurrentPlayer();
    // 这里需要从token中解析出userId
    return currentPlayer?.userId === 'my_user_id'; // TODO: 替换为实际userId
  };

  const getCardDisplay = (card: string) => {
    const suit = card.slice(-1);
    const rank = card.slice(0, -1);
    const isRed = suit === '♥' || suit === '♦';
    return (
      <div className={`inline-block w-16 h-24 rounded-xl border-2 shadow-lg transform hover:scale-110 transition-all duration-300 mx-1 ${
        isRed 
          ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200 shadow-red-500/20' 
          : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300 shadow-gray-500/20'
      } flex flex-col items-center justify-center backdrop-blur-sm`}>
        <span className={`text-2xl font-bold ${isRed ? 'text-red-600' : 'text-gray-800'}`}>{rank}</span>
        <span className={`text-3xl ${isRed ? 'text-red-600' : 'text-gray-800'}`}>{suit}</span>
      </div>
    );
  };

  return (
    <AppLayout>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out forwards;
        }
        
        .bg-gradient-radial {
          background: radial-gradient(circle at center, var(--tw-gradient-stops));
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-green-600 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-600 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-600 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
        {/* 连接状态栏 */}
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-2xl border-b border-gradient-to-r from-purple-500/30 to-pink-600/30 py-4 px-6 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-xl shadow-purple-500/20 transform hover:scale-105 transition-transform duration-300">
                <span className="text-white text-xl">⚔️</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  实时对战
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">与全球玩家实时竞技</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-200/50 dark:border-gray-700/50">
                <div className={`w-3 h-3 rounded-full animate-pulse ${
                  connected ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-red-400 shadow-lg shadow-red-400/50'
                }`}></div>
                <span className={`text-sm font-semibold transition-all duration-200 ${
                  connected 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {connected ? '✓ 已连接' : '⚠️ 未连接'}
                </span>
              </div>
              {roomId && (
                <button
                  onClick={leaveRoom}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-red-500/20 border border-red-400/50 hover:shadow-xl transform hover:scale-105 active:scale-[0.98] transition-all duration-200"
                >
                  🚪 离开房间
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 主内容 */}
        <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        {!roomId ? (
          // 大厅界面
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 快速匹配 */}
              <div className="group bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 rounded-2xl p-6 border-2 border-purple-200/50 dark:border-purple-700/50 shadow-xl backdrop-blur-sm hover:border-purple-300 dark:hover:border-purple-600 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-lg">🎯</span>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">快速匹配</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">自动匹配水平相近的对手</p>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">买入筹码</label>
                  <select
                    value={buyInAmount}
                    onChange={(e) => setBuyInAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 border-2 border-purple-200/50 dark:border-purple-700/50 rounded-xl text-gray-900 dark:text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-200 backdrop-blur-sm"
                  >
                    <option value={100}>💰 100 筹码</option>
                    <option value={200}>💰 200 筹码</option>
                    <option value={500}>💰 500 筹码</option>
                    <option value={1000}>💰 1000 筹码</option>
                  </select>
                </div>
                <button
                  onClick={handleQuickJoin}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transform hover:scale-105 active:scale-[0.98] transition-all duration-300 text-lg group"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>🚀</span>
                    <span>开始匹配</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </span>
                </button>
              </div>

              {/* 加入房间 */}
              <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-2xl p-6 border-2 border-blue-200/50 dark:border-blue-700/50 shadow-xl backdrop-blur-sm hover:border-blue-300 dark:hover:border-blue-600 transform hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white text-lg">🚪</span>
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">加入房间</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">输入房间号加入朋友的游戏</p>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">房间号</label>
                  <input
                    type="text"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value)}
                    placeholder="输入房间号"
                    className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 border-2 border-blue-200/50 dark:border-blue-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all duration-200 backdrop-blur-sm"
                  />
                </div>
                <button
                  onClick={() => setShowJoinDialog(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transform hover:scale-105 active:scale-[0.98] transition-all duration-300 text-lg group"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>🎮</span>
                    <span>加入房间</span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </span>
                </button>
              </div>
            </div>

            {/* 房间列表 */}
            <div className="mt-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-white text-lg">🏠</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">公开房间</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">加入其他玩家的房间</p>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20 animate-pulse">
                    <span className="text-3xl">🏆</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-lg font-medium mb-2">暂无公开房间</p>
                  <p className="text-gray-500 dark:text-gray-400">创建一个房间，成为第一个在线玩家！</p>
                  <div className="mt-6">
                    <div className="inline-flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-full px-4 py-2 border border-emerald-200 dark:border-emerald-800">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">等待玩家加入...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 游戏界面
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="mb-6 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <span className="text-white text-lg">🎮</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">房间: {roomId}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">实时对战中</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl px-4 py-2 border border-yellow-200 dark:border-yellow-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">底池</span>
                  <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">💰 {gameState?.pot || 0}</div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl px-4 py-2 border border-blue-200 dark:border-blue-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">最小下注</span>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{gameState?.minBet || 0}</div>
                </div>
              </div>
            </div>

            {/* 游戏桌 */}
            <div className="bg-gradient-to-br from-emerald-800 via-green-800 to-emerald-900 rounded-3xl p-8 mb-6 relative shadow-2xl border-2 border-emerald-600/30 overflow-hidden" style={{ minHeight: '450px' }}>
              {/* 桌面纹理 */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-radial from-emerald-700/30 via-transparent to-black/20"></div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.1)_70%)]"></div>
              </div>
              
              {/* 桌面边缘装饰 */}
              <div className="absolute inset-4 border-2 border-yellow-600/30 rounded-2xl"></div>
              <div className="absolute inset-6 border border-yellow-400/20 rounded-xl"></div>

              {/* 公共牌 */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
                <div className="flex justify-center mb-6 space-x-3">
                  {gameState?.communityCards?.map((card: string, index: number) => (
                    <div key={index} className="transform hover:scale-110 transition-transform duration-300 animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
                      {getCardDisplay(card)}
                    </div>
                  ))}
                  {/* 补齐5张牌的占位符 */}
                  {Array.from({ length: 5 - (gameState?.communityCards?.length || 0) }).map((_, i) => (
                    <div key={`placeholder-${i}`} className="w-16 h-24 bg-emerald-700/50 border-2 border-emerald-600/50 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-emerald-400 text-sm">?</span>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <div className="bg-black/70 backdrop-blur-md rounded-2xl px-6 py-4 border-2 border-yellow-400/50 shadow-2xl shadow-yellow-500/20">
                    <p className="text-yellow-400 text-sm font-medium mb-1">💰 底池</p>
                    <p className="text-white text-3xl font-bold">{gameState?.pot || 0}</p>
                  </div>
                </div>
              </div>

              {/* 玩家位置 */}
              {gameState?.players?.map((player: any, index: number) => (
                <div
                  key={player.userId}
                  className={`absolute transition-all duration-300 ${
                    index === gameState.currentPlayer 
                      ? 'ring-4 ring-yellow-400 ring-opacity-75 animate-pulse scale-110' 
                      : 'hover:scale-105'
                  }`}
                  style={{
                    top: `${30 + Math.sin((index / gameState.players.length) * 2 * Math.PI) * 35}%`,
                    left: `${45 + Math.cos((index / gameState.players.length) * 2 * Math.PI) * 40}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: index === gameState.currentPlayer ? 20 : 10
                  }}
                >
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-gray-200/50 dark:border-gray-700/50 min-w-[120px]">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                        <span className="text-white text-lg">👤</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{player.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        💰 ${player.chips?.toLocaleString() || 0}
                      </div>
                      {player.currentBet > 0 && (
                        <div className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full px-2 py-1 mt-1">
                          下注: ${player.currentBet}
                        </div>
                      )}
                      <div className={`text-xs mt-1 px-2 py-1 rounded-full ${
                        player.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {player.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 我的手牌 */}
            {myCards.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 mb-6 border-2 border-purple-200/50 dark:border-purple-700/50 shadow-xl backdrop-blur-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <span className="text-white text-lg">🃏</span>
                  </div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">我的手牌</h3>
                </div>
                <div className="flex justify-center space-x-4">
                  {myCards.map((card, index) => (
                    <div key={index} className="transform hover:scale-110 transition-all duration-300" style={{ animationDelay: `${index * 150}ms` }}>
                      {getCardDisplay(card)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 悬浮操作面板 */}
            {isMyTurn() && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50" style={{ position: 'fixed', bottom: '80px' }}>
                <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border-2 border-yellow-400/50 min-w-[500px]">
                  <div className="text-center mb-3">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <span className="text-yellow-400 text-2xl animate-pulse">⚡</span>
                      <div className="text-yellow-400 text-xl font-bold">轮到你了！</div>
                      <span className="text-yellow-400 text-2xl animate-pulse">⚡</span>
                    </div>
                    <div className="text-white/90 text-sm">
                      底池: ${gameState?.pot || 0} | 最小下注: ${gameState?.minBet || 0}
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/80 rounded-xl p-3">
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      <button
                        onClick={fold}
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-3 py-2 rounded-lg font-bold text-sm shadow-lg transform hover:scale-105 active:scale-[0.98] transition-all duration-200"
                      >
                        🗂️ 弃牌
                      </button>
                      <button
                        onClick={check}
                        className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-3 py-2 rounded-lg font-bold text-sm shadow-lg transform hover:scale-105 active:scale-[0.98] transition-all duration-200"
                      >
                        ✋ 过牌
                      </button>
                      <button
                        onClick={call}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-2 rounded-lg font-bold text-sm shadow-lg transform hover:scale-105 active:scale-[0.98] transition-all duration-200"
                      >
                        📞 跟注
                      </button>
                      <button
                        onClick={allIn}
                        className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-3 py-2 rounded-lg font-bold text-sm shadow-lg transform hover:scale-105 active:scale-[0.98] transition-all duration-200 animate-pulse"
                      >
                        🔥 全下
                      </button>
                      <div className="flex items-center space-x-1">
                        <input
                          type="number"
                          value={raiseAmount}
                          onChange={(e) => setRaiseAmount(Number(e.target.value))}
                          className="w-full px-2 py-2 bg-gray-700/80 rounded-lg border border-gray-600 text-white text-sm focus:outline-none focus:border-yellow-400/50"
                          placeholder="金额"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => raise(raiseAmount)}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-3 rounded-lg font-bold text-base shadow-lg transform hover:scale-105 active:scale-[0.98] transition-all duration-200"
                    >
                      💰 加注 ${raiseAmount}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 聊天区域 */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200/50 dark:border-blue-700/50 shadow-xl backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-white text-lg">💬</span>
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">游戏聊天</h3>
              </div>
              <div className="h-32 overflow-y-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 mb-4 border border-blue-200/50 dark:border-blue-700/50 space-y-2">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                    暂无消息，开始聊天吧！
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">{msg.playerName}:</span>{' '}
                      <span className="text-gray-700 dark:text-gray-300">{msg.message}</span>
                    </div>
                  ))
                )}
              </div>
              <input
                type="text"
                placeholder="输入消息并按回车发送..."
                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 border-2 border-blue-200/50 dark:border-blue-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all duration-200 backdrop-blur-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    sendMessage(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* 加入房间对话框 */}
        {showJoinDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl border border-gray-200/50 dark:border-gray-700/50 transform animate-scale-in">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-white text-lg">🎮</span>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">加入房间</h3>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">买入筹码</label>
                <select
                  value={buyInAmount}
                  onChange={(e) => setBuyInAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/80 border-2 border-blue-200/50 dark:border-blue-700/50 rounded-xl text-gray-900 dark:text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all duration-200 backdrop-blur-sm"
                >
                  <option value={100}>💰 100 筹码</option>
                  <option value={200}>💰 200 筹码</option>
                  <option value={500}>💰 500 筹码</option>
                  <option value={1000}>💰 1000 筹码</option>
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleJoinRoom}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-500/20 transform hover:scale-105 active:scale-[0.98] transition-all duration-200"
                >
                  ✅ 确认加入
                </button>
                <button
                  onClick={() => setShowJoinDialog(false)}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-gray-500/20 transform hover:scale-105 active:scale-[0.98] transition-all duration-200"
                >
                  ❌ 取消
                </button>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </AppLayout>
  );
}