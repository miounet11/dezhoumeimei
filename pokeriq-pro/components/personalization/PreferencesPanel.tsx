'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Clock,
  Target,
  Brain,
  Zap,
  BookOpen,
  Users,
  Volume2,
  Bell,
  Palette,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('preferences-panel');

interface UserPreferences {
  timeAvailability: number; // minutes per session
  preferredDifficulty: number; // 1-5
  learningGoals: string[];
  notificationSettings: {
    dailyReminders: boolean;
    achievementAlerts: boolean;
    recommendationUpdates: boolean;
    weeklyProgress: boolean;
  };
  uiPreferences: {
    theme: 'light' | 'dark' | 'auto';
    language: 'zh' | 'en';
    soundEnabled: boolean;
    animations: boolean;
  };
  contentPreferences: {
    focusAreas: string[];
    excludedTopics: string[];
    preferredContentTypes: string[];
  };
}

interface PreferencesPanelProps {
  userId: string;
  className?: string;
}

export const PreferencesPanel: React.FC<PreferencesPanelProps> = ({
  userId,
  className = ''
}) => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const availableGoals = [
    '提升整体水平',
    '改善翻前决策',
    '加强翻后游戏',
    '学习GTO策略',
    '提高心理博弈能力',
    '改善资金管理',
    '锦标赛技巧提升',
    '读牌能力训练'
  ];

  const availableFocusAreas = [
    'preflop', 'postflop', 'psychology', 'mathematics', 'bankroll', 'tournament', 'gto', 'exploitative'
  ];

  const focusAreaNames: Record<string, string> = {
    preflop: '翻前策略',
    postflop: '翻后游戏',
    psychology: '心理博弈',
    mathematics: '数学计算',
    bankroll: '资金管理',
    tournament: '锦标赛',
    gto: 'GTO策略',
    exploitative: '剥削性策略'
  };

  const contentTypes = [
    { key: 'video', label: '视频教程', icon: '📹' },
    { key: 'interactive', label: '互动练习', icon: '🎮' },
    { key: 'text', label: '文字教材', icon: '📚' },
    { key: 'quiz', label: '测验题目', icon: '❓' },
    { key: 'simulation', label: '实战模拟', icon: '🎯' }
  ];

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/personalization/preferences?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load preferences');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setPreferences(data.data);
      } else {
        // Set default preferences
        setPreferences(getDefaultPreferences());
      }
      
      logger.info('Preferences loaded successfully', { userId });
    } catch (error) {
      logger.error('Error loading preferences:', error);
      setError(error instanceof Error ? error.message : 'Failed to load preferences');
      setPreferences(getDefaultPreferences());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPreferences = (): UserPreferences => ({
    timeAvailability: 30,
    preferredDifficulty: 3,
    learningGoals: ['提升整体水平'],
    notificationSettings: {
      dailyReminders: true,
      achievementAlerts: true,
      recommendationUpdates: true,
      weeklyProgress: true
    },
    uiPreferences: {
      theme: 'auto',
      language: 'zh',
      soundEnabled: true,
      animations: true
    },
    contentPreferences: {
      focusAreas: ['preflop', 'postflop'],
      excludedTopics: [],
      preferredContentTypes: ['interactive', 'video']
    }
  });

  const savePreferences = async () => {
    if (!preferences) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/personalization/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          preferences
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }
      
      setHasChanges(false);
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
      
      logger.info('Preferences saved successfully', { userId });
    } catch (error) {
      logger.error('Error saving preferences:', error);
      setError(error instanceof Error ? error.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const resetPreferences = () => {
    setPreferences(getDefaultPreferences());
    setHasChanges(true);
  };

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => prev ? { ...prev, ...updates } : null);
    setHasChanges(true);
  };

  const updateNestedPreferences = <T extends keyof UserPreferences>(
    section: T,
    updates: Partial<UserPreferences[T]>
  ) => {
    setPreferences(prev => prev ? {
      ...prev,
      [section]: { ...(prev[section] as any), ...updates }
    } : null);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">加载失败</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">无法加载用户偏好设置</p>
        <button
          onClick={loadPreferences}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Settings className="w-6 h-6 mr-2 text-blue-600" />
            偏好设置
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            个性化您的学习体验
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded-full"
            >
              有未保存的更改
            </motion.div>
          )}
          
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center text-green-600 dark:text-green-400 text-sm"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              已保存
            </motion.div>
          )}
          
          <button
            onClick={resetPreferences}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            title="重置为默认设置"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={savePreferences}
            disabled={saving || !hasChanges}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              hasChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{saving ? '保存中...' : '保存设置'}</span>
          </button>
        </div>
      </div>

      {/* Learning Preferences */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Brain className="w-5 h-5 mr-2 text-purple-600" />
          学习偏好
        </h3>
        
        <div className="space-y-6">
          {/* Time Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              每次学习时长 (分钟)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="15"
                max="120"
                step="15"
                value={preferences.timeAvailability}
                onChange={(e) => updatePreferences({ timeAvailability: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="text-sm font-medium text-gray-900 dark:text-white w-16 text-center bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {preferences.timeAvailability}分钟
              </span>
            </div>
          </div>

          {/* Preferred Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
              <Target className="w-4 h-4 mr-1" />
              偏好难度
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => updatePreferences({ preferredDifficulty: level })}
                  className={`flex-1 py-2 px-3 text-sm rounded-lg transition-colors duration-200 ${
                    preferences.preferredDifficulty === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {level === 1 ? '很简单' : level === 2 ? '简单' : level === 3 ? '中等' : level === 4 ? '困难' : '很困难'}
                </button>
              ))}
            </div>
          </div>

          {/* Learning Goals */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              学习目标 (可多选)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableGoals.map(goal => (
                <label key={goal} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.learningGoals.includes(goal)}
                    onChange={(e) => {
                      const goals = e.target.checked
                        ? [...preferences.learningGoals, goal]
                        : preferences.learningGoals.filter(g => g !== goal);
                      updatePreferences({ learningGoals: goals });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{goal}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Focus Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              重点关注领域
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {availableFocusAreas.map(area => (
                <label key={area} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.contentPreferences.focusAreas.includes(area)}
                    onChange={(e) => {
                      const areas = e.target.checked
                        ? [...preferences.contentPreferences.focusAreas, area]
                        : preferences.contentPreferences.focusAreas.filter(a => a !== area);
                      updateNestedPreferences('contentPreferences', { focusAreas: areas });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {focusAreaNames[area]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Content Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              偏好内容类型
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {contentTypes.map(type => (
                <label key={type.key} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                  <input
                    type="checkbox"
                    checked={preferences.contentPreferences.preferredContentTypes.includes(type.key)}
                    onChange={(e) => {
                      const types = e.target.checked
                        ? [...preferences.contentPreferences.preferredContentTypes, type.key]
                        : preferences.contentPreferences.preferredContentTypes.filter(t => t !== type.key);
                      updateNestedPreferences('contentPreferences', { preferredContentTypes: types });
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-lg">{type.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-yellow-600" />
          通知设置
        </h3>
        
        <div className="space-y-4">
          {[
            { key: 'dailyReminders', label: '每日学习提醒', description: '每天提醒您进行学习' },
            { key: 'achievementAlerts', label: '成就通知', description: '获得新成就时通知' },
            { key: 'recommendationUpdates', label: '推荐更新', description: '有新推荐时通知' },
            { key: 'weeklyProgress', label: '每周进度报告', description: '每周发送学习进度总结' }
          ].map(setting => (
            <div key={setting.key} className="flex items-center justify-between py-3">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {setting.label}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {setting.description}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.notificationSettings[setting.key as keyof typeof preferences.notificationSettings]}
                  onChange={(e) => updateNestedPreferences('notificationSettings', {
                    [setting.key]: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* UI Preferences */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Palette className="w-5 h-5 mr-2 text-pink-600" />
          界面设置
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              主题模式
            </label>
            <select
              value={preferences.uiPreferences.theme}
              onChange={(e) => updateNestedPreferences('uiPreferences', { 
                theme: e.target.value as 'light' | 'dark' | 'auto' 
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="light">浅色模式</option>
              <option value="dark">深色模式</option>
              <option value="auto">跟随系统</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              语言
            </label>
            <select
              value={preferences.uiPreferences.language}
              onChange={(e) => updateNestedPreferences('uiPreferences', { 
                language: e.target.value as 'zh' | 'en' 
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>

        {/* Sound and Animation */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">音效</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.uiPreferences.soundEnabled}
                onChange={(e) => updateNestedPreferences('uiPreferences', { 
                  soundEnabled: e.target.checked 
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">动画效果</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.uiPreferences.animations}
                onChange={(e) => updateNestedPreferences('uiPreferences', { 
                  animations: e.target.checked 
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreferencesPanel;