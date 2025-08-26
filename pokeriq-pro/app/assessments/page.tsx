/**
 * Assessment Hub - Main assessments page
 * Shows available assessments and user progress
 */

import React from 'react';
import { Suspense } from 'react';
import { Metadata } from 'next';
import AssessmentList from '@/components/assessment/AssessmentList';
import AssessmentProgress from '@/components/assessment/AssessmentProgress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';

export const metadata: Metadata = {
  title: 'Assessments | PokerIQ Pro',
  description: 'Test your poker skills with comprehensive assessments',
};

export default function AssessmentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Skill Assessments
          </h1>
          <p className="text-slate-300 text-lg">
            Evaluate your poker knowledge and track your learning progress
          </p>
        </div>

        {/* Stats Overview */}
        <Suspense fallback={<Loading />}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-200 text-sm font-medium">
                  Assessments Taken
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">12</div>
                <div className="text-xs text-green-400 flex items-center mt-1">
                  <span className="mr-1">↗</span>
                  +2 this week
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-200 text-sm font-medium">
                  Average Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">87%</div>
                <div className="text-xs text-blue-400 flex items-center mt-1">
                  <span className="mr-1">↗</span>
                  +5% improvement
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-slate-200 text-sm font-medium">
                  Current Rank
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                    Gold
                  </Badge>
                  <div className="text-lg font-bold text-white">Level 4</div>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Advanced Player
                </div>
              </CardContent>
            </Card>
          </div>
        </Suspense>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Assessments */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Available Assessments</CardTitle>
                <p className="text-slate-400 text-sm">
                  Choose from various assessment types to test different skills
                </p>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Loading />}>
                  <AssessmentList />
                </Suspense>
              </CardContent>
            </Card>
          </div>

          {/* Progress Sidebar */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Loading />}>
                  <AssessmentProgress />
                </Suspense>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Quick Start</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02]">
                  Random Assessment
                </button>
                <button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-lg font-medium transition-colors border border-slate-600">
                  Practice Mode
                </button>
                <button className="w-full bg-transparent border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white py-3 px-4 rounded-lg font-medium transition-all duration-200">
                  View Results
                </button>
              </CardContent>
            </Card>

            {/* Achievement Showcase */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <span className="text-yellow-500 text-sm">🏆</span>
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">Perfect Score</div>
                      <div className="text-slate-400 text-xs">GTO Fundamentals</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="text-blue-500 text-sm">⚡</span>
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">Speed Demon</div>
                      <div className="text-slate-400 text-xs">Under 5 minutes</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <span className="text-green-500 text-sm">📚</span>
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">Consistent Learner</div>
                      <div className="text-slate-400 text-xs">7-day streak</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}