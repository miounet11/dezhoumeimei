/**
 * Essay Question Component
 * Renders textarea for longer text responses
 */

'use client';

import React from 'react';
import { AssessmentQuestion } from '@/lib/types/dezhoumama';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/Badge';

interface EssayQuestionProps {
  question: AssessmentQuestion;
  answer?: string;
  onAnswerChange: (answer: string) => void;
  isPracticeMode?: boolean;
  showCorrectAnswer?: boolean;
  showExplanation?: boolean;
}

export default function EssayQuestion({
  question,
  answer = '',
  onAnswerChange,
  isPracticeMode = false,
  showCorrectAnswer = false,
  showExplanation = false
}: EssayQuestionProps) {
  const minWords = 50;
  const maxWords = 500;
  const wordCount = answer.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-300">
            Your Response:
          </label>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`text-xs ${
                wordCount < minWords 
                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                  : wordCount > maxWords
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                  : 'bg-green-500/20 text-green-300 border-green-500/30'
              }`}
            >
              {wordCount}/{maxWords} words
            </Badge>
          </div>
        </div>
        <Textarea
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          disabled={showCorrectAnswer}
          placeholder="Write your detailed response here..."
          className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[150px] resize-y"
          rows={6}
        />
      </div>

      {/* Word count guidance */}
      <div className="text-xs text-slate-400 space-y-1">
        <div className="flex justify-between">
          <span>Minimum: {minWords} words</span>
          <span>Maximum: {maxWords} words</span>
        </div>
        {wordCount < minWords && (
          <p className="text-red-400">
            Please write at least {minWords - wordCount} more words for a complete response.
          </p>
        )}
        {wordCount > maxWords && (
          <p className="text-yellow-400">
            Your response exceeds the maximum length. Please trim by {wordCount - maxWords} words.
          </p>
        )}
      </div>

      {/* Answer feedback for practice mode */}
      {isPracticeMode && answer && !showCorrectAnswer && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-300 text-sm">
            <span className="font-medium">Response recorded:</span> {wordCount} words
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Essay responses require manual review. Results will be available after instructor evaluation.
          </p>
        </div>
      )}

      {/* Sample response when showing correct answer */}
      {showCorrectAnswer && question.correctAnswer && (
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <h4 className="text-green-300 font-medium mb-2">Sample Response:</h4>
          <p className="text-slate-300 text-sm leading-relaxed">
            {question.correctAnswer as string}
          </p>
          {answer && (
            <div className="mt-3 pt-3 border-t border-green-500/20">
              <h5 className="text-green-300 font-medium mb-1">Your Response:</h5>
              <p className="text-slate-300 text-sm leading-relaxed">
                {answer}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Writing tips */}
      {!answer && !showCorrectAnswer && (
        <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <h4 className="text-purple-300 font-medium mb-2">💡 Writing Tips:</h4>
          <ul className="text-purple-200 text-sm space-y-1">
            <li>• Structure your response with clear introduction, body, and conclusion</li>
            <li>• Use specific examples to support your points</li>
            <li>• Stay focused on the question being asked</li>
            <li>• Proofread for clarity and conciseness</li>
          </ul>
        </div>
      )}
    </div>
  );
}