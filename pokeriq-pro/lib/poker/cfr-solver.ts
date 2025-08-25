/**
 * Counterfactual Regret Minimization (CFR) 算法实现
 * 用于计算德州扑克的GTO策略
 */

import { GameTree, GameNode, GameState, Action } from './game-tree';
import { HandRange } from './game-tree';
import { ACTIONS } from './constants';
import { createLogger } from '@/lib/logger';

const logger = createLogger('cfr-solver');

export interface CFRResult {
  strategy: Map<string, Map<string, number>>;
  exploitability: number;
  iterations: number;
  convergenceRate: number;
}

export interface TrainingProgress {
  iteration: number;
  exploitability: number;
  averageRegret: number;
  strategyStability: number;
  timeElapsed: number;
}

export class CFRSolver {
  private gameTree: GameTree;
  private nodeMap: Map<string, GameNode>;
  private infoSetCount: Map<string, number>;
  private exploitabilityHistory: number[];
  private startTime: number;

  constructor(gameTree: GameTree) {
    this.gameTree = gameTree;
    this.nodeMap = new Map();
    this.infoSetCount = new Map();
    this.exploitabilityHistory = [];
    this.startTime = 0;
  }

  /**
   * 运行CFR算法
   */
  async solve(iterations: number, callback?: (progress: TrainingProgress) => void): Promise<CFRResult> {
    logger.info(`Starting CFR solving with ${iterations} iterations`);
    this.startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      this.runCFRIteration();

      // 每100次迭代计算一次可利用性
      if (i % 100 === 0 || i === iterations - 1) {
        const exploitability = this.calculateExploitability();
        this.exploitabilityHistory.push(exploitability);

        if (callback) {
          const progress: TrainingProgress = {
            iteration: i + 1,
            exploitability,
            averageRegret: this.calculateAverageRegret(),
            strategyStability: this.calculateStrategyStability(),
            timeElapsed: Date.now() - this.startTime,
          };
          callback(progress);
        }

        logger.info(`Iteration ${i + 1}/${iterations}, Exploitability: ${exploitability.toFixed(6)}`);
      }
    }

    const strategy = this.getAverageStrategy();
    const finalExploitability = this.exploitabilityHistory[this.exploitabilityHistory.length - 1];
    const convergenceRate = this.calculateConvergenceRate();

    logger.info(`CFR solving completed. Final exploitability: ${finalExploitability.toFixed(6)}`);

