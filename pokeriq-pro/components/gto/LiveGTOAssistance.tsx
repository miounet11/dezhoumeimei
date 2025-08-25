'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Position } from '@/types';
import { GTOEngine, GameState, GTOAnalysis } from '@/lib/gto/engine';
import { cardsToHandString, getPositionName, getSuitSymbol, getSuitColor } from '@/lib/utils/poker';
import { 
  Eye, 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Lightbulb,
  Zap,
  Target,
  BarChart3,
  Clock,
  DollarSign
} from 'lucide-react';

export interface LiveGTOAssistanceProps {
  isEnabled: boolean;
  holeCards: Card[];
  communityCards: Card[];
  position: Position;
  stackSize: number;
  potSize: number;
  toCall: number;
  opponents: number;
  onRecommendationSelect?: (recommendation: any) => void;
  className?: string;
}

interface PotOddsCalculation {
  potOdds: number;
  requiredEquity: number;
  isGoodCall: boolean;
  impliedOdds?: number;
}

interface OpponentRange {
  tightRange: string[];
  standardRange: string[];
  looseRange: string[];
  estimated: 'tight' | 'standard' | 'loose';
}

export const LiveGTOAssistance: React.FC<LiveGTOAssistanceProps> = ({
  isEnabled,
  holeCards,
  communityCards,
  position,
  stackSize,
  potSize,
  toCall,
  opponents,
  onRecommendationSelect,
  className = ''
}) => {
  const [analysis, setAnalysis] = useState<GTOAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [potOddsCalc, setPotOddsCalc] = useState<PotOddsCalculation | null>(null);
  const [opponentRange, setOpponentRange] = useState<OpponentRange | null>(null);
  const [handStrengthIndicator, setHandStrengthIndicator] = useState<'weak' | 'medium' | 'strong' | 'premium'>('medium');
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);

  const gtoEngine = React.useMemo(() => new GTOEngine(), []);

  // Analyze situation whenever inputs change
  const analyzePosition = useCallback(async () => {
    if (!isEnabled || holeCards.length !== 2) {
      setAnalysis(null);
      return;
    }

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

      // Calculate pot odds
      if (toCall > 0) {
        const potOdds = (toCall / (potSize + toCall)) * 100;
        const requiredEquity = potOdds;
        const isGoodCall = gtoAnalysis.equity > requiredEquity;
        
        setPotOddsCalc({
          potOdds,
          requiredEquity,
          isGoodCall,
          impliedOdds: potOdds * 0.8 // Simplified implied odds
        });
      } else {
        setPotOddsCalc(null);
      }

      // Determine hand strength indicator
      if (gtoAnalysis.handStrength > 90) setHandStrengthIndicator('premium');
      else if (gtoAnalysis.handStrength > 70) setHandStrengthIndicator('strong');
      else if (gtoAnalysis.handStrength > 40) setHandStrengthIndicator('medium');
      else setHandStrengthIndicator('weak');

      // Estimate opponent range (simplified)
      const estimatedRange: OpponentRange = {
        tightRange: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'],
        standardRange: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo'],
        looseRange: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'KQs', 'KQo'],
        estimated: position === 'UTG' ? 'tight' : position === 'BTN' ? 'loose' : 'standard'
      };
      setOpponentRange(estimatedRange);

    } catch (error) {
      console.error('GTO analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isEnabled, holeCards, communityCards, position, stackSize, potSize, toCall, opponents, gtoEngine]);

  useEffect(() => {
    analyzePosition();
  }, [analyzePosition]);

  if (!isEnabled) {
    return (
      <div className={`bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center ${className}`}>
        <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 dark:text-gray-400">GTO assistance is disabled</p>
      </div>
    );
  }

  if (holeCards.length !== 2) {
    return (
      <div className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center ${className}`}>
        <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 dark:text-gray-400">Waiting for hole cards...</p>
      </div>
    );
  }

  const handString = cardsToHandString(holeCards);
  const currentStreet = communityCards.length === 0 ? 'Preflop' : 
                      communityCards.length === 3 ? 'Flop' :
                      communityCards.length === 4 ? 'Turn' : 'River';

  const handStrengthColors = {
    weak: { bg: 'bg-red-50 dark:bg-red-900', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-700' },
    medium: { bg: 'bg-yellow-50 dark:bg-yellow-900', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-700' },
    strong: { bg: 'bg-green-50 dark:bg-green-900', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-700' },
    premium: { bg: 'bg-blue-50 dark:bg-blue-900', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-700' }
  };

  const strengthColor = handStrengthColors[handStrengthIndicator];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-blue-200 dark:border-blue-700 ${className}`}>
      {/* Header */}
      <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Live GTO Assistant</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-600 dark:text-blue-400">
              {handString} • {getPositionName(position)} • {currentStreet}
            </span>
            {isAnalyzing && (
              <div className="w-4 h-4 animate-spin border-2 border-blue-500 border-t-transparent rounded-full"></div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          <div className={`p-3 rounded-lg border ${strengthColor.bg} ${strengthColor.border}`}>
            <div className="text-center">
              <div className={`text-lg font-bold ${strengthColor.text}`}>
                {analysis?.handStrength.toFixed(0) || '-'}
              </div>
              <div className={`text-xs ${strengthColor.text} capitalize`}>
                {handStrengthIndicator}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {analysis?.equity.toFixed(1) || '-'}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Equity</div>
          </div>

          {potOddsCalc && (
            <div className={`p-3 rounded-lg text-center ${
              potOddsCalc.isGoodCall 
                ? 'bg-green-50 dark:bg-green-900' 
                : 'bg-red-50 dark:bg-red-900'
            }`}>
              <div className={`text-lg font-bold ${
                potOddsCalc.isGoodCall 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {potOddsCalc.potOdds.toFixed(1)}%
              </div>
              <div className={`text-xs ${
                potOddsCalc.isGoodCall 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                Pot Odds
              </div>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {opponents}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Opponents</div>
          </div>
        </div>

        {/* Main Recommendation */}
        {analysis && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900 dark:to-blue-900 p-4 rounded-lg border-2 border-green-200 dark:border-green-700">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-green-900 dark:text-green-100 text-lg">
                    {analysis.optimalAction.action.toUpperCase()}
                    {analysis.optimalAction.sizing && ` $${analysis.optimalAction.sizing}`}
                  </h4>
                  <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                    OPTIMAL
                  </span>
                </div>
                <p className="text-green-800 dark:text-green-200 text-sm mb-2">
                  {analysis.optimalAction.reasoning}
                </p>
                <div className="flex items-center gap-4 text-xs text-green-700 dark:text-green-300">
                  <span>EV: {analysis.optimalAction.ev.toFixed(2)}</span>
                  <span>Frequency: {(analysis.optimalAction.frequency * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alternative Actions */}
        {analysis && analysis.recommendations.length > 1 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900 dark:text-white text-sm">Alternative Actions:</h4>
            <div className="space-y-1">
              {analysis.recommendations
                .filter(rec => rec !== analysis.optimalAction)
                .slice(0, 2)
                .map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                  >
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {rec.action.toUpperCase()}
                      </span>
                      {rec.sizing && (
                        <span className="text-gray-600 dark:text-gray-400 ml-1">
                          ${rec.sizing}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <span>{(rec.frequency * 100).toFixed(0)}%</span>
                      <span>EV: {rec.ev.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Pot Odds Analysis */}
        {potOddsCalc && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">Pot Odds Analysis</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Pot Odds:</span>
                <span className="font-medium text-gray-900 dark:text-white ml-1">
                  {potOddsCalc.potOdds.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Required Equity:</span>
                <span className="font-medium text-gray-900 dark:text-white ml-1">
                  {potOddsCalc.requiredEquity.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              {potOddsCalc.isGoodCall ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                potOddsCalc.isGoodCall 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {potOddsCalc.isGoodCall ? 'Profitable Call' : 'Unprofitable Call'}
              </span>
            </div>
          </div>
        )}

        {/* Board Analysis */}
        {analysis?.flopTexture && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">Board Texture</h4>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                analysis.flopTexture.texture === 'dry' 
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                  : analysis.flopTexture.texture === 'wet'
                  ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200'
              }`}>
                {analysis.flopTexture.texture.toUpperCase()}
              </span>
              <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                <span>Connected: {analysis.flopTexture.connectedness}</span>
                <span>Suited: {analysis.flopTexture.suitedness}</span>
                <span>High Cards: {analysis.flopTexture.highCards}</span>
              </div>
            </div>
          </div>
        )}

        {/* Warning/Tips */}
        <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-1">
                Quick Tip:
              </p>
              <p className="text-yellow-700 dark:text-yellow-300">
                {getQuickTip(analysis, handStrengthIndicator, currentStreet)}
              </p>
            </div>
          </div>
        </div>

        {/* Toggle Advanced Stats */}
        <button
          onClick={() => setShowAdvancedStats(!showAdvancedStats)}
          className="w-full text-left text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
        >
          {showAdvancedStats ? '▼' : '▶'} Advanced Statistics
        </button>

        {/* Advanced Stats Panel */}
        {showAdvancedStats && analysis && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Range:</span>
                <span className="font-medium text-gray-900 dark:text-white ml-1">
                  {analysis.handRange.percentage.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Combinations:</span>
                <span className="font-medium text-gray-900 dark:text-white ml-1">
                  {analysis.handRange.combinations}
                </span>
              </div>
            </div>
            
            {/* Stack to Pot Ratio */}
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">Stack/Pot Ratio:</span>
              <span className="font-medium text-gray-900 dark:text-white ml-1">
                {(stackSize / potSize).toFixed(1)}:1
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to generate contextual tips
function getQuickTip(
  analysis: GTOAnalysis | null, 
  handStrength: 'weak' | 'medium' | 'strong' | 'premium', 
  street: string
): string {
  if (!analysis) return 'Consider your position and opponents when making decisions.';

  if (handStrength === 'premium') {
    return 'With a premium hand, focus on extracting maximum value. Bet for value and build the pot.';
  } else if (handStrength === 'strong') {
    return 'Strong hand - continue betting for value but be aware of board texture changes.';
  } else if (handStrength === 'medium') {
    return 'Marginal hand - consider pot control and position. Look for cheap showdowns.';
  } else {
    return 'Weak hand - consider folding unless you have good pot odds or bluffing equity.';
  }
}