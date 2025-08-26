/**
 * Assessment Taking Interface
 * Individual assessment page for taking quizzes
 */

import React from 'react';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AssessmentTaker from '@/components/assessment/AssessmentTaker';
import Loading from '@/components/ui/Loading';
import { getAssessmentById } from '@/lib/db/queries/assessments';

interface AssessmentPageProps {
  params: {
    id: string;
  };
  searchParams: {
    attempt?: string;
    practice?: string;
  };
}

export async function generateMetadata({ params }: AssessmentPageProps): Promise<Metadata> {
  const result = await getAssessmentById(params.id);
  
  if (!result.success || !result.data) {
    return {
      title: 'Assessment Not Found | PokerIQ Pro',
    };
  }

  return {
    title: `${result.data.title} | PokerIQ Pro`,
    description: result.data.description || 'Test your poker knowledge',
  };
}

export default async function AssessmentPage({ params, searchParams }: AssessmentPageProps) {
  const result = await getAssessmentById(params.id, true);
  
  if (!result.success || !result.data) {
    notFound();
  }

  const assessment = result.data;
  const isPracticeMode = searchParams.practice === 'true';
  const attemptNumber = searchParams.attempt ? parseInt(searchParams.attempt) : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Assessment Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                {assessment.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>Difficulty: {assessment.difficulty}</span>
                <span>•</span>
                <span>Pass threshold: {assessment.passThreshold}%</span>
                {assessment.timeLimitMinutes && (
                  <>
                    <span>•</span>
                    <span>Time limit: {assessment.timeLimitMinutes} minutes</span>
                  </>
                )}
                {isPracticeMode && (
                  <>
                    <span>•</span>
                    <span className="text-blue-400 font-medium">Practice Mode</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Assessment Status */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-slate-700 rounded-full text-xs text-slate-300">
                {JSON.parse(assessment.questions as string).length} Questions
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                assessment.isActive 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {assessment.isActive ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Content */}
      <div className="max-w-6xl mx-auto p-6">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <Loading />
          </div>
        }>
          <AssessmentTaker 
            assessment={assessment}
            isPracticeMode={isPracticeMode}
            attemptNumber={attemptNumber}
          />
        </Suspense>
      </div>
    </div>
  );
}