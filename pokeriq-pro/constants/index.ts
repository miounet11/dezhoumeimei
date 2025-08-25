// API配置
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

// 用户级别配置
export const USER_LEVELS = {
  BEGINNER: { min: 0, max: 999, label: '新手' },
  INTERMEDIATE: { min: 1000, max: 4999, label: '进阶' },
  ADVANCED: { min: 5000, max: 9999, label: '高级' },
  EXPERT: { min: 10000, max: Infinity, label: '专家' },
} as const;

// 游戏配置
export const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 9,
  DEFAULT_SMALL_BLIND: 25,
  DEFAULT_BIG_BLIND: 50,
  DEFAULT_STARTING_CHIPS: 2500,
} as const;

// 扑克牌配置
export const POKER_CONFIG = {
  SUITS: ['hearts', 'diamonds', 'clubs', 'spades'] as const,
  RANKS: ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const,
  HAND_TYPES: [
    'high_card',
    'pair',
    'two_pair',
    'three_kind',
    'straight',
    'flush',
    'full_house',
    'four_kind',
    'straight_flush',
    'royal_flush'
  ] as const,
} as const;

// 主题配置
export const THEME_CONFIG = {
  COLORS: {
    PRIMARY: '#10b981',
    SECONDARY: '#6b7280',
    SUCCESS: '#22c55e',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    INFO: '#3b82f6',
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px',
  },
} as const;

// 本地存储键
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token',
  USER_DATA: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  TUTORIAL_COMPLETED: 'tutorialCompleted',
} as const;

// 路由配置
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  TRAINING: '/ai-training',
  ANALYTICS: '/analytics',
  ACHIEVEMENTS: '/achievements',
  SETTINGS: '/settings',
} as const;

// 成就类型
export const ACHIEVEMENT_TYPES = {
  TRAINING: 'training',
  STATS: 'stats',
  SPECIAL: 'special',
  MILESTONE: 'milestone',
} as const;

// 成就稀有度
export const ACHIEVEMENT_RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const;

// 训练难度
export const TRAINING_DIFFICULTY = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
} as const;

// 图表配置
export const CHART_CONFIG = {
  DEFAULT_HEIGHT: 300,
  DEFAULT_COLORS: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#d084d0'],
  ANIMATION_DURATION: 300,
} as const;

// 性能配置
export const PERFORMANCE_CONFIG = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  LAZY_LOAD_THRESHOLD: 0.1,
  VIRTUAL_SCROLL_BUFFER: 5,
} as const;

// 验证规则
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
} as const;

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  UNAUTHORIZED: '用户认证失败，请重新登录',
  FORBIDDEN: '没有权限访问该资源',
  NOT_FOUND: '请求的资源不存在',
  INTERNAL_ERROR: '服务器内部错误',
  VALIDATION_ERROR: '数据验证失败',
} as const;