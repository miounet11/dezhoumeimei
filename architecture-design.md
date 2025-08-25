# 德州扑克AI训练工具 - 系统架构设计文档

## 1. 系统架构概述

### 1.1 架构原则
- **微服务架构**：模块化设计，支持独立部署和扩展
- **高可用性**：支持10万+用户同时在线，99.9%可用性
- **高性能**：响应时间<200ms，支持水平扩展
- **安全性**：数据加密、访问控制、隐私保护
- **可维护性**：代码模块化、文档完善、监控完整

### 1.2 系统架构图（文字描述）

```
互联网层
├── CDN (CloudFlare)
├── DNS解析
└── 负载均衡器 (Nginx)

接入层 
├── Web Gateway (Nginx)
├── API Gateway (Kong)
├── WebSocket Gateway
└── 静态资源服务器

应用层 (Kubernetes集群)
├── 用户服务 (Node.js)
├── 训练服务 (Node.js) 
├── AI引擎服务 (Python)
├── 分析服务 (Node.js)
├── 成就服务 (Node.js)
├── 通知服务 (Node.js)
└── 文件服务 (Node.js)

数据层
├── PostgreSQL (主数据库)
├── Redis (缓存+会话)
├── MongoDB (日志存储)
├── S3 (文件存储)
└── ElasticSearch (搜索)

监控层
├── Prometheus (指标收集)
├── Grafana (可视化)
├── ELK Stack (日志)
└── Sentry (错误追踪)
```

## 2. 技术栈选择方案

### 2.1 前端技术栈

#### Web前端
```typescript
// 核心框架
React 18.2.0 + TypeScript 4.9+
Vite 4.0+ (构建工具)
React Router 6.0+ (路由)
Redux Toolkit (状态管理)
React Query (服务端状态)

// UI组件库
Ant Design Pro 5.0+
Ant Design 5.0+
@ant-design/charts (图表)
Framer Motion (动画)

// 工具库
Axios (HTTP客户端)
Socket.io-client (WebSocket)
Day.js (日期处理)
Lodash (工具函数)
```

#### 移动端
```
React Native 0.72+
或 Flutter 3.0+ (备选方案)
```

### 2.2 后端技术栈

#### API服务端
```javascript
// 运行时环境
Node.js 18+ LTS
PM2 (进程管理)

// Web框架
Fastify 4.0+ (高性能框架)
fastify-cors (跨域处理)
fastify-helmet (安全头)
fastify-rate-limit (限流)

// 数据库相关
Prisma (ORM)
Redis (ioredis)
Bull (任务队列)
```

#### AI引擎服务
```python
# Python环境
Python 3.10+
FastAPI 0.100+
Uvicorn (ASGI服务器)

# AI/ML框架
TensorFlow 2.13+
PyTorch 2.0+
NumPy + Pandas
Scikit-learn

# 计算相关
NumPy
SciPy
```

### 2.3 基础设施技术栈

```yaml
# 容器化
Docker 20.10+
Kubernetes 1.27+
Helm (包管理)

# CI/CD
GitHub Actions
Docker Hub/ECR

# 监控和日志
Prometheus + Grafana
ELK Stack (Elasticsearch, Logstash, Kibana)
Sentry

# 消息队列
Redis (简单队列)
RabbitMQ (复杂消息)

# 存储
PostgreSQL 15+
Redis 7.0+
AWS S3 / 阿里云OSS
```

## 3. 数据库设计

### 3.1 PostgreSQL 主数据库设计

