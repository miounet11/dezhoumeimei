'use client';

import { Card } from './Card';

interface GameTableProps {
  players: any[];
  communityCards: string[];
  pot: number;
  currentBet: number;
  street: string;
  actionOn: number;
  playerSeat: number;
  playerCards: string[];
}

export default function GameTable({
  players,
  communityCards,
  pot,
  currentBet,
  street,
  actionOn,
  playerSeat,
  playerCards
}: GameTableProps) {
  const cardPositions = [
    { left: '30%', top: '45%' },
    { left: '40%', top: '45%' },
    { left: '50%', top: '45%' },
    { left: '60%', top: '45%' },
    { left: '70%', top: '45%' }
  ];

  const playerPositions = [
    { left: '50%', bottom: '5%', transform: 'translateX(-50%)' }, // 玩家位置（底部中央）
    { left: '50%', top: '5%', transform: 'translateX(-50%)' }    // AI位置（顶部中央）
  ];

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
        <div className="flex space-x-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <div key={index} className="relative">
              {communityCards[index] ? (
                <Card card={communityCards[index]} />
              ) : (
                <div className="w-16 h-24 bg-gray-700/30 rounded-lg border-2 border-gray-600 border-dashed"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 玩家 */}
      {players.map((player, index) => (
        <div
          key={index}
          className="absolute"
          style={playerPositions[index]}
        >
          <div className={`text-center ${actionOn === index ? 'animate-pulse' : ''}`}>
            {/* 玩家头像和信息 */}
            <div className={`
              bg-gray-800 rounded-lg px-4 py-2 mb-2
              ${actionOn === index ? 'ring-2 ring-yellow-400' : ''}
              ${player.status === 'folded' ? 'opacity-50' : ''}
            `}>
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
            <div className="flex justify-center space-x-1">
              {index === playerSeat ? (
                // 显示玩家的真实手牌
                playerCards.map((card, cardIndex) => (
                  <Card key={cardIndex} card={card} />
                ))
              ) : (
                // AI玩家显示背面
                player.status !== 'folded' && (
                  <>
                    <Card card="back" />
                    <Card card="back" />
                  </>
                )
              )}
            </div>
          </div>
        </div>
      ))}

      {/* 游戏阶段指示器 */}
      <div className="absolute top-4 left-4 bg-black/50 rounded-lg px-3 py-1">
        <div className="text-xs text-gray-400">当前阶段</div>
        <div className="text-sm text-white font-bold">
          {street === 'PREFLOP' && '翻前'}
          {street === 'FLOP' && '翻牌'}
          {street === 'TURN' && '转牌'}
          {street === 'RIVER' && '河牌'}
          {street === 'SHOWDOWN' && '摊牌'}
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
}