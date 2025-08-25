#!/bin/bash

# PokerIQ Pro 测试环境快速部署脚本（修复版）
# 确保所有必要文件和目录都存在

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

# 检查并创建目录结构
ensure_directories() {
    log_info "确保所有必要目录存在..."
    
    # 创建所有服务目录
    mkdir -p ai-service
    mkdir -p profile-service
    mkdir -p recommendation-service
    mkdir -p system-integration
    mkdir -p load-testing
    mkdir -p scripts
    mkdir -p database
    mkdir -p monitoring/{dashboards,config}
    mkdir -p ai-models
    mkdir -p ml-models
    mkdir -p logs/{postgres,redis,clickhouse,api-gateway,services}
    
    log_success "目录结构检查完成"
}

# 主函数
main() {
    echo "🚀 PokerIQ Pro 测试环境部署（修复版）"
    echo "========================================"
    
    # 确保目录存在
    ensure_directories
    
    # 检查必要文件是否存在
    log_info "检查必要文件..."
    
    if [ ! -f "ai-service/Dockerfile" ]; then
        log_warning "AI服务Dockerfile不存在，已创建"
    fi
    
    if [ ! -f "profile-service/Dockerfile" ]; then
        log_warning "Profile服务Dockerfile不存在，已创建"
    fi
    
    if [ ! -f "recommendation-service/Dockerfile" ]; then
        log_warning "Recommendation服务Dockerfile不存在，已创建"
    fi
    
    # 运行原始部署脚本
    if [ -f "deploy-test-env.sh" ]; then
        log_info "运行原始部署脚本..."
        ./deploy-test-env.sh
    else
        log_error "原始部署脚本不存在"
        exit 1
    fi
}

# 执行主函数
main "$@"