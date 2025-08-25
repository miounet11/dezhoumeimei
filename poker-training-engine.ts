import { GTOEngine } from './src/lib/gto/engine';

export interface Card {
  rank: string;
  suit: string;
  value: number;
}

export interface GamePlayer {
  id: string;
  name: string;
  chips: number;
  position: string;
  cards: Card[];
  folded: boolean;
  currentBet: number;
  totalBet: number;
  isAllIn: boolean;
  isHero?: boolean;
}

export interface GameAction {
  type: 'FOLD' | 'CHECK' | 'CALL' | 'BET' | 'RAISE' | 'ALL_IN';
  amount?: number;
  playerId: string;
}

export class PokerTrainingEngine {
  private deck: Card[] = [];
  private players: GamePlayer[] = [];
  private communityCards: Card[] = [];
  private pot: number = 0;
  private currentBet: number = 0;
  private currentPlayerIndex: number = 0;
  private dealerIndex: number = 0;
  private smallBlind: number = 1;
  private bigBlind: number = 2;
  private gamePhase: 'PREFLOP' | 'FLOP' | 'TURN' | 'RIVER' | 'SHOWDOWN' = 'PREFLOP';
  private gameHistory: GameAction[] = [];
  
  constructor(playerCount: number = 6, heroPosition: number = 0) {
    this.initializePlayers(playerCount, heroPosition);
  }
  
  private initializePlayers(count: number, heroPosition: number) {
    const positions = ['UTG', 'UTG+1', 'MP', 'CO', 'BTN', 'SB', 'BB'];
    const aiTypes = ['紧凶型', '松凶型', '岩石型', '鱼型', 'GTO型'];
    
    for (let i = 0; i < count; i++) {
      const isHero = i === heroPosition;
      this.players.push({
        id: `player-${i}`,
        name: isHero ? '你' : `${aiTypes[i % aiTypes.length]}玩家${i}`,
        chips: 100 * this.bigBlind,
        position: positions[i] || `座位${i}`,
        cards: [],
        folded: false,
        currentBet: 0,
        totalBet: 0,
        isAllIn: false,
        isHero
      });
    }
  }
  
  // 生成牌组
  private generateDeck(): Card[] {
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    const suits = ['♠', '♥', '♦', '♣'];
    const deck: Card[] = [];
    
    for (const suit of suits) {
      for (let i = 0; i < ranks.length; i++) {
        deck.push({
          rank: ranks[i],
          suit: suit,
          value: i + 2
        });
      }
    }
    
    return this.shuffleDeck(deck);
  }
  
  private shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  startNewHand() {
    // 重置牌局
    this.deck = this.generateDeck();
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.gamePhase = 'PREFLOP';
    this.gameHistory = [];
    
    // 重置玩家状态
    this.players.forEach(player => {
      player.cards = [];
      player.folded = false;
      player.currentBet = 0;
      player.totalBet = 0;
      player.isAllIn = false;
    });
    
    // 发牌
    this.dealHoleCards();
    
    // 设置盲注
    this.postBlinds();
    
    // 设置第一个行动玩家
    this.currentPlayerIndex = (this.dealerIndex + 3) % this.players.length;
    
    return this.getGameState();
  }
  
  private dealHoleCards() {
    this.players.forEach(player => {
      if (!player.folded) {
        player.cards = [this.deck.pop()!, this.deck.pop()!];
      }
    });
  }
  
  private postBlinds() {
    const sbIndex = (this.dealerIndex + 1) % this.players.length;
    const bbIndex = (this.dealerIndex + 2) % this.players.length;
    
    // 小盲注
    this.players[sbIndex].currentBet = this.smallBlind;
    this.players[sbIndex].totalBet = this.smallBlind;
    this.players[sbIndex].chips -= this.smallBlind;
    
    // 大盲注
    this.players[bbIndex].currentBet = this.bigBlind;
    this.players[bbIndex].totalBet = this.bigBlind;
    this.players[bbIndex].chips -= this.bigBlind;
    
    this.currentBet = this.bigBlind;
    this.pot = this.smallBlind + this.bigBlind;
  }
  
  dealFlop() {
    if (this.gamePhase !== 'PREFLOP') return;
    
    // 烧牌
    this.deck.pop();
    
    // 发三张翻牌
    this.communityCards = [
      this.deck.pop()!,
      this.deck.pop()!,
      this.deck.pop()!
    ];
    
    this.gamePhase = 'FLOP';
    this.resetBettingRound();
    
    return this.getGameState();
  }
  
