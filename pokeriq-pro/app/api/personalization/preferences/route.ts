/**
 * API 路由 - 用户个性化偏好设置
 * 
 * 提供用户偏好的获取和更新功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { PersonalizationQueries, UserPreferencesData } from '@/lib/db/queries/personalization-queries';

/**
 * 获取用户偏好设置
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching preferences for user: ${userId}`);

    // 获取用户偏好
    const preferences = await PersonalizationQueries.getUserPreferences(userId);

    if (!preferences) {
      // 返回默认偏好设置
      const defaultPreferences: UserPreferencesData = {
        visualLearner: 0.25,
        practicalLearner: 0.25,
        theoreticalLearner: 0.25,
        socialLearner: 0.25,
        learningGoals: [],
        preferredDifficulty: undefined,
        timeAvailability: 30,
        sessionLength: 20,
        preferredGameTypes: ['cash'],
        stakesPreference: {},
        positionPreference: {},
        feedbackStyle: 'detailed',
        encouragementLevel: 0.7,
        challengeLevel: 0.5,
        trainingReminders: true,
        weeklyReports: true,
        achievementNotifs: true
      };

      return NextResponse.json({
        success: true,
        data: {
          preferences: defaultPreferences,
          isDefault: true,
          message: 'Returning default preferences. User can customize these settings.'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        preferences,
        isDefault: false
      }
    });

  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 更新用户偏好设置
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Preferences data is required' },
        { status: 400 }
      );
    }

    console.log(`Updating preferences for user: ${userId}`);

    // 验证学习风格偏好总和是否合理
    if (preferences.visualLearner !== undefined || 
        preferences.practicalLearner !== undefined ||
        preferences.theoreticalLearner !== undefined ||
        preferences.socialLearner !== undefined) {
      
      const learningStyleSum = (preferences.visualLearner || 0) + 
                              (preferences.practicalLearner || 0) + 
                              (preferences.theoreticalLearner || 0) + 
                              (preferences.socialLearner || 0);
      
      if (learningStyleSum > 1.1) {
        return NextResponse.json(
          { success: false, error: 'Learning style preferences sum cannot exceed 1.0' },
          { status: 400 }
        );
      }
    }

    // 验证难度设置
    if (preferences.preferredDifficulty !== undefined && 
        (preferences.preferredDifficulty < 1 || preferences.preferredDifficulty > 5)) {
      return NextResponse.json(
        { success: false, error: 'Preferred difficulty must be between 1 and 5' },
        { status: 400 }
      );
    }

    // 验证时间设置
    if (preferences.timeAvailability !== undefined && preferences.timeAvailability < 5) {
      return NextResponse.json(
        { success: false, error: 'Time availability must be at least 5 minutes' },
        { status: 400 }
      );
    }

    if (preferences.sessionLength !== undefined && preferences.sessionLength < 5) {
      return NextResponse.json(
        { success: false, error: 'Session length must be at least 5 minutes' },
        { status: 400 }
      );
    }

    // 更新用户偏好
    const updatedPreferences = await PersonalizationQueries.updateUserPreferences(userId, preferences);

    if (!updatedPreferences) {
      return NextResponse.json(
        { success: false, error: 'Failed to update user preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        preferences: updatedPreferences,
        message: 'User preferences updated successfully'
      }
    });

  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update user preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * 重置用户偏好为默认值
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`Resetting preferences to default for user: ${userId}`);

    // 重置为默认偏好
    const defaultPreferences: Partial<UserPreferencesData> = {
      visualLearner: 0.25,
      practicalLearner: 0.25,
      theoreticalLearner: 0.25,
      socialLearner: 0.25,
      learningGoals: [],
      preferredDifficulty: undefined,
      timeAvailability: 30,
      sessionLength: 20,
      preferredGameTypes: ['cash'],
      stakesPreference: {},
      positionPreference: {},
      feedbackStyle: 'detailed',
      encouragementLevel: 0.7,
      challengeLevel: 0.5,
      trainingReminders: true,
      weeklyReports: true,
      achievementNotifs: true
    };

    const updatedPreferences = await PersonalizationQueries.updateUserPreferences(userId, defaultPreferences);

    if (!updatedPreferences) {
      return NextResponse.json(
        { success: false, error: 'Failed to reset user preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        preferences: updatedPreferences,
        message: 'User preferences reset to default values'
      }
    });

  } catch (error) {
    console.error('Error resetting user preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset user preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}