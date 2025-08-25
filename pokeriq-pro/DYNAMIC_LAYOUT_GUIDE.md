# Dynamic AppLayout Refactoring Guide

## Overview

The AppLayout component has been successfully refactored from using hardcoded static data to a fully dynamic data system that pulls real user statistics, progress, and game data from localStorage and can be easily extended to work with APIs.

## Key Changes Made

### 1. Data Structure Implementation

**Created Type Definitions (`/lib/types/user.ts`)**
- `UserProfile`: User identity and account information
- `UserStats`: Gaming statistics, levels, XP, streaks, performance metrics
- `UserProgress`: Learning progress, completed chapters, unlocked features, achievements
- `DailyTask`: Task tracking with progress, completion status, XP rewards
- `LearningChapter`: Learning module progress with completion tracking
- `Friend`: Friends list with rankings and online status
- `UserData`: Combined interface for all user data

### 2. User Data Service (`/lib/services/userService.ts`)

**Core Features:**
- **Data Persistence**: LocalStorage-based data management
- **Level Calculation**: Dynamic XP-to-level conversion with exponential scaling
- **Daily Reset System**: Automatic daily task reset and streak tracking
- **Progress Tracking**: Game statistics, task completion, chapter progress
- **Leaderboard Management**: Friends ranking with user positioning
- **Realistic Default Data**: Pre-populated with meaningful sample data

**Key Methods:**
```typescript
// Get current user data
UserService.getUserData(): UserData

// Update stats after gameplay
UserService.updateGameStats(gameResult: {
  won: boolean;
  xpGained: number; 
  duration: number;
  gtoAccuracy?: number;
}): UserData

// Progress tracking
UserService.completeChapter(chapterId: string): UserData
UserService.updateChapterProgress(chapterId: string, progress: number): UserData
UserService.unlockFeature(featureId: string): UserData

// Daily management
UserService.resetDailyTasks(): UserData
UserService.checkDailyReset(): boolean

// Social features
UserService.getFriendsLeaderboard(): Friend[]
```

### 3. React Hook (`/lib/hooks/useUserData.ts`)

**Provides:**
- **Loading States**: Proper loading/error handling during data fetch
- **Real-time Updates**: Automatic data refresh and state management
- **Daily Reset Detection**: Checks for daily resets every minute
- **Easy Integration**: Simple hook interface for components

**Usage:**
```typescript
const { 
  userData, 
  loading, 
  error, 
  refreshUserData,
  updateGameStats,
  unlockFeature,
  completeChapter,
  updateChapterProgress 
} = useUserData();
```

### 4. Refactored AppLayout Component

**Dynamic Elements:**
- **Header Statistics**: Real user level, XP progress, daily streak, today's XP
- **User Avatar**: Dynamic avatar with first letter of display name
- **XP Progress Bar**: Real-time progress calculation with percentage display
- **Daily Tasks**: Dynamic task list with progress bars and completion status
- **Learning Progress**: Chapter completion with progress tracking and NEW badges
- **Friends Leaderboard**: Real-time rankings with online status and user positioning
- **Loading States**: Proper loading and error states during data fetch

## Sample Data Structure

The system comes pre-populated with realistic sample data:

### User Stats
- **Level**: 15 (calculated from 3420 total XP)
- **Current XP**: 420/1000 (42% progress to next level)
- **Daily Streak**: 7 days
- **Games Played**: 85 with 55% win rate
- **Today's XP**: +250

### Daily Tasks
1. **Training**: Complete 5 games (3/5 completed)
2. **GTO Accuracy**: Achieve 80% accuracy (75% current)

### Learning Progress
1. **Position Strategy**: 85% complete (Chapter 3: BTN vs BB)
2. **3-bet Strategy**: NEW chapter unlocked

### Friends Leaderboard
1. Daniel N. - 5,280 XP (🎯 Online)
2. Phil I. - 4,920 XP (🚀 Offline) 
3. **You** - 3,420 XP (👤 Online)
4. Tom D. - 3,100 XP (🎲 Online)

## Integration Examples

### Basic Usage in Components
```typescript
import { useUserData } from '@/lib/hooks/useUserData';

function GameComponent() {
  const { userData, updateGameStats } = useUserData();
  
  // After a game completes
  const handleGameComplete = (won: boolean) => {
    updateGameStats({
      won,
      xpGained: won ? 50 : 25,
      duration: 1200, // 20 minutes
      gtoAccuracy: 78
    });
  };
  
  return (
    <div>
      <h2>Level {userData?.stats.level}</h2>
      <p>XP: {userData?.stats.currentXP}/{userData?.stats.nextLevelXP}</p>
    </div>
  );
}
```

### Learning Progress Tracking
```typescript
const { updateChapterProgress, completeChapter } = useUserData();

// Update progress
updateChapterProgress('position-strategy', 90);

// Complete chapter
completeChapter('position-strategy'); // +200 XP bonus
```

### Task Management
The daily tasks automatically update based on game results:
- Training task increments on each game completion
- GTO accuracy updates with the highest achieved accuracy
- Tasks auto-complete when targets are reached (+XP rewards)

## Benefits of Dynamic System

1. **Real User Experience**: Shows actual progress and achievements
2. **Persistent Data**: User progress survives browser refreshes
3. **Automatic Updates**: Stats update in real-time during gameplay
4. **Daily Engagement**: Daily tasks and streaks encourage return visits
5. **Social Features**: Friend rankings add competitive element
6. **Extensible**: Easy to add new metrics, tasks, and progress tracking
7. **Type Safe**: Full TypeScript support with proper interfaces
8. **Error Handling**: Robust error handling with fallbacks

## Testing

A test page has been created at `/test-user-data` to verify all data loading and display functionality. This page shows:
- User profile information
- Current statistics and progress
- Daily task status with progress bars
- Learning chapter progress
- Friends leaderboard with rankings

## Future Enhancements

The current system can be easily extended to:
- **API Integration**: Replace localStorage with backend API calls
- **Real-time Sync**: WebSocket integration for live updates
- **Advanced Analytics**: Detailed performance metrics and trends
- **Social Features**: Friend invitations, chat, shared achievements
- **Gamification**: More achievement types, badges, seasonal events
- **Personalization**: Custom avatars, themes, preferences

## File Structure

```
/lib/
  /types/
    user.ts                 # Type definitions
  /services/ 
    userService.ts          # Core data service
  /hooks/
    useUserData.ts          # React hook
/src/components/layout/
  AppLayout.tsx             # Refactored dynamic layout
/app/
  test-user-data/
    page.tsx                # Testing page
```

The AppLayout component now provides a fully dynamic, data-driven user experience that responds to real user actions and progress throughout the application.