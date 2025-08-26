# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**PokerIQ Pro** is a comprehensive AI-powered Texas Hold'em poker training platform featuring:
- Multi-service microservices architecture with Next.js frontend and Python AI services
- Real-time training sessions with adaptive AI opponents and GTO (Game Theory Optimal) analysis
- Advanced analytics using PostgreSQL, Redis, and ClickHouse
- Full containerized deployment with Docker and monitoring via Prometheus/Grafana

## Key Technologies

- **Frontend**: Next.js 15.4.6 with App Router, TypeScript 5, Tailwind CSS 4, Ant Design Pro 2.8
- **Backend**: Node.js (API Gateway), Python FastAPI (AI services)
- **Databases**: PostgreSQL 15 (primary), Redis 7 (cache), ClickHouse (analytics)
- **State Management**: Redux Toolkit 2.8, Prisma ORM
- **Real-time**: Socket.io for WebSocket connections
- **DevOps**: Docker, Kubernetes-ready, Prometheus monitoring

## Essential Commands

### Development
```bash
# Install dependencies (main frontend app)
cd pokeriq-pro && npm install

# Start development server (runs on port 8820)
npm run dev

# Start with socket server
npm run dev:all

# Database operations
npm run db:migrate    # Run Prisma migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio on port 8840

# Code quality
npm run lint         # ESLint checks
npm run typecheck    # TypeScript type checking
npm run format       # Prettier formatting
```

### Testing
```bash
# Run tests
npm run test
npm run test:watch
npm run test:coverage

# Load testing
cd load-testing && npm run test
```

### Production Build
```bash
# Build for production
npm run build

# Start production server (port 8830)
npm start

# Docker deployment
docker-compose -f docker-compose.test.yml up -d
```

### Services Management
```bash
# Full system deployment (all services)
docker-compose -f docker-compose.test.yml up -d

# Individual AI services
cd ai-service && python main.py        # Port 8001
cd profile-service && python main.py   # Port 8003
cd recommendation-service && python main.py  # Port 8004
```

## Architecture Overview

### Multi-Service Architecture
```
Frontend (Next.js)     →  API Gateway (Node.js)     →  AI Services (Python)
     ↓                           ↓                           ↓
PostgreSQL Database    ←→  Redis Cache              →  ClickHouse Analytics
```

