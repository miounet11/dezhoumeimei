/**
 * GTO策略缓存系统
 * 用于存储和快速检索预计算的GTO策略
 */

import { createLogger } from '@/lib/logger';
import { HandEvaluator } from './hand-evaluator';
import { STREETS, POSITIONS, ACTIONS } from './constants';

const logger = createLogger('strategy-cache');

export interface StrategyEntry {
  infoSet: string;
  strategy: Map<string, number>;
  metadata: {
    exploitability: number;
    iterations: number;
    timestamp: number;
    usage: number;
    lastAccessed: number;
  };
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  memoryUsage: number;
  averageExploitability: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface CacheConfig {
  maxSize: number;
  maxAge: number; // milliseconds
  compressionEnabled: boolean;
  persistToDisk: boolean;
  autoPrecompute: boolean;
}

export class StrategyCache {
  private cache: Map<string, StrategyEntry>;
  private config: CacheConfig;
  private hits: number;
  private misses: number;
  private precomputeQueue: Set<string>;
  private isPrecomputing: boolean;

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map();
    this.config = {
      maxSize: 100000,
      maxAge: 24 * 60 * 60 * 1000, // 24小时
      compressionEnabled: true,
      persistToDisk: true,
      autoPrecompute: true,
      ...config
    };
    
    this.hits = 0;
    this.misses = 0;
    this.precomputeQueue = new Set();
    this.isPrecomputing = false;

    logger.info('Strategy cache initialized', { config: this.config });
  }

  /**
   * 获取策略
   */
  async getStrategy(infoSet: string): Promise<Map<string, number> | null> {
    const entry = this.cache.get(infoSet);
    
    if (entry) {
      // 检查是否过期
      if (this.isExpired(entry)) {
        this.cache.delete(infoSet);
        this.misses++;
        return null;
      }

      // 更新访问统计
      entry.metadata.usage++;
      entry.metadata.lastAccessed = Date.now();
      this.hits++;

      return entry.strategy;
    }

    this.misses++;
    
    // 如果启用自动预计算，添加到队列
    if (this.config.autoPrecompute && !this.precomputeQueue.has(infoSet)) {
      this.precomputeQueue.add(infoSet);
      this.schedulePrecompute();
    }

    return null;
  }

  /**
   * 存储策略
   */
  async setStrategy(
    infoSet: string, 
    strategy: Map<string, number>, 
    metadata: Partial<StrategyEntry['metadata']> = {}
  ): Promise<void> {
    // 检查缓存大小限制
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: StrategyEntry = {
      infoSet,
      strategy: new Map(strategy),
      metadata: {
        exploitability: 0,
        iterations: 0,
        timestamp: Date.now(),
        usage: 0,
        lastAccessed: Date.now(),
        ...metadata
      }
    };

    this.cache.set(infoSet, entry);
    
    // 如果启用持久化，保存到磁盘
    if (this.config.persistToDisk) {
      await this.persistEntry(entry);
    }

    logger.debug(`Strategy cached for infoSet: ${infoSet}`);
  }

  /**
   * 批量预计算常见场景的策略
   */
  async precomputeCommonScenarios(): Promise<void> {
    logger.info('Starting precomputation of common scenarios');
    
    const scenarios = this.generateCommonScenarios();
    let completed = 0;

    for (const infoSet of scenarios) {
      if (!this.cache.has(infoSet)) {
        await this.precomputeStrategy(infoSet);
        completed++;

        if (completed % 100 === 0) {
          logger.info(`Precomputed ${completed}/${scenarios.length} scenarios`);
        }
      }
    }

    logger.info(`Precomputation completed: ${completed} new strategies cached`);
  }

  /**
   * 生成常见场景的信息集
   */
  private generateCommonScenarios(): string[] {
    const scenarios: string[] = [];

    // 常见起手牌
    const commonHands = [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s',
      'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 
      'KQs', 'KJs', 'KTs', 'K9s', 'KQo', 'KJo', 'KTo',
      'QJs', 'QTs', 'Q9s', 'QJo', 'QTo',
      'JTs', 'J9s', 'JTo', 'T9s', 'T8s', '98s', '87s', '76s'
    ];

    // 常见位置
    const positions = [POSITIONS.UTG, POSITIONS.MP, POSITIONS.CO, POSITIONS.BTN, POSITIONS.SB, POSITIONS.BB];

    // 常见翻牌纹理
    const flopTextures = [
      'AK7', 'QJ5', 'T98', '742', 'A52', 'KQT', 'J87', '965',
      'AKQ', 'KKT', 'AAQ', 'QQJ', 'JJT', '999', '888', '777'
    ];

    // 组合生成信息集
    for (const hand of commonHands) {
      for (const position of positions) {
        // 翻前场景
        const preflopInfoSet = this.buildInfoSet(STREETS.PREFLOP, hand, '', position, 3, 'CHECK');
        scenarios.push(preflopInfoSet);

        // 翻牌场景
        for (const flop of flopTextures.slice(0, 10)) { // 限制数量
          const flopInfoSet = this.buildInfoSet(STREETS.FLOP, hand, flop, position, 8, 'BET:6');
          scenarios.push(flopInfoSet);
        }
      }
    }

    return scenarios;
  }

