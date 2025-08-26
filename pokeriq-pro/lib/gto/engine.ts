import { Card, Position } from '@/types';
import { 
  calculateEquity, 
  evaluateHand, 
  cardsToHandString, 
  getGTOStartingHandRange,
  analyzeFlopTexture,
  calculateActionEV,
  calculateOptimalBetSize,
  getRankValue,
  ALL_STARTING_HANDS
} from '@/lib/utils/poker';

export interface GTORecommendation {
  action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';
  frequency: number; // 0-1 representing how often to take this action
  sizing?: number; // Bet/raise size in chips
  sizingBB?: number; // Bet/raise size in big blinds
  ev: number; // Expected value of this action
  reasoning: string;
}

export interface HandRange {
  hands: string[];
  combinations: number;
  percentage: number;
}

export interface GTOAnalysis {
  handStrength: number;
  equity: number;
  recommendations: GTORecommendation[];
  optimalAction: GTORecommendation;
  handRange: HandRange;
  position: Position;
  street: 'preflop' | 'flop' | 'turn' | 'river';
  potOdds: number;
  impliedOdds: number;
  flopTexture?: {
    texture: 'dry' | 'wet' | 'neutral';
    connectedness: number;
    suitedness: number;
    highCards: number;
  };
}

export interface GameState {
  holeCards: Card[];
  communityCards: Card[];
  position: Position;
  stackSize: number;
  potSize: number;
  toCall: number;
  previousAction: string;
  opponents: number;
  effectiveStacks: number;
  street: 'preflop' | 'flop' | 'turn' | 'river';
}

/**
 * Main GTO Engine class
 */
export class GTOEngine {
  private equityCache = new Map<string, number>();
  
  constructor(
    private readonly iterations = 1000,
    private readonly useCache = true
  ) {}

  /**
   * Get comprehensive GTO analysis for current game state
   */
  async analyzeGameState(gameState: GameState): Promise<GTOAnalysis> {
    const {
      holeCards,
      communityCards,
      position,
      stackSize,
      potSize,
      toCall,
      opponents,
      street
    } = gameState;

    // Calculate hand equity
    const equity = await this.calculateHandEquity(
      holeCards,
      communityCards,
      opponents
    );

    // Get hand strength
    const handString = cardsToHandString(holeCards);
    const handStrength = this.getHandStrengthRating(handString);

    // Calculate pot odds
    const potOdds = toCall > 0 ? (toCall / (potSize + toCall)) * 100 : 0;

    // Get recommendations
    const recommendations = this.getGTORecommendations(gameState, equity);
    
    // Find optimal action
    const optimalAction = this.getOptimalAction(recommendations);

    // Get position-based hand range
    const handRange = this.getPositionHandRange(position, street);

    // Analyze flop texture if applicable
    const flopTexture = communityCards.length >= 3 
      ? analyzeFlopTexture(communityCards.slice(0, 3))
      : undefined;

    return {
      handStrength,
      equity,
      recommendations,
      optimalAction,
      handRange,
      position,
      street,
      potOdds,
      impliedOdds: potOdds, // Simplified for now
      flopTexture
    };
  }

  /**
   * Calculate hand equity using Monte Carlo simulation
   */
  private async calculateHandEquity(
    holeCards: Card[],
    communityCards: Card[] = [],
    opponents: number = 1
  ): Promise<number> {
    const cacheKey = `${cardsToHandString(holeCards)}-${communityCards.length}-${opponents}`;
    
    if (this.useCache && this.equityCache.has(cacheKey)) {
      return this.equityCache.get(cacheKey)!;
    }

    const equityResult = calculateEquity(holeCards, communityCards, opponents, this.iterations);
    
    if (this.useCache) {
      this.equityCache.set(cacheKey, equityResult.equity);
    }

    return equityResult.equity;
  }