**Core Services:**
- **pokeriq-pro/**: Next.js frontend application (port 8820)
- **system-integration/**: API Gateway and service orchestration (port 3001)
- **ai-service/**: GTO solver and poker AI engine (port 8001)
- **profile-service/**: User profiling and behavior analysis (port 8003)
- **recommendation-service/**: ML-powered training recommendations (port 8004)
- **load-testing/**: Performance testing tools

### Key Directories
- **app/**: Next.js App Router pages and API routes
- **components/**: React components organized by feature
- **lib/**: Core utilities (auth, database, API clients, poker logic)
- **prisma/**: Database schema, migrations, and seed data
- **database/**: SQL initialization and ClickHouse setup
- **monitoring/**: Prometheus and Grafana configurations

### Database Schema Architecture
- **Users & Auth**: User management, JWT authentication, role-based access
- **Training System**: Sessions, hands, opponent configurations, skill assessments  
- **Analytics**: Training events, user statistics, performance metrics
- **Achievements**: Multi-level achievement system with XP and rewards
- **Real-time**: WebSocket state management and session tracking

### AI/ML Components
- **GTO Solver**: Counterfactual Regret Minimization (CFR) for optimal poker strategies
- **Opponent Models**: LSTM/Transformer models for adaptive AI opponents
- **Recommendation Engine**: Collaborative filtering and content-based recommendations
- **User Profiling**: Skill assessment and learning path optimization

## Development Guidelines

### Code Patterns
- **Authentication**: JWT with httpOnly cookies, NextAuth.js integration
- **API Design**: RESTful endpoints with standardized response formats
- **Error Handling**: Centralized error boundaries and logging with Pino
- **Caching Strategy**: Multi-layer caching (Redis, browser, CDN)
- **Real-time**: Socket.io for training sessions and live updates

### File Organization
- Group by feature rather than file type
- Use TypeScript interfaces in `types/` directory
- Shared utilities in `lib/` with clear separation of concerns
- Component co-location with related hooks and utilities

### Performance Optimizations
- Next.js 15 features: Server Actions, optimistic updates, edge runtime
- Bundle optimization with code splitting by vendor libraries
- Database query optimization with proper indexing strategies
- Redis caching for frequently accessed data (sessions, leaderboards, GTO solutions)

### Security Measures
- CSRF protection, XSS prevention, security headers
- Input validation with Prisma and custom middleware
- Rate limiting on API endpoints
- Audit logging for sensitive operations

## USE SUB-AGENTS FOR CONTEXT OPTIMIZATION

### 1. Always use the file-analyzer sub-agent when asked to read files.
The file-analyzer agent is an expert in extracting and summarizing critical information from files, particularly log files and verbose outputs. It provides concise, actionable summaries that preserve essential information while dramatically reducing context usage.

### 2. Always use the code-analyzer sub-agent when asked to search code, analyze code, research bugs, or trace logic flow.

The code-analyzer agent is an expert in code analysis, logic tracing, and vulnerability detection. It provides concise, actionable summaries that preserve essential information while dramatically reducing context usage.

### 3. Always use the test-runner sub-agent to run tests and analyze the test results.

Using the test-runner agent ensures:

- Full test output is captured for debugging
- Main conversation stays clean and focused
- Context usage is optimized
- All issues are properly surfaced
- No approval dialogs interrupt the workflow

## Testing Strategy

- Always use the test-runner agent to execute tests.
- Do not use mock services for anything ever.
- Do not move on to the next test until the current test is complete.
- If the test fails, consider checking if the test is structured correctly before deciding we need to refactor the codebase.
- Tests to be verbose so we can use them for debugging.

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pokeriq_pro"
REDIS_URL="redis://localhost:6379"
CLICKHOUSE_URL="http://localhost:8123"

# Authentication
JWT_SECRET="your-secret-key"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:8820"

# External Services
STRIPE_PUBLIC_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
```

### Port Configuration
- **3000**: Alternative frontend port
- **3001**: API Gateway / System Integration
- **3002**: Grafana monitoring dashboard
- **5432**: PostgreSQL database
- **6379**: Redis cache
- **8001**: GTO/AI service
- **8003**: Profile service  
- **8004**: Recommendation service
- **8080**: Database admin (Adminer)
- **8081**: Redis admin
- **8123**: ClickHouse HTTP
- **8820**: Main frontend application (primary)
- **8840**: Prisma Studio
- **9000**: ClickHouse native protocol
- **9090**: Prometheus monitoring

## ABSOLUTE RULES:

- NO PARTIAL IMPLEMENTATION
- NO SIMPLIFICATION: no "//This is simplified stuff for now, complete implementation would blablabla"
- NO CODE DUPLICATION: check existing codebase to reuse functions and constants Read files before writing new functions. Use common sense function name to find them easily.
- NO DEAD CODE: either use or delete from codebase completely
- IMPLEMENT TEST FOR EVERY FUNCTIONS
- NO CHEATER TESTS: test must be accurate, reflect real usage and be designed to reveal flaws. No useless tests! Design tests to be verbose so we can use them for debuging.
- NO INCONSISTENT NAMING - read existing codebase naming patterns.
- NO OVER-ENGINEERING - Don't add unnecessary abstractions, factory patterns, or middleware when simple functions would work. Don't think "enterprise" when you need "working"
- NO MIXED CONCERNS - Don't put validation logic inside API handlers, database queries inside UI components, etc. instead of proper separation
- NO RESOURCE LEAKS - Don't forget to close database connections, clear timeouts, remove event listeners, or clean up file handles

## Tone and Behavior

- Criticism is welcome. Please tell me when I am wrong or mistaken, or even when you think I might be wrong or mistaken.
- Please tell me if there is a better approach than the one I am taking.
- Please tell me if there is a relevant standard or convention that I appear to be unaware of.
- Be skeptical.
- Be concise.
- Short summaries are OK, but don't give an extended breakdown unless we are working through the details of a plan.
- Do not flatter, and do not give compliments unless I am specifically asking for your judgement.
- Occasional pleasantries are fine.
- Feel free to ask many questions. If you are in doubt of my intent, don't guess. Ask.

## Error Handling Philosophy

- **Fail fast** for critical configuration (missing text model)
- **Log and continue** for optional features (extraction model)
- **Graceful degradation** when external services unavailable
- **User-friendly messages** through resilience layer

## Business Context

This is a production-ready poker training platform with the following characteristics:
- **Target Scale**: 100K+ concurrent users
- **Business Model**: Freemium with premium subscriptions (100元/month)
- **Core Value**: Measurable skill improvement through AI-powered training
- **Success Metrics**: Training completion rate ≥80%, GTO recommendation accuracy, user retention ≥50%

The platform combines educational poker training with advanced AI to help users systematically improve their game through personalized feedback and adaptive difficulty.