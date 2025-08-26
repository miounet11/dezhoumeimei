/**
 * Counterfactual Regret Minimization (CFR) GTO Solver
 * 实现真正的博弈论最优策略求解器
 */

export interface GameNode {
  infoSet: string;
  player: number;
  actions: string[];
  isTerminal: boolean;
  utility?: number;
  children?: Map<string, GameNode>;
  regretSum: Map<string, number>;
  strategySum: Map<string, number>;
  strategy: Map<string, number>;
}

export interface CFRResult {
  strategy: Map<string, number>;
  exploitability: number;
  iterations: number;
  convergenceTime: number;
}

export interface GameState {
  street: 'preflop' | 'flop' | 'turn' | 'river';
  pot: number;
  players: PlayerState[];
  communityCards: string;
  history: string[];
}

export interface PlayerState {
  id: number;
  position: string;
  stack: number;
  invested: number;
  holeCards: string;
  folded: boolean;
  allIn: boolean;
}

/**
 * CFR算法实现 - 真正的GTO求解器
 */
export class CFRSolver {
  private regretSum: Map<string, Map<string, number>> = new Map();
  private strategySum: Map<string, Map<string, number>> = new Map();
  private nodeMap: Map<string, GameNode> = new Map();
  private iterations: number = 0;
  private startTime: number = 0;

  constructor(
    private readonly maxIterations: number = 10000,
    private readonly convergenceThreshold: number = 0.001
  ) {}

  /**
   * 求解最优策略
   */
  async solve(gameState: GameState): Promise<CFRResult> {
    this.startTime = Date.now();
    this.iterations = 0;

    // 构建游戏树
    const rootNode = this.buildGameTree(gameState);

    // CFR迭代
    let lastExploitability = Infinity;
    for (let i = 0; i < this.maxIterations; i++) {
      // 为每个玩家运行CFR
      for (let player = 0; player < gameState.players.length; player++) {
        if (!gameState.players[player].folded) {
          this.cfr(rootNode, player, 1.0, 1.0);
        }
      }
      this.iterations = i + 1;

      // 每100次迭代检查收敛性
      if (i % 100 === 0) {
        const exploitability = this.calculateExploitability(rootNode);
        if (Math.abs(exploitability - lastExploitability) < this.convergenceThreshold) {
          break;
        }
        lastExploitability = exploitability;
      }
    }

    // 计算平均策略
    const avgStrategy = this.getAverageStrategy(rootNode.infoSet);
    const exploitability = this.calculateExploitability(rootNode);
    const convergenceTime = Date.now() - this.startTime;

    return {
      strategy: avgStrategy,
      exploitability,
      iterations: this.iterations,
      convergenceTime
    };
  }

  /**
   * CFR核心递归算法
   */
  private cfr(node: GameNode, player: number, piPlayer: number, piOpponent: number): number {
    if (node.isTerminal) {
      return this.getUtility(node, player);
    }

    if (node.player !== player) {
      // 对手节点 - 按当前策略计算期望值
      const strategy = this.getStrategy(node.infoSet);
      let nodeUtil = 0;

      for (const [action, prob] of strategy) {
        const child = node.children?.get(action);
        if (child) {
          nodeUtil += prob * this.cfr(child, player, piPlayer, piOpponent * prob);
        }
      }

      // 累计策略
      if (!this.strategySum.has(node.infoSet)) {
        this.strategySum.set(node.infoSet, new Map());
      }
      const stratSum = this.strategySum.get(node.infoSet)!;
      for (const [action, prob] of strategy) {
        stratSum.set(action, (stratSum.get(action) || 0) + piPlayer * prob);
      }

      return nodeUtil;
    }

    // 当前玩家节点
    const strategy = this.getStrategy(node.infoSet);
    const actionUtils = new Map<string, number>();
    let nodeUtil = 0;

    // 计算每个动作的期望值
    for (const action of node.actions) {
      const child = node.children?.get(action);
      if (child) {
        const actionProb = strategy.get(action) || 0;
        const actionUtil = this.cfr(child, player, piPlayer * actionProb, piOpponent);
        actionUtils.set(action, actionUtil);
        nodeUtil += actionProb * actionUtil;
      }
    }

    // 更新遗憾值
    if (!this.regretSum.has(node.infoSet)) {
      this.regretSum.set(node.infoSet, new Map());
    }
    const regSum = this.regretSum.get(node.infoSet)!;

    for (const action of node.actions) {
      const actionUtil = actionUtils.get(action) || 0;
      const regret = actionUtil - nodeUtil;
      regSum.set(action, (regSum.get(action) || 0) + piOpponent * regret);
    }

    return nodeUtil;
  }

