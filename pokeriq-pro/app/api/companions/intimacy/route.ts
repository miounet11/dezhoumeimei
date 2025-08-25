import { NextRequest, NextResponse } from 'next/server';
import { CompanionService } from '@/lib/services/companion.service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/unified-auth';

// Server-side time validation to prevent cheating
function validateServerTime(clientTime?: number): boolean {
  if (!clientTime) return true;
  const serverTime = Date.now();
  const tolerance = 60000; // 60 seconds tolerance
  return Math.abs(serverTime - clientTime) <= tolerance;
}

// GET: Check if user can view intimacy
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const companionId = searchParams.get('companionId');
    
    if (!companionId) {
      return NextResponse.json(
        { error: 'Missing companionId' },
        { status: 400 }
      );
    }
    
    const result = await CompanionService.viewIntimacy(session.user.id, companionId);
    
    if (!result.allowed) {
      const timeRemaining = result.nextAvailable ? 
        result.nextAvailable.getTime() - Date.now() : 0;
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      
      return NextResponse.json({
        success: false,
        canView: false,
        nextAvailableTime: result.nextAvailable?.getTime(),
        timeRemaining: `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        serverTime: Date.now()
      });
    }
    
    return NextResponse.json({
      success: true,
      canView: true,
      data: result.data,
      serverTime: Date.now()
    });
  } catch (error) {
    console.error('Error checking intimacy view status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: View intimacy (with 3-second ritual)
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { companionId, clientTime } = body;
    
    if (!companionId) {
      return NextResponse.json(
        { error: 'Missing companionId' },
        { status: 400 }
      );
    }
    
    // Validate client time to prevent cheating
    if (!validateServerTime(clientTime)) {
      return NextResponse.json(
        { 
          error: 'TIME_SYNC_ERROR',
          message: 'System time mismatch detected. Please sync your device time.'
        },
        { status: 403 }
      );
    }
    
    // Check and record intimacy view
    const result = await CompanionService.viewIntimacy(session.user.id, companionId);
    
    if (!result.allowed) {
      const timeRemaining = result.nextAvailable ? 
        result.nextAvailable.getTime() - Date.now() : 0;
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      
      return NextResponse.json(
        { 
          error: 'ALREADY_VIEWED_TODAY',
          message: 'You have already viewed this companion\'s intimacy today',
          nextAvailableTime: result.nextAvailable?.getTime(),
          timeRemaining: `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        },
        { status: 403 }
      );
    }
    
    // Add ritual delay (3-second animation happens on client)
    
    return NextResponse.json({
      success: true,
      intimacy: result.data,
      viewedAt: Date.now(),
      nextViewAvailable: getNextDayStart()
    });
  } catch (error) {
    console.error('Error viewing intimacy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function
function getNextDayStart(): number {
  const nextDay = new Date();
  nextDay.setUTCHours(0, 0, 0, 0);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay.getTime();
}

// DELETE: Reset viewing records (admin only - for testing)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adminKey = searchParams.get('adminKey');
    
    // Simple admin key check (in production, use proper authentication)
    if (adminKey !== 'dev-reset-2024') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // In production, this would clear database records
    // For now, just return success
    
    return NextResponse.json({
      success: true,
      message: 'Viewing records would be cleared (database integration pending)'
    });
  } catch (error) {
    console.error('Error resetting records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}