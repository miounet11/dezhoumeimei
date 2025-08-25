import { TrainingSession, TrainingMode, TrainingScenario, Decision, Position, Card } from '@/types';
import { AIPlayer, createAIPlayer, AI_OPPONENT_PROFILES } from '@/lib/ai/player-models';
import { GTOEngine, GameState } from '@/lib/gto/engine';
import { calculateHandStrength, cardsToHandString } from '@/lib/utils/poker';

export interface TrainingSessionConfig {
  mode: TrainingMode;
  scenario: TrainingScenario;
  aiOpponents: string[]; // AI opponent IDs
  tableSize: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  sessionLength: number; // in hands
  focusAreas: string[]; // e.g., ['preflop', 'cbet', 'river-bluffs']
}

export interface HandResult {
  handId: string;
  sessionId: string;
  holeCards: Card[];
  communityCards: Card[];
  position: Position;
  decisions: Decision[];
  finalAction: string;
  potSize: number;
  result: 'win' | 'loss' | 'tie';
  showdown: boolean;
  gtoAnalysis?: {
    optimalAction: string;
    playerAction: string;
    evDifference: number;
    mistakes: string[];
    explanation: string;
  };
  timestamp: Date;
}

export interface SessionStatistics {
  sessionId: string;
  userId: string;
  handsPlayed: number;
  correctDecisions: number;
  accuracy: number; // percentage
  averageEVError: number;
  totalEV: number;
  profitLoss: number;
  vpip: number;
  pfr: number;
  aggression: number;
  mistakes: {
    type: string;
    count: number;
    cost: number; // in EV
  }[];
  improvements: string[];
  nextFocusAreas: string[];
  timeSpent: number; // in minutes
  completedAt: Date;
}

export interface LearningProgress {
  userId: string;
  skillLevel: {
    overall: number; // 0-100
    preflop: number;
    postflop: number;
    bluffing: number;
    valueBeging: number;
    handReading: number;
    bankrollManagement: number;
  };
  strongAreas: string[];
  weakAreas: string[];
  recentImprovement: number;
  lastUpdated: Date;
}

/**
 * Training Session Manager
 */
export class TrainingSessionManager {
  private currentSession: TrainingSession | null = null;
  private sessionHands: HandResult[] = [];
  private aiPlayers: AIPlayer[] = [];
  private gtoEngine: GTOEngine;
  private sessionStartTime: Date | null = null;

  constructor() {
    this.gtoEngine = new GTOEngine();
  }

  /**
   * Start a new training session
   */
  async startSession(
    userId: string,
    config: TrainingSessionConfig
  ): Promise<TrainingSession> {
    // Create AI opponents
    this.aiPlayers = config.aiOpponents.map(opponentId => {
      const profile = AI_OPPONENT_PROFILES.find(p => p.id === opponentId);
      if (!profile) throw new Error(`AI opponent not found: ${opponentId}`);
      
      return createAIPlayer(
        profile.id,
        profile.name,
        profile.style,
        config.difficulty
      );
    });

    // Create new session
    this.currentSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      mode: config.mode,
      scenario: config.scenario,
      difficulty: config.difficulty,
      score: 0,
      decisions: [],
      duration: 0,
      completedAt: new Date().toISOString()
    };

    this.sessionHands = [];
    this.sessionStartTime = new Date();

