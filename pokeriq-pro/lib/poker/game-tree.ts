/**
 * 德州扑克游戏树结构
 * 用于CFR算法和GTO策略计算
 */

import { ACTIONS, STREETS, POSITIONS } from './constants';
import { HandEvaluator, Card } from './hand-evaluator';

export interface GameState {
  id: string;
  street: string;
  pot: number;
  communityCards: string;
  players: PlayerState[];
  currentPlayer: number;
  lastAction?: Action;
  history: Action[];
  isTerminal: boolean;
  showdownValue?: number;
}

export interface PlayerState {
  id: number;
  position: string;
  stack: number;
  holeCards: string;
  invested: number;
  folded: boolean;
  allIn: boolean;
  range?: HandRange;
}

export interface Action {
  type: string;
  amount?: number;
  player: number;
}

export interface HandRange {
  combos: string[];
  weights: Map<string, number>;
  totalWeight: number;
}

export interface GameNode {
  id: string;
  gameState: GameState;
  children: Map<string, GameNode>;
  parent?: GameNode;
  infoSet: string;
  regretSum: Map<string, number>;
  strategySum: Map<string, number>;
  strategy: Map<string, number>;
  visits: number;
  player: number;
  isChance: boolean;
  isTerminal: boolean;
  expectedValue?: number[];
}

export class GameTree {
  private root: GameNode;
  private nodeCache: Map<string, GameNode>;
  private infoSetCache: Map<string, string>;

  constructor(initialState: GameState) {
    this.nodeCache = new Map();
    this.infoSetCache = new Map();
    this.root = this.createNode(initialState);
  }

  /**
   * 获取根节点
   */
  getRoot(): GameNode {
    return this.root;
  }

  /**
   * 创建游戏节点
   */
  createNode(gameState: GameState, parent?: GameNode): GameNode {
    const nodeId = this.generateNodeId(gameState);
    
    // 检查缓存
    if (this.nodeCache.has(nodeId)) {
      return this.nodeCache.get(nodeId)!;
    }

    const infoSet = this.generateInfoSet(gameState);
    const isChance = this.isChanceNode(gameState);
    const isTerminal = this.isTerminalNode(gameState);

    const node: GameNode = {
      id: nodeId,
      gameState: { ...gameState },
      children: new Map(),
      parent,
      infoSet,
      regretSum: new Map(),
      strategySum: new Map(),
      strategy: new Map(),
      visits: 0,
      player: gameState.currentPlayer,
      isChance,
      isTerminal,
    };

    // 如果是终端节点，计算期望值
    if (isTerminal) {
      node.expectedValue = this.calculateTerminalValue(gameState);
    }

    this.nodeCache.set(nodeId, node);
    return node;
  }

  /**
   * 展开节点的所有可能子节点
   */
  expandNode(node: GameNode): void {
    if (node.isTerminal || node.children.size > 0) {
      return;
    }

    const actions = this.getLegalActions(node.gameState);
    
    for (const action of actions) {
      const childState = this.applyAction(node.gameState, action);
      const childNode = this.createNode(childState, node);
      const actionKey = this.actionToString(action);
      
      node.children.set(actionKey, childNode);
      
      // 初始化策略和后悔值
      if (!node.strategy.has(actionKey)) {
        node.strategy.set(actionKey, 1.0 / actions.length);
        node.regretSum.set(actionKey, 0);
        node.strategySum.set(actionKey, 0);
      }
    }
  }

  /**
   * 获取信息集的平均策略
   */
  getAverageStrategy(infoSet: string): Map<string, number> {
    const nodes = this.getNodesByInfoSet(infoSet);
    const avgStrategy = new Map<string, number>();
    let totalStrategySum = 0;

    // 汇总所有节点的策略
    for (const node of nodes) {
      for (const [action, sum] of node.strategySum) {
        avgStrategy.set(action, (avgStrategy.get(action) || 0) + sum);
        totalStrategySum += sum;
      }
    }

    // 归一化
    if (totalStrategySum > 0) {
      for (const [action, sum] of avgStrategy) {
        avgStrategy.set(action, sum / totalStrategySum);
      }
    } else {
      // 如果没有策略历史，使用均匀分布
      const numActions = avgStrategy.size;
      if (numActions > 0) {
        for (const action of avgStrategy.keys()) {
          avgStrategy.set(action, 1.0 / numActions);
        }
      }
    }

    return avgStrategy;
  }

