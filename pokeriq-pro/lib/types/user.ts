// User profile and statistics types
export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  email: string;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface UserStats {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  totalHoursPlayed: number;
  dailyStreak: number;
  maxStreak: number;
  lastPlayDate: Date;
  todayXP: number;
}

export interface UserProgress {
  completedChapters: string[];
  currentChapter: string;
  unlockedFeatures: string[];
  achievements: Achievement[];
  badges: Badge[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  type: 'training' | 'accuracy' | 'study' | 'streak';
  target: number;
  current: number;
  completed: boolean;
  xpReward: number;
  gradient: string;
}

export interface LearningChapter {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  isNew?: boolean;
  completed: boolean;
  progress: number;
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  isOnline: boolean;
  rank: number;
}

// Combined user data interface
export interface UserData {
  profile: UserProfile;
  stats: UserStats;
  progress: UserProgress;
  dailyTasks: DailyTask[];
  learningChapters: LearningChapter[];
  friends: Friend[];
}