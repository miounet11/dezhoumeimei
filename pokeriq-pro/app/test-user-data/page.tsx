'use client';

import React from 'react';
import { useUserData } from '../../lib/hooks/useUserData';
import AppLayout from '@/src/components/layout/AppLayout';

export default function TestUserDataPage() {
  const { userData, loading, error } = useUserData();

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8">Loading user data...</div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-8 text-red-600">Error: {error}</div>
      </AppLayout>
    );
  }

  if (!userData) {
    return (
      <AppLayout>
        <div className="p-8">No user data found</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">User Data Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-3">Profile</h2>
          <p><strong>Name:</strong> {userData.profile.displayName}</p>
          <p><strong>ID:</strong> {userData.profile.id}</p>
          <p><strong>Username:</strong> {userData.profile.username}</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-3">Stats</h2>
          <p><strong>Level:</strong> {userData.stats.level}</p>
          <p><strong>XP:</strong> {userData.stats.currentXP}/{userData.stats.nextLevelXP}</p>
          <p><strong>Total XP:</strong> {userData.stats.totalXP}</p>
          <p><strong>Daily Streak:</strong> {userData.stats.dailyStreak}</p>
          <p><strong>Today XP:</strong> +{userData.stats.todayXP}</p>
          <p><strong>Games Played:</strong> {userData.stats.gamesPlayed}</p>
          <p><strong>Win Rate:</strong> {(userData.stats.winRate * 100).toFixed(1)}%</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-3">Daily Tasks</h2>
          {userData.dailyTasks.map(task => (
            <div key={task.id} className="mb-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">{task.title}</span>
                <span className="text-xs text-gray-500">
                  {task.type === 'accuracy' ? `${task.current}%` : `${task.current}/${task.target}`}
                  {task.completed && ' ✅'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(task.current / task.target) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-3">Learning Progress</h2>
          {userData.learningChapters.map(chapter => (
            <div key={chapter.id} className="mb-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">{chapter.title}</span>
                <span className="text-xs text-gray-500">
                  {chapter.progress}% {chapter.completed && '✅'} {chapter.isNew && 'NEW'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${chapter.progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg p-6 shadow md:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Friends Leaderboard</h2>
          <div className="space-y-2">
            {userData.friends.map(friend => (
              <div key={friend.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">#{friend.rank}</span>
                  <span className="text-xl">{friend.avatar}</span>
                  <div>
                    <p className="text-sm font-medium">{friend.name}</p>
                    <p className="text-xs text-gray-500">{friend.xp} XP</p>
                  </div>
                </div>
                {friend.isOnline && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}