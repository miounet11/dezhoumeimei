'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/types';
import { analyzeFlopTexture, getSuitSymbol, getSuitColor, getRankValue } from '@/lib/utils/poker';
import { 
  BarChart3, 
  Zap, 
  Droplets, 
  Target, 
  TrendingUp, 
  Shield, 
  Eye,
  AlertTriangle,
  Activity,
  Layers
} from 'lucide-react';

export interface FlopTextureAnalyzerProps {
  flopCards: Card[];
  showAdvancedAnalysis?: boolean;
  className?: string;
}

interface DetailedFlopAnalysis {
  texture: 'dry' | 'wet' | 'neutral';
  wetness: number; // 0-10 scale
  connectedness: {
    score: number;
    gaps: number[];
    straightDraws: number;
    openEnders: number;
    gutshots: number;
  };
  suitedness: {
    score: number;
    flushDraws: number;
    backdoorFlushDraws: number;
    dominantSuit: string;
  };
  pairedness: {
    isPaired: boolean;
    pairRank?: string;
    tripsRank?: string;
  };
  highCards: {
    count: number;
    ranks: string[];
    broadway: boolean;
  };
  dynamicBoard: boolean;
  staticBoard: boolean;
  recommendations: {
    cBetFrequency: number;
    checkFrequency: number;
    bluffSuitability: 'poor' | 'fair' | 'good' | 'excellent';
    valueBetSizing: 'small' | 'medium' | 'large';
  };
}

const RANK_NAMES = {
  'A': 'Ace', 'K': 'King', 'Q': 'Queen', 'J': 'Jack', 'T': 'Ten',
  '9': 'Nine', '8': 'Eight', '7': 'Seven', '6': 'Six', '5': 'Five',
  '4': 'Four', '3': 'Three', '2': 'Two'
};