```sql
-- ================================
-- 用户相关表
-- ================================

-- 用户基础信息表
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(50) NOT NULL,
    
    -- 个人信息
    nickname VARCHAR(50),
    avatar_url VARCHAR(200),
    bio TEXT,
    
    -- 状态信息
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, deleted
    subscription_type VARCHAR(20) DEFAULT 'free', -- free, premium, vip
    subscription_expires_at TIMESTAMP,
    
    -- 统计信息
    total_training_time INTEGER DEFAULT 0, -- 总训练时间(分钟)
    total_hands_played INTEGER DEFAULT 0, -- 总手数
    current_level INTEGER DEFAULT 1, -- 当前等级
    current_exp INTEGER DEFAULT 0, -- 当前经验值
    
    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    
    -- 索引
    INDEX idx_users_username (username),
    INDEX idx_users_email (email),
    INDEX idx_users_level (current_level),
    INDEX idx_users_created (created_at)
);

-- 用户设置表
CREATE TABLE user_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 界面设置
    theme VARCHAR(20) DEFAULT 'dark', -- dark, light
    language VARCHAR(10) DEFAULT 'zh-CN',
    background_id INTEGER DEFAULT 1,
    
    -- 训练设置
    default_stack_depth INTEGER DEFAULT 100, -- 默认筹码深度
    auto_save_hands BOOLEAN DEFAULT TRUE,
    show_gto_hints BOOLEAN DEFAULT TRUE,
    
    -- 通知设置
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    achievement_notifications BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id)
);

-- ================================
-- 训练相关表  
-- ================================

-- 训练会话表
CREATE TABLE training_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 会话配置
    session_type VARCHAR(20) NOT NULL, -- quick, deep, simulation, skills
    ai_opponent_type VARCHAR(30) NOT NULL, -- tight-passive, loose-aggressive, etc.
    position VARCHAR(10), -- UTG, MP, CO, BTN, SB, BB
    stack_depth INTEGER, -- 筹码深度(BB)
    blind_level VARCHAR(20), -- 盲注级别
    background_id INTEGER,
    
    -- 会话统计
    duration INTEGER NOT NULL, -- 持续时间(秒)
    hands_played INTEGER NOT NULL, -- 手数
    decisions_made INTEGER NOT NULL, -- 决策数
    correct_decisions INTEGER DEFAULT 0, -- 正确决策数
    accuracy_rate DECIMAL(5,2), -- 准确率
    
    -- 结果数据
    starting_chips INTEGER,
    ending_chips INTEGER,
    net_result INTEGER, -- 盈亏
    
    -- 详细数据(JSON格式)
    session_data JSONB, -- 详细的会话数据
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_date (created_at),
    INDEX idx_sessions_type (session_type),
    INDEX idx_sessions_accuracy (accuracy_rate)
);

-- 手牌记录表
CREATE TABLE hands (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id BIGINT REFERENCES training_sessions(id) ON DELETE CASCADE,
    
    -- 手牌基础信息
    hand_number INTEGER NOT NULL,
    position VARCHAR(10) NOT NULL,
    hole_cards VARCHAR(5) NOT NULL, -- 如: AhKs
    community_cards VARCHAR(15), -- 如: AhKsQd7c2h
    
    -- 行动信息
    preflop_action VARCHAR(20), -- fold, call, raise, allin
    flop_action VARCHAR(20),
    turn_action VARCHAR(20),
    river_action VARCHAR(20),
    
    -- 金额信息
    pot_size INTEGER,
    bet_amount INTEGER,
    final_pot INTEGER,
    result INTEGER, -- 该手牌的盈亏
    
    -- AI建议和分析
    ai_suggestion VARCHAR(20), -- AI建议的最佳行动
    user_action VARCHAR(20), -- 用户实际行动
    is_correct BOOLEAN, -- 是否正确
    ev_difference DECIMAL(10,2), -- EV差异
    
    -- 详细数据
    hand_data JSONB, -- 完整的手牌数据
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_hands_user (user_id),
    INDEX idx_hands_session (session_id), 
    INDEX idx_hands_cards (hole_cards),
    INDEX idx_hands_result (is_correct)
);

-- ================================
-- 成就系统表
-- ================================

-- 成就定义表
CREATE TABLE achievement_definitions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- 成就代码
    category VARCHAR(20) NOT NULL, -- ability, time, special
    name VARCHAR(100) NOT NULL, -- 成就名称
    description TEXT, -- 成就描述
    icon_url VARCHAR(200), -- 图标URL
    
    -- 等级信息
    max_level INTEGER DEFAULT 1, -- 最大等级
    level_requirements JSONB, -- 各等级要求 [{level:1,requirement:100}...]
    
    -- 奖励信息
    exp_reward INTEGER DEFAULT 0, -- 经验奖励
    unlock_rewards JSONB, -- 解锁奖励 (背景、称号等)
    
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户成就表
CREATE TABLE user_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER NOT NULL REFERENCES achievement_definitions(id),
    
    current_level INTEGER DEFAULT 0, -- 当前等级
    current_progress INTEGER DEFAULT 0, -- 当前进度
    max_progress INTEGER, -- 当前等级所需进度
    
    first_unlocked_at TIMESTAMP, -- 首次解锁时间
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, achievement_id),
    INDEX idx_user_achievements_user (user_id),
    INDEX idx_user_achievements_level (current_level)
);

-- 军衔等级表
CREATE TABLE level_definitions (
    id SERIAL PRIMARY KEY,
    level INTEGER UNIQUE NOT NULL,
    rank_name VARCHAR(50) NOT NULL, -- 军衔名称
    rank_category VARCHAR(20) NOT NULL, -- 军衔类别
    exp_required INTEGER NOT NULL, -- 所需经验
    
    -- 解锁内容
    unlocked_features JSONB, -- 解锁的功能
    unlocked_backgrounds JSONB, -- 解锁的背景
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- 分析和统计表
-- ================================

-- 手牌历史分析表 
CREATE TABLE hand_history_analysis (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- 导入信息
    file_name VARCHAR(200),
    file_type VARCHAR(20), -- pokerstars, ggpoker, csv等
    import_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 统计摘要
    total_hands INTEGER,
    total_sessions INTEGER,
    date_range_start TIMESTAMP,
    date_range_end TIMESTAMP,
    
    -- 核心指标
    vpip DECIMAL(5,2), -- 入池率
    pfr DECIMAL(5,2), -- 翻前加注率
    three_bet DECIMAL(5,2), -- 3bet率
    fold_to_3bet DECIMAL(5,2), -- 对3bet弃牌率
    
    -- 盈利指标
    total_winnings DECIMAL(12,2),
    bb_per_100 DECIMAL(8,2), -- 每百手大盲
    hourly_rate DECIMAL(8,2), -- 小时赢率
    
    -- 分析结果(JSON)
    detailed_stats JSONB, -- 详细统计数据
    position_stats JSONB, -- 位置统计
    opponent_analysis JSONB, -- 对手分析
    
    INDEX idx_analysis_user (user_id),
    INDEX idx_analysis_date (import_date)
);

-- 用户统计汇总表(按天)
CREATE TABLE daily_user_stats (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    
    -- 训练数据
    training_time INTEGER DEFAULT 0, -- 训练时间(分钟)
    hands_played INTEGER DEFAULT 0, -- 手数
    sessions_count INTEGER DEFAULT 0, -- 会话数
    accuracy_rate DECIMAL(5,2), -- 平均准确率
    
    -- 活跃数据
    login_count INTEGER DEFAULT 0,
    feature_usage JSONB, -- 功能使用情况
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, stat_date),
    INDEX idx_daily_stats_user_date (user_id, stat_date)
);

-- ================================
-- 排行榜和社交表
-- ================================

-- 排行榜快照表
CREATE TABLE leaderboards (
    id BIGSERIAL PRIMARY KEY,
    leaderboard_type VARCHAR(30) NOT NULL, -- total_time, monthly_exp, accuracy等
    period VARCHAR(20) NOT NULL, -- daily, weekly, monthly, all_time
    period_start DATE,
    period_end DATE,
    
    -- 排名数据
    rankings JSONB NOT NULL, -- [{user_id, username, score, rank}...]
    
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT FALSE,
    
    INDEX idx_leaderboards_type_period (leaderboard_type, period),
    INDEX idx_leaderboards_current (is_current)
);

-- 关注关系表
CREATE TABLE follows (
    id BIGSERIAL PRIMARY KEY,
    follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(follower_id, following_id),
    INDEX idx_follows_follower (follower_id),
    INDEX idx_follows_following (following_id),
    
    -- 防止自己关注自己
    CHECK (follower_id != following_id)
);

-- ================================
-- 系统和配置表
-- ================================

-- 背景图片表
CREATE TABLE backgrounds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL, -- professional, casino, abstract, nature, tech
    image_url VARCHAR(300) NOT NULL,
    thumbnail_url VARCHAR(300),
    
    -- 解锁条件
    unlock_level INTEGER DEFAULT 1, -- 等级解锁
    unlock_achievement VARCHAR(50), -- 成就解锁
    is_premium BOOLEAN DEFAULT FALSE, -- 付费解锁
    
    -- 属性
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    tags JSONB, -- 标签 ["wsop", "professional", "tournament"]
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 系统配置表
CREATE TABLE system_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(50) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50)
);

-- 公告表
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info', -- info, warning, success, error
    
    -- 显示控制
    is_active BOOLEAN DEFAULT TRUE,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    target_users VARCHAR(20) DEFAULT 'all', -- all, free, premium, vip
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50)
);

-- ================================
-- 索引优化
-- ================================

-- 复合索引
CREATE INDEX idx_sessions_user_date ON training_sessions(user_id, created_at DESC);
CREATE INDEX idx_hands_user_session ON hands(user_id, session_id);
CREATE INDEX idx_achievements_user_category ON user_achievements(user_id, achievement_id);

-- 性能优化索引
CREATE INDEX idx_users_active_level ON users(status, current_level) WHERE status = 'active';
CREATE INDEX idx_sessions_recent ON training_sessions(created_at DESC) WHERE created_at > NOW() - INTERVAL '30 days';
```