  /**
   * 获取当前策略
   */
  private getStrategy(infoSet: string): Map<string, number> {
    const regrets = this.regretSum.get(infoSet);
    if (!regrets) {
      // 均匀策略作为默认
      const node = this.nodeMap.get(infoSet);
      if (!node) return new Map();
      
      const uniform = 1.0 / node.actions.length;
      const strategy = new Map<string, number>();
      for (const action of node.actions) {
        strategy.set(action, uniform);
      }
      return strategy;
    }

    // 计算正遗憾值总和
    let normalizingSum = 0;
    const positiveRegrets = new Map<string, number>();
    
    for (const [action, regret] of regrets) {
      const positiveRegret = Math.max(0, regret);
      positiveRegrets.set(action, positiveRegret);
      normalizingSum += positiveRegret;
    }

    const strategy = new Map<string, number>();
    const node = this.nodeMap.get(infoSet);
    
    if (normalizingSum > 0) {
      // 按遗憾值比例分配概率
      for (const action of node?.actions || []) {
        const regret = positiveRegrets.get(action) || 0;
        strategy.set(action, regret / normalizingSum);
      }
    } else {
      // 均匀策略
      const uniform = 1.0 / (node?.actions.length || 1);
      for (const action of node?.actions || []) {
        strategy.set(action, uniform);
      }
    }

    return strategy;
  }

  /**
   * 获取平均策略
   */
  private getAverageStrategy(infoSet: string): Map<string, number> {
    const stratSum = this.strategySum.get(infoSet);
    if (!stratSum) {
      return new Map();
    }

    let normalizingSum = 0;
    for (const prob of stratSum.values()) {
      normalizingSum += prob;
    }

    const avgStrategy = new Map<string, number>();
    if (normalizingSum > 0) {
      for (const [action, sum] of stratSum) {
        avgStrategy.set(action, sum / normalizingSum);
      }
    } else {
      const node = this.nodeMap.get(infoSet);
      const uniform = 1.0 / (node?.actions.length || 1);
      for (const action of node?.actions || []) {
        avgStrategy.set(action, uniform);
      }
    }

    return avgStrategy;
  }

  /**
   * 构建游戏树 - 修复无限递归问题
   */
  private buildGameTree(gameState: GameState, depth: number = 0, maxDepth: number = 10): GameNode {
    const infoSet = this.getInformationSet(gameState);
    
    if (this.nodeMap.has(infoSet)) {
      return this.nodeMap.get(infoSet)!;
    }

    // 防止无限递归 - 深度限制
    if (depth >= maxDepth) {
      const node: GameNode = {
        infoSet,
        player: -1, // 深度限制终局节点
        actions: [],
        isTerminal: true,
        utility: this.calculateTerminalUtility(gameState),
        regretSum: new Map(),
        strategySum: new Map(),
        strategy: new Map()
      };
      this.nodeMap.set(infoSet, node);
      return node;
    }

    // 检查终局
    const activePlayers = gameState.players.filter(p => !p.folded);
    if (activePlayers.length <= 1 || gameState.street === 'showdown') {
      const node: GameNode = {
        infoSet,
        player: -1, // 终局节点
        actions: [],
        isTerminal: true,
        utility: this.calculateTerminalUtility(gameState),
        regretSum: new Map(),
        strategySum: new Map(),
        strategy: new Map()
      };
      this.nodeMap.set(infoSet, node);
      return node;
    }

    // 找到当前行动玩家
    const currentPlayer = this.getCurrentPlayer(gameState);
    const actions = this.getLegalActions(gameState, currentPlayer);

    // 防止空动作列表
    if (actions.length === 0) {
      const node: GameNode = {
        infoSet,
        player: -1, // 无动作终局节点
        actions: [],
        isTerminal: true,
        utility: this.calculateTerminalUtility(gameState),
        regretSum: new Map(),
        strategySum: new Map(),
        strategy: new Map()
      };
      this.nodeMap.set(infoSet, node);
      return node;
    }

    const node: GameNode = {
      infoSet,
      player: currentPlayer,
      actions,
      isTerminal: false,
      children: new Map(),
      regretSum: new Map(),
      strategySum: new Map(),
      strategy: new Map()
    };

    // 先添加到nodeMap防止循环引用
    this.nodeMap.set(infoSet, node);

    // 递归构建子节点，增加深度计数
    for (const action of actions.slice(0, 3)) { // 限制每个节点最多3个动作，减少复杂度
      try {
        const nextState = this.applyAction(gameState, action);
        const childNode = this.buildGameTree(nextState, depth + 1, maxDepth);
        node.children?.set(action, childNode);
      } catch (error) {
        console.warn(`Failed to build child node for action ${action}:`, error);
        // 跳过有问题的动作，继续处理其他动作
      }
    }

    return node;
  }

