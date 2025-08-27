# PokerIQ Pro 个性化系统完整指南

## 概述

PokerIQ Pro个性化系统是一个全面的机器学习驱动平台，为每位用户提供定制化的德州扑克训练体验。系统通过分析用户行为、技能水平和学习偏好，智能推荐最适合的训练内容和学习路径。

## 系统架构

### 核心组件

```
┌─────────────────────────────────────────────────┐
│                 前端界面层                        │
├─────────────────────────────────────────────────┤
│  个性化仪表板  │  推荐组件  │  用户偏好面板        │
└─────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────┐
│                API集成层                         │
├─────────────────────────────────────────────────┤
│  PersonalizationIntegration  │  事件总线         │
└─────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────┐
│                核心引擎层                        │
├─────────────────────────────────────────────────┤
│ 推荐引擎 │ 用户画像 │ ML算法 │ 缓存系统 │ 监控    │
└─────────────────────────────────────────────────┘
                        │
┌─────────────────────────────────────────────────┐
│                数据存储层                        │
├─────────────────────────────────────────────────┤
│    PostgreSQL    │    Redis    │    文件存储      │
└─────────────────────────────────────────────────┘
```

### 主要模块

1. **推荐引擎** (`lib/personalization/recommendation-engine.ts`)
   - 基于协同过滤和内容的混合推荐算法
   - 实时生成个性化训练推荐
   - 支持多维度评分和上下文感知

2. **用户画像系统** (`lib/personalization/user-profiler.ts`)
   - 动态分析用户技能维度
   - 识别学习模式和弱点
   - 跟踪学习进度和偏好

3. **集成层** (`lib/integration/personalization-integration.ts`)
   - 统一API接口
   - 事件驱动架构
   - 会话管理和缓存

4. **性能缓存** (`lib/performance/personalization-cache.ts`)
   - 多级缓存策略
   - 智能预取机制
   - 压缩和优化

5. **监控指标** (`lib/monitoring/personalization-metrics.ts`)
   - 实时性能监控
   - 用户行为分析
   - A/B测试支持

## 快速开始

### 1. 安装和配置

```bash
# 克隆项目
git clone <repository-url>
cd pokeriq-pro

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑.env文件设置数据库和Redis连接
```

### 2. 环境变量设置

```bash
# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=pokeriq_personalization
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_PERSONALIZATION_DB=0
REDIS_CACHE_DB=1
REDIS_METRICS_DB=2

# 个性化系统配置
PERSONALIZATION_ENABLE_DEEP_LEARNING=false
PERSONALIZATION_CACHE_TTL=1800
PERSONALIZATION_MAX_RECOMMENDATIONS=20
```

### 3. 数据库初始化

```bash
# 运行数据库迁移
npx prisma db push

# 执行个性化系统相关的迁移
npx prisma db execute --file prisma/migrations/add_personalization_system.sql

# 初始化种子数据
npm run seed:personalization
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

## API文档

### 获取个性化推荐

**端点**: `POST /api/personalization/recommendations`

**请求体**:
```json
{
  "timeAvailable": 30,
  "preferredDifficulty": 3,
  "focusAreas": ["preflop", "postflop"],
  "excludeScenarios": ["tournament"],
  "count": 5
}
```

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "rec_123",
      "title": "翻前开牌范围训练",
      "description": "学习不同位置的标准开牌范围",
      "scenario": "PREFLOP_RANGES",
      "difficulty": 2,
      "estimatedTime": 25,
      "expectedImprovement": 30,
      "priority": 0.85,
      "reasoning": "基于您的游戏历史分析，翻前决策是主要改进点",
      "skillFocus": ["preflop"],
      "learningStyle": ["visual", "theoretical"]
    }
  ],
  "metadata": {
    "requestId": "req_456",
    "processingTime": 150,
    "cacheHit": false
  }
}
```

### 生成训练计划

**端点**: `POST /api/training/recommendations`

**请求体**:
```json
{
  "planDuration": 30,
  "intensity": "moderate",
  "goals": ["improve_winrate", "reduce_variance"]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "userId": "user_123",
    "planId": "plan_789",
    "title": "30天技能提升计划",
    "description": "针对您当前水平定制的综合训练计划",
    "estimatedDuration": 45,
    "expectedOverallImprovement": 120,
    "recommendations": [...],
    "milestones": [
      {
        "id": "milestone_1",
        "title": "阶段1: 基础巩固",
        "description": "完成翻前和基本数学训练",
        "targetSkill": "preflop",
        "targetImprovement": 40,
        "estimatedTimeToComplete": 10
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "difficulty": 3
  }
}
```