### 3.2 Redis缓存设计

```javascript
// Redis键设计规范
const RedisKeys = {
  // 用户会话
  userSession: (userId) => `session:user:${userId}`,
  userOnline: (userId) => `online:user:${userId}`,
  
  // 排行榜缓存
  leaderboard: (type, period) => `leaderboard:${type}:${period}`,
  userRank: (userId, type) => `rank:${userId}:${type}`,
  
  // 训练数据缓存
  trainingSession: (sessionId) => `training:session:${sessionId}`,
  userDailyStats: (userId, date) => `stats:daily:${userId}:${date}`,
  
  // AI计算缓存
  gtoSolution: (scenario) => `gto:${scenario}`,
  aiDecision: (handHash) => `ai:decision:${handHash}`,
  
  // 限流
  rateLimit: (ip, endpoint) => `limit:${ip}:${endpoint}`,
  userActionLimit: (userId, action) => `limit:user:${userId}:${action}`
};

// 缓存策略
const CacheStrategies = {
  // 用户会话: 24小时
  userSession: { ttl: 24 * 60 * 60 },
  
  // 排行榜: 15分钟
  leaderboard: { ttl: 15 * 60 },
  
  // GTO计算: 永久缓存
  gtoSolution: { ttl: -1 },
  
  // 用户统计: 1小时
  userStats: { ttl: 60 * 60 },
  
  // 限流: 根据策略
  rateLimit: { ttl: 60 } // 1分钟窗口
};
```

