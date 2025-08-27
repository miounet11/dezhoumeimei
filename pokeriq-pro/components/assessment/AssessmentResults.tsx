'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/Badge';

interface AssessmentResultsProps {
  results: {
    id: string;
    assessmentId: string;
    userId: string;
    score: number;
    maxScore: number;
    completedAt: Date;
    timeSpent: number;
    questionResults: Array<{
      questionId: string;
      isCorrect: boolean;
      userAnswer: string;
      correctAnswer: string;
      points: number;
      maxPoints: number;
    }>;
  };
  assessment: {
    id: string;
    title: string;
    description: string;
    totalQuestions: number;
    passingScore: number;
  };
  onRetake?: () => void;
  onContinue?: () => void;
}

export function AssessmentResults({
  results,
  assessment,
  onRetake,
  onContinue
}: AssessmentResultsProps) {
  const percentage = (results.score / results.maxScore) * 100;
  const isPassed = percentage >= assessment.passingScore;
  const correctAnswers = results.questionResults.filter(q => q.isCorrect).length;
  const timeInMinutes = Math.round(results.timeSpent / 60);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">优秀</Badge>;
    if (score >= 80) return <Badge className="bg-blue-100 text-blue-800">良好</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">及格</Badge>;
    return <Badge className="bg-red-100 text-red-800">不及格</Badge>;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 总体成绩 */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">评估结果</CardTitle>
          <CardDescription>{assessment.title}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 分数显示 */}
          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(percentage)}`}>
              {Math.round(percentage)}%
            </div>
            <div className="text-gray-600 mt-2">
              {results.score} / {results.maxScore} 分
            </div>
            <div className="mt-2">
              {getScoreBadge(percentage)}
            </div>
          </div>

          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>完成进度</span>
              <span>{percentage.toFixed(1)}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
              <div className="text-sm text-gray-600">正确题目</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {assessment.totalQuestions - correctAnswers}
              </div>
              <div className="text-sm text-gray-600">错误题目</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{timeInMinutes}</div>
              <div className="text-sm text-gray-600">用时(分钟)</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {assessment.passingScore}%
              </div>
              <div className="text-sm text-gray-600">及格线</div>
            </div>
          </div>

          {/* 通过状态 */}
          <div className={`text-center p-4 rounded-lg ${
            isPassed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="text-lg font-semibold">
              {isPassed ? '🎉 恭喜通过！' : '😔 未达到及格线'}
            </div>
            <div className="text-sm mt-1">
              {isPassed 
                ? '您已成功完成本次评估，可以继续学习下一部分内容。'
                : `需要达到 ${assessment.passingScore}% 才能通过，建议重新学习相关内容后再次尝试。`
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 详细答题情况 */}
      <Card>
        <CardHeader>
          <CardTitle>答题详情</CardTitle>
          <CardDescription>查看每道题的答题情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.questionResults.map((question, index) => (
              <div 
                key={question.questionId}
                className={`p-4 rounded-lg border ${
                  question.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">第 {index + 1} 题</span>
                      {question.isCorrect ? (
                        <Badge className="bg-green-100 text-green-800">正确</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">错误</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>您的答案: <span className="font-medium">{question.userAnswer}</span></div>
                      {!question.isCorrect && (
                        <div>正确答案: <span className="font-medium text-green-600">{question.correctAnswer}</span></div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${question.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                      {question.points} / {question.maxPoints}
                    </div>
                    <div className="text-xs text-gray-500">分</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex gap-4 justify-center">
        {!isPassed && onRetake && (
          <Button onClick={onRetake} variant="outline" size="lg">
            重新测试
          </Button>
        )}
        {isPassed && onContinue && (
          <Button onClick={onContinue} size="lg">
            继续学习
          </Button>
        )}
        <Button variant="ghost" size="lg" onClick={() => window.history.back()}>
          返回课程
        </Button>
      </div>
    </div>
  );
}

export default AssessmentResults;