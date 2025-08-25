import { NextRequest, NextResponse } from 'next/server';
import { OpponentService } from '@/lib/services/opponent.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/unified-auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode') || 'all';
    
    // Allow fetching all opponents without authentication
    if (mode === 'all') {
      const opponents = await OpponentService.getAllOpponents();
      return NextResponse.json({ opponents });
    }
    
    // Other modes require authentication
    const session = await getServerSession(authOptions);
    
    let opponents;
    
    switch (mode) {
      case 'recommended':
        if (!session?.user?.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        opponents = await OpponentService.getRecommendedOpponents(session.user.id);
        break;
        
      case 'available':
        const level = session?.user?.level || 1;
        opponents = await OpponentService.getAvailableOpponents(level);
        break;
        
      default:
        opponents = await OpponentService.getAllOpponents();
        break;
    }
    
    return NextResponse.json({ opponents });
  } catch (error) {
    console.error('Failed to fetch opponents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opponents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { action, opponentId, result, stats } = body;
    
    switch (action) {
      case 'record-result':
        await OpponentService.recordGameResult(
          session.user.id,
          opponentId,
          result,
          stats
        );
        return NextResponse.json({ success: true });
        
      case 'unlock':
        const unlocked = await OpponentService.unlockOpponent(
          session.user.id,
          opponentId
        );
        return NextResponse.json({ success: unlocked });
        
      case 'stats':
        const h2hStats = await OpponentService.getHeadToHeadStats(
          session.user.id,
          opponentId
        );
        return NextResponse.json({ stats: h2hStats });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Opponent action failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Action failed' },
      { status: 500 }
    );
  }
}