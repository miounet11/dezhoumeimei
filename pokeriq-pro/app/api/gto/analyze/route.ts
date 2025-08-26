/**
 * API 路由 - GTO 分析服务
 */

import { NextRequest, NextResponse } from 'next/server';
import { CFRSolver } from '@/lib/gto/cfr-solver';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameState, iterations = 1000 } = body;
    
    if (!gameState) {
      return NextResponse.json(
        { error: 'Game state is required' },
        { status: 400 }
      );
    }

    // 验证游戏状态格式
    if (!gameState.players || !Array.isArray(gameState.players)) {
      return NextResponse.json(
        { error: 'Invalid game state: players array required' },
        { status: 400 }
      );
    }

    // 创建CFR求解器实例
    const cfrSolver = new CFRSolver(iterations, 0.001);

    // 求解GTO策略
    const result = await cfrSolver.solve(gameState);

    // 分析结果
    const analysis = {
      strategy: Array.from(result.strategy.entries()).reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {} as Record<string, number>),
      exploitability: result.exploitability,
      iterations: result.iterations,
      convergenceTime: result.convergenceTime,
      recommendations: generateActionRecommendations(result.strategy)
    };

    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        timestamp: new Date().toISOString(),
        gameState: {
          street: gameState.street,
          pot: gameState.pot,
          players: gameState.players.length,
          currentPlayer: gameState.currentPlayer
        }
      }
    });

  } catch (error) {
    console.error('GTO analysis API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to analyze game state',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 生成行动建议
 */
function generateActionRecommendations(strategy: Map<string, number>) {
  const recommendations = [];
  const sortedActions = Array.from(strategy.entries())
    .sort(([,a], [,b]) => b - a);

  for (const [action, frequency] of sortedActions) {
    if (frequency > 0.1) { // 只显示频率超过10%的动作
      recommendations.push({
        action: action,
        frequency: Math.round(frequency * 100),
        confidence: frequency > 0.5 ? 'high' : frequency > 0.3 ? 'medium' : 'low',
        reasoning: getActionReasoning(action, frequency)
      });
    }
  }

  return recommendations;
}

/**
 * 获取行动推理
 */
function getActionReasoning(action: string, frequency: number): string {
  const reasoningMap: Record<string, (f: number) => string> = {
    'fold': (f) => f > 0.7 ? '手牌太弱，应该弃牌' : '在某些情况下考虑弃牌',
    'check': (f) => f > 0.6 ? '保持谨慎，先观察对手动向' : '有时可以过牌控制底池',
    'call': (f) => f > 0.5 ? '手牌有一定价值，跟注获得更多信息' : '在合适的底池赔率下跟注',
    'bet': (f) => f > 0.6 ? '应该主动下注建设底池或施压' : '在某些情况下可以下注',
    'raise': (f) => f > 0.5 ? '手牌足够强，应该加注获得价值' : '偶尔可以加注作为诈唬'
  };

  // 提取动作类型（去掉尺度信息）
  const actionType = action.split('_')[0];
  
  const reasoningFunc = reasoningMap[actionType];
  return reasoningFunc ? reasoningFunc(frequency) : `${frequency > 0.5 ? '经常' : '偶尔'}使用此动作`;
}

export async function GET(request: NextRequest) {
  try {
    // 返回GTO分析器的统计信息和状态
    return NextResponse.json({
      success: true,
      data: {
        status: 'operational',
        features: [
          'CFR算法求解',
          'GTO策略分析',
          '可利用性计算',
          '动作频率建议',
          '实时策略优化'
        ],
        supportedGameTypes: [
          'Texas Hold\'em',
          '现金桌游戏', 
          '锦标赛',
          '多人游戏 (2-9人)'
        ],
        maxIterations: 10000,
        convergenceThreshold: 0.001
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Service unavailable' },
      { status: 503 }
    );
  }
}