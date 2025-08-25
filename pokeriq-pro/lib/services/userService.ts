import { UserData, UserProfile, UserStats, UserProgress, DailyTask, LearningChapter, Friend } from '@/lib/types/user';

const USER_DATA_KEY = 'pokeriq_user_data';
const LAST_VISIT_KEY = 'pokeriq_last_visit';

// Default user data for new users
const defaultUserData: UserData = {
  profile: {
    id: 'user-001',
    username: 'player',
    displayName: '玩家',
    avatar: '',
    email: '',
    createdAt: new Date(),
    lastActiveAt: new Date(),
  },
  stats: {
    level: 15,
    currentXP: 420,
    nextLevelXP: 1000,
    totalXP: 3420,
    gamesPlayed: 85,
    gamesWon: 47,
    winRate: 0.55,
    totalHoursPlayed: 24.5,
    dailyStreak: 7,
    maxStreak: 12,
    lastPlayDate: new Date(Date.now() - 86400000), // Yesterday
    todayXP: 250,
  },
  progress: {
    completedChapters: [],
    currentChapter: 'basic-positions',
    unlockedFeatures: ['home', 'study'],
    achievements: [],
    badges: [],
  },
  dailyTasks: [
    {
      id: 'daily-training',
      title: '完成5局训练',
      description: '今日完成5局AI训练对局',
      type: 'training',
      target: 5,
      current: 3,
      completed: false,
      xpReward: 100,
      gradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    },
    {
      id: 'gto-accuracy',
      title: 'GTO准确率80%',
      description: '达到80%的GTO决策准确率',
      type: 'accuracy',
      target: 80,
      current: 75,
      completed: false,
      xpReward: 150,
      gradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    },
  ],
  learningChapters: [
    {
      id: 'position-strategy',
      title: '位置策略',
      description: '第3章: BTN vs BB',
      icon: 'sparkles',
      color: 'green',
      completed: false,
      progress: 85,
    },
    {
      id: '3bet-strategy',
      title: '3-bet策略',
      description: '已解锁新章节',
      icon: 'zap',
      color: 'blue',
      isNew: true,
      completed: false,
      progress: 0,
    },
  ],
  friends: [
    {
      id: 'friend-1',
      name: 'Daniel N.',
      avatar: '🎯',
      level: 25,
      xp: 5280,
      isOnline: true,
      rank: 1,
    },
    {
      id: 'friend-2',
      name: 'Phil I.',
      avatar: '🚀',
      level: 22,
      xp: 4920,
      isOnline: false,
      rank: 2,
    },
    {
      id: 'friend-3',
      name: 'Tom D.',
      avatar: '🎲',
      level: 18,
      xp: 3100,
      isOnline: true,
      rank: 4,
    },
  ],
};

export class UserService {
  // Calculate XP needed for a given level
  static calculateXPForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  // Calculate level from total XP
  static calculateLevelFromXP(totalXP: number): { level: number; currentXP: number; nextLevelXP: number } {
    let level = 1;
    let xpForCurrentLevel = 0;
    
    while (totalXP >= this.calculateXPForLevel(level)) {
      xpForCurrentLevel += this.calculateXPForLevel(level);
      level++;
    }
    
    const currentXP = totalXP - xpForCurrentLevel;
    const nextLevelXP = this.calculateXPForLevel(level);
    
    return { level: level - 1, currentXP, nextLevelXP };
  }

