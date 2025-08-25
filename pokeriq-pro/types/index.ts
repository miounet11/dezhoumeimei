// 用户相关类型
export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatar: string;
  role: 'user' | 'admin' | 'premium';
  level: number;
  rank: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserStats {
  totalHands: number;
  totalGames: number;
  winRate: number;
  totalEarnings: number;
  currentStreak: number;
  vpip: number; // Voluntarily Put money In Pot
  pfr: number;  // Pre-Flop Raise
  af: number;   // Aggression Factor
  trainingHours: number;
  achievements: number;
}

// 游戏相关类型
export interface GameSession {
  id: string;
  userId: string;
  type: 'cash' | 'tournament' | 'training';
  stakes: string;
  result: 'win' | 'loss' | 'draw';
  earnings: number;
  hands: number;
  duration: number;
  date: string;
  opponents: AIOpponent[];
}

export interface AIOpponent {
  id: string;
  name: string;
  style: AIOpponentStyle;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  avatar: string;
  description: string;
  stats: {
    vpip: number;
    pfr: number;
    af: number;
    '3bet': number;
  };
}

export type AIOpponentStyle = 
  | 'tight-aggressive'  // TAG
  | 'loose-aggressive'  // LAG
  | 'tight-passive'     // Rock
  | 'loose-passive'     // Fish
  | 'gto'              // Game Theory Optimal
  | 'exploitative'     // 剥削型
  | 'maniac'          // 疯狂型
  | 'nit'             // 超紧型
  | 'station'         // 跟注站
  | 'shark'           // 鲨鱼
  | 'whale'           // 鲸鱼
  | 'balanced'        // 平衡型
  | 'tricky'          // 诡计型
  | 'abc'             // 标准型
  | 'adaptive';       // 自适应型

// 成就相关类型
export interface Achievement {
  id: string;
  category: 'training' | 'stats' | 'special' | 'milestone';
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  total: number;
  completed: boolean;
  unlockedAt?: string;
  reward?: {
    type: 'xp' | 'badge' | 'background' | 'title';
    value: string | number;
  };
}

// 训练相关类型
export interface TrainingSession {
  id: string;
  userId: string;
  mode: TrainingMode;
  scenario: TrainingScenario;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  score: number;
  decisions: Decision[];
  duration: number;
  completedAt: string;
}

export interface TrainingMode {
  id: string;
  name: string;
  description: string;
  type: 'preflop' | 'flop' | 'turn' | 'river' | 'full-hand';
  focus: 'gto' | 'exploitative' | 'mixed';
}

export interface TrainingScenario {
  id: string;
  title: string;
  position: Position;
  stackSize: number; // in BB
  opponents: number;
  description: string;
  objectives: string[];
}

export type Position = 'UTG' | 'UTG+1' | 'MP' | 'MP+1' | 'CO' | 'BTN' | 'SB' | 'BB';

export interface Decision {
  action: 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';
  amount?: number;
  isCorrect: boolean;
  ev: number; // Expected Value
  reasoning: string;
  timestamp: string;
}

// 手牌相关类型
export interface Hand {
  id: string;
  sessionId: string;
  cards: Card[];
  communityCards: Card[];
  position: Position;
  action: string[];
  pot: number;
  result: 'win' | 'loss' | 'tie';
  showdown: boolean;
  analysis?: HandAnalysis;
}

export interface Card {
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
}

export interface HandAnalysis {
  mistakes: string[];
  ev: number;
  correctAction: string;
  explanation: string;
  alternativeLines: string[];
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 表单类型
export interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  agreeToTerms: boolean;
}

export interface ProfileForm {
  name: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    soundEffects: boolean;
    autoSave: boolean;
  };
}

// 统计数据类型
export interface Statistics {
  overview: {
    totalHands: number;
    totalSessions: number;
    totalProfit: number;
    winRate: number;
    roi: number; // Return on Investment
    hourlyRate: number;
  };
  byPosition: Record<Position, PositionStats>;
  byTimeRange: {
    daily: StatsSummary[];
    weekly: StatsSummary[];
    monthly: StatsSummary[];
  };
  trends: {
    winRate: TrendData[];
    vpip: TrendData[];
    pfr: TrendData[];
    af: TrendData[];
  };
}

export interface PositionStats {
  hands: number;
  winRate: number;
  profit: number;
  vpip: number;
  pfr: number;
  '3bet': number;
}

export interface StatsSummary {
  date: string;
  hands: number;
  profit: number;
  winRate: number;
}

export interface TrendData {
  date: string;
  value: number;
}