  /**
   * 构建信息集字符串
   */
  private buildInfoSet(
    street: string,
    holeCards: string,
    communityCards: string,
    position: string,
    pot: number,
    lastAction: string
  ): string {
    return [street, holeCards, communityCards, position, pot.toString(), lastAction].join('|');
  }

  /**
   * 预计算单个策略
   */
  private async precomputeStrategy(infoSet: string): Promise<void> {
    // 这里应该调用CFR求解器来计算策略
    // 简化实现 - 返回随机策略
    const actions = [ACTIONS.FOLD, ACTIONS.CALL, ACTIONS.BET];
    const strategy = new Map<string, number>();
    
    let total = 0;
    for (const action of actions) {
      const prob = Math.random();
      strategy.set(action, prob);
      total += prob;
    }

    // 归一化
    for (const [action, prob] of strategy) {
      strategy.set(action, prob / total);
    }

    await this.setStrategy(infoSet, strategy, {
      exploitability: Math.random() * 0.01, // 随机可利用性
      iterations: 1000,
    });
  }

  /**
   * 调度预计算任务
   */
  private schedulePrecompute(): void {
    if (this.isPrecomputing || this.precomputeQueue.size === 0) {
      return;
    }

    this.isPrecomputing = true;

    // 使用setTimeout避免阻塞主线程
    setTimeout(async () => {
      try {
        const infoSet = this.precomputeQueue.values().next().value;
        if (infoSet) {
          this.precomputeQueue.delete(infoSet);
          await this.precomputeStrategy(infoSet);
        }
      } catch (error) {
        logger.error('Error during precompute:', error);
      } finally {
        this.isPrecomputing = false;
        
        // 继续处理队列
        if (this.precomputeQueue.size > 0) {
          this.schedulePrecompute();
        }
      }
    }, 10);
  }

  /**
   * 检查条目是否过期
   */
  private isExpired(entry: StrategyEntry): boolean {
    const age = Date.now() - entry.metadata.timestamp;
    return age > this.config.maxAge;
  }

  /**
   * LRU淘汰策略
   */
  private evictLRU(): void {
    let oldestEntry: StrategyEntry | null = null;
    let oldestKey = '';

    for (const [key, entry] of this.cache) {
      if (!oldestEntry || entry.metadata.lastAccessed < oldestEntry.metadata.lastAccessed) {
        oldestEntry = entry;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug(`Evicted LRU entry: ${oldestKey}`);
    }
  }

  /**
   * 持久化条目到磁盘
   */
  private async persistEntry(entry: StrategyEntry): Promise<void> {
    // 实际实现应该保存到文件系统或数据库
    // 这里只是日志记录
    logger.debug(`Persisting entry: ${entry.infoSet}`);
  }

  /**
   * 从磁盘加载缓存
   */
  async loadFromDisk(): Promise<void> {
    // 实际实现应该从文件系统或数据库加载
    logger.info('Loading cache from disk (not implemented)');
  }

  /**
   * 保存缓存到磁盘
   */
  async saveToDisk(): Promise<void> {
    // 实际实现应该保存到文件系统或数据库
    logger.info('Saving cache to disk (not implemented)');
  }

  /**
   * 清理过期条目
   */
  cleanup(): void {
    let cleaned = 0;
    
    for (const [key, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;
    
    const exploitabilities = entries
      .map(e => e.metadata.exploitability)
      .filter(e => e > 0);
    
    const averageExploitability = exploitabilities.length > 0 
      ? exploitabilities.reduce((sum, e) => sum + e, 0) / exploitabilities.length
      : 0;

    const timestamps = entries.map(e => e.metadata.timestamp);
    const oldestEntry = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const newestEntry = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    return {
      totalEntries: this.cache.size,
      hitRate,
      memoryUsage: this.estimateMemoryUsage(),
      averageExploitability,
      oldestEntry,
      newestEntry,
    };
  }

  /**
   * 估算内存使用量
   */
  private estimateMemoryUsage(): number {
    // 粗略估计每个条目的内存使用量
    const avgEntrySize = 1000; // 约1KB每个条目
    return this.cache.size * avgEntrySize;
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    logger.info('Cache statistics reset');
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.precomputeQueue.clear();
    this.resetStats();
    logger.info('Cache cleared');
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 检查是否包含特定信息集
   */
  has(infoSet: string): boolean {
    return this.cache.has(infoSet);
  }

  /**
   * 删除特定条目
   */
  delete(infoSet: string): boolean {
    return this.cache.delete(infoSet);
  }

  /**
   * 获取所有信息集
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 导出缓存数据
   */
  export(): any {
    return {
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        strategy: Array.from(entry.strategy.entries()),
        metadata: entry.metadata
      })),
      config: this.config,
      stats: this.getStats()
    };
  }

  /**
   * 导入缓存数据
   */
  import(data: any): void {
    this.clear();
    
    if (data.entries) {
      for (const item of data.entries) {
        const strategy = new Map(item.strategy);
        const entry: StrategyEntry = {
          infoSet: item.key,
          strategy,
          metadata: item.metadata
        };
        this.cache.set(item.key, entry);
      }
    }

    logger.info(`Imported ${this.cache.size} cache entries`);
  }
}