## 4. API设计规范

### 4.1 RESTful API设计

```yaml
# API设计规范文档
openapi: 3.0.3
info:
  title: PokerIQ Pro API
  description: 德州扑克AI训练工具后端API
  version: 1.0.0
  
servers:
  - url: https://api.pokeriq.pro/v1
    description: 生产环境
  - url: https://api-dev.pokeriq.pro/v1  
    description: 开发环境

# 通用响应格式
components:
  schemas:
    ApiResponse:
      type: object
      properties:
        success:
          type: boolean
          description: 请求是否成功
        code:
          type: integer
          description: 状态码
        message:
          type: string
          description: 响应消息
        data:
          type: object
          description: 响应数据
        timestamp:
          type: integer
          description: 时间戳

    PaginationResponse:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data:
              type: object
              properties:
                items:
                  type: array
                  items: {}
                pagination:
                  $ref: '#/components/schemas/Pagination'
    
    Pagination:
      type: object
      properties:
        page:
          type: integer
          description: 当前页码
        pageSize:
          type: integer
          description: 每页数量
        total:
          type: integer
          description: 总记录数
        totalPages:
          type: integer
          description: 总页数

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

# 核心API接口
paths:
  # ================================
  # 用户认证相关
  # ================================
  /auth/register:
    post:
      summary: 用户注册
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  type: string
                  minLength: 3
                  maxLength: 50
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
      responses:
        200:
          description: 注册成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ApiResponse'
  
  /auth/login:
    post:
      summary: 用户登录
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  type: string
                password:
                  type: string
      responses:
        200:
          description: 登录成功
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/ApiResponse'
                  - type: object
                    properties:
                      data:
                        type: object
                        properties:
                          token:
                            type: string
                          user:
                            $ref: '#/components/schemas/User'

  # ================================
  # 用户管理
  # ================================
  /users/profile:
    get:
      summary: 获取用户信息
      tags: [Users]
      security:
        - BearerAuth: []
      responses:
        200:
          description: 用户信息
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/ApiResponse'
                  - type: object
                    properties:
                      data:
                        $ref: '#/components/schemas/User'
    
    put:
      summary: 更新用户信息
      tags: [Users]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                nickname:
                  type: string
                bio:
                  type: string
                avatar_url:
                  type: string
      responses:
        200:
          description: 更新成功

  # ================================
  # 训练系统
  # ================================
  /training/sessions:
    post:
      summary: 创建训练会话
      tags: [Training]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                session_type:
                  type: string
                  enum: [quick, deep, simulation, skills]
                ai_opponent_type:
                  type: string
                position:
                  type: string
                stack_depth:
                  type: integer
                background_id:
                  type: integer
      responses:
        201:
          description: 会话创建成功
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/ApiResponse'
                  - type: object
                    properties:
                      data:
                        $ref: '#/components/schemas/TrainingSession'
    
    get:
      summary: 获取训练会话列表
      tags: [Training]
      security:
        - BearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: pageSize
          in: query
          schema:
            type: integer
            default: 20
        - name: session_type
          in: query
          schema:
            type: string
      responses:
        200:
          description: 训练会话列表
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginationResponse'

  /training/sessions/{sessionId}:
    get:
      summary: 获取训练会话详情
      tags: [Training]
      security:
        - BearerAuth: []
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: integer
      responses:
        200:
          description: 会话详情
    
    put:
      summary: 更新训练会话
      tags: [Training]
      security:
        - BearerAuth: []
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: integer
      responses:
        200:
          description: 更新成功

  # ================================
  # AI决策引擎
  # ================================
  /ai/decision:
    post:
      summary: 获取AI决策建议
      tags: [AI]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                hole_cards:
                  type: string
                  example: "AhKs"
                community_cards:
                  type: string
                  example: "AcKd7h"
                position:
                  type: string
                pot_size:
                  type: integer
                stack_size:
                  type: integer
                opponent_actions:
                  type: array
                  items:
                    type: string
      responses:
        200:
          description: AI决策建议
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/ApiResponse'
                  - type: object
                    properties:
                      data:
                        type: object
                        properties:
                          recommended_action:
                            type: string
                          action_probabilities:
                            type: object
                          expected_value:
                            type: number
                          reasoning:
                            type: string

  # ================================
  # 成就系统
  # ================================
  /achievements:
    get:
      summary: 获取用户成就列表
      tags: [Achievements]
      security:
        - BearerAuth: []
      responses:
        200:
          description: 成就列表
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/ApiResponse'
                  - type: object
                    properties:
                      data:
                        type: array
                        items:
                          $ref: '#/components/schemas/UserAchievement'

  /achievements/progress:
    post:
      summary: 更新成就进度
      tags: [Achievements]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                achievement_code:
                  type: string
                progress_increment:
                  type: integer
      responses:
        200:
          description: 进度更新成功

  # ================================
  # 数据分析
  # ================================
  /analysis/import:
    post:
      summary: 导入手牌历史
      tags: [Analysis]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                file_type:
                  type: string
                  enum: [pokerstars, ggpoker, csv]
      responses:
        200:
          description: 导入成功

  /analysis/stats:
    get:
      summary: 获取统计数据
      tags: [Analysis]
      security:
        - BearerAuth: []
      parameters:
        - name: period
          in: query
          schema:
            type: string
            enum: [week, month, quarter, year, all]
            default: month
      responses:
        200:
          description: 统计数据
          content:
            application/json:
              schema:
                allOf:
                  - $ref: '#/components/schemas/ApiResponse'
                  - type: object
                    properties:
                      data:
                        $ref: '#/components/schemas/UserStats'

  # ================================
  # 排行榜
  # ================================
  /leaderboards:
    get:
      summary: 获取排行榜
      tags: [Leaderboards]
      security:
        - BearerAuth: []
      parameters:
        - name: type
          in: query
          required: true
          schema:
            type: string
            enum: [total_time, monthly_exp, accuracy, level]
        - name: period
          in: query
          schema:
            type: string
            enum: [daily, weekly, monthly, all_time]
            default: monthly
        - name: limit
          in: query
          schema:
            type: integer
            default: 100
      responses:
        200:
          description: 排行榜数据

# 数据模型定义
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
        username:
          type: string
        email:
          type: string
        nickname:
          type: string
        avatar_url:
          type: string
        current_level:
          type: integer
        current_exp:
          type: integer
        subscription_type:
          type: string
        total_training_time:
          type: integer
        created_at:
          type: string
          format: date-time

    TrainingSession:
      type: object
      properties:
        id:
          type: integer
        session_type:
          type: string
        ai_opponent_type:
          type: string
        duration:
          type: integer
        hands_played:
          type: integer
        accuracy_rate:
          type: number
        created_at:
          type: string
          format: date-time

    UserAchievement:
      type: object
      properties:
        id:
          type: integer
        achievement_id:
          type: integer
        name:
          type: string
        description:
          type: string
        category:
          type: string
        current_level:
          type: integer
        current_progress:
          type: integer
        max_progress:
          type: integer
        unlocked_at:
          type: string
          format: date-time

    UserStats:
      type: object
      properties:
        total_hands:
          type: integer
        total_training_time:
          type: integer
        average_accuracy:
          type: number
        vpip:
          type: number
        pfr:
          type: number
        three_bet:
          type: number
        position_stats:
          type: object
```

