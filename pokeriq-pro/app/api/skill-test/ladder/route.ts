import { NextRequest, NextResponse } from 'next/server';
import { skillTestService } from '@/lib/services/skill-test-service';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');

    // 获取天梯排名
    const rankings = await skillTestService.getLadderRankings(limit);

    return NextResponse.json({
      success: true,
      data: rankings
    });
  } catch (error) {
    console.error('Error getting ladder rankings:', error);
    return NextResponse.json(
      { error: 'Failed to get ladder rankings' },
      { status: 500 }
    );
  }
}