  dealTurn() {
    if (this.gamePhase !== 'FLOP') return;
    
    // 烧牌
    this.deck.pop();
    
    // 发转牌
    this.communityCards.push(this.deck.pop()!);
    
    this.gamePhase = 'TURN';
    this.resetBettingRound();
    
    return this.getGameState();
  }
  
  dealRiver() {
    if (this.gamePhase !== 'TURN') return;
    
    // 烧牌
    this.deck.pop();
    
    // 发河牌
    this.communityCards.push(this.deck.pop()!);
    
    this.gamePhase = 'RIVER';
    this.resetBettingRound();
    
    return this.getGameState();
  }
  
  private resetBettingRound() {
    this.currentBet = 0;
    this.players.forEach(player => {
      player.currentBet = 0;
    });
    this.currentPlayerIndex = this.getNextActivePlayer(this.dealerIndex + 1);
  }
  
  processAction(action: GameAction): {
    valid: boolean;
    message?: string;
    gameState?: any;
    gtoFeedback?: any;
  } {
    const player = this.players[this.currentPlayerIndex];
    
    if (player.id !== action.playerId) {
      return { valid: false, message: '不是该玩家的回合' };
    }
    
    let valid = false;
    let message = '';
    
    switch (action.type) {
      case 'FOLD':
        player.folded = true;
        valid = true;
        message = `${player.name} 弃牌`;
        break;
        
      case 'CHECK':
        if (this.currentBet > player.currentBet) {
          return { valid: false, message: '不能过牌，需要跟注' };
        }
        valid = true;
        message = `${player.name} 过牌`;
        break;
        
      case 'CALL':
        const callAmount = this.currentBet - player.currentBet;
        if (callAmount > player.chips) {
          // All-in
          this.pot += player.chips;
          player.totalBet += player.chips;
          player.chips = 0;
          player.isAllIn = true;
          message = `${player.name} 全下 ${player.chips}`;
        } else {
          player.chips -= callAmount;
          player.currentBet = this.currentBet;
          player.totalBet += callAmount;
          this.pot += callAmount;
          message = `${player.name} 跟注 ${callAmount}`;
        }
        valid = true;
        break;
        
      case 'BET':
      case 'RAISE':
        const betAmount = action.amount || 0;
        if (betAmount < this.currentBet * 2) {
          return { valid: false, message: '加注金额不足' };
        }
        if (betAmount > player.chips) {
          return { valid: false, message: '筹码不足' };
        }
        
        const raiseAmount = betAmount - player.currentBet;
        player.chips -= raiseAmount;
        player.currentBet = betAmount;
        player.totalBet += raiseAmount;
        this.currentBet = betAmount;
        this.pot += raiseAmount;
        
        message = action.type === 'BET' ? 
          `${player.name} 下注 ${betAmount}` :
          `${player.name} 加注到 ${betAmount}`;
        valid = true;
        break;
        
      case 'ALL_IN':
        this.pot += player.chips;
        player.totalBet += player.chips;
        if (player.chips + player.currentBet > this.currentBet) {
          this.currentBet = player.chips + player.currentBet;
        }
        player.currentBet += player.chips;
        player.chips = 0;
        player.isAllIn = true;
        message = `${player.name} 全下！`;
        valid = true;
        break;
    }
    
    if (valid) {
      this.gameHistory.push(action);
      
      // 获取GTO反馈
      let gtoFeedback = null;
      if (player.isHero) {
        gtoFeedback = this.getGTOFeedback(action);
      }
      
      // 移动到下一个玩家
      this.currentPlayerIndex = this.getNextActivePlayer(this.currentPlayerIndex + 1);
      
      // 检查是否进入下一阶段
      if (this.checkRoundComplete()) {
        this.advanceGamePhase();
      }
      
      return {
        valid: true,
        message,
        gameState: this.getGameState(),
        gtoFeedback
      };
    }
    
    return { valid: false, message };
  }
  
  private getGTOFeedback(action: GameAction) {
    const player = this.players.find(p => p.id === action.playerId);
    if (!player || !player.isHero) return null;
    
    // 简化的GTO分析（实际应该调用GTOEngine）
    const equity = this.calculateSimpleEquity(player.cards);
    const potOdds = this.currentBet / (this.pot + this.currentBet);
    
    const isOptimal = equity > potOdds;
    const optimalAction = isOptimal ? 
      (this.currentBet === 0 ? 'BET' : 'RAISE') : 
      (this.currentBet === 0 ? 'CHECK' : 'FOLD');
    
    return {
      optimal: optimalAction.toLowerCase() === action.type.toLowerCase(),
      optimalAction: this.translateAction(optimalAction),
      yourAction: this.translateAction(action.type),
      equity: (equity * 100).toFixed(1),
      potOdds: (potOdds * 100).toFixed(1),
      feedback: optimalAction.toLowerCase() === action.type.toLowerCase() ? 
        `✅ 正确！这是GTO推荐的打法。` :
        `⚠️ GTO建议${this.translateAction(optimalAction)}。你的胜率${(equity * 100).toFixed(1)}% vs 所需${(potOdds * 100).toFixed(1)}%`,
      explanation: this.getActionExplanation(action.type, equity, potOdds)
    };
  }
  
