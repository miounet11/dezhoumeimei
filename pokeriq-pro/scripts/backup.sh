#!/bin/bash

# PokerIQ Pro 备份脚本
# 用于自动备份数据库和重要文件

set -e

# 配置
BACKUP_DIR="/var/backups/pokeriq"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30
S3_BUCKET=${BACKUP_BUCKET:-"pokeriq-backups"}
SLACK_WEBHOOK=${SLACK_WEBHOOK_URL:-""}

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

# 发送通知
send_notification() {
    local status=$1
    local message=$2
    
    if [ ! -z "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Backup ${status}: ${message}\"}" \
            "$SLACK_WEBHOOK" 2>/dev/null || true
    fi
}

# 创建备份目录
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# 备份PostgreSQL数据库
backup_postgres() {
    log_info "Starting PostgreSQL backup..."
    
    local db_backup_file="$BACKUP_DIR/postgres_${TIMESTAMP}.sql"
    
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL not set"
        return 1
    fi
    
    # 执行备份
    pg_dump "$DATABASE_URL" > "$db_backup_file"
    
    # 压缩备份文件
    gzip "$db_backup_file"
    local compressed_file="${db_backup_file}.gz"
    
    # 计算校验和
    local checksum=$(sha256sum "$compressed_file" | awk '{print $1}')
    echo "$checksum" > "${compressed_file}.sha256"
    
    log_info "PostgreSQL backup completed: $compressed_file"
    echo "$compressed_file"
}

# 备份Redis数据
backup_redis() {
    log_info "Starting Redis backup..."
    
    local redis_backup_file="$BACKUP_DIR/redis_${TIMESTAMP}.rdb"
    
    # 触发Redis持久化
    redis-cli BGSAVE
    
    # 等待备份完成
    while [ $(redis-cli LASTSAVE) -eq $(redis-cli LASTSAVE) ]; do
        sleep 1
    done
    
    # 复制RDB文件
    cp /var/lib/redis/dump.rdb "$redis_backup_file"
    
    # 压缩
    gzip "$redis_backup_file"
    local compressed_file="${redis_backup_file}.gz"
    
    log_info "Redis backup completed: $compressed_file"
    echo "$compressed_file"
}

# 备份应用文件
backup_application() {
    log_info "Starting application files backup..."
    
    local app_backup_file="$BACKUP_DIR/app_${TIMESTAMP}.tar.gz"
    
    # 备份重要文件和目录
    tar -czf "$app_backup_file" \
        --exclude=node_modules \
        --exclude=.next \
        --exclude=.git \
        --exclude=*.log \
        --exclude=tmp \
        /var/www/pokeriq-pro/app \
        /var/www/pokeriq-pro/lib \
        /var/www/pokeriq-pro/public \
        /var/www/pokeriq-pro/prisma \
        /var/www/pokeriq-pro/package.json \
        /var/www/pokeriq-pro/.env.production \
        2>/dev/null || true
    
    log_info "Application backup completed: $app_backup_file"
    echo "$app_backup_file"
}

# 备份用户上传文件
backup_uploads() {
    log_info "Starting user uploads backup..."
    
    local uploads_backup_file="$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"
    
    if [ -d "/var/www/pokeriq-pro/uploads" ]; then
        tar -czf "$uploads_backup_file" /var/www/pokeriq-pro/uploads
        log_info "Uploads backup completed: $uploads_backup_file"
        echo "$uploads_backup_file"
    else
        log_warning "No uploads directory found"
    fi
}

# 上传到S3
upload_to_s3() {
    local file=$1
    local s3_key="backups/$(basename $file)"
    
    log_info "Uploading to S3: $file -> s3://$S3_BUCKET/$s3_key"
    
    aws s3 cp "$file" "s3://$S3_BUCKET/$s3_key" \
        --storage-class STANDARD_IA \
        --metadata "backup-date=$TIMESTAMP"
    
    # 上传校验和文件（如果存在）
    if [ -f "${file}.sha256" ]; then
        aws s3 cp "${file}.sha256" "s3://$S3_BUCKET/${s3_key}.sha256"
    fi
}

# 清理旧备份
cleanup_old_backups() {
    log_info "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    # 清理本地备份
    find "$BACKUP_DIR" -type f -name "*.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -type f -name "*.sha256" -mtime +$RETENTION_DAYS -delete
    
    # 清理S3备份
    if command -v aws &> /dev/null; then
        # 获取要删除的对象列表
        aws s3api list-objects --bucket "$S3_BUCKET" --prefix "backups/" \
            --query "Contents[?LastModified<='$(date -d "$RETENTION_DAYS days ago" -Iseconds)'].Key" \
            --output text | tr '\t' '\n' | while read key; do
            if [ ! -z "$key" ]; then
                aws s3 rm "s3://$S3_BUCKET/$key"
                log_info "Deleted old S3 backup: $key"
            fi
        done
    fi
}

# 验证备份
verify_backup() {
    local file=$1
    
    if [ ! -f "$file" ]; then
        log_error "Backup file not found: $file"
        return 1
    fi
    
    # 检查文件大小
    local size=$(stat -c%s "$file")
    if [ $size -lt 1000 ]; then
        log_error "Backup file too small: $file ($size bytes)"
        return 1
    fi
    
    # 验证压缩文件完整性
    if [[ $file == *.gz ]]; then
        gzip -t "$file" 2>/dev/null
        if [ $? -ne 0 ]; then
            log_error "Backup file corrupted: $file"
            return 1
        fi
    fi
    
    # 验证校验和（如果存在）
    if [ -f "${file}.sha256" ]; then
        local expected=$(cat "${file}.sha256")
        local actual=$(sha256sum "$file" | awk '{print $1}')
        if [ "$expected" != "$actual" ]; then
            log_error "Checksum mismatch for $file"
            return 1
        fi
    fi
    
    log_info "Backup verified: $file"
    return 0
}

# 生成备份报告
generate_report() {
    local report_file="$BACKUP_DIR/backup_report_${TIMESTAMP}.txt"
    
    cat > "$report_file" <<EOF
PokerIQ Pro Backup Report
========================
Date: $(date)
Timestamp: $TIMESTAMP

Backup Files:
$(ls -lh "$BACKUP_DIR"/*_${TIMESTAMP}* 2>/dev/null || echo "No backup files found")

Disk Usage:
$(df -h "$BACKUP_DIR")

Database Size:
$(psql "$DATABASE_URL" -c "SELECT pg_database_size(current_database())" -t 2>/dev/null || echo "N/A")

Redis Info:
$(redis-cli INFO memory | grep used_memory_human || echo "N/A")

S3 Bucket Status:
$(aws s3 ls "s3://$S3_BUCKET/backups/" --summarize --human-readable | tail -2 || echo "N/A")

EOF
    
    log_info "Backup report generated: $report_file"
    echo "$report_file"
}

# 主函数
main() {
    log_info "Starting PokerIQ Pro backup process..."
    
    # 创建备份目录
    create_backup_dir
    
    # 执行备份
    backup_files=()
    
    # PostgreSQL备份
    if db_file=$(backup_postgres); then
        backup_files+=("$db_file")
    else
        log_error "PostgreSQL backup failed"
        send_notification "FAILED" "PostgreSQL backup failed"
    fi
    
    # Redis备份
    if redis_file=$(backup_redis); then
        backup_files+=("$redis_file")
    else
        log_warning "Redis backup failed (non-critical)"
    fi
    
    # 应用文件备份
    if app_file=$(backup_application); then
        backup_files+=("$app_file")
    else
        log_warning "Application backup failed"
    fi
    
    # 用户上传文件备份
    if uploads_file=$(backup_uploads); then
        backup_files+=("$uploads_file")
    fi
    
    # 验证备份
    for file in "${backup_files[@]}"; do
        verify_backup "$file"
    done
    
    # 上传到S3
    if command -v aws &> /dev/null && [ ! -z "$S3_BUCKET" ]; then
        for file in "${backup_files[@]}"; do
            upload_to_s3 "$file"
        done
    else
        log_warning "S3 upload skipped (AWS CLI not available or S3_BUCKET not set)"
    fi
    
    # 清理旧备份
    cleanup_old_backups
    
    # 生成报告
    report_file=$(generate_report)
    
    # 发送成功通知
    send_notification "SUCCESS" "Backup completed. Files: ${#backup_files[@]}"
    
    log_info "Backup process completed successfully!"
    log_info "Backup files: ${backup_files[@]}"
}

# 错误处理
trap 'log_error "Backup failed with error code $?"; send_notification "FAILED" "Backup process failed"; exit 1' ERR

# 执行主函数
main "$@"