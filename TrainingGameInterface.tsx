'use client';

import React, { useState, useEffect } from 'react';
import { PokerTrainingEngine, GameAction, GamePlayer, Card } from './poker-training-engine';

export default function TrainingGameInterface() {
  const [engine] = useState(() => new PokerTrainingEngine(6, 2)); // 6人桌，玩家在第3个位置
  const [gameState, setGameState] = useState<any>(null);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [betAmount, setBetAmount] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [gtoFeedback, setGtoFeedback] = useState<any>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [trainingStats, setTrainingStats] = useState({
    handsPlayed: 0,
    correctDecisions: 0,
    totalEVLoss: 0,
    winnings: 0
  });

  // 开始新手牌
  const startNewHand = () => {
    const state = engine.startNewHand();
    setGameState(state);
    setGameStarted(true);
    setShowResult(false);
    setMessage('新的一手牌开始！');
    setGtoFeedback(null);
    
    // AI自动行动直到轮到玩家
    setTimeout(() => processAITurns(state), 1000);
  };

  // 处理AI回合
  const processAITurns = (currentState: any) => {
    if (!currentState || currentState.gamePhase === 'SHOWDOWN') {
      handleShowdown();
      return;
    }

    if (!currentState.isHeroTurn && currentState.currentPlayer) {
      // AI行动
      const aiDecision = engine.getAIDecision(currentState.currentPlayer);
      const result = engine.processAction(aiDecision);
      
      if (result.valid) {
        setMessage(result.message || '');
        setGameState(result.gameState);
        
        // 继续处理下一个AI
        setTimeout(() => processAITurns(result.gameState), 1500);
      }
    }
  };

  // 玩家行动
  const handlePlayerAction = () => {
    if (!gameState || !gameState.isHeroTurn) return;

    const heroPlayer = gameState.players.find((p: GamePlayer) => p.isHero);
    if (!heroPlayer) return;

    let action: GameAction = {
      type: selectedAction as any,
      playerId: heroPlayer.id
    };

    if (selectedAction === 'BET' || selectedAction === 'RAISE') {
      action.amount = betAmount;
    }

    const result = engine.processAction(action);

    if (result.valid) {
      setMessage(result.message || '');
      setGameState(result.gameState);
      
      // 显示GTO反馈
      if (result.gtoFeedback) {
        setGtoFeedback(result.gtoFeedback);
        
        // 更新训练统计
        setTrainingStats(prev => ({
          ...prev,
          handsPlayed: prev.handsPlayed + 1,
          correctDecisions: prev.correctDecisions + (result.gtoFeedback.optimal ? 1 : 0),
          totalEVLoss: prev.totalEVLoss + (result.gtoFeedback.evLoss || 0)
        }));
      }

      // 继续AI行动
      setTimeout(() => processAITurns(result.gameState), 1500);
    } else {
      setMessage(result.message || '无效操作');
    }
  };

  // 处理摊牌
  const handleShowdown = () => {
    setShowResult(true);
    setMessage('本手牌结束！');
  };

  // 渲染扑克牌
  const renderCard = (card: Card) => {
    const isRed = card.suit === '♥' || card.suit === '♦';
    return (
      <div className={`inline-block mx-1 px-3 py-2 rounded ${isRed ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-800'} font-bold text-lg`}>
        {card.rank}{card.suit}
      </div>
    );
  };

  // 渲染玩家
  const renderPlayer = (player: GamePlayer) => {
    const isCurrentPlayer = gameState?.currentPlayer?.id === player.id;
    const positionColors: Record<string, string> = {
      'BTN': 'bg-blue-500',
      'SB': 'bg-yellow-500',
      'BB': 'bg-red-500',
      'UTG': 'bg-purple-500',
      'MP': 'bg-green-500',
      'CO': 'bg-orange-500'
    };

    return (
      <div 
        key={player.id}
        className={`p-4 rounded-lg ${player.folded ? 'bg-gray-200 opacity-50' : 'bg-white'} ${isCurrentPlayer ? 'ring-2 ring-blue-500' : ''} ${player.isHero ? 'border-2 border-green-500' : ''}`}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold">{player.name}</span>
          <span className={`px-2 py-1 rounded text-white text-xs ${positionColors[player.position] || 'bg-gray-500'}`}>
            {player.position}
          </span>
        </div>
        
        <div className="text-sm text-gray-600 mb-2">
          筹码: {player.chips}
        </div>
        
        {player.isHero && player.cards.length > 0 && (
          <div className="mt-2">
            {player.cards.map((card, i) => (
              <span key={i}>{renderCard(card)}</span>
            ))}
          </div>
        )}
        
        {player.currentBet > 0 && (
          <div className="mt-2 text-sm text-blue-600">
            当前下注: {player.currentBet}
          </div>
        )}
        
        {player.isAllIn && (
          <div className="mt-2 text-sm text-red-600 font-bold">
            ALL-IN!
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">德州扑克AI训练中心</h1>
        <p className="text-gray-600">与AI对战，实时获得GTO策略反馈</p>
      </div>

      {/* 训练统计 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">手牌数</div>
          <div className="text-2xl font-bold">{trainingStats.handsPlayed}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">正确率</div>
          <div className="text-2xl font-bold">
            {trainingStats.handsPlayed > 0 
              ? `${((trainingStats.correctDecisions / trainingStats.handsPlayed) * 100).toFixed(1)}%`
              : '0%'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">EV损失</div>
          <div className="text-2xl font-bold text-red-600">
            -{trainingStats.totalEVLoss.toFixed(2)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">盈亏</div>
          <div className={`text-2xl font-bold ${trainingStats.winnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trainingStats.winnings >= 0 ? '+' : ''}{trainingStats.winnings}
          </div>
        </div>
      </div>

      {!gameStarted ? (
        <div className="text-center py-12">
          <button
            onClick={startNewHand}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg text-xl font-bold hover:bg-blue-700"
          >
            开始训练
          </button>
        </div>
      ) : gameState && (
        <>
          {/* 牌桌 */}
          <div className="bg-green-800 p-8 rounded-xl shadow-lg mb-6">
            {/* 公共牌 */}
            <div className="text-center mb-6">
              <div className="text-white mb-2">
                {gameState.phaseText} - 底池: {gameState.pot}
              </div>
              {gameState.communityCards.length > 0 && (
                <div className="inline-block p-4 bg-green-700 rounded">
                  {gameState.communityCards.map((card: Card, i: number) => (
                    <span key={i}>{renderCard(card)}</span>
                  ))}
                </div>
              )}
            </div>

            {/* 玩家位置 */}
            <div className="grid grid-cols-3 gap-4">
              {gameState.players.map((player: GamePlayer) => renderPlayer(player))}
            </div>
          </div>

          {/* 消息区 */}
          {message && (
            <div className="bg-yellow-100 p-4 rounded-lg mb-4">
              <div className="text-yellow-800">{message}</div>
            </div>
          )}

          {/* GTO反馈 */}
          {gtoFeedback && (
            <div className={`p-4 rounded-lg mb-4 ${gtoFeedback.optimal ? 'bg-green-100' : 'bg-orange-100'}`}>
              <div className="font-bold mb-2">GTO分析</div>
              <div className={gtoFeedback.optimal ? 'text-green-800' : 'text-orange-800'}>
                {gtoFeedback.feedback}
              </div>
              {gtoFeedback.explanation && (
                <div className="text-sm mt-2 text-gray-600">
                  {gtoFeedback.explanation}
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                <div>
                  <span className="text-gray-600">你的动作:</span> {gtoFeedback.yourAction}
                </div>
                <div>
                  <span className="text-gray-600">最优动作:</span> {gtoFeedback.optimalAction}
                </div>
                <div>
                  <span className="text-gray-600">胜率:</span> {gtoFeedback.equity}%
                </div>
              </div>
            </div>
          )}

          {/* 操作区 */}
          {gameState.isHeroTurn && !showResult && (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="mb-4">
                <div className="text-lg font-bold mb-2">轮到你了！</div>
                <div className="text-sm text-gray-600">
                  当前下注: {gameState.currentBet} | 跟注需要: {gameState.currentBet - (gameState.players.find((p: GamePlayer) => p.isHero)?.currentBet || 0)}
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2 mb-4">
                <button
                  onClick={() => setSelectedAction('FOLD')}
                  className={`px-4 py-2 rounded ${selectedAction === 'FOLD' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                >
                  弃牌
                </button>
                <button
                  onClick={() => setSelectedAction('CHECK')}
                  disabled={gameState.currentBet > (gameState.players.find((p: GamePlayer) => p.isHero)?.currentBet || 0)}
                  className={`px-4 py-2 rounded ${selectedAction === 'CHECK' ? 'bg-blue-500 text-white' : 'bg-gray-200'} ${gameState.currentBet > 0 ? 'opacity-50' : ''}`}
                >
                  过牌
                </button>
                <button
                  onClick={() => setSelectedAction('CALL')}
                  disabled={gameState.currentBet === 0}
                  className={`px-4 py-2 rounded ${selectedAction === 'CALL' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                >
                  跟注
                </button>
                <button
                  onClick={() => setSelectedAction('BET')}
                  disabled={gameState.currentBet > 0}
                  className={`px-4 py-2 rounded ${selectedAction === 'BET' ? 'bg-orange-500 text-white' : 'bg-gray-200'}`}
                >
                  下注
                </button>
                <button
                  onClick={() => setSelectedAction('RAISE')}
                  disabled={gameState.currentBet === 0}
                  className={`px-4 py-2 rounded ${selectedAction === 'RAISE' ? 'bg-purple-500 text-white' : 'bg-gray-200'}`}
                >
                  加注
                </button>
                <button
                  onClick={() => setSelectedAction('ALL_IN')}
                  className={`px-4 py-2 rounded ${selectedAction === 'ALL_IN' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}
                >
                  全下
                </button>
              </div>

              {(selectedAction === 'BET' || selectedAction === 'RAISE') && (
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-2">下注金额</label>
                  <div className="flex gap-2">
                    <input
                      type="range"
                      min={gameState.currentBet * 2 || gameState.pot * 0.5}
                      max={gameState.players.find((p: GamePlayer) => p.isHero)?.chips || 100}
                      value={betAmount}
                      onChange={(e) => setBetAmount(Number(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(Number(e.target.value))}
                      className="w-24 px-2 py-1 border rounded"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setBetAmount(Math.floor(gameState.pot * 0.33))}
                      className="px-3 py-1 bg-gray-200 rounded text-sm"
                    >
                      1/3底池
                    </button>
                    <button
                      onClick={() => setBetAmount(Math.floor(gameState.pot * 0.5))}
                      className="px-3 py-1 bg-gray-200 rounded text-sm"
                    >
                      1/2底池
                    </button>
                    <button
                      onClick={() => setBetAmount(Math.floor(gameState.pot * 0.75))}
                      className="px-3 py-1 bg-gray-200 rounded text-sm"
                    >
                      3/4底池
                    </button>
                    <button
                      onClick={() => setBetAmount(gameState.pot)}
                      className="px-3 py-1 bg-gray-200 rounded text-sm"
                    >
                      底池
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handlePlayerAction}
                disabled={!selectedAction}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                确认操作
              </button>
            </div>
          )}

          {/* 结果显示 */}
          {showResult && (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <div className="text-xl font-bold mb-4">本手牌结束</div>
              <button
                onClick={startNewHand}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
              >
                下一手牌
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}