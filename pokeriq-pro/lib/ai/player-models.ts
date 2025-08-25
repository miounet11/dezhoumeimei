import { AIOpponent, AIOpponentStyle, Position, Card } from '@/types';
import { 
  calculateHandStrength, 
  calculateEquity, 
  getGTOStartingHandRange,
  cardsToHandString,
  calculateActionEV,
  analyzeFlopTexture 
} from '@/lib/utils/poker';

export interface PlayerStats {
  vpip: number;    // Voluntarily Put $ In Pot
  pfr: number;     // Pre-Flop Raise
  af: number;      // Aggression Factor
  '3bet': number;  // 3-bet frequency
  cbet: number;    // Continuation bet frequency
  foldToCbet: number; // Fold to continuation bet
  wtsd: number;    // Went To Showdown
  wsd: number;     // Won $ at Showdown
}

export interface Decision {
  action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';
  amount?: number;
  confidence: number; // 0-1 how confident the AI is in this decision
  reasoning: string;
}

export interface GameContext {
  holeCards: Card[];
  communityCards: Card[];
  position: Position;
  stackSize: number;
  potSize: number;
  toCall: number;
  betAmount: number;
  street: 'preflop' | 'flop' | 'turn' | 'river';
  opponents: number;
  previousActions: string[];
  opponentStats: PlayerStats[];
  sessionHistory: Decision[];
}

/**
 * Base AI Player class
 */
export abstract class AIPlayer {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly style: AIOpponentStyle,
    protected stats: PlayerStats,
    public readonly difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium'
  ) {}

  abstract makeDecision(context: GameContext): Decision;
  
  getStats(): PlayerStats {
    return { ...this.stats };
  }

  updateStats(decision: Decision, context: GameContext): void {
    // Update stats based on decision made
    this.updateVPIP(decision, context);
    this.updatePFR(decision, context);
    this.updateAggression(decision);
  }

  private updateVPIP(decision: Decision, context: GameContext): void {
    if (context.street === 'preflop' && ['call', 'bet', 'raise'].includes(decision.action)) {
      this.stats.vpip = Math.min(this.stats.vpip + 0.1, 100);
    }
  }

  private updatePFR(decision: Decision, context: GameContext): void {
    if (context.street === 'preflop' && ['bet', 'raise'].includes(decision.action)) {
      this.stats.pfr = Math.min(this.stats.pfr + 0.1, 100);
    }
  }

  private updateAggression(decision: Decision): void {
    if (['bet', 'raise'].includes(decision.action)) {
      this.stats.af = Math.min(this.stats.af + 0.05, 10);
    } else if (decision.action === 'call') {
      this.stats.af = Math.max(this.stats.af - 0.02, 0);
    }
  }

  protected calculateHandStrengthPercentile(context: GameContext): number {
    const handStrength = calculateHandStrength(context.holeCards, context.communityCards);
    // Convert to percentile (simplified)
    return Math.min(handStrength / 10, 100);
  }

  protected shouldBluff(context: GameContext): boolean {
    const bluffFrequency = this.getBluffFrequency(context);
    return Math.random() < bluffFrequency;
  }

  protected getBluffFrequency(context: GameContext): number {
    // Base bluff frequency based on style
    let baseFrequency = 0;
    
    switch (this.style) {
      case 'loose-aggressive':
        baseFrequency = 0.25;
        break;
      case 'tight-aggressive':
        baseFrequency = 0.15;
        break;
      case 'maniac':
        baseFrequency = 0.4;
        break;
      case 'gto':
        baseFrequency = 0.2;
        break;
      default:
        baseFrequency = 0.1;
    }

    // Adjust for position
    if (['BTN', 'CO'].includes(context.position)) {
      baseFrequency *= 1.3;
    } else if (['UTG', 'UTG+1'].includes(context.position)) {
      baseFrequency *= 0.7;
    }

    // Adjust for stack size
    const stackToPotRatio = context.stackSize / context.potSize;
    if (stackToPotRatio < 3) {
      baseFrequency *= 0.6; // Less bluffing with short stacks
    }

    return Math.min(baseFrequency, 0.5);
  }
}

/**
 * Tight-Aggressive (TAG) Player
 */
