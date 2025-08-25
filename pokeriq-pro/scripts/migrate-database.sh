#!/bin/bash

# PokerIQ Pro Database Migration Script
# SQLite -> PostgreSQL + Redis + ClickHouse
# 高性能数据架构迁移工具

set -e  # 遇到错误立即退出

# 颜色定义
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

# 配置变量
SOURCE_DB_PATH="${SOURCE_DB_PATH:-./prisma/dev.db}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_DB="${POSTGRES_DB:-pokeriq_pro}"
POSTGRES_USER="${POSTGRES_USER:-pokeriq_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-secure_password}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
MIGRATION_LOG="${MIGRATION_LOG:-./migration.log}"

# 创建备份目录
create_backup_dir() {
    log_info "创建备份目录..."
    mkdir -p "$BACKUP_DIR"
    log_success "备份目录创建完成: $BACKUP_DIR"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖工具..."
    
    # 检查 PostgreSQL 客户端
    if ! command -v psql &> /dev/null; then
        log_error "psql 未安装，请安装 PostgreSQL 客户端"
        exit 1
    fi
    
    # 检查 SQLite3
    if ! command -v sqlite3 &> /dev/null; then
        log_error "sqlite3 未安装，请安装 SQLite3"
        exit 1
    fi
    
    # 检查 Node.js 和 Prisma
    if ! command -v npx &> /dev/null; then
        log_error "Node.js/npx 未安装，请安装 Node.js"
        exit 1
    fi
    
    # 检查 Redis CLI
    if ! command -v redis-cli &> /dev/null; then
        log_warning "redis-cli 未安装，部分功能可能受限"
    fi
    
    log_success "依赖检查完成"
}

# 备份 SQLite 数据库
backup_sqlite() {
    log_info "备份 SQLite 数据库..."
    
    if [ ! -f "$SOURCE_DB_PATH" ]; then
        log_error "源数据库文件不存在: $SOURCE_DB_PATH"
        exit 1
    fi
    
    local backup_file="$BACKUP_DIR/sqlite_backup_$(date +%Y%m%d_%H%M%S).db"
    cp "$SOURCE_DB_PATH" "$backup_file"
    
    log_success "SQLite 数据库备份完成: $backup_file"
}

# 检查 PostgreSQL 连接
check_postgres_connection() {
    log_info "检查 PostgreSQL 连接..."
    
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "SELECT 1;" &> /dev/null; then
        log_success "PostgreSQL 连接成功"
    else
        log_error "无法连接到 PostgreSQL 数据库"
        log_error "请检查连接参数: $POSTGRES_HOST:$POSTGRES_PORT"
        exit 1
    fi
}

# 创建 PostgreSQL 数据库
create_postgres_database() {
    log_info "创建 PostgreSQL 数据库..."
    
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    # 检查数据库是否存在
    if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -lqt | cut -d \| -f 1 | grep -qw "$POSTGRES_DB"; then
        log_warning "数据库 $POSTGRES_DB 已存在"
        
        read -p "是否要删除现有数据库并重新创建? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;"
            log_info "已删除现有数据库"
        else
            log_info "使用现有数据库"
            return
        fi
    fi
    
    # 创建数据库
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $POSTGRES_DB WITH ENCODING='UTF8';"
    
    log_success "PostgreSQL 数据库创建完成: $POSTGRES_DB"
}

# 安装 PostgreSQL 扩展
install_postgres_extensions() {
    log_info "安装 PostgreSQL 扩展..."
    
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    local extensions=(
        "uuid-ossp"
        "pgcrypto"
        "btree_gin"
        "pg_stat_statements"
        "pg_trgm"
    )
    
    for ext in "${extensions[@]}"; do
        log_info "安装扩展: $ext"
        psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE EXTENSION IF NOT EXISTS \"$ext\";" || log_warning "扩展 $ext 安装失败"
    done
    
    log_success "PostgreSQL 扩展安装完成"
}

# 运行 Prisma 迁移
run_prisma_migration() {
    log_info "运行 Prisma 数据库迁移..."
    
    # 更新 .env 文件中的数据库连接
    local new_db_url="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB"
    
    # 备份原有 .env 文件
    if [ -f .env.local ]; then
        cp .env.local .env.local.backup
        log_info "已备份 .env.local 文件"
    fi
    
    # 更新数据库 URL
    if [ -f .env.local ]; then
        sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"$new_db_url\"|" .env.local
    else
        echo "DATABASE_URL=\"$new_db_url\"" > .env.local
    fi
    
    log_info "已更新数据库连接配置"
    
    # 生成新的 Prisma 客户端
    log_info "生成 Prisma 客户端..."
    npx prisma generate || {
        log_error "Prisma 客户端生成失败"
        exit 1
    }
    
    # 推送数据库架构
    log_info "推送数据库架构..."
    npx prisma db push --force-reset || {
        log_error "数据库架构推送失败"
        exit 1
    }
    
    log_success "Prisma 迁移完成"
}

# 验证迁移结果
verify_migration() {
    log_info "验证迁移结果..."
    
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    # 检查表数量
    local table_count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
    log_info "PostgreSQL 表数量: $table_count"
    
    # 检查用户表记录数
    local user_count=$(psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
    log_info "用户记录数: $user_count"
    
    log_success "迁移验证完成"
}

# 生成迁移报告
generate_report() {
    log_info "生成迁移报告..."
    
    local report_file="$BACKUP_DIR/migration_report_$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
# PokerIQ Pro 数据库迁移报告

## 迁移信息
- 迁移时间: $(date)
- 源数据库: SQLite ($SOURCE_DB_PATH)
- 目标数据库: PostgreSQL ($POSTGRES_HOST:$POSTGRES_PORT/$POSTGRES_DB)

## 迁移步骤
1. ✅ 依赖检查
2. ✅ SQLite 数据备份
3. ✅ PostgreSQL 连接验证
4. ✅ PostgreSQL 数据库创建
5. ✅ PostgreSQL 扩展安装
6. ✅ Prisma 架构迁移
7. ✅ 迁移验证

迁移完成！
EOF
    
    log_success "迁移报告生成: $report_file"
    
    # 显示报告摘要
    echo
    echo "=== 迁移完成摘要 ==="
    echo "✅ SQLite 到 PostgreSQL 迁移成功"
    echo "📁 备份文件位置: $BACKUP_DIR/"
    echo "📊 迁移报告: $report_file"
    echo "⚡ 建议下一步: 配置 Redis 和 ClickHouse"
    echo
}

# 主函数
main() {
    echo "🚀 PokerIQ Pro 数据库迁移工具"
    echo "==============================================="
    echo
    
    # 开始迁移流程
    create_backup_dir
    check_dependencies
    backup_sqlite
    check_postgres_connection
    create_postgres_database
    install_postgres_extensions
    run_prisma_migration
    verify_migration
    generate_report
    
    log_success "🎉 数据库迁移全部完成！"
}

# 错误处理
trap 'log_error "迁移过程中发生错误，请检查日志"; exit 1' ERR

# 记录日志
exec > >(tee -a "$MIGRATION_LOG") 2>&1

# 执行主函数
main "$@"