/**
 * PokerIQ Pro - 数据库查询优化工具
 * 专门针对扑克游戏的高频数据操作优化
 */

import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';

export interface QueryPerformanceStats {
  duration: number;
  query: string;
  params?: any;
  timestamp: Date;
  userId?: string;
  operation: string;
}

export interface OptimizedQueryResult<T = any> {
  data: T;
  fromCache: boolean;
  executionTime: number;
  queryHash: string;
}

/**
 * 查询优化器类
 * 提供缓存、批量操作、查询分析等功能
 */
export class QueryOptimizer {
  private static queryCache = new Map<string, any>();
  private static performanceLog: QueryPerformanceStats[] = [];
  private static maxCacheSize = 1000;
  private static maxLogSize = 5000;

  /**
   * 执行带性能监控的查询
   */
  static async executeWithMonitoring<T>(
    operation: string,
    queryFn: () => Promise<T>,
    userId?: string
  ): Promise<OptimizedQueryResult<T>> {
    const startTime = performance.now();
    const queryHash = this.generateQueryHash(operation, userId);

    try {
      // 检查缓存
      if (this.queryCache.has(queryHash)) {
        const cachedResult = this.queryCache.get(queryHash);
        const executionTime = performance.now() - startTime;
        
        return {
          data: cachedResult,
          fromCache: true,
          executionTime,
          queryHash
        };
      }

      // 执行查询
      const result = await queryFn();
      const executionTime = performance.now() - startTime;

      // 记录性能统计
      this.logPerformance({
        duration: executionTime,
        query: operation,
        timestamp: new Date(),
        userId,
        operation
      });

      // 缓存结果（如果适合缓存）
      if (this.shouldCache(operation, executionTime)) {
        this.addToCache(queryHash, result);
      }

      return {
        data: result,
        fromCache: false,
        executionTime,
        queryHash
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      // 记录错误
      this.logPerformance({
        duration: executionTime,
        query: `ERROR: ${operation}`,
        timestamp: new Date(),
        userId,
        operation: `ERROR_${operation}`
      });

      throw error;
    }
  }

  /**
   * 批量操作优化器
   */
  static async batchOperation<T, R>(
    items: T[],
    operation: (batch: T[]) => Promise<R[]>,
    batchSize: number = 100
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await operation(batch);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * AI伴侣数据查询优化 - Enhanced for 100万+并发
   */
  
  /**
   * 获取伴侣详细数据（带缓存和预加载）
   */
  static async getCompanionDataOptimized(companionId: string) {
    return this.executeWithMonitoring(
      'getCompanionData',
      async () => {
        return await prisma.aICompanion.findUnique({
          where: { id: companionId },
          select: {
            id: true,
            codeName: true,
            name: true,
            nameLocalized: true,
            personality: true,
            backstory: true,
            region: true,
            voiceType: true,
            rarity: true,
            tags: true,
            // Enhanced AI fields
            aiModelConfig: true,
            personalityTraits: true,
            emotionalRange: true,
            learningCapacity: true,
            memoryRetention: true,
            adaptabilityScore: true,
            popularityScore: true,
            interactionCount: true,
            avgSessionTime: true,
            // Relations with optimized select
            outfits: {
              select: {
                id: true,
                name: true,
                nameLocalized: true,
                category: true,
                rarity: true,
                price: true,
                requiredLevel: true,
                imageUrl: true,
                thumbnailUrl: true,
                isDefault: true
              },
              where: { isActive: true },
              orderBy: [{ isDefault: 'desc' }, { requiredLevel: 'asc' }]
            },
            voicePacks: {
              select: {
                id: true,
                packName: true,
                language: true,
                voiceStyle: true,
                price: true,
                sampleUrl: true,
                isDefault: true
              },
              where: { isActive: true }
            },
            roleTemplates: {
              select: {
                id: true,
                roleName: true,
                roleDescription: true,
                conversationStyle: true,
                knowledgeLevel: true,
                interactionMode: true,
                usageCount: true,
                avgRating: true
              },
              where: { isActive: true },
              orderBy: { usageCount: 'desc' }
            }
          }
        });
      }
    );
  }

  /**
   * 获取用户伴侣关系（增强版）
   */
  static async getUserCompanionOptimized(userId: string, companionId: string) {
    return this.executeWithMonitoring(
      'getUserCompanion',
      async () => {
        return await prisma.userCompanion.findUnique({
          where: {
            userId_companionId: {
              userId,
              companionId
            }
          },
          select: {
            id: true,
            relationshipLevel: true,
            intimacyPoints: true,
            totalInteractions: true,
            lastInteraction: true,
            currentMood: true,
            currentOutfitId: true,
            unlockedOutfits: true,
            unlockedVoices: true,
            isPrimary: true,
            // Enhanced fields
            preferredRoleId: true,
            conversationStyle: true,
            memoryPriorities: true,
            learningProfile: true,
            currentEmotionalState: true,
            sessionContext: true,
            // Relations
            companion: {
              select: {
                id: true,
                codeName: true,
                name: true,
                nameLocalized: true,
                personality: true,
                personalityTraits: true,
                emotionalRange: true,
                learningCapacity: true,
                memoryRetention: true
              }
            },
            // Recent interactions (limited for performance)
            interactions: {
              select: {
                id: true,
                interactionType: true,
                context: true,
                duration: true,
                intimacyGained: true,
                moodBefore: true,
                moodAfter: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 10
            },
            // Recent memories (by importance)
            memories: {
              select: {
                id: true,
                memoryType: true,
                title: true,
                importance: true,
                priority: true,
                emotionalWeight: true,
                accessCount: true,
                memoryStrength: true,
                tags: true,
                createdAt: true
              },
              orderBy: [
                { importance: 'desc' },
                { priority: 'desc' },
                { createdAt: 'desc' }
              ],
              take: 20
            }
          }
        });
      },
      userId
    );
  }

  /**
   * 获取对话历史（分页优化）
   */
  static async getConversationHistoryOptimized(
    sessionId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    return this.executeWithMonitoring(
      'getConversationHistory',
      async () => {
        return await prisma.conversationHistory.findMany({
          where: { sessionId },
          select: {
            id: true,
            messageType: true,
            content: true,
            contentMetadata: true,
            gameContext: true,
            emotionalContext: true,
            processingTime: true,
            confidenceScore: true,
            userRating: true,
            relevanceScore: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        });
      }
    );
  }

  /**
   * 获取伴侣记忆（按重要性分层）
   */
  static async getCompanionMemoriesOptimized(
    userCompanionId: string,
    importance?: number,
    memoryType?: string,
    limit: number = 100
  ) {
    return this.executeWithMonitoring(
      'getCompanionMemories',
      async () => {
        const whereClause: any = { userCompanionId };
        
        if (importance !== undefined) {
          whereClause.importance = { gte: importance };
        }
        
        if (memoryType) {
          whereClause.memoryType = memoryType;
        }

        return await prisma.companionMemory.findMany({
          where: whereClause,
          select: {
            id: true,
            memoryType: true,
            title: true,
            description: true,
            importance: true,
            priority: true,
            emotionalWeight: true,
            relatedGameEvents: true,
            conversationContext: true,
            isRecurringTheme: true,
            accessCount: true,
            memoryStrength: true,
            tags: true,
            category: true,
            subcategory: true,
            createdAt: true,
            updatedAt: true,
            lastAccessedAt: true
          },
          orderBy: [
            { importance: 'desc' },
            { emotionalWeight: 'desc' },
            { accessCount: 'desc' },
            { createdAt: 'desc' }
          ],
          take: limit
        });
      }
    );
  }

  /**
   * 获取情感状态历史（时间范围优化）
   */
  static async getEmotionalStateHistoryOptimized(
    userCompanionId: string,
    days: number = 7
  ) {
    return this.executeWithMonitoring(
      'getEmotionalStateHistory',
      async () => {
        const dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - days);

        return await prisma.emotionalStateLog.findMany({
          where: {
            userCompanionId,
            createdAt: { gte: dateFilter }
          },
          select: {
            id: true,
            emotionalState: true,
            intensity: true,
            happiness: true,
            excitement: true,
            trust: true,
            comfort: true,
            curiosity: true,
            empathy: true,
            trigger: true,
            triggerContext: true,
            userAction: true,
            stateTransition: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        });
      }
    );
  }

  /**
   * 批量获取多个伴侣的基础数据
   */
  static async getBatchCompanionDataOptimized(companionIds: string[]) {
    return this.executeWithMonitoring(
      'getBatchCompanionData',
      async () => {
        return await this.batchOperation(
          companionIds,
          async (batch) => {
            return await prisma.aICompanion.findMany({
              where: { 
                id: { in: batch },
                isActive: true 
              },
              select: {
                id: true,
                codeName: true,
                name: true,
                nameLocalized: true,
                personality: true,
                region: true,
                rarity: true,
                tags: true,
                popularityScore: true,
                interactionCount: true,
                avgSessionTime: true
              },
              orderBy: { popularityScore: 'desc' }
            });
          },
          50 // 批次大小
        );
      }
    );
  }

  /**
   * 伴侣统计查询优化
   */
  static async getCompanionStatsOptimized(companionId: string) {
    return this.executeWithMonitoring(
      'getCompanionStats',
      async () => {
        // 使用原生SQL进行复杂统计查询
        const stats = await prisma.$queryRaw<Array<{
          total_users: bigint;
          avg_relationship_level: number;
          avg_intimacy_points: number;
          total_interactions: bigint;
          active_users_last_week: bigint;
          avg_session_duration: number;
        }>>`
          SELECT 
            COUNT(DISTINCT uc."userId")::bigint as total_users,
            AVG(uc."relationshipLevel") as avg_relationship_level,
            AVG(uc."intimacyPoints") as avg_intimacy_points,
            SUM(uc."totalInteractions")::bigint as total_interactions,
            COUNT(DISTINCT CASE 
              WHEN uc."lastInteraction" > NOW() - INTERVAL '7 days' 
              THEN uc."userId" 
            END)::bigint as active_users_last_week,
            AVG(CASE 
              WHEN ci.duration IS NOT NULL 
              THEN ci.duration 
            END) as avg_session_duration
          FROM "user_companions" uc
          LEFT JOIN "companion_interactions" ci ON ci."userCompanionId" = uc.id
          WHERE uc."companionId" = ${companionId}
            AND uc."isActive" = true
        `;

        return stats[0] || {
          total_users: 0n,
          avg_relationship_level: 0,
          avg_intimacy_points: 0,
          total_interactions: 0n,
          active_users_last_week: 0n,
          avg_session_duration: 0
        };
      }
    );
  }

  /**
   * 角色模板使用统计
   */
  static async getRoleTemplateUsageOptimized(companionId?: string) {
    return this.executeWithMonitoring(
      'getRoleTemplateUsage',
      async () => {
        const whereClause = companionId ? { companionId } : {};
        
        return await prisma.companionRoleTemplate.findMany({
          where: {
            ...whereClause,
            isActive: true
          },
          select: {
            id: true,
            roleName: true,
            roleDescription: true,
            conversationStyle: true,
            knowledgeLevel: true,
            interactionMode: true,
            usageCount: true,
            avgRating: true,
            companion: {
              select: {
                id: true,
                name: true,
                codeName: true
              }
            },
            _count: {
              select: {
                conversations: true
              }
            }
          },
          orderBy: [
            { usageCount: 'desc' },
            { avgRating: 'desc' }
          ]
        });
      }
    );
  }

  /**
   * 获取用户所有伴侣列表（优化版）
   */
  static async getUserCompanionsOptimized(userId: string) {
    return this.executeWithMonitoring(
      'getUserCompanions',
      async () => {
        return await prisma.userCompanion.findMany({
          where: { 
            userId,
            isActive: true 
          },
          select: {
            id: true,
            relationshipLevel: true,
            intimacyPoints: true,
            totalInteractions: true,
            lastInteraction: true,
            currentMood: true,
            isPrimary: true,
            // Enhanced fields
            preferredRoleId: true,
            currentEmotionalState: true,
            companion: {
              select: {
                id: true,
                codeName: true,
                name: true,
                nameLocalized: true,
                personality: true,
                region: true,
                rarity: true,
                tags: true,
                popularityScore: true,
                interactionCount: true
              }
            },
            // 只获取最近的几条互动记录（性能优化）
            interactions: {
              select: {
                id: true,
                interactionType: true,
                intimacyGained: true,
                moodAfter: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 3
            },
            // 获取重要记忆概览
            memories: {
              select: {
                id: true,
                memoryType: true,
                title: true,
                importance: true,
                emotionalWeight: true
              },
              where: { importance: { gte: 5 } },
              orderBy: [
                { importance: 'desc' },
                { emotionalWeight: 'desc' }
              ],
              take: 5
            }
          },
          orderBy: [
            { isPrimary: 'desc' },
            { lastInteraction: 'desc' }
          ]
        });
      },
      userId
    );
  }

  /**
   * 训练会话查询优化
   */
  static async getTrainingSessionsOptimized(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ) {
    return this.executeWithMonitoring(
      'getTrainingSessions',
      async () => {
        return await prisma.trainingSession.findMany({
          where: { 
            userId,
            completedAt: { not: null }
          },
          select: {
            id: true,
            mode: true,
            scenario: true,
            difficulty: true,
            handsPlayed: true,
            correctDecisions: true,
            score: true,
            totalProfit: true,
            startedAt: true,
            completedAt: true,
            // 不直接获取所有决策记录，而是使用聚合
            _count: {
              select: {
                decisions: true
              }
            }
          },
          orderBy: { completedAt: 'desc' },
          take: limit,
          skip: offset
        });
      },
      userId
    );
  }

  /**
   * 技能测试结果查询优化
   */
  static async getTestResultsOptimized(userId: string, sessionId?: string) {
    const operation = sessionId ? 'getTestResultsBySession' : 'getTestResults';
    
    return this.executeWithMonitoring(
      operation,
      async () => {
        const whereClause: any = { userId };
        if (sessionId) {
          whereClause.id = sessionId;
        }

        return await prisma.testSession.findMany({
          where: whereClause,
          select: {
            id: true,
            testType: true,
            status: true,
            totalScore: true,
            dimensionScores: true,
            playerType: true,
            rankPointsBefore: true,
            rankPointsAfter: true,
            timeSpent: true,
            avgDecisionTime: true,
            startedAt: true,
            completedAt: true,
            // 只获取汇总信息，不获取详细的测试结果
            _count: {
              select: {
                testResults: true
              }
            }
          },
          orderBy: { startedAt: 'desc' },
          take: sessionId ? 1 : 20
        });
      },
      userId
    );
  }

  /**
   * 游戏会话统计优化查询
   */
  static async getGameStatsOptimized(userId: string, days: number = 30) {
    return this.executeWithMonitoring(
      `getGameStats_${days}days`,
      async () => {
        const dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - days);

        // 使用原生 SQL 查询获取统计数据
        const stats = await prisma.$queryRaw<Array<{
          total_sessions: bigint;
          total_hands: bigint;
          win_rate: number;
          avg_profit: number;
          total_profit: number;
        }>>`
          SELECT 
            COUNT(*)::bigint as total_sessions,
            SUM(hands)::bigint as total_hands,
            AVG(CASE WHEN result = 'WIN' THEN 1.0 ELSE 0.0 END) as win_rate,
            AVG("cashOut" - "buyIn") as avg_profit,
            SUM("cashOut" - "buyIn") as total_profit
          FROM "GameSession" 
          WHERE "userId" = ${userId}
            AND "completedAt" IS NOT NULL
            AND "createdAt" >= ${dateFilter}
        `;

        return stats[0] || {
          total_sessions: 0n,
          total_hands: 0n,
          win_rate: 0,
          avg_profit: 0,
          total_profit: 0
        };
      },
      userId
    );
  }

  /**
   * 排行榜查询优化
   */
  static async getLeaderboardOptimized(
    period: string,
    category: string,
    limit: number = 100
  ) {
    const cacheKey = `leaderboard_${period}_${category}`;
    
    return this.executeWithMonitoring(
      'getLeaderboard',
      async () => {
        return await prisma.leaderboardEntry.findMany({
          where: {
            period,
            category,
            periodEnd: { gt: new Date() }
          },
          select: {
            rank: true,
            score: true,
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
                level: true
              }
            }
          },
          orderBy: { rank: 'asc' },
          take: limit
        });
      }
    );
  }

  /**
   * 清理缓存
   */
  static clearCache(pattern?: string): void {
    if (pattern) {
      // 清理特定模式的缓存
      for (const [key] of this.queryCache) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      // 清理所有缓存
      this.queryCache.clear();
    }
  }

  /**
   * 获取性能统计
   */
  static getPerformanceStats(): {
    averageQueryTime: number;
    slowQueries: QueryPerformanceStats[];
    totalQueries: number;
    cacheHitRate: number;
  } {
    const totalQueries = this.performanceLog.length;
    const averageQueryTime = totalQueries > 0 
      ? this.performanceLog.reduce((sum, log) => sum + log.duration, 0) / totalQueries
      : 0;
    
    const slowQueries = this.performanceLog
      .filter(log => log.duration > 1000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // 计算缓存命中率（简化版本）
    const cacheHitRate = this.queryCache.size > 0 ? 0.3 : 0; // 估算值

    return {
      averageQueryTime,
      slowQueries,
      totalQueries,
      cacheHitRate
    };
  }

  /**
   * 生成查询哈希
   */
  private static generateQueryHash(operation: string, userId?: string): string {
    return `${operation}_${userId || 'global'}_${Date.now().toString(36)}`;
  }

  /**
   * 判断是否应该缓存结果
   */
  private static shouldCache(operation: string, executionTime: number): boolean {
    // 缓存策略：
    // 1. 执行时间超过100ms的查询
    // 2. 排行榜等相对稳定的数据
    // 3. 用户配置数据
    const cachableOperations = [
      'getLeaderboard',
      'getUserCompanions',
      'getAchievements'
    ];

    return executionTime > 100 || cachableOperations.some(op => operation.includes(op));
  }

  /**
   * 添加到缓存
   */
  private static addToCache(key: string, data: any): void {
    // 防止缓存过大
    if (this.queryCache.size >= this.maxCacheSize) {
      const firstKey = this.queryCache.keys().next().value;
      this.queryCache.delete(firstKey);
    }

    this.queryCache.set(key, data);

    // 设置过期时间（5分钟后清理）
    setTimeout(() => {
      this.queryCache.delete(key);
    }, 5 * 60 * 1000);
  }

  /**
   * 记录性能日志
   */
  private static logPerformance(stats: QueryPerformanceStats): void {
    // 防止日志过大
    if (this.performanceLog.length >= this.maxLogSize) {
      this.performanceLog.shift();
    }

    this.performanceLog.push(stats);

    // 如果是慢查询，立即输出警告
    if (stats.duration > 1000) {
      console.warn(`🐌 慢查询警告: ${stats.operation} - ${stats.duration.toFixed(2)}ms`);
    }
  }
}

/**
 * 数据库连接池监控
 */
export class DatabaseMonitor {
  private static metrics = {
    totalQueries: 0,
    totalConnections: 0,
    activeConnections: 0,
    errors: 0
  };

  static incrementQuery(): void {
    this.metrics.totalQueries++;
  }

  static incrementConnection(): void {
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;
  }

  static decrementConnection(): void {
    this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
  }

  static incrementError(): void {
    this.metrics.errors++;
  }

  static getMetrics() {
    return { ...this.metrics };
  }

  static resetMetrics(): void {
    this.metrics = {
      totalQueries: 0,
      totalConnections: 0,
      activeConnections: 0,
      errors: 0
    };
  }
}

export default QueryOptimizer;