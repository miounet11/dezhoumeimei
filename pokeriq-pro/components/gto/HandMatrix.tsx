'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card } from '@/types';
import { ALL_STARTING_HANDS, cardsToHandString, getRankValue } from '@/lib/utils/poker';

export interface HandMatrixProps {
  selectedHands?: string[];
  onHandSelect?: (hand: string) => void;
  onRangeSelect?: (hands: string[]) => void;
  colorScheme?: 'gto' | 'equity' | 'frequency';
  showPercentages?: boolean;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface HandCell {
  hand: string;
  type: 'pair' | 'suited' | 'offsuit';
  rank1: string;
  rank2: string;
  color: string;
  value?: number;
  selected: boolean;
}

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

// GTO color scheme based on hand strength
const GTO_COLORS = {
  premium: '#10b981', // Green - Always play
  strong: '#06b6d4',   // Cyan - Usually play
  playable: '#3b82f6', // Blue - Sometimes play
  marginal: '#f59e0b', // Yellow - Rarely play
  weak: '#ef4444',     // Red - Usually fold
  unplayable: '#6b7280' // Gray - Always fold
};

export const HandMatrix: React.FC<HandMatrixProps> = ({
  selectedHands = [],
  onHandSelect,
  onRangeSelect,
  colorScheme = 'gto',
  showPercentages = false,
  interactive = true,
  size = 'md',
  className = ''
}) => {
  const [dragSelection, setDragSelection] = useState<{
    start: { row: number; col: number } | null;
    current: { row: number; col: number } | null;
    isSelecting: boolean;
  }>({
    start: null,
    current: null,
    isSelecting: false
  });

  // Generate matrix data
  const matrix = useMemo((): HandCell[][] => {
    const result: HandCell[][] = [];
    
    for (let row = 0; row < 13; row++) {
      const matrixRow: HandCell[] = [];
      
      for (let col = 0; col < 13; col++) {
        const rank1 = RANKS[row];
        const rank2 = RANKS[col];
        
        let hand: string;
        let type: 'pair' | 'suited' | 'offsuit';
        
        if (row === col) {
          // Pairs
          hand = `${rank1}${rank2}`;
          type = 'pair';
        } else if (row < col) {
          // Suited (above diagonal)
          hand = `${rank1}${rank2}s`;
          type = 'suited';
        } else {
          // Offsuit (below diagonal)
          hand = `${rank2}${rank1}o`;
          type = 'offsuit';
        }
        
        const color = getHandColor(hand, colorScheme);
        const value = getHandValue(hand, colorScheme);
        const selected = selectedHands.includes(hand);
        
        matrixRow.push({
          hand,
          type,
          rank1,
          rank2,
          color,
          value,
          selected
        });
      }
      
      result.push(matrixRow);
    }
    
    return result;
  }, [selectedHands, colorScheme]);

  // Handle cell click
  const handleCellClick = useCallback((hand: string) => {
    if (!interactive) return;
    onHandSelect?.(hand);
  }, [interactive, onHandSelect]);

  // Handle drag start
  const handleMouseDown = useCallback((row: number, col: number) => {
    if (!interactive) return;
    
    setDragSelection({
      start: { row, col },
      current: { row, col },
      isSelecting: true
    });
  }, [interactive]);

  // Handle drag move
  const handleMouseEnter = useCallback((row: number, col: number) => {
    if (!dragSelection.isSelecting) return;
    
    setDragSelection(prev => ({
      ...prev,
      current: { row, col }
    }));
  }, [dragSelection.isSelecting]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    if (!dragSelection.isSelecting || !dragSelection.start || !dragSelection.current) {
      setDragSelection({ start: null, current: null, isSelecting: false });
      return;
    }
    
    // Calculate selected range
    const minRow = Math.min(dragSelection.start.row, dragSelection.current.row);
    const maxRow = Math.max(dragSelection.start.row, dragSelection.current.row);
    const minCol = Math.min(dragSelection.start.col, dragSelection.current.col);
    const maxCol = Math.max(dragSelection.start.col, dragSelection.current.col);
    
    const selectedRange: string[] = [];
    
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        selectedRange.push(matrix[row][col].hand);
      }
    }
    
    onRangeSelect?.(selectedRange);
    
