'use client';

import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieIcon, 
  Activity, 
  Target, 
  Clock,
  Award,
  Zap,
  Eye,
  Filter
} from 'lucide-react';
import { SessionStatistics } from '@/lib/training/session-manager';

export interface SessionGraphsProps {
  sessionData: SessionStatistics[];
  timeRange: '7d' | '30d' | '90d' | 'all';
  onTimeRangeChange: (range: '7d' | '30d' | '90d' | 'all') => void;
  className?: string;
}

interface ChartData {
  date: string;
  accuracy: number;
  totalEV: number;
  handsPlayed: number;
  vpip: number;
  pfr: number;
  aggression: number;
  timeSpent: number;
}

interface SkillProgressData {
  skill: string;
  current: number;
  target: number;
  improvement: number;
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6'
};

const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.info, COLORS.purple];

export const SessionGraphs: React.FC<SessionGraphsProps> = ({
  sessionData,
  timeRange,
  onTimeRangeChange,
  className = ''
}) => {
  const [selectedGraph, setSelectedGraph] = useState<'progress' | 'stats' | 'mistakes' | 'skills'>('progress');

  // Process session data for charts
  const chartData = useMemo((): ChartData[] => {
    const filteredData = filterDataByTimeRange(sessionData, timeRange);
    
    return filteredData.map((session, index) => ({
      date: formatDate(session.completedAt),
      accuracy: session.accuracy,
      totalEV: session.totalEV,
      handsPlayed: session.handsPlayed,
      vpip: session.vpip,
      pfr: session.pfr,
      aggression: session.aggression,
      timeSpent: session.timeSpent
    }));
  }, [sessionData, timeRange]);

  // Calculate skill progress data
  const skillProgressData = useMemo((): SkillProgressData[] => {
    if (sessionData.length === 0) return [];

    const latestSession = sessionData[sessionData.length - 1];
    
    return [
      {
        skill: 'Decision Accuracy',
        current: latestSession.accuracy,
        target: 85,
        improvement: calculateImprovement(sessionData, 'accuracy')
      },
      {
        skill: 'EV Performance',
        current: Math.max(0, Math.min(100, (latestSession.totalEV + 10) * 5)), // Normalize EV to 0-100
        target: 75,
        improvement: calculateImprovement(sessionData, 'totalEV')
      },
      {
        skill: 'VPIP Control',
        current: Math.max(0, 100 - Math.abs(latestSession.vpip - 23)), // Optimal VPIP around 23%
        target: 80,
        improvement: -calculateVPIPImprovement(sessionData)
      },
      {
        skill: 'Aggression Factor',
        current: Math.min(100, latestSession.aggression * 25), // Scale AF to 0-100
        target: 70,
        improvement: calculateImprovement(sessionData, 'aggression')
      }
    ];
  }, [sessionData]);

  // Prepare mistake distribution data
  const mistakeData = useMemo(() => {
    if (sessionData.length === 0) return [];

    const mistakeTypes = new Map<string, number>();
    
    sessionData.forEach(session => {
      session.mistakes.forEach(mistake => {
        mistakeTypes.set(mistake.type, (mistakeTypes.get(mistake.type) || 0) + mistake.count);
      });
    });

    return Array.from(mistakeTypes.entries()).map(([type, count], index) => ({
      name: type,
      value: count,
      color: PIE_COLORS[index % PIE_COLORS.length]
    }));
  }, [sessionData]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    if (sessionData.length === 0) {
      return {
        totalSessions: 0,
        averageAccuracy: 0,
        totalEV: 0,
        totalHands: 0,
        totalTime: 0,
        improvement: 0
      };
    }

    const totalSessions = sessionData.length;
    const averageAccuracy = sessionData.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions;
    const totalEV = sessionData.reduce((sum, s) => sum + s.totalEV, 0);
    const totalHands = sessionData.reduce((sum, s) => sum + s.handsPlayed, 0);
    const totalTime = sessionData.reduce((sum, s) => sum + s.timeSpent, 0);
    
    // Calculate improvement (comparing first vs last session)
    const improvement = sessionData.length > 1 
      ? sessionData[sessionData.length - 1].accuracy - sessionData[0].accuracy
      : 0;

    return {
      totalSessions,
      averageAccuracy,
      totalEV,
      totalHands,
      totalTime,
      improvement
    };
  }, [sessionData]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            Training Analytics
          </h3>
          
          {/* Time Range Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {overallStats.totalSessions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sessions</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {overallStats.averageAccuracy.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Accuracy</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              overallStats.totalEV >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {overallStats.totalEV >= 0 ? '+' : ''}{overallStats.totalEV.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total EV</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {overallStats.totalHands}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Hands</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(overallStats.totalTime / 60)}h
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Time Spent</div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${
              overallStats.improvement >= 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {overallStats.improvement >= 0 ? '+' : ''}{overallStats.improvement.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Improvement</div>
          </div>
        </div>
      </div>

      {/* Graph Navigation */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex gap-2">
          {[
            { id: 'progress', label: 'Progress', icon: TrendingUp },
            { id: 'stats', label: 'Poker Stats', icon: Activity },
            { id: 'mistakes', label: 'Mistake Analysis', icon: Target },
            { id: 'skills', label: 'Skill Development', icon: Award }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedGraph(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedGraph === id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Graph Content */}
      <div className="p-6">
        {selectedGraph === 'progress' && (
          <div className="space-y-8">
            {/* Accuracy Over Time */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Decision Accuracy Over Time
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Accuracy']}
                      labelStyle={{ color: 'black' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke={COLORS.primary} 
                      strokeWidth={3}
                      dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* EV Performance */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Expected Value Performance
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [value, 'EV']}
                      labelStyle={{ color: 'black' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="totalEV" 
                      stroke={COLORS.success} 
                      fill={COLORS.success}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {selectedGraph === 'stats' && (
          <div className="space-y-8">
            {/* VPIP and PFR */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                VPIP and PFR Trends
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip labelStyle={{ color: 'black' }} />
                    <Line 
                      type="monotone" 
                      dataKey="vpip" 
                      stroke={COLORS.info} 
                      strokeWidth={2}
                      name="VPIP"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pfr" 
                      stroke={COLORS.warning} 
                      strokeWidth={2}
                      name="PFR"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Aggression Factor */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Aggression Factor
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [value, 'Aggression Factor']}
                      labelStyle={{ color: 'black' }}
                    />
                    <Bar dataKey="aggression" fill={COLORS.danger} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {selectedGraph === 'mistakes' && (
          <div className="space-y-8">
            {/* Mistake Distribution */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Common Mistakes Distribution
              </h4>
              {mistakeData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mistakeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {mistakeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No mistake data available
                </div>
              )}
            </div>

            {/* Recent Mistakes List */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h5 className="font-medium text-gray-900 dark:text-white mb-3">Recent Issues to Address</h5>
              {sessionData.length > 0 && sessionData[sessionData.length - 1].mistakes.length > 0 ? (
                <div className="space-y-2">
                  {sessionData[sessionData.length - 1].mistakes.slice(0, 3).map((mistake, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">{mistake.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-red-600 dark:text-red-400">
                          {mistake.count} occurrences
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          (-{mistake.cost.toFixed(2)} EV)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No recent mistakes - great job!</p>
              )}
            </div>
          </div>
        )}

        {selectedGraph === 'skills' && (
          <div className="space-y-8">
            {/* Skill Progress Radial Chart */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Skill Development Progress
              </h4>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={skillProgressData}>
                    <RadialBar 
                      minAngle={15} 
                      label={{ position: 'insideStart', fill: '#fff' }} 
                      background 
                      clockWise 
                      dataKey="current" 
                      fill={COLORS.primary}
                    />
                    <Legend 
                      iconSize={10} 
                      width={120} 
                      height={140} 
                      layout="vertical" 
                      verticalAlign="middle" 
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Tooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Skill Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skillProgressData.map((skill, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-gray-900 dark:text-white">{skill.skill}</h5>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      skill.improvement >= 0
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200'
                    }`}>
                      {skill.improvement >= 0 ? '+' : ''}{skill.improvement.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Current: {skill.current.toFixed(1)}%</span>
                      <span>Target: {skill.target}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(skill.current, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {skill.current >= skill.target ? '🎯 Target achieved!' : 
                     `${(skill.target - skill.current).toFixed(1)}% to target`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
function filterDataByTimeRange(data: SessionStatistics[], range: '7d' | '30d' | '90d' | 'all'): SessionStatistics[] {
  if (range === 'all') return data;
  
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return data.filter(session => new Date(session.completedAt) >= cutoffDate);
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function calculateImprovement(sessions: SessionStatistics[], metric: keyof SessionStatistics): number {
  if (sessions.length < 2) return 0;
  
  const recent = sessions.slice(-5); // Last 5 sessions
  const older = sessions.slice(-10, -5); // Previous 5 sessions
  
  if (older.length === 0) return 0;
  
  const recentAvg = recent.reduce((sum, s) => sum + (s[metric] as number), 0) / recent.length;
  const olderAvg = older.reduce((sum, s) => sum + (s[metric] as number), 0) / older.length;
  
  return ((recentAvg - olderAvg) / olderAvg) * 100;
}

function calculateVPIPImprovement(sessions: SessionStatistics[]): number {
  if (sessions.length < 2) return 0;
  
  const optimal = 23; // Optimal VPIP around 23%
  const recent = sessions.slice(-3);
  const older = sessions.slice(-6, -3);
  
  if (older.length === 0) return 0;
  
  const recentDeviation = recent.reduce((sum, s) => sum + Math.abs(s.vpip - optimal), 0) / recent.length;
  const olderDeviation = older.reduce((sum, s) => sum + Math.abs(s.vpip - optimal), 0) / older.length;
  
  return ((olderDeviation - recentDeviation) / olderDeviation) * 100;
}