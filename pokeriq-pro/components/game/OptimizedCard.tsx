'use client';

import React, { memo, useMemo } from 'react';

interface CardProps {
  card: string;
}

// 优化的Card组件 - 使用memo和useMemo减少重渲染
export const Card = memo<CardProps>(function Card({ card }) {
  // 缓存卡背面组件，因为它永远不变
  const BackCard = useMemo(() => (
    <div className="w-16 h-24 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg shadow-lg border border-blue-700 flex items-center justify-center">
      <div className="w-12 h-16 border-2 border-blue-600 rounded bg-blue-800/50"></div>
    </div>
  ), []);

  if (card === 'back') {
    return BackCard;
  }

  // 缓存卡牌解析结果
  const { rank, suit, suitSymbol, suitColor, rankDisplay } = useMemo(() => {
    const cardRank = card[0];
    const cardSuit = card[1];

    const getSuitSymbol = (suit: string) => {
      switch (suit) {
        case 'h': return '♥';
        case 'd': return '♦';
        case 'c': return '♣';
        case 's': return '♠';
        default: return '';
      }
    };

    const getSuitColor = (suit: string) => {
      return suit === 'h' || suit === 'd' ? 'text-red-500' : 'text-black';
    };

    const getRankDisplay = (rank: string) => {
      return rank === 'T' ? '10' : rank;
    };

    return {
      rank: cardRank,
      suit: cardSuit,
      suitSymbol: getSuitSymbol(cardSuit),
      suitColor: getSuitColor(cardSuit),
      rankDisplay: getRankDisplay(cardRank)
    };
  }, [card]);

  // 缓存样式类名
  const rankClassName = useMemo(() => 
    `text-2xl font-bold ${suitColor}`, [suitColor]
  );
  
  const suitClassName = useMemo(() => 
    `text-3xl ${suitColor}`, [suitColor]
  );

  return (
    <div className="w-16 h-24 bg-white rounded-lg shadow-lg border border-gray-300 flex flex-col items-center justify-center">
      <div className={rankClassName}>
        {rankDisplay}
      </div>
      <div className={suitClassName}>
        {suitSymbol}
      </div>
    </div>
  );
});