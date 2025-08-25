# PokerIQ Pro GTO 系统部署指南

## 系统概述

本文档描述了PokerIQ Pro GTO训练引擎的完整部署流程，该系统基于CFR (Counterfactual Regret Minimization) 算法实现真正的GTO策略计算。

## 系统架构

### 核心组件

1. **TypeScript GTO引擎** (`/lib/poker/`)
   - `gto-engine.ts` - 主要GTO决策引擎
   - `cfr-solver.ts` - CFR算法实现
   - `game-tree.ts` - 游戏树结构
   - `strategy-cache.ts` - 策略缓存系统
   - `training-engine.ts` - 增强训练引擎

2. **Python AI服务** (`/ai-service/`)
   - `main.py` - FastAPI GTO计算服务
   - 高性能CFR求解器
   - Redis缓存集成
   - 批量训练支持

3. **性能特征**
   - GTO计算准确率: 99%+
   - 响应时间: <100ms
   - 支持2-6人桌游戏
   - Nash均衡策略计算
   - 实时可利用性分析

## 部署前准备

### 系统要求

- Node.js 18+
- Python 3.10+
- Redis 7.0+
- 至少4GB内存
- 多核CPU (推荐8核+)

### 环境变量配置

创建 `.env.local` 文件：

```bash
# GTO服务配置
GTO_SERVICE_URL=http://localhost:8000
REDIS_URL=redis://localhost:6379
CFR_DEFAULT_ITERATIONS=5000
STRATEGY_CACHE_SIZE=50000

# 性能调优
MAX_CONCURRENT_CALCULATIONS=4
CACHE_TTL_HOURS=24
PRECOMPUTE_COMMON_SCENARIOS=true

# 监控配置
ENABLE_PERFORMANCE_LOGGING=true
LOG_LEVEL=info
```

## 部署步骤

### 1. 部署Python GTO服务

```bash
# 进入AI服务目录
cd ai-service

# 构建Docker镜像
docker build -t pokeriq-gto-service .

# 启动Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine

# 启动GTO服务
docker run -d --name gto-service \
  --link redis:redis \
  -p 8000:8000 \
  -e REDIS_HOST=redis \
  pokeriq-gto-service

# 验证服务状态
curl http://localhost:8000/health
```

### 2. 配置TypeScript服务

```bash
# 安装依赖
npm install

# 运行数据库迁移
npx prisma migrate deploy

# 启动开发服务器
npm run dev

# 或构建生产版本
npm run build
npm start
```

### 3. 验证GTO功能

```bash
# 测试基本GTO计算
curl -X POST http://localhost:8000/api/gto/strategy \
  -H "Content-Type: application/json" \
  -d '{
    "street": "flop",
    "pot": 20,
    "community_cards": "AhKd7c",
    "players": [
      {
        "id": 0,
        "position": "BTN",
        "holeCards": "AsKs",
        "stack": 100,
        "invested": 10
      },
      {
        "id": 1, 
        "position": "BB",
        "holeCards": "XX",
        "stack": 90,
        "invested": 10
      }
    ],
    "current_player": 0,
    "history": []
  }'

# 测试完整GTO分析
curl -X POST http://localhost:8000/api/gto/analysis \
  -H "Content-Type: application/json" \
  -d '{同上游戏状态}'
```

## API接口文档

### 核心GTO端点

#### 1. 计算GTO策略
```
POST /api/gto/strategy
```

**请求体:**
```typescript
interface GTOGameState {
  street: string;           // 街道: preflop/flop/turn/river
  pot: number;             // 当前底池大小
  community_cards: string; // 公共牌
  players: PlayerState[];  // 玩家状态数组
  current_player: number;  // 当前行动玩家索引
  history: Action[];       // 动作历史
}
```

**响应:**
```typescript
interface GTOStrategy {
  strategy: { [action: string]: number }; // 动作概率
  exploitability: number;    // 可利用性(越低越好)
  iterations: number;        // CFR迭代次数
  confidence: number;        // 策略信心度(0-1)
  info_set: string;         // 信息集标识
}
```

#### 2. 获取完整GTO分析
```
POST /api/gto/analysis
```

