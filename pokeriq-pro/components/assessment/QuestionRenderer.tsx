/**
 * Question Renderer Component
 * Renders different types of assessment questions
 */

'use client';

import React from 'react';
import { AssessmentQuestion } from '@/lib/types/dezhoumama';
import MultipleChoiceQuestion from './questions/MultipleChoiceQuestion';
import TrueFalseQuestion from './questions/TrueFalseQuestion';
import ShortAnswerQuestion from './questions/ShortAnswerQuestion';
import EssayQuestion from './questions/EssayQuestion';
import ScenarioQuestion from './questions/ScenarioQuestion';

interface QuestionRendererProps {
  question: AssessmentQuestion;
  answer?: any;
  onAnswerChange: (answer: any) => void;
  isPracticeMode?: boolean;
  showCorrectAnswer?: boolean;
  showExplanation?: boolean;
}

export default function QuestionRenderer({
  question,
  answer,
  onAnswerChange,
  isPracticeMode = false,
  showCorrectAnswer = false,
  showExplanation = false
}: QuestionRendererProps) {
  const renderQuestion = () => {
    const commonProps = {
      question,
      answer,
      onAnswerChange,
      isPracticeMode,
      showCorrectAnswer,
      showExplanation
    };

    switch (question.type) {
      case 'multiple-choice':
        return <MultipleChoiceQuestion {...commonProps} />;
      
      case 'true-false':
        return <TrueFalseQuestion {...commonProps} />;
      
      case 'short-answer':
        return <ShortAnswerQuestion {...commonProps} />;
      
      case 'essay':
        return <EssayQuestion {...commonProps} />;
      
      case 'scenario':
        return <ScenarioQuestion {...commonProps} />;
      
      default:
        return (
          <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h3 className="font-medium mb-2">Unsupported Question Type</h3>
            <p className="text-sm">
              Question type "{question.type}" is not supported by this renderer.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderQuestion()}
      
      {/* Explanation (shown after answer in practice mode or when explicitly requested) */}
      {question.explanation && (showExplanation || (isPracticeMode && answer)) && (
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <h4 className="text-blue-300 font-medium mb-2 flex items-center">
            <span className="mr-2">💡</span>
            Explanation
          </h4>
          <p className="text-slate-300 text-sm leading-relaxed">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  );
}