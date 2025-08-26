---
issue: 3
title: Database Schema Extensions
analyzed: 2025-08-26T10:17:50Z
estimated_hours: 22
parallelization_factor: 2.8
---

# Parallel Work Analysis: Issue #3

## Overview
Extend the PostgreSQL database schema to support the dezhoumama learning platform by adding 5 new tables (courses, assessments, user_progress, characters, chat_sessions) with proper relationships, indexes, and TypeScript integration.

## Parallel Streams

### Stream A: Database Schema & Migration
**Scope**: Core database schema creation and migration infrastructure
**Files**:
- `prisma/schema.prisma` (extend existing schema)
- `prisma/migrations/*_add_dezhoumama_tables.sql`
- `prisma/seed-dezhoumama.ts` (initial data)
**Agent Type**: database-specialist
**Can Start**: immediately
**Estimated Hours**: 8
**Dependencies**: none

### Stream B: TypeScript Types & Query Layer
**Scope**: Generated types and database query functions
**Files**:
- `lib/db/queries/courses.ts`
- `lib/db/queries/assessments.ts`
- `lib/db/queries/progress.ts`
- `lib/db/queries/characters.ts` 
- `lib/db/queries/chat.ts`
- `lib/types/dezhoumama.ts`
**Agent Type**: typescript-expert
**Can Start**: after Stream A schema is defined (2h into Stream A)
**Estimated Hours**: 10
**Dependencies**: Stream A (schema definition)

### Stream C: Data Validation & Business Logic
**Scope**: Input validation, business rules, and data integrity
**Files**:
- `lib/validation/courses.ts`
- `lib/validation/assessments.ts`
- `lib/validation/progress.ts`
- `lib/business/course-progression.ts`
- `lib/business/assessment-scoring.ts`
**Agent Type**: backend-specialist
**Can Start**: after Stream B query layer is established
**Estimated Hours**: 6
**Dependencies**: Stream B

### Stream D: Testing Infrastructure
**Scope**: Comprehensive test coverage for all database operations
**Files**:
- `__tests__/db/courses.test.ts`
- `__tests__/db/assessments.test.ts`
- `__tests__/db/progress.test.ts`
- `__tests__/db/characters.test.ts`
- `__tests__/db/chat.test.ts`
- `__tests__/integration/schema.test.ts`
**Agent Type**: test-automation-engineer
**Can Start**: in parallel with Stream B (once query signatures are defined)
**Estimated Hours**: 8
**Dependencies**: Stream B (partial - query interfaces)

## Coordination Points

### Shared Files
- `prisma/schema.prisma` - Stream A owns, Stream B reads for type generation
- `package.json` - Stream A may add dev dependencies for migrations

### Sequential Requirements
1. Schema definition must precede type generation
2. Query layer must precede validation layer  
3. Basic queries must precede comprehensive testing
4. Migration testing requires schema completion

## Conflict Risk Assessment
- **Low Risk**: Streams work on different functional areas
- **Medium Risk**: Shared Prisma schema file requires careful coordination
- **High Risk**: None identified - clean separation of concerns

## Parallelization Strategy

**Recommended Approach**: Hybrid

**Execution Plan**:
1. Start Stream A (Database Schema) immediately
2. After 2 hours, start Stream B (TypeScript/Queries) and Stream D (Testing) in parallel
3. Start Stream C (Validation) after Stream B completes core query functions
4. All streams converge for integration testing

## Expected Timeline

**With parallel execution**:
- Wall time: 12 hours
- Total work: 32 hours  
- Efficiency gain: 62%

**Without parallel execution**:
- Wall time: 32 hours (sequential)

## Coordination Timeline

**Hour 0-2**: Stream A (Schema definition)
**Hour 2-12**: Stream A + Stream B + Stream D (parallel)
**Hour 8-14**: Stream C (after Stream B core completion)
**Hour 12-14**: Integration and final testing

## Notes

**Special Considerations**:
- Prisma schema changes require careful review to avoid breaking existing poker tables
- Migration rollback strategy is critical for production safety
- Performance indexes must be optimized for both poker and learning platform queries
- Character personality configs (JSONB) need validation schema definition
- Chat history storage design impacts long-term performance

**Agent Expertise Matching**:
- Database specialist: Prisma/PostgreSQL optimization experience
- TypeScript expert: Prisma client generation and complex type inference
- Backend specialist: Business logic and validation patterns
- Test engineer: Database testing and migration validation

**Risk Mitigation**:
- Stream A should create feature branch for schema changes
- Test database required for migration validation
- Code review checkpoints at each stream completion
- Performance benchmarking after schema changes