  private calculateSimpleEquity(cards: Card[]): number {
    // 简化的胜率计算
    if (cards.length === 0) return 0;
    
    const hasAce = cards.some(c => c.rank === 'A');
    const hasPair = cards.length === 2 && cards[0].rank === cards[1].rank;
    const suited = cards.length === 2 && cards[0].suit === cards[1].suit;
    
    if (hasPair) {
      if (cards[0].value >= 12) return 0.85; // AA, KK, QQ
      if (cards[0].value >= 10) return 0.75; // JJ, TT
      return 0.65; // 小对子
    }
    
    if (hasAce) {
      if (cards.some(c => c.rank === 'K')) return 0.70; // AK
      return 0.60; // Ax
    }
    
    if (suited) return 0.45;
    
    return 0.35;
  }
  
  private translateAction(action: string): string {
    const translations: Record<string, string> = {
      'FOLD': '弃牌',
      'CHECK': '过牌',
      'CALL': '跟注',
      'BET': '下注',
      'RAISE': '加注',
      'ALL_IN': '全下'
    };
    return translations[action.toUpperCase()] || action;
  }
  
  private getActionExplanation(action: string, equity: number, potOdds: number): string {
    if (action === 'FOLD') {
      return equity < potOdds ? 
        `正确的弃牌。你的胜率不足以支持跟注。` :
        `可能过于保守，你有足够的胜率继续。`;
    } else if (action === 'CHECK') {
      return `在这个位置过牌可以控制底池大小，同时保护你的过牌范围。`;
    } else if (action === 'CALL') {
      return equity > potOdds ?
        `有利可图的跟注，你的胜率支持这个决定。` :
        `跟注可能亏损，考虑弃牌或加注诈唬。`;
    } else if (action === 'BET' || action === 'RAISE') {
      return `激进的打法！通过主动下注施加压力，可以赢得弃牌率或建立底池。`;
    }
    return '';
  }
  
  private checkRoundComplete(): boolean {
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length <= 1) return true;
    
    // 检查是否所有玩家都已行动且下注相同
    const maxBet = Math.max(...activePlayers.map(p => p.currentBet));
    const allActed = activePlayers.every(p => 
      p.currentBet === maxBet || p.isAllIn
    );
    
