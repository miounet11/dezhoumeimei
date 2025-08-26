'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  CheckCircle, XCircle, AlertCircle, Clock, Play, Pause, RotateCcw,
  Trophy, Target, ArrowRight, ArrowLeft, BookOpen, Brain, Lightbulb,
  TrendingUp, Award, Star, Timer, RefreshCw, Eye, EyeOff, HelpCircle,
  ChevronDown, ChevronUp, BarChart3, PieChart, Zap
} from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('assessment-embed');

/**
 * Assessment Data Structures (matching Prisma schema)
 */
export interface AssessmentQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'scenario' | 'drag_drop';
  question: string;
  description?: string;
  points: number;
  timeLimit?: number; // seconds
  options?: {
    id: string;
    text: string;
    isCorrect?: boolean;
    explanation?: string;
    imageUrl?: string;
  }[];
  correctAnswer?: string | string[];
  explanation?: string;
  hints?: string[];
  metadata?: {
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
    estimatedTime: number;
    relatedConcepts: string[];
  };
}

export interface AssessmentConfig {
  id: string;
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
  scoringConfig: {
    passThreshold: number; // percentage
    maxAttempts: number;
    showCorrectAnswers: boolean;
    showExplanations: boolean;
    allowReview: boolean;
    timeLimit?: number; // total time in seconds
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // minutes
}

export interface AssessmentAttempt {
  id: string;
  userId: string;
  assessmentId: string;
  startedAt: Date;
  completedAt?: Date;
  timeSpent: number; // seconds
  score: number;
  maxScore: number;
  passed: boolean;
  answers: {
    questionId: string;
    answer: string | string[];
    isCorrect: boolean;
    timeSpent: number;
    points: number;
    maxPoints: number;
  }[];
  attempt: number;
}

interface AssessmentEmbedProps {
  assessment: AssessmentConfig;
  userId: string;
  courseId: string;
  sectionId?: string;
  onComplete?: (attempt: AssessmentAttempt) => void;
  onProgress?: (progress: number) => void;
  allowMultipleAttempts?: boolean;
  showProgress?: boolean;
  embedded?: boolean;
  className?: string;
}

/**
 * Question Component for different types
 */
interface QuestionProps {
  question: AssessmentQuestion;
  answer: string | string[] | null;
  onAnswerChange: (answer: string | string[]) => void;
  showCorrectAnswer?: boolean;
  showExplanation?: boolean;
  isReviewMode?: boolean;
  disabled?: boolean;
  timeRemaining?: number;
}

const QuestionRenderer: React.FC<QuestionProps> = ({
  question,
  answer,
  onAnswerChange,
  showCorrectAnswer,
  showExplanation,
  isReviewMode,
  disabled,
  timeRemaining
}) => {
  const [showHint, setShowHint] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);

  const isCorrect = useMemo(() => {
    if (!answer || !question.correctAnswer) return false;
    
    if (Array.isArray(question.correctAnswer)) {
      if (!Array.isArray(answer)) return false;
      return question.correctAnswer.length === answer.length && 
             question.correctAnswer.every(correct => answer.includes(correct));
    }
    
    return question.correctAnswer === answer;
  }, [answer, question.correctAnswer]);