    setDragSelection({ start: null, current: null, isSelecting: false });
  }, [dragSelection, matrix, onRangeSelect]);

  // Check if cell is in drag selection
  const isCellInDragSelection = useCallback((row: number, col: number): boolean => {
    if (!dragSelection.start || !dragSelection.current) return false;
    
    const minRow = Math.min(dragSelection.start.row, dragSelection.current.row);
    const maxRow = Math.max(dragSelection.start.row, dragSelection.current.row);
    const minCol = Math.min(dragSelection.start.col, dragSelection.current.col);
    const maxCol = Math.max(dragSelection.start.col, dragSelection.current.col);
    
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  }, [dragSelection]);

  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  return (
    <div className={`select-none ${className}`}>
      <div className="inline-block border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
        {matrix.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((cell, colIndex) => {
              const isInDragSelection = isCellInDragSelection(rowIndex, colIndex);
              
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    ${sizeClasses[size]}
                    border border-gray-200 dark:border-gray-700
                    flex items-center justify-center
                    font-medium
                    transition-all duration-150
                    ${interactive ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                    ${cell.selected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                    ${isInDragSelection ? 'ring-2 ring-purple-400 ring-inset' : ''}
                  `}
                  style={{
                    backgroundColor: cell.color,
                    color: getTextColor(cell.color)
                  }}
                  onClick={() => handleCellClick(cell.hand)}
                  onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                  onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                  onMouseUp={handleMouseUp}
                >
                  <div className="text-center">
                    <div className="font-bold">
                      {cell.type === 'pair' ? cell.rank1 + cell.rank2 : 
                       cell.type === 'suited' ? `${cell.rank1}${cell.rank2}s` :
                       `${cell.rank1}${cell.rank2}o`}
                    </div>
                    {showPercentages && cell.value && (
                      <div className="text-xs opacity-75">
                        {cell.value.toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-4">
        <div className="flex flex-wrap gap-2 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded border" style={{ backgroundColor: GTO_COLORS.premium }}></div>
            <span>Premium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded border" style={{ backgroundColor: GTO_COLORS.strong }}></div>
            <span>Strong</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded border" style={{ backgroundColor: GTO_COLORS.playable }}></div>
            <span>Playable</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded border" style={{ backgroundColor: GTO_COLORS.marginal }}></div>
            <span>Marginal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded border" style={{ backgroundColor: GTO_COLORS.weak }}></div>
            <span>Weak</span>
          </div>
        </div>
        
        {selectedHands.length > 0 && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Selected: {selectedHands.length} hands ({((selectedHands.length / 169) * 100).toFixed(1)}%)
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
function getHandColor(hand: string, colorScheme: string): string {
  if (colorScheme === 'gto') {
    return getGTOHandColor(hand);
  } else if (colorScheme === 'equity') {
    return getEquityHandColor(hand);
  } else {
    return getFrequencyHandColor(hand);
  }
}

function getGTOHandColor(hand: string): string {
  // Simplified GTO coloring based on hand strength tiers
  const premiumHands = ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'];
  const strongHands = ['TT', '99', 'AQs', 'AQo', 'AJs', 'AJo', 'KQs', 'KQo'];
  const playableHands = ['88', '77', 'ATs', 'ATo', 'A9s', 'KJs', 'KJo', 'QJs', 'QJo', 'JTs'];
  const marginalHands = ['66', '55', '44', '33', '22', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'K9s', 'KTs', 'QTs', 'J9s', 'T9s', '98s'];
  
  if (premiumHands.includes(hand)) return GTO_COLORS.premium;
  if (strongHands.includes(hand)) return GTO_COLORS.strong;
  if (playableHands.includes(hand)) return GTO_COLORS.playable;
  if (marginalHands.includes(hand)) return GTO_COLORS.marginal;
  
  // Check if it's a reasonable offsuit hand
  if (hand.endsWith('o')) {
    const rank1 = hand[0];
    const rank2 = hand[1];
    const val1 = getRankValue(rank1 as Card['rank']);
    const val2 = getRankValue(rank2 as Card['rank']);
    
    if (val1 >= 12 && val2 >= 9) return GTO_COLORS.marginal; // High cards
    if (val1 >= 10 && val2 >= 8) return GTO_COLORS.weak;
  }
  
  return GTO_COLORS.unplayable;
}

function getEquityHandColor(hand: string): string {
  // This would typically be calculated based on actual equity vs random hands
  // For now, using a simplified approximation
  const handStrength = getSimplifiedHandStrength(hand);
  
  if (handStrength > 80) return GTO_COLORS.premium;
  if (handStrength > 65) return GTO_COLORS.strong;
  if (handStrength > 50) return GTO_COLORS.playable;
  if (handStrength > 35) return GTO_COLORS.marginal;
  if (handStrength > 20) return GTO_COLORS.weak;
  return GTO_COLORS.unplayable;
}

function getFrequencyHandColor(hand: string): string {
  // This would show how often the hand should be played in certain spots
  // Using GTO coloring as fallback for now
  return getGTOHandColor(hand);
}

function getHandValue(hand: string, colorScheme: string): number | undefined {
  if (colorScheme === 'equity') {
    return getSimplifiedHandStrength(hand);
  }
  // Could return frequency values for frequency scheme
  return undefined;
}

function getSimplifiedHandStrength(hand: string): number {
  // Simplified hand strength calculation for display purposes
  if (hand.length === 2) {
    // Pairs
    const rank = hand[0];
    const val = getRankValue(rank as Card['rank']);
    return 50 + (val - 2) * 3;
  }
  
  const rank1 = getRankValue(hand[0] as Card['rank']);
  const rank2 = getRankValue(hand[1] as Card['rank']);
  const suited = hand.endsWith('s');
  const gap = Math.abs(rank1 - rank2);
  
  let strength = (rank1 + rank2) * 2;
  if (suited) strength += 10;
  if (gap === 1) strength += 5; // Connected
  if (gap === 0) strength += 20; // Pair (shouldn't happen here)
  
  return Math.min(strength, 100);
}

function getTextColor(backgroundColor: string): string {
  // Simple contrast calculation - in production, use a proper contrast library
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}