### 更新用户偏好

**端点**: `POST /api/personalization/preferences`

**请求体**:
```json
{
  "preferences": {
    "defaultSessionTime": 45,
    "preferredDifficulty": 3,
    "focusAreas": ["preflop", "postflop", "psychology"],
    "learningGoals": ["improve_winrate", "tournament_success"],
    "notificationSettings": {
      "dailyReminders": true,
      "weeklyReports": true,
      "achievementAlerts": true
    }
  }
}
```

### 获取学习路径

**端点**: `GET /api/personalization/learning-path`

**查询参数**:
- `pathId` (可选): 特定路径ID
- `userId`: 用户ID

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "path_beginner",
      "title": "新手入门路径",
      "description": "从零开始的德州扑克学习之旅",
      "estimatedDuration": 60,
      "difficulty": 1,
      "modules": [
        "基础规则与概念",
        "手牌价值评估",
        "位置重要性",
        "基本数学计算"
      ],
      "progress": {
        "completed": 2,
        "total": 4,
        "percentage": 50
      }
    }
  ]
}
```

## 前端组件使用

### 个性化仪表板

```tsx
import { PersonalizationDashboard } from '@/components/personalization/PersonalizationDashboard';

function UserDashboard({ userId }: { userId: string }) {
  return (
    <div className="container mx-auto p-6">
      <PersonalizationDashboard userId={userId} />
    </div>
  );
}
```

### 推荐卡片

```tsx
import { RecommendationCard } from '@/components/personalization/RecommendationCard';

function RecommendationsList({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {recommendations.map((rec) => (
        <RecommendationCard
          key={rec.id}
          recommendation={rec}
          onSelect={(id) => console.log('Selected:', id)}
          onDismiss={(id) => console.log('Dismissed:', id)}
        />
      ))}
    </div>
  );
}
```

### 技能雷达图

```tsx
import { SkillRadar } from '@/components/personalization/SkillRadar';

function UserProfile({ skills }: { skills: SkillDimensions }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <SkillRadar skills={skills} maxValue={2000} />
    </div>
  );
}
```

### 偏好设置面板

```tsx
import { PreferencesPanel } from '@/components/personalization/PreferencesPanel';