  const renderMultipleChoice = () => (
    <div className="space-y-3">
      {question.options?.map((option) => {
        const isSelected = answer === option.id;
        const isCorrectOption = option.isCorrect;
        
        let optionClass = `
          p-4 border rounded-lg cursor-pointer transition-all
          ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50'}
        `;
        
        if (showCorrectAnswer) {
          if (isCorrectOption) {
            optionClass += ' border-green-500 bg-green-50 text-green-800';
          } else if (isSelected && !isCorrectOption) {
            optionClass += ' border-red-500 bg-red-50 text-red-800';
          } else {
            optionClass += ' border-gray-200';
          }
        } else {
          optionClass += isSelected 
            ? ' border-blue-500 bg-blue-50 text-blue-800' 
            : ' border-gray-200';
        }

        return (
          <div
            key={option.id}
            onClick={() => !disabled && onAnswerChange(option.id)}
            className={optionClass}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
                ${showCorrectAnswer && isCorrectOption ? 'border-green-500 bg-green-500' : ''}
                ${showCorrectAnswer && isSelected && !isCorrectOption ? 'border-red-500 bg-red-500' : ''}
              `}>
                {(isSelected || (showCorrectAnswer && isCorrectOption)) && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{option.text}</div>
                {showExplanation && option.explanation && (isSelected || isCorrectOption) && (
                  <div className="text-sm text-gray-600 mt-2">
                    {option.explanation}
                  </div>
                )}
              </div>
              {showCorrectAnswer && (
                <div className="flex-shrink-0">
                  {isCorrectOption ? (
                    <CheckCircle size={20} className="text-green-500" />
                  ) : isSelected && !isCorrectOption ? (
                    <XCircle size={20} className="text-red-500" />
                  ) : null}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTrueFalse = () => (
    <div className="space-y-3">
      {['true', 'false'].map((option) => {
        const isSelected = answer === option;
        const isCorrectOption = question.correctAnswer === option;
        
        let optionClass = `
          p-4 border rounded-lg cursor-pointer transition-all
          ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-gray-50'}
        `;
        
        if (showCorrectAnswer) {
          if (isCorrectOption) {
            optionClass += ' border-green-500 bg-green-50 text-green-800';
          } else if (isSelected && !isCorrectOption) {
            optionClass += ' border-red-500 bg-red-50 text-red-800';
          } else {
            optionClass += ' border-gray-200';
          }
        } else {
          optionClass += isSelected 
            ? ' border-blue-500 bg-blue-50 text-blue-800' 
            : ' border-gray-200';
        }

        return (
          <div
            key={option}
            onClick={() => !disabled && onAnswerChange(option)}
            className={optionClass}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">{option}</span>
              <div className="flex items-center gap-2">
                {showCorrectAnswer && (
                  isCorrectOption ? (
                    <CheckCircle size={20} className="text-green-500" />
                  ) : isSelected && !isCorrectOption ? (
                    <XCircle size={20} className="text-red-500" />
                  ) : null
                )}
                <div className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center
                  ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
                  ${showCorrectAnswer && isCorrectOption ? 'border-green-500 bg-green-500' : ''}
                `}>
                  {(isSelected || (showCorrectAnswer && isCorrectOption)) && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderShortAnswer = () => (
    <div className="space-y-3">
      <textarea
        value={typeof answer === 'string' ? answer : ''}
        onChange={(e) => onAnswerChange(e.target.value)}
        disabled={disabled}
        placeholder="Enter your answer..."
        className={`
          w-full p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${disabled ? 'cursor-not-allowed opacity-60 bg-gray-50' : ''}
          ${showCorrectAnswer && isCorrect ? 'border-green-500 bg-green-50' : ''}
          ${showCorrectAnswer && !isCorrect && answer ? 'border-red-500 bg-red-50' : ''}
        `}
        rows={4}
      />
      
      {showCorrectAnswer && question.correctAnswer && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb size={16} className="text-yellow-500 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900 mb-1">Sample Answer:</div>
              <div className="text-gray-700 text-sm">{question.correctAnswer}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderScenario = () => (
    <div className="space-y-4">
      {/* Scenario content would be rendered here */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Target size={20} className="text-blue-600 mt-0.5" />
          <div>
            <div className="font-medium text-blue-900 mb-2">Poker Scenario</div>
            <div className="text-blue-800 text-sm leading-relaxed">
              {question.description}
            </div>
          </div>
        </div>
      </div>
      
      {renderMultipleChoice()}
    </div>
  );

  return (
    <div className="question-container">
      {/* Question Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded">
              {question.points} point{question.points !== 1 ? 's' : ''}
            </span>
            {question.metadata?.difficulty && (
              <span className={`px-2 py-1 text-sm font-medium rounded ${
                question.metadata.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                question.metadata.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {question.metadata.difficulty}
              </span>
            )}
            {question.timeLimit && timeRemaining !== undefined && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Timer size={14} />
                <span>{Math.max(0, timeRemaining)}s</span>
              </div>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
            {question.question}
          </h3>
          {question.description && question.type !== 'scenario' && (
            <p className="text-gray-600 mt-2">{question.description}</p>
          )}
        </div>

        {/* Hints */}
        {question.hints && question.hints.length > 0 && !showCorrectAnswer && (
          <div className="ml-4">
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              <HelpCircle size={14} />
              Hint
            </button>
          </div>
        )}
      </div>

      {/* Hint Display */}
      {showHint && question.hints && question.hints.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb size={16} className="text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <div className="text-yellow-800 text-sm">
                {question.hints[currentHintIndex]}
              </div>
              {question.hints.length > 1 && (
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-yellow-600">
                    Hint {currentHintIndex + 1} of {question.hints.length}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentHintIndex(Math.max(0, currentHintIndex - 1))}
                      disabled={currentHintIndex === 0}
                      className="p-1 text-yellow-600 hover:bg-yellow-100 rounded disabled:opacity-50"
                    >
                      <ArrowLeft size={12} />
                    </button>
                    <button
                      onClick={() => setCurrentHintIndex(Math.min(question.hints!.length - 1, currentHintIndex + 1))}
                      disabled={currentHintIndex === question.hints.length - 1}
                      className="p-1 text-yellow-600 hover:bg-yellow-100 rounded disabled:opacity-50"
                    >
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Question Content */}
      <div className="mb-4">
        {question.type === 'multiple_choice' && renderMultipleChoice()}
        {question.type === 'true_false' && renderTrueFalse()}
        {question.type === 'short_answer' && renderShortAnswer()}
        {question.type === 'essay' && renderShortAnswer()}
        {question.type === 'scenario' && renderScenario()}
      </div>

      {/* Explanation */}
      {showExplanation && question.explanation && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Brain size={16} className="text-gray-600 mt-0.5" />
            <div>
              <div className="font-medium text-gray-900 mb-1">Explanation</div>
              <div className="text-gray-700 text-sm leading-relaxed">
                {question.explanation}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Answer Status */}
      {showCorrectAnswer && answer && (
        <div className={`mt-4 p-3 rounded-lg flex items-center gap-3 ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {isCorrect ? (
            <>
              <CheckCircle size={20} className="text-green-500" />
              <div className="text-green-800 font-medium">Correct!</div>
            </>
          ) : (
            <>
              <XCircle size={20} className="text-red-500" />
              <div className="text-red-800 font-medium">Incorrect</div>
            </>
          )}
          <div className="ml-auto text-sm text-gray-600">
            {isCorrect ? question.points : 0} / {question.points} points
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Assessment Results Component
 */
interface AssessmentResultsProps {
  attempt: AssessmentAttempt;
  assessment: AssessmentConfig;
  onRetry?: () => void;
  onReview?: () => void;
  onContinue?: () => void;
  canRetry: boolean;
}

const AssessmentResults: React.FC<AssessmentResultsProps> = ({
  attempt,
  assessment,
  onRetry,
  onReview,
  onContinue,
  canRetry
}) => {
  const percentage = Math.round((attempt.score / attempt.maxScore) * 100);
  const passed = attempt.passed;
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="assessment-results p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
          passed ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {passed ? (
            <Trophy size={32} className="text-green-600" />
          ) : (
            <XCircle size={32} className="text-red-600" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Assessment {passed ? 'Completed' : 'Results'}
        </h2>
        <p className="text-gray-600">
          {assessment.title}
        </p>
      </div>

      {/* Score */}
      <div className="text-center mb-6">
        <div className={`text-4xl font-bold mb-2 ${getScoreColor(percentage)}`}>
          {percentage}%
        </div>
        <div className="text-gray-600 mb-4">
          {attempt.score} out of {attempt.maxScore} points
        </div>
        
        {passed ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
            <CheckCircle size={16} />
            <span className="font-medium">Passed</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full">
            <XCircle size={16} />
            <span className="font-medium">Not Passed</span>
            <span className="text-sm">(Need {assessment.scoringConfig.passThreshold}%)</span>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {formatTime(attempt.timeSpent)}
          </div>
          <div className="text-sm text-gray-600">Time Spent</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {attempt.answers.filter(a => a.isCorrect).length}/{attempt.answers.length}
          </div>
          <div className="text-sm text-gray-600">Correct Answers</div>
        </div>
      </div>

      {/* Question Breakdown */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Question Breakdown</h3>
        <div className="space-y-2">
          {attempt.answers.map((answer, index) => {
            const question = assessment.questions.find(q => q.id === answer.questionId);
            if (!question) return null;

            return (
              <div key={answer.questionId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  {answer.isCorrect ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-red-500" />
                  )}
                  <span className="text-sm font-medium">Question {index + 1}</span>
                  <span className="text-sm text-gray-600 truncate max-w-xs">
                    {question.question}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {answer.points}/{answer.maxPoints} pts
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        {assessment.scoringConfig.allowReview && onReview && (
          <button
            onClick={onReview}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded transition-colors"
          >
            Review Answers
          </button>
        )}
        
        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Try Again
          </button>
        )}
        
        {onContinue && (
          <button
            onClick={onContinue}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Continue
          </button>
        )}
      </div>

      {/* Attempt Info */}
      <div className="text-center mt-4 text-sm text-gray-500">
        Attempt {attempt.attempt} of {assessment.scoringConfig.maxAttempts}
      </div>
    </div>
  );
};

/**
 * Main AssessmentEmbed Component
 */
export const AssessmentEmbed: React.FC<AssessmentEmbedProps> = ({
  assessment,
  userId,
  courseId,
  sectionId,
  onComplete,
  onProgress,
  allowMultipleAttempts = true,
  showProgress = true,
  embedded = true,
  className = ""
}) => {
  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string | string[] }>({});
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<AssessmentAttempt | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const totalQuestions = assessment.questions.length;
  const answeredQuestions = Object.keys(answers).length;
  const progress = (answeredQuestions / totalQuestions) * 100;

  // Timer effect
  useEffect(() => {
    if (!isStarted || isCompleted || !assessment.scoringConfig.timeLimit) return;

    const interval = setInterval(() => {
      if (startTime) {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        const remaining = Math.max(0, assessment.scoringConfig.timeLimit! - elapsed);
        setTimeRemaining(remaining);

        if (remaining === 0) {
          handleSubmit();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isStarted, isCompleted, startTime, assessment.scoringConfig.timeLimit]);

  // Progress tracking
  useEffect(() => {
    onProgress?.(progress);
  }, [progress, onProgress]);

  const startAssessment = useCallback(() => {
    setIsStarted(true);
    setStartTime(new Date());
    setIsCompleted(false);
    setIsReviewMode(false);
    setAnswers({});
    setCurrentQuestionIndex(0);
    
    if (assessment.scoringConfig.timeLimit) {
      setTimeRemaining(assessment.scoringConfig.timeLimit);
    }

    logger.info('Assessment started', {
      assessmentId: assessment.id,
      userId,
      attempt: attemptCount + 1
    });
  }, [assessment, userId, attemptCount]);

  const handleAnswerChange = useCallback((questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  }, []);

  const navigateToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(Math.max(0, Math.min(totalQuestions - 1, index)));
  }, [totalQuestions]);

  const calculateScore = useCallback((userAnswers: typeof answers) => {
    let totalScore = 0;
    let maxScore = 0;
    
    const scoredAnswers = assessment.questions.map(question => {
      const userAnswer = userAnswers[question.id];
      maxScore += question.points;
      
      let isCorrect = false;
      if (userAnswer && question.correctAnswer) {
        if (Array.isArray(question.correctAnswer)) {
          if (Array.isArray(userAnswer)) {
            isCorrect = question.correctAnswer.length === userAnswer.length && 
                       question.correctAnswer.every(correct => userAnswer.includes(correct));
          }
        } else {
          isCorrect = question.correctAnswer === userAnswer;
        }
      }
      
      const points = isCorrect ? question.points : 0;
      totalScore += points;
      
      return {
        questionId: question.id,
        answer: userAnswer || '',
        isCorrect,
        timeSpent: 0, // Would be tracked per question
        points,
        maxPoints: question.points
      };
    });

    return { totalScore, maxScore, scoredAnswers };
  }, [assessment.questions]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const endTime = new Date();
      const timeSpent = startTime ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) : 0;
      const { totalScore, maxScore, scoredAnswers } = calculateScore(answers);
      const percentage = (totalScore / maxScore) * 100;
      const passed = percentage >= assessment.scoringConfig.passThreshold;

      const attempt: AssessmentAttempt = {
        id: `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        assessmentId: assessment.id,
        startedAt: startTime!,
        completedAt: endTime,
        timeSpent,
        score: totalScore,
        maxScore,
        passed,
        answers: scoredAnswers,
        attempt: attemptCount + 1
      };

      setCurrentAttempt(attempt);
      setIsCompleted(true);
      setAttemptCount(prev => prev + 1);

      // Store attempt in localStorage (in real app, would sync to database)
      const attemptsKey = `assessment_attempts_${userId}_${assessment.id}`;
      const existingAttempts = JSON.parse(localStorage.getItem(attemptsKey) || '[]');
      existingAttempts.push(attempt);
      localStorage.setItem(attemptsKey, JSON.stringify(existingAttempts));

      onComplete?.(attempt);

      logger.info('Assessment completed', {
        assessmentId: assessment.id,
        userId,
        score: totalScore,
        maxScore,
        passed,
        attempt: attemptCount + 1
      });

    } catch (error) {
      logger.error('Failed to submit assessment', { error });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, startTime, answers, assessment, userId, attemptCount, calculateScore, onComplete]);

  const handleRetry = useCallback(() => {
    startAssessment();
  }, [startAssessment]);

  const enterReviewMode = useCallback(() => {
    setIsReviewMode(true);
    setCurrentQuestionIndex(0);
  }, []);

  const exitReviewMode = useCallback(() => {
    setIsReviewMode(false);
  }, []);

  const canRetry = allowMultipleAttempts && attemptCount < assessment.scoringConfig.maxAttempts;
  const allQuestionsAnswered = Object.keys(answers).length === assessment.questions.length;

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isCompleted && !isReviewMode && currentAttempt) {
    return (
      <AssessmentResults
        attempt={currentAttempt}
        assessment={assessment}
        onRetry={canRetry ? handleRetry : undefined}
        onReview={assessment.scoringConfig.allowReview ? enterReviewMode : undefined}
        onContinue={() => {}}
        canRetry={canRetry}
      />
    );
  }

  if (!isStarted) {
    return (
      <div className={`assessment-embed ${embedded ? 'border rounded-lg' : ''} ${className}`}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Brain size={32} className="text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {assessment.title}
          </h2>
          
          {assessment.description && (
            <p className="text-gray-600 mb-4">{assessment.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">{totalQuestions}</div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">
                {assessment.scoringConfig.timeLimit 
                  ? formatTime(assessment.scoringConfig.timeLimit)
                  : 'Unlimited'
                }
              </div>
              <div className="text-sm text-gray-600">Time Limit</div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <p>• Pass threshold: {assessment.scoringConfig.passThreshold}%</p>
            <p>• Maximum attempts: {assessment.scoringConfig.maxAttempts}</p>
            {attemptCount > 0 && (
              <p>• Previous attempts: {attemptCount}</p>
            )}
          </div>

          <button
            onClick={startAssessment}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <Play size={20} />
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`assessment-embed ${embedded ? 'border rounded-lg' : ''} ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{assessment.title}</h3>
            {isReviewMode && (
              <span className="text-sm text-blue-600">Review Mode</span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {timeRemaining !== null && !isReviewMode && (
              <div className={`flex items-center gap-1 text-sm font-medium ${
                timeRemaining < 300 ? 'text-red-600' : 'text-gray-600'
              }`}>
                <Timer size={16} />
                {formatTime(timeRemaining)}
              </div>
            )}
            
            {showProgress && (
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </div>
            )}
            
            {isReviewMode && (
              <button
                onClick={exitReviewMode}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                Exit Review
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 bg-blue-500 rounded-full transition-all"
                style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Progress</span>
              <span>{Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Question Content */}
      <div className="p-6">
        <QuestionRenderer
          question={currentQuestion}
          answer={answers[currentQuestion.id] || null}
          onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
          showCorrectAnswer={isReviewMode && assessment.scoringConfig.showCorrectAnswers}
          showExplanation={isReviewMode && assessment.scoringConfig.showExplanations}
          isReviewMode={isReviewMode}
          disabled={isReviewMode}
          timeRemaining={currentQuestion.timeLimit}
        />
      </div>

      {/* Navigation */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={16} />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {/* Question Navigation Dots */}
            <div className="flex gap-1">
              {assessment.questions.map((_, index) => {
                const isAnswered = answers[assessment.questions[index].id] !== undefined;
                const isCurrent = index === currentQuestionIndex;
                
                return (
                  <button
                    key={index}
                    onClick={() => navigateToQuestion(index)}
                    className={`w-8 h-8 rounded text-xs font-medium transition-colors ${
                      isCurrent 
                        ? 'bg-blue-600 text-white' 
                        : isAnswered 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentQuestionIndex === totalQuestions - 1 && !isReviewMode ? (
              <button
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered || isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                Submit Assessment
              </button>
            ) : (
              <button
                onClick={() => navigateToQuestion(currentQuestionIndex + 1)}
                disabled={currentQuestionIndex === totalQuestions - 1}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Answer Status */}
        <div className="mt-3 text-center text-sm text-gray-600">
          {answeredQuestions} of {totalQuestions} questions answered
          {!allQuestionsAnswered && (
            <span className="text-yellow-600 ml-2">
              • Please answer all questions before submitting
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentEmbed;