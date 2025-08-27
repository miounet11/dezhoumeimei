#!/bin/bash

# PokerIQ Pro个性化系统部署脚本
# 版本: 1.0.0
# 作者: PokerIQ开发团队

set -e  # 遇到错误立即退出
set -u  # 使用未定义变量时退出

# 颜色输出定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV=${1:-staging}
BACKUP_DIR="/opt/backups/pokeriq-personalization"
LOG_FILE="/var/log/personalization-deploy.log"

# 函数定义
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# 检查必要的工具
check_dependencies() {
    log "检查部署依赖..."
    
    local deps=("node" "npm" "docker" "docker-compose" "psql" "redis-cli" "git")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            error "缺少依赖工具: $dep"
        fi
    done
    
    # 检查Node.js版本
    local node_version=$(node --version | sed 's/v//')
    local required_version="18.0.0"
    
    if ! printf '%s\n' "$required_version" "$node_version" | sort -V -C; then
        error "Node.js版本过低，需要 >= $required_version，当前版本: $node_version"
    fi
    
    log "依赖检查完成"
}

# 验证环境配置
validate_environment() {
    log "验证环境配置 ($ENV)..."
    
    local env_file="$PROJECT_DIR/.env.$ENV"
    
    if [[ ! -f "$env_file" ]]; then
        error "环境配置文件不存在: $env_file"
    fi
    
    # 检查必要的环境变量
    local required_vars=(
        "DATABASE_HOST"
        "DATABASE_NAME" 
        "DATABASE_USERNAME"
        "DATABASE_PASSWORD"
        "REDIS_HOST"
        "REDIS_PORT"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
    )
    
    source "$env_file"
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "环境变量未设置: $var"
        fi
    done
    
    log "环境配置验证完成"
}

# 健康检查
health_check() {
    local service=$1
    local url=$2
    local timeout=${3:-30}
    
    info "检查服务健康状态: $service"
    
    local count=0
    while [[ $count -lt $timeout ]]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            log "$service 服务正常"
            return 0
        fi
        
        sleep 1
        ((count++))
    done
    
    error "$service 服务健康检查失败，超时 ${timeout}s"
}

# 数据库连接检查
check_database() {
    log "检查数据库连接..."
    
    if ! PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -U "$DATABASE_USERNAME" -d "$DATABASE_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        error "数据库连接失败"
    fi
    
    log "数据库连接正常"
}

# Redis连接检查
check_redis() {
    log "检查Redis连接..."
    
    if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
        error "Redis连接失败"
    fi
    
    log "Redis连接正常"
}

# 数据库备份
backup_database() {
    log "备份数据库..."
    
    local backup_file="$BACKUP_DIR/database-$(date +%Y%m%d-%H%M%S).sql"
    
    mkdir -p "$BACKUP_DIR"
    
    if ! PGPASSWORD="$DATABASE_PASSWORD" pg_dump \
        -h "$DATABASE_HOST" \
        -U "$DATABASE_USERNAME" \
        -d "$DATABASE_NAME" \
        -f "$backup_file"; then
        error "数据库备份失败"
    fi
    
    gzip "$backup_file"
    log "数据库备份完成: $backup_file.gz"
    
    # 清理旧备份（保留7天）
    find "$BACKUP_DIR" -name "database-*.sql.gz" -mtime +7 -delete
}

# Redis备份
backup_redis() {
    log "备份Redis数据..."
    
    local backup_file="$BACKUP_DIR/redis-$(date +%Y%m%d-%H%M%S).rdb"
    
    mkdir -p "$BACKUP_DIR"
    
    if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" --rdb "$backup_file" > /dev/null 2>&1; then
        warn "Redis备份失败，继续部署"
        return 0
    fi
    
    log "Redis备份完成: $backup_file"
    
    # 清理旧备份
    find "$BACKUP_DIR" -name "redis-*.rdb" -mtime +7 -delete
}

# 构建应用
build_application() {
    log "构建应用..."
    
    cd "$PROJECT_DIR"
    
    # 清理之前的构建
    rm -rf .next/
    rm -rf dist/
    
    # 安装依赖
    info "安装生产依赖..."
    npm ci --only=production
    
    # 构建应用
    info "构建Next.js应用..."
    NODE_ENV="$ENV" npm run build
    
    # 运行类型检查
    info "运行类型检查..."
    npm run type-check
    
    log "应用构建完成"
}

# 运行数据库迁移
run_migrations() {
    log "运行数据库迁移..."
    
    cd "$PROJECT_DIR"
    
    # 运行Prisma迁移
    info "运行Prisma迁移..."
    npx prisma db push --force-reset 2>/dev/null || npx prisma db push
    
    # 运行个性化系统相关迁移
    info "运行个性化系统迁移..."
    if [[ -f "prisma/migrations/add_personalization_system.sql" ]]; then
        PGPASSWORD="$DATABASE_PASSWORD" psql \
            -h "$DATABASE_HOST" \
            -U "$DATABASE_USERNAME" \
            -d "$DATABASE_NAME" \
            -f "prisma/migrations/add_personalization_system.sql"
    fi
    
    # 运行种子数据
    if [[ "$ENV" != "production" ]]; then
        info "导入种子数据..."
        npm run seed:personalization
    fi
    
    log "数据库迁移完成"
}

