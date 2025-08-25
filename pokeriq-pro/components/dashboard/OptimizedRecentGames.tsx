'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface RecentGame {
  id: number;
  type: string;
  result: string;
  earnings: number;
  date: string;
  status: 'win' | 'loss' | 'draw';
}

interface OptimizedRecentGamesProps {
  games: RecentGame[];
  maxItems?: number;
}

// Memoized individual game item
const GameItem = memo(({ 
  game, 
  index 
}: { 
  game: RecentGame; 
  index: number;
}) => {
  const statusClasses = useMemo(() => {
    return game.status === 'win' 
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 group-hover/game:bg-green-200 dark:group-hover/game:bg-green-800/50' 
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 group-hover/game:bg-red-200 dark:group-hover/game:bg-red-800/50';
  }, [game.status]);

  const earningsClasses = useMemo(() => {
    return game.earnings > 0 
      ? 'text-green-600 dark:text-green-400 group-hover/game:text-green-700 dark:group-hover/game:text-green-300' 
      : 'text-red-600 dark:text-red-400 group-hover/game:text-red-700 dark:group-hover/game:text-red-300';
  }, [game.earnings]);

  const animationDelay = useMemo(() => `${index * 100}ms`, [index]);

  return (
    <div 
      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group/game"
      style={{ animationDelay }}
    >
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-900 dark:text-white group-hover/game:text-blue-700 dark:group-hover/game:text-blue-300 transition-colors duration-300">
            {game.type}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 group-hover/game:scale-110 ${statusClasses}`}>
            {game.result}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400 group-hover/game:text-gray-600 dark:group-hover/game:text-gray-300 transition-colors duration-300">
            {game.date}
          </span>
          <span className={`font-medium transition-all duration-300 group-hover/game:scale-110 ${earningsClasses}`}>
            {game.earnings > 0 ? '+' : ''}${Math.abs(game.earnings)}
          </span>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-transparent group-hover/game:text-blue-400 group-hover/game:translate-x-1 transition-all duration-300 ml-2" />
    </div>
  );
});

GameItem.displayName = 'GameItem';

// Memoized recent games list
const OptimizedRecentGames = memo(({ 
  games, 
  maxItems = 5 
}: OptimizedRecentGamesProps) => {
  const displayGames = useMemo(() => {
    return games.slice(0, maxItems);
  }, [games, maxItems]);

  const gameItems = useMemo(() => {
    return displayGames.map((game, index) => (
      <GameItem key={game.id} game={game} index={index} />
    ));
  }, [displayGames]);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
        🎮 <span className="ml-2">最近游戏</span>
      </h3>
      
      <div className="space-y-3">
        {gameItems}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Link href="/analytics" className="block">
          <button className="w-full p-3 text-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg group/view">
            <span className="flex items-center justify-center space-x-2">
              <span>查看全部游戏记录</span>
              <ChevronRight className="w-4 h-4 group-hover/view:translate-x-1 transition-transform duration-300" />
            </span>
          </button>
        </Link>
      </div>
    </div>
  );
});

OptimizedRecentGames.displayName = 'OptimizedRecentGames';

export default OptimizedRecentGames;