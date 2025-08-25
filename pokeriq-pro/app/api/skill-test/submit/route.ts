import { NextRequest, NextResponse } from 'next/server';
import { skillTestService } from '@/lib/services/skill-test-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, scenarioId, action, amount, timeSpent } = body;

    // 验证必需字段
    if (!sessionId || !scenarioId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 验证动作类型
    if (!['fold', 'check', 'call', 'raise'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // 提交答案
    const result = await skillTestService.submitAnswer(sessionId, {
      scenarioId,
      action,
      amount,
      timeSpent: timeSpent || 15
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
}