export class TightAggressivePlayer extends AIPlayer {
  constructor(
    id: string,
    name: string,
    difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium'
  ) {
    super(id, name, 'tight-aggressive', {
      vpip: 18 + (difficulty === 'expert' ? 4 : 0),
      pfr: 15 + (difficulty === 'expert' ? 3 : 0),
      af: 2.5 + (difficulty === 'expert' ? 0.5 : 0),
      '3bet': 8 + (difficulty === 'expert' ? 2 : 0),
      cbet: 75,
      foldToCbet: 45,
      wtsd: 28,
      wsd: 55
    }, difficulty);
  }

  makeDecision(context: GameContext): Decision {
    const handStrength = this.calculateHandStrengthPercentile(context);
    const equity = this.estimateEquity(context);
    const position = context.position;
    const potOdds = context.toCall / (context.potSize + context.toCall);

    // Preflop decisions
    if (context.street === 'preflop') {
      return this.makePreflopDecision(context, handStrength);
    }

    // Postflop decisions
    return this.makePostflopDecision(context, handStrength, equity);
  }

  private makePreflopDecision(context: GameContext, handStrength: number): Decision {
    const handString = cardsToHandString(context.holeCards);
    const raiseRange = getGTOStartingHandRange(context.position, 'raise');
    const callRange = getGTOStartingHandRange(context.position, 'call');

    // Tight range - only play strong hands
    if (handStrength < 60) {
      return {
        action: 'fold',
        confidence: 0.8,
        reasoning: 'Hand below TAG threshold'
      };
    }

    // Strong hands - raise
    if (raiseRange.includes(handString) || handStrength > 80) {
      const betAmount = this.calculateBetSize(context, 'aggressive');
      return {
        action: context.toCall > 0 ? 'raise' : 'bet',
        amount: betAmount,
        confidence: 0.9,
        reasoning: 'Strong hand - value betting'
      };
    }

    // Decent hands - call in position
    if (callRange.includes(handString) && ['BTN', 'CO', 'MP+1'].includes(context.position)) {
      return {
        action: 'call',
        amount: context.toCall,
        confidence: 0.6,
        reasoning: 'Speculative hand in position'
      };
    }

    return {
      action: 'fold',
      confidence: 0.7,
      reasoning: 'Hand not strong enough for TAG play'
    };
  }

  private makePostflopDecision(context: GameContext, handStrength: number, equity: number): Decision {
    const potOdds = context.toCall / (context.potSize + context.toCall);
    const requiredEquity = potOdds * 100;

    // Strong hands - bet for value
    if (equity > 70 || handStrength > 85) {
      const betAmount = this.calculateBetSize(context, 'value');
      return {
        action: context.toCall === 0 ? 'bet' : 'raise',
        amount: betAmount,
        confidence: 0.9,
        reasoning: 'Strong hand - betting for value'
      };
    }

    // Drawing hands with good odds
    if (equity > requiredEquity + 5 && equity > 35) {
      return {
        action: 'call',
        amount: context.toCall,
        confidence: 0.7,
        reasoning: 'Drawing with good pot odds'
      };
    }

    // Marginal hands - check/call selectively
    if (equity > requiredEquity && handStrength > 40) {
      if (context.toCall === 0) {
        return {
          action: 'check',
          confidence: 0.6,
          reasoning: 'Marginal hand - pot control'
        };
      } else if (context.toCall < context.potSize * 0.3) {
        return {
          action: 'call',
          amount: context.toCall,
          confidence: 0.5,
          reasoning: 'Marginal hand - small price to call'
        };
      }
    }

    return {
      action: 'fold',
      confidence: 0.8,
      reasoning: 'Insufficient equity to continue'
    };
  }

  private estimateEquity(context: GameContext): number {
    // Simplified equity estimation for TAG player
    const handStrength = calculateHandStrength(context.holeCards, context.communityCards);
    const flopTexture = context.communityCards.length >= 3 ? 
      analyzeFlopTexture(context.communityCards.slice(0, 3)) : null;

    let equity = Math.min(handStrength / 10, 95);

    // Adjust for board texture
    if (flopTexture) {
      if (flopTexture.texture === 'wet' && handStrength < 70) {
        equity *= 0.85; // Reduce equity on wet boards with marginal hands
      } else if (flopTexture.texture === 'dry' && handStrength > 50) {
        equity *= 1.1; // Increase equity on dry boards
      }
    }

    return Math.max(equity, 5);
  }

