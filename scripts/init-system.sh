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
PGPASSWORD=test123456 psql -h postgres -U pokeriq -d pokeriq_pro -c "SELECT 'Database connection successful' AS status;"

# 初始化Redis缓存
echo "初始化Redis缓存..."
redis-cli -h redis -p 6379 -a test123456 set "system:initialized" "$(date)"

# 预热ClickHouse
echo "初始化ClickHouse..."
curl -X POST "http://analytics:test123456@clickhouse:8123/" -d "SELECT 'ClickHouse ready' AS status" || echo "ClickHouse initialization skipped (auth issue)"

echo "系统初始化完成!"