  /**
   * Get GTO action recommendations based on game state
   */
  private getGTORecommendations(
    gameState: GameState,
    equity: number
  ): GTORecommendation[] {
    const {
      position,
      stackSize,
      potSize,
      toCall,
      street,
      communityCards
    } = gameState;

    const recommendations: GTORecommendation[] = [];

    // Calculate action EVs
    const actionEVs = calculateActionEV(equity, potSize, stackSize * 0.5, toCall);

    // Always include fold option (except when can check)
    if (toCall > 0) {
      recommendations.push({
        action: 'fold',
        frequency: this.calculateFoldFrequency(equity, potSize, toCall),
        ev: actionEVs.fold,
        reasoning: 'Forfeit hand to avoid further investment'
      });
    }

    // Check/Call options
    if (toCall === 0) {
      // Can check
      recommendations.push({
        action: 'check',
        frequency: this.calculateCheckFrequency(equity, position),
        ev: 0,
        reasoning: 'See next card for free'
      });
    } else {
      // Must call
      const callFrequency = this.calculateCallFrequency(equity, potSize, toCall);
      if (callFrequency > 0) {
        recommendations.push({
          action: 'call',
          frequency: callFrequency,
          ev: actionEVs.call,
          reasoning: `Pot odds justify call with ${equity.toFixed(1)}% equity`
        });
      }
    }

    // Betting/Raising options
    const betSize = calculateOptimalBetSize(equity, potSize, position, street);
    
    if (toCall === 0) {
      // Can bet
      const betFrequency = this.calculateBetFrequency(equity, position, street);
      if (betFrequency > 0) {
        recommendations.push({
          action: 'bet',
          frequency: betFrequency,
          sizing: betSize.size,
          sizingBB: street === 'preflop' ? betSize.size : betSize.size / 100, // Simplified BB calculation
          ev: actionEVs.raise,
          reasoning: this.getBetReasoning(equity, communityCards)
        });
      }
    } else {
      // Can raise
      const raiseFrequency = this.calculateRaiseFrequency(equity, position);
      if (raiseFrequency > 0) {
        const raiseSize = toCall + betSize.size;
        recommendations.push({
          action: 'raise',
          frequency: raiseFrequency,
          sizing: raiseSize,
          sizingBB: raiseSize / 100,
          ev: actionEVs.raise,
          reasoning: this.getRaiseReasoning(equity, position)
        });
      }
    }

    return recommendations.filter(rec => rec.frequency > 0);
  }

  /**
   * Get optimal action from recommendations
   */
  private getOptimalAction(recommendations: GTORecommendation[]): GTORecommendation {
    return recommendations.reduce((best, current) => 
      current.ev > best.ev ? current : best
    );
  }

  /**
   * Calculate various action frequencies using proper GTO analysis with CFR
   */
  private async calculateGTOFrequencies(gameState: GameState): Promise<Map<string, number>> {
    try {
      // Import CFR solver dynamically to avoid circular dependencies
      const { CFRSolver } = await import('./cfr-solver');
      const cfrSolver = new CFRSolver(1000); // Use fewer iterations for real-time play
      
      const result = await cfrSolver.solve(gameState);
      return result.strategy;
    } catch (error) {
      // Fallback to simplified heuristics if CFR fails
      return this.calculateFallbackFrequencies(gameState);
    }
  }

