#!/bin/bash

# PokerIQ Pro 测试环境快速部署脚本（修复版）
# 确保所有必要文件和目录都存在，并提供完整的部署流程

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 错误处理函数
handle_error() {
    log_error "部署过程中发生错误，退出码: $1"
    log_error "错误发生在第 $2 行"
    cleanup_on_error
    exit $1
}

trap 'handle_error $? $LINENO' ERR

# 清理函数
cleanup_on_error() {
    log_warning "执行错误清理操作..."
    # 停止可能正在运行的容器
    docker-compose down --remove-orphans 2>/dev/null || true
    log_info "清理完成"
}

# 检查系统依赖
check_dependencies() {
    log_step "检查系统依赖..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装Docker"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装Docker Compose"
        exit 1
    fi
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_warning "Node.js 未安装，可能影响某些功能"
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_warning "npm 未安装，可能影响依赖管理"
    fi
    
    log_success "系统依赖检查完成"
}

# 检查Docker状态
check_docker_status() {
    log_step "检查Docker服务状态..."
    
    if ! docker info &> /dev/null; then
        log_error "Docker 服务未运行，请启动Docker"
        exit 1
    fi
    
    log_success "Docker 服务正常运行"
}

# 检查并创建目录结构
ensure_directories() {
    log_step "确保所有必要目录存在..."
    
    # 创建所有服务目录
    mkdir -p ai-service
    mkdir -p profile-service
    mkdir -p recommendation-service
    mkdir -p system-integration
    mkdir -p load-testing
    mkdir -p scripts
    mkdir -p database/{init,backups}
    mkdir -p monitoring/{dashboards,config,alerts}
    mkdir -p ai-models/{poker,gto}
    mkdir -p ml-models/{training,inference}
    mkdir -p logs/{postgres,redis,clickhouse,api-gateway,services}
    mkdir -p config/{nginx,ssl}
    mkdir -p data/{uploads,exports}
    mkdir -p .env/{development,testing,production}
    
    log_success "目录结构检查完成"
}

# 创建缺失的Dockerfile
create_missing_dockerfiles() {
    log_step "检查并创建缺失的Dockerfile..."
    
    # AI服务Dockerfile
    if [ ! -f "ai-service/Dockerfile" ]; then
        log_info "创建AI服务Dockerfile..."
        cat > ai-service/Dockerfile << EOF
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
EOF
        log_success "AI服务Dockerfile已创建"
    fi
    
    # Profile服务Dockerfile
    if [ ! -f "profile-service/Dockerfile" ]; then
        log_info "创建Profile服务Dockerfile..."
        cat > profile-service/Dockerfile << EOF
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8002

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002", "--reload"]
EOF
        log_success "Profile服务Dockerfile已创建"
    fi
    
    # Recommendation服务Dockerfile
    if [ ! -f "recommendation-service/Dockerfile" ]; then
        log_info "创建Recommendation服务Dockerfile..."
        cat > recommendation-service/Dockerfile << EOF
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8003

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003", "--reload"]
EOF
        log_success "Recommendation服务Dockerfile已创建"
    fi
}

# 创建默认配置文件
create_default_configs() {
    log_step "创建默认配置文件..."
    
    # 创建.env文件
    if [ ! -f ".env" ]; then
        log_info "创建默认.env文件..."
        cat > .env << EOF
# 数据库配置
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=pokeriq_test
POSTGRES_USER=pokeriq_user
POSTGRES_PASSWORD=pokeriq_password
DATABASE_URL=postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@\${POSTGRES_HOST}:\${POSTGRES_PORT}/\${POSTGRES_DB}

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password
REDIS_URL=redis://:\${REDIS_PASSWORD}@\${REDIS_HOST}:\${REDIS_PORT}

# ClickHouse配置
CLICKHOUSE_HOST=clickhouse
CLICKHOUSE_PORT=8123
CLICKHOUSE_DB=analytics
CLICKHOUSE_USER=analytics_user
CLICKHOUSE_PASSWORD=analytics_password

# API配置
API_GATEWAY_PORT=8000
AI_SERVICE_PORT=8001
PROFILE_SERVICE_PORT=8002
RECOMMENDATION_SERVICE_PORT=8003

# 环境标识
ENVIRONMENT=testing
DEBUG=true
LOG_LEVEL=info
EOF
        log_success "默认.env文件已创建"
    fi
}