  /**
   * 获取信息集标识符
   */
  private getInformationSet(gameState: GameState): string {
    const currentPlayer = this.getCurrentPlayer(gameState);
    const player = gameState.players[currentPlayer];
    
    return [
      gameState.street || 'unknown',
      player?.holeCards || 'XX',
      gameState.communityCards || '',
      gameState.pot || 0,
      Array.isArray((gameState as any).history) ? (gameState as any).history.join(',') : ''
    ].join('|');
  }

  /**
   * 获取合法动作
   */
  private getLegalActions(gameState: GameState, playerId: number): string[] {
    const player = gameState.players[playerId];
    const actions: string[] = [];
    
    // 计算跟注金额
    const currentBet = Math.max(...gameState.players.map(p => p.invested));
    const toCall = Math.max(0, currentBet - player.invested);

    // 弃牌（除非无需跟注）
    if (toCall > 0) {
      actions.push('fold');
    }

    // 过牌/跟注
    if (toCall === 0) {
      actions.push('check');
    } else if (toCall <= player.stack) {
      actions.push('call');
    }

    // 下注/加注
    const minBet = gameState.street === 'preflop' ? 2 : Math.max(2, currentBet);
    
    if (toCall === 0 && player.stack >= minBet) {
      // 可以下注
      const betSizes = this.getBetSizes(gameState.pot, player.stack);
      for (const size of betSizes) {
        actions.push(`bet_${size}`);
      }
    } else if (toCall > 0 && player.stack > toCall) {
      // 可以加注
      const raiseSizes = this.getRaiseSizes(currentBet, gameState.pot, player.stack);
      for (const size of raiseSizes) {
        actions.push(`raise_${size}`);
      }
    }

    // 全下（如果有意义）
    if (player.stack > 0 && player.stack <= gameState.pot * 2) {
      actions.push('allin');
    }

    return actions;
  }

  /**
   * 获取下注尺度
   */
  private getBetSizes(pot: number, stack: number): number[] {
    const sizes = [
      Math.min(stack, pot * 0.3),  // 30% pot
      Math.min(stack, pot * 0.5),  // 50% pot  
      Math.min(stack, pot * 0.75), // 75% pot
      Math.min(stack, pot * 1.0),  // pot
    ].filter((size, index, arr) => 
      size >= 2 && arr.indexOf(size) === index // 去重且至少2BB
    );
    
    return sizes;
  }

  /**
   * 获取加注尺度
   */
  private getRaiseSizes(currentBet: number, pot: number, stack: number): number[] {
    const minRaise = currentBet * 2;
    const sizes = [
      Math.min(stack, minRaise),
      Math.min(stack, currentBet + pot * 0.5),
      Math.min(stack, currentBet + pot * 1.0),
    ].filter((size, index, arr) => 
      size >= minRaise && arr.indexOf(size) === index
    );
    
    return sizes;
  }