  private calculateFallbackFrequencies(gameState: GameState): Map<string, number> {
    const frequencies = new Map<string, number>();
    
    // Get current player and calculate equity
    const currentPlayer = gameState.players[gameState.currentPlayer];
    const equity = this.calculateHandEquity(
      this.parseCards(currentPlayer.holeCards),
      this.parseCards(gameState.communityCards),
      gameState.players.length - 1
    );

    const pot = gameState.pot;
    const currentBet = Math.max(...gameState.players.map(p => p.invested));
    const toCall = Math.max(0, currentBet - currentPlayer.invested);
    const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;
    
    // Advanced frequency calculations based on multiple factors
    const position = currentPlayer.position;
    const street = gameState.street;
    const stackDepth = currentPlayer.stack / pot;
    
    // Position adjustments
    const positionFactor = this.getPositionFactor(position);
    const streetFactor = this.getStreetFactor(street);
    const stackFactor = this.getStackDepthFactor(stackDepth);
    
    // Calculate fold frequency
    if (toCall > 0) {
      const requiredEquity = potOdds;
      const adjustedEquity = equity * positionFactor * streetFactor;
      
      let foldFreq = 0;
      if (adjustedEquity < requiredEquity * 0.7) foldFreq = 0.95;
      else if (adjustedEquity < requiredEquity * 0.85) foldFreq = 0.8;
      else if (adjustedEquity < requiredEquity) foldFreq = 0.6;
      else if (adjustedEquity < requiredEquity * 1.2) foldFreq = 0.3;
      else foldFreq = 0.1;
      
      frequencies.set('fold', foldFreq);
    }

    // Calculate call frequency  
    if (toCall > 0) {
      const callFreq = Math.max(0, Math.min(0.8, 
        equity / (potOdds * 100) * positionFactor - 0.2
      ));
      frequencies.set('call', callFreq);
    } else {
      // Check frequency when no bet to call
      const checkFreq = Math.max(0.1, 0.9 - equity * positionFactor);
      frequencies.set('check', checkFreq);
    }

    // Calculate bet/raise frequency
    const aggression = this.calculateOptimalAggression(equity, position, street, stackDepth);
    
    if (toCall === 0) {
      // Betting frequency
      const betFreq = Math.min(0.9, aggression * streetFactor * stackFactor);
      frequencies.set('bet', betFreq);
    } else {
      // Raising frequency
      const raiseFreq = Math.min(0.7, aggression * 0.7 * positionFactor);
      frequencies.set('raise', raiseFreq);
    }

    // Normalize frequencies to sum to 1
    return this.normalizeFrequencies(frequencies);
  }

  private async calculateHandEquity(holeCards: Card[], communityCards: Card[] = [], opponents: number = 1): Promise<number> {
    // Use more sophisticated equity calculation
    try {
      const { calculateEquity } = await import('@/lib/utils/poker');
      const result = calculateEquity(holeCards, communityCards, opponents, 5000);
      return result.equity;
    } catch {
      // Fallback to simple calculation
      return this.calculateSimpleEquity(holeCards, communityCards, opponents);
    }
  }

  private calculateSimpleEquity(holeCards: Card[], communityCards: Card[], opponents: number): number {
    // Simplified equity calculation based on hand strength
    const handStrength = this.evaluateHandStrength(holeCards, communityCards);
    const opponentAdjustment = Math.pow(0.85, opponents - 1);
    return Math.min(0.95, handStrength * opponentAdjustment);
  }

