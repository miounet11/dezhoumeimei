#!/bin/bash

# PostgreSQL 迁移脚本
# 用于从 SQLite 迁移到 PostgreSQL

set -e

echo "🚀 Starting database migration to PostgreSQL..."

# 检查环境变量
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo "Please set it to your PostgreSQL connection string"
  echo "Example: postgresql://user:password@localhost:5432/pokeriq_prod"
  exit 1
fi

# 备份当前 SQLite 数据库
if [ -f "prisma/dev.db" ]; then
  echo "📦 Backing up SQLite database..."
  cp prisma/dev.db prisma/dev.db.backup.$(date +%Y%m%d_%H%M%S)
  echo "✅ Backup created"
fi

# 使用生产环境 schema
echo "📝 Switching to production schema..."
cp prisma/schema.production.prisma prisma/schema.prisma

# 生成 Prisma Client
echo "🔧 Generating Prisma Client..."
npx prisma generate

# 创建数据库表
echo "🗄️ Creating database tables..."
npx prisma db push --skip-generate

# 运行迁移
echo "📊 Running migrations..."
npx prisma migrate deploy

# 如果有种子数据，运行种子脚本
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Seeding database..."
  npx tsx prisma/seed-production.ts
fi

echo "✅ Database migration completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with the PostgreSQL DATABASE_URL"
echo "2. Test the application with the new database"
echo "3. Monitor performance and adjust indexes if needed"