  private calculateBetSize(context: GameContext, intent: 'value' | 'bluff' | 'aggressive'): number {
    let betSize = context.potSize * 0.75; // Default 75% pot

    switch (intent) {
      case 'value':
        betSize = context.potSize * 0.8; // Larger for value
        break;
      case 'bluff':
        betSize = context.potSize * 0.6; // Smaller for bluffs
        break;
      case 'aggressive':
        betSize = context.potSize * 1.0; // Full pot or more
        break;
    }

    // Adjust for stack size
    const maxBet = Math.min(context.stackSize, context.potSize * 3);
    return Math.min(betSize, maxBet);
  }
}

/**
 * Loose-Aggressive (LAG) Player
 */
export class LooseAggressivePlayer extends AIPlayer {
  constructor(
    id: string,
    name: string,
    difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium'
  ) {
    super(id, name, 'loose-aggressive', {
      vpip: 35 + (difficulty === 'expert' ? 5 : 0),
      pfr: 28 + (difficulty === 'expert' ? 4 : 0),
      af: 3.2 + (difficulty === 'expert' ? 0.8 : 0),
      '3bet': 15 + (difficulty === 'expert' ? 3 : 0),
      cbet: 85,
      foldToCbet: 35,
      wtsd: 35,
      wsd: 48
    }, difficulty);
  }

  makeDecision(context: GameContext): Decision {
    const handStrength = this.calculateHandStrengthPercentile(context);
    const shouldBluff = this.shouldBluff(context);

    // LAG players are more aggressive and play more hands
    if (context.street === 'preflop') {
      return this.makeLAGPreflopDecision(context, handStrength);
    }

    return this.makeLAGPostflopDecision(context, handStrength, shouldBluff);
  }

  private makeLAGPreflopDecision(context: GameContext, handStrength: number): Decision {
    // LAG plays much wider range
    if (handStrength < 25 && !['BTN', 'CO', 'SB'].includes(context.position)) {
      return {
        action: 'fold',
        confidence: 0.6,
        reasoning: 'Even LAG has limits'
      };
    }

    // Aggressive with most playable hands
    if (handStrength > 40 || ['BTN', 'CO'].includes(context.position)) {
      const betAmount = this.calculateAggressiveBetSize(context);
      return {
        action: context.toCall > 0 ? 'raise' : 'bet',
        amount: betAmount,
        confidence: 0.8,
        reasoning: 'LAG aggression'
      };
    }

    // Call with speculative hands
    if (handStrength > 25) {
      return {
        action: 'call',
        amount: context.toCall,
        confidence: 0.6,
        reasoning: 'Speculative LAG call'
      };
    }

    return {
      action: 'fold',
      confidence: 0.5,
      reasoning: 'Below LAG threshold'
    };
  }

  private makeLAGPostflopDecision(context: GameContext, handStrength: number, shouldBluff: boolean): Decision {
    // LAG is more aggressive postflop
    if (shouldBluff || handStrength > 45) {
      const betAmount = this.calculateAggressiveBetSize(context);
      return {
        action: context.toCall === 0 ? 'bet' : 'raise',
        amount: betAmount,
        confidence: shouldBluff ? 0.6 : 0.8,
        reasoning: shouldBluff ? 'LAG bluff' : 'LAG value bet'
      };
    }

    // More likely to call than fold
    if (handStrength > 25) {
      return {
        action: context.toCall === 0 ? 'check' : 'call',
        amount: context.toCall,
        confidence: 0.5,
        reasoning: 'LAG curiosity'
      };
    }

    return {
      action: 'fold',
      confidence: 0.6,
      reasoning: 'Even LAG gives up'
    };
  }

  private calculateAggressiveBetSize(context: GameContext): number {
    // LAG uses larger bet sizes
    const baseBet = context.potSize * (0.8 + Math.random() * 0.4); // 80-120% pot
    return Math.min(baseBet, context.stackSize);
  }
}

/**
 * GTO (Game Theory Optimal) Player
 */