  /**
   * 生成节点ID
   */
  private generateNodeId(gameState: GameState): string {
    const elements = [
      gameState.street,
      gameState.pot.toString(),
      gameState.communityCards,
      gameState.currentPlayer.toString(),
      gameState.history.map(a => `${a.type}:${a.amount || 0}`).join(','),
      gameState.players.map(p => `${p.invested}:${p.folded ? 1 : 0}`).join('|')
    ];
    
    return elements.join('_');
  }

  /**
   * 生成信息集字符串
   */
  private generateInfoSet(gameState: GameState): string {
    const player = gameState.players[gameState.currentPlayer];
    if (!player) return '';

    const elements = [
      gameState.street,
      player.holeCards,
      gameState.communityCards,
      player.position,
      gameState.pot.toString(),
      this.getActionHistory(gameState),
      this.getRelativePositions(gameState, gameState.currentPlayer)
    ];

    return elements.join('|');
  }

  /**
   * 获取动作历史的抽象表示
   */
  private getActionHistory(gameState: GameState): string {
    const relevantActions = gameState.history
      .filter(action => this.isRelevantAction(action, gameState))
      .map(action => this.abstractAction(action, gameState));
    
    return relevantActions.join(',');
  }

  /**
   * 获取相对位置信息
   */
  private getRelativePositions(gameState: GameState, currentPlayer: number): string {
    const activePlayers = gameState.players
      .filter(p => !p.folded)
      .map(p => p.id);
    
    const currentIndex = activePlayers.indexOf(currentPlayer);
    const relativePositions = activePlayers.map((playerId, index) => {
      const relativePos = (index - currentIndex + activePlayers.length) % activePlayers.length;
      return `${playerId}:${relativePos}`;
    });

    return relativePositions.join(',');
  }

  /**
   * 抽象化动作（用于信息集）
   */
  private abstractAction(action: Action, gameState: GameState): string {
    if (action.type === ACTIONS.BET || action.type === ACTIONS.RAISE) {
      const potSize = gameState.pot;
      const betSize = action.amount || 0;
      const ratio = betSize / potSize;
      
      // 将下注比例抽象化
      if (ratio <= 0.33) return `${action.type}:SMALL`;
      if (ratio <= 0.66) return `${action.type}:MEDIUM`;
      if (ratio <= 1.0) return `${action.type}:POT`;
      return `${action.type}:OVERBET`;
    }
    
    return action.type;
  }

  /**
   * 判断动作是否相关
   */
  private isRelevantAction(action: Action, gameState: GameState): boolean {
    // 只考虑当前街道的动作
    const streetStartIndex = gameState.history.findLastIndex(a => 
      this.isStreetTransition(a));
    
    const actionIndex = gameState.history.indexOf(action);
    return actionIndex >= streetStartIndex;
  }

  /**
   * 判断是否为街道转换
   */
  private isStreetTransition(action: Action): boolean {
    // 简化实现 - 实际中需要更复杂的逻辑
    return false;
  }

  /**
   * 判断是否为机会节点
   */
  private isChanceNode(gameState: GameState): boolean {
    // 发牌节点是机会节点
    return gameState.communityCards.length % 2 === 0 && 
           gameState.communityCards.length < 10; // 最多5张公共牌
  }

  /**
   * 判断是否为终端节点
   */
  private isTerminalNode(gameState: GameState): boolean {
    // 只剩一个未弃牌玩家
    const activePlayers = gameState.players.filter(p => !p.folded);
    if (activePlayers.length <= 1) return true;

    // 到达摊牌阶段
    if (gameState.street === STREETS.SHOWDOWN) return true;

    // 所有玩家全押
    const allInPlayers = gameState.players.filter(p => p.allIn && !p.folded);
    if (allInPlayers.length === activePlayers.length) return true;

    return false;
  }

