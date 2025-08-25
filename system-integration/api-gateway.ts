/**
 * PokerIQ Pro - 统一API网关
 * 集成所有微服务和模块
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const app = express();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const prisma = new PrismaClient();

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 每IP最多1000请求
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// 身份验证中间件
const authMiddleware = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // 验证JWT token
    const user = await redis.get(`auth:${token}`);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = JSON.parse(user);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// 微服务路由配置
const services = {
  gto: {
    target: process.env.GTO_SERVICE_URL || 'http://localhost:8001',
    changeOrigin: true,
    pathRewrite: { '^/api/gto': '' }
  },
  opponent: {
    target: process.env.OPPONENT_SERVICE_URL || 'http://localhost:8002',
    changeOrigin: true,
    pathRewrite: { '^/api/opponent': '' }
  },
  profile: {
    target: process.env.PROFILE_SERVICE_URL || 'http://localhost:8003',
    changeOrigin: true,
    pathRewrite: { '^/api/profile': '' }
  },
  recommendation: {
    target: process.env.RECOMMENDATION_SERVICE_URL || 'http://localhost:8004',
    changeOrigin: true,
    pathRewrite: { '^/api/recommendation': '' }
  }
};

// GTO服务路由
app.use('/api/gto', 
  authMiddleware,
  createProxyMiddleware(services.gto)
);

// AI对手服务路由
app.use('/api/opponent',
  authMiddleware, 
  createProxyMiddleware(services.opponent)
);

// 用户画像服务路由
app.use('/api/profile',
  authMiddleware,
  createProxyMiddleware(services.profile)
);

// 推荐服务路由
app.use('/api/recommendation',
  authMiddleware,
  createProxyMiddleware(services.recommendation)
);

// 训练会话管理 - 核心集成API
app.post('/api/training/start', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { trainingType, difficulty } = req.body;

    // 1. 获取用户技能画像
    const profileResponse = await fetch(`${services.profile.target}/profile/${userId}`);
    const userProfile = await profileResponse.json();

    // 2. 生成AI对手
    const opponentResponse = await fetch(`${services.opponent.target}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userLevel: userProfile.overallSkill,
        weaknesses: userProfile.primaryWeaknesses,
        trainingType
      })
    });
    const opponent = await opponentResponse.json();

    // 3. 获取GTO策略
    const gtoResponse = await fetch(`${services.gto.target}/strategy/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        difficulty,
        focusAreas: userProfile.weakAreas
      })
    });
    const gtoStrategy = await gtoResponse.json();

    // 4. 创建训练会话
    const session = await prisma.enhancedTrainingSession.create({
      data: {
        userId,
        sessionType: trainingType,
        targetSkills: userProfile.weakAreas,
        difficultyLevel: difficulty,
        aiOpponentTypes: [opponent.style],
        gtoAccuracyScore: 0,
        exploitationSuccessRate: 0
      }
    });

    // 5. 缓存会话状态
    await redis.setex(`session:${session.id}`, 3600, JSON.stringify({
      session,
      userProfile,
      opponent,
      gtoStrategy
    }));

    res.json({
      success: true,
      sessionId: session.id,
      opponent: opponent.config,
      gtoRecommendations: gtoStrategy.recommendations
    });

  } catch (error) {
    console.error('Training session start error:', error);
    res.status(500).json({ error: 'Failed to start training session' });
  }
});

// 训练决策处理 - 核心集成逻辑
app.post('/api/training/:sessionId/decision', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { action, gameState, decisionTime } = req.body;

    // 1. 获取会话状态
    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const { session, userProfile, opponent, gtoStrategy } = JSON.parse(sessionData);

    // 2. GTO分析
    const gtoAnalysis = await fetch(`${services.gto.target}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameState,
        userAction: action,
        strategy: gtoStrategy
      })
    });
    const gtoResult = await gtoAnalysis.json();

    // 3. 对手决策预测
    const opponentPrediction = await fetch(`${services.opponent.target}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameState,
        opponentStyle: opponent.style,
        userAction: action
      })
    });
    const opponentAction = await opponentPrediction.json();

    // 4. 技能评估更新
    const skillUpdate = await fetch(`${services.profile.target}/update-skill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.userId,
        decision: action,
        optimalDecision: gtoResult.optimalAction,
        decisionTime,
        gameContext: gameState
      })
    });

    // 5. 生成反馈和建议
    const feedback = {
      gtoAnalysis: gtoResult,
      opponentAction: opponentAction.action,
      skillImpact: await skillUpdate.json(),
      recommendations: gtoResult.improvements,
      nextOptimalPlay: gtoResult.nextRecommendation
    };

    // 6. 记录到分析数据库
    await fetch(`${process.env.ANALYTICS_SERVICE_URL}/events/training-decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: session.userId,
        sessionId,
        timestamp: new Date(),
        userAction: action,
        optimalAction: gtoResult.optimalAction,
        decisionTime,
        accuracy: gtoResult.accuracy,
        gameState
      })
    });

    res.json({
      success: true,
      feedback,
      opponentAction: opponentAction.action,
      sessionStatus: 'active'
    });

  } catch (error) {
    console.error('Decision processing error:', error);
    res.status(500).json({ error: 'Failed to process decision' });
  }
});

// 个性化推荐API
app.get('/api/training/recommendations/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // 并行获取数据
    const [profileData, recentSessions, recommendations] = await Promise.all([
      fetch(`${services.profile.target}/profile/${userId}`),
      prisma.enhancedTrainingSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      fetch(`${services.recommendation.target}/recommend/${userId}`)
    ]);

    const profile = await profileData.json();
    const recs = await recommendations.json();

    res.json({
      success: true,
      recommendations: recs.recommendations,
      userProfile: profile,
      recentActivity: recentSessions
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// 健康检查端点
app.get('/health', async (req, res) => {
  try {
    // 检查所有服务状态
    const healthChecks = await Promise.all([
      fetch(`${services.gto.target}/health`).catch(() => ({ ok: false })),
      fetch(`${services.opponent.target}/health`).catch(() => ({ ok: false })),
      fetch(`${services.profile.target}/health`).catch(() => ({ ok: false })),
      fetch(`${services.recommendation.target}/health`).catch(() => ({ ok: false }))
    ]);

    const allHealthy = healthChecks.every(check => check.ok);

    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'degraded',
      services: {
        gto: healthChecks[0].ok,
        opponent: healthChecks[1].ok,
        profile: healthChecks[2].ok,
        recommendation: healthChecks[3].ok
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 错误处理中间件
app.use((error: any, req: any, res: any, next: any) => {
  console.error('API Gateway Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 PokerIQ Pro API Gateway running on port ${PORT}`);
  console.log(`🔗 Services configured:`);
  console.log(`   - GTO Service: ${services.gto.target}`);
  console.log(`   - Opponent Service: ${services.opponent.target}`);
  console.log(`   - Profile Service: ${services.profile.target}`);
  console.log(`   - Recommendation Service: ${services.recommendation.target}`);
});

export default app;