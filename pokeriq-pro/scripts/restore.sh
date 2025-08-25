#!/bin/bash

# PokerIQ Pro 恢复脚本
# 用于从备份恢复数据

set -e

# 配置
BACKUP_DIR="/var/backups/pokeriq"
S3_BUCKET=${BACKUP_BUCKET:-"pokeriq-backups"}

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 显示使用说明
show_usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

Options:
    -t, --timestamp TIMESTAMP   Backup timestamp to restore
    -s, --source SOURCE        Backup source (local|s3)
    -d, --database             Restore database only
    -r, --redis                Restore Redis only
    -a, --application          Restore application files only
    -u, --uploads              Restore uploads only
    -l, --list                 List available backups
    -h, --help                 Show this help message

Examples:
    $0 --list                              # List all backups
    $0 --timestamp 20240101_120000         # Restore specific backup
    $0 --timestamp latest --database       # Restore latest database backup
    $0 --source s3 --timestamp 20240101    # Restore from S3

EOF
}

# 列出可用备份
list_backups() {
    log_info "Available local backups:"
    ls -lh "$BACKUP_DIR"/*.gz 2>/dev/null | tail -20 || echo "No local backups found"
    
    if command -v aws &> /dev/null && [ ! -z "$S3_BUCKET" ]; then
        log_info "\nAvailable S3 backups:"
        aws s3 ls "s3://$S3_BUCKET/backups/" --human-readable | tail -20 || echo "No S3 backups found"
    fi
}

# 获取最新备份时间戳
get_latest_timestamp() {
    local type=$1
    local latest=""
    
    case $type in
        postgres)
            latest=$(ls -t "$BACKUP_DIR"/postgres_*.gz 2>/dev/null | head -1 | sed 's/.*postgres_\([0-9_]*\)\.sql\.gz/\1/')
            ;;
        redis)
            latest=$(ls -t "$BACKUP_DIR"/redis_*.gz 2>/dev/null | head -1 | sed 's/.*redis_\([0-9_]*\)\.rdb\.gz/\1/')
            ;;
        app)
            latest=$(ls -t "$BACKUP_DIR"/app_*.tar.gz 2>/dev/null | head -1 | sed 's/.*app_\([0-9_]*\)\.tar\.gz/\1/')
            ;;
        uploads)
            latest=$(ls -t "$BACKUP_DIR"/uploads_*.tar.gz 2>/dev/null | head -1 | sed 's/.*uploads_\([0-9_]*\)\.tar\.gz/\1/')
            ;;
        *)
            latest=$(ls -t "$BACKUP_DIR"/*.gz 2>/dev/null | head -1 | sed 's/.*_\([0-9_]*\)\..*/\1/')
            ;;
    esac
    
    echo "$latest"
}

# 从S3下载备份
download_from_s3() {
    local timestamp=$1
    local type=$2
    
    log_info "Downloading backup from S3..."
    
    local pattern="backups/${type}_${timestamp}"
    aws s3 sync "s3://$S3_BUCKET/" "$BACKUP_DIR/" \
        --exclude "*" \
        --include "${pattern}*"
}

# 验证备份文件
verify_backup() {
    local file=$1
    
    if [ ! -f "$file" ]; then
        log_error "Backup file not found: $file"
        return 1
    fi
    
    # 验证校验和
    if [ -f "${file}.sha256" ]; then
        local expected=$(cat "${file}.sha256")
        local actual=$(sha256sum "$file" | awk '{print $1}')
        if [ "$expected" != "$actual" ]; then
            log_error "Checksum verification failed for $file"
            return 1
        fi
    fi
    
    # 测试压缩文件
    if [[ $file == *.gz ]]; then
        gzip -t "$file"
        if [ $? -ne 0 ]; then
            log_error "Backup file is corrupted: $file"
            return 1
        fi
    fi
    
    log_info "Backup file verified: $file"
    return 0
}

# 恢复PostgreSQL数据库
restore_postgres() {
    local timestamp=$1
    local backup_file="$BACKUP_DIR/postgres_${timestamp}.sql.gz"
    
    log_info "Restoring PostgreSQL database from $backup_file..."
    
    # 验证备份文件
    verify_backup "$backup_file" || return 1
    
    # 确认操作
    read -p "This will replace the current database. Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Database restore cancelled"
        return 1
    fi
    
    # 创建临时数据库
    local temp_db="pokeriq_restore_temp"
    psql "$DATABASE_URL" -c "CREATE DATABASE $temp_db" || true
    
    # 恢复到临时数据库
    gunzip -c "$backup_file" | psql "postgresql://.../$temp_db"
    
    if [ $? -eq 0 ]; then
        # 切换数据库
        psql "$DATABASE_URL" -c "ALTER DATABASE pokeriq_prod RENAME TO pokeriq_old"
        psql "$DATABASE_URL" -c "ALTER DATABASE $temp_db RENAME TO pokeriq_prod"
        psql "$DATABASE_URL" -c "DROP DATABASE pokeriq_old"
        
        log_info "Database restored successfully"
    else
        log_error "Database restore failed"
        psql "$DATABASE_URL" -c "DROP DATABASE $temp_db" || true
        return 1
    fi
}