## 5. 微服务划分方案

### 5.1 服务拆分策略

```yaml
# 微服务架构设计
services:
  # 用户服务
  user-service:
    port: 3001
    responsibilities:
      - 用户认证与授权
      - 用户信息管理  
      - 用户设置管理
      - 会话管理
    databases:
      - PostgreSQL (users, user_settings)
      - Redis (sessions, cache)
    dependencies: []

  # 训练服务
  training-service:
    port: 3002
    responsibilities:
      - 训练会话管理
      - 手牌记录管理
      - 训练数据统计
      - 复盘功能
    databases:
      - PostgreSQL (training_sessions, hands)
      - Redis (session cache)
    dependencies:
      - user-service
      - ai-service

  # AI引擎服务 (Python)
  ai-service:
    port: 8000
    responsibilities:
      - GTO计算
      - AI对手决策
      - 决策分析
      - EV计算
    databases:
      - Redis (computation cache)
    dependencies: []
    language: Python
    framework: FastAPI

  # 分析服务
  analysis-service:
    port: 3003
    responsibilities:
      - 手牌历史导入
      - 数据分析计算
      - 统计报表生成
      - 图表数据API
    databases:
      - PostgreSQL (hand_history_analysis, daily_user_stats)
      - Redis (stats cache)
    dependencies:
      - user-service

  # 成就服务
  achievement-service:
    port: 3004
    responsibilities:
      - 成就系统管理
      - 等级系统管理
      - 进度追踪
      - 奖励发放
    databases:
      - PostgreSQL (achievements, user_achievements, level_definitions)
      - Redis (achievement cache)
    dependencies:
      - user-service
      - training-service

  # 排行榜服务
  leaderboard-service:
    port: 3005
    responsibilities:
      - 排行榜计算
      - 排名缓存
      - 历史排名
      - 关注系统
    databases:
      - PostgreSQL (leaderboards, follows)
      - Redis (rankings cache)
    dependencies:
      - user-service

  # 通知服务
  notification-service:
    port: 3006
    responsibilities:
      - 实时通知
      - 邮件通知
      - 推送通知
      - 消息模板管理
    databases:
      - Redis (notification queue)
    dependencies:
      - user-service

  # 文件服务
  file-service:
    port: 3007
    responsibilities:
      - 文件上传下载
      - 图片处理
      - 背景图片管理
      - CDN集成
    databases:
      - PostgreSQL (backgrounds)
      - S3 (file storage)
    dependencies:
      - user-service

  # API网关
  api-gateway:
    port: 3000
    responsibilities:
      - 路由分发
      - 认证鉴权
      - 限流熔断
      - 日志记录
    framework: Kong/Nginx
```