    return allActed && this.gameHistory.length > this.players.length;
  }
  
  private advanceGamePhase() {
    const activePlayers = this.getActivePlayers();
    
    if (activePlayers.length <= 1) {
      this.showdown();
      return;
    }
    
    switch (this.gamePhase) {
      case 'PREFLOP':
        this.dealFlop();
        break;
      case 'FLOP':
        this.dealTurn();
        break;
      case 'TURN':
        this.dealRiver();
        break;
      case 'RIVER':
        this.showdown();
        break;
    }
  }
  
  private showdown() {
    this.gamePhase = 'SHOWDOWN';
    const activePlayers = this.getActivePlayers();
    
    if (activePlayers.length === 1) {
      // 只有一个玩家，直接获胜
      const winner = activePlayers[0];
      winner.chips += this.pot;
      return {
        winners: [winner],
        pot: this.pot,
        message: `${winner.name} 赢得底池 ${this.pot}`
      };
    }
    
    // 简化的手牌比较（实际应该使用完整的手牌评估）
    const playerScores = activePlayers.map(player => ({
      player,
      score: this.evaluateHand(player.cards, this.communityCards)
    }));
    
    playerScores.sort((a, b) => b.score - a.score);
    const winnerScore = playerScores[0].score;
    const winners = playerScores.filter(ps => ps.score === winnerScore);
    
    // 分配底池
    const winAmount = Math.floor(this.pot / winners.length);
    winners.forEach(w => {
      w.player.chips += winAmount;
    });
    
    return {
      winners: winners.map(w => w.player),
      pot: this.pot,
      message: winners.length > 1 ?
        `平分底池：${winners.map(w => w.player.name).join(', ')} 各得 ${winAmount}` :
        `${winners[0].player.name} 赢得底池 ${this.pot}`
    };
  }
  
  private evaluateHand(holeCards: Card[], communityCards: Card[]): number {
    // 简化的手牌评估
    const allCards = [...holeCards, ...communityCards];
    let score = 0;
    
    // 检查对子
    const ranks = allCards.map(c => c.rank);
    const rankCounts: Record<string, number> = {};
    ranks.forEach(r => {
      rankCounts[r] = (rankCounts[r] || 0) + 1;
    });
    
    const counts = Object.values(rankCounts).sort((a, b) => b - a);
    
    // 四条
    if (counts[0] === 4) score = 8000;
    // 葫芦
    else if (counts[0] === 3 && counts[1] === 2) score = 7000;
    // 同花
    else if (this.hasFlush(allCards)) score = 6000;
    // 顺子
    else if (this.hasStraight(allCards)) score = 5000;
    // 三条
    else if (counts[0] === 3) score = 4000;
    // 两对
    else if (counts[0] === 2 && counts[1] === 2) score = 3000;
    // 一对
    else if (counts[0] === 2) score = 2000;
    // 高牌
    else score = Math.max(...allCards.map(c => c.value)) * 10;
    
    return score;
  }
  
  private hasFlush(cards: Card[]): boolean {
    const suitCounts: Record<string, number> = {};
    cards.forEach(c => {
      suitCounts[c.suit] = (suitCounts[c.suit] || 0) + 1;
    });
    return Object.values(suitCounts).some(count => count >= 5);
  }
  
  private hasStraight(cards: Card[]): boolean {
    const values = [...new Set(cards.map(c => c.value))].sort((a, b) => a - b);
    for (let i = 0; i <= values.length - 5; i++) {
      if (values[i + 4] - values[i] === 4) return true;
    }
    // 检查A-2-3-4-5
    if (values.includes(14) && values.includes(2) && values.includes(3) && 
        values.includes(4) && values.includes(5)) return true;
    return false;
  }
  
  private getActivePlayers(): GamePlayer[] {
    return this.players.filter(p => !p.folded);
  }
  
  private getNextActivePlayer(startIndex: number): number {
    let index = startIndex % this.players.length;
    let attempts = 0;
    while ((this.players[index].folded || this.players[index].isAllIn) && attempts < this.players.length) {
      index = (index + 1) % this.players.length;
      attempts++;
    }
    return index;
  }
  
  getGameState() {
    return {
      players: this.players,
      communityCards: this.communityCards,
      pot: this.pot,
      currentBet: this.currentBet,
      currentPlayer: this.players[this.currentPlayerIndex],
      gamePhase: this.gamePhase,
      phaseText: this.getPhaseText(),
      history: this.gameHistory,
      isHeroTurn: this.players[this.currentPlayerIndex]?.isHero || false
    };
  }
  
  private getPhaseText(): string {
    const phaseMap: Record<string, string> = {
      'PREFLOP': '翻牌前',
      'FLOP': '翻牌',
      'TURN': '转牌',
      'RIVER': '河牌',
      'SHOWDOWN': '摊牌'
    };
    return phaseMap[this.gamePhase] || this.gamePhase;
  }
  
  // AI决策
  getAIDecision(player: GamePlayer): GameAction {
    // 简化的AI决策逻辑
    const equity = this.calculateSimpleEquity(player.cards);
    const potOdds = this.currentBet / (this.pot + this.currentBet);
    
    let action: GameAction = {
      type: 'CHECK',
      playerId: player.id
    };
    
    // 基于玩家类型调整决策
    const playerType = player.name.includes('紧凶') ? 'TAG' :
                      player.name.includes('松凶') ? 'LAG' :
                      player.name.includes('岩石') ? 'ROCK' :
                      player.name.includes('鱼') ? 'FISH' : 'GTO';
    
    if (this.currentBet === 0) {
      // 无人下注
      if (equity > 0.6) {
        action.type = 'BET';
        action.amount = Math.floor(this.pot * 0.75);
      } else if (equity > 0.4 && playerType === 'LAG') {
        action.type = 'BET';
        action.amount = Math.floor(this.pot * 0.5);
      } else {
        action.type = 'CHECK';
      }
    } else {
      // 面对下注
      if (equity > potOdds + 0.1) {
        action.type = 'RAISE';
        action.amount = Math.floor(this.currentBet * 2.5);
      } else if (equity > potOdds) {
        action.type = 'CALL';
      } else {
        action.type = 'FOLD';
      }
    }
    
    // 确保下注金额不超过筹码
    if (action.amount && action.amount > player.chips) {
      action.type = 'ALL_IN';
      delete action.amount;
    }
    
    return action;
  }
}

// 导出供React组件使用
export default PokerTrainingEngine;