export class GTOPlayer extends AIPlayer {
  constructor(
    id: string,
    name: string,
    difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'expert'
  ) {
    super(id, name, 'gto', {
      vpip: 22 + (difficulty === 'expert' ? 2 : -2),
      pfr: 18 + (difficulty === 'expert' ? 2 : -2),
      af: 2.8,
      '3bet': 9 + (difficulty === 'expert' ? 1 : -1),
      cbet: 70,
      foldToCbet: 40,
      wtsd: 30,
      wsd: 52
    }, difficulty);
  }

  makeDecision(context: GameContext): Decision {
    // GTO player uses balanced frequencies and optimal ranges
    const handString = cardsToHandString(context.holeCards);
    const equity = this.calculateEquity(context);
    
    if (context.street === 'preflop') {
      return this.makeGTOPreflopDecision(context, handString);
    }

    return this.makeGTOPostflopDecision(context, equity);
  }

  private makeGTOPreflopDecision(context: GameContext, handString: string): Decision {
    const raiseRange = getGTOStartingHandRange(context.position, 'raise');
    const callRange = getGTOStartingHandRange(context.position, 'call');

    // Use GTO frequencies with some randomization
    if (raiseRange.includes(handString)) {
      const shouldRaise = Math.random() < 0.85; // 85% frequency for raise hands
      if (shouldRaise) {
        const betAmount = context.potSize * 3; // Standard 3x BB raise
        return {
          action: context.toCall > 0 ? 'raise' : 'bet',
          amount: betAmount,
          confidence: 0.85,
          reasoning: 'GTO raise range'
        };
      }
    }

    if (callRange.includes(handString)) {
      const shouldCall = Math.random() < 0.7; // 70% frequency for call hands
      if (shouldCall) {
        return {
          action: 'call',
          amount: context.toCall,
          confidence: 0.7,
          reasoning: 'GTO call range'
        };
      }
    }

    return {
      action: 'fold',
      confidence: 0.9,
      reasoning: 'Outside GTO range'
    };
  }

  private makeGTOPostflopDecision(context: GameContext, equity: number): Decision {
    const potOdds = context.toCall / (context.potSize + context.toCall) * 100;
    
    // GTO postflop decisions based on equity and pot odds
    if (equity > 65) {
      // Value betting range
      const betAmount = context.potSize * 0.7;
      return {
        action: context.toCall === 0 ? 'bet' : 'raise',
        amount: betAmount,
        confidence: 0.85,
        reasoning: 'GTO value range'
      };
    }

    if (equity > potOdds + 5) {
      return {
        action: context.toCall === 0 ? 'check' : 'call',
        amount: context.toCall,
        confidence: 0.7,
        reasoning: 'GTO equity advantage'
      };
    }

    // Bluff frequency
    if (this.shouldBluff(context) && equity > 20) {
      const betAmount = context.potSize * 0.6;
      return {
        action: context.toCall === 0 ? 'bet' : 'raise',
        amount: betAmount,
        confidence: 0.6,
        reasoning: 'GTO bluff frequency'
      };
    }

    return {
      action: context.toCall === 0 ? 'check' : 'fold',
      confidence: 0.8,
      reasoning: 'GTO fold range'
    };
  }

  private calculateEquity(context: GameContext): number {
    // Use actual equity calculation for GTO player
    const result = calculateEquity(context.holeCards, context.communityCards, context.opponents, 500);
    return result.equity;
  }
}

/**
 * Tight-Passive (Rock) Player
 */
export class TightPassivePlayer extends AIPlayer {
  constructor(id: string, name: string, difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'easy') {
    super(id, name, 'tight-passive', {
      vpip: 12,
      pfr: 8,
      af: 1.2,
      '3bet': 3,
      cbet: 45,
      foldToCbet: 65,
      wtsd: 22,
      wsd: 58
    }, difficulty);
  }

  makeDecision(context: GameContext): Decision {
    const handStrength = this.calculateHandStrengthPercentile(context);
    
    // Very tight and passive
    if (handStrength < 75) {
      return {
        action: context.toCall === 0 ? 'check' : 'fold',
        confidence: 0.8,
        reasoning: 'Tight-passive - need strong hands'
      };
    }

    // Only bet with very strong hands
    if (handStrength > 90) {
      const betAmount = context.potSize * 0.5; // Small bets
      return {
        action: context.toCall === 0 ? 'bet' : 'call',
        amount: betAmount,
        confidence: 0.9,
        reasoning: 'Very strong hand'
      };
    }

    // Call with strong hands
    if (handStrength > 80) {
      return {
        action: 'call',
        amount: context.toCall,
        confidence: 0.7,
        reasoning: 'Strong hand - passive call'
      };
    }

    return {
      action: context.toCall === 0 ? 'check' : 'fold',
      confidence: 0.8,
      reasoning: 'Tight-passive fold'
    };
  }
}