### 5.2 服务间通信

```javascript
// 服务间通信方案

// 1. 同步通信 (HTTP/gRPC)
const ServiceCommunication = {
  // REST API调用
  http: {
    timeout: 5000,
    retries: 3,
    circuitBreaker: true
  },
  
  // gRPC调用 (内部高频调用)
  grpc: {
    services: ['ai-service', 'analysis-service'],
    timeout: 3000
  }
};

// 2. 异步通信 (消息队列)
const MessageQueue = {
  // 事件发布/订阅
  events: {
    'user.registered': ['achievement-service', 'notification-service'],
    'training.completed': ['achievement-service', 'leaderboard-service'],
    'achievement.unlocked': ['notification-service'],
    'level.upgraded': ['notification-service', 'leaderboard-service']
  },
  
  // 任务队列
  tasks: {
    'analysis.import': 'analysis-service',
    'notification.send': 'notification-service',
    'leaderboard.update': 'leaderboard-service'
  }
};

// 3. 服务发现
const ServiceRegistry = {
  consul: {
    health_check: '/health',
    check_interval: '10s',
    timeout: '5s'
  }
};
```

## 6. 部署架构设计

### 6.1 Kubernetes部署配置

```yaml
# Kubernetes部署架构
apiVersion: v1
kind: Namespace
metadata:
  name: pokeriq-prod

---
# ConfigMap配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: pokeriq-prod
data:
  DATABASE_HOST: "postgres-service"
  REDIS_HOST: "redis-service"
  NODE_ENV: "production"

---
# 用户服务部署
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: pokeriq-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: pokeriq/user-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: PORT
          value: "3001"
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 60
          periodSeconds: 30

---
# 服务暴露
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: pokeriq-prod
spec:
  selector:
    app: user-service
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3001
  type: ClusterIP

---
# HPA自动扩缩容
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
  namespace: pokeriq-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

---
# Ingress网关
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  namespace: pokeriq-prod
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - api.pokeriq.pro
    secretName: api-tls-secret
  rules:
  - host: api.pokeriq.pro
    http:
      paths:
      - path: /v1/users
        pathType: Prefix
        backend:
          service:
            name: user-service
            port:
              number: 80
      - path: /v1/training
        pathType: Prefix
        backend:
          service:
            name: training-service
            port:
              number: 80
      # 其他路由...
```

### 6.2 数据库部署