  private evaluateHandStrength(holeCards: Card[], communityCards: Card[]): number {
    const allCards = [...holeCards, ...communityCards];
    if (allCards.length < 2) return 0.1;

    // Advanced hand evaluation considering:
    // 1. Pairs, trips, quads
    // 2. Flush possibilities  
    // 3. Straight possibilities
    // 4. High card strength
    
    const ranks = allCards.map(c => this.getCardRank(c.rank));
    const suits = allCards.map(c => c.suit);
    
    const rankCounts = ranks.reduce((acc, rank) => {
      acc[rank] = (acc[rank] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const suitCounts = suits.reduce((acc, suit) => {
      acc[suit] = (acc[suit] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let strength = 0;

    // Check for pairs, trips, quads
    const maxRankCount = Math.max(...Object.values(rankCounts));
    if (maxRankCount >= 4) strength = 0.95; // Quads
    else if (maxRankCount >= 3) {
      const pairs = Object.values(rankCounts).filter(c => c >= 2).length;
      strength = pairs > 1 ? 0.9 : 0.8; // Full house or trips
    } else if (maxRankCount >= 2) {
      const pairs = Object.values(rankCounts).filter(c => c >= 2).length;
      strength = pairs > 1 ? 0.7 : 0.6; // Two pair or pair
    }

    // Check for flush
    const maxSuitCount = Math.max(...Object.values(suitCounts));
    if (maxSuitCount >= 5) strength = Math.max(strength, 0.85);
    else if (maxSuitCount >= 4) strength = Math.max(strength, 0.4); // Flush draw

    // Check for straight
    if (this.hasStraight(ranks)) strength = Math.max(strength, 0.75);
    else if (this.hasStraightDraw(ranks)) strength = Math.max(strength, 0.35);

    // High card strength
    if (strength === 0) {
      const highCard = Math.max(...ranks);
      strength = Math.min(0.5, highCard / 28); // Normalize ace=14 to 0.5
    }

    return strength;
  }

  private getCardRank(rank: string): number {
    const rankMap: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
      '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    return rankMap[rank] || 2;
  }

  private hasStraight(ranks: number[]): boolean {
    const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => a - b);
    if (uniqueRanks.length < 5) return false;

    for (let i = 0; i <= uniqueRanks.length - 5; i++) {
      let consecutive = true;
      for (let j = 1; j < 5; j++) {
        if (uniqueRanks[i + j] !== uniqueRanks[i] + j) {
          consecutive = false;
          break;
        }
      }
      if (consecutive) return true;
    }

    // Check for A-2-3-4-5 straight
    if (uniqueRanks.includes(14) && uniqueRanks.includes(2) && 
        uniqueRanks.includes(3) && uniqueRanks.includes(4) && uniqueRanks.includes(5)) {
      return true;
    }

    return false;
  }

  private hasStraightDraw(ranks: number[]): boolean {
    const uniqueRanks = Array.from(new Set(ranks)).sort((a, b) => a - b);
    if (uniqueRanks.length < 4) return false;

    // Check for open-ended straight draws
    for (let i = 0; i <= uniqueRanks.length - 4; i++) {
      let consecutive = 0;
      for (let j = 0; j < 4; j++) {
        if (j === 0 || uniqueRanks[i + j] === uniqueRanks[i + j - 1] + 1) {
          consecutive++;
        } else {
          break;
        }
      }
      if (consecutive === 4) return true;
    }

    return false;
  }

  private getPositionFactor(position: string): number {
    const factors: Record<string, number> = {
      'UTG': 0.8, 'MP': 0.9, 'CO': 1.0, 'BTN': 1.2, 'SB': 0.85, 'BB': 0.9
    };
    return factors[position] || 1.0;
  }

  private getStreetFactor(street: string): number {
    const factors: Record<string, number> = {
      'preflop': 1.0, 'flop': 0.95, 'turn': 0.9, 'river': 0.85
    };
    return factors[street] || 1.0;
  }

  private getStackDepthFactor(stackDepth: number): number {
    if (stackDepth > 2) return 1.0;      // Deep stacks
    if (stackDepth > 1) return 0.9;      // Medium stacks  
    if (stackDepth > 0.5) return 0.8;    // Shallow stacks
    return 0.7;                          // Very shallow
  }

  private calculateOptimalAggression(equity: number, position: string, street: string, stackDepth: number): number {
    const baseAggression = equity > 0.8 ? 0.9 :
                          equity > 0.6 ? 0.7 :
                          equity > 0.4 ? 0.4 :
                          equity > 0.2 ? 0.2 : 0.1;
    
    const positionBonus = this.getPositionFactor(position) - 1.0;
    const streetPenalty = 1.0 - this.getStreetFactor(street);
    const stackBonus = this.getStackDepthFactor(stackDepth) - 0.7;
    
    return Math.max(0.05, Math.min(0.95, 
      baseAggression + positionBonus * 0.1 - streetPenalty * 0.2 + stackBonus * 0.1
    ));
  }

  private normalizeFrequencies(frequencies: Map<string, number>): Map<string, number> {
    const total = Array.from(frequencies.values()).reduce((sum, freq) => sum + freq, 0);
    if (total === 0) return frequencies;
    
    const normalized = new Map<string, number>();
    for (const [action, freq] of frequencies) {
      normalized.set(action, freq / total);
    }
    return normalized;
  }

  private parseCards(cardsString: string): Card[] {
    // Parse card string format like "AsKh" into Card objects
    const cards: Card[] = [];
    for (let i = 0; i < cardsString.length; i += 2) {
      if (i + 1 < cardsString.length) {
        cards.push({
          rank: cardsString[i],
          suit: cardsString[i + 1]
        });
      }
    }
    return cards;
  }

  /**
   * Get reasoning text for different actions
   */
  private getBetReasoning(equity: number, communityCards: Card[]): string {
    if (equity > 80) return 'Value bet with very strong hand';
    if (equity > 65) return 'Value bet for protection and value';
    if (equity > 45) return 'Semi-bluff with good equity';
    return 'Bluff to apply pressure';
  }

  private getRaiseReasoning(equity: number, position: Position): string {
    if (equity > 85) return 'Raise for maximum value';
    if (equity > 70) return 'Raise for value and protection';
    if (equity > 50) return 'Semi-bluff raise with good equity';
    return 'Bluff raise to steal pot';
  }

  /**
   * Get hand strength rating (0-100)
   */
  private getHandStrengthRating(handString: string): number {
    const handRankings = this.getHandRankings();
    const index = handRankings.indexOf(handString);
    
    if (index === -1) return 0;
    
    return ((handRankings.length - index) / handRankings.length) * 100;
  }

  /**
   * Get position-based hand range
   */
  private getPositionHandRange(position: Position, street: string): HandRange {
    if (street === 'preflop') {
      const raiseRange = getGTOStartingHandRange(position, 'raise');
      const callRange = getGTOStartingHandRange(position, 'call');
      const allHands = [...raiseRange, ...callRange];
      
      return {
        hands: allHands,
        combinations: this.calculateCombinations(allHands),
        percentage: (allHands.length / ALL_STARTING_HANDS.length) * 100
      };
    }

    // Post-flop ranges are more complex and context-dependent
    return {
      hands: [],
      combinations: 0,
      percentage: 0
    };
  }

  /**
   * Calculate total combinations for hand list
   */
  private calculateCombinations(hands: string[]): number {
    return hands.reduce((total, hand) => {
      if (hand.length === 2) {
        // Pair (e.g., "AA")
        return total + 6;
      } else if (hand.endsWith('s')) {
        // Suited (e.g., "AKs")
        return total + 4;
      } else if (hand.endsWith('o')) {
        // Offsuit (e.g., "AKo")
        return total + 12;
      }
      return total;
    }, 0);
  }

  /**
   * Get all starting hands ranked by strength
   */
  private getHandRankings(): string[] {
    // Simplified hand rankings - in a full implementation, 
    // this would be based on more sophisticated equity calculations
    return [
      'AA', 'KK', 'QQ', 'JJ', 'TT',
      'AKs', 'AQs', 'AJs', 'AKo',
      '99', 'ATs', 'AQo', 'KQs', 'A9s',
      '88', 'KJs', 'AJo', 'A8s', 'KQo',
      '77', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
      'KTs', 'QJs', 'ATo', 'K9s',
      '66', 'QTs', 'A9o', 'KJo', 'JTs',
      '55', 'K8s', 'Q9s', 'J9s', 'T9s', 'A8o',
      '44', '98s', 'KTo', 'A7o', 'QJo',
      '33', '87s', 'K7s', 'Q8s', 'A6o', 'J8s',
      '22', '97s', '76s', 'K6s', 'T8s', 'A5o',
      // ... continuing with remaining hands
    ].concat(ALL_STARTING_HANDS.filter(hand => 
      ![
        'AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs', 'AJs', 'AKo',
        '99', 'ATs', 'AQo', 'KQs', 'A9s', '88', 'KJs', 'AJo', 'A8s', 'KQo'
      ].includes(hand)
    ));
  }
}

// Export singleton instance
export const gtoEngine = new GTOEngine();