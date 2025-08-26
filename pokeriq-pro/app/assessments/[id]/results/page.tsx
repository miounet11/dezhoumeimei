/**
 * Assessment Results Page
 * Shows detailed results after completing an assessment
 */

import React from 'react';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AssessmentResults from '@/components/assessment/AssessmentResults';
import Loading from '@/components/ui/Loading';
import { getAssessmentById, getUserAssessmentAttempts } from '@/lib/db/queries/assessments';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface ResultsPageProps {
  params: {
    id: string;
  };
  searchParams: {
    attempt?: string;
    comparison?: string;
  };
}

export async function generateMetadata({ params }: ResultsPageProps): Promise<Metadata> {
  const result = await getAssessmentById(params.id);
  
  if (!result.success || !result.data) {
    return {
      title: 'Assessment Results Not Found | PokerIQ Pro',
    };
  }

  return {
    title: `Results: ${result.data.title} | PokerIQ Pro`,
    description: `View your results for ${result.data.title}`,
  };
}

export default async function ResultsPage({ params, searchParams }: ResultsPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    notFound();
  }

  const [assessmentResult, attemptsResult] = await Promise.all([
    getAssessmentById(params.id, true),
    getUserAssessmentAttempts(session.user.id, params.id)
  ]);
  
  if (!assessmentResult.success || !assessmentResult.data) {
    notFound();
  }

  if (!attemptsResult.success || !attemptsResult.data || attemptsResult.data.length === 0) {
    notFound();
  }

  const assessment = assessmentResult.data;
  const attempts = attemptsResult.data;
  const attemptIndex = searchParams.attempt ? parseInt(searchParams.attempt) - 1 : 0;
  const selectedAttempt = attempts[attemptIndex] || attempts[0];
  const showComparison = searchParams.comparison === 'true' && attempts.length > 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Results Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Assessment Results
              </h1>
              <h2 className="text-xl text-slate-300 mb-1">
                {assessment.title}
              </h2>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>Completed: {new Date(selectedAttempt.completedAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>Attempt {attemptIndex + 1} of {attempts.length}</span>
                <span>•</span>
                <span>Score: {((selectedAttempt.score / selectedAttempt.maxScore) * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Score Badge */}
            <div className="text-center">
              <div className={`text-4xl font-bold mb-1 ${
                (selectedAttempt.score / selectedAttempt.maxScore) * 100 >= assessment.passThreshold
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}>
                {((selectedAttempt.score / selectedAttempt.maxScore) * 100).toFixed(1)}%
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                (selectedAttempt.score / selectedAttempt.maxScore) * 100 >= assessment.passThreshold
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {(selectedAttempt.score / selectedAttempt.maxScore) * 100 >= assessment.passThreshold ? 'PASSED' : 'FAILED'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="max-w-6xl mx-auto p-6">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <Loading />
          </div>
        }>
          <AssessmentResults 
            assessment={assessment}
            userAssessment={selectedAttempt}
            allAttempts={attempts}
            currentAttemptIndex={attemptIndex}
            showComparison={showComparison}
          />
        </Suspense>
      </div>
    </div>
  );
}