```yaml
# PostgreSQL StatefulSet
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: pokeriq-prod
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: "pokeriq"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 100Gi

---
# Redis部署
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: pokeriq-prod
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

### 6.3 监控和日志

```yaml
# Prometheus监控配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: pokeriq-prod
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    
    scrape_configs:
    - job_name: 'user-service'
      static_configs:
      - targets: ['user-service:80']
      metrics_path: '/metrics'
      
    - job_name: 'training-service'
      static_configs:
      - targets: ['training-service:80']
      metrics_path: '/metrics'
      
    # 其他服务监控...
    
    rule_files:
    - "/etc/prometheus/rules/*.yml"

---
# Grafana Dashboard配置
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
  namespace: pokeriq-prod
data:
  pokeriq-dashboard.json: |
    {
      "dashboard": {
        "title": "PokerIQ Pro Monitoring",
        "panels": [
          {
            "title": "API Response Time",
            "type": "graph",
            "targets": [
              {
                "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
                "legendFormat": "95th percentile"
              }
            ]
          },
          {
            "title": "Active Users",
            "type": "singlestat",
            "targets": [
              {
                "expr": "count(online_users)",
                "legendFormat": "Online Users"
              }
            ]
          }
        ]
      }
    }
```

### 6.4 项目目录结构

```
pokeriq-pro/
├── README.md
├── docker-compose.yml
├── k8s/                          # Kubernetes配置
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   ├── deployments/
│   ├── services/
│   └── ingress.yaml
│
├── services/                     # 微服务代码
│   ├── user-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── middleware/
│   │   │   ├── utils/
│   │   │   └── app.js
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── .env.example
│   │
│   ├── training-service/
│   ├── ai-service/              # Python服务
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── analysis-service/
│   ├── achievement-service/
│   ├── leaderboard-service/
│   ├── notification-service/
│   └── file-service/
│
├── web/                         # 前端代码
│   ├── public/
│   ├── src/
│   │   ├── components/          # 组件
│   │   │   ├── common/         # 通用组件
│   │   │   ├── training/       # 训练相关
│   │   │   ├── analysis/       # 分析相关
│   │   │   └── achievements/   # 成就相关
│   │   ├── pages/              # 页面
│   │   ├── hooks/              # React Hooks
│   │   ├── services/           # API服务
│   │   ├── store/              # Redux store
│   │   ├── utils/              # 工具函数
│   │   ├── styles/             # 样式文件
│   │   └── App.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
│
├── mobile/                      # 移动端代码
│   ├── ios/
│   ├── android/
│   ├── src/
│   └── package.json
│
├── shared/                      # 共享代码
│   ├── types/                  # TypeScript类型定义
│   ├── constants/              # 常量定义
│   ├── validation/             # 数据验证
│   └── utils/                  # 工具函数
│
├── database/                   # 数据库相关
│   ├── migrations/            # 数据库迁移
│   ├── seeds/                 # 种子数据
│   ├── schema.sql             # 数据库schema
│   └── init.sql               # 初始化脚本
│
├── docs/                       # 文档
│   ├── api/                   # API文档
│   ├── deployment/            # 部署文档
│   ├── development/           # 开发文档
│   └── architecture/          # 架构文档
│
├── scripts/                    # 脚本工具
│   ├── deploy.sh              # 部署脚本
│   ├── backup.sh              # 备份脚本
│   ├── migrate.sh             # 迁移脚本
│   └── test.sh                # 测试脚本
│
├── monitoring/                 # 监控配置
│   ├── prometheus/
│   ├── grafana/
│   └── alerts/
│
└── tests/                      # 测试用例
    ├── unit/                   # 单元测试
    ├── integration/            # 集成测试
    ├── e2e/                    # 端到端测试
    └── performance/            # 性能测试
```

## 7. 性能和安全优化

### 7.1 性能优化方案

```javascript
// 缓存策略
const CacheStrategies = {
  // 多级缓存
  levels: {
    L1: 'Application Cache',    // 应用内存缓存
    L2: 'Redis Cache',          // Redis缓存
    L3: 'CDN Cache'            // CDN缓存
  },
  
  // 缓存模式
  patterns: {
    'Cache-Aside': 'user_profile',
    'Write-Through': 'user_settings',
    'Write-Behind': 'user_stats',
    'Read-Through': 'leaderboards'
  },
  
  // 缓存失效策略
  invalidation: {
    TTL: 'time based expiration',
    LRU: 'memory pressure eviction', 
    Event: 'business logic triggered'
  }
};

