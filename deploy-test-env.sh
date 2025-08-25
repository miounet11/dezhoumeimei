#!/bin/bash

# PokerIQ Pro 测试环境一键部署脚本
# 自动化部署、初始化和验证整个系统

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要工具
check_prerequisites() {
    log_info "检查部署前置条件..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    # 检查端口占用
    local ports=(3000 3001 3002 5432 6379 8123 9090 8001 8002 8003 8004)
    for port in "${ports[@]}"; do
        if lsof -i :$port &> /dev/null; then
            log_warning "端口 $port 已被占用，请检查"
        fi
    done
    
    log_success "前置条件检查完成"
}

# 创建必要目录
create_directories() {
    log_info "创建必要的目录结构..."
    
    mkdir -p {database,monitoring/{dashboards,config},scripts,load-testing,ai-models,ml-models}
    mkdir -p logs/{postgres,redis,clickhouse,api-gateway,services}
    
    log_success "目录结构创建完成"
}

# 生成配置文件
generate_configs() {
    log_info "生成配置文件..."
    
    # Prometheus配置
    cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:3001']
    metrics_path: '/metrics'

  - job_name: 'gto-service'
    static_configs:
      - targets: ['gto-service:8000']
    metrics_path: '/metrics'

  - job_name: 'opponent-service'
    static_configs:
      - targets: ['opponent-service:8000']
    metrics_path: '/metrics'

  - job_name: 'profile-service'
    static_configs:
      - targets: ['profile-service:8000']
    metrics_path: '/metrics'

  - job_name: 'recommendation-service'
    static_configs:
      - targets: ['recommendation-service:8000']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF

    # Grafana数据源配置
    cat > monitoring/grafana-datasources.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    
  - name: PostgreSQL
    type: postgres
    url: postgres:5432
    database: pokeriq_pro
    user: pokeriq
    secureJsonData:
      password: test123456
    jsonData:
      sslmode: disable
EOF

    # 数据库初始化脚本
    cat > database/init.sql << 'EOF'
-- PokerIQ Pro 测试环境数据库初始化

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 创建基础表结构
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建技能评估表
CREATE TABLE IF NOT EXISTS user_skill_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) UNIQUE,
    preflop_skill INTEGER DEFAULT 1000,
    postflop_skill INTEGER DEFAULT 1000,
    psychology_skill INTEGER DEFAULT 1000,
    mathematics_skill INTEGER DEFAULT 1000,
    bankroll_skill INTEGER DEFAULT 1000,
    tournament_skill INTEGER DEFAULT 1000,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 创建训练会话表
CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_type VARCHAR(50) NOT NULL,
    difficulty_level INTEGER DEFAULT 1,
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    total_hands INTEGER DEFAULT 0,
    correct_decisions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 插入测试用户
