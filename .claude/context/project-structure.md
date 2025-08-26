---
created: 2025-08-26T05:31:05Z
last_updated: 2025-08-26T05:31:05Z
version: 1.0
author: Claude Code PM System
---

# Project Structure and Organization

## Root Directory Layout
```
dezhoulaoda/
├── .claude/                     # Claude Code PM system
│   ├── context/                # Project context documentation
│   ├── epics/                  # Development epics and tracking
│   └── CLAUDE.md              # Main development guidance
├── ai-service/                 # Python FastAPI AI engine
├── pokeriq-pro/               # Next.js frontend application  
├── profile-service/           # Python user profiling service
├── recommendation-service/    # Python ML recommendation engine
├── system-integration/        # Node.js API gateway
├── load-testing/             # Performance testing tools
├── poker-training-engine.ts   # Core training logic
├── TrainingGameInterface.tsx  # React training interface
└── [infrastructure files]    # Docker, monitoring, docs
```

## Service Architecture Pattern
The project follows a **microservices architecture** with clear separation:

### Frontend Layer
- **pokeriq-pro/**: Next.js 15.4.6 main application
  - Uses App Router pattern
  - TypeScript throughout
  - Tailwind CSS + Ant Design Pro
  - Real-time with Socket.io

### Backend Services Layer
- **system-integration/**: Node.js API Gateway (port 3001)
- **ai-service/**: Python FastAPI GTO solver (port 8001)
- **profile-service/**: Python user analysis (port 8003)  
- **recommendation-service/**: Python ML recommendations (port 8004)

### Data Layer
- **PostgreSQL**: Primary database (port 5432)
- **Redis**: Caching and sessions (port 6379)
- **ClickHouse**: Analytics data (port 8123)

## File Naming Conventions

### TypeScript/JavaScript
- **Components**: PascalCase (e.g., `TrainingGameInterface.tsx`)
- **Utilities**: camelCase (e.g., `poker-training-engine.ts`)
- **Pages**: lowercase with hyphens (Next.js App Router)
- **API Routes**: RESTful naming in `app/api/`

### Python Services
- **Modules**: snake_case (e.g., `poker_evaluator.py`)
- **Classes**: PascalCase (e.g., `AdaptiveStrategyEngine`)
- **Main files**: `main.py` for service entry points

### Configuration Files
- **Docker**: `Dockerfile`, `docker-compose.yml`
- **Database**: SQL files in `database/` directories
- **Monitoring**: YAML configs in `monitoring/`

## Key Directory Purposes

### `/pokeriq-pro/` - Main Application
```
app/                    # Next.js App Router pages
components/            # React components by feature
lib/                   # Shared utilities and clients
prisma/               # Database schema and migrations
public/               # Static assets
```

### Service Directories
Each Python service follows consistent structure:
```
[service]/
├── main.py           # FastAPI entry point
├── requirements.txt  # Python dependencies
├── Dockerfile       # Container configuration
└── [service logic]  # Business logic modules
```

### Infrastructure Support
- **monitoring/**: Prometheus/Grafana configurations
- **database/**: SQL initialization scripts
- **docs/**: Project documentation and guides
- **scripts/**: Deployment and utility scripts

## Module Organization Patterns

### Frontend (Next.js)
- **Feature-based grouping**: Components grouped by domain
- **Co-location**: Related hooks, types, and utilities near components
- **Separation of concerns**: API clients in `lib/`, UI in `components/`

### Backend Services
- **Layered architecture**: Clear separation of API, business logic, data
- **Dependency injection**: Services configured through environment
- **Shared utilities**: Common functionality in dedicated modules

## Integration Points
- **API Gateway**: Single entry point for frontend requests
- **Service mesh**: Inter-service communication via HTTP/gRPC
- **Database sharing**: Coordinated access through API boundaries
- **Event streaming**: Real-time updates via WebSocket connections