// 数据库优化
const DatabaseOptimization = {
  // 索引策略
  indexes: {
    primary: 'B-Tree indexes on ID fields',
    composite: 'Multi-column indexes for complex queries',
    partial: 'Conditional indexes for filtered data',
    covering: 'Include columns to avoid table lookups'
  },
  
  // 查询优化
  queries: {
    pagination: 'Cursor-based pagination for large datasets',
    aggregation: 'Pre-computed summary tables',
    joins: 'Denormalization for frequent joins',
    filtering: 'Query optimization with EXPLAIN'
  },
  
  // 连接池
  connection_pool: {
    size: 20,
    idle_timeout: 30000,
    acquire_timeout: 10000
  }
};
```

### 7.2 安全防护措施

```javascript
// 安全配置
const SecurityConfig = {
  // 认证和授权
  authentication: {
    jwt: {
      algorithm: 'RS256',
      expiresIn: '24h',
      refreshToken: '7d'
    },
    passwordPolicy: {
      minLength: 8,
      requireNumbers: true,
      requireSymbols: true,
      requireUppercase: true
    }
  },
  
  // API安全
  api_security: {
    rateLimit: {
      windowMs: 60000, // 1分钟
      max: 100        // 最大请求数
    },
    cors: {
      origin: ['https://pokeriq.pro', 'https://app.pokeriq.pro'],
      credentials: true
    },
    helmet: {
      contentSecurityPolicy: true,
      hsts: true,
      noSniff: true
    }
  },
  
  // 数据加密
  encryption: {
    algorithm: 'AES-256-GCM',
    keyRotation: '90d',
    sensitiveFields: ['password', 'email', 'payment_info']
  },
  
  // 审计日志
  audit_logging: {
    events: ['login', 'logout', 'password_change', 'payment', 'admin_action'],
    retention: '2y',
    compliance: 'GDPR'
  }
};
```

## 8. 监控和运维

### 8.1 监控指标体系

```yaml
# 监控指标配置
monitoring:
  # 基础设施监控
  infrastructure:
    - name: "CPU Usage"
      query: "rate(process_cpu_seconds_total[5m]) * 100"
      threshold: 80
      
    - name: "Memory Usage" 
      query: "(process_resident_memory_bytes / machine_memory_bytes) * 100"
      threshold: 85
      
    - name: "Disk I/O"
      query: "rate(node_disk_io_time_seconds_total[5m])"
      threshold: 0.8

  # 应用监控
  application:
    - name: "API Response Time"
      query: "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
      threshold: 0.2
      
    - name: "Error Rate"
      query: "rate(http_requests_total{status=~'5..'}[5m]) / rate(http_requests_total[5m])"
      threshold: 0.01
      
    - name: "Throughput"
      query: "rate(http_requests_total[5m])"
      
  # 业务监控
  business:
    - name: "Active Users"
      query: "count(online_users)"
      
    - name: "Training Sessions/Hour"
      query: "increase(training_sessions_total[1h])"
      
    - name: "Conversion Rate"
      query: "premium_subscriptions_total / new_users_total"
      
# 告警规则
alerts:
  - alert: "High API Response Time"
    expr: "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5"
    for: "2m"
    labels:
      severity: "warning"
    annotations:
      summary: "API响应时间过高"
      
  - alert: "High Error Rate"
    expr: "rate(http_requests_total{status=~'5..'}[5m]) / rate(http_requests_total[5m]) > 0.05"
    for: "1m" 
    labels:
      severity: "critical"
    annotations:
      summary: "API错误率过高"
```

### 8.2 日志管理

```yaml
# 日志配置
logging:
  # 日志级别
  levels:
    production: "info"
    staging: "debug"
    development: "debug"
    
  # 日志格式
  format: "json"
  timestamp: "iso8601"
  
  # 日志字段
  fields:
    - timestamp
    - level
    - service
    - traceId
    - userId
    - method
    - url
    - statusCode
    - responseTime
    - userAgent
    - ip
    
  # 日志输出
  outputs:
    - console
    - file: "/var/log/app.log"
    - elasticsearch: "http://elasticsearch:9200"
    
  # 日志轮转
  rotation:
    maxSize: "100MB"
    maxFiles: 10
    compress: true
```

---

**总结**

本系统架构设计文档为德州扑克AI训练工具提供了完整的技术方案：

1. **系统架构**：采用微服务架构，支持高并发和水平扩展
2. **技术栈**：现代化技术栈确保开发效率和系统性能
3. **数据库设计**：完整的PostgreSQL schema设计，支持复杂业务逻辑
4. **API设计**：RESTful API规范，支持前后端分离开发
5. **微服务**：合理的服务拆分，职责清晰，便于维护
6. **部署架构**：Kubernetes容器化部署，支持自动扩缩容
7. **性能优化**：多级缓存、数据库优化等性能提升方案
8. **安全防护**：全面的安全措施确保系统和数据安全
9. **监控运维**：完整的监控告警体系支持7x24小时运行

该架构设计满足支持10万+用户、响应时间<200ms的性能要求，具备高可用性、可扩展性和安全性。