export const FlopTextureAnalyzer: React.FC<FlopTextureAnalyzerProps> = ({
  flopCards,
  showAdvancedAnalysis = false,
  className = ''
}) => {
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<'overview' | 'connectedness' | 'suitedness' | 'recommendations'>('overview');

  // Detailed analysis using advanced logic
  const detailedAnalysis = useMemo((): DetailedFlopAnalysis | null => {
    if (flopCards.length !== 3) return null;

    const basicAnalysis = analyzeFlopTexture(flopCards);
    const ranks = flopCards.map(c => getRankValue(c.rank)).sort((a, b) => b - a);
    const suits = flopCards.map(c => c.suit);
    
    // Enhanced connectedness analysis
    const connectedness = analyzeConnectedness(flopCards);
    
    // Enhanced suitedness analysis  
    const suitedness = analyzeSuitedness(flopCards);
    
    // Pair analysis
    const pairedness = analyzePairs(flopCards);
    
    // High card analysis
    const highCards = analyzeHighCards(flopCards);
    
    // Calculate overall wetness (0-10 scale)
    let wetness = 0;
    wetness += connectedness.score * 2;
    wetness += suitedness.score;
    wetness += (connectedness.straightDraws + connectedness.openEnders) * 0.5;
    wetness += suitedness.flushDraws * 2;
    wetness -= highCards.count * 0.5; // High cards make board drier
    wetness = Math.max(0, Math.min(10, wetness));
    
    // Dynamic vs Static
    const dynamicBoard = wetness > 6 || connectedness.straightDraws > 1 || suitedness.flushDraws > 0;
    const staticBoard = wetness < 3 && highCards.count >= 2;
    
    // Generate recommendations
    const recommendations = generateRecommendations(wetness, connectedness, suitedness, highCards);
    
    return {
      texture: wetness <= 3 ? 'dry' : wetness >= 7 ? 'wet' : 'neutral',
      wetness,
      connectedness,
      suitedness,
      pairedness,
      highCards,
      dynamicBoard,
      staticBoard,
      recommendations
    };
  }, [flopCards]);

  if (flopCards.length !== 3) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-700 rounded-lg p-6 text-center ${className}`}>
        <Layers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 dark:text-gray-400">Select 3 flop cards to analyze texture</p>
      </div>
    );
  }

  if (!detailedAnalysis) return null;

  const textureColors = {
    dry: { bg: 'bg-blue-50 dark:bg-blue-900', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-700' },
    wet: { bg: 'bg-red-50 dark:bg-red-900', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-700' },
    neutral: { bg: 'bg-yellow-50 dark:bg-yellow-900', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-700' }
  };

  const textureColor = textureColors[detailedAnalysis.texture];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header with Flop Cards */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Flop Texture Analysis
          </h3>
          
          {/* Texture Badge */}
          <div className={`px-4 py-2 rounded-full border-2 ${textureColor.bg} ${textureColor.border}`}>
            <span className={`font-bold text-lg ${textureColor.text} uppercase`}>
              {detailedAnalysis.texture}
            </span>
          </div>
        </div>

        {/* Flop Cards Display */}
        <div className="flex items-center justify-center gap-4 mb-4">
          {flopCards.map((card, index) => (
            <div
              key={index}
              className={`w-16 h-20 rounded-lg border-2 flex flex-col items-center justify-center font-bold text-lg shadow-lg ${
                getSuitColor(card.suit) === 'red' 
                  ? 'bg-red-50 border-red-200 text-red-600' 
                  : 'bg-gray-50 border-gray-200 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200'
              }`}
            >
              <span>{card.rank}</span>
              <span className="text-xl">{getSuitSymbol(card.suit)}</span>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {detailedAnalysis.wetness.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Wetness</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {detailedAnalysis.connectedness.score}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Connected</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {detailedAnalysis.suitedness.score}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Suited</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {detailedAnalysis.highCards.count}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">High Cards</div>
          </div>
        </div>
      </div>

      {/* Analysis Navigation */}
      {showAdvancedAnalysis && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'connectedness', label: 'Connectedness', icon: Activity },
              { id: 'suitedness', label: 'Suitedness', icon: Droplets },
              { id: 'recommendations', label: 'Strategy', icon: Target }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedAnalysisType(id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedAnalysisType === id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Content */}
      <div className="p-6">
        {(!showAdvancedAnalysis || selectedAnalysisType === 'overview') && (
          <div className="space-y-6">
            {/* Board Type Indicators */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border ${
                detailedAnalysis.dynamicBoard 
                  ? 'bg-orange-50 dark:bg-orange-900 border-orange-200 dark:border-orange-700'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className={`w-5 h-5 ${
                    detailedAnalysis.dynamicBoard 
                      ? 'text-orange-600 dark:text-orange-400' 
                      : 'text-gray-400'
                  }`} />
                  <span className={`font-medium ${
                    detailedAnalysis.dynamicBoard 
                      ? 'text-orange-900 dark:text-orange-100' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    Dynamic Board
                  </span>
                </div>
                <p className={`text-sm ${
                  detailedAnalysis.dynamicBoard 
                    ? 'text-orange-700 dark:text-orange-300' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {detailedAnalysis.dynamicBoard 
                    ? 'Many draws available - action likely'
                    : 'Few draws - less volatile'
                  }
                </p>
              </div>

              <div className={`p-4 rounded-lg border ${
                detailedAnalysis.staticBoard 
                  ? 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`w-5 h-5 ${
                    detailedAnalysis.staticBoard 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-400'
                  }`} />
                  <span className={`font-medium ${
                    detailedAnalysis.staticBoard 
                      ? 'text-blue-900 dark:text-blue-100' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    Static Board
                  </span>
                </div>
                <p className={`text-sm ${
                  detailedAnalysis.staticBoard 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {detailedAnalysis.staticBoard 
                    ? 'Few draws - more predictable'
                    : 'Some draws present'
                  }
                </p>
              </div>
            </div>

            {/* Key Features */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Key Features</h4>
              <div className="space-y-2">
                {detailedAnalysis.pairedness.isPaired && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Paired board ({RANK_NAMES[detailedAnalysis.pairedness.pairRank as keyof typeof RANK_NAMES]}s)
                    </span>
                  </div>
                )}
                
                {detailedAnalysis.connectedness.straightDraws > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {detailedAnalysis.connectedness.straightDraws} straight draw{detailedAnalysis.connectedness.straightDraws > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                
                {detailedAnalysis.suitedness.flushDraws > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Flush draw possible
                    </span>
                  </div>
                )}
                
                {detailedAnalysis.highCards.broadway && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    <span className="text-gray-700 dark:text-gray-300">
                      Broadway cards present
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showAdvancedAnalysis && selectedAnalysisType === 'connectedness' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Connectedness Analysis</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Draw Types</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Open-enders:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{detailedAnalysis.connectedness.openEnders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Gutshots:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{detailedAnalysis.connectedness.gutshots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Draws:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{detailedAnalysis.connectedness.straightDraws}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Gap Analysis</h5>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Rank gaps: {detailedAnalysis.connectedness.gaps.join(', ') || 'None'}
                </div>
                <div className="mt-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Score: {detailedAnalysis.connectedness.score}/10
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${detailedAnalysis.connectedness.score * 10}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAdvancedAnalysis && selectedAnalysisType === 'suitedness' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Suitedness Analysis</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Flush Potential</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Flush Draws:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{detailedAnalysis.suitedness.flushDraws}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Backdoor Draws:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{detailedAnalysis.suitedness.backdoorFlushDraws}</span>
                  </div>
                  {detailedAnalysis.suitedness.dominantSuit && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Dominant Suit:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{detailedAnalysis.suitedness.dominantSuit}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Suit Distribution</h5>
                <div className="space-y-1">
                  {['spades', 'hearts', 'diamonds', 'clubs'].map(suit => {
                    const count = flopCards.filter(c => c.suit === suit).length;
                    return count > 0 ? (
                      <div key={suit} className="flex items-center gap-2 text-sm">
                        <span className={getSuitColor(suit as Card['suit']) === 'red' ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}>
                          {getSuitSymbol(suit as Card['suit'])}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">×{count}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {showAdvancedAnalysis && selectedAnalysisType === 'recommendations' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Strategic Recommendations</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4 border border-green-200 dark:border-green-700">
                <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">C-Bet Strategy</h5>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {detailedAnalysis.recommendations.cBetFrequency}%
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Recommended frequency
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Bet Sizing</h5>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1 capitalize">
                  {detailedAnalysis.recommendations.valueBetSizing}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  For value bets
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Bluff Suitability</h5>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                  detailedAnalysis.recommendations.bluffSuitability === 'excellent' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                    : detailedAnalysis.recommendations.bluffSuitability === 'good'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                    : detailedAnalysis.recommendations.bluffSuitability === 'fair'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                }`}>
                  {detailedAnalysis.recommendations.bluffSuitability}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {getBluffExplanation(detailedAnalysis.recommendations.bluffSuitability)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions for detailed analysis
function analyzeConnectedness(cards: Card[]) {
  const ranks = cards.map(c => getRankValue(c.rank)).sort((a, b) => a - b);
  const gaps = [];
  let straightDraws = 0;
  let openEnders = 0;
  let gutshots = 0;
  
  // Calculate gaps
  for (let i = 1; i < ranks.length; i++) {
    gaps.push(ranks[i] - ranks[i - 1]);
  }
  
  // Count potential straight draws (simplified)
  const span = ranks[2] - ranks[0];
  if (span <= 4) {
    straightDraws += 2; // Multiple straight possibilities
    if (span === 2) openEnders += 1;
    else gutshots += 1;
  } else if (span === 5) {
    straightDraws += 1;
    gutshots += 1;
  }
  
  // Calculate connectedness score (0-10)
  let score = 0;
  if (span <= 2) score = 8;
  else if (span <= 4) score = 6;
  else if (span <= 6) score = 4;
  else if (span <= 8) score = 2;
  else score = 0;
  
  return {
    score,
    gaps,
    straightDraws,
    openEnders,
    gutshots
  };
}

function analyzeSuitedness(cards: Card[]) {
  const suitCounts = new Map<string, number>();
  cards.forEach(card => {
    suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
  });
  
  const maxSuitCount = Math.max(...Array.from(suitCounts.values()));
  const dominantSuit = Array.from(suitCounts.entries())
    .find(([_, count]) => count === maxSuitCount)?.[0];
  
  let flushDraws = 0;
  let backdoorFlushDraws = 0;
  let score = 0;
  
  if (maxSuitCount === 3) {
    flushDraws = 1;
    score = 8;
  } else if (maxSuitCount === 2) {
    backdoorFlushDraws = 1;
    score = 3;
  }
  
  return {
    score,
    flushDraws,
    backdoorFlushDraws,
    dominantSuit: dominantSuit || ''
  };
}

function analyzePairs(cards: Card[]) {
  const rankCounts = new Map<string, number>();
  cards.forEach(card => {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
  });
  
  const pairRank = Array.from(rankCounts.entries())
    .find(([_, count]) => count === 2)?.[0];
  const tripsRank = Array.from(rankCounts.entries())
    .find(([_, count]) => count === 3)?.[0];
  
  return {
    isPaired: !!pairRank,
    pairRank,
    tripsRank
  };
}

function analyzeHighCards(cards: Card[]) {
  const highCardRanks = ['A', 'K', 'Q', 'J', 'T'];
  const highCards = cards.filter(c => highCardRanks.includes(c.rank));
  const broadwayCards = cards.filter(c => ['A', 'K', 'Q', 'J', 'T'].includes(c.rank));
  
  return {
    count: highCards.length,
    ranks: highCards.map(c => c.rank),
    broadway: broadwayCards.length >= 2
  };
}

function generateRecommendations(wetness: number, connectedness: any, suitedness: any, highCards: any) {
  // C-bet frequency based on board texture
  let cBetFrequency = 70; // Base frequency
  
  if (wetness > 7) cBetFrequency -= 20; // Wet boards - c-bet less
  else if (wetness < 4) cBetFrequency += 10; // Dry boards - c-bet more
  
  if (highCards.count >= 2) cBetFrequency += 10; // High cards favor c-betting
  
  // Check frequency is inverse
  const checkFrequency = Math.max(0, 100 - cBetFrequency);
  
  // Bluff suitability
  let bluffSuitability: 'poor' | 'fair' | 'good' | 'excellent' = 'fair';
  
  if (wetness > 8) bluffSuitability = 'poor'; // Too wet for bluffing
  else if (wetness > 6) bluffSuitability = 'fair';
  else if (wetness > 4) bluffSuitability = 'good';
  else bluffSuitability = 'excellent'; // Dry boards great for bluffing
  
  // Value bet sizing
  let valueBetSizing: 'small' | 'medium' | 'large' = 'medium';
  
  if (wetness > 7) valueBetSizing = 'large'; // Charge draws
  else if (wetness < 4) valueBetSizing = 'small'; // Thin value
  
  return {
    cBetFrequency: Math.max(30, Math.min(85, cBetFrequency)),
    checkFrequency,
    bluffSuitability,
    valueBetSizing
  };
}

function getBluffExplanation(suitability: string): string {
  switch (suitability) {
    case 'excellent': return 'Dry board - opponents likely to fold';
    case 'good': return 'Decent bluffing opportunities';
    case 'fair': return 'Some bluffing spots available';
    case 'poor': return 'Too many draws - opponents call more';
    default: return '';
  }
}