import { NextRequest, NextResponse } from 'next/server';
import { skillTestService } from '@/lib/services/skill-test-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // 完成测试并计算结果
    const results = await skillTestService.completeTest(sessionId);

    return NextResponse.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error completing test:', error);
    return NextResponse.json(
      { error: 'Failed to complete test' },
      { status: 500 }
    );
  }
}