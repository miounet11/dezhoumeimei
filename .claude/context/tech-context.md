---
created: 2025-08-26T05:31:05Z
last_updated: 2025-08-26T05:31:05Z
version: 1.0
author: Claude Code PM System
---

# Technology Context and Dependencies

## Primary Technology Stack

### Frontend Technology
- **Framework**: Next.js 15.4.6 with App Router + Turbopack
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + Ant Design Pro 2.8.10
- **State Management**: Redux Toolkit 2.8.2
- **Data Visualization**: Recharts 3.1 + D3.js 7.9
- **Real-time**: Socket.io-client 4.8.1
- **Animation**: Framer Motion 12.23.12
- **Icons**: Lucide React

### Backend Technology
- **API Gateway**: Node.js with Express/Fastify
- **AI Services**: Python 3.10+ with FastAPI
- **Authentication**: NextAuth.js + JWT
- **ORM**: Prisma (PostgreSQL)
- **Caching**: ioredis (Redis client)

### Database Technology
- **Primary DB**: PostgreSQL 15+ (with UUID support)
- **Cache Layer**: Redis 7.0+ (multiple instances)
- **Analytics DB**: ClickHouse (for training data)
- **Session Store**: Redis with persistence

### DevOps and Infrastructure
- **Containerization**: Docker + Docker Compose
- **Monitoring**: Prometheus + Grafana
- **Logging**: Pino (structured logging)
- **Error Tracking**: Sentry
- **Load Testing**: Custom Node.js tools

## Python Service Dependencies

### Core AI/ML Libraries
```python
# AI and Machine Learning
tensorflow>=2.13.0
pytorch>=2.0.0
numpy>=1.21.0
pandas>=1.3.0
scikit-learn>=1.0.0

# Web Framework
fastapi>=0.100.0
uvicorn>=0.18.0
pydantic>=2.0.0

# Database and Caching
asyncpg>=0.28.0
redis>=4.5.0

# Poker-specific
pokereval  # Hand evaluation
```

### Service-Specific Dependencies
- **ai-service**: TensorFlow/PyTorch for GTO solving
- **profile-service**: Scikit-learn for user modeling  
- **recommendation-service**: Advanced ML algorithms

## Node.js Dependencies Overview

### Production Dependencies (pokeriq-pro)
```json
{
  "next": "15.4.6",
  "@prisma/client": "^6.13.0",
  "@reduxjs/toolkit": "^2.8.2",
  "antd": "^5.26.7",
  "socket.io": "^4.8.1",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

### Development Tools
```json
{
  "@testing-library/react": "^16.3.0",
  "jest": "^30.0.5",
  "eslint": "^9",
  "prettier": "^3.6.2",
  "docker": "latest"
}
```

## Development Environment Requirements

### Minimum Requirements
- **Node.js**: 18+ LTS
- **Python**: 3.10+
- **Docker**: 20.10+
- **PostgreSQL**: 15+
- **Redis**: 7.0+

### Recommended Development Tools
- **IDE**: VS Code with extensions
- **Database GUI**: Prisma Studio (port 8840)
- **API Testing**: Postman/Thunder Client
- **Docker Desktop**: For container management

## Runtime Configuration

### Port Allocation
```
3000    # Alternative frontend port
3001    # API Gateway / System Integration  
3002    # Grafana dashboard
5432    # PostgreSQL
6379    # Redis
8001    # AI/GTO service
8003    # Profile service
8004    # Recommendation service
8080    # Database admin (Adminer)
8123    # ClickHouse HTTP
8820    # Main frontend (primary)
8840    # Prisma Studio
9090    # Prometheus metrics
```

### Environment Variables
```bash
# Core Database
DATABASE_URL="postgresql://user:pass@localhost:5432/pokeriq_pro"
REDIS_URL="redis://localhost:6379"
CLICKHOUSE_URL="http://localhost:8123"

# Authentication
JWT_SECRET="production-secret"
NEXTAUTH_SECRET="nextauth-secret"

# External Services
STRIPE_PUBLIC_KEY=""
STRIPE_SECRET_KEY=""
```

## Performance Considerations

### Frontend Optimizations
- **Bundle Splitting**: Vendor chunks separated
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Next.js Image component
- **Caching Strategy**: Multi-layer (browser, CDN, Redis)

### Backend Optimizations
- **Connection Pooling**: PostgreSQL connection management
- **Query Optimization**: Prisma with proper indexing
- **Async Processing**: Python asyncio for AI services
- **Memory Management**: Redis eviction policies configured

### Database Performance
- **Indexing Strategy**: Composite indexes on query patterns
- **Partitioning**: Large tables partitioned by date/user
- **Caching**: Frequently accessed data in Redis
- **Analytics**: ClickHouse for time-series data

## Deployment Architecture

### Container Strategy
- **Multi-stage builds**: Optimized Docker images
- **Service isolation**: Each microservice containerized
- **Data persistence**: Volume mounts for databases
- **Health checks**: All services monitored

### Scaling Approach  
- **Horizontal**: Load balancer + multiple instances
- **Database**: Read replicas for PostgreSQL
- **Cache**: Redis cluster for high availability
- **CDN**: Static assets served from edge locations