# 恢复Redis数据
restore_redis() {
    local timestamp=$1
    local backup_file="$BACKUP_DIR/redis_${timestamp}.rdb.gz"
    
    log_info "Restoring Redis data from $backup_file..."
    
    # 验证备份文件
    verify_backup "$backup_file" || return 1
    
    # 停止Redis
    systemctl stop redis || true
    
    # 解压并恢复
    gunzip -c "$backup_file" > /var/lib/redis/dump.rdb
    chown redis:redis /var/lib/redis/dump.rdb
    
    # 重启Redis
    systemctl start redis
    
    log_info "Redis data restored successfully"
}

# 恢复应用文件
restore_application() {
    local timestamp=$1
    local backup_file="$BACKUP_DIR/app_${timestamp}.tar.gz"
    
    log_info "Restoring application files from $backup_file..."
    
    # 验证备份文件
    verify_backup "$backup_file" || return 1
    
    # 备份当前文件
    log_info "Backing up current application files..."
    tar -czf "$BACKUP_DIR/app_before_restore_$(date +%Y%m%d_%H%M%S).tar.gz" \
        /var/www/pokeriq-pro/app \
        /var/www/pokeriq-pro/lib \
        2>/dev/null || true
    
    # 解压恢复
    tar -xzf "$backup_file" -C /
    
    # 重新安装依赖
    cd /var/www/pokeriq-pro
    npm ci --production
    
    # 重建应用
    npm run build
    
    # 重启应用
    pm2 restart pokeriq-pro
    
    log_info "Application files restored successfully"
}

# 恢复上传文件
restore_uploads() {
    local timestamp=$1
    local backup_file="$BACKUP_DIR/uploads_${timestamp}.tar.gz"
    
    log_info "Restoring user uploads from $backup_file..."
    
    # 验证备份文件
    verify_backup "$backup_file" || return 1
    
    # 备份当前上传文件
    if [ -d "/var/www/pokeriq-pro/uploads" ]; then
        mv /var/www/pokeriq-pro/uploads "/var/www/pokeriq-pro/uploads.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # 解压恢复
    tar -xzf "$backup_file" -C /
    
    log_info "User uploads restored successfully"
}

# 主函数
main() {
    local timestamp=""
    local source="local"
    local restore_db=false
    local restore_redis=false
    local restore_app=false
    local restore_uploads=false
    local restore_all=true
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--timestamp)
                timestamp="$2"
                shift 2
                ;;
            -s|--source)
                source="$2"
                shift 2
                ;;
            -d|--database)
                restore_db=true
                restore_all=false
                shift
                ;;
            -r|--redis)
                restore_redis=true
                restore_all=false
                shift
                ;;
            -a|--application)
                restore_app=true
                restore_all=false
                shift
                ;;
            -u|--uploads)
                restore_uploads=true
                restore_all=false
                shift
                ;;
            -l|--list)
                list_backups
                exit 0
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # 如果没有指定时间戳，获取最新的
    if [ -z "$timestamp" ] || [ "$timestamp" = "latest" ]; then
        timestamp=$(get_latest_timestamp "all")
        if [ -z "$timestamp" ]; then
            log_error "No backups found"
            exit 1
        fi
        log_info "Using latest backup: $timestamp"
    fi
    
    # 从S3下载备份（如果需要）
    if [ "$source" = "s3" ]; then
        download_from_s3 "$timestamp" "*"
    fi
    
    # 设置恢复标志
    if [ "$restore_all" = true ]; then
        restore_db=true
        restore_redis=true
        restore_app=true
        restore_uploads=true
    fi
    
    log_info "Starting restore process..."
    log_info "Timestamp: $timestamp"
    log_info "Source: $source"
    
    # 执行恢复
    if [ "$restore_db" = true ]; then
        restore_postgres "$timestamp"
    fi
    
    if [ "$restore_redis" = true ]; then
        restore_redis "$timestamp"
    fi
    
    if [ "$restore_app" = true ]; then
        restore_application "$timestamp"
    fi
    
    if [ "$restore_uploads" = true ]; then
        restore_uploads "$timestamp"
    fi
    
    log_info "Restore process completed!"
}

# 错误处理
trap 'log_error "Restore failed with error code $?"; exit 1' ERR

# 检查权限
if [ "$EUID" -ne 0 ]; then
    log_error "This script must be run as root"
    exit 1
fi

# 执行主函数
main "$@"