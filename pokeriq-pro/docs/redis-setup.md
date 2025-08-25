# Redis缓存配置指南

## 概述
PokerIQ Pro使用Redis作为缓存层，提供高性能的数据访问和速率限制功能。

## 快速开始

### 1. 使用Docker Compose（推荐）
```bash
# 启动Redis服务
docker-compose up -d redis

# 启动Redis和管理工具（开发环境）
docker-compose --profile dev up -d

# 查看Redis日志
docker-compose logs -f redis
```

### 2. 本地安装Redis
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# 验证Redis运行状态
redis-cli ping
```

## 访问管理工具

- **Redis Commander**: http://localhost:8081
  - 可视化管理Redis数据
  - 监控性能指标
  - 执行命令

## 缓存架构

### 缓存键命名规范
```
user:{userId}              # 用户信息
session:{sessionId}        # 会话数据
stats:{userId}             # 用户统计
leaderboard:{type}:{cat}   # 排行榜
achievement:user:{userId}  # 用户成就
training:sessions:{userId} # 训练记录
companion:user:{userId}    # AI伴侣
rate_limit:{identifier}    # 速率限制
```

### TTL配置
- SHORT: 60秒（频繁变化的数据）
- MEDIUM: 5分钟（统计数据）
- LONG: 1小时（用户信息）
- DAY: 24小时（静态数据）
- WEEK: 7天（成就、配置）

## 核心功能

### 1. 缓存策略
- **Cache-Aside**: 懒加载，按需缓存
- **Write-Through**: 同步更新缓存和数据库
- **Cache Warmup**: 预热热点数据

### 2. 速率限制
```typescript
// API限制配置
- 登录: 5次/5分钟
- 注册: 3次/小时
- 训练API: 30次/分钟
- 全局限制: 100次/分钟
```

### 3. 缓存失效策略
- 用户数据更新时自动失效相关缓存
- 游戏结束时更新统计和排行榜
- 成就解锁时刷新成就缓存

## React Hooks使用

### useCachedData
```typescript
const { data, loading, error, refresh } = useCachedData(
  'user:123',
  fetchUserData,
  { ttl: 3600 }
);
```

### useRateLimit
```typescript
const { isAllowed, remaining, checkLimit } = useRateLimit(
  'api:login',
  5,
  300
);
```

### useOptimisticCache
```typescript
const { data, syncing, optimisticUpdate } = useOptimisticCache(
  'user:profile',
  initialData
);
```

## API端点

### 健康检查
```bash
GET /api/cache/health

# 响应示例
{
  "status": "healthy",
  "redis": {
    "connected": true,
    "version": "7.2.3",
    "responseTime": "2ms",
    "dbSize": 1234,
    "memory": {
      "used": "12.5MB",
      "max": "256MB"
    }
  }
}
```

### 清空缓存（仅开发环境）
```bash
DELETE /api/cache/health
```

## 性能优化

### 1. 批量操作
使用`mget`和`mset`减少网络往返

### 2. Pipeline
批量执行命令，减少延迟

### 3. 连接池
自动管理连接，支持断线重连

### 4. 内存管理
- 设置最大内存: 256MB
- LRU淘汰策略: allkeys-lru
- 持久化: AOF (appendonly)

## 监控和调试

### 查看Redis状态
```bash
# 连接到Redis
docker exec -it pokeriq-redis redis-cli

# 常用命令
INFO       # 查看服务器信息
DBSIZE     # 查看键数量
KEYS *     # 列出所有键（慎用）
MONITOR    # 实时监控命令
```

### 性能分析
```bash
# 慢查询日志
SLOWLOG GET 10

# 内存分析
MEMORY STATS

# 客户端连接
CLIENT LIST
```

## 生产环境配置

### 1. 环境变量
```env
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_DB=0
```

### 2. 集群配置
- 使用Redis Cluster实现高可用
- 配置主从复制
- 启用哨兵模式

### 3. 安全建议
- 设置强密码
- 限制访问IP
- 禁用危险命令
- 启用SSL/TLS

## 故障排查

### 常见问题

1. **连接失败**
   - 检查Redis服务是否运行
   - 验证端口是否正确
   - 确认防火墙规则

2. **内存不足**
   - 检查maxmemory配置
   - 查看淘汰策略
   - 分析大键

3. **性能问题**
   - 检查慢查询
   - 优化数据结构
   - 使用批量操作

## 相关文件
- `/lib/cache/redis.ts` - Redis客户端配置
- `/lib/cache/strategies.ts` - 缓存策略实现
- `/lib/cache/hooks.ts` - React缓存Hooks
- `/lib/cache/middleware.ts` - 中间件实现
- `/docker-compose.yml` - Docker配置