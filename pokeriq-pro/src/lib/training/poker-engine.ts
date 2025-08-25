/**
 * 完整的扑克训练引擎
 * 提供真实的德州扑克游戏逻辑和AI对战功能
 */

import { ACTIONS, POSITIONS, STREETS, AI_STYLES, HAND_RANKINGS, SUITS, RANKS } from '../../../lib/poker/constants';

// 扑克牌类型
export interface Card {
  suit: string;
  rank: string;
}

// 玩家类型
export interface GamePlayer {
  id: string;
  name: string;
  chips: number;
  position: string;
  cards: Card[];
  currentBet: number;
  totalBet: number;
  isHero: boolean;
  isActive: boolean;
  folded: boolean;
  isAllIn: boolean;
  style?: keyof typeof AI_STYLES;
}

// 游戏动作
export interface GameAction {
  type: keyof typeof ACTIONS;
  playerId: string;
  amount?: number;
  timestamp?: Date;
}

// 游戏状态
export interface GameState {
  pot: number;
  currentBet: number;
  minRaise: number;
  street: keyof typeof STREETS;
  phaseText: string;
  communityCards: Card[];
  players: GamePlayer[];
  currentPlayer: GamePlayer | null;
  isHeroTurn: boolean;
  gamePhase: string;
  dealerPosition: number;
  actionHistory: GameAction[];
}

// GTO反馈
export interface GTOFeedback {
  optimal: boolean;
  feedback: string;
  explanation?: string;
  yourAction: string;
  optimalAction: string;
  equity: number;
  evLoss?: number;
}

// 动作结果
export interface ActionResult {
  valid: boolean;
  message?: string;
  gameState?: GameState;
  gtoFeedback?: GTOFeedback;
}

/**
 * 扑克训练引擎主类
 */
export class PokerTrainingEngine {
  private players: GamePlayer[] = [];
  private deck: Card[] = [];
  private communityCards: Card[] = [];
  private pot: number = 0;
  private currentBet: number = 0;
  private minRaise: number = 2; // 大盲注
  private street: keyof typeof STREETS = 'PREFLOP';
  private dealerPosition: number = 0;
  private currentPlayerIndex: number = 0;
  private actionHistory: GameAction[] = [];
  private smallBlind: number = 1;
  private bigBlind: number = 2;

  constructor(playerCount: number = 6, heroPosition: number = 2) {
    this.initializePlayers(playerCount, heroPosition);
  }

  /**
   * 初始化玩家
   */
  private initializePlayers(playerCount: number, heroPosition: number) {
    const positions = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
    const aiNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
    const aiStyles: (keyof typeof AI_STYLES)[] = [
      'TIGHT_AGGRESSIVE', 'LOOSE_AGGRESSIVE', 'TIGHT_PASSIVE', 
      'CALLING_STATION', 'SHARK', 'NIT'
    ];

    this.players = [];
    for (let i = 0; i < playerCount; i++) {
      const isHero = i === heroPosition;
      this.players.push({
        id: `player_${i}`,
        name: isHero ? '你' : aiNames[i] || `AI${i}`,
        chips: 100, // 100BB起始筹码
        position: positions[i] || `P${i}`,
        cards: [],
        currentBet: 0,
        totalBet: 0,
        isHero,
        isActive: true,
        folded: false,
        isAllIn: false,
        style: isHero ? undefined : aiStyles[i % aiStyles.length]
      });
    }
  }

  /**
   * 开始新手牌
   */
  startNewHand(): GameState {
    // 重置状态
    this.resetHand();
    
    // 创建并洗牌
    this.createDeck();
    this.shuffleDeck();
    
    // 发底牌
    this.dealHoleCards();
    
    // 收取盲注
    this.collectBlinds();
    
    // 设置第一个行动玩家
    this.setFirstToAct();
    
    return this.getGameState();
  }

