'use client';

import { useState } from 'react';
import { Card, Button, Typography, Space, Tag, Avatar, Progress } from 'antd';
import { Card as PlayingCard, Player, GameState } from '@/types';

const { Text, Title } = Typography;

interface PokerTableProps {
  gameState?: GameState;
  showPlayerCards?: boolean;
  onAction?: (action: string) => void;
  disabled?: boolean;
}

// 扑克牌花色映射
const suitSymbols = {
  hearts: '♥️',
  diamonds: '♦️',
  clubs: '♣️',
  spades: '♠️'
};

const suitColors = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-black dark:text-white',
  spades: 'text-black dark:text-white'
};

// 扑克牌组件
function PokerCard({ card, hidden = false }: { card?: PlayingCard; hidden?: boolean }) {
  if (!card || hidden) {
    return (
      <div className="w-12 h-16 bg-blue-600 rounded-lg border-2 border-blue-700 flex items-center justify-center shadow-md">
        <div className="w-8 h-10 bg-blue-500 rounded border border-blue-400 flex items-center justify-center">
          <div className="w-6 h-8 bg-white/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-12 h-16 bg-white dark:bg-gray-100 rounded-lg border-2 border-gray-200 shadow-md flex flex-col items-center justify-center">
      <div className={`text-lg font-bold ${suitColors[card.suit]}`}>
        {card.rank}
      </div>
      <div className={`text-sm ${suitColors[card.suit]}`}>
        {suitSymbols[card.suit]}
      </div>
    </div>
  );
}

// 玩家位置组件
function PlayerPosition({ 
  player, 
  isActive, 
  showCards, 
  position 
}: { 
  player: Player; 
  isActive: boolean; 
  showCards: boolean; 
  position: string;
}) {
  return (
    <div className={`relative ${position}`}>
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg border-2 transition-colors ${
        isActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' : 'border-gray-200 dark:border-gray-700'
      }`}>
        {/* 玩家信息 */}
        <div className="text-center mb-2">
          <Avatar size="small" className="bg-gradient-to-r from-purple-500 to-pink-500 mb-1">
            {player.name[0]}
          </Avatar>
          <div className="text-xs font-medium text-gray-800 dark:text-white">
            {player.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            ${player.chips.toLocaleString()}
          </div>
        </div>

        {/* 玩家手牌 */}
        <div className="flex justify-center space-x-1 mb-2">
          <PokerCard card={player.cards[0]} hidden={!showCards} />
          <PokerCard card={player.cards[1]} hidden={!showCards} />
        </div>

        {/* 玩家状态 */}
        <div className="text-center">
          {player.isDealer && (
            <Tag color="gold" size="small" className="mb-1">D</Tag>
          )}
          {player.isSmallBlind && (
            <Tag color="blue" size="small" className="mb-1">SB</Tag>
          )}
          {player.isBigBlind && (
            <Tag color="red" size="small" className="mb-1">BB</Tag>
          )}
          
          {player.action && (
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {player.action.toUpperCase()}
              {player.betAmount && ` $${player.betAmount}`}
            </div>
          )}
        </div>

        {/* 活跃玩家指示器 */}
        {isActive && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
        )}
      </div>
    </div>
  );
}

export default function PokerTable({ 
  gameState, 
  showPlayerCards = false, 
  onAction, 
  disabled = false 
}: PokerTableProps) {
  const [selectedAction, setSelectedAction] = useState<string>('');

  // 模拟游戏状态（如果没有传入）
  const defaultGameState: GameState = {
    id: 'demo-game',
    phase: 'flop',
    players: [
      {
        id: '1',
        name: 'You',
        chips: 2500,
        position: 0,
        cards: [
          { suit: 'hearts', rank: 'A' },
          { suit: 'spades', rank: 'K' }
        ],
        isActive: true,
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: false
      },
      {
        id: '2',
        name: 'Player 2',
        chips: 1800,
        position: 1,
        cards: [],
        action: 'call',
        betAmount: 50,
        isActive: false,
        isDealer: false,
        isSmallBlind: true,
        isBigBlind: false
      },
      {
        id: '3',
        name: 'Player 3',
        chips: 3200,
        position: 2,
        cards: [],
        action: 'raise',
        betAmount: 100,
        isActive: false,
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: true
      },
      {
        id: '4',
        name: 'Player 4',
        chips: 1500,
        position: 3,
        cards: [],
        action: 'fold',
        isActive: false,
        isDealer: true,
        isSmallBlind: false,
        isBigBlind: false
      }
    ],
    communityCards: [
      { suit: 'hearts', rank: '10' },
      { suit: 'diamonds', rank: 'J' },
      { suit: 'clubs', rank: 'Q' }
    ],
    pot: 350,
    currentBet: 100,
    activePlayerIndex: 0,
    dealerIndex: 3,
    smallBlind: 25,
    bigBlind: 50
  };

  const currentGame = gameState || defaultGameState;

  const handleAction = (action: string) => {
    setSelectedAction(action);
    onAction?.(action);
  };

  const phaseLabels = {
    pre_flop: 'Pre-flop',
    flop: 'Flop',
    turn: 'Turn',
    river: 'River',
    showdown: 'Showdown'
  };

  return (
    <div className="bg-gradient-to-br from-green-800 to-green-900 rounded-2xl p-8 shadow-2xl min-h-[600px] relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-800/50 to-green-900/50 rounded-2xl"></div>
      <div className="absolute top-4 left-4 w-32 h-32 bg-green-700/20 rounded-full blur-xl"></div>
      <div className="absolute bottom-4 right-4 w-24 h-24 bg-green-600/20 rounded-full blur-lg"></div>

      <div className="relative z-10">
        {/* 游戏信息 */}
        <div className="flex justify-between items-center mb-6">
          <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2">
            <Text className="text-white font-medium">
              {phaseLabels[currentGame.phase]}
            </Text>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2">
            <Text className="text-white">
              底池: <span className="font-bold text-yellow-400">${currentGame.pot.toLocaleString()}</span>
            </Text>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2">
            <Text className="text-white">
              当前注: <span className="font-bold">${currentGame.currentBet}</span>
            </Text>
          </div>
        </div>

        {/* 牌桌布局 */}
        <div className="relative">
          {/* 公共牌区域 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4">
              <div className="text-center mb-3">
                <Text className="text-white font-medium text-sm">Community Cards</Text>
              </div>
              <div className="flex justify-center space-x-2">
                {[0, 1, 2, 3, 4].map(index => (
                  <PokerCard 
                    key={index}
                    card={currentGame.communityCards[index]} 
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 玩家位置 */}
          <div className="grid grid-cols-3 gap-8 h-96">
            {/* 上方玩家 */}
            <div className="col-start-2 flex justify-center">
              {currentGame.players[1] && (
                <PlayerPosition
                  player={currentGame.players[1]}
                  isActive={currentGame.activePlayerIndex === 1}
                  showCards={showPlayerCards && currentGame.players[1].id === 'player'}
                  position="top"
                />
              )}
            </div>

            {/* 左侧玩家 */}
            <div className="row-start-2 flex items-center justify-start">
              {currentGame.players[3] && (
                <PlayerPosition
                  player={currentGame.players[3]}
                  isActive={currentGame.activePlayerIndex === 3}
                  showCards={showPlayerCards && currentGame.players[3].id === 'player'}
                  position="left"
                />
              )}
            </div>

            {/* 右侧玩家 */}
            <div className="row-start-2 col-start-3 flex items-center justify-end">
              {currentGame.players[2] && (
                <PlayerPosition
                  player={currentGame.players[2]}
                  isActive={currentGame.activePlayerIndex === 2}
                  showCards={showPlayerCards && currentGame.players[2].id === 'player'}
                  position="right"
                />
              )}
            </div>

            {/* 下方玩家（通常是用户） */}
            <div className="row-start-3 col-start-2 flex justify-center">
              {currentGame.players[0] && (
                <PlayerPosition
                  player={currentGame.players[0]}
                  isActive={currentGame.activePlayerIndex === 0}
                  showCards={true} // 始终显示用户手牌
                  position="bottom"
                />
              )}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        {currentGame.activePlayerIndex === 0 && !disabled && (
          <div className="mt-8">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4">
              <div className="text-center mb-4">
                <Text className="text-white font-medium">选择您的行动</Text>
              </div>
              <Space size="large" className="w-full justify-center">
                <Button
                  size="large"
                  danger
                  onClick={() => handleAction('fold')}
                  className="min-w-20"
                >
                  弃牌
                </Button>
                <Button
                  size="large"
                  onClick={() => handleAction('call')}
                  className="min-w-20"
                >
                  跟注
                </Button>
                <Button
                  size="large"
                  type="primary"
                  onClick={() => handleAction('raise')}
                  className="min-w-20"
                >
                  加注
                </Button>
                {currentGame.currentBet === 0 && (
                  <Button
                    size="large"
                    onClick={() => handleAction('check')}
                    className="min-w-20"
                  >
                    过牌
                  </Button>
                )}
              </Space>
            </div>
          </div>
        )}

        {/* 进度指示器（如果需要） */}
        {disabled && (
          <div className="mt-8">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4">
              <div className="text-center">
                <Text className="text-white mb-2 block">等待其他玩家行动...</Text>
                <Progress 
                  percent={65} 
                  size="small" 
                  strokeColor="#52c41a"
                  className="max-w-xs mx-auto"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}