  /**
   * 计算终端节点的期望值
   */
  private calculateTerminalValue(gameState: GameState): number[] {
    const numPlayers = gameState.players.length;
    const values = new Array(numPlayers).fill(0);

    const activePlayers = gameState.players.filter(p => !p.folded);
    
    if (activePlayers.length === 1) {
      // 只有一个玩家未弃牌，赢得底池
      const winner = activePlayers[0];
      values[winner.id] = gameState.pot - winner.invested;
      
      // 其他玩家损失已投入的筹码
      for (const player of gameState.players) {
        if (player.id !== winner.id) {
          values[player.id] = -player.invested;
        }
      }
    } else {
      // 摊牌 - 计算各玩家的手牌强度
      const handValues = activePlayers.map(player => ({
        playerId: player.id,
        handStrength: HandEvaluator.evaluate(player.holeCards, gameState.communityCards).value
      }));

      handValues.sort((a, b) => b.handStrength - a.handStrength);

      // 计算奖池分配（简化版）
      const winners = handValues.filter(h => h.handStrength === handValues[0].handStrength);
      const winShare = gameState.pot / winners.length;

      for (const winner of winners) {
        values[winner.playerId] = winShare - gameState.players[winner.playerId].invested;
      }

      // 失败者失去投入的筹码
      for (const player of gameState.players) {
        if (!winners.find(w => w.playerId === player.id)) {
          values[player.id] = -player.invested;
        }
      }
    }

    return values;
  }

  /**
   * 获取合法动作
   */
  private getLegalActions(gameState: GameState): Action[] {
    const player = gameState.players[gameState.currentPlayer];
    if (!player || player.folded) return [];

    const actions: Action[] = [];
    const toCall = this.getCallAmount(gameState, gameState.currentPlayer);

    // 弃牌（除非可以免费看牌）
    if (toCall > 0) {
      actions.push({ type: ACTIONS.FOLD, player: gameState.currentPlayer });
    }

    // 过牌/跟注
    if (toCall === 0) {
      actions.push({ type: ACTIONS.CHECK, player: gameState.currentPlayer });
    } else if (player.stack >= toCall) {
      actions.push({ type: ACTIONS.CALL, amount: toCall, player: gameState.currentPlayer });
    }

    // 下注/加注
    const minBet = this.getMinBetAmount(gameState);
    const maxBet = player.stack;

    if (minBet <= maxBet) {
      const betSizes = this.getBetSizes(gameState, minBet, maxBet);
      for (const size of betSizes) {
        if (toCall === 0) {
          actions.push({ type: ACTIONS.BET, amount: size, player: gameState.currentPlayer });
        } else {
          actions.push({ type: ACTIONS.RAISE, amount: size, player: gameState.currentPlayer });
        }
      }
    }

    // 全押
    if (player.stack > 0 && maxBet > minBet) {
      actions.push({ type: ACTIONS.ALL_IN, amount: maxBet, player: gameState.currentPlayer });
    }

    return actions;
  }

  /**
   * 获取跟注金额
   */
  private getCallAmount(gameState: GameState, playerId: number): number {
    const player = gameState.players[playerId];
    const maxInvested = Math.max(...gameState.players.map(p => p.invested));
    return Math.max(0, maxInvested - player.invested);
  }

  /**
   * 获取最小下注金额
   */
  private getMinBetAmount(gameState: GameState): number {
    // 简化实现 - 实际需要考虑大盲注和之前的加注
    return 2; // 假设大盲注为1，最小加注为2
  }

  /**
   * 获取下注尺寸选项
   */
  private getBetSizes(gameState: GameState, minBet: number, maxBet: number): number[] {
    const potSize = gameState.pot;
    const sizes: number[] = [];

    // 标准下注尺寸：1/3底池，1/2底池，2/3底池，底池大小
    const ratios = [0.33, 0.5, 0.67, 1.0];
    
    for (const ratio of ratios) {
      const size = Math.round(potSize * ratio);
      if (size >= minBet && size <= maxBet) {
        sizes.push(size);
      }
    }

    // 确保至少有最小下注选项
    if (sizes.length === 0 && minBet <= maxBet) {
      sizes.push(minBet);
    }

    return sizes;
  }

