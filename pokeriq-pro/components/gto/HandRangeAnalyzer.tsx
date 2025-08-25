'use client';

import React, { useState, useMemo } from 'react';
import { Position } from '@/types';
import { HandMatrix } from './HandMatrix';
import { getGTOStartingHandRange, getPositionName, getPositionsForPlayerCount, ALL_STARTING_HANDS } from '@/lib/utils/poker';

export interface HandRangeAnalyzerProps {
  position: Position;
  players: number;
  action: 'raise' | 'call' | 'fold';
  onRangeChange?: (range: string[]) => void;
  className?: string;
}

interface RangeStats {
  totalHands: number;
  combinations: number;
  percentage: number;
  equity: number;
  handTypes: {
    pairs: number;
    suited: number;
    offsuit: number;
  };
}

export const HandRangeAnalyzer: React.FC<HandRangeAnalyzerProps> = ({
  position: initialPosition,
  players: initialPlayers = 6,
  action: initialAction = 'raise',
  onRangeChange,
  className = ''
}) => {
  const [position, setPosition] = useState<Position>(initialPosition);
  const [players, setPlayers] = useState(initialPlayers);
  const [action, setAction] = useState<'raise' | 'call' | 'fold'>(initialAction);
  const [customRange, setCustomRange] = useState<string[]>([]);
  const [rangeMode, setRangeMode] = useState<'gto' | 'custom'>('gto');
  const [selectedHands, setSelectedHands] = useState<string[]>([]);

  // Get available positions based on player count
  const availablePositions = useMemo(() => {
    return getPositionsForPlayerCount(players);
  }, [players]);

  // Get GTO range for current settings
  const gtoRange = useMemo(() => {
    return getGTOStartingHandRange(position, action, players);
  }, [position, action, players]);

  // Current active range
  const activeRange = useMemo(() => {
    return rangeMode === 'gto' ? gtoRange : customRange;
  }, [rangeMode, gtoRange, customRange]);

  // Calculate range statistics
  const rangeStats = useMemo((): RangeStats => {
    const range = activeRange;
    
    let pairs = 0;
    let suited = 0;
    let offsuit = 0;
    let totalCombinations = 0;

    range.forEach(hand => {
      if (hand.length === 2 && hand[0] === hand[1]) {
        pairs++;
        totalCombinations += 6; // 6 combinations for each pair
      } else if (hand.endsWith('s')) {
        suited++;
        totalCombinations += 4; // 4 combinations for each suited hand
      } else if (hand.endsWith('o')) {
        offsuit++;
        totalCombinations += 12; // 12 combinations for each offsuit hand
      }
    });

    const percentage = (range.length / ALL_STARTING_HANDS.length) * 100;
    const equity = calculateRangeEquity(range); // Simplified equity calculation

    return {
      totalHands: range.length,
      combinations: totalCombinations,
      percentage,
      equity,
      handTypes: { pairs, suited, offsuit }
    };
  }, [activeRange]);

  // Handle hand selection from matrix
  const handleHandSelect = (hand: string) => {
    if (rangeMode !== 'custom') return;

    setSelectedHands(prev => {
      const newSelection = prev.includes(hand) 
        ? prev.filter(h => h !== hand)
        : [...prev, hand];
      
      setCustomRange(newSelection);
      onRangeChange?.(newSelection);
      return newSelection;
    });
  };

  // Handle range selection from matrix (drag selection)
  const handleRangeSelect = (hands: string[]) => {
    if (rangeMode !== 'custom') return;

    // Toggle the selected range
    const currentlySelected = hands.every(hand => customRange.includes(hand));
    
    if (currentlySelected) {
      // Remove all hands in the selection
      const newRange = customRange.filter(hand => !hands.includes(hand));
      setCustomRange(newRange);
      setSelectedHands(newRange);
      onRangeChange?.(newRange);
    } else {
      // Add all hands in the selection
      const newRange = [...new Set([...customRange, ...hands])];
      setCustomRange(newRange);
      setSelectedHands(newRange);
      onRangeChange?.(newRange);
    }
  };

  // Quick range presets
  const applyPreset = (preset: string) => {
    let range: string[] = [];
    
    switch (preset) {
      case 'tight':
        range = ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs'];
        break;
      case 'standard':
        range = ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'KQs', 'KQo'];
        break;
      case 'loose':
        range = getGTOStartingHandRange(position, 'raise', players).concat(
          getGTOStartingHandRange(position, 'call', players)
        );
        break;
      case 'clear':
        range = [];
        break;
      default:
        return;
    }
    
    setRangeMode('custom');
    setCustomRange(range);
    setSelectedHands(range);
    onRangeChange?.(range);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Hand Range Analyzer
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Analyze and visualize poker hand ranges for different positions and actions
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Position Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Position
          </label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as Position)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {availablePositions.map(pos => (
              <option key={pos} value={pos}>
                {getPositionName(pos)} ({pos})
              </option>
            ))}
          </select>
        </div>

        {/* Player Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Players
          </label>
          <select
            value={players}
            onChange={(e) => setPlayers(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            {[2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <option key={num} value={num}>{num} Max</option>
            ))}
          </select>
        </div>

        {/* Action */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Action
          </label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as 'raise' | 'call' | 'fold')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="raise">Raise</option>
            <option value="call">Call</option>
            <option value="fold">Fold</option>
          </select>
        </div>
      </div>

      {/* Range Mode Toggle */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setRangeMode('gto')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            rangeMode === 'gto'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          GTO Range
        </button>
        <button
          onClick={() => setRangeMode('custom')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            rangeMode === 'custom'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Custom Range
        </button>
      </div>

      {/* Quick Presets (only for custom mode) */}
      {rangeMode === 'custom' && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => applyPreset('tight')}
            className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
          >
            Tight
          </button>
          <button
            onClick={() => applyPreset('standard')}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
          >
            Standard
          </button>
          <button
            onClick={() => applyPreset('loose')}
            className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-md hover:bg-orange-200 transition-colors"
          >
            Loose
          </button>
          <button
            onClick={() => applyPreset('clear')}
            className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hand Matrix */}
        <div className="lg:col-span-2">
          <HandMatrix
            selectedHands={rangeMode === 'gto' ? gtoRange : selectedHands}
            onHandSelect={handleHandSelect}
            onRangeSelect={handleRangeSelect}
            interactive={rangeMode === 'custom'}
            size="md"
            colorScheme="gto"
          />
        </div>

        {/* Statistics Panel */}
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Range Statistics</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Hands:</span>
                <span className="font-medium">{rangeStats.totalHands}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Combinations:</span>
                <span className="font-medium">{rangeStats.combinations}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Percentage:</span>
                <span className="font-medium">{rangeStats.percentage.toFixed(1)}%</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Avg Equity:</span>
                <span className="font-medium">{rangeStats.equity.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Hand Type Breakdown */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Hand Types</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pairs:</span>
                <span className="font-medium">{rangeStats.handTypes.pairs}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Suited:</span>
                <span className="font-medium">{rangeStats.handTypes.suited}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Offsuit:</span>
                <span className="font-medium">{rangeStats.handTypes.offsuit}</span>
              </div>
            </div>
          </div>

          {/* Current Range Display */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Current Range</h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto">
              {activeRange.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {activeRange.sort().map(hand => (
                    <span
                      key={hand}
                      className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded"
                    >
                      {hand}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="italic">No hands selected</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simplified equity calculation for range
function calculateRangeEquity(range: string[]): number {
  // This is a simplified calculation
  // In a full implementation, this would use actual Monte Carlo simulation
  const handStrengths = range.map(hand => {
    if (hand.length === 2 && hand[0] === hand[1]) {
      // Pairs
      const rank = hand[0];
      switch (rank) {
        case 'A': return 85;
        case 'K': return 82;
        case 'Q': return 80;
        case 'J': return 77;
        case 'T': return 75;
        default: return 70 - (14 - hand.charCodeAt(0)) * 2;
      }
    }
    
    // Simplified calculation for non-pairs
    const suited = hand.endsWith('s');
    const rank1 = hand[0];
    const rank2 = hand[1];
    
    let equity = 45; // Base equity
    
    // Add for high cards
    if (rank1 === 'A') equity += 15;
    else if (rank1 === 'K') equity += 12;
    else if (rank1 === 'Q') equity += 8;
    else if (rank1 === 'J') equity += 5;
    
    if (rank2 === 'A') equity += 10;
    else if (rank2 === 'K') equity += 8;
    else if (rank2 === 'Q') equity += 5;
    else if (rank2 === 'J') equity += 3;
    
    // Add for suited
    if (suited) equity += 5;
    
    return Math.min(equity, 95);
  });
  
  return handStrengths.reduce((sum, strength) => sum + strength, 0) / handStrengths.length;
}