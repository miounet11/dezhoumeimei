/**
 * Assessment Navigation Component
 * Provides navigation controls for assessment questions
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AssessmentAnswer } from '@/lib/types/dezhoumama';

interface AssessmentNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  answers: AssessmentAnswer[];
  onGoToQuestion: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export default function AssessmentNavigation({
  currentIndex,
  totalQuestions,
  answers,
  onGoToQuestion,
  onPrevious,
  onNext
}: AssessmentNavigationProps) {
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < totalQuestions - 1;

  return (
    <div className="flex items-center gap-4">
      {/* Previous Button */}
      <Button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        variant="outline"
        className="flex items-center gap-2 bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-300 disabled:opacity-50"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      {/* Question Numbers (for smaller assessments) */}
      {totalQuestions <= 10 && (
        <div className="flex items-center gap-2">
          {Array.from({ length: totalQuestions }, (_, index) => {
            const isAnswered = answers.some(a => {
              // This would need the question ID to be properly implemented
              return true; // Simplified for now
            });
            const isCurrent = index === currentIndex;
            
            return (
              <button
                key={index}
                onClick={() => onGoToQuestion(index)}
                className={`w-8 h-8 rounded text-sm font-medium transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : isAnswered
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      )}

      {/* Next Button */}
      <Button
        onClick={onNext}
        disabled={!canGoNext}
        variant="outline"
        className="flex items-center gap-2 bg-slate-800 border-slate-600 hover:bg-slate-700 text-slate-300 disabled:opacity-50"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}