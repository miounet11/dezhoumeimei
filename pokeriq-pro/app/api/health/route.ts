import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    checks: {
      database: false,
      redis: false,
      memory: false
    }
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = true;
  } catch (error) {
    checks.status = 'unhealthy';
    console.error('Database health check failed:', error);
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memLimit = 1024 * 1024 * 1024; // 1GB
  checks.checks.memory = memUsage.heapUsed < memLimit;
  
  if (!checks.checks.memory) {
    checks.status = 'warning';
  }

  // TODO: Add Redis health check when implemented
  checks.checks.redis = true; // Placeholder

  const statusCode = checks.status === 'healthy' ? 200 : 
                     checks.status === 'warning' ? 200 : 503;

  return NextResponse.json(checks, { status: statusCode });
}