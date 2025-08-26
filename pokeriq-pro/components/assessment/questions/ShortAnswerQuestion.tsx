/**
 * Short Answer Question Component
 * Renders text input questions for short answers
 */

'use client';

import React from 'react';
import { AssessmentQuestion } from '@/lib/types/dezhoumama';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle } from 'lucide-react';

interface ShortAnswerQuestionProps {
  question: AssessmentQuestion;
  answer?: string;
  onAnswerChange: (answer: string) => void;
  isPracticeMode?: boolean;
  showCorrectAnswer?: boolean;
  showExplanation?: boolean;
}

export default function ShortAnswerQuestion({
  question,
  answer = '',
  onAnswerChange,
  isPracticeMode = false,
  showCorrectAnswer = false,
  showExplanation = false
}: ShortAnswerQuestionProps) {
  const correctAnswers = Array.isArray(question.correctAnswer) 
    ? question.correctAnswer as string[]
    : [question.correctAnswer as string];

  const isCorrect = showCorrectAnswer && answer && correctAnswers.some(correct => 
    correct.toLowerCase().trim() === answer.toLowerCase().trim()
  );

  const normalizeAnswer = (ans: string) => ans.toLowerCase().trim().replace(/[^\w]/g, '');
  const isPartialMatch = showCorrectAnswer && answer && correctAnswers.some(correct =>
    normalizeAnswer(correct).includes(normalizeAnswer(answer)) || 
    normalizeAnswer(answer).includes(normalizeAnswer(correct))
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">
          Your Answer:
        </label>
        <Input
          type="text"
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          disabled={showCorrectAnswer}
          placeholder="Type your answer here..."
          className={`bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 ${
            showCorrectAnswer
              ? isCorrect
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-red-500/50 bg-red-500/10'
              : 'focus:border-blue-500/50'
          }`}
        />
      </div>

      {/* Character count */}
      <div className="text-xs text-slate-400 text-right">
        {answer.length} characters
      </div>

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
          isCorrect
            ? 'bg-green-500/10 border-green-500/20'
            : isPartialMatch
            ? 'bg-yellow-500/10 border-yellow-500/20'
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <div className="flex items-start space-x-3">
            {isCorrect ? (
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                isPartialMatch ? 'text-yellow-400' : 'text-red-400'
              }`} />
            )}
            <div className="space-y-2">
              <p className={`font-medium ${
                isCorrect 
                  ? 'text-green-300' 
                  : isPartialMatch 
                  ? 'text-yellow-300' 
                  : 'text-red-300'
              }`}>
                {isCorrect ? 'Correct!' : isPartialMatch ? 'Partially Correct' : 'Incorrect'}
              </p>
              
              <p className="text-slate-300 text-sm">
                <span className="font-medium">Your answer:</span> {answer}
              </p>
              
              {!isCorrect && (
                <div className="text-slate-300 text-sm">
                  <span className="font-medium">Acceptable answers:</span>
                  <ul className="list-disc list-inside mt-1 ml-2">
                    {correctAnswers.map((correct, index) => (
                      <li key={index} className="text-green-300">{correct}</li>
                    ))}
                  </ul>
                </div>
              )}

              {isPartialMatch && !isCorrect && (
                <p className="text-yellow-300 text-xs mt-2">
                  Your answer contains some correct elements but may not be complete or exactly match the expected format.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hints for difficult questions */}
      {question.difficulty === 'hard' && !answer && !showCorrectAnswer && (
        <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <p className="text-purple-300 text-sm">
            <span className="font-medium">💡 Hint:</span> This is a challenging question. 
            Think carefully about the key concepts and be as specific as possible in your answer.
          </p>
        </div>
      )}
    </div>
  );
}