# 运行测试
run_tests() {
    log "运行测试套件..."
    
    cd "$PROJECT_DIR"
    
    # 单元测试
    info "运行单元测试..."
    NODE_ENV=test npm test -- --coverage --watchAll=false
    
    # 个性化系统集成测试
    info "运行个性化系统测试..."
    NODE_ENV=test npm test tests/personalization/ -- --watchAll=false
    
    # 性能测试（仅在staging环境）
    if [[ "$ENV" == "staging" ]]; then
        info "运行性能测试..."
        npm run test:performance
    fi
    
    log "测试完成"
}

# 部署Docker容器
deploy_docker() {
    log "部署Docker容器..."
    
    cd "$PROJECT_DIR"
    
    # 复制环境配置
    cp ".env.$ENV" .env
    
    # 构建Docker镜像
    info "构建Docker镜像..."
    docker build -t "pokeriq-pro:$ENV" .
    
    # 启动服务
    info "启动Docker Compose服务..."
    COMPOSE_FILE="docker-compose.yml"
    if [[ -f "docker-compose.$ENV.yml" ]]; then
        COMPOSE_FILE="docker-compose.$ENV.yml"
    fi
    
    docker-compose -f "$COMPOSE_FILE" down || true
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log "Docker容器部署完成"
}

# 直接部署（非Docker）
deploy_direct() {
    log "直接部署应用..."
    
    cd "$PROJECT_DIR"
    
    # 复制环境配置
    cp ".env.$ENV" .env
    
    # 停止现有进程
    info "停止现有进程..."
    pkill -f "next start" || true
    pkill -f "node.*pokeriq" || true
    
    # 等待进程完全停止
    sleep 5
    
    # 启动应用
    info "启动应用..."
    NODE_ENV="$ENV" nohup npm start > /var/log/pokeriq-app.log 2>&1 &
    
    # 等待应用启动
    sleep 10
    
    log "应用部署完成"
}

# 部署后验证
post_deploy_verification() {
    log "执行部署后验证..."
    
    local base_url="http://localhost:3000"
    if [[ "$ENV" == "production" ]]; then
        base_url="$NEXTAUTH_URL"
    fi
    
    # 健康检查
    health_check "主应用" "$base_url/api/health"
    health_check "个性化系统" "$base_url/api/health/personalization"
    
    # 验证个性化功能
    info "验证个性化功能..."
    
    local test_endpoints=(
        "/api/personalization/recommendations"
        "/api/training/recommendations" 
        "/api/personalization/preferences"
    )
    
    for endpoint in "${test_endpoints[@]}"; do
        if curl -f -s -X POST -H "Content-Type: application/json" \
            -d '{"test": true}' "$base_url$endpoint" > /dev/null 2>&1; then
            info "$endpoint 端点正常"
        else
            warn "$endpoint 端点可能有问题，请检查日志"
        fi
    done
    
    # 验证缓存系统
    info "验证缓存系统..."
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" set "test:deploy" "success" > /dev/null 2>&1; then
        redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" del "test:deploy" > /dev/null 2>&1
        info "缓存系统正常"
    else
        warn "缓存系统可能有问题"
    fi
    
    log "部署后验证完成"
}

