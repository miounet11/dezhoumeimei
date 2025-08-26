/**
 * Scenario Question Component
 * Renders complex scenario-based questions with contextual information
 */

'use client';

import React from 'react';
import { AssessmentQuestion } from '@/lib/types/dezhoumama';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Circle } from 'lucide-react';

interface ScenarioQuestionProps {
  question: AssessmentQuestion;
  answer?: any;
  onAnswerChange: (answer: any) => void;
  isPracticeMode?: boolean;
  showCorrectAnswer?: boolean;
  showExplanation?: boolean;
}

export default function ScenarioQuestion({
  question,
  answer,
  onAnswerChange,
  isPracticeMode = false,
  showCorrectAnswer = false,
  showExplanation = false
}: ScenarioQuestionProps) {
  // Extract scenario data from question (assuming it's structured)
  const scenarioData = typeof question.question === 'object' 
    ? question.question 
    : { description: question.question };

  // Handle different answer types for scenarios
  const isMultipleChoice = question.options && question.options.length > 0;
  const correctAnswer = question.correctAnswer;

  const handleAnswerChange = (newAnswer: any) => {
    onAnswerChange(newAnswer);
  };

  const getOptionStatus = (option: string) => {
    if (!showCorrectAnswer || !isMultipleChoice) return null;
    
    const isSelected = answer === option;
    const isCorrect = option === correctAnswer;
    
    if (isCorrect && isSelected) return 'correct-selected';
    if (isCorrect && !isSelected) return 'correct-unselected';
    if (!isCorrect && isSelected) return 'incorrect-selected';
    return null;
  };

  const getOptionIcon = (option: string) => {
    const status = getOptionStatus(option);
    
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

  const getOptionClasses = (option: string) => {
    const baseClasses = "flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer hover:bg-slate-700/30";
    const status = getOptionStatus(option);
    
    switch (status) {
      case 'correct-selected':
        return `${baseClasses} bg-green-500/20 border-green-500/40 text-green-100`;
      case 'correct-unselected':
        return `${baseClasses} bg-green-500/10 border-green-500/30 text-green-200`;
      case 'incorrect-selected':
        return `${baseClasses} bg-red-500/20 border-red-500/40 text-red-100`;
      default:
        const isSelected = answer === option;
        return isSelected
          ? `${baseClasses} bg-blue-500/20 border-blue-500/40 text-blue-100`
          : `${baseClasses} bg-slate-800/50 border-slate-600 text-slate-200`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Scenario Context */}
      <Card className="bg-slate-700/30 border-slate-600">
        <CardHeader>
          <CardTitle className="text-slate-200 text-lg flex items-center">
            <span className="mr-2">🎯</span>
            Scenario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-slate-300">
            {typeof scenarioData === 'object' ? (
              <div className="space-y-3">
                <p className="text-base leading-relaxed">
                  {scenarioData.description}
                </p>
                {scenarioData.context && (
                  <div className="p-3 bg-slate-800/50 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-slate-400">
                      <span className="font-medium text-blue-300">Context:</span> {scenarioData.context}
                    </p>
                  </div>
                )}
                {scenarioData.details && Array.isArray(scenarioData.details) && (
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {scenarioData.details.map((detail: string, index: number) => (
                      <li key={index} className="text-sm">{detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-base leading-relaxed">{scenarioData}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Answer Section */}
      <div className="space-y-4">
        <h3 className="text-slate-200 font-medium">Your Response:</h3>
        
        {isMultipleChoice ? (
          <RadioGroup
            value={answer || ''}
            onValueChange={handleAnswerChange}
            disabled={showCorrectAnswer}
            className="space-y-3"
          >
            {question.options!.map((option, index) => (
              <div key={index} className={getOptionClasses(option)}>
                <RadioGroupItem
                  value={option}
                  id={`scenario-option-${index}`}
                  className="text-white"
                />
                <Label
                  htmlFor={`scenario-option-${index}`}
                  className="flex-1 cursor-pointer font-medium"
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showCorrectAnswer && (
                      <div className="flex items-center ml-2">
                        {getOptionIcon(option)}
                      </div>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <Textarea
            value={answer || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            disabled={showCorrectAnswer}
            placeholder="Analyze the scenario and provide your detailed response..."
            className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 min-h-[120px]"
            rows={5}
          />
        )}
      </div>

      {/* Answer feedback for practice mode */}
      {isPracticeMode && answer && !showCorrectAnswer && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-300 text-sm">
            <span className="font-medium">Your response recorded</span>
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Continue to see analysis at the end.
          </p>
        </div>
      )}

      {/* Detailed feedback when showing correct answer */}
      {showCorrectAnswer && answer && (
        <div className={`mt-4 p-4 rounded-lg border ${
          (isMultipleChoice && answer === correctAnswer) || 
          (!isMultipleChoice && typeof correctAnswer === 'string' && 
           answer.toLowerCase().includes(correctAnswer.toLowerCase()))
            ? 'bg-green-500/10 border-green-500/20'
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <div className="flex items-start space-x-3">
            {((isMultipleChoice && answer === correctAnswer) || 
              (!isMultipleChoice && typeof correctAnswer === 'string' && 
               answer.toLowerCase().includes(correctAnswer.toLowerCase()))) ? (
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="space-y-2">
              <p className={`font-medium ${
                (isMultipleChoice && answer === correctAnswer) || 
                (!isMultipleChoice && typeof correctAnswer === 'string' && 
                 answer.toLowerCase().includes(correctAnswer.toLowerCase()))
                  ? 'text-green-300' 
                  : 'text-red-300'
              }`}>
                {(isMultipleChoice && answer === correctAnswer) || 
                 (!isMultipleChoice && typeof correctAnswer === 'string' && 
                  answer.toLowerCase().includes(correctAnswer.toLowerCase())) 
                  ? 'Good analysis!' 
                  : 'Consider these points'}
              </p>
              
              {isMultipleChoice && answer !== correctAnswer && (
                <p className="text-slate-300 text-sm">
                  <span className="font-medium">Correct choice:</span> {correctAnswer as string}
                </p>
              )}
              
              {!isMultipleChoice && (
                <div className="text-slate-300 text-sm">
                  <span className="font-medium">Key points to consider:</span>
                  <p className="mt-1 text-green-300">{correctAnswer as string}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}