    return this.currentSession;
  }

  /**
   * Process a hand during training session
   */
  async processTrainingHand(
    holeCards: Card[],
    communityCards: Card[],
    position: Position,
    potSize: number,
    stackSize: number,
    toCall: number,
    previousActions: string[]
  ): Promise<{
    handResult: HandResult;
    gtoRecommendation: any;
    aiDecisions: Decision[];
  }> {
    if (!this.currentSession) {
      throw new Error('No active training session');
    }

    const handId = `hand_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    // Get GTO recommendation
    const gameState: GameState = {
      holeCards,
      communityCards,
      position,
      stackSize,
      potSize,
      toCall,
      previousAction: previousActions[previousActions.length - 1] || 'none',
      opponents: this.aiPlayers.length,
      effectiveStacks: stackSize,
      street: this.getStreet(communityCards)
    };

    const gtoAnalysis = await this.gtoEngine.analyzeGameState(gameState);

    // Get AI player decisions
    const aiDecisions = this.aiPlayers.map(aiPlayer => {
      const context = {
        holeCards: this.generateRandomCards(), // AI doesn't see our cards
        communityCards,
        position: this.getRandomPosition(),
        stackSize,
        potSize,
        toCall,
        betAmount: toCall,
        street: gameState.street,
        opponents: this.aiPlayers.length,
        previousActions,
        opponentStats: [],
        sessionHistory: []
      };

      return aiPlayer.makeDecision(context);
    });

    // Create hand result template
    const handResult: HandResult = {
      handId,
      sessionId: this.currentSession.id,
      holeCards,
      communityCards,
      position,
      decisions: [],
      finalAction: '',
      potSize,
      result: 'tie', // Will be determined after player acts
      showdown: false,
      timestamp: new Date()
    };

    return {
      handResult,
      gtoRecommendation: gtoAnalysis,
      aiDecisions
    };
  }

  /**
   * Record player decision and analyze
   */
  async recordDecision(
    handId: string,
    playerDecision: Decision,
    gtoOptimal: Decision
  ): Promise<{
    analysis: any;
    feedback: string;
    evDifference: number;
  }> {
    const handIndex = this.sessionHands.findIndex(h => h.handId === handId);
    if (handIndex === -1) {
      throw new Error('Hand not found');
    }

    const hand = this.sessionHands[handIndex];
    hand.decisions.push(playerDecision);
    hand.finalAction = playerDecision.action;

    // Analyze decision quality
    const evDifference = gtoOptimal.ev - (playerDecision as any).ev || 0;
    const isCorrect = Math.abs(evDifference) < 0.1; // Within 0.1 EV is considered correct

    // Generate feedback
    const feedback = this.generateFeedback(playerDecision, gtoOptimal, evDifference);

    // Update session statistics
    if (this.currentSession) {
      this.currentSession.decisions.push({
        action: playerDecision.action,
        amount: playerDecision.amount,
        isCorrect,
        ev: (playerDecision as any).ev || 0,
        reasoning: playerDecision.reasoning,
        timestamp: new Date().toISOString()
      });
    }

    // Store GTO analysis
    hand.gtoAnalysis = {
      optimalAction: gtoOptimal.action + (gtoOptimal.amount ? ` $${gtoOptimal.amount}` : ''),
      playerAction: playerDecision.action + (playerDecision.amount ? ` $${playerDecision.amount}` : ''),
      evDifference,
      mistakes: isCorrect ? [] : ['Suboptimal action chosen'],
      explanation: feedback
    };

    return {
      analysis: hand.gtoAnalysis,
      feedback,
      evDifference
    };
  }

  /**
   * Complete current training session
   */
  async completeSession(): Promise<SessionStatistics> {
    if (!this.currentSession || !this.sessionStartTime) {
      throw new Error('No active session to complete');
    }

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - this.sessionStartTime.getTime()) / 1000 / 60); // minutes

    this.currentSession.duration = duration;
    this.currentSession.completedAt = endTime.toISOString();

    // Calculate session statistics
    const stats = this.calculateSessionStatistics();
    
    // Reset session state
    this.currentSession = null;
    this.sessionHands = [];
    this.aiPlayers = [];
    this.sessionStartTime = null;

    return stats;
  }

  /**
   * Get current session progress
   */
  getSessionProgress(): {
    handsPlayed: number;
    handsRemaining: number;
    currentAccuracy: number;
    recentMistakes: string[];
  } {
    if (!this.currentSession) {
      return {
        handsPlayed: 0,
        handsRemaining: 0,
        currentAccuracy: 0,
        recentMistakes: []
      };
    }

    const correctDecisions = this.currentSession.decisions.filter(d => d.isCorrect).length;
    const totalDecisions = this.currentSession.decisions.length;
    const accuracy = totalDecisions > 0 ? (correctDecisions / totalDecisions) * 100 : 0;

    const recentMistakes = this.currentSession.decisions
      .filter(d => !d.isCorrect)
      .slice(-3)
      .map(d => `${d.action}: ${d.reasoning}`);

    return {
      handsPlayed: this.sessionHands.length,
      handsRemaining: Math.max(0, 50 - this.sessionHands.length), // Default 50 hands per session
      currentAccuracy: accuracy,
      recentMistakes
    };
  }

  /**
   * Get training recommendations based on performance
   */
  getTrainingRecommendations(userId: string): string[] {
    const recommendations: string[] = [];

    if (!this.currentSession) return recommendations;

    const decisions = this.currentSession.decisions;
    const mistakes = decisions.filter(d => !d.isCorrect);
    
    // Analyze common mistakes
    const foldMistakes = mistakes.filter(d => d.action === 'fold').length;
    const aggressionMistakes = mistakes.filter(d => ['bet', 'raise'].includes(d.action)).length;
    const passiveMistakes = mistakes.filter(d => ['check', 'call'].includes(d.action)).length;

    if (foldMistakes > decisions.length * 0.3) {
      recommendations.push('Practice playing more hands - you may be folding too much');
    }

    if (aggressionMistakes > decisions.length * 0.2) {
      recommendations.push('Work on bet sizing and timing your aggression');
    }

    if (passiveMistakes > decisions.length * 0.25) {
      recommendations.push('Consider being more aggressive with strong hands');
    }

    // Position-based recommendations
    const positionalMistakes = mistakes.filter(d => 
      d.reasoning.includes('position') || d.reasoning.includes('UTG') || d.reasoning.includes('BTN')
    );
    
    if (positionalMistakes.length > 0) {
      recommendations.push('Review positional play - adjust ranges based on position');
    }

    return recommendations.slice(0, 3); // Limit to 3 recommendations
  }

  /**
   * Generate personalized training scenarios
   */
  generatePersonalizedScenarios(progress: LearningProgress): TrainingScenario[] {
    const scenarios: TrainingScenario[] = [];

    // Focus on weak areas
    progress.weakAreas.forEach(weakArea => {
      switch (weakArea) {
        case 'preflop':
          scenarios.push({
            id: 'preflop_focus',
            title: 'Preflop Decision Making',
            position: 'UTG',
            stackSize: 100,
            opponents: 5,
            description: 'Practice optimal preflop ranges and 3-betting',
            objectives: [
              'Master tight UTG ranges',
              'Understand 3-bet value vs bluff ratios',
              'Practice position-based adjustments'
            ]
          });
          break;

        case 'postflop':
          scenarios.push({
            id: 'postflop_focus',
            title: 'Postflop Strategy',
            position: 'BTN',
            stackSize: 100,
            opponents: 2,
            description: 'Advanced postflop play and board texture reading',
            objectives: [
              'Analyze board textures effectively',
              'Balance value bets and bluffs',
              'Practice pot control with marginal hands'
            ]
          });
          break;

        case 'bluffing':
          scenarios.push({
            id: 'bluffing_focus',
            title: 'Strategic Bluffing',
            position: 'CO',
            stackSize: 100,
            opponents: 3,
            description: 'Learn when and how to bluff effectively',
            objectives: [
              'Identify good bluffing spots',
              'Practice optimal bluff sizing',
              'Understand opponent tendencies'
            ]
          });
          break;
      }
    });

    return scenarios.slice(0, 3); // Return top 3 scenarios
  }

  // Private helper methods

  private calculateSessionStatistics(): SessionStatistics {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const decisions = this.currentSession.decisions;
    const correctDecisions = decisions.filter(d => d.isCorrect).length;
    const accuracy = decisions.length > 0 ? (correctDecisions / decisions.length) * 100 : 0;

    const totalEV = decisions.reduce((sum, d) => sum + d.ev, 0);
    const averageEVError = decisions.length > 0 ? 
      decisions.reduce((sum, d) => sum + Math.abs(d.ev), 0) / decisions.length : 0;

    // Analyze mistakes
    const mistakes = this.analyzeMistakes(decisions.filter(d => !d.isCorrect));

    // Calculate poker stats
    const vpipHands = decisions.filter(d => ['call', 'bet', 'raise'].includes(d.action)).length;
    const pfrHands = decisions.filter(d => ['bet', 'raise'].includes(d.action)).length;
    const aggressiveActions = decisions.filter(d => ['bet', 'raise'].includes(d.action)).length;
    const passiveActions = decisions.filter(d => ['call', 'check'].includes(d.action)).length;

    const vpip = decisions.length > 0 ? (vpipHands / decisions.length) * 100 : 0;
    const pfr = decisions.length > 0 ? (pfrHands / decisions.length) * 100 : 0;
    const aggression = passiveActions > 0 ? aggressiveActions / passiveActions : aggressiveActions;

    return {
      sessionId: this.currentSession.id,
      userId: this.currentSession.userId,
      handsPlayed: this.sessionHands.length,
      correctDecisions,
      accuracy,
      averageEVError,
      totalEV,
      profitLoss: totalEV, // Simplified
      vpip,
      pfr,
      aggression,
      mistakes,
      improvements: this.generateImprovements(mistakes),
      nextFocusAreas: this.identifyFocusAreas(mistakes),
      timeSpent: this.currentSession.duration,
      completedAt: new Date()
    };
  }

  private analyzeMistakes(incorrectDecisions: Decision[]): { type: string; count: number; cost: number }[] {
    const mistakeTypes: { [key: string]: { count: number; cost: number } } = {};

    incorrectDecisions.forEach(decision => {
      let mistakeType = 'General';
      
      if (decision.action === 'fold' && decision.ev > 0) {
        mistakeType = 'Folding winners';
      } else if (['bet', 'raise'].includes(decision.action) && decision.ev < -2) {
        mistakeType = 'Overaggression';
      } else if (['check', 'call'].includes(decision.action) && decision.ev < -1) {
        mistakeType = 'Passive mistakes';
      } else if (decision.reasoning.includes('bluff')) {
        mistakeType = 'Bad bluffs';
      } else if (decision.reasoning.includes('value')) {
        mistakeType = 'Value betting errors';
      }

      if (!mistakeTypes[mistakeType]) {
        mistakeTypes[mistakeType] = { count: 0, cost: 0 };
      }

      mistakeTypes[mistakeType].count++;
      mistakeTypes[mistakeType].cost += Math.abs(decision.ev);
    });

    return Object.entries(mistakeTypes).map(([type, data]) => ({
      type,
      count: data.count,
      cost: data.cost
    }));
  }

  private generateImprovements(mistakes: { type: string; count: number; cost: number }[]): string[] {
    const improvements: string[] = [];

    mistakes.forEach(mistake => {
      switch (mistake.type) {
        case 'Folding winners':
          improvements.push('Practice identifying profitable calling spots');
          break;
        case 'Overaggression':
          improvements.push('Work on bet sizing and bluff selection');
          break;
        case 'Passive mistakes':
          improvements.push('Be more aggressive with strong hands');
          break;
        case 'Bad bluffs':
          improvements.push('Study board textures for better bluff selection');
          break;
        case 'Value betting errors':
          improvements.push('Practice thin value betting concepts');
          break;
      }
    });

    return [...new Set(improvements)]; // Remove duplicates
  }

  private identifyFocusAreas(mistakes: { type: string; count: number; cost: number }[]): string[] {
    const focusAreas: string[] = [];

    // Sort mistakes by cost (most expensive first)
    const sortedMistakes = mistakes.sort((a, b) => b.cost - a.cost);

    sortedMistakes.slice(0, 2).forEach(mistake => {
      switch (mistake.type) {
        case 'Folding winners':
        case 'Passive mistakes':
          focusAreas.push('Aggression and value maximization');
          break;
        case 'Overaggression':
        case 'Bad bluffs':
          focusAreas.push('Bluff selection and sizing');
          break;
        case 'Value betting errors':
          focusAreas.push('Postflop value betting');
          break;
      }
    });

    return [...new Set(focusAreas)];
  }

  private generateFeedback(playerDecision: Decision, gtoOptimal: Decision, evDifference: number): string {
    if (Math.abs(evDifference) < 0.1) {
      return `Excellent decision! Your ${playerDecision.action} was very close to optimal.`;
    }

    let feedback = `The GTO optimal play was ${gtoOptimal.action}`;
    if (gtoOptimal.amount) {
      feedback += ` for $${gtoOptimal.amount}`;
    }
    feedback += `. Your ${playerDecision.action} cost approximately ${Math.abs(evDifference).toFixed(2)} EV.`;

    // Add specific advice based on the mistake
    if (playerDecision.action === 'fold' && gtoOptimal.action !== 'fold') {
      feedback += ' You may have folded a profitable spot. Consider the pot odds and your equity.';
    } else if (['bet', 'raise'].includes(playerDecision.action) && gtoOptimal.action === 'fold') {
      feedback += ' This appears to be an overaggressive play. Look for better bluffing opportunities.';
    } else if (playerDecision.action === 'call' && gtoOptimal.action === 'raise') {
      feedback += ' You missed a value betting opportunity. Consider being more aggressive with strong hands.';
    }

    return feedback;
  }

  private getStreet(communityCards: Card[]): 'preflop' | 'flop' | 'turn' | 'river' {
    if (communityCards.length === 0) return 'preflop';
    if (communityCards.length === 3) return 'flop';
    if (communityCards.length === 4) return 'turn';
    return 'river';
  }

  private generateRandomCards(): Card[] {
    const ranks: Card['rank'][] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    
    const cards: Card[] = [];
    for (let i = 0; i < 2; i++) {
      cards.push({
        rank: ranks[Math.floor(Math.random() * ranks.length)],
        suit: suits[Math.floor(Math.random() * suits.length)]
      });
    }
    return cards;
  }

  private getRandomPosition(): Position {
    const positions: Position[] = ['UTG', 'UTG+1', 'MP', 'MP+1', 'CO', 'BTN', 'SB', 'BB'];
    return positions[Math.floor(Math.random() * positions.length)];
  }
}