# 性能基准测试
run_performance_benchmark() {
    if [[ "$ENV" != "production" ]]; then
        log "运行性能基准测试..."
        
        cd "$PROJECT_DIR"
        
        # 个性化推荐性能测试
        info "测试个性化推荐性能..."
        node -e "
        const { performance } = require('perf_hooks');
        
        async function testRecommendations() {
            const start = performance.now();
            
            // 模拟推荐请求
            const response = await fetch('http://localhost:3000/api/personalization/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timeAvailable: 30,
                    preferredDifficulty: 3,
                    count: 10
                })
            });
            
            const end = performance.now();
            const responseTime = end - start;
            
            console.log(\`推荐响应时间: \${responseTime.toFixed(2)}ms\`);
            
            if (responseTime > 1000) {
                console.log('警告: 推荐响应时间超过1秒');
            }
        }
        
        testRecommendations().catch(console.error);
        "
        
        log "性能基准测试完成"
    fi
}

# 设置监控告警
setup_monitoring() {
    log "设置监控告警..."
    
    # 创建监控脚本
    cat > "/opt/scripts/personalization-monitor.sh" << 'EOF'
#!/bin/bash

# 个性化系统监控脚本

REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}
APP_URL=${NEXTAUTH_URL:-http://localhost:3000}

# 检查应用健康
if ! curl -f -s "$APP_URL/api/health/personalization" > /dev/null; then
    echo "个性化系统健康检查失败" | logger -t personalization-monitor
    exit 1
fi

# 检查Redis连接
if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
    echo "Redis连接失败" | logger -t personalization-monitor
    exit 1
fi

# 检查内存使用
MEMORY_USAGE=$(free | awk '/^Mem:/{printf "%.0f", $3/$2 * 100}')
if [[ $MEMORY_USAGE -gt 85 ]]; then
    echo "内存使用率过高: ${MEMORY_USAGE}%" | logger -t personalization-monitor
fi

# 检查缓存命中率
CACHE_HIT_RATE=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" info stats | grep 'keyspace_hits\|keyspace_misses' | awk -F: '{sum+=$2} END {if(sum>0) print (hits/sum)*100}' hits=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" info stats | grep keyspace_hits | cut -d: -f2))

echo "监控检查完成 - $(date)"
EOF

    chmod +x "/opt/scripts/personalization-monitor.sh"
    
    # 添加到crontab（每5分钟检查一次）
    (crontab -l 2>/dev/null; echo "*/5 * * * * /opt/scripts/personalization-monitor.sh") | crontab -
    
    log "监控告警设置完成"
}

# 清理函数
cleanup() {
    log "清理临时文件..."
    
    # 清理构建产物
    rm -rf "$PROJECT_DIR/.next/cache"
    rm -rf "$PROJECT_DIR/node_modules/.cache"
    
    # 清理日志文件（保留最近7天）
    find /var/log -name "*personalization*" -mtime +7 -delete 2>/dev/null || true
    
    log "清理完成"
}

# 回滚功能
rollback() {
    local backup_file=$1
    
    if [[ -z "$backup_file" ]]; then
        error "请指定备份文件"
    fi
    
    log "开始回滚到备份: $backup_file"
    
    # 停止服务
    docker-compose down 2>/dev/null || pkill -f "next start" || true
    
    # 恢复数据库
    if [[ -f "$backup_file" ]]; then
        gunzip -c "$backup_file" | PGPASSWORD="$DATABASE_PASSWORD" psql \
            -h "$DATABASE_HOST" \
            -U "$DATABASE_USERNAME" \
            -d "$DATABASE_NAME"
    fi
    
    # 重新启动服务
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d
    else
        NODE_ENV="$ENV" nohup npm start > /var/log/pokeriq-app.log 2>&1 &
    fi
    
    log "回滚完成"
}

# 显示帮助信息
show_help() {
    cat << EOF
PokerIQ Pro个性化系统部署脚本

用法: $0 [环境] [选项]

环境:
  development  开发环境
  staging      预发布环境  
  production   生产环境

选项:
  --skip-tests     跳过测试
  --skip-backup    跳过备份
  --docker         使用Docker部署
  --rollback FILE  回滚到指定备份
  --help           显示此帮助信息

示例:
  $0 staging                    # 部署到staging环境
  $0 production --docker        # 使用Docker部署到生产环境
  $0 production --skip-tests    # 跳过测试直接部署
  $0 --rollback backup.sql.gz   # 回滚到指定备份

EOF
}

# 主要部署流程
main() {
    local skip_tests=false
    local skip_backup=false
    local use_docker=false
    local rollback_file=""
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --skip-backup)
                skip_backup=true
                shift
                ;;
            --docker)
                use_docker=true
                shift
                ;;
            --rollback)
                rollback_file="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            development|staging|production)
                if [[ -z "${ENV:-}" ]]; then
                    ENV="$1"
                fi
                shift
                ;;
            *)
                error "未知参数: $1"
                ;;
        esac
    done
    
    # 如果指定了回滚，执行回滚流程
    if [[ -n "$rollback_file" ]]; then
        rollback "$rollback_file"
        exit 0
    fi
    
    # 创建日志目录
    mkdir -p "$(dirname "$LOG_FILE")"
    
    log "开始部署个性化系统 - 环境: $ENV"
    
    # 执行部署步骤
    check_dependencies
    validate_environment
    
    if [[ "$skip_backup" != true ]]; then
        backup_database
        backup_redis
    fi
    
    check_database
    check_redis
    
    build_application
    run_migrations
    
    if [[ "$skip_tests" != true ]]; then
        run_tests
    fi
    
    if [[ "$use_docker" == true ]]; then
        deploy_docker
    else
        deploy_direct
    fi
    
    post_deploy_verification
    run_performance_benchmark
    setup_monitoring
    cleanup
    
    log "个性化系统部署完成！"
    info "应用地址: ${NEXTAUTH_URL:-http://localhost:3000}"
    info "健康检查: ${NEXTAUTH_URL:-http://localhost:3000}/api/health/personalization"
    info "监控面板: ${NEXTAUTH_URL:-http://localhost:3000}/admin/personalization-metrics"
}

# 错误处理
trap 'error "部署过程中发生错误，请检查日志文件: $LOG_FILE"' ERR

# 确保以root权限运行某些操作
if [[ $EUID -ne 0 && "$ENV" == "production" ]]; then
    warn "建议以root权限运行生产环境部署"
fi

# 执行主流程
main "$@"