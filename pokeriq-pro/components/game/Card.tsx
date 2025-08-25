'use client';

interface CardProps {
  card: string;
}

export function Card({ card }: CardProps) {
  if (card === 'back') {
    return (
      <div className="w-16 h-24 bg-gradient-to-br from-blue-800 to-blue-900 rounded-lg shadow-lg border border-blue-700 flex items-center justify-center">
        <div className="w-12 h-16 border-2 border-blue-600 rounded bg-blue-800/50"></div>
      </div>
    );
  }

  const rank = card[0];
  const suit = card[1];

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

  return (
    <div className="w-16 h-24 bg-white rounded-lg shadow-lg border border-gray-300 flex flex-col items-center justify-center">
      <div className={`text-2xl font-bold ${getSuitColor(suit)}`}>
        {getRankDisplay(rank)}
      </div>
      <div className={`text-3xl ${getSuitColor(suit)}`}>
        {getSuitSymbol(suit)}
      </div>
    </div>
  );
}