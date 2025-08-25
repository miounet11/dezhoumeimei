import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // 获取游戏状态
    const gameState = await prisma.gameState.findUnique({
      where: { sessionId },
      include: {
        session: {
          include: {
            handRecords: {
              orderBy: { handNumber: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!gameState) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const players = JSON.parse(gameState.players as string);
    const communityCards = JSON.parse(gameState.communityCards);
    
    // 获取玩家手牌（只返回给人类玩家）
    let playerCards: string[] = [];
    const humanPlayerIndex = players.findIndex((p: any) => p.isHuman);
    
    if (humanPlayerIndex >= 0 && gameState.session.handRecords.length > 0) {
      const latestHand = gameState.session.handRecords[0];
      playerCards = JSON.parse(latestHand.holeCards);
    }

    return NextResponse.json({
      success: true,
      gameState: {
        sessionId: gameState.sessionId,
        players,
        playerCards,
        communityCards,
        pot: gameState.pot,
        currentBet: gameState.currentBet,
        minRaise: gameState.minRaise,
        street: gameState.street,
        actionOn: gameState.actionOn,
        handNumber: gameState.currentHandNumber,
        isComplete: gameState.street === 'SHOWDOWN'
      }
    });

  } catch (error) {
    console.error('Get game state error:', error);
    return NextResponse.json(
      { error: 'Failed to get game state' },
      { status: 500 }
    );
  }
}