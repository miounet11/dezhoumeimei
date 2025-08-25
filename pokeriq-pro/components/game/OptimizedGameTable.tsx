'use client';

import React, { memo, useMemo, useCallback } from 'react';
import { Card } from './Card';

interface Player {
  name: string;
  stack: number;
  status: 'active' | 'folded' | 'allin';
}

interface GameTableProps {
  players: Player[];
  communityCards: string[];
  pot: number;
  currentBet: number;
  street: string;
  actionOn: number;
  playerSeat: number;
  playerCards: string[];
}

// 优化后的GameTable组件，使用React.memo防止不必要的重渲染
const GameTable = memo<GameTableProps>(function GameTable({
  players,
  communityCards,
  pot,
  currentBet,
  street,
  actionOn,
  playerSeat,
  playerCards
}) {
  // 使用useMemo缓存静态位置配置，避免每次渲染重新创建
  const playerPositions = useMemo(() => [
    { left: '50%', bottom: '5%', transform: 'translateX(-50%)' }, // 玩家位置（底部中央）
    { left: '50%', top: '5%', transform: 'translateX(-50%)' }    // AI位置（顶部中央）
  ], []);

  // 使用useMemo缓存街道名称映射
  const streetNames = useMemo(() => ({
    'PREFLOP': '翻前',
    'FLOP': '翻牌',
    'TURN': '转牌',
    'RIVER': '河牌',
    'SHOWDOWN': '摊牌'
  }), []);

  // 缓存当前街道名称
  const currentStreetName = useMemo(() => 
    streetNames[street as keyof typeof streetNames] || '未知', [street, streetNames]
  );

  // 缓存公共牌区域
  const communityCardsSection = useMemo(() => (
    <div className="flex space-x-2">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={`community-${index}`} className="relative">
          {communityCards[index] ? (
            <Card card={communityCards[index]} />
          ) : (
            <div className="w-16 h-24 bg-gray-700/30 rounded-lg border-2 border-gray-600 border-dashed"></div>
          )}
        </div>
      ))}
    </div>
  ), [communityCards]);

  return (
    <div className="relative w-full max-w-4xl mx-auto h-[500px] bg-gradient-to-br from-green-800 to-green-900 rounded-3xl shadow-2xl overflow-hidden">
      {/* 桌面纹理 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
      </div>

      {/* 桌面边框 */}
      <div className="absolute inset-4 border-4 border-green-700 rounded-2xl"></div>

      {/* 底池 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="bg-black/50 rounded-lg px-6 py-3 backdrop-blur-sm">
          <div className="text-sm text-gray-300">底池</div>
          <div className="text-2xl font-bold text-yellow-400">${pot}</div>
          {currentBet > 0 && (
            <div className="text-sm text-gray-400 mt-1">
              当前下注: ${currentBet}
            </div>
          )}
        </div>
      </div>

      {/* 公共牌 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-20">
        {communityCardsSection}
      </div>

      {/* 玩家 - 使用正确的key来优化渲染 */}
      {players.map((player, index) => (
        <PlayerCard
          key={`player-${index}-${player.name}`}
          player={player}
          index={index}
          isActive={actionOn === index}
          position={playerPositions[index]}
          isCurrentPlayer={index === playerSeat}
          playerCards={index === playerSeat ? playerCards : []}
        />
      ))}

      {/* 游戏阶段指示器 */}
      <div className="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-1">
        <div className="text-xs text-gray-400">当前阶段</div>
        <div className="text-sm text-white font-bold">
          {currentStreetName}
        </div>
      </div>

      {/* 庄家按钮 */}
      <div 
        className="absolute w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-bold text-sm shadow-lg"
        style={{
          left: 'calc(50% + 100px)',
          bottom: '15%',
        }}
      >
        D
      </div>
    </div>
  );
});

// 优化的玩家卡片组件
interface PlayerCardProps {
  player: Player;
  index: number;
  isActive: boolean;
  position: React.CSSProperties;
  isCurrentPlayer: boolean;
  playerCards: string[];
}

const PlayerCard = memo<PlayerCardProps>(function PlayerCard({
  player,
  index,
  isActive,
  position,
  isCurrentPlayer,
  playerCards
}) {
  // 缓存玩家状态样式
  const playerContainerClass = useMemo(() => {
    const baseClass = 'bg-gray-800 rounded-lg px-4 py-2 mb-2';
    const activeClass = isActive ? 'ring-2 ring-yellow-400' : '';
    const foldedClass = player.status === 'folded' ? 'opacity-50' : '';
    return `${baseClass} ${activeClass} ${foldedClass}`.trim();
  }, [isActive, player.status]);

  // 缓存玩家动画类
  const animationClass = useMemo(() => 
    `text-center ${isActive ? 'animate-pulse' : ''}`, [isActive]
  );

  return (
    <div
      className="absolute"
      style={position}
    >
      <div className={animationClass}>
        {/* 玩家头像和信息 */}
        <div className={playerContainerClass}>
          <div className="text-white font-bold">{player.name}</div>
          <div className="text-sm text-gray-300">${player.stack}</div>
          {player.status === 'folded' && (
            <div className="text-xs text-red-400">已弃牌</div>
          )}
          {player.status === 'allin' && (
            <div className="text-xs text-yellow-400">All-in</div>
          )}
        </div>

        {/* 手牌 */}
        <PlayerHand 
          isCurrentPlayer={isCurrentPlayer}
          playerCards={playerCards}
          isFolded={player.status === 'folded'}
        />
      </div>
    </div>
  );
});

// 优化的玩家手牌组件
interface PlayerHandProps {
  isCurrentPlayer: boolean;
  playerCards: string[];
  isFolded: boolean;
}

const PlayerHand = memo<PlayerHandProps>(function PlayerHand({
  isCurrentPlayer,
  playerCards,
  isFolded
}) {
  if (isCurrentPlayer) {
    // 显示玩家的真实手牌
    return (
      <div className="flex justify-center space-x-1">
        {playerCards.map((card, cardIndex) => (
          <Card key={`player-card-${cardIndex}`} card={card} />
        ))}
      </div>
    );
  }

  // AI玩家显示背面
  if (!isFolded) {
    return (
      <div className="flex justify-center space-x-1">
        <Card card="back" />
        <Card card="back" />
      </div>
    );
  }

  return null;
});

export default GameTable;