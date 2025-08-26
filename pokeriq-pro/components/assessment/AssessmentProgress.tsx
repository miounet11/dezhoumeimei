/**
 * Assessment Progress Component
 * Shows user's assessment progress and statistics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Award, Target } from 'lucide-react';
import Loading from '@/components/ui/Loading';

interface AssessmentProgressData {
  totalAssessments: number;
  completedAssessments: number;
  averageScore: number;
  totalTimeSpent: number;
  strongestSkills: string[];
  weakestSkills: string[];
  improvementTrend: number;
  recentPerformance: Array<{
    date: Date;
    score: number;
    assessmentTitle: string;
  }>;
}

export default function AssessmentProgress() {
  const [progressData, setProgressData] = useState<AssessmentProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/assessments/analytics?type=user');
      if (!response.ok) {
        throw new Error('Failed to fetch progress data');
      }
      
      const data = await response.json();
      setProgressData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress');
      console.error('Error fetching progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendIcon = (trend: number) => {
    return trend > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-400" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-400" />
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <Loading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="text-center text-red-400">
            <p>Unable to load progress data</p>
            <button 
              onClick={fetchProgressData}
              className="text-blue-400 hover:text-blue-300 text-sm mt-2"
            >
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progressData) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="text-center text-slate-400">
            <p>No assessment data available</p>
            <p className="text-sm mt-1">Take your first assessment to see progress</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const completionRate = progressData.totalAssessments > 0 
    ? (progressData.completedAssessments / progressData.totalAssessments) * 100 
    : 0;

  return (
    <div className="space-y-4">
      {/* Overall Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">Assessments Completed</span>
          <span className="text-slate-300">
            {progressData.completedAssessments}/{progressData.totalAssessments}
          </span>
        </div>
        
        <Progress value={completionRate} className="h-2" />
        
        <div className="text-xs text-slate-400 text-center">
          {completionRate.toFixed(0)}% Complete
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-slate-700/30 rounded-lg">
          <div className={`text-lg font-bold ${getScoreColor(progressData.averageScore)}`}>
            {progressData.averageScore.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400">Avg Score</div>
        </div>
        
        <div className="text-center p-3 bg-slate-700/30 rounded-lg">
          <div className="text-lg font-bold text-blue-400">
            {formatTime(progressData.totalTimeSpent)}
          </div>
          <div className="text-xs text-slate-400">Study Time</div>
        </div>
      </div>

      {/* Improvement Trend */}
      {progressData.improvementTrend !== 0 && (
        <div className="flex items-center gap-2 p-3 bg-slate-700/30 rounded-lg">
          {getTrendIcon(progressData.improvementTrend)}
          <div className="flex-1">
            <div className="text-sm text-white">
              {progressData.improvementTrend > 0 ? 'Improving' : 'Declining'}
            </div>
            <div className="text-xs text-slate-400">
              {Math.abs(progressData.improvementTrend).toFixed(1)}% trend
            </div>
          </div>
        </div>
      )}

      {/* Strongest Skills */}
      {progressData.strongestSkills.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <Award className="w-4 h-4" />
            <span>Strengths</span>
          </div>
          <div className="space-y-1">
            {progressData.strongestSkills.slice(0, 3).map((skill, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="mr-1 mb-1 bg-green-500/20 text-green-300 border-green-500/30 text-xs"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Areas for Improvement */}
      {progressData.weakestSkills.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-yellow-400">
            <Target className="w-4 h-4" />
            <span>Focus Areas</span>
          </div>
          <div className="space-y-1">
            {progressData.weakestSkills.slice(0, 3).map((skill, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="mr-1 mb-1 bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recent Performance */}
      {progressData.recentPerformance.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm text-slate-300">Recent Results</div>
          <div className="space-y-2">
            {progressData.recentPerformance.slice(0, 3).map((result, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="text-slate-400 truncate flex-1 mr-2">
                  {result.assessmentTitle}
                </div>
                <div className={`font-medium ${getScoreColor(result.score)}`}>
                  {result.score.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}