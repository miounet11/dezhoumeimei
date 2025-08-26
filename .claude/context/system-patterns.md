---
created: 2025-08-26T05:31:05Z
last_updated: 2025-08-26T05:31:05Z
version: 1.0
author: Claude Code PM System
---

# System Patterns and Architecture Decisions

## Core Architectural Patterns

### Microservices Architecture
The system implements a **distributed microservices pattern** with:
- **API Gateway**: Single entry point for client requests
- **Service Isolation**: Each domain has dedicated service
- **Database Per Service**: Each service owns its data
- **Inter-Service Communication**: HTTP/REST with circuit breakers

### Event-Driven Architecture
- **Real-time Updates**: Socket.io for live training sessions
- **Async Processing**: Background tasks for AI computation
- **Event Sourcing**: Training events stored for analytics
- **CQRS Pattern**: Separate read/write models for performance

## Data Flow Patterns

### Request Flow
```
Client Request → API Gateway → Service → Database
                     ↓
               Authentication/Authorization
                     ↓
               Caching Layer (Redis)
                     ↓
               Response Transformation
```

### Training Session Flow
```
User Action → WebSocket → Session Manager → AI Engine
                ↓              ↓              ↓
          State Store → Database Update → Analytics Event
```

### AI Computation Pattern
```
Training Request → GTO Solver → Strategy Cache → Response
                      ↓              ↓
                 ML Pipeline → Recommendation Engine
```

## Security Patterns

### Authentication & Authorization
- **JWT Strategy**: Stateless authentication with refresh tokens
- **Role-Based Access**: User roles (free, premium, admin)
- **Session Management**: Redis-backed sessions with TTL
- **CSRF Protection**: Double-submit cookie pattern

### Data Protection
- **Input Validation**: Schema validation at API boundaries
- **SQL Injection Prevention**: Prisma ORM with parameterized queries  
- **XSS Protection**: Content Security Policy headers
- **Rate Limiting**: API endpoint throttling

## Caching Strategies

### Multi-Level Caching
```
Level 1: Application Cache (in-memory)
Level 2: Redis Cache (shared)
Level 3: Database Query Cache
Level 4: CDN Cache (static assets)
```

### Cache-Aside Pattern
- **User Data**: Load from cache, fallback to database
- **GTO Solutions**: Expensive computations cached indefinitely  
- **Leaderboards**: Time-based cache invalidation
- **Session State**: Write-through caching

## Database Design Patterns

### Normalized Relational Design
- **Primary Database**: PostgreSQL with proper normalization
- **Foreign Key Constraints**: Referential integrity enforced
- **Composite Indexes**: Optimized for query patterns
- **UUID Primary Keys**: Distributed-friendly identifiers

### Analytics Store Pattern
- **ClickHouse**: Columnar storage for time-series data
- **Denormalized Schema**: Optimized for analytical queries
- **Batch Processing**: Events aggregated in batches
- **Data Retention**: Automated cleanup policies

## API Design Patterns

### RESTful API Design
- **Resource-Based URLs**: `/api/training/sessions/{id}`
- **HTTP Verbs**: Proper use of GET, POST, PUT, DELETE
- **Status Codes**: Semantic HTTP response codes
- **Pagination**: Cursor-based for large datasets

### Response Format Standardization
```json
{
  "success": true,
  "code": 200,
  "message": "Operation completed",
  "data": { ... },
  "timestamp": "2025-08-26T05:31:05Z"
}
```

## Error Handling Patterns

### Centralized Error Handling
- **Error Boundaries**: React error boundaries for UI
- **Global Exception Handler**: API-level error processing
- **Structured Logging**: Consistent error format with Pino
- **Error Tracking**: Sentry integration for monitoring

### Graceful Degradation
- **Service Unavailable**: Fallback to cached data
- **AI Service Down**: Basic rule-based recommendations
- **Database Issues**: Read-only mode with cache
- **Network Failures**: Retry with exponential backoff

## Performance Optimization Patterns

### Lazy Loading
- **Component Loading**: React.lazy for route-based splitting
- **Data Loading**: Paginated API responses
- **Asset Loading**: Progressive image loading
- **Module Loading**: Dynamic imports for large libraries

### Query Optimization
- **N+1 Prevention**: Prisma includes and select optimization
- **Batch Loading**: DataLoader pattern for related data
- **Connection Pooling**: Database connection management
- **Query Caching**: Redis for expensive computations

## Monitoring and Observability

### Structured Logging Pattern
```javascript
logger.info({
  event: 'training_session_started',
  userId: 'uuid',
  sessionType: 'quick',
  duration: 300,
  metadata: { ... }
});
```

### Metrics Collection
- **Application Metrics**: Response times, error rates
- **Business Metrics**: Training completion rates, user engagement
- **Infrastructure Metrics**: CPU, memory, database performance
- **Custom Metrics**: Poker-specific KPIs

### Health Check Pattern
```javascript
// Service health endpoint
GET /health
{
  "status": "healthy",
  "dependencies": {
    "database": "connected",
    "redis": "connected",
    "ai_service": "responding"
  },
  "version": "1.0.0"
}
```

## Development Patterns

### Feature-Based Organization
- **Domain Grouping**: Code organized by business domain
- **Co-location**: Related files kept together
- **Shared Utilities**: Common code in dedicated modules
- **Clear Boundaries**: Well-defined interfaces between layers

### Testing Patterns
- **Unit Tests**: Jest for individual functions
- **Integration Tests**: Service-level testing
- **E2E Tests**: Full user journey testing
- **Load Tests**: Performance validation

### Code Quality Patterns
- **TypeScript**: Strong typing throughout
- **ESLint/Prettier**: Automated code formatting
- **Pre-commit Hooks**: Quality gates before commits
- **Code Reviews**: Pull request workflow