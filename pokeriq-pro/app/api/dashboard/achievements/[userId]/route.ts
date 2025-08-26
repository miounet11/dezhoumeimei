import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { achievementService } from '@/lib/dashboard/achievement-system';

interface RouteParams {
  params: {
    userId: string;
  };
}

// GET /api/dashboard/achievements/[userId]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Users can only access their own achievements unless they're admin
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. You can only view your own achievements.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeCompleted = searchParams.get('includeCompleted') !== 'false';
    const category = searchParams.get('category');
    const rarity = searchParams.get('rarity');

    // Get user achievements
    let achievements = await achievementService.getUserAchievements(userId);

    // Apply filters
    if (!includeCompleted) {
      achievements = achievements.filter(a => !a.completed);
    }

    if (category) {
      achievements = achievements.filter(a => a.category.toLowerCase() === category.toLowerCase());
    }

    if (rarity) {
      achievements = achievements.filter(a => a.rarity.toLowerCase() === rarity.toLowerCase());
    }

    // Calculate summary stats
    const totalAchievements = achievements.length;
    const completedAchievements = achievements.filter(a => a.completed).length;
    const totalPoints = achievements
      .filter(a => a.completed)
      .reduce((sum, a) => sum + (a.points || 0), 0);
    
    const progressStats = {
      total: totalAchievements,
      completed: completedAchievements,
      inProgress: achievements.filter(a => !a.completed && a.progress > 0).length,
      notStarted: achievements.filter(a => a.progress === 0).length,
      completionRate: totalAchievements > 0 ? (completedAchievements / totalAchievements) * 100 : 0,
      totalPoints
    };

    // Group achievements by category for easier display
    const categorizedAchievements = achievements.reduce((acc, achievement) => {
      const cat = achievement.category;
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(achievement);
      return acc;
    }, {} as Record<string, typeof achievements>);

    return NextResponse.json({
      success: true,
      data: {
        userId,
        achievements,
        categorizedAchievements,
        progressStats,
        filters: {
          includeCompleted,
          category,
          rarity
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch achievements',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/achievements/[userId] - Check and update achievements
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Users can only update their own achievements unless they're admin
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. You can only update your own achievements.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'check') {
      // Check for new achievements and unlock them
      const newlyUnlocked = await achievementService.checkAchievements(userId);

      return NextResponse.json({
        success: true,
        message: `Achievement check completed. ${newlyUnlocked.length} new achievements unlocked.`,
        data: {
          newlyUnlocked,
          count: newlyUnlocked.length
        }
      });
    }

    if (action === 'share') {
      // Record a social share
      const { achievementId, platform, content } = body;
      
      if (!achievementId) {
        return NextResponse.json(
          { error: 'Achievement ID is required for sharing' },
          { status: 400 }
        );
      }

      await achievementService.recordSocialShare(userId, 'achievement', {
        id: achievementId,
        platform: platform || 'general',
        content: content || {}
      });

      return NextResponse.json({
        success: true,
        message: 'Social share recorded successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions: check, share' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error updating user achievements:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update achievements',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard/achievements/[userId] - Get comprehensive social stats
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId } = params;

    // Users can only access their own stats unless they're admin
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. You can only view your own social stats.' },
        { status: 403 }
      );
    }

    // Get comprehensive social stats
    const socialStats = await achievementService.getUserSocialStats(userId);

    // Calculate additional insights
    const insights = {
      strongestCategory: getMostCompletedCategory(socialStats.achievements),
      weakestCategory: getLeastCompletedCategory(socialStats.achievements),
      recentAchievements: getRecentAchievements(socialStats.achievements, 7),
      nextAchievements: getNextAchievements(socialStats.achievements, 3),
      competitiveRank: calculateCompetitiveRank(socialStats.leaderboardPositions),
      engagementLevel: calculateEngagementLevel(socialStats)
    };

    return NextResponse.json({
      success: true,
      data: {
        ...socialStats,
        insights
      }
    });

  } catch (error) {
    console.error('Error fetching social stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch social stats',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Helper functions
function getMostCompletedCategory(achievements: any[]) {
  const categoryStats = achievements.reduce((acc, achievement) => {
    const cat = achievement.category;
    if (!acc[cat]) {
      acc[cat] = { total: 0, completed: 0 };
    }
    acc[cat].total++;
    if (achievement.completed) {
      acc[cat].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  let bestCategory = null;
  let bestRate = 0;

  for (const [category, stats] of Object.entries(categoryStats)) {
    const rate = stats.total > 0 ? stats.completed / stats.total : 0;
    if (rate > bestRate) {
      bestRate = rate;
      bestCategory = {
        category,
        completionRate: rate,
        completed: stats.completed,
        total: stats.total
      };
    }
  }

  return bestCategory;
}

function getLeastCompletedCategory(achievements: any[]) {
  const categoryStats = achievements.reduce((acc, achievement) => {
    const cat = achievement.category;
    if (!acc[cat]) {
      acc[cat] = { total: 0, completed: 0 };
    }
    acc[cat].total++;
    if (achievement.completed) {
      acc[cat].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  let worstCategory = null;
  let worstRate = 1;

  for (const [category, stats] of Object.entries(categoryStats)) {
    const rate = stats.total > 0 ? stats.completed / stats.total : 0;
    if (rate < worstRate) {
      worstRate = rate;
      worstCategory = {
        category,
        completionRate: rate,
        completed: stats.completed,
        total: stats.total
      };
    }
  }

  return worstCategory;
}

function getRecentAchievements(achievements: any[], days: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return achievements
    .filter(a => a.completed && a.unlockedAt && new Date(a.unlockedAt) > cutoffDate)
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());
}

function getNextAchievements(achievements: any[], limit: number) {
  return achievements
    .filter(a => !a.completed && a.progress > 0)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit);
}

function calculateCompetitiveRank(leaderboardPositions: any[]) {
  if (leaderboardPositions.length === 0) return 'Unranked';

  const averageRank = leaderboardPositions.reduce((sum, pos) => sum + pos.rank, 0) / leaderboardPositions.length;

  if (averageRank <= 10) return 'Elite';
  if (averageRank <= 50) return 'Advanced';
  if (averageRank <= 100) return 'Intermediate';
  if (averageRank <= 500) return 'Beginner';
  return 'Novice';
}

function calculateEngagementLevel(socialStats: any) {
  let score = 0;
  
  // Achievement completion contributes to engagement
  score += socialStats.achievementProgress * 0.4;
  
  // Social shares contribute to engagement
  score += Math.min(socialStats.socialShares * 2, 30);
  
  // Peer comparisons contribute to engagement
  score += Math.min(socialStats.peersCompared * 3, 30);
  
  // Leaderboard participation contributes to engagement
  score += Math.min(socialStats.leaderboardPositions.length * 5, 20);

  if (score >= 80) return 'Highly Engaged';
  if (score >= 60) return 'Active';
  if (score >= 40) return 'Moderate';
  if (score >= 20) return 'Low';
  return 'Minimal';
}