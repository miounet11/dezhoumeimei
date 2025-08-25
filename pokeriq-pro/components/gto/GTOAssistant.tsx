'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, Position } from '@/types';
import { GTOEngine, GameState, GTOAnalysis } from '@/lib/gto/engine';
import { HandMatrix } from './HandMatrix';
import { cardsToHandString, getPositionName, getSuitSymbol, getSuitColor } from '@/lib/utils/poker';
import { Calculator, TrendingUp, Target, Brain, BarChart3, Lightbulb } from 'lucide-react';

export interface GTOAssistantProps {
  className?: string;
}

interface CardSelectorProps {
  label: string;
  selectedCards: Card[];
  onCardSelect: (cards: Card[]) => void;
  maxCards: number;
}

const RANKS: Card['rank'][] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS: Card['suit'][] = ['spades', 'hearts', 'diamonds', 'clubs'];
const POSITIONS: Position[] = ['UTG', 'UTG+1', 'MP', 'MP+1', 'CO', 'BTN', 'SB', 'BB'];

const CardSelector: React.FC<CardSelectorProps> = ({
  label,
  selectedCards,
  onCardSelect,
  maxCards
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCardClick = (rank: Card['rank'], suit: Card['suit']) => {
    const newCard: Card = { rank, suit };
    const cardKey = `${rank}${suit}`;
    
    // Check if card already exists
    const existingIndex = selectedCards.findIndex(
      c => `${c.rank}${c.suit}` === cardKey
    );

    if (existingIndex >= 0) {
      // Remove existing card
      const newCards = selectedCards.filter((_, i) => i !== existingIndex);
      onCardSelect(newCards);
    } else if (selectedCards.length < maxCards) {
      // Add new card
      onCardSelect([...selectedCards, newCard]);
    }
    
    if (selectedCards.length + 1 >= maxCards) {
      setIsOpen(false);
    }
  };

  const isCardSelected = (rank: Card['rank'], suit: Card['suit']) => {
    return selectedCards.some(c => c.rank === rank && c.suit === suit);
  };

  const isCardDisabled = (rank: Card['rank'], suit: Card['suit']) => {
    if (selectedCards.length >= maxCards) {
      return !isCardSelected(rank, suit);
    }
    return false;
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      
      {/* Selected Cards Display */}
      <div 
        className="flex flex-wrap gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 cursor-pointer min-h-[50px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedCards.map((card, index) => (
          <div
            key={`${card.rank}${card.suit}`}
            className={`flex items-center justify-center w-8 h-10 rounded border-2 font-bold text-sm ${
              getSuitColor(card.suit) === 'red' 
                ? 'text-red-600 border-red-300 bg-red-50' 
                : 'text-gray-800 border-gray-300 bg-gray-50'
            }`}
          >
            <span>{card.rank}</span>
            <span className="ml-0.5">{getSuitSymbol(card.suit)}</span>
          </div>
        ))}
        
        {selectedCards.length === 0 && (
          <span className="text-gray-400 dark:text-gray-500 flex items-center">
            Click to select cards
          </span>
        )}
      </div>

      {/* Card Selector Grid */}
      {isOpen && (
        <div className="absolute z-50 mt-1 p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {SUITS.map(suit => (
              <div key={suit} className="text-center">
                <span className={`text-lg ${getSuitColor(suit) === 'red' ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>
                  {getSuitSymbol(suit)}
                </span>
              </div>
            ))}
          </div>
          
          {RANKS.map(rank => (
            <div key={rank} className="grid grid-cols-4 gap-2 mb-1">
              {SUITS.map(suit => {
                const selected = isCardSelected(rank, suit);
                const disabled = isCardDisabled(rank, suit);
                
                return (
                  <button
                    key={`${rank}${suit}`}
                    onClick={() => handleCardClick(rank, suit)}
                    disabled={disabled}
                    className={`w-8 h-8 rounded border font-bold text-xs transition-all ${
                      selected
                        ? 'bg-blue-500 text-white border-blue-600'
                        : disabled
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : getSuitColor(suit) === 'red'
                        ? 'bg-red-50 text-red-600 border-red-300 hover:bg-red-100'
                        : 'bg-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {rank}
                  </button>
                );
              })}
            </div>
          ))}
          
          <div className="flex justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => onCardSelect([])}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const GTOAssistant: React.FC<GTOAssistantProps> = ({ className = '' }) => {
  const [holeCards, setHoleCards] = useState<Card[]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [position, setPosition] = useState<Position>('BTN');
  const [stackSize, setStackSize] = useState(100);
  const [potSize, setPotSize] = useState(10);
  const [toCall, setToCall] = useState(0);
  const [opponents, setOpponents] = useState(1);
  const [analysis, setAnalysis] = useState<GTOAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const gtoEngine = useMemo(() => new GTOEngine(), []);

  // Auto-analyze when inputs change
  useEffect(() => {
    if (holeCards.length === 2) {
      analyzeCurrentSituation();
    } else {
      setAnalysis(null);
    }
  }, [holeCards, communityCards, position, stackSize, potSize, toCall, opponents]);

  const analyzeCurrentSituation = async () => {
    if (holeCards.length !== 2) return;

    setIsAnalyzing(true);
    
    try {
      const gameState: GameState = {
        holeCards,
        communityCards,
        position,
        stackSize,
        potSize,
        toCall,
        previousAction: '',
        opponents,
        effectiveStacks: stackSize,
        street: communityCards.length === 0 ? 'preflop' : 
               communityCards.length === 3 ? 'flop' :
               communityCards.length === 4 ? 'turn' : 'river'
      };

      const gtoAnalysis = await gtoEngine.analyzeGameState(gameState);
      setAnalysis(gtoAnalysis);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const currentStreet = communityCards.length === 0 ? 'Preflop' : 
                      communityCards.length === 3 ? 'Flop' :
                      communityCards.length === 4 ? 'Turn' : 'River';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">GTO Assistant</h2>
          <p className="text-gray-600 dark:text-gray-400">Get optimal play recommendations for any situation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="xl:col-span-1 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Game Setup</h3>
            
            {/* Cards */}
            <div className="space-y-4">
              <CardSelector
                label="Your Hole Cards"
                selectedCards={holeCards}
                onCardSelect={setHoleCards}
                maxCards={2}
              />
              
              <CardSelector
                label="Community Cards"
                selectedCards={communityCards}
                onCardSelect={setCommunityCards}
                maxCards={5}
              />
            </div>

            {/* Position and Opponents */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Position
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as Position)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {POSITIONS.map(pos => (
                    <option key={pos} value={pos}>
                      {getPositionName(pos)} ({pos})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Opponents
                </label>
                <select
                  value={opponents}
                  onChange={(e) => setOpponents(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pot Info */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stack (BB)
                </label>
                <input
                  type="number"
                  value={stackSize}
                  onChange={(e) => setStackSize(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  min="1"
                  max="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pot Size
                </label>
                <input
                  type="number"
                  value={potSize}
                  onChange={(e) => setPotSize(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  min="0"
                  max="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To Call
                </label>
                <input
                  type="number"
                  value={toCall}
                  onChange={(e) => setToCall(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  min="0"
                  max="1000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="xl:col-span-2">
          {isAnalyzing ? (
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400">Analyzing position...</p>
              </div>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg mx-auto mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {analysis.equity.toFixed(1)}%
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Equity</div>
                </div>

                <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-800 rounded-lg mx-auto mb-2">
                    <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {analysis.handStrength.toFixed(0)}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Hand Strength</div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-100 dark:bg-orange-800 rounded-lg mx-auto mb-2">
                    <Calculator className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {analysis.potOdds.toFixed(1)}%
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400">Pot Odds</div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">GTO Recommendations</h3>
                </div>

                <div className="space-y-3">
                  {analysis.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        rec === analysis.optimalAction
                          ? 'border-green-500 bg-green-50 dark:bg-green-900'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-lg ${
                            rec === analysis.optimalAction 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {rec.action.toUpperCase()}
                            {rec === analysis.optimalAction && (
                              <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded-full">
                                OPTIMAL
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {(rec.frequency * 100).toFixed(0)}% frequency
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            EV: {rec.ev.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      {rec.sizing && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Size: ${rec.sizing} ({rec.sizingBB?.toFixed(1)} BB)
                        </div>
                      )}
                      
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {rec.reasoning}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Board Analysis */}
              {analysis.flopTexture && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Board Analysis</h3>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analysis.flopTexture.texture.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Texture</div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analysis.flopTexture.connectedness}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Connected</div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analysis.flopTexture.suitedness}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Suited</div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analysis.flopTexture.highCards}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">High Cards</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Hand Info */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {cardsToHandString(holeCards)} in {getPositionName(position)} ({currentStreet})
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Range: {analysis.handRange.percentage.toFixed(1)}% of hands ({analysis.handRange.combinations} combinations)
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-center">
                <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Select your hole cards to get GTO analysis</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};