# 构建并启动服务
build_and_start_services() {
    log_step "构建并启动所有服务..."
    
    # 停止已存在的容器
    log_info "停止现有容器..."
    docker-compose down --remove-orphans 2>/dev/null || true
    
    # 清理旧镜像（可选）
    if [ "$1" = "--clean" ]; then
        log_info "清理旧镜像..."
        docker-compose down --rmi all --volumes --remove-orphans 2>/dev/null || true
    fi
    
    # 构建新镜像
    log_info "构建服务镜像..."
    docker-compose build --no-cache
    
    # 启动服务
    log_info "启动服务..."
    docker-compose up -d
    
    # 等待服务就绪
    log_info "等待服务启动..."
    sleep 10
    
    log_success "服务启动完成"
}

# 健康检查
health_check() {
    log_step "执行健康检查..."
    
    local services=("postgres:5432" "redis:6379" "clickhouse:8123")
    local failed_services=()
    
    for service in "${services[@]}"; do
        local host=$(echo $service | cut -d: -f1)
        local port=$(echo $service | cut -d: -f2)
        
        if docker-compose exec -T $host nc -z localhost $port 2>/dev/null; then
            log_success "$host 服务健康检查通过"
        else
            log_error "$host 服务健康检查失败"
            failed_services+=($host)
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        log_success "所有服务健康检查通过"
        return 0
    else
        log_error "以下服务健康检查失败: ${failed_services[*]}"
        return 1
    fi
}

# 显示部署状态
show_deployment_status() {
    log_step "显示部署状态..."
    
    echo ""
    echo -e "${CYAN}========== 部署状态 ==========${NC}"
    docker-compose ps
    
    echo ""
    echo -e "${CYAN}========== 服务访问地址 ==========${NC}"
    echo -e "${GREEN}API Gateway:${NC} http://localhost:8000"
    echo -e "${GREEN}AI Service:${NC} http://localhost:8001"
    echo -e "${GREEN}Profile Service:${NC} http://localhost:8002"
    echo -e "${GREEN}Recommendation Service:${NC} http://localhost:8003"
    echo -e "${GREEN}PostgreSQL:${NC} localhost:5432"
    echo -e "${GREEN}Redis:${NC} localhost:6379"
    echo -e "${GREEN}ClickHouse:${NC} http://localhost:8123"
    
    echo ""
    echo -e "${CYAN}========== 管理命令 ==========${NC}"
    echo -e "${YELLOW}查看日志:${NC} docker-compose logs -f [service_name]"
    echo -e "${YELLOW}停止服务:${NC} docker-compose down"
    echo -e "${YELLOW}重启服务:${NC} docker-compose restart [service_name]"
    echo -e "${YELLOW}查看状态:${NC} docker-compose ps"
    echo ""
}

# 主函数
main() {
    echo "🚀 PokerIQ Pro 测试环境部署（修复版）"
    echo "========================================"
    
    # 解析命令行参数
    local clean_flag=""
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean)
                clean_flag="--clean"
                shift
                ;;
            -h|--help)
                echo "使用方法: $0 [选项]"
                echo "选项:"
                echo "  --clean    清理所有镜像和卷后重新构建"
                echo "  -h, --help 显示此帮助信息"
                exit 0
                ;;
            *)
                log_error "未知参数: $1"
                exit 1
                ;;
        esac
    done
    
    # 执行部署步骤
    check_dependencies
    check_docker_status
    ensure_directories
    create_missing_dockerfiles
    create_default_configs
    
    # 如果存在docker-compose.yml，则使用它
    if [ -f "docker-compose.yml" ]; then
        build_and_start_services $clean_flag
        
        # 等待服务启动
        sleep 15
        
        # 健康检查
        if health_check; then
            show_deployment_status
            log_success "部署完成！测试环境已就绪"
        else
            log_error "部署过程中出现问题，请检查服务状态"
            docker-compose logs
            exit 1
        fi
    else
        log_warning "未找到docker-compose.yml文件"
        
        # 运行原始部署脚本
        if [ -f "deploy-test-env.sh" ]; then
            log_info "运行原始部署脚本..."
            chmod +x deploy-test-env.sh
            ./deploy-test-env.sh
        else
            log_error "未找到docker-compose.yml或deploy-test-env.sh文件"
            log_info "请确保在正确的项目目录中运行此脚本"
            exit 1
        fi
    fi
}

# 执行主函数
main "$@"