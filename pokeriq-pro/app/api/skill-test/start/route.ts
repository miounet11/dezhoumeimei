import { NextRequest, NextResponse } from 'next/server';
import { skillTestService } from '@/lib/services/skill-test-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testType } = body;

    // 验证测试类型
    if (!['quick', 'standard', 'deep'].includes(testType)) {
      return NextResponse.json(
        { error: 'Invalid test type' },
        { status: 400 }
      );
    }

    // Generate a proper UUID for demo user or get from authentication
    // In production, this should come from the authenticated user session
    const userId = 'demo-user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

    console.log('Starting skill test for user:', userId, 'testType:', testType);

    // Create test session (skip database operations for now to avoid UUID issues)
    const mockSession = {
      sessionId: 'session-' + Date.now(),
      testType,
      scenarios: [], // Will be populated with mock scenarios
      questionCount: testType === 'quick' ? 20 : testType === 'standard' ? 50 : 100
    };

    return NextResponse.json({
      success: true,
      data: mockSession
    });
  } catch (error) {
    console.error('Error starting test:', error);
    return NextResponse.json(
      { error: 'Failed to start test', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}