INSERT INTO users (email, username, password_hash) VALUES 
('test@pokeriq.com', 'testuser', crypt('test123456', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;

-- 插入测试技能档案
INSERT INTO user_skill_profiles (user_id, preflop_skill, postflop_skill) 
SELECT id, 1200, 1100 FROM users WHERE email = 'test@pokeriq.com'
ON CONFLICT (user_id) DO NOTHING;

SELECT 'Database initialization completed' AS status;
EOF

    # ClickHouse初始化
    cat > database/clickhouse-init.sql << 'EOF'
-- ClickHouse分析数据库初始化

CREATE DATABASE IF NOT EXISTS analytics;

USE analytics;

-- 用户行为分析表
CREATE TABLE IF NOT EXISTS user_events (
    timestamp DateTime DEFAULT now(),
    user_id String,
    event_type String,
    event_data String,
    session_id String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (user_id, timestamp);

-- 训练数据表
CREATE TABLE IF NOT EXISTS training_analytics (
    timestamp DateTime DEFAULT now(),
    user_id String,
    session_id String,
    hand_number UInt32,
    decision_time_ms UInt32,
    user_action String,
    optimal_action String,
    accuracy_score Float32
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (user_id, timestamp);

SELECT 'ClickHouse initialization completed' AS status;
EOF

    log_success "配置文件生成完成"
}

# 构建Docker镜像
build_images() {
    log_info "构建Docker镜像..."
    
    # 构建API网关镜像
    cat > system-integration/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# 复制package.json
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["npm", "start"]
EOF

    # 构建AI服务镜像
    cat > ai-service/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF

    # 构建前端镜像
    cat > pokeriq-pro/Dockerfile.test << 'EOF'
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package.json
COPY package*.json ./
RUN npm ci

# 复制源代码并构建
COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=test

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
EOF

    # 构建初始化器镜像
    cat > scripts/Dockerfile.init << 'EOF'
FROM node:18-alpine

WORKDIR /app

# 安装必要工具
RUN apk add --no-cache curl postgresql-client

# 复制初始化脚本
COPY init-system.sh .
RUN chmod +x init-system.sh

CMD ["./init-system.sh"]
EOF

    log_success "Docker镜像配置完成"
}

# 创建初始化脚本
create_init_script() {
    log_info "创建系统初始化脚本..."
    
    cat > scripts/init-system.sh << 'EOF'
#!/bin/sh

# PokerIQ Pro 系统初始化脚本

set -e

echo "等待数据库服务启动..."
until pg_isready -h postgres -p 5432 -U pokeriq; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "等待Redis服务启动..."
until redis-cli -h redis -p 6379 -a test123456 ping; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done

echo "等待ClickHouse服务启动..."
until curl -f http://clickhouse:8123/ping; do
  echo "ClickHouse is unavailable - sleeping"
  sleep 2
done

echo "数据库服务已就绪，开始初始化..."

# 执行数据库迁移
echo "执行数据库初始化..."
psql -h postgres -U pokeriq -d pokeriq_pro -c "SELECT 'Database connection successful' AS status;"

# 初始化Redis缓存
echo "初始化Redis缓存..."
redis-cli -h redis -p 6379 -a test123456 set "system:initialized" "$(date)"

# 预热ClickHouse
echo "初始化ClickHouse..."
curl -X POST "http://clickhouse:8123/" -d "SELECT 'ClickHouse ready' AS status"

echo "系统初始化完成!"
EOF

    chmod +x scripts/init-system.sh
    
    log_success "初始化脚本创建完成"
}

# 启动服务
start_services() {
    log_info "启动PokerIQ Pro测试环境..."
    
    # 停止现有服务
    docker-compose -f docker-compose.test.yml down --remove-orphans
    
    # 清理旧数据（可选）
    read -p "是否清理旧数据？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f docker-compose.test.yml down -v
        log_warning "已清理旧数据"
    fi
    
    # 启动基础设施服务
    log_info "启动数据库服务..."
    docker-compose -f docker-compose.test.yml up -d postgres redis clickhouse
    
    # 等待数据库就绪
    log_info "等待数据库服务就绪..."
    sleep 30
    
    # 运行初始化
    log_info "运行系统初始化..."
    docker-compose -f docker-compose.test.yml run --rm initializer
    
    # 启动应用服务
    log_info "启动应用服务..."
    docker-compose -f docker-compose.test.yml up -d gto-service opponent-service profile-service recommendation-service
    
    # 等待服务就绪
    log_info "等待AI服务启动..."
    sleep 45
    
    # 启动API网关
    log_info "启动API网关..."
    docker-compose -f docker-compose.test.yml up -d api-gateway
    
    # 等待API网关就绪
    sleep 15
    
    # 启动前端应用
    log_info "启动前端应用..."
    docker-compose -f docker-compose.test.yml up -d frontend
    
    # 启动监控服务
    log_info "启动监控服务..."
    docker-compose -f docker-compose.test.yml up -d prometheus grafana
    
    log_success "所有服务启动完成！"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local services=(
        "http://localhost:5432:PostgreSQL数据库"
        "http://localhost:6379:Redis缓存"
        "http://localhost:8123/ping:ClickHouse分析数据库"
        "http://localhost:8001/health:GTO计算服务"
        "http://localhost:8002/health:AI对手服务"
        "http://localhost:8003/health:用户画像服务"
        "http://localhost:8004/health:推荐引擎服务"
        "http://localhost:3001/health:API网关"
        "http://localhost:3000:前端应用"
        "http://localhost:9090:Prometheus监控"
        "http://localhost:3002:Grafana仪表板"
    )
    
    local failed_services=()
    
    for service in "${services[@]}"; do
        local url=$(echo $service | cut -d: -f1-2)
        local name=$(echo $service | cut -d: -f3-)
        
        if curl -s -f "$url" > /dev/null 2>&1; then
            log_success "$name ✓"
        else
            log_error "$name ✗"
            failed_services+=("$name")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        log_success "所有服务健康检查通过！"
        return 0
    else
        log_error "以下服务健康检查失败："
        for service in "${failed_services[@]}"; do
            echo "  - $service"
        done
        return 1
    fi
}

# 显示访问信息
show_access_info() {
    log_info "PokerIQ Pro测试环境部署完成！"
    echo
    echo "==================================="
    echo "🎯 服务访问地址:"
    echo "==================================="
    echo "📱 前端应用:      http://localhost:3000"
    echo "🔌 API网关:       http://localhost:3001"
    echo "📊 Grafana监控:   http://localhost:3002 (admin/test123456)"
    echo "📈 Prometheus:    http://localhost:9090"
    echo "🗄️ 数据库管理:     http://localhost:8080"
    echo "⚡ Redis管理:     http://localhost:8081"
    echo
    echo "==================================="
    echo "🔧 服务状态:"
    echo "==================================="
    docker-compose -f docker-compose.test.yml ps
    echo
    echo "==================================="
    echo "📝 快速命令:"
    echo "==================================="
    echo "查看日志:     docker-compose -f docker-compose.test.yml logs -f [service]"
    echo "重启服务:     docker-compose -f docker-compose.test.yml restart [service]"
    echo "停止环境:     docker-compose -f docker-compose.test.yml down"
    echo "清理数据:     docker-compose -f docker-compose.test.yml down -v"
    echo
    echo "==================================="
    echo "🧪 测试账户:"
    echo "==================================="
    echo "邮箱: test@pokeriq.com"
    echo "密码: test123456"
    echo "==================================="
}

# 运行负载测试
run_load_test() {
    log_info "准备运行负载测试..."
    
    read -p "是否运行负载测试？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "启动负载测试 (50并发用户, 5分钟)..."
        docker-compose -f docker-compose.test.yml --profile testing run --rm load-tester
        log_success "负载测试完成"
    fi
}

# 主函数
main() {
    echo "🚀 PokerIQ Pro 测试环境部署开始"
    echo "========================================"
    
    check_prerequisites
    create_directories
    generate_configs
    build_images
    create_init_script
    start_services
    
    # 等待服务完全启动
    log_info "等待所有服务完全启动..."
    sleep 60
    
    # 执行健康检查
    if health_check; then
        show_access_info
        run_load_test
    else
        log_error "健康检查失败，请检查日志："
        echo "docker-compose -f docker-compose.test.yml logs"
        exit 1
    fi
    
    log_success "🎉 PokerIQ Pro测试环境部署成功！"
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"