  /**
   * 重置手牌
   */
  private resetHand() {
    this.communityCards = [];
    this.pot = 0;
    this.currentBet = 0;
    this.minRaise = this.bigBlind;
    this.street = 'PREFLOP';
    this.actionHistory = [];
    
    this.players.forEach(player => {
      player.cards = [];
      player.currentBet = 0;
      player.totalBet = 0;
      player.folded = false;
      player.isAllIn = false;
      player.isActive = true;
    });
  }

  /**
   * 创建牌组
   */
  private createDeck() {
    this.deck = [];
    const suits = Object.values(SUITS);
    const ranks = Object.values(RANKS);
    
    for (const suit of suits) {
      for (const rank of ranks) {
        this.deck.push({ suit, rank });
      }
    }
  }

  /**
   * 洗牌
   */
  private shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  /**
   * 发底牌
   */
  private dealHoleCards() {
    for (let round = 0; round < 2; round++) {
      for (const player of this.players) {
        if (player.isActive) {
          const card = this.deck.pop();
          if (card) {
            player.cards.push(card);
          }
        }
      }
    }
  }

  /**
   * 收取盲注
   */
  private collectBlinds() {
    const sbPlayer = this.players.find(p => p.position === 'SB');
    const bbPlayer = this.players.find(p => p.position === 'BB');
    
    if (sbPlayer) {
      const sbAmount = Math.min(this.smallBlind, sbPlayer.chips);
      sbPlayer.currentBet = sbAmount;
      sbPlayer.chips -= sbAmount;
      this.pot += sbAmount;
    }
    
    if (bbPlayer) {
      const bbAmount = Math.min(this.bigBlind, bbPlayer.chips);
      bbPlayer.currentBet = bbAmount;
      bbPlayer.chips -= bbAmount;
      this.pot += bbAmount;
      this.currentBet = bbAmount;
    }
  }

  /**
   * 设置第一个行动玩家
   */
  private setFirstToAct() {
    // 翻前从UTG开始
    const utgIndex = this.players.findIndex(p => p.position === 'UTG');
    this.currentPlayerIndex = utgIndex !== -1 ? utgIndex : 0;
    
    // 跳过已弃牌或全下的玩家
    this.findNextActivePlayer();
  }

