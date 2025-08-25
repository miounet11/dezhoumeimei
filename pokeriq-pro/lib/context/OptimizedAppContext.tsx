'use client';

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { useToast } from '../ui/Toast';

// Enhanced State Management System
interface UserSession {
  id: string;
  username: string;
  level: number;
  experience: number;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: 'zh' | 'en';
    autoSave: boolean;
    soundEnabled: boolean;
    animationsEnabled: boolean;
    reducedMotion: boolean;
  };
  stats: {
    gamesPlayed: number;
    winRate: number;
    totalEarnings: number;
    currentStreak: number;
    trainingHours: number;
  };
}

interface AppState {
  user: UserSession | null;
  loading: boolean;
  error: string | null;
  workflowStep: number;
  gameMode: 'training' | 'live' | 'analysis';
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionable?: {
    label: string;
    action: () => void;
  };
}

type AppAction =
  | { type: 'SET_USER'; payload: UserSession }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WORKFLOW_STEP'; payload: number }
  | { type: 'SET_GAME_MODE'; payload: 'training' | 'live' | 'analysis' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'UPDATE_USER_PREFERENCES'; payload: Partial<UserSession['preferences']> }
  | { type: 'UPDATE_USER_STATS'; payload: Partial<UserSession['stats']> };

const initialState: AppState = {
  user: null,
  loading: false,
  error: null,
  workflowStep: 0,
  gameMode: 'training',
  notifications: [],
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, error: null };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_WORKFLOW_STEP':
      return { ...state, workflowStep: action.payload };
    
    case 'SET_GAME_MODE':
      return { ...state, gameMode: action.payload };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications.slice(0, 9)], // Keep only 10 most recent
      };
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notif =>
          notif.id === action.payload ? { ...notif, read: true } : notif
        ),
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(notif => notif.id !== action.payload),
      };
    
    case 'UPDATE_USER_PREFERENCES':
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          preferences: { ...state.user.preferences, ...action.payload }
        } : null,
      };
    
    case 'UPDATE_USER_STATS':
      return {
        ...state,
        user: state.user ? {
          ...state.user,
          stats: { ...state.user.stats, ...action.payload }
        } : null,
      };
    
    default:
      return state;
  }
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Streamlined actions
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  startTrainingWorkflow: () => void;
  completeWorkflowStep: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  updatePreferences: (preferences: Partial<UserSession['preferences']>) => void;
  
  // Computed values
  unreadNotificationCount: number;
  isWorkflowComplete: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { showToast } = useToast();

  // Auto-save user preferences
  useEffect(() => {
    if (state.user?.preferences) {
      localStorage.setItem('userPreferences', JSON.stringify(state.user.preferences));
    }
  }, [state.user?.preferences]);

  // Apply theme changes automatically
  useEffect(() => {
    if (state.user?.preferences.theme) {
      const { theme } = state.user.preferences;
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // Auto mode - follow system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDark);
      }
    }
  }, [state.user?.preferences.theme]);

  // Streamlined login function
  const login = async (credentials: { username: string; password: string }) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Simulated API call - replace with actual authentication
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) throw new Error('登录失败');

      const userData = await response.json();
      
      // Load saved preferences
      const savedPreferences = localStorage.getItem('userPreferences');
      if (savedPreferences) {
        userData.preferences = { ...userData.preferences, ...JSON.parse(savedPreferences) };
      }

      dispatch({ type: 'SET_USER', payload: userData });
      
      showToast({
        type: 'success',
        title: '登录成功',
        message: `欢迎回来，${userData.username}！`,
      });

      // Add welcome notification
      addNotification({
        type: 'info',
        title: '每日提醒',
        message: '今天是提升牌技的好日子，开始训练吧！',
        read: false,
        actionable: {
          label: '开始训练',
          action: () => startTrainingWorkflow(),
        },
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      showToast({
        type: 'error',
        title: '登录失败',
        message: errorMessage,
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = () => {
    dispatch({ type: 'SET_USER', payload: null as any });
    dispatch({ type: 'SET_WORKFLOW_STEP', payload: 0 });
    localStorage.removeItem('userPreferences');
    localStorage.removeItem('authToken');
    
    showToast({
      type: 'info',
      title: '已退出登录',
      message: '期待您的下次访问！',
    });
  };

  const startTrainingWorkflow = () => {
    dispatch({ type: 'SET_WORKFLOW_STEP', payload: 1 });
    dispatch({ type: 'SET_GAME_MODE', payload: 'training' });
    
    addNotification({
      type: 'success',
      title: '训练开始',
      message: '让我们提升您的扑克技能！',
      read: false,
    });
  };

  const completeWorkflowStep = () => {
    const nextStep = state.workflowStep + 1;
    dispatch({ type: 'SET_WORKFLOW_STEP', payload: nextStep });
    
    if (nextStep >= 5) { // Assuming 5 workflow steps
      showToast({
        type: 'success',
        title: '训练完成',
        message: '恭喜您完成了本次训练！',
      });
      
      // Update stats
      if (state.user) {
        dispatch({ 
          type: 'UPDATE_USER_STATS', 
          payload: { 
            gamesPlayed: state.user.stats.gamesPlayed + 1,
            trainingHours: state.user.stats.trainingHours + 0.5,
          }
        });
      }
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      ...notification,
    };
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
  };

  const updatePreferences = (preferences: Partial<UserSession['preferences']>) => {
    dispatch({ type: 'UPDATE_USER_PREFERENCES', payload: preferences });
    
    showToast({
      type: 'success',
      title: '设置已保存',
      message: '您的偏好设置已自动保存',
    });
  };

  // Computed values
  const unreadNotificationCount = state.notifications.filter(n => !n.read).length;
  const isWorkflowComplete = state.workflowStep >= 5;

  const contextValue: AppContextType = {
    state,
    dispatch,
    login,
    logout,
    startTrainingWorkflow,
    completeWorkflowStep,
    addNotification,
    updatePreferences,
    unreadNotificationCount,
    isWorkflowComplete,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Workflow management hook
export const useWorkflow = () => {
  const { state, startTrainingWorkflow, completeWorkflowStep } = useApp();
  
  const workflows = {
    training: [
      { id: 1, title: '选择训练模式', description: '选择适合您水平的训练模式' },
      { id: 2, title: '设置参数', description: '配置游戏参数和对手' },
      { id: 3, title: '开始训练', description: '进行实际的扑克训练' },
      { id: 4, title: '分析结果', description: '查看训练结果和改进建议' },
      { id: 5, title: '保存进度', description: '保存您的训练进度' },
    ],
  };

  const currentWorkflow = workflows[state.gameMode] || workflows.training;
  const currentStep = currentWorkflow.find(step => step.id === state.workflowStep);
  const progress = (state.workflowStep / currentWorkflow.length) * 100;

  return {
    currentWorkflow,
    currentStep,
    progress,
    isComplete: state.workflowStep >= currentWorkflow.length,
    startWorkflow: startTrainingWorkflow,
    nextStep: completeWorkflowStep,
  };
};

// Performance optimization hook
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const memoizedCallback = React.useCallback(callback, deps);
  return memoizedCallback;
};

// Auto-save hook for user progress
export const useAutoSave = (data: any, delay: number = 2000) => {
  const { state } = useApp();
  
  React.useEffect(() => {
    if (!state.user?.preferences.autoSave) return;

    const timeoutId = setTimeout(() => {
      // Auto-save logic here
      localStorage.setItem('autoSaveData', JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
      }));
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [data, delay, state.user?.preferences.autoSave]);
};