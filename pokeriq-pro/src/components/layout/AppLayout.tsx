'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Target, 
  Brain, 
  BarChart3, 
  Trophy, 
  Users, 
  Settings, 
  Sparkles,
  BookOpen,
  Zap,
  Menu,
  X,
  ChevronRight,
  Crown,
  Flame,
  Star,
  Zap as Lightning
} from 'lucide-react';
import { useUserData } from '../../../lib/hooks/useUserData';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { 
    userData, 
    loading, 
    error,
    dailyTasks,
    learningProgress,
    friendsLeaderboard
  } = useUserData();

  const navItems: NavItem[] = [
    { id: 'home', label: '主页', icon: <Home size={20} />, href: '/home' },
    { id: 'journey', label: '学习之旅', icon: <Target size={20} />, href: '/journey', badge: 'NEW' },
    { id: 'study', label: '扑克学院', icon: <BookOpen size={20} />, href: '/study' },
    { id: 'ai-training', label: 'AI训练', icon: <Brain size={20} />, href: '/ai-training' },
    { id: 'gto-training', label: 'GTO中心', icon: <Zap size={20} />, href: '/gto-training' },
    { id: 'analytics', label: '数据分析', icon: <BarChart3 size={20} />, href: '/analytics' },
    { id: 'achievements', label: '成就', icon: <Trophy size={20} />, href: '/achievements' },
    { id: 'social', label: '社交中心', icon: <Users size={20} />, href: '/social' },
    { id: 'settings', label: '设置', icon: <Settings size={20} />, href: '/settings' },
  ];

  // Calculate display values
  const streakCount = userData?.dailyStreak || 7;
  const levelValue = userData?.level || 15;
  const todayXPValue = '+250';
  const currentXP = userData?.xp ? userData.xp % 1000 : 420;
  const nextLevelXP = 1000;
  const xpProgressPercent = (currentXP / nextLevelXP) * 100;

  // Display name
  const displayName = userData?.username || userData?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="hidden lg:block fixed top-0 left-0 right-0 h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 z-50 transition-colors duration-200">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link className="flex items-center space-x-3" href="/home">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">♠</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">PokerIQ Pro</h1>
                <p className="text-xs text-gray-500">智能德州扑克训练</p>
              </div>
            </Link>
            {/* 热门功能快捷按钮 - 只显示最常用的功能 */}
            <nav className="flex items-center space-x-1">
              <Link 
                className="relative px-4 py-2 rounded-lg flex items-center space-x-2 transition-all text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" 
                href="/game"
              >
                <span className="text-lg">🎮</span>
                <span className="text-sm font-medium">快速游戏</span>
              </Link>
              
              <Link 
                className="relative px-4 py-2 rounded-lg flex items-center space-x-2 transition-all text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" 
                href="/companion-center"
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium">AI陪伴</span>
                <span className="absolute -top-1 -right-1 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full animate-pulse">
                  HOT
                </span>
              </Link>
              
              <Link 
                className="relative px-4 py-2 rounded-lg flex items-center space-x-2 transition-all text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" 
                href="/ai-training"
              >
                <Brain className="w-5 h-5" />
                <span className="text-sm font-medium">AI训练</span>
              </Link>
              
              <Link 
                className="relative px-4 py-2 rounded-lg flex items-center space-x-2 transition-all text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" 
                href="/journey"
              >
                <Target className="w-5 h-5" />
                <span className="text-sm font-medium">学习之旅</span>
                <span className="absolute -top-1 -right-1 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                  NEW
                </span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-xs text-gray-500">连胜</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{streakCount}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-xs text-gray-500">等级</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{levelValue}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Lightning className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">今日XP</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{todayXPValue}</p>
                </div>
              </div>
            </div>
            <div className="w-32">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>LV {levelValue}</span>
                <span>{currentXP}/{nextLevelXP} XP</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500" style={{width: `${xpProgressPercent}%`}}></div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/profile" className="relative group">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 cursor-pointer">
                  <span className="text-white font-bold">{avatarLetter}</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                {/* 悬停提示 */}
                <div className="absolute top-full right-0 mt-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  个人资料
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar with Navigation Menu */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 backdrop-blur-sm z-30 transition-colors duration-200 border-r border-gray-800/50 dark:border-gray-700/50 shadow-xl">
        <div className="h-full flex flex-col">
          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1">
              {/* Dashboard */}
              <li>
                <Link 
                  href="/dashboard" 
                  className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                    pathname === '/dashboard' 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                      : 'text-gray-200 hover:bg-gray-800/60 hover:text-white hover:translate-x-1'
                  }`}
                >
                  <Home className="w-5 h-5 mr-3" />
                  <span>控制台</span>
                </Link>
              </li>
              
              {/* Game Center Section */}
              <li className="mt-6">
                <div className="px-6 py-2 text-xs font-bold text-white/90 uppercase tracking-wider bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-lg mx-3 mb-2">
                  🎮 游戏中心
                </div>
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link 
                      href="/game" 
                      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                        pathname === '/game' 
                          ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg' 
                          : 'text-gray-200 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <span className="w-5 h-5 mr-3 text-center">🎮</span>
                      <span>快速游戏</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/battle" 
                      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                        pathname === '/battle' 
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg' 
                          : 'text-gray-200 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <span className="w-5 h-5 mr-3 text-center">⚔️</span>
                      <span>对战模式</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/skill-test" 
                      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                        pathname?.startsWith('/skill-test') 
                          ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg' 
                          : 'text-gray-200 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <span className="w-5 h-5 mr-3 text-center">🎯</span>
                      <span>技能测试</span>
                    </Link>
                  </li>
                </ul>
              </li>
              
              {/* AI Training Section */}
              <li className="mt-6">
                <div className="px-6 py-2 text-xs font-bold text-white/90 uppercase tracking-wider bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-lg mx-3 mb-2">
                  🤖 AI训练
                </div>
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link 
                      href="/ai-training" 
                      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                        pathname === '/ai-training' 
                          ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg' 
                          : 'text-gray-200 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <Brain className="w-5 h-5 mr-3" />
                      <span>AI对战</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/gto-training" 
                      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                        pathname === '/gto-training' 
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg' 
                          : 'text-gray-200 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <Zap className="w-5 h-5 mr-3" />
                      <span>GTO策略</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/study" 
                      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                        pathname === '/study' 
                          ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg' 
                          : 'text-gray-200 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <BookOpen className="w-5 h-5 mr-3" />
                      <span>学习课程</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/journey" 
                      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                        pathname === '/journey' 
                          ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg' 
                          : 'text-gray-200 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <Target className="w-5 h-5 mr-3" />
                      <span>学习之旅</span>
                      <span className="ml-auto px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">NEW</span>
                    </Link>
                  </li>
                </ul>
              </li>
              
              {/* Companion System Section */}
              <li className="mt-6">
                <div className="px-6 py-2 text-xs font-bold text-white/90 uppercase tracking-wider bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-lg mx-3 mb-2">
                  ✨ 陪伴系统
                </div>
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link 
                      href="/companion-center" 
                      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                        pathname === '/companion-center' 
                          ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' 
                          : 'text-gray-200 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <Sparkles className="w-5 h-5 mr-3" />
                      <span>AI陪伴</span>
                      <span className="ml-auto px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full animate-pulse">
                        HOT
                      </span>
                    </Link>
                  </li>
                </ul>
              </li>
              
              {/* Data Analysis Section */}
              <li className="mt-6">
                <div className="px-6 py-2 text-xs font-bold text-white/90 uppercase tracking-wider bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-lg mx-3 mb-2">
                  📊 数据分析
                </div>
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link 
                      href="/analytics" 
                      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                        pathname === '/analytics' 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                          : 'text-gray-200 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <BarChart3 className="w-5 h-5 mr-3" />
                      <span>数据统计</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/advanced-analytics" 
                      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                        pathname === '/advanced-analytics' 
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg' 
                          : 'text-gray-200 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <span className="w-5 h-5 mr-3 text-center">📊</span>
                      <span>高级分析</span>
                    </Link>
                  </li>
                </ul>
              </li>
              
              {/* Social Center Section */}
              <li className="mt-6">
                <div className="px-6 py-2 text-xs font-bold text-white/90 uppercase tracking-wider bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-lg mx-3 mb-2">
                  👥 社交中心
                </div>
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link 
                      href="/social" 
                      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                        pathname === '/social' 
                          ? 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-lg' 
                          : 'text-gray-200 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <Users className="w-5 h-5 mr-3" />
                      <span>好友系统</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/events" 
                      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                        pathname === '/events' 
                          ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg' 
                          : 'text-gray-200 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <span className="w-5 h-5 mr-3 text-center">🎉</span>
                      <span>活动中心</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/achievements" 
                      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                        pathname === '/achievements' 
                          ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg' 
                          : 'text-gray-200 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <Trophy className="w-5 h-5 mr-3" />
                      <span>成就系统</span>
                    </Link>
                  </li>
                </ul>
              </li>
              
              {/* Personal Center Section */}
              <li className="mt-6">
                <div className="px-6 py-2 text-xs font-bold text-white/90 uppercase tracking-wider bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-lg mx-3 mb-2">
                  👤 个人中心
                </div>
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link 
                      href="/profile" 
                      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                        pathname === '/profile' 
                          ? 'bg-gradient-to-r from-gray-600 to-slate-600 text-white shadow-lg' 
                          : 'text-gray-200 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <span className="w-5 h-5 mr-3 text-center">👤</span>
                      <span>个人资料</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/settings" 
                      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                        pathname === '/settings' 
                          ? 'bg-gradient-to-r from-slate-600 to-gray-600 text-white shadow-lg' 
                          : 'text-gray-200 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <Settings className="w-5 h-5 mr-3" />
                      <span>设置</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/subscription" 
                      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg mx-3 mb-1 transition-all duration-200 ${
                        pathname === '/subscription' 
                          ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg' 
                          : 'text-gray-200 hover:bg-gray-800 hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <Crown className="w-5 h-5 mr-3" />
                      <span>会员中心</span>
                    </Link>
                  </li>
                </ul>
              </li>
            </ul>
          </nav>
          
          {/* Pro Upgrade Section - Hidden for now */}
          {/* <div className="p-4 border-t border-gray-800 dark:border-gray-700">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">升级到Pro</span>
                <Crown className="w-4 h-4" />
              </div>
              <p className="text-xs opacity-90 mb-2">解锁全部AI对手和高级分析</p>
              <button className="w-full py-1.5 bg-white/20 hover:bg-white/30 rounded-md text-xs font-medium transition-colors">
                了解更多
              </button>
            </div>
          </div> */}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 z-50 transition-colors duration-200">
        <div className="grid grid-cols-5 h-16">
          {navItems.slice(0, 5).map((item) => (
            <Link 
              key={item.id} 
              href={item.href} 
              className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 px-1 py-2 rounded-lg mx-1 ${
                pathname === item.href 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-medium' 
                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <div className="scale-90">{item.icon}</div>
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Hamburger */}
      <button className="lg:hidden fixed top-4 right-4 z-50 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-4">
              {navItems.map((item) => (
                <Link key={item.id} href={item.href} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setIsMobileMenuOpen(false)}>
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-16 pb-20 lg:pb-8 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}