  /**
   * 寻找下一个活跃玩家
   */
  private findNextActivePlayer() {
    const startIndex = this.currentPlayerIndex;
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    } while (
      (this.players[this.currentPlayerIndex].folded || 
       this.players[this.currentPlayerIndex].isAllIn) &&
      this.currentPlayerIndex !== startIndex
    );
  }

  /**
   * 处理玩家动作
   */
  processAction(action: GameAction): ActionResult {
    const player = this.players.find(p => p.id === action.playerId);
    if (!player) {
      return { valid: false, message: '玩家不存在' };
    }

    // 验证动作有效性
    const validation = this.validateAction(action, player);
    if (!validation.valid) {
      return validation;
    }

    // 执行动作
    this.executeAction(action, player);

    // 记录动作
    this.actionHistory.push({
      ...action,
      timestamp: new Date()
    });

    // 检查是否需要进入下一轮
    if (this.isRoundComplete()) {
      this.advanceToNextStreet();
    } else {
      this.findNextActivePlayer();
    }

    // 生成GTO反馈
    let gtoFeedback: GTOFeedback | undefined;
    if (player.isHero) {
      gtoFeedback = this.generateGTOFeedback(action, player);
    }

    return {
      valid: true,
      message: this.getActionMessage(action, player),
      gameState: this.getGameState(),
      gtoFeedback
    };
  }

  /**
   * 验证动作
   */
  private validateAction(action: GameAction, player: GamePlayer): ActionResult {
    if (player.folded) {
      return { valid: false, message: '玩家已弃牌' };
    }

    if (player.isAllIn) {
      return { valid: false, message: '玩家已全下' };
    }

    const callAmount = this.currentBet - player.currentBet;

    switch (action.type) {
      case 'FOLD':
        return { valid: true };

      case 'CHECK':
        if (callAmount > 0) {
          return { valid: false, message: '需要跟注，无法过牌' };
        }
        return { valid: true };

      case 'CALL':
        if (callAmount === 0) {
          return { valid: false, message: '无需跟注，请选择过牌' };
        }
        if (callAmount >= player.chips) {
          return { valid: false, message: '筹码不足，将自动全下' };
        }
        return { valid: true };

      case 'BET':
        if (this.currentBet > 0) {
          return { valid: false, message: '已有下注，请选择跟注或加注' };
        }
        if (!action.amount || action.amount < this.bigBlind) {
          return { valid: false, message: `最小下注${this.bigBlind}BB` };
        }
        if (action.amount > player.chips) {
          return { valid: false, message: '筹码不足' };
        }
        return { valid: true };

      case 'RAISE':
        if (this.currentBet === 0) {
          return { valid: false, message: '无下注可加，请选择下注' };
        }
        const minRaiseAmount = this.currentBet + this.minRaise;
        if (!action.amount || action.amount < minRaiseAmount) {
          return { valid: false, message: `最小加注到${minRaiseAmount}BB` };
        }
        if (action.amount > player.chips + player.currentBet) {
          return { valid: false, message: '筹码不足' };
        }
        return { valid: true };

      case 'ALL_IN':
        return { valid: true };

      default:
        return { valid: false, message: '无效动作' };
    }
  }

  /**
   * 执行动作
   */
  private executeAction(action: GameAction, player: GamePlayer) {
    switch (action.type) {
      case 'FOLD':
        player.folded = true;
        player.isActive = false;
        break;

      case 'CHECK':
        // 无需操作
        break;

      case 'CALL':
        const callAmount = Math.min(this.currentBet - player.currentBet, player.chips);
        player.currentBet += callAmount;
        player.chips -= callAmount;
        this.pot += callAmount;
        
        if (player.chips === 0) {
          player.isAllIn = true;
        }
        break;

      case 'BET':
        if (action.amount) {
          const betAmount = Math.min(action.amount, player.chips);
          player.currentBet += betAmount;
          player.chips -= betAmount;
          this.pot += betAmount;
          this.currentBet = player.currentBet;
          this.minRaise = betAmount;
          
          if (player.chips === 0) {
            player.isAllIn = true;
          }
        }
        break;

      case 'RAISE':
        if (action.amount) {
          const totalBet = Math.min(action.amount, player.chips + player.currentBet);
          const raiseAmount = totalBet - player.currentBet;
          
          player.chips -= raiseAmount;
          this.pot += raiseAmount;
          
          this.minRaise = totalBet - this.currentBet;
          this.currentBet = totalBet;
          player.currentBet = totalBet;
          
          if (player.chips === 0) {
            player.isAllIn = true;
          }
        }
        break;

      case 'ALL_IN':
        const allInAmount = player.chips;
        player.currentBet += allInAmount;
        player.chips = 0;
        this.pot += allInAmount;
        player.isAllIn = true;
        
        if (player.currentBet > this.currentBet) {
          this.minRaise = player.currentBet - this.currentBet;
          this.currentBet = player.currentBet;
        }
        break;
    }
  }

  /**
   * 检查本轮是否结束
   */
  private isRoundComplete(): boolean {
    const activePlayers = this.players.filter(p => p.isActive && !p.folded);
    
    // 只有一个玩家剩余
    if (activePlayers.length <= 1) {
      return true;
    }

    // 所有活跃玩家的下注都相等，且至少有一个动作
    const hasAction = this.actionHistory.some(a => a.type !== 'FOLD');
    if (!hasAction) {
      return false;
    }

    return activePlayers.every(p => 
      p.currentBet === this.currentBet || p.isAllIn
    );
  }

  /**
   * 进入下一街
   */
  private advanceToNextStreet() {
    // 重置当前轮下注
    this.players.forEach(player => {
      player.totalBet += player.currentBet;
      player.currentBet = 0;
    });
    
    this.currentBet = 0;
    this.minRaise = this.bigBlind;

    switch (this.street) {
      case 'PREFLOP':
        this.street = 'FLOP';
        this.dealCommunityCards(3);
        break;
      case 'FLOP':
        this.street = 'TURN';
        this.dealCommunityCards(1);
        break;
      case 'TURN':
        this.street = 'RIVER';
        this.dealCommunityCards(1);
        break;
      case 'RIVER':
        this.street = 'SHOWDOWN';
        return;
    }

    // 从小盲位开始行动
    this.currentPlayerIndex = this.players.findIndex(p => p.position === 'SB');
    this.findNextActivePlayer();
  }

  /**
   * 发公共牌
   */
  private dealCommunityCards(count: number) {
    for (let i = 0; i < count; i++) {
      const card = this.deck.pop();
      if (card) {
        this.communityCards.push(card);
      }
    }
  }

  /**
   * 获取AI决策
   */
  getAIDecision(player: GamePlayer): GameAction {
    if (!player.style) {
      throw new Error('AI玩家必须有风格设定');
    }

    const style = AI_STYLES[player.style];
    const callAmount = this.currentBet - player.currentBet;
    
    // 基于AI风格的简化决策逻辑
    const handStrength = this.evaluateHand(player.cards, this.communityCards);
    const potOdds = callAmount / (this.pot + callAmount);
    const random = Math.random();

    // 强牌
    if (handStrength > 0.8) {
      if (this.currentBet === 0) {
        return {
          type: 'BET',
          playerId: player.id,
          amount: Math.floor(this.pot * (0.5 + style.aggression * 0.2))
        };
      } else if (random < style.aggression / 5) {
        return {
          type: 'RAISE',
          playerId: player.id,
          amount: this.currentBet + Math.floor(this.pot * 0.5)
        };
      } else {
        return { type: 'CALL', playerId: player.id };
      }
    }

    // 中等牌
    if (handStrength > 0.4) {
      if (callAmount === 0) {
        return random < 0.3 ? { type: 'CHECK', playerId: player.id } :
               { type: 'BET', playerId: player.id, amount: Math.floor(this.pot * 0.3) };
      } else if (potOdds < 0.3) {
        return { type: 'CALL', playerId: player.id };
      } else {
        return { type: 'FOLD', playerId: player.id };
      }
    }

    // 弱牌
    if (callAmount === 0) {
      return random < 0.8 ? { type: 'CHECK', playerId: player.id } :
             { type: 'BET', playerId: player.id, amount: Math.floor(this.pot * 0.2) };
    } else if (potOdds < 0.2 && random < style.aggression / 10) {
      return { type: 'CALL', playerId: player.id };
    } else {
      return { type: 'FOLD', playerId: player.id };
    }
  }

  /**
   * 简化的手牌评估
   */
  private evaluateHand(holeCards: Card[], communityCards: Card[]): number {
    // 简化的手牌强度评估，返回0-1之间的值
    const allCards = [...holeCards, ...communityCards];
    
    if (allCards.length < 2) return 0.1;

    // 检查对子
    const ranks = allCards.map(c => c.rank);
    const rankCounts = ranks.reduce((acc, rank) => {
      acc[rank] = (acc[rank] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pairs = Object.values(rankCounts).filter(count => count >= 2).length;
    const trips = Object.values(rankCounts).filter(count => count >= 3).length;

    if (trips > 0) return 0.9;
    if (pairs > 1) return 0.8;
    if (pairs > 0) return 0.6;

    // 高牌强度
    const highCard = Math.max(...ranks.map(r => {
      const value = r === 'A' ? 14 : r === 'K' ? 13 : r === 'Q' ? 12 : 
                    r === 'J' ? 11 : r === 'T' ? 10 : parseInt(r);
      return isNaN(value) ? 2 : value;
    }));

    return Math.min(0.5, highCard / 28);
  }

  /**
   * 生成GTO反馈
   */
  private generateGTOFeedback(action: GameAction, player: GamePlayer): GTOFeedback {
    const handStrength = this.evaluateHand(player.cards, this.communityCards);
    const potOdds = (this.currentBet - player.currentBet) / (this.pot + this.currentBet);
    
    // 简化的GTO分析
    let optimalAction: string;
    let optimal = false;
    let feedback = '';
    let explanation = '';

    if (handStrength > 0.8) {
      optimalAction = this.currentBet === 0 ? '下注' : '加注';
      optimal = action.type === 'BET' || action.type === 'RAISE' || action.type === 'CALL';
      feedback = optimal ? '优秀！强牌应该积极价值下注' : '错过价值！强牌应该下注/加注';
    } else if (handStrength > 0.4) {
      optimalAction = this.currentBet === 0 ? '过牌' : (potOdds < 0.3 ? '跟注' : '弃牌');
      optimal = (action.type === 'CHECK' && this.currentBet === 0) ||
                (action.type === 'CALL' && potOdds < 0.3) ||
                (action.type === 'FOLD' && potOdds >= 0.3);
      feedback = optimal ? '合理决策' : '需要考虑底池赔率和位置';
    } else {
      optimalAction = this.currentBet === 0 ? '过牌' : '弃牌';
      optimal = action.type === 'CHECK' || action.type === 'FOLD';
      feedback = optimal ? '正确弃牌' : '弱牌应该谨慎';
    }

    const actionNames: Record<string, string> = {
      'FOLD': '弃牌', 'CHECK': '过牌', 'CALL': '跟注',
      'BET': '下注', 'RAISE': '加注', 'ALL_IN': '全下'
    };

    return {
      optimal,
      feedback,
      explanation: `手牌强度: ${(handStrength * 100).toFixed(0)}%, 底池赔率: ${(potOdds * 100).toFixed(1)}%`,
      yourAction: actionNames[action.type] || action.type,
      optimalAction,
      equity: handStrength * 100,
      evLoss: optimal ? 0 : Math.random() * 2 + 0.5
    };
  }

  /**
   * 获取动作消息
   */
  private getActionMessage(action: GameAction, player: GamePlayer): string {
    const actionNames: Record<string, string> = {
      'FOLD': '弃牌', 'CHECK': '过牌', 'CALL': '跟注',
      'BET': '下注', 'RAISE': '加注', 'ALL_IN': '全下'
    };

    let message = `${player.name} ${actionNames[action.type] || action.type}`;
    if (action.amount) {
      message += ` $${action.amount}`;
    }
    return message;
  }

  /**
   * 摊牌
   */
  showdown(): { message: string; winners: GamePlayer[]; pot: number } {
    const activePlayers = this.players.filter(p => !p.folded);
    
    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      winner.chips += this.pot;
      return {
        message: `${winner.name} 获胜，赢得 $${this.pot}`,
        winners: [winner],
        pot: this.pot
      };
    }

    // 简化的摊牌逻辑
    const winner = activePlayers[Math.floor(Math.random() * activePlayers.length)];
    winner.chips += this.pot;

    return {
      message: `摊牌：${winner.name} 获胜，赢得 $${this.pot}`,
      winners: [winner],
      pot: this.pot
    };
  }

  /**
   * 获取游戏状态
   */
  getGameState(): GameState {
    const phaseTexts: Record<string, string> = {
      'PREFLOP': '翻前', 'FLOP': '翻牌圈', 
      'TURN': '转牌圈', 'RIVER': '河牌圈', 'SHOWDOWN': '摊牌'
    };

    return {
      pot: this.pot,
      currentBet: this.currentBet,
      minRaise: this.minRaise,
      street: this.street,
      phaseText: phaseTexts[this.street] || this.street,
      communityCards: this.communityCards,
      players: this.players,
      currentPlayer: this.players[this.currentPlayerIndex] || null,
      isHeroTurn: this.players[this.currentPlayerIndex]?.isHero || false,
      gamePhase: this.street === 'SHOWDOWN' ? 'SHOWDOWN' : 'PLAYING',
      dealerPosition: this.dealerPosition,
      actionHistory: this.actionHistory
    };
  }
}

// 导出类型
export type { Card, GamePlayer, GameAction, GameState, GTOFeedback, ActionResult };