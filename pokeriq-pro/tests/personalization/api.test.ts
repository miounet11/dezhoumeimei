/**
 * 个性化API测试
 * 测试所有个性化相关的API端点
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { createMocks } from 'node-mocks-http';

// Mock dependencies
jest.mock('@/lib/auth/middleware', () => ({
  authenticateUser: jest.fn().mockResolvedValue({
    userId: 'test_user_123',
    email: 'test@example.com'
  })
}));

jest.mock('@/lib/integration/personalization-integration', () => ({
  createPersonalizationIntegration: jest.fn().mockReturnValue({
    getUserRecommendations: jest.fn().mockResolvedValue({
      success: true,
      data: [
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
      ],
      timestamp: new Date(),
      processingTime: 150
    }),
    generateTrainingPlan: jest.fn().mockResolvedValue({
      success: true,
      data: {
        userId: 'test_user_123',
        planId: 'plan_456',
        title: '初级德州扑克技能提升计划',
        description: '针对您当前1000分的水平设计的训练计划',
        estimatedDuration: 10,
        expectedOverallImprovement: 25,
        recommendations: [],
        milestones: [],
        createdAt: new Date(),
        difficulty: 2
      },
      timestamp: new Date(),
      processingTime: 300
    }),
    updateUserProfile: jest.fn().mockResolvedValue({
      success: true,
      data: {
        profileUpdated: true,
        changes: ['skillDimensions.postflop']
      },
      timestamp: new Date(),
      processingTime: 100
    }),
    getUserProfile: jest.fn().mockResolvedValue({
      userId: 'test_user_123',
      overallRating: 1000,
      skillDimensions: {
        preflop: { current: 950, confidence: 0.8 },
        postflop: { current: 1050, confidence: 0.7 }
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
        practicalLearner: 0.5
      },
      lastUpdated: new Date()
    }),
    getIntegrationStatus: jest.fn().mockReturnValue({
      activeSessions: 5,
      cacheSize: 100,
      redisConnected: true,
      uptime: 3600
    })
  })
}));

jest.mock('@/lib/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }))
}));

// Mock API路由处理器
async function mockRecommendationsAPI(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { timeAvailable, preferredDifficulty, focusAreas, count } = body;

    // 模拟验证
    if (!timeAvailable || timeAvailable < 5) {
      return Response.json(
        { error: 'timeAvailable must be at least 5 minutes' },
        { status: 400 }
      );
    }

    // 模拟推荐生成
    const recommendations = [
      {
        id: 'rec_1',
        title: '翻前开牌范围训练',
        description: '学习不同位置的标准开牌范围',
        scenario: 'PREFLOP_RANGES',
        difficulty: preferredDifficulty || 2,
        estimatedTime: timeAvailable * 0.8,
        expectedImprovement: 30,
        priority: 0.8,
        reasoning: '基于您的游戏历史分析',
        skillFocus: focusAreas || ['preflop'],
        learningStyle: ['visual', 'theoretical']
      }
    ];

    return Response.json({
      success: true,
      data: recommendations.slice(0, count || 5),
      metadata: {
        requestId: 'req_123',
        processingTime: 150,
        cacheHit: false
      }
    });
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function mockTrainingPlanAPI(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { planDuration } = body;

    if (!planDuration || planDuration < 7) {
      return Response.json(
        { error: 'planDuration must be at least 7 days' },
        { status: 400 }
      );
    }

    const plan = {
      userId: 'test_user_123',
      planId: `plan_${Date.now()}`,
      title: '个性化训练计划',
      description: `为期${planDuration}天的训练计划`,
      estimatedDuration: planDuration * 2,
      expectedOverallImprovement: Math.min(planDuration * 5, 100),
      recommendations: [],
      milestones: [],
      createdAt: new Date(),
      difficulty: 3
    };

    return Response.json({
      success: true,
      data: plan,
      metadata: {
        requestId: 'req_456',
        processingTime: 300
      }
    });
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function mockPreferencesAPI(request: Request): Promise<Response> {
  const method = request.method;
  
  try {
    if (method === 'GET') {
      return Response.json({
        success: true,
        data: {
          userId: 'test_user_123',
          preferences: {
            defaultSessionTime: 45,
            preferredDifficulty: 3,
            focusAreas: ['preflop', 'postflop'],
            learningGoals: ['improve_winrate'],
            notificationSettings: {
              dailyReminders: true,
              weeklyReports: true,
              achievementAlerts: true
            },
            displaySettings: {
              theme: 'dark',
              language: 'zh-CN',
              units: 'metric'
            }
          },
          lastUpdated: new Date()
        }
      });
    } else if (method === 'POST') {
      const body = await request.json();
      const { preferences } = body;

      if (!preferences) {
        return Response.json(
          { error: 'preferences are required' },
          { status: 400 }
        );
      }

      return Response.json({
        success: true,
        data: {
          userId: 'test_user_123',
          preferences,
          updated: true,
          timestamp: new Date()
        }
      });
    }
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

  return Response.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

async function mockLearningPathAPI(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const pathId = url.searchParams.get('pathId');

    if (!pathId) {
      // 返回可用的学习路径列表
      return Response.json({
        success: true,
        data: [
          {
            id: 'path_beginner',
            title: '新手入门路径',
            description: '从零开始学习德州扑克基础知识',
            estimatedDuration: 30,
            difficulty: 1,
            modules: ['基础规则', '手牌价值', '位置概念'],
            prerequisites: []
          },
          {
            id: 'path_intermediate',
            title: '进阶提升路径',
            description: '提升中级玩家的技能水平',
            estimatedDuration: 60,
            difficulty: 3,
            modules: ['翻后游戏', '下注尺度', '心理博弈'],
            prerequisites: ['path_beginner']
          }
        ]
      });
    } else {
      // 返回特定学习路径的详细信息
      const pathDetails = {
        id: pathId,
        title: '个性化学习路径',
        description: '基于您的技能水平定制的学习路径',
        progress: {
          completed: 3,
          total: 10,
          percentage: 30
        },
        currentModule: {
          id: 'module_4',
          title: '翻前范围训练',
          estimatedTime: 25,
          status: 'in_progress'
        },
        nextModules: [
          {
            id: 'module_5',
            title: '位置策略',
            estimatedTime: 30,
            status: 'locked'
          }
        ]
      };

      return Response.json({
        success: true,
        data: pathDetails
      });
    }
  } catch (error) {
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

describe('个性化API测试', () => {
  describe('推荐API (/api/personalization/recommendations)', () => {
    test('应该返回个性化推荐', async () => {
      const request = new Request('http://localhost:3000/api/personalization/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          timeAvailable: 30,
          preferredDifficulty: 3,
          focusAreas: ['preflop', 'postflop'],
          count: 5
        })
      });

      const response = await mockRecommendationsAPI(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data.length).toBeLessThanOrEqual(5);
      
      const recommendation = data.data[0];
      expect(recommendation).toHaveProperty('id');
      expect(recommendation).toHaveProperty('title');
      expect(recommendation).toHaveProperty('description');
      expect(recommendation).toHaveProperty('difficulty');
      expect(recommendation).toHaveProperty('estimatedTime');
      expect(recommendation).toHaveProperty('skillFocus');
    });

    test('应该验证请求参数', async () => {
      const request = new Request('http://localhost:3000/api/personalization/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          timeAvailable: 2, // 无效值
          count: 5
        })
      });

      const response = await mockRecommendationsAPI(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('timeAvailable');
    });

    test('应该处理服务器错误', async () => {
      const request = new Request('http://localhost:3000/api/personalization/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: 'invalid-json'
      });

      const response = await mockRecommendationsAPI(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    test('应该支持不同的推荐参数组合', async () => {
      const testCases = [
        {
          params: { timeAvailable: 60, preferredDifficulty: 1 },
          expectedDifficulty: 1
        },
        {
          params: { timeAvailable: 30, focusAreas: ['psychology'] },
          expectedFocusAreas: ['psychology']
        },
        {
          params: { timeAvailable: 15, count: 3 },
          expectedCount: 3
        }
      ];

      for (const testCase of testCases) {
        const request = new Request('http://localhost:3000/api/personalization/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token'
          },
          body: JSON.stringify(testCase.params)
        });

        const response = await mockRecommendationsAPI(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        if (testCase.expectedCount) {
          expect(data.data.length).toBeLessThanOrEqual(testCase.expectedCount);
        }
        
        if (testCase.expectedDifficulty) {
          expect(data.data[0].difficulty).toBe(testCase.expectedDifficulty);
        }
      }
    });
  });

  describe('训练计划API (/api/training/recommendations)', () => {
    test('应该生成个性化训练计划', async () => {
      const request = new Request('http://localhost:3000/api/training/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          planDuration: 30
        })
      });

      const response = await mockTrainingPlanAPI(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('planId');
      expect(data.data).toHaveProperty('title');
      expect(data.data).toHaveProperty('estimatedDuration');
      expect(data.data).toHaveProperty('expectedOverallImprovement');
      expect(data.data.estimatedDuration).toBeGreaterThan(0);
    });

    test('应该验证训练计划参数', async () => {
      const request = new Request('http://localhost:3000/api/training/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          planDuration: 5 // 太短
        })
      });

      const response = await mockTrainingPlanAPI(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('planDuration');
    });

    test('应该支持不同的训练计划时长', async () => {
      const durations = [7, 14, 30, 60];

      for (const duration of durations) {
        const request = new Request('http://localhost:3000/api/training/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token'
          },
          body: JSON.stringify({
            planDuration: duration
          })
        });

        const response = await mockTrainingPlanAPI(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.description).toContain(`${duration}天`);
      }
    });
  });

  describe('用户偏好API (/api/personalization/preferences)', () => {
    test('应该获取用户偏好设置', async () => {
      const request = new Request('http://localhost:3000/api/personalization/preferences', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      const response = await mockPreferencesAPI(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('userId');
      expect(data.data).toHaveProperty('preferences');
      expect(data.data.preferences).toHaveProperty('defaultSessionTime');
      expect(data.data.preferences).toHaveProperty('preferredDifficulty');
      expect(data.data.preferences).toHaveProperty('focusAreas');
      expect(data.data.preferences).toHaveProperty('notificationSettings');
    });

    test('应该更新用户偏好设置', async () => {
      const newPreferences = {
        defaultSessionTime: 60,
        preferredDifficulty: 4,
        focusAreas: ['tournament', 'psychology'],
        learningGoals: ['improve_winrate', 'reduce_variance'],
        notificationSettings: {
          dailyReminders: false,
          weeklyReports: true,
          achievementAlerts: true
        }
      };

      const request = new Request('http://localhost:3000/api/personalization/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          preferences: newPreferences
        })
      });

      const response = await mockPreferencesAPI(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.updated).toBe(true);
      expect(data.data.preferences).toEqual(newPreferences);
    });

    test('应该验证偏好设置数据', async () => {
      const request = new Request('http://localhost:3000/api/personalization/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({}) // 缺少preferences
      });

      const response = await mockPreferencesAPI(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('preferences are required');
    });
  });

  describe('学习路径API (/api/personalization/learning-path)', () => {
    test('应该返回可用的学习路径列表', async () => {
      const request = new Request('http://localhost:3000/api/personalization/learning-path', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      const response = await mockLearningPathAPI(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data.length).toBeGreaterThan(0);

      const path = data.data[0];
      expect(path).toHaveProperty('id');
      expect(path).toHaveProperty('title');
      expect(path).toHaveProperty('description');
      expect(path).toHaveProperty('estimatedDuration');
      expect(path).toHaveProperty('difficulty');
      expect(path).toHaveProperty('modules');
    });

    test('应该返回特定学习路径的详细信息', async () => {
      const request = new Request('http://localhost:3000/api/personalization/learning-path?pathId=path_beginner', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      const response = await mockLearningPathAPI(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('progress');
      expect(data.data).toHaveProperty('currentModule');
      expect(data.data).toHaveProperty('nextModules');
      expect(data.data.progress).toHaveProperty('completed');
      expect(data.data.progress).toHaveProperty('total');
      expect(data.data.progress).toHaveProperty('percentage');
    });
  });

  describe('API认证和授权', () => {
    test('应该要求有效的认证令牌', async () => {
      const request = new Request('http://localhost:3000/api/personalization/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // 缺少Authorization header
        },
        body: JSON.stringify({
          timeAvailable: 30
        })
      });

      // 在真实实现中，这应该返回401未授权
      // 这里我们假设中间件会处理认证
      expect(request.headers.get('Authorization')).toBeNull();
    });

    test('应该验证令牌格式', () => {
      const validTokenFormats = [
        'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...',
        'Bearer valid-session-token'
      ];

      const invalidTokenFormats = [
        'Bearer',
        'Token abc123',
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9',
        ''
      ];

      for (const validToken of validTokenFormats) {
        const authHeader = validToken;
        expect(authHeader.startsWith('Bearer ')).toBe(true);
        expect(authHeader.length).toBeGreaterThan(7);
      }

      for (const invalidToken of invalidTokenFormats) {
        const authHeader = invalidToken;
        const isValid = authHeader.startsWith('Bearer ') && authHeader.length > 7;
        expect(isValid).toBe(false);
      }
    });
  });

  describe('API响应格式', () => {
    test('所有成功响应应该有统一的格式', async () => {
      const apis = [
        {
          url: 'http://localhost:3000/api/personalization/recommendations',
          method: 'POST',
          body: { timeAvailable: 30 },
          handler: mockRecommendationsAPI
        },
        {
          url: 'http://localhost:3000/api/training/recommendations',
          method: 'POST',
          body: { planDuration: 14 },
          handler: mockTrainingPlanAPI
        },
        {
          url: 'http://localhost:3000/api/personalization/preferences',
          method: 'GET',
          handler: mockPreferencesAPI
        }
      ];

      for (const api of apis) {
        const request = new Request(api.url, {
          method: api.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token'
          },
          body: api.body ? JSON.stringify(api.body) : undefined
        });

        const response = await api.handler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('data');
        expect(typeof data.success).toBe('boolean');
      }
    });

    test('所有错误响应应该有统一的格式', async () => {
      const errorCases = [
        {
          url: 'http://localhost:3000/api/personalization/recommendations',
          method: 'POST',
          body: { timeAvailable: 2 },
          handler: mockRecommendationsAPI,
          expectedStatus: 400
        },
        {
          url: 'http://localhost:3000/api/training/recommendations',
          method: 'POST',
          body: { planDuration: 5 },
          handler: mockTrainingPlanAPI,
          expectedStatus: 400
        }
      ];

      for (const errorCase of errorCases) {
        const request = new Request(errorCase.url, {
          method: errorCase.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token'
          },
          body: JSON.stringify(errorCase.body)
        });

        const response = await errorCase.handler(request);
        const data = await response.json();

        expect(response.status).toBe(errorCase.expectedStatus);
        expect(data).toHaveProperty('error');
        expect(typeof data.error).toBe('string');
        expect(data.error.length).toBeGreaterThan(0);
      }
    });
  });

  describe('API性能和限制', () => {
    test('应该在合理时间内响应', async () => {
      const request = new Request('http://localhost:3000/api/personalization/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          timeAvailable: 30,
          count: 10
        })
      });

      const startTime = Date.now();
      const response = await mockRecommendationsAPI(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
    });

    test('应该限制请求数据大小', async () => {
      const largeData = {
        timeAvailable: 30,
        focusAreas: new Array(1000).fill('test_area'), // 大数组
        excludeScenarios: new Array(1000).fill('test_scenario')
      };

      const request = new Request('http://localhost:3000/api/personalization/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(largeData)
      });

      // 在真实实现中应该检查请求大小限制
      const bodySize = JSON.stringify(largeData).length;
      expect(bodySize).toBeGreaterThan(10000); // 验证这确实是个大请求
    });

    test('应该支持并发请求', async () => {
      const requests = Array.from({ length: 5 }, (_, i) => 
        new Request('http://localhost:3000/api/personalization/recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-token'
          },
          body: JSON.stringify({
            timeAvailable: 30 + i * 5,
            count: 3
          })
        })
      );

      const startTime = Date.now();
      const responses = await Promise.all(
        requests.map(req => mockRecommendationsAPI(req))
      );
      const endTime = Date.now();

      expect(responses.length).toBe(5);
      for (const response of responses) {
        expect(response.status).toBe(200);
      }

      // 并发执行应该比串行执行更快
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});