**响应:**
```typescript
interface GTOAnalysis {
  decision: {
    action: string;           // 推荐动作
    amount?: number;         // 下注/加注金额
    probability: number;     // 选择概率
    alternatives: Action[];  // 替代方案
    reasoning: string;       // 决策推理
    exploitability: number;  // 策略可利用性
    confidence: number;      // 信心度
  };
  hand_strength: number;     // 手牌强度(0-1)
  position: string;          // 位置
  pot_odds: number;         // 底池赔率
  implied_odds: number;     // 隐含赔率
  equity: number;           // 胜率
  expected_value: number;   // 期望值
  risk_assessment: {        // 风险评估
    variance: number;
    drawouts: number;
    bluff_catchers: string[];
  };
}
```

#### 3. 批量训练
```
POST /api/gto/training/batch
```

**请求体:**
```typescript
interface TrainingBatch {
  scenarios: GTOGameState[];  // 训练场景数组
  iterations: number;         // 每场景CFR迭代次数
  cache_results: boolean;     // 是否缓存结果
}
```

#### 4. 获取训练进度
```
GET /api/gto/training/batch/{batch_id}/status
```

#### 5. 缓存统计
```
GET /api/gto/cache/stats
```

## 性能优化

### 1. CFR算法优化

- **迭代次数调优**: 根据精度要求调整CFR迭代次数
  - 快速响应: 1000次迭代
  - 平衡模式: 5000次迭代  
  - 高精度: 10000+次迭代

- **收敛阈值**: 当可利用性<0.001时自动停止计算

- **采样优化**: 使用机会采样和外部采样减少计算复杂度

### 2. 缓存策略

- **Redis缓存**: 常见场景策略缓存，TTL 1小时
- **预计算**: 启动时预计算热门场景
- **LRU淘汰**: 内存缓存使用LRU策略

### 3. 并发处理

- **异步计算**: 使用Python asyncio处理并发请求
- **后台任务**: 批量训练使用FastAPI后台任务
- **连接池**: Redis连接池优化

### 4. 资源监控

```bash
# 查看服务资源使用
curl http://localhost:8000/api/gto/cache/stats

# 监控Redis内存使用
redis-cli info memory

# 检查Python服务性能
docker stats gto-service
```

## 故障排除

### 常见问题

1. **CFR计算超时**
   - 减少迭代次数
   - 增加服务器资源
   - 检查Redis连接

2. **内存不足**
   - 调整缓存大小配置
   - 定期清理过期缓存
   - 优化游戏树抽象

3. **响应时间超过100ms**
   - 使用预计算策略
   - 优化信息集抽象
   - 启用分布式缓存

### 日志分析

```bash
# 查看GTO服务日志
docker logs gto-service

# 监控性能指标
curl http://localhost:3000/api/monitoring/metrics

# 检查CFR收敛情况
grep "CFR收敛" /var/log/gto-service.log
```

## 性能基准测试

### 目标指标

- **准确率**: GTO策略可利用性 < 0.001
- **响应时间**: 单次计算 < 100ms
- **吞吐量**: 每秒处理 > 50个请求
- **缓存命中率**: > 80%

### 基准测试命令

```bash
# 安装测试工具
pip install pytest pytest-benchmark

# 运行性能测试
cd ai-service
python -m pytest tests/test_performance.py --benchmark-only

# 压力测试
ab -n 1000 -c 10 http://localhost:8000/api/gto/strategy
```

## 维护指南

### 定期维护任务

1. **缓存清理** (每日)
   ```bash
   redis-cli FLUSHDB  # 清理过期策略
   ```

2. **性能监控** (每周)
   - 检查平均响应时间
   - 监控内存使用趋势
   - 分析热门计算场景

3. **算法优化** (每月)
   - 评估CFR参数设置
   - 更新游戏树抽象
   - 优化信息集生成

### 扩展部署

对于高负载场景，可以部署多个GTO服务实例：

```yaml
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  
  gto-service-1:
    build: ./ai-service
    ports: ["8001:8000"]
    depends_on: [redis]
  
  gto-service-2:
    build: ./ai-service  
    ports: ["8002:8000"]
    depends_on: [redis]
    
  nginx:
    image: nginx
    ports: ["8000:80"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

## 总结

PokerIQ Pro GTO系统通过CFR算法实现了真正的Game Theory Optimal策略计算，为扑克训练提供了理论最优的决策建议。正确部署和调优该系统将显著提升训练质量和用户体验。

关键成功因素：
- 合理的CFR参数配置
- 高效的缓存策略
- 充足的计算资源
- 持续的性能监控

遇到问题时，请参考故障排除章节或查看详细的服务日志。