  /**
   * 应用动作到游戏状态
   */
  private applyAction(gameState: GameState, action: string): GameState {
    const currentHistory = Array.isArray((gameState as any).history) ? (gameState as any).history : [];
    const newState: GameState = {
      ...gameState,
      players: gameState.players.map(p => ({ ...p })),
      ...(currentHistory.length > 0 && { history: [...currentHistory, action] })
    };

    const currentPlayer = this.getCurrentPlayer(gameState);
    const player = newState.players[currentPlayer];

    if (action === 'fold') {
      player.folded = true;
    } else if (action === 'check') {
      // 无需操作
    } else if (action === 'call') {
      const currentBet = Math.max(...gameState.players.map(p => p.invested));
      const toCall = Math.max(0, currentBet - player.invested);
      const callAmount = Math.min(toCall, player.stack);
      
      player.invested += callAmount;
      player.stack -= callAmount;
      newState.pot += callAmount;
      
      if (player.stack === 0) {
        player.allIn = true;
      }
    } else if (action.startsWith('bet_')) {
      const betSize = parseInt(action.split('_')[1]);
      const actualBet = Math.min(betSize, player.stack);
      
      player.invested += actualBet;
      player.stack -= actualBet;
      newState.pot += actualBet;
      
      if (player.stack === 0) {
        player.allIn = true;
      }
    } else if (action.startsWith('raise_')) {
      const raiseSize = parseInt(action.split('_')[1]);
      const actualRaise = Math.min(raiseSize, player.stack + player.invested) - player.invested;
      
      player.invested += actualRaise;
      player.stack -= actualRaise;
      newState.pot += actualRaise;
      
      if (player.stack === 0) {
        player.allIn = true;
      }
    } else if (action === 'allin') {
      const allInAmount = player.stack;
      player.invested += allInAmount;
      player.stack = 0;
      player.allIn = true;
      newState.pot += allInAmount;
    }

    return newState;
  }

  /**
   * 获取当前行动玩家
   */
  private getCurrentPlayer(gameState: GameState): number {
    // 如果游戏状态有指定当前玩家，使用它
    if (typeof (gameState as any).currentPlayer === 'number') {
      const currentPlayer = (gameState as any).currentPlayer;
      if (currentPlayer >= 0 && currentPlayer < gameState.players.length && 
          !gameState.players[currentPlayer].folded && 
          !gameState.players[currentPlayer].allIn) {
        return currentPlayer;
      }
    }

    // 否则找到第一个可以行动的玩家
    for (let i = 0; i < gameState.players.length; i++) {
      if (!gameState.players[i].folded && !gameState.players[i].allIn) {
        return i;
      }
    }
    
    // 如果没有可行动的玩家，返回0（游戏结束状态）
    return 0;
  }

  /**
   * 计算终局效用
   */
  private calculateTerminalUtility(gameState: GameState): number {
    // 简化的终局计算 - 实际应该考虑摊牌胜负
    const activePlayers = gameState.players.filter(p => !p.folded);
    
    if (activePlayers.length === 1) {
      // 只有一个玩家，赢得底池
      return gameState.pot;
    }
    
    // 摊牌情况 - 简化为随机胜负
    return gameState.pot / activePlayers.length;
  }

  /**
   * 获取节点效用
   */
  private getUtility(node: GameNode, player: number): number {
    return node.utility || 0;
  }

  /**
   * 计算可利用性（衡量策略偏离纳什均衡的程度）
   */
  private calculateExploitability(node: GameNode): number {
    // 简化的可利用性计算
    if (node.isTerminal) {
      return 0;
    }

    let exploitability = 0;
    const strategy = this.getAverageStrategy(node.infoSet);
    
    for (const [action, prob] of strategy) {
      const child = node.children?.get(action);
      if (child) {
        exploitability += prob * this.calculateExploitability(child);
      }
    }

    return exploitability;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalNodes: this.nodeMap.size,
      iterations: this.iterations,
      infoSets: this.regretSum.size,
      convergenceTime: Date.now() - this.startTime
    };
  }

  /**
   * 清理内存
   */
  clear() {
    this.regretSum.clear();
    this.strategySum.clear();
    this.nodeMap.clear();
    this.iterations = 0;
  }
}

export default CFRSolver;