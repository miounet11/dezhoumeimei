import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { achievementService } from '@/lib/dashboard/achievement-system';

// GET /api/dashboard/social/leaderboard
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'winRate';
    const period = searchParams.get('period') || 'all-time';
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeUser = searchParams.get('includeUser') === 'true';

    // Validate category
    const validCategories = ['winRate', 'profit', 'hands', 'achievements', 'trainingHours', 'courseCompletion'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be one of: ' + validCategories.join(', ') },
        { status: 400 }
      );
    }

    // Validate period
    const validPeriods = ['daily', 'weekly', 'monthly', 'all-time'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be one of: ' + validPeriods.join(', ') },
        { status: 400 }
      );
    }

    // Get leaderboard data
    const userId = includeUser ? session.user.id : undefined;
    const leaderboardData = await achievementService.getLeaderboard(
      category,
      period,
      limit,
      userId
    );

    return NextResponse.json({
      success: true,
      data: {
        entries: leaderboardData.entries,
        userRank: leaderboardData.userRank,
        category,
        period,
        limit,
        totalEntries: leaderboardData.entries.length
      }
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch leaderboard data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/social/leaderboard - Update user's leaderboard entry
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { category, score, period = 'all-time', metadata } = body;

    // Validate required fields
    if (!category || score === undefined) {
      return NextResponse.json(
        { error: 'Category and score are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['winRate', 'profit', 'hands', 'achievements', 'trainingHours', 'courseCompletion'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be one of: ' + validCategories.join(', ') },
        { status: 400 }
      );
    }

    // Validate score
    if (typeof score !== 'number' || score < 0) {
      return NextResponse.json(
        { error: 'Score must be a non-negative number' },
        { status: 400 }
      );
    }

    // Update leaderboard entry
    await achievementService.updateLeaderboardEntry(
      session.user.id,
      category,
      score,
      period,
      metadata
    );

    return NextResponse.json({
      success: true,
      message: 'Leaderboard entry updated successfully',
      data: {
        userId: session.user.id,
        category,
        score,
        period,
        metadata
      }
    });

  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update leaderboard entry',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard/social/leaderboard - Bulk update multiple leaderboard entries
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { entries } = body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: 'Entries array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate each entry
    for (const entry of entries) {
      if (!entry.category || entry.score === undefined) {
        return NextResponse.json(
          { error: 'Each entry must have category and score' },
          { status: 400 }
        );
      }
    }

    // Update all entries
    const updatePromises = entries.map(entry => 
      achievementService.updateLeaderboardEntry(
        session.user.id,
        entry.category,
        entry.score,
        entry.period || 'all-time',
        entry.metadata
      )
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `${entries.length} leaderboard entries updated successfully`,
      data: {
        userId: session.user.id,
        entriesUpdated: entries.length
      }
    });

  } catch (error) {
    console.error('Error bulk updating leaderboard:', error);
    return NextResponse.json(
      { 
        error: 'Failed to bulk update leaderboard entries',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}