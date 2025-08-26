/**
 * True/False Question Component
 * Renders true/false questions with toggle selection
 */

'use client';

import React from 'react';
import { AssessmentQuestion } from '@/lib/types/dezhoumama';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Circle } from 'lucide-react';

interface TrueFalseQuestionProps {
  question: AssessmentQuestion;
  answer?: string;
  onAnswerChange: (answer: string) => void;
  isPracticeMode?: boolean;
  showCorrectAnswer?: boolean;
  showExplanation?: boolean;
}

export default function TrueFalseQuestion({
  question,
  answer,
  onAnswerChange,
  isPracticeMode = false,
  showCorrectAnswer = false,
  showExplanation = false
}: TrueFalseQuestionProps) {
  const correctAnswer = (question.correctAnswer as string).toLowerCase();
  const options = [
    { value: 'true', label: 'True' },
    { value: 'false', label: 'False' }
  ];
  
  const getOptionStatus = (optionValue: string) => {
    if (!showCorrectAnswer) return null;
    
    const isSelected = answer?.toLowerCase() === optionValue;
    const isCorrect = optionValue === correctAnswer;
    
    if (isCorrect && isSelected) return 'correct-selected';
    if (isCorrect && !isSelected) return 'correct-unselected';
    if (!isCorrect && isSelected) return 'incorrect-selected';
    return null;
  };

  const getOptionIcon = (optionValue: string) => {
    const status = getOptionStatus(optionValue);
    
    switch (status) {
      case 'correct-selected':
      case 'correct-unselected':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'incorrect-selected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Circle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getOptionClasses = (optionValue: string) => {
    const baseClasses = "flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer hover:bg-slate-700/30";
    const status = getOptionStatus(optionValue);
    
    switch (status) {
      case 'correct-selected':
        return `${baseClasses} bg-green-500/20 border-green-500/40 text-green-100`;
      case 'correct-unselected':
        return `${baseClasses} bg-green-500/10 border-green-500/30 text-green-200`;
      case 'incorrect-selected':
        return `${baseClasses} bg-red-500/20 border-red-500/40 text-red-100`;
      default:
        const isSelected = answer?.toLowerCase() === optionValue;
        return isSelected
          ? `${baseClasses} bg-blue-500/20 border-blue-500/40 text-blue-100`
          : `${baseClasses} bg-slate-800/50 border-slate-600 text-slate-200`;
    }
  };

  return (
    <div className="space-y-4">
      <RadioGroup
        value={answer?.toLowerCase() || ''}
        onValueChange={(value) => onAnswerChange(value.charAt(0).toUpperCase() + value.slice(1))}
        disabled={showCorrectAnswer}
        className="grid grid-cols-1 gap-4"
      >
        {options.map((option) => (
          <div key={option.value} className={getOptionClasses(option.value)}>
            <div className="flex items-center space-x-3">
              <RadioGroupItem
                value={option.value}
                id={`tf-option-${option.value}`}
                className="text-white"
              />
              <Label
                htmlFor={`tf-option-${option.value}`}
                className="text-lg font-medium cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
            {showCorrectAnswer && (
              <div className="flex items-center">
                {getOptionIcon(option.value)}
              </div>
            )}
          </div>
        ))}
      </RadioGroup>

      {/* Answer feedback for practice mode */}
      {isPracticeMode && answer && !showCorrectAnswer && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-300 text-sm">
            <span className="font-medium">Your answer:</span> {answer}
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Answer recorded. Continue to see results at the end.
          </p>
        </div>
      )}

      {/* Detailed feedback when showing correct answer */}
      {showCorrectAnswer && answer && (
        <div className={`mt-4 p-4 rounded-lg border ${
          answer.toLowerCase() === correctAnswer
            ? 'bg-green-500/10 border-green-500/20'
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <div className="flex items-start space-x-3">
            {answer.toLowerCase() === correctAnswer ? (
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="space-y-2">
              <p className={`font-medium ${
                answer.toLowerCase() === correctAnswer ? 'text-green-300' : 'text-red-300'
              }`}>
                {answer.toLowerCase() === correctAnswer ? 'Correct!' : 'Incorrect'}
              </p>
              {answer.toLowerCase() !== correctAnswer && (
                <p className="text-slate-300 text-sm">
                  <span className="font-medium">Correct answer:</span> {correctAnswer.charAt(0).toUpperCase() + correctAnswer.slice(1)}
                </p>
              )}
              <p className="text-slate-300 text-sm">
                <span className="font-medium">Your answer:</span> {answer}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}