  // Get user data from localStorage or return default
  static getUserData(): UserData {
    if (typeof window === 'undefined') {
      return defaultUserData;
    }

    try {
      const stored = localStorage.getItem(USER_DATA_KEY);
      if (stored) {
        const userData = JSON.parse(stored);
        // Ensure all required fields exist by merging with defaults
        return this.mergeWithDefaults(userData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }

    // Initialize new user
    const newUserData = { ...defaultUserData };
    this.saveUserData(newUserData);
    return newUserData;
  }

  // Merge stored data with defaults to ensure all fields exist
  static mergeWithDefaults(storedData: Partial<UserData>): UserData {
    return {
      profile: { ...defaultUserData.profile, ...(storedData.profile || {}) },
      stats: { ...defaultUserData.stats, ...(storedData.stats || {}) },
      progress: { ...defaultUserData.progress, ...(storedData.progress || {}) },
      dailyTasks: storedData.dailyTasks || defaultUserData.dailyTasks,
      learningChapters: storedData.learningChapters || defaultUserData.learningChapters,
      friends: storedData.friends || defaultUserData.friends,
    };
  }

  // Save user data to localStorage
  static saveUserData(userData: UserData): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Update user stats after a game/training session
  static updateGameStats(gameResult: {
    won: boolean;
    xpGained: number;
    duration: number;
    gtoAccuracy?: number;
  }): UserData {
    const userData = this.getUserData();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastPlay = new Date(userData.stats.lastPlayDate);
    const lastPlayDate = new Date(lastPlay.getFullYear(), lastPlay.getMonth(), lastPlay.getDate());

    // Update basic stats
    userData.stats.gamesPlayed++;
    if (gameResult.won) {
      userData.stats.gamesWon++;
    }
    userData.stats.winRate = userData.stats.gamesWon / userData.stats.gamesPlayed;
    userData.stats.totalHoursPlayed += gameResult.duration / 3600; // Convert seconds to hours
    userData.stats.totalXP += gameResult.xpGained;

    // Update daily streak
    const daysDiff = Math.floor((today.getTime() - lastPlayDate.getTime()) / (1000 * 3600 * 24));
    if (daysDiff === 0) {
      // Same day, no change to streak
    } else if (daysDiff === 1) {
      // Next day, continue streak
      userData.stats.dailyStreak++;
    } else {
      // Broke streak
      userData.stats.dailyStreak = 1;
    }
    userData.stats.maxStreak = Math.max(userData.stats.maxStreak, userData.stats.dailyStreak);
    userData.stats.lastPlayDate = now;

    // Update today's XP
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const lastVisitDate = lastVisit ? new Date(lastVisit) : new Date(0);
    const isNewDay = lastVisitDate.getDate() !== now.getDate() || 
                     lastVisitDate.getMonth() !== now.getMonth() ||
                     lastVisitDate.getFullYear() !== now.getFullYear();
    
    if (isNewDay) {
      userData.stats.todayXP = gameResult.xpGained;
    } else {
      userData.stats.todayXP += gameResult.xpGained;
    }
    localStorage.setItem(LAST_VISIT_KEY, now.toISOString());

    // Recalculate level
    const levelInfo = this.calculateLevelFromXP(userData.stats.totalXP);
    userData.stats.level = levelInfo.level;
    userData.stats.currentXP = levelInfo.currentXP;
    userData.stats.nextLevelXP = levelInfo.nextLevelXP;

    // Update daily tasks
    this.updateDailyTasks(userData, gameResult);

    // Update profile
    userData.profile.lastActiveAt = now;

    this.saveUserData(userData);
    return userData;
  }

  // Update daily tasks based on game results
  private static updateDailyTasks(userData: UserData, gameResult: any): void {
    userData.dailyTasks.forEach(task => {
      if (task.completed) return;

      switch (task.type) {
        case 'training':
          task.current = Math.min(task.current + 1, task.target);
          break;
        case 'accuracy':
          if (gameResult.gtoAccuracy !== undefined) {
            task.current = Math.max(task.current, gameResult.gtoAccuracy);
          }
          break;
      }

      if (task.current >= task.target && !task.completed) {
        task.completed = true;
        userData.stats.totalXP += task.xpReward;
        userData.stats.todayXP += task.xpReward;
      }
    });
  }

  // Reset daily tasks (should be called daily)
  static resetDailyTasks(): UserData {
    const userData = this.getUserData();
    userData.dailyTasks.forEach(task => {
      task.current = 0;
      task.completed = false;
    });
    userData.stats.todayXP = 0;
    this.saveUserData(userData);
    return userData;
  }

  // Unlock new features/chapters
  static unlockFeature(featureId: string): UserData {
    const userData = this.getUserData();
    if (!userData.progress.unlockedFeatures.includes(featureId)) {
      userData.progress.unlockedFeatures.push(featureId);
    }
    this.saveUserData(userData);
    return userData;
  }

  // Complete a learning chapter
  static completeChapter(chapterId: string): UserData {
    const userData = this.getUserData();
    if (!userData.progress.completedChapters.includes(chapterId)) {
      userData.progress.completedChapters.push(chapterId);
      userData.stats.totalXP += 200; // Chapter completion bonus
      userData.stats.todayXP += 200;
    }

    // Update chapter status
    const chapter = userData.learningChapters.find(c => c.id === chapterId);
    if (chapter) {
      chapter.completed = true;
      chapter.progress = 100;
    }

    this.saveUserData(userData);
    return userData;
  }

  // Update chapter progress
  static updateChapterProgress(chapterId: string, progress: number): UserData {
    const userData = this.getUserData();
    const chapter = userData.learningChapters.find(c => c.id === chapterId);
    if (chapter) {
      chapter.progress = Math.max(chapter.progress, progress);
      if (chapter.progress >= 100 && !chapter.completed) {
        return this.completeChapter(chapterId);
      }
    }
    this.saveUserData(userData);
    return userData;
  }

  // Get friends leaderboard
  static getFriendsLeaderboard(): Friend[] {
    const userData = this.getUserData();
    const userAsPlayer: Friend = {
      id: userData.profile.id,
      name: '你',
      avatar: '👤',
      level: userData.stats.level,
      xp: userData.stats.totalXP,
      isOnline: true,
      rank: 0, // Will be calculated
    };

    const allPlayers = [...userData.friends, userAsPlayer];
    
    // Sort by XP descending
    allPlayers.sort((a, b) => b.xp - a.xp);
    
    // Assign ranks
    allPlayers.forEach((player, index) => {
      player.rank = index + 1;
    });

    return allPlayers;
  }

  // Check for daily reset
  static checkDailyReset(): boolean {
    if (typeof window === 'undefined') return false;

    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const now = new Date();
    
    if (!lastVisit) {
      localStorage.setItem(LAST_VISIT_KEY, now.toISOString());
      return false;
    }

    const lastVisitDate = new Date(lastVisit);
    const isNewDay = lastVisitDate.getDate() !== now.getDate() || 
                     lastVisitDate.getMonth() !== now.getMonth() ||
                     lastVisitDate.getFullYear() !== now.getFullYear();

    if (isNewDay) {
      localStorage.setItem(LAST_VISIT_KEY, now.toISOString());
      this.resetDailyTasks();
      return true;
    }

    return false;
  }
}