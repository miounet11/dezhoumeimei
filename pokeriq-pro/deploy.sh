#!/bin/bash

# PokerIQ Pro Deployment Script
# Usage: ./deploy.sh [production|staging|development]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/${TIMESTAMP}"

echo "🚀 Starting PokerIQ Pro deployment for ${ENVIRONMENT}..."

# Load environment variables
if [ -f ".env.${ENVIRONMENT}" ]; then
    export $(cat .env.${ENVIRONMENT} | xargs)
else
    echo "❌ Environment file .env.${ENVIRONMENT} not found!"
    exit 1
fi

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Backup database
echo "📦 Backing up database..."
docker exec pokeriq_postgres pg_dump -U pokeriq_user pokeriq_db > ${BACKUP_DIR}/database.sql || true

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Build application
echo "🏗️ Building application..."
npm run build:prod

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose -f docker-compose.yml build

# Stop old containers
echo "🛑 Stopping old containers..."
docker-compose down

# Start new containers
echo "▶️ Starting new containers..."
if [ "$ENVIRONMENT" = "production" ]; then
    docker-compose -f docker-compose.yml up -d
else
    docker-compose -f docker-compose.${ENVIRONMENT}.yml up -d
fi

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Run health checks
echo "🏥 Running health checks..."
curl -f http://localhost:3000/health || exit 1

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

# Success message
echo "✅ Deployment completed successfully!"
echo "📊 Application is running at:"
echo "   - Frontend: http://localhost:3000"
echo "   - Database: postgresql://localhost:5432/pokeriq_db"
echo "   - Redis: redis://localhost:6379"

# Show container status
echo ""
echo "📋 Container status:"
docker-compose ps