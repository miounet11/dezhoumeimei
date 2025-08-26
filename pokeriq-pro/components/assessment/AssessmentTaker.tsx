/**
 * Assessment Taker Component
 * Main component for taking assessments with real-time feedback
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Assessment, AssessmentQuestion, AssessmentAnswer } from '@/lib/types/dezhoumama';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import QuestionRenderer from './QuestionRenderer';
import AssessmentTimer from './AssessmentTimer';
import ProgressIndicator from './ProgressIndicator';
import AssessmentNavigation from './AssessmentNavigation';
import ConfirmSubmissionDialog from './ConfirmSubmissionDialog';
import Loading from '@/components/ui/Loading';
import { toast } from 'sonner';

interface AssessmentTakerProps {
  assessment: Assessment;
  isPracticeMode?: boolean;
  attemptNumber?: number;
}

export default function AssessmentTaker({ 
  assessment, 
  isPracticeMode = false,
  attemptNumber 
}: AssessmentTakerProps) {
  const router = useRouter();
  
  // Parse questions from assessment
  const questions = useMemo(() => 
    JSON.parse(assessment.questions as string) as AssessmentQuestion[], 
    [assessment.questions]
  );

  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [questionStartTimes, setQuestionStartTimes] = useState<Record<number, number>>({});
  const [assessmentStartTime] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    assessment.timeLimitMinutes ? assessment.timeLimitMinutes * 60 : null
  );

  // Initialize question start time
  useEffect(() => {
    setQuestionStartTimes(prev => ({
      ...prev,
      [currentQuestionIndex]: Date.now()
    }));
  }, [currentQuestionIndex]);

  // Timer countdown effect
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (!prev || prev <= 1) {
          // Auto-submit when time runs out
          handleSubmitAssessment(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Handle answer change
  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const questionIndex = questions.findIndex(q => q.id === questionId);
    const timeTaken = Math.floor((Date.now() - (questionStartTimes[questionIndex] || Date.now())) / 1000);

    const assessmentAnswer: AssessmentAnswer = {
      questionId,
      answer,
      isCorrect: false, // Will be calculated on server
      points: 0, // Will be calculated on server
      timeTaken
    };

    setAnswers(prev => {
      const existingIndex = prev.findIndex(a => a.questionId === questionId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = assessmentAnswer;
        return updated;
      }
      return [...prev, assessmentAnswer];
    });
  }, [questions, questionStartTimes]);

  // Navigation helpers
  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  }, [questions.length]);

  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Check if all questions are answered
  const isCompleted = useMemo(() => {
    return answers.length === questions.length;
  }, [answers.length, questions.length]);

  // Calculate progress
  const progress = useMemo(() => {
    return Math.round((answers.length / questions.length) * 100);
  }, [answers.length, questions.length]);

  // Handle assessment submission
  const handleSubmitAssessment = async (forceSubmit = false) => {
    if (!forceSubmit && !isCompleted) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    if (!forceSubmit) {
      setShowConfirmDialog(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const totalTimeTaken = Math.floor((Date.now() - assessmentStartTime) / 1000);

      const submissionData = {
        answers,
        timeTaken: totalTimeTaken,
        isPracticeMode
      };

      const response = await fetch(`/api/assessments/${assessment.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit assessment');
      }

      const result = await response.json();

      if (isPracticeMode) {
        // Show immediate results for practice mode
        toast.success('Assessment completed! Review your answers below.');
        // You could show a results modal or navigate to a practice results view
      } else {
        // Navigate to results page for real assessments
        toast.success('Assessment submitted successfully!');
        router.push(`/assessments/${assessment.id}/results?attempt=${attemptNumber || 1}`);
      }
    } catch (error) {
      console.error('Assessment submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit assessment');
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);

  if (!currentQuestion) {
    return <Loading />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Assessment Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Question {currentQuestionIndex + 1} of {questions.length}
          </h2>
          <div className="flex items-center gap-4 mt-1">
            <Badge variant="outline" className="bg-slate-700 text-slate-300">
              {currentQuestion.difficulty}
            </Badge>
            <Badge variant="outline" className="bg-blue-500/20 text-blue-300">
              {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
            </Badge>
            {isPracticeMode && (
              <Badge variant="outline" className="bg-green-500/20 text-green-300">
                Practice Mode
              </Badge>
            )}
          </div>
        </div>

        {/* Timer */}
        {timeRemaining !== null && (
          <AssessmentTimer 
            timeRemaining={timeRemaining}
            totalTime={assessment.timeLimitMinutes ? assessment.timeLimitMinutes * 60 : 0}
          />
        )}
      </div>

      {/* Progress Indicator */}
      <ProgressIndicator
        current={currentQuestionIndex + 1}
        total={questions.length}
        answered={answers.length}
        progress={progress}
      />

      {/* Main Question Card */}
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-lg">
            {currentQuestion.question}
          </CardTitle>
          {currentQuestion.tags && currentQuestion.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {currentQuestion.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs bg-purple-500/20 text-purple-300">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <QuestionRenderer
            question={currentQuestion}
            answer={currentAnswer?.answer}
            onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
            isPracticeMode={isPracticeMode}
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <AssessmentNavigation
          currentIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          answers={answers}
          onGoToQuestion={goToQuestion}
          onPrevious={goToPreviousQuestion}
          onNext={goToNextQuestion}
        />

        {/* Submit Button */}
        <div className="flex gap-3">
          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={() => handleSubmitAssessment(false)}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6"
            >
              {isSubmitting ? (
                <>
                  <Loading className="w-4 h-4 mr-2" />
                  Submitting...
                </>
              ) : (
                `Submit ${isPracticeMode ? 'Practice' : 'Assessment'}`
              )}
            </Button>
          ) : (
            <Button
              onClick={goToNextQuestion}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6"
            >
              Next Question →
            </Button>
          )}
        </div>
      </div>

      {/* Question Overview (for larger assessments) */}
      {questions.length > 10 && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white text-sm">Question Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-10 gap-2">
              {questions.map((_, index) => {
                const isAnswered = answers.some(a => a.questionId === questions[index].id);
                const isCurrent = index === currentQuestionIndex;
                
                return (
                  <button
                    key={index}
                    onClick={() => goToQuestion(index)}
                    className={`w-8 h-8 rounded text-xs font-medium transition-all ${
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
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <ConfirmSubmissionDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => handleSubmitAssessment(true)}
        isSubmitting={isSubmitting}
        answeredQuestions={answers.length}
        totalQuestions={questions.length}
        isPracticeMode={isPracticeMode}
      />
    </div>
  );
}