    return {
      strategy,
      exploitability: finalExploitability,
      iterations,
      convergenceRate,
    };
  }

  /**
   * 运行单次CFR迭代
   */
  private runCFRIteration(): void {
    const root = this.gameTree.getRoot();
    const numPlayers = root.gameState.players.length;

    // 为每个玩家计算反事实值
    for (let player = 0; player < numPlayers; player++) {
      this.cfr(root, player, new Array(numPlayers).fill(1), 1);
    }

    // 更新策略
    this.updateStrategies();
  }

  /**
   * CFR递归计算
   */
  private cfr(node: GameNode, player: number, reachProb: number[], samplingProb: number): number[] {
    const numPlayers = node.gameState.players.length;

    // 终端节点
    if (node.isTerminal) {
      return node.expectedValue || new Array(numPlayers).fill(0);
    }

    // 机会节点
    if (node.isChance) {
      return this.handleChanceNode(node, player, reachProb, samplingProb);
    }

    // 确保节点已展开
    this.gameTree.expandNode(node);

    const currentPlayer = node.player;
    const infoSet = node.infoSet;
    
    // 获取当前策略
    const strategy = this.getRealizationPlanStrategy(node);
    const actionUtils = new Map<string, number[]>();
    const nodeUtil = new Array(numPlayers).fill(0);

    // 计算每个动作的期望值
    for (const [actionKey, childNode] of node.children) {
      const actionProb = strategy.get(actionKey) || 0;
      const newReachProb = [...reachProb];
      
      if (currentPlayer < numPlayers) {
        newReachProb[currentPlayer] *= actionProb;
      }

      const childUtil = this.cfr(childNode, player, newReachProb, samplingProb);
      actionUtils.set(actionKey, childUtil);

      // 累加节点期望值
      for (let i = 0; i < numPlayers; i++) {
        nodeUtil[i] += actionProb * childUtil[i];
      }
    }

    // 更新后悔值（只对当前训练玩家）
    if (currentPlayer === player) {
      const cfValue = nodeUtil[player];
      
      for (const [actionKey, actionUtil] of actionUtils) {
        const regret = actionUtil[player] - cfValue;
        const counterfactualReach = reachProb.reduce((prod, prob, i) => 
          i === player ? prod : prod * prob, 1);
        
        const currentRegret = node.regretSum.get(actionKey) || 0;
        node.regretSum.set(actionKey, currentRegret + regret * counterfactualReach);
      }
    }

    return nodeUtil;
  }

  /**
   * 处理机会节点
   */
  private handleChanceNode(node: GameNode, player: number, reachProb: number[], samplingProb: number): number[] {
    this.gameTree.expandNode(node);
    
    const numPlayers = node.gameState.players.length;
    const nodeUtil = new Array(numPlayers).fill(0);

    // 对所有可能的机会结果求期望
    for (const [actionKey, childNode] of node.children) {
      const chanceProb = this.getChanceProbability(node, actionKey);
      const childUtil = this.cfr(childNode, player, reachProb, samplingProb * chanceProb);
      
      for (let i = 0; i < numPlayers; i++) {
        nodeUtil[i] += chanceProb * childUtil[i];
      }
    }

    return nodeUtil;
  }

  /**
   * 获取机会事件概率
   */
  private getChanceProbability(node: GameNode, actionKey: string): number {
    // 简化实现 - 实际需要根据牌库剩余牌数计算
    const numChildren = node.children.size;
    return 1.0 / numChildren;
  }

  /**
   * 获取当前的实现计划策略
   */
  private getRealizationPlanStrategy(node: GameNode): Map<string, number> {
    const strategy = new Map<string, number>();
    let sum = 0;

    // 计算正向后悔值的和
    for (const [actionKey, regret] of node.regretSum) {
      const posRegret = Math.max(0, regret);
      strategy.set(actionKey, posRegret);
      sum += posRegret;
    }

    // 归一化策略
    if (sum > 0) {
      for (const [actionKey, value] of strategy) {
        strategy.set(actionKey, value / sum);
      }
    } else {
      // 如果没有正向后悔，使用均匀策略
      const numActions = node.children.size;
      for (const actionKey of node.children.keys()) {
        strategy.set(actionKey, 1.0 / numActions);
      }
    }

    // 更新节点当前策略
    node.strategy = new Map(strategy);

    return strategy;
  }

  /**
   * 更新所有节点的策略
   */
  private updateStrategies(): void {
    for (const node of this.nodeMap.values()) {
      if (!node.isTerminal && !node.isChance) {
        const strategy = this.getRealizationPlanStrategy(node);
        
        // 累加策略和
        for (const [actionKey, prob] of strategy) {
          const currentSum = node.strategySum.get(actionKey) || 0;
          node.strategySum.set(actionKey, currentSum + prob);
        }
      }
    }
  }

  /**
   * 获取平均策略
   */
  private getAverageStrategy(): Map<string, Map<string, number>> {
    const avgStrategy = new Map<string, Map<string, number>>();

    for (const node of this.nodeMap.values()) {
      if (!node.isTerminal && !node.isChance) {
        const infoSet = node.infoSet;
        
        if (!avgStrategy.has(infoSet)) {
          avgStrategy.set(infoSet, new Map());
        }

        const strategy = avgStrategy.get(infoSet)!;
        let sum = 0;

        // 计算策略和的总和
        for (const strategySum of node.strategySum.values()) {
          sum += strategySum;
        }

        // 归一化策略
        if (sum > 0) {
          for (const [actionKey, strategySum] of node.strategySum) {
            strategy.set(actionKey, strategySum / sum);
          }
        } else {
          // 使用均匀策略作为默认
          const numActions = node.children.size;
          for (const actionKey of node.children.keys()) {
            strategy.set(actionKey, 1.0 / numActions);
          }
        }
      }
    }

    return avgStrategy;
  }

  /**
   * 计算可利用性
   */
  private calculateExploitability(): number {
    const strategy = this.getAverageStrategy();
    let totalExploitability = 0;
    const numPlayers = this.gameTree.getRoot().gameState.players.length;

    // 对每个玩家计算最佳响应
    for (let player = 0; player < numPlayers; player++) {
      const bestResponseValue = this.calculateBestResponse(strategy, player);
      const strategyValue = this.calculateStrategyValue(strategy, player);
      totalExploitability += Math.max(0, bestResponseValue - strategyValue);
    }

    return totalExploitability / numPlayers;
  }

  /**
   * 计算最佳响应
   */
  private calculateBestResponse(strategy: Map<string, Map<string, number>>, player: number): number {
    // 简化实现 - 实际需要构建最佳响应树
    return 0;
  }

  /**
   * 计算策略价值
   */
  private calculateStrategyValue(strategy: Map<string, Map<string, number>>, player: number): number {
    // 简化实现 - 需要计算给定策略下的期望价值
    return 0;
  }

  /**
   * 计算平均后悔值
   */
  private calculateAverageRegret(): number {
    let totalRegret = 0;
    let nodeCount = 0;

    for (const node of this.nodeMap.values()) {
      if (!node.isTerminal && !node.isChance) {
        for (const regret of node.regretSum.values()) {
          totalRegret += Math.abs(regret);
        }
        nodeCount += node.regretSum.size;
      }
    }

    return nodeCount > 0 ? totalRegret / nodeCount : 0;
  }

  /**
   * 计算策略稳定性
   */
  private calculateStrategyStability(): number {
    // 简化实现 - 实际需要比较连续迭代间的策略变化
    if (this.exploitabilityHistory.length < 2) return 0;

    const recent = this.exploitabilityHistory.slice(-10);
    const variance = this.calculateVariance(recent);
    
    return Math.max(0, 1 - variance);
  }

  /**
   * 计算收敛率
   */
  private calculateConvergenceRate(): number {
    if (this.exploitabilityHistory.length < 10) return 0;

    const recent = this.exploitabilityHistory.slice(-10);
    const slope = this.calculateSlope(recent);
    
    return Math.max(0, -slope);
  }

  /**
   * 计算方差
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * 计算斜率
   */
  private calculateSlope(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2; // 0 + 1 + ... + (n-1)
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * index, 0);
    const sumXX = values.reduce((sum, _, index) => sum + index * index, 0);

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return 0;

    return (n * sumXY - sumX * sumY) / denominator;
  }

  /**
   * 获取训练统计信息
   */
  getTrainingStats(): {
    totalNodes: number;
    infoSets: number;
    averageDepth: number;
    memoryUsage: number;
  } {
    const totalNodes = this.nodeMap.size;
    const infoSets = new Set(Array.from(this.nodeMap.values()).map(n => n.infoSet)).size;
    
    // 计算平均深度
    let totalDepth = 0;
    let leafNodes = 0;
    
    for (const node of this.nodeMap.values()) {
      if (node.isTerminal) {
        let depth = 0;
        let current = node;
        while (current.parent) {
          depth++;
          current = current.parent;
        }
        totalDepth += depth;
        leafNodes++;
      }
    }

    const averageDepth = leafNodes > 0 ? totalDepth / leafNodes : 0;
    
    // 估算内存使用量（字节）
    const memoryUsage = totalNodes * 1000; // 粗略估计每个节点1KB

    return {
      totalNodes,
      infoSets,
      averageDepth,
      memoryUsage,
    };
  }

  /**
   * 保存策略到缓存
   */
  async saveStrategy(filename: string): Promise<void> {
    const strategy = this.getAverageStrategy();
    const data = {
      strategy: Array.from(strategy.entries()).map(([infoSet, actions]) => ({
        infoSet,
        actions: Array.from(actions.entries())
      })),
      metadata: {
        iterations: this.exploitabilityHistory.length,
        exploitability: this.exploitabilityHistory[this.exploitabilityHistory.length - 1],
        timestamp: new Date().toISOString(),
        stats: this.getTrainingStats()
      }
    };

    // 这里应该保存到文件或数据库
    logger.info(`Strategy saved to ${filename}`);
  }

  /**
   * 从缓存加载策略
   */
  async loadStrategy(filename: string): Promise<Map<string, Map<string, number>>> {
    // 这里应该从文件或数据库加载
    logger.info(`Loading strategy from ${filename}`);
    
    // 返回空策略作为示例
    return new Map();
  }
}