/**
 * Loose-Passive (Fish) Player
 */
export class LoosePassivePlayer extends AIPlayer {
  constructor(id: string, name: string, difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'easy') {
    super(id, name, 'loose-passive', {
      vpip: 45,
      pfr: 12,
      af: 0.8,
      '3bet': 4,
      cbet: 35,
      foldToCbet: 25,
      wtsd: 45,
      wsd: 38
    }, difficulty);
  }

  makeDecision(context: GameContext): Decision {
    const handStrength = this.calculateHandStrengthPercentile(context);
    
    // Plays too many hands but rarely raises
    if (handStrength < 15) {
      return {
        action: 'fold',
        confidence: 0.6,
        reasoning: 'Even fish have limits'
      };
    }

    // Rarely raises
    if (handStrength > 95 && Math.random() < 0.3) {
      const betAmount = context.potSize * 0.6;
      return {
        action: context.toCall === 0 ? 'bet' : 'raise',
        amount: betAmount,
        confidence: 0.5,
        reasoning: 'Fish occasional aggression'
      };
    }

    // Mostly calls
    return {
      action: context.toCall === 0 ? 'check' : 'call',
      amount: context.toCall,
      confidence: 0.7,
      reasoning: 'Fish loves to call'
    };
  }
}

/**
 * Factory function to create AI players
 */
export function createAIPlayer(
  id: string,
  name: string,
  style: AIOpponentStyle,
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium'
): AIPlayer {
  switch (style) {
    case 'tight-aggressive':
      return new TightAggressivePlayer(id, name, difficulty);
    case 'loose-aggressive':
      return new LooseAggressivePlayer(id, name, difficulty);
    case 'gto':
      return new GTOPlayer(id, name, difficulty);
    case 'tight-passive':
      return new TightPassivePlayer(id, name, difficulty);
    case 'loose-passive':
      return new LoosePassivePlayer(id, name, difficulty);
    default:
      return new TightAggressivePlayer(id, name, difficulty); // Default fallback
  }
}

/**
 * AI Opponent profiles for quick selection
 */
export const AI_OPPONENT_PROFILES: AIOpponent[] = [
  {
    id: 'tag_beginner',
    name: 'Alex Chen',
    style: 'tight-aggressive',
    difficulty: 'easy',
    avatar: '/avatars/alex.jpg',
    description: 'A solid TAG player who plays tight ranges and bets aggressively with strong hands.',
    stats: { vpip: 18, pfr: 15, af: 2.5, '3bet': 8 }
  },
  {
    id: 'lag_intermediate',
    name: 'Maria Rodriguez',
    style: 'loose-aggressive',
    difficulty: 'medium',
    avatar: '/avatars/maria.jpg',
    description: 'An aggressive player who likes to put pressure with a wide range of hands.',
    stats: { vpip: 35, pfr: 28, af: 3.2, '3bet': 15 }
  },
  {
    id: 'gto_expert',
    name: 'David Kim',
    style: 'gto',
    difficulty: 'expert',
    avatar: '/avatars/david.jpg',
    description: 'A balanced GTO player who uses optimal frequencies and ranges.',
    stats: { vpip: 24, pfr: 20, af: 2.8, '3bet': 10 }
  },
  {
    id: 'fish_easy',
    name: 'Bob Johnson',
    style: 'loose-passive',
    difficulty: 'easy',
    avatar: '/avatars/bob.jpg',
    description: 'A recreational player who likes to see flops and call down.',
    stats: { vpip: 45, pfr: 12, af: 0.8, '3bet': 4 }
  },
  {
    id: 'rock_easy',
    name: 'Sarah Davis',
    style: 'tight-passive',
    difficulty: 'easy',
    avatar: '/avatars/sarah.jpg',
    description: 'A very tight player who only plays premium hands.',
    stats: { vpip: 12, pfr: 8, af: 1.2, '3bet': 3 }
  }
];