  /**
   * 应用动作到游戏状态
   */
  private applyAction(gameState: GameState, action: Action): GameState {
    const newState: GameState = {
      ...gameState,
      id: this.generateStateId(),
      players: gameState.players.map(p => ({ ...p })),
      history: [...gameState.history, action],
      lastAction: action,
    };

    const player = newState.players[action.player];

    switch (action.type) {
      case ACTIONS.FOLD:
        player.folded = true;
        break;

      case ACTIONS.CHECK:
        // 无需改变状态
        break;

      case ACTIONS.CALL:
        const callAmount = action.amount || 0;
        player.stack -= callAmount;
        player.invested += callAmount;
        newState.pot += callAmount;
        break;

      case ACTIONS.BET:
      case ACTIONS.RAISE:
        const betAmount = action.amount || 0;
        player.stack -= betAmount;
        player.invested += betAmount;
        newState.pot += betAmount;
        break;

      case ACTIONS.ALL_IN:
        const allInAmount = player.stack;
        player.stack = 0;
        player.invested += allInAmount;
        player.allIn = true;
        newState.pot += allInAmount;
        break;
    }

    // 更新当前玩家
    newState.currentPlayer = this.getNextPlayer(newState);

    // 检查是否需要进入下一街道
    if (this.isActionComplete(newState)) {
      newState.street = this.getNextStreet(newState.street);
      newState.currentPlayer = this.getFirstPlayerForStreet(newState);
    }

    // 更新终端状态
    newState.isTerminal = this.isTerminalNode(newState);

    return newState;
  }

  /**
   * 获取下一个玩家
   */
  private getNextPlayer(gameState: GameState): number {
    const activePlayers = gameState.players
      .map((p, index) => index)
      .filter(id => !gameState.players[id].folded && !gameState.players[id].allIn);

    const currentIndex = activePlayers.indexOf(gameState.currentPlayer);
    const nextIndex = (currentIndex + 1) % activePlayers.length;
    
    return activePlayers[nextIndex];
  }

  /**
   * 检查当前轮的动作是否完成
   */
  private isActionComplete(gameState: GameState): boolean {
    const activePlayers = gameState.players.filter(p => !p.folded && !p.allIn);
    
    if (activePlayers.length <= 1) return true;

    // 检查是否所有玩家的投入相等
    const investments = activePlayers.map(p => p.invested);
    const maxInvestment = Math.max(...investments);
    
    return investments.every(inv => inv === maxInvestment);
  }

  /**
   * 获取下一街道
   */
  private getNextStreet(currentStreet: string): string {
    switch (currentStreet) {
      case STREETS.PREFLOP: return STREETS.FLOP;
      case STREETS.FLOP: return STREETS.TURN;
      case STREETS.TURN: return STREETS.RIVER;
      case STREETS.RIVER: return STREETS.SHOWDOWN;
      default: return STREETS.SHOWDOWN;
    }
  }

  /**
   * 获取街道首个行动玩家
   */
  private getFirstPlayerForStreet(gameState: GameState): number {
    const activePlayers = gameState.players.filter(p => !p.folded && !p.allIn);
    
    // 通常是小盲位开始（简化实现）
    return activePlayers.length > 0 ? activePlayers[0].id : 0;
  }

  /**
   * 动作转字符串
   */
  private actionToString(action: Action): string {
    if (action.amount) {
      return `${action.type}:${action.amount}`;
    }
    return action.type;
  }

  /**
   * 根据信息集获取节点
   */
  private getNodesByInfoSet(infoSet: string): GameNode[] {
    const nodes: GameNode[] = [];
    
    for (const node of this.nodeCache.values()) {
      if (node.infoSet === infoSet) {
        nodes.push(node);
      }
    }
    
    return nodes;
  }

  /**
   * 生成状态ID
   */
  private generateStateId(): string {
    return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}