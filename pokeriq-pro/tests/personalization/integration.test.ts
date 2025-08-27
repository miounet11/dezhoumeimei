/**
 * 个性化系统集成测试
 * 测试前端组件与后端API的完整集成
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { PersonalizationIntegration, PersonalizationConfig } from '@/lib/integration/personalization-integration';
import { EventType } from '@/lib/integration/event-bus';
import Redis from 'ioredis-mock';

// Mock Redis
jest.mock('ioredis', () => require('ioredis-mock'));

// Mock logger
jest.mock('@/lib/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }))
}));

// Mock personalization engine
jest.mock('@/lib/personalization/recommendation-engine', () => ({
  PersonalizationEngine: jest.fn().mockImplementation(() => ({
    generateRecommendations: jest.fn().mockResolvedValue([
      {
        id: 'rec_1',
        title: '翻前开牌范围训练',
        description: '学习不同位置的标准开牌范围',
        scenario: 'PREFLOP_RANGES',
        difficulty: 2,
        estimatedTime: 25,
        expectedImprovement: 30,
        priority: 0.8,
        reasoning: '您在翻前阶段经常出现范围错误',
        skillFocus: ['preflop'],
        learningStyle: ['visual', 'theoretical']
      }
    ]),
    generateTrainingPlan: jest.fn().mockResolvedValue({
      userId: 'user_123',
      planId: 'plan_456',
      title: '初级德州扑克技能提升计划',
      description: '针对您当前1000分的水平设计的训练计划',
      estimatedDuration: 10,
      expectedOverallImprovement: 25,
      recommendations: [],
      milestones: [],
      createdAt: new Date(),
      difficulty: 2
    })
  }))
}));

// Mock user profiler
jest.mock('@/lib/personalization/user-profiler', () => ({
  UserProfiler: jest.fn().mockImplementation(() => ({
    getUserProfile: jest.fn().mockResolvedValue({
      userId: 'user_123',
      overallRating: 1000,
      skillDimensions: {
        preflop: { current: 950, confidence: 0.8 },
        postflop: { current: 1050, confidence: 0.7 },
        psychology: { current: 900, confidence: 0.6 }
      },
      weaknessPatterns: [
        {
          pattern: '过度保守',
          frequency: 0.3,
          severity: 2,
          street: 'preflop'
        }
      ],
      learningStyle: {
        visualLearner: 0.7,
        practicalLearner: 0.5,
        theoreticalLearner: 0.3,
        socialLearner: 0.2
      },
      learningVelocity: {
        skillGainRate: 18,
        retentionRate: 0.85,
        adaptabilityScore: 0.7
      },
      lastUpdated: new Date()
    }),
    analyzeGameSession: jest.fn().mockResolvedValue({
      profileUpdated: true,
      changes: ['skillDimensions.postflop', 'weaknessPatterns']
    })
  }))
}));

describe('PersonalizationIntegration', () => {
  let integration: PersonalizationIntegration;
  let config: PersonalizationConfig;

  beforeAll(async () => {
    config = {
      enableCaching: true,
      enableRealTimeUpdates: true,
      apiTimeout: 5000,
      retryAttempts: 2,
      redis: {
        host: 'localhost',
        port: 6379,
        db: 2
      }
    };
  });

  beforeEach(async () => {
    integration = new PersonalizationIntegration(config);
    await new Promise(resolve => setTimeout(resolve, 100)); // 等待初始化完成
  });

  afterEach(async () => {
    await integration.shutdown();
  });

  describe('用户推荐生成', () => {
    test('应该成功生成用户推荐', async () => {
      // 模拟用户登录
      const userId = 'user_123';
      const sessionId = 'session_456';
      
      // 初始化会话
      await integration['initializeUserSession'](userId, sessionId);

      const request = {
        userId,
        timeAvailable: 30,
        preferredDifficulty: 2,
        focusAreas: ['preflop'],
        count: 3
      };

      const result = await integration.getUserRecommendations(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    test('应该处理无效用户会话', async () => {
      const request = {
        userId: 'invalid_user',
        timeAvailable: 30
      };

      const result = await integration.getUserRecommendations(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User session not found');
    });

    test('应该使用缓存来提高性能', async () => {
      const userId = 'user_123';
      const sessionId = 'session_456';
      
      await integration['initializeUserSession'](userId, sessionId);

      const request = {
        userId,
        timeAvailable: 30,
        count: 3
      };

      // 第一次调用
      const result1 = await integration.getUserRecommendations(request);
      const time1 = result1.processingTime;

      // 第二次调用应该更快（使用缓存）
      const result2 = await integration.getUserRecommendations(request);
      const time2 = result2.processingTime;

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(time2).toBeLessThanOrEqual(time1);
    });
  });

  describe('训练计划生成', () => {
    test('应该成功生成训练计划', async () => {
      const userId = 'user_123';
      const sessionId = 'session_456';
      
      await integration['initializeUserSession'](userId, sessionId);

      const result = await integration.generateTrainingPlan(userId, 30);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('planId');
      expect(result.data).toHaveProperty('title');
      expect(result.data).toHaveProperty('recommendations');
      expect(result.data).toHaveProperty('milestones');
      expect(result.data.estimatedDuration).toBeGreaterThan(0);
    });

    test('应该缓存训练计划结果', async () => {
      const userId = 'user_123';
      const sessionId = 'session_456';
      
      await integration['initializeUserSession'](userId, sessionId);

      const result1 = await integration.generateTrainingPlan(userId, 30);
      const result2 = await integration.generateTrainingPlan(userId, 30);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.data.planId).toBe(result2.data.planId);
      expect(result2.processingTime).toBeLessThanOrEqual(result1.processingTime);
    });
  });

  describe('用户画像更新', () => {
    test('应该成功更新用户画像', async () => {
      const userId = 'user_123';
      const gameData = {
        sessionId: 'game_789',
        handsPlayed: 50,
        winRate: 0.6,
        aggression: 2.1,
        vpip: 0.22,
        pfr: 0.18
      };

      const result = await integration.updateUserProfile(userId, gameData);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('profileUpdated');
      expect(result.data).toHaveProperty('changes');
    });

    test('应该清除相关缓存当用户画像更新时', async () => {
      const userId = 'user_123';
      const sessionId = 'session_456';
      
      await integration['initializeUserSession'](userId, sessionId);

      // 生成推荐并缓存
      await integration.getUserRecommendations({ userId, timeAvailable: 30 });

      // 更新用户画像
      const gameData = { sessionId: 'game_789', handsPlayed: 10 };
      await integration.updateUserProfile(userId, gameData);

      // 缓存应该被清除
      const spy = jest.spyOn(integration as any, 'invalidateUserCache');
      expect(spy).toHaveBeenCalledWith(userId);
    });
  });

  describe('事件处理', () => {
    test('应该处理用户登录事件', async () => {
      const eventBus = integration['eventBus'];
      const initSessionSpy = jest.spyOn(integration as any, 'initializeUserSession');

      await eventBus.publish(EventType.USER_LOGIN, {
        userId: 'user_123',
        sessionId: 'session_456'
      });

      await new Promise(resolve => setTimeout(resolve, 100)); // 等待事件处理

      expect(initSessionSpy).toHaveBeenCalledWith('user_123', 'session_456');
    });

    test('应该处理用户登出事件', async () => {
      const eventBus = integration['eventBus'];
      const cleanupSessionSpy = jest.spyOn(integration as any, 'cleanupUserSession');

      await eventBus.publish(EventType.USER_LOGOUT, {
        userId: 'user_123'
      });

      await new Promise(resolve => setTimeout(resolve, 100)); // 等待事件处理

      expect(cleanupSessionSpy).toHaveBeenCalledWith('user_123');
    });

    test('应该处理游戏会话结束事件', async () => {
      const eventBus = integration['eventBus'];
      const updateProfileSpy = jest.spyOn(integration, 'updateUserProfile');

      await eventBus.publish(EventType.GAME_SESSION_ENDED, {
        userId: 'user_123',
        sessionData: { sessionId: 'game_789' }
      });

      await new Promise(resolve => setTimeout(resolve, 100)); // 等待事件处理

      expect(updateProfileSpy).toHaveBeenCalledWith('user_123', { sessionId: 'game_789' });
    });
  });

  describe('会话管理', () => {
    test('应该正确管理用户会话', async () => {
      const userId = 'user_123';
      const sessionId = 'session_456';

      // 初始化会话
      await integration['initializeUserSession'](userId, sessionId);
      
      const activeSessions = integration['activeSessions'];
      expect(activeSessions.has(userId)).toBe(true);
      
      const session = activeSessions.get(userId);
      expect(session).toHaveProperty('userId', userId);
      expect(session).toHaveProperty('sessionId', sessionId);
      expect(session).toHaveProperty('startTime');
      expect(session).toHaveProperty('lastActivity');
    });

    test('应该更新会话活动时间', async () => {
      const userId = 'user_123';
      const sessionId = 'session_456';
      
      await integration['initializeUserSession'](userId, sessionId);
      
      const session1 = integration['activeSessions'].get(userId);
      const initialTime = session1?.lastActivity.getTime();

      await new Promise(resolve => setTimeout(resolve, 10));

      integration['updateSessionActivity'](userId);
      
      const session2 = integration['activeSessions'].get(userId);
      const updatedTime = session2?.lastActivity.getTime();

      expect(updatedTime).toBeGreaterThan(initialTime || 0);
    });

    test('应该清理过期会话', async () => {
      const userId = 'user_123';
      const sessionId = 'session_456';
      
      await integration['initializeUserSession'](userId, sessionId);
      
      // 模拟过期会话
      const session = integration['activeSessions'].get(userId);
      if (session) {
        session.lastActivity = new Date(Date.now() - 35 * 60 * 1000); // 35分钟前
      }

      integration['cleanupExpiredSessions']();

      expect(integration['activeSessions'].has(userId)).toBe(false);
    });
  });

  describe('错误处理', () => {
    test('应该处理推荐引擎错误', async () => {
      const userId = 'user_123';
      const sessionId = 'session_456';
      
      await integration['initializeUserSession'](userId, sessionId);

      // 模拟引擎错误
      const mockEngine = integration['recommendationEngine'];
      jest.spyOn(mockEngine, 'generateRecommendations')
        .mockRejectedValueOnce(new Error('Engine failure'));

      const result = await integration.getUserRecommendations({
        userId,
        timeAvailable: 30
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Engine failure');
    });

    test('应该处理网络错误', async () => {
      // 模拟Redis连接失败
      config.redis = undefined;
      const newIntegration = new PersonalizationIntegration(config);
      
      // 应该能够正常运行，即使没有Redis
      expect(newIntegration['redis']).toBeUndefined();
    });

    test('应该处理系统错误事件', async () => {
      const eventBus = integration['eventBus'];
      const handleErrorSpy = jest.spyOn(integration as any, 'handleSystemError');

      await eventBus.publish(EventType.SYSTEM_ERROR_OCCURRED, {
        error: new Error('System failure'),
        context: { userId: 'user_123' }
      });

      await new Promise(resolve => setTimeout(resolve, 100)); // 等待事件处理

      expect(handleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('缓存管理', () => {
    test('应该正确生成缓存键', () => {
      const key1 = integration['generateCacheKey']('recommendations', { userId: 'user_123' });
      const key2 = integration['generateCacheKey']('recommendations', { userId: 'user_456' });
      const key3 = integration['generateCacheKey']('training_plan', { userId: 'user_123' });

      expect(key1).toMatch(/^personalization:recommendations:/);
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
    });

    test('应该清理过期的本地缓存', () => {
      const cache = integration['requestCache'];
      const expiry = integration['cacheExpiry'];
      
      // 添加过期项
      cache.set('expired_key', 'data');
      expiry.set('expired_key', Date.now() - 1000); // 1秒前过期
      
      // 添加有效项
      cache.set('valid_key', 'data');
      expiry.set('valid_key', Date.now() + 60000); // 1分钟后过期

      integration['cleanupExpiredCache']();

      expect(cache.has('expired_key')).toBe(false);
      expect(cache.has('valid_key')).toBe(true);
      expect(expiry.has('expired_key')).toBe(false);
      expect(expiry.has('valid_key')).toBe(true);
    });
  });

  describe('性能监控', () => {
    test('应该返回集成状态', () => {
      const status = integration.getIntegrationStatus();

      expect(status).toHaveProperty('activeSessions');
      expect(status).toHaveProperty('cacheSize');
      expect(status).toHaveProperty('redisConnected');
      expect(status).toHaveProperty('eventBusStats');
      expect(status).toHaveProperty('uptime');
      expect(status).toHaveProperty('memoryUsage');
    });

    test('应该跟踪处理时间', async () => {
      const userId = 'user_123';
      const sessionId = 'session_456';
      
      await integration['initializeUserSession'](userId, sessionId);

      const result = await integration.getUserRecommendations({
        userId,
        timeAvailable: 30
      });

      expect(result.processingTime).toBeGreaterThan(0);
      expect(typeof result.processingTime).toBe('number');
    });
  });

  describe('资源清理', () => {
    test('应该正确关闭所有连接', async () => {
      const eventBusCloseSpy = jest.spyOn(integration['eventBus'], 'close');
      
      await integration.shutdown();

      expect(eventBusCloseSpy).toHaveBeenCalled();
      expect(integration['activeSessions'].size).toBe(0);
      expect(integration['requestCache'].size).toBe(0);
      expect(integration['cacheExpiry'].size).toBe(0);
    });
  });
});

// 集成端到端测试
describe('PersonalizationIntegration E2E', () => {
  let integration: PersonalizationIntegration;

  beforeEach(() => {
    integration = new PersonalizationIntegration({
      enableCaching: true,
      enableRealTimeUpdates: true,
      apiTimeout: 5000,
      retryAttempts: 2
    });
  });

  afterEach(async () => {
    await integration.shutdown();
  });

  test('完整的用户个性化流程', async () => {
    const userId = 'user_e2e';
    const sessionId = 'session_e2e';

    // 1. 用户登录
    await integration['initializeUserSession'](userId, sessionId);

    // 2. 获取推荐
    const recommendationResult = await integration.getUserRecommendations({
      userId,
      timeAvailable: 45,
      preferredDifficulty: 3,
      focusAreas: ['preflop', 'postflop']
    });

    expect(recommendationResult.success).toBe(true);
    expect(recommendationResult.data.length).toBeGreaterThan(0);

    // 3. 生成训练计划
    const planResult = await integration.generateTrainingPlan(userId, 30);

    expect(planResult.success).toBe(true);
    expect(planResult.data).toHaveProperty('planId');

    // 4. 模拟游戏会话
    const gameData = {
      sessionId: 'game_e2e',
      handsPlayed: 25,
      winRate: 0.64,
      performance: 'good'
    };

    const updateResult = await integration.updateUserProfile(userId, gameData);

    expect(updateResult.success).toBe(true);

    // 5. 获取更新后的推荐
    const newRecommendationResult = await integration.getUserRecommendations({
      userId,
      timeAvailable: 30
    });

    expect(newRecommendationResult.success).toBe(true);

    // 6. 验证状态
    const status = integration.getIntegrationStatus();
    expect(status.activeSessions).toBe(1);
  });
});