function SettingsPage() {
  const handleSave = (preferences: UserPreferences) => {
    // 保存偏好设置
    console.log('Saving preferences:', preferences);
  };

  return (
    <PreferencesPanel
      initialPreferences={userPreferences}
      onSave={handleSave}
      onCancel={() => console.log('Cancelled')}
    />
  );
}
```

## 核心算法详解

### 1. 协同过滤算法

协同过滤基于"相似用户喜欢相似内容"的假设：

```typescript
// 用户相似度计算
function calculateUserSimilarity(user1: UserProfile, user2: UserProfile): number {
  const commonItems = findCommonItems(user1, user2);
  if (commonItems.length === 0) return 0;

  // 余弦相似度
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (const item of commonItems) {
    const rating1 = user1.getRating(item);
    const rating2 = user2.getRating(item);
    
    dotProduct += rating1 * rating2;
    norm1 += rating1 * rating1;
    norm2 += rating2 * rating2;
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}
```

### 2. 基于内容的过滤

基于物品特征和用户偏好的匹配：

```typescript
// 计算内容相关度
function calculateContentRelevance(user: UserProfile, item: TrainingItem): number {
  const userProfile = user.getFeatureVector();
  const itemFeatures = item.getFeatureVector();

  // 加权余弦相似度
  let weightedDotProduct = 0;
  let userNorm = 0;
  let itemNorm = 0;

  for (let i = 0; i < userProfile.length; i++) {
    const weight = getFeatureWeight(i);
    weightedDotProduct += userProfile[i] * itemFeatures[i] * weight;
    userNorm += userProfile[i] * userProfile[i] * weight;
    itemNorm += itemFeatures[i] * itemFeatures[i] * weight;
  }

  return weightedDotProduct / (Math.sqrt(userNorm) * Math.sqrt(itemNorm));
}
```

### 3. 混合推荐算法

结合协同过滤和基于内容的优势：

```typescript
function generateHybridRecommendations(
  user: UserProfile, 
  context: RecommendationContext
): Recommendation[] {
  const cfRecommendations = collaborativeFiltering(user, context);
  const cbRecommendations = contentBasedFiltering(user, context);

  // 动态权重分配
  const cfWeight = calculateDynamicWeight(user, 'collaborative');
  const cbWeight = 1 - cfWeight;

  // 加权合并
  const hybridScores = new Map<string, number>();
  
  cfRecommendations.forEach(rec => {
    hybridScores.set(rec.id, cfWeight * rec.score);
  });
  
  cbRecommendations.forEach(rec => {
    const currentScore = hybridScores.get(rec.id) || 0;
    hybridScores.set(rec.id, currentScore + cbWeight * rec.score);
  });

  return sortAndFilterRecommendations(hybridScores, context);
}
```

## 用户画像系统

### 技能维度分析

系统跟踪用户在5个主要技能维度上的表现：

1. **翻前技能** (Preflop)
   - 开牌范围准确性
   - 位置感知
   - 3-bet/4-bet策略

2. **翻后技能** (Postflop)
   - 持续下注决策
   - 转牌河牌策略
   - 底池控制

3. **心理技能** (Psychology)
   - 对手读牌
   - 诈唬识别
   - 情绪控制

4. **数学技能** (Mathematics)
   - 底池赔率计算
   - 隐含赔率理解
   - EV计算准确性

5. **资金管理** (Bankroll Management)
   - 风险控制
   - 游戏选择
   - 止损策略

### 学习风格识别

系统识别4种学习风格：

```typescript
interface LearningStyle {
  visualLearner: number;     // 视觉学习者
  practicalLearner: number;  // 实践学习者
  theoreticalLearner: number; // 理论学习者
  socialLearner: number;     // 社交学习者
}

function identifyLearningStyle(user: UserProfile): LearningStyle {
  const interactions = user.getInteractionHistory();
  
  return {
    visualLearner: calculateVisualPreference(interactions),
    practicalLearner: calculatePracticalPreference(interactions),
    theoreticalLearner: calculateTheoreticalPreference(interactions),
    socialLearner: calculateSocialPreference(interactions)
  };
}
```

### 弱点模式识别

系统自动识别常见的游戏弱点：

```typescript
interface WeaknessPattern {
  pattern: string;    // 弱点类型
  frequency: number;  // 出现频率
  severity: number;   // 严重程度
  street: string;     // 发生阶段
  examples: GameAction[]; // 具体例子
}

const COMMON_WEAKNESSES = [
  '过度保守',
  '过度激进',
  '错失价值',
  '下注过大',
  '翻前范围错误',
  '河牌决策错误',
  '重大决策失误',
  '时机把握不当'
];
```

## 性能优化

### 缓存策略

系统采用多级缓存提高响应速度：

1. **L1缓存 (内存LRU)**
   - 存储最近访问的数据
   - 毫秒级访问速度
   - 自动淘汰机制

2. **L2缓存 (Redis)**
   - 持久化热点数据
   - 支持集群部署
   - 智能预取策略

```typescript
// 缓存使用示例
@Cacheable('user_recommendations_{userId}', 1800, ['recommendations', 'user_profile'])
async function getUserRecommendations(userId: string): Promise<Recommendation[]> {
  // 生成推荐的复杂逻辑
  return await generateRecommendations(userId);
}
```

### 预取机制

系统根据用户行为模式预测数据需求：

```typescript
interface PrefetchRule {
  pattern: string;       // 触发模式
  dependencies: string[]; // 相关数据
  priority: number;      // 优先级
  condition?: (context: any) => boolean; // 预取条件
}

const PREFETCH_RULES: PrefetchRule[] = [
  {
    pattern: 'user_recommendations:*',
    dependencies: ['user_profile:*', 'training_history:*'],
    priority: 10,
    condition: (ctx) => ctx.timeAvailable > 30
  }
];
```

## 监控和分析

### 关键指标

系统持续监控以下指标：

1. **推荐准确性**
   - 点击通过率 (CTR)
   - 转化率
   - 用户满意度评分

2. **系统性能**
   - 响应时间
   - 缓存命中率
   - 错误率

3. **用户参与度**
   - 会话时长
   - 功能使用频率
   - 留存率

### 实时监控面板

```typescript
// 获取实时监控数据
const dashboardData = await metrics.getDashboardMetrics();

// 示例数据结构
{
  realTimeStats: {
    recommendation_viewed: 150,
    recommendation_selected: 45,
    training_started: 32
  },
  recentPerformance: [...],
  topAlerts: [
    {
      type: 'cache_performance',
      message: '缓存命中率过低: 45%',
      severity: 'medium'
    }
  ]
}
```

### A/B测试支持

系统内置A/B测试框架：

```typescript
// 检查用户是否在实验中
const experimentVariant = config.getExperimentVariant('new_algorithm', userId);

if (experimentVariant === 'treatment') {
  // 使用新算法
  recommendations = await newAlgorithm.getRecommendations(userId);
} else {
  // 使用控制组算法
  recommendations = await currentAlgorithm.getRecommendations(userId);
}

// 记录实验指标
await metrics.trackExperimentEvent('new_algorithm', userId, {
  variant: experimentVariant,
  action: 'recommendation_generated',
  outcome: recommendations.length
});
```

## 部署指南

### 环境要求

- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- 内存: 至少2GB
- 存储: 至少10GB

### Docker部署

```dockerfile
# Dockerfile示例
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/pokeriq
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:13
    environment:
      POSTGRES_DB: pokeriq
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 生产环境配置

```bash
# 环境变量设置
export NODE_ENV=production
export DATABASE_SSL=true
export REDIS_CLUSTER=true
export PERSONALIZATION_CACHE_AGGRESSIVE=true
export MONITORING_ENABLED=true

# 启动服务
npm run start:prod
```

### 健康检查

```typescript
// 健康检查端点
app.get('/health/personalization', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      cache: await checkCacheHealth(),
      algorithms: await checkAlgorithmHealth()
    }
  };

  const isHealthy = Object.values(health.services).every(service => service.status === 'ok');
  
  res.status(isHealthy ? 200 : 503).json(health);
});
```

## 故障排除

### 常见问题

1. **推荐质量差**
   - 检查用户数据量是否充足
   - 验证算法权重配置
   - 查看用户画像更新频率

2. **响应速度慢**
   - 检查缓存命中率
   - 监控数据库查询性能
   - 确认Redis连接状态

3. **内存使用过高**
   - 调整LRU缓存大小
   - 检查是否有内存泄漏
   - 优化数据结构

### 日志分析

```bash
# 查看个性化系统日志
tail -f logs/personalization.log

# 过滤错误日志
grep "ERROR" logs/personalization.log | tail -20

# 监控性能指标
grep "performance" logs/personalization.log | tail -10
```

### 性能调优

1. **数据库优化**
   ```sql
   -- 添加必要的索引
   CREATE INDEX idx_user_interactions_timestamp ON user_interactions(user_id, timestamp);
   CREATE INDEX idx_recommendations_score ON recommendations(user_id, score DESC);
   ```

2. **缓存调优**
   ```typescript
   // 调整缓存配置
   const cacheConfig = {
     l1MaxSize: 5000,        // 增加L1缓存大小
     l1TTL: 600000,          // 延长TTL
     prefetchThreshold: 0.8,  // 提高预取阈值
     compressionEnabled: true // 启用压缩
   };
   ```

3. **算法优化**
   ```typescript
   // 优化推荐算法参数
   const algorithmConfig = {
     collaborative: {
       neighborhoodSize: 30,      // 减少邻居数量
       minRatings: 3,             // 降低最小评分要求
       similarityThreshold: 0.2   // 提高相似度阈值
     }
   };
   ```

## 扩展和定制

### 添加新的推荐算法

```typescript
// 1. 实现算法接口
class CustomRecommendationAlgorithm implements RecommendationAlgorithm {
  async generateRecommendations(
    user: UserProfile,
    context: RecommendationContext
  ): Promise<Recommendation[]> {
    // 自定义推荐逻辑
    return recommendations;
  }
}

// 2. 注册算法
const algorithmRegistry = new AlgorithmRegistry();
algorithmRegistry.register('custom', new CustomRecommendationAlgorithm());

// 3. 配置使用
const config = {
  algorithms: {
    custom: {
      enabled: true,
      weight: 0.3
    }
  }
};
```

### 自定义用户画像特征

```typescript
// 扩展用户画像
interface ExtendedUserProfile extends UserSkillProfile {
  customFeatures: {
    riskTolerance: number;
    gameTypePreference: string[];
    sessionTimePreference: number;
  };
}

// 自定义特征提取器
class CustomFeatureExtractor {
  extractFeatures(gameHistory: GameSession[]): CustomFeatures {
    // 特征提取逻辑
    return features;
  }
}
```

### 添加新的监控指标

```typescript
// 自定义指标收集器
class CustomMetricsCollector {
  async collectCustomMetrics(): Promise<CustomMetrics> {
    return {
      userEngagementScore: await this.calculateEngagement(),
      contentDiversityIndex: await this.calculateDiversity(),
      algorithmEffectiveness: await this.calculateEffectiveness()
    };
  }
}

// 注册自定义指标
metrics.registerCustomCollector('engagement', new CustomMetricsCollector());
```

## 最佳实践

### 代码组织

1. **模块化设计**
   - 按功能分离模块
   - 使用依赖注入
   - 保持接口稳定

2. **错误处理**
   - 实现优雅降级
   - 记录详细错误信息
   - 提供备用策略

3. **测试策略**
   - 单元测试覆盖核心逻辑
   - 集成测试验证API
   - 性能测试确保响应时间

### 数据管理

1. **数据质量**
   - 验证输入数据
   - 清理异常值
   - 定期数据审计

2. **隐私保护**
   - 匿名化敏感数据
   - 实现数据删除
   - 遵循GDPR要求

3. **备份策略**
   - 定期数据备份
   - 测试恢复流程
   - 多地域复制

### 性能优化

1. **预计算策略**
   - 离线计算用户画像
   - 批量更新推荐
   - 预生成热点数据

2. **资源管理**
   - 监控内存使用
   - 限制并发请求
   - 优化垃圾回收

3. **扩展性设计**
   - 水平扩展支持
   - 负载均衡配置
   - 数据分片策略

## 版本更新和维护

### 版本管理

系统采用语义化版本控制：

- **主版本号**: 不兼容的API修改
- **次版本号**: 向后兼容的功能性新增
- **修订号**: 向后兼容的问题修正

### 升级流程

1. **测试环境验证**
   - 运行完整测试套件
   - 验证数据迁移
   - 性能基准测试

2. **灰度发布**
   - 小范围用户测试
   - 监控关键指标
   - 收集用户反馈

3. **全量发布**
   - 逐步扩大范围
   - 实时监控异常
   - 准备快速回滚

### 维护任务

1. **日常维护**
   - 清理过期数据
   - 更新算法参数
   - 性能调优

2. **定期任务**
   - 用户画像重建
   - 推荐模型重训练
   - 系统健康检查

3. **监控告警**
   - 设置阈值告警
   - 自动故障恢复
   - 紧急响应流程

## 贡献指南

### 开发环境设置

```bash
# 克隆仓库
git clone <repository-url>
cd pokeriq-pro

# 安装开发依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 代码格式化
npm run format

# 类型检查
npm run type-check
```

### 提交规范

遵循Conventional Commits规范：

```bash
# 功能新增
git commit -m "feat(personalization): add new recommendation algorithm"

# 问题修复
git commit -m "fix(cache): resolve memory leak in LRU cache"

# 文档更新
git commit -m "docs(api): update recommendation API documentation"

# 性能优化
git commit -m "perf(algorithm): improve collaborative filtering performance"
```

### Pull Request流程

1. **创建功能分支**
   ```bash
   git checkout -b feature/new-algorithm
   ```

2. **开发和测试**
   - 编写代码
   - 添加测试
   - 确保测试通过

3. **提交PR**
   - 填写详细描述
   - 关联相关issue
   - 请求代码审查

4. **代码审查**
   - 响应审查意见
   - 修复问题
   - 更新文档

## 支持和社区

### 获取帮助

1. **文档查阅**
   - 查看本指南
   - 浏览API文档
   - 搜索常见问题

2. **问题反馈**
   - GitHub Issues
   - 技术论坛
   - 开发者社群

3. **联系方式**
   - 邮箱: dev@pokeriq.com
   - Discord: PokerIQ开发者频道
   - 微信群: 扫描二维码加入

### 贡献方式

1. **代码贡献**
   - 修复bug
   - 添加功能
   - 性能优化

2. **文档贡献**
   - 完善文档
   - 翻译内容
   - 示例代码

3. **社区建设**
   - 回答问题
   - 分享经验
   - 组织活动

---

## 附录

### A. API错误代码

| 错误代码 | 说明 | 解决方案 |
|---------|------|----------|
| PERS_001 | 用户未找到 | 检查用户ID是否正确 |
| PERS_002 | 推荐生成失败 | 检查用户数据完整性 |
| PERS_003 | 缓存服务不可用 | 检查Redis连接 |
| PERS_004 | 算法配置错误 | 验证算法参数 |
| PERS_005 | 数据库连接失败 | 检查数据库状态 |

### B. 配置参数详解

详细的配置参数说明请参考 `config/personalization.config.ts` 文件中的注释和类型定义。

### C. 算法性能基准

| 算法类型 | 平均响应时间 | 内存使用 | 准确率 |
|---------|-------------|----------|--------|
| 协同过滤 | 120ms | 256MB | 78% |
| 基于内容 | 80ms | 128MB | 72% |
| 混合算法 | 150ms | 320MB | 82% |
| 深度学习 | 300ms | 512MB | 85% |

### D. 数据库表结构

主要数据库表的详细结构请参考 `prisma/schema.prisma` 文件。

### E. 示例代码库

完整的示例代码和使用场景请查看项目的 `examples/` 目录。

---

*最后更新时间: 2024年1月15日*  
*版本: v1.0.0*  
*文档维护者: PokerIQ开发团队*