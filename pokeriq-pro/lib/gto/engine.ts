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
   * Calculate various action frequencies based on GTO principles
   */
  private calculateFoldFrequency(equity: number, potSize: number, toCall: number): number {
    const potOdds = (toCall / (potSize + toCall)) * 100;
    const requiredEquity = potOdds;
    
    if (equity < requiredEquity * 0.8) return 1.0; // Always fold
    if (equity < requiredEquity) return 0.7; // Mostly fold
    if (equity < requiredEquity * 1.2) return 0.3; // Sometimes fold
    return 0; // Never fold
  }

  private calculateCheckFrequency(equity: number, position: Position): number {
    const positionFactor = position === 'BTN' ? 0.3 : 0.7;
    
    if (equity < 30) return 0.9 * positionFactor;
    if (equity < 50) return 0.6 * positionFactor;
    if (equity < 70) return 0.4 * positionFactor;
    return 0.2 * positionFactor;
  }

  private calculateCallFrequency(equity: number, potSize: number, toCall: number): number {
    const potOdds = (toCall / (potSize + toCall)) * 100;
    const requiredEquity = potOdds;
    
    if (equity < requiredEquity * 0.8) return 0;
    if (equity < requiredEquity) return 0.2;
    if (equity < requiredEquity * 1.5) return 0.8;
    return 0.6; // Sometimes call even with strong hands for deception
  }

  private calculateBetFrequency(
    equity: number, 
    position: Position, 
    street: 'preflop' | 'flop' | 'turn' | 'river'
  ): number {
    const positionMultiplier = position === 'BTN' ? 1.2 : position === 'CO' ? 1.1 : 1.0;
    
    let baseBetFrequency = 0;
    
    if (equity > 80) baseBetFrequency = 0.9; // Almost always bet with very strong hands
    else if (equity > 65) baseBetFrequency = 0.7; // Frequently bet with strong hands
    else if (equity > 45) baseBetFrequency = 0.4; // Sometimes bet with medium hands
    else if (equity > 25) baseBetFrequency = 0.2; // Occasionally bluff
    else baseBetFrequency = 0.1; // Rarely bluff with weak hands

    // Adjust for street
    const streetMultiplier = {
      preflop: 1.0,
      flop: 0.9,
      turn: 0.8,
      river: 0.7
    }[street];

    return Math.min(baseBetFrequency * positionMultiplier * streetMultiplier, 1.0);
  }

  private calculateRaiseFrequency(equity: number, position: Position): number {
    if (equity > 85) return 0.8; // Usually raise with very strong hands
    if (equity > 70) return 0.6; // Often raise with strong hands
    if (equity > 50) return 0.3; // Sometimes raise with decent hands
    if (equity > 30) return 0.1; // Rarely raise as bluff
    return 0; // Never raise with weak hands
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