/**
 * Assessment Scoring Business Logic for Dezhoumama Learning Platform
 * Implements sophisticated scoring algorithms with weighted scoring, skill analysis, and performance metrics
 */

import {
  Assessment,
  AssessmentQuestion,
  AssessmentAnswer,
  ScoringConfig,
  UserAssessment,
  SkillBreakdown,
  TestScore
} from '@/lib/types/dezhoumama';

// ========================================================================
// Scoring Result Types
// ========================================================================

export interface ScoringResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    accuracy: number;
    speed: number;
    difficulty: number;
  };
  bonuses: {
    perfectScore: number;
    speedBonus: number;
    total: number;
  };
  penalties: {
    wrongAnswer: number;
    timeOverage: number;
    total: number;
  };
  skillBreakdown: SkillBreakdown;
  recommendations: string[];
}

export interface QuestionAnalysis {
  questionId: string;
  isCorrect: boolean;
  points: number;
  maxPoints: number;
  timeTaken: number;
  difficultyWeight: number;
  skillAreas: string[];
  feedback: string;
}

export interface PerformanceMetrics {
  accuracy: number;
  averageTimePerQuestion: number;
  difficultyHandling: {
    easy: number;
    medium: number;
    hard: number;
  };
  skillStrengths: string[];
  skillWeaknesses: string[];
  overallRank: 'excellent' | 'good' | 'average' | 'needs-improvement' | 'poor';
}

// ========================================================================
// Core Scoring Engine
// ========================================================================

class AssessmentScoringEngine {
  /**
   * Calculate comprehensive assessment score using weighted algorithm
   */
  static calculateScore(
    assessment: Assessment,
    questions: AssessmentQuestion[],
    answers: AssessmentAnswer[],
    timeTaken?: number
  ): ScoringResult {
    const scoringConfig = this.parseScoringConfig(assessment.scoringConfig);
    const questionMap = new Map(questions.map(q => [q.id, q]));
    const answerMap = new Map(answers.map(a => [a.questionId, a]));

    // Analyze each question
    const questionAnalyses: QuestionAnalysis[] = [];
    let totalRawScore = 0;
    let totalMaxScore = 0;

    questions.forEach(question => {
      const answer = answerMap.get(question.id);
      const analysis = this.analyzeQuestion(question, answer);
      questionAnalyses.push(analysis);
      
      totalRawScore += analysis.points;
      totalMaxScore += analysis.maxPoints;
    });

    // Calculate component scores
    const accuracy = this.calculateAccuracyScore(questionAnalyses);
    const speed = this.calculateSpeedScore(questionAnalyses, assessment.timeLimitMinutes, timeTaken);
    const difficulty = this.calculateDifficultyScore(questionAnalyses);

    // Apply weightings
    const weightedScores = {
      accuracy: accuracy * scoringConfig.weightings.accuracy,
      speed: speed * scoringConfig.weightings.speed,
      difficulty: difficulty * scoringConfig.weightings.difficulty
    };

    // Calculate base score
    let baseScore = Object.values(weightedScores).reduce((sum, score) => sum + score, 0);
    
    // Apply bonuses
    const bonuses = this.calculateBonuses(
      scoringConfig,
      accuracy,
      speed,
      totalRawScore,
      totalMaxScore
    );

    // Apply penalties
    const penalties = this.calculatePenalties(
      scoringConfig,
      questionAnalyses,
      assessment.timeLimitMinutes,
      timeTaken
    );

    // Final score calculation
    const finalScore = Math.max(0, baseScore + bonuses.total - penalties.total);
    const percentage = totalMaxScore > 0 ? (finalScore / totalMaxScore) * 100 : 0;

    // Generate skill breakdown
    const skillBreakdown = this.generateSkillBreakdown(questionAnalyses);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      accuracy,
      speed,
      difficulty,
      skillBreakdown
    );

    return {
      totalScore: Math.round(finalScore * 100) / 100,
      maxScore: totalMaxScore,
      percentage: Math.round(percentage * 100) / 100,
      breakdown: {
        accuracy: Math.round(accuracy * 100) / 100,
        speed: Math.round(speed * 100) / 100,
        difficulty: Math.round(difficulty * 100) / 100
      },
      bonuses: {
        perfectScore: bonuses.perfectScore,
        speedBonus: bonuses.speedBonus,
        total: bonuses.total
      },
      penalties: {
        wrongAnswer: penalties.wrongAnswer,
        timeOverage: penalties.timeOverage,
        total: penalties.total
      },
      skillBreakdown,
      recommendations
    };
  }

  /**
   * Analyze individual question performance
   */
  private static analyzeQuestion(
    question: AssessmentQuestion,
    answer?: AssessmentAnswer
  ): QuestionAnalysis {
    if (!answer) {
      return {
        questionId: question.id,
        isCorrect: false,
        points: 0,
        maxPoints: question.points,
        timeTaken: 0,
        difficultyWeight: this.getDifficultyWeight(question.difficulty),
        skillAreas: question.tags || [],
        feedback: 'Question not answered'
      };
    }

    const isCorrect = this.evaluateAnswer(question, answer);
    const points = isCorrect ? question.points : 0;
    const timeTaken = answer.timeTaken || 0;

    let feedback = '';
    if (isCorrect) {
      feedback = timeTaken < 30 ? 'Excellent! Quick and accurate.' : 'Correct answer.';
    } else {
      feedback = this.generateIncorrectFeedback(question, answer);
    }

    return {
      questionId: question.id,
      isCorrect,
      points,
      maxPoints: question.points,
      timeTaken,
      difficultyWeight: this.getDifficultyWeight(question.difficulty),
      skillAreas: question.tags || [],
      feedback
    };
  }

  /**
   * Evaluate if an answer is correct based on question type
   */
  private static evaluateAnswer(question: AssessmentQuestion, answer: AssessmentAnswer): boolean {
    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        return String(question.correctAnswer).toLowerCase() === 
               String(answer.answer).toLowerCase();

      case 'short-answer':
        return this.evaluateShortAnswer(question.correctAnswer, answer.answer);

      case 'essay':
        // Essay questions require manual grading - use provided isCorrect
        return answer.isCorrect;

      case 'scenario':
        return this.evaluateScenarioAnswer(question.correctAnswer, answer.answer);

      default:
        return answer.isCorrect;
    }
  }

  private static evaluateShortAnswer(correctAnswer: any, userAnswer: any): boolean {
    const normalize = (str: string) => str.toLowerCase().trim().replace(/[^\w]/g, '');
    
    if (Array.isArray(correctAnswer)) {
      return correctAnswer.some(correct => 
        normalize(String(correct)) === normalize(String(userAnswer))
      );
    }
    
    return normalize(String(correctAnswer)) === normalize(String(userAnswer));
  }

  private static evaluateScenarioAnswer(correctAnswer: any, userAnswer: any): boolean {
    // Scenario answers can be complex objects or strings
    if (typeof correctAnswer === 'string' && typeof userAnswer === 'string') {
      return this.evaluateShortAnswer(correctAnswer, userAnswer);
    }
    
    if (typeof correctAnswer === 'object' && typeof userAnswer === 'object') {
      // Deep comparison for scenario objects
      return JSON.stringify(correctAnswer) === JSON.stringify(userAnswer);
    }
    
    return false;
  }

  /**
   * Calculate accuracy component score
   */
  private static calculateAccuracyScore(analyses: QuestionAnalysis[]): number {
    if (analyses.length === 0) return 0;

    const correctAnswers = analyses.filter(a => a.isCorrect).length;
    return (correctAnswers / analyses.length) * 100;
  }

  /**
   * Calculate speed component score
   */
  private static calculateSpeedScore(
    analyses: QuestionAnalysis[],
    timeLimitMinutes?: number,
    actualTimeTaken?: number
  ): number {
    if (!timeLimitMinutes || !actualTimeTaken) {
      // No time data - use average time per question as baseline
      const avgTimePerQuestion = analyses.reduce((sum, a) => sum + a.timeTaken, 0) / analyses.length;
      const expectedTime = 120; // 2 minutes per question baseline
      
      if (avgTimePerQuestion <= expectedTime * 0.5) return 100; // Very fast
      if (avgTimePerQuestion <= expectedTime) return 90;       // Good speed
      if (avgTimePerQuestion <= expectedTime * 1.5) return 70; // Average speed
      if (avgTimePerQuestion <= expectedTime * 2) return 50;   // Slow
      return 30; // Very slow
    }

    const timeLimitSeconds = timeLimitMinutes * 60;
    const actualTimeSeconds = actualTimeTaken * 60;

    if (actualTimeSeconds <= timeLimitSeconds * 0.5) return 100; // Finished in half time
    if (actualTimeSeconds <= timeLimitSeconds * 0.75) return 95; // Finished in 3/4 time
    if (actualTimeSeconds <= timeLimitSeconds) return 85;        // Within time limit
    if (actualTimeSeconds <= timeLimitSeconds * 1.1) return 70;  // Slightly over
    if (actualTimeSeconds <= timeLimitSeconds * 1.25) return 50; // Moderately over
    return 25; // Significantly over time
  }

  /**
   * Calculate difficulty handling score
   */
  private static calculateDifficultyScore(analyses: QuestionAnalysis[]): number {
    const difficultyScores = {
      easy: { correct: 0, total: 0, weight: 1.0 },
      medium: { correct: 0, total: 0, weight: 1.2 },
      hard: { correct: 0, total: 0, weight: 1.5 }
    };

    analyses.forEach(analysis => {
      const difficulty = this.getDifficultyFromWeight(analysis.difficultyWeight);
      difficultyScores[difficulty].total++;
      if (analysis.isCorrect) {
        difficultyScores[difficulty].correct++;
      }
    });

    let weightedScore = 0;
    let totalWeight = 0;

    Object.values(difficultyScores).forEach(({ correct, total, weight }) => {
      if (total > 0) {
        const accuracy = correct / total;
        weightedScore += accuracy * weight * total;
        totalWeight += weight * total;
      }
    });

    return totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
  }

  /**
   * Calculate bonus points
   */
  private static calculateBonuses(
    config: ScoringConfig,
    accuracy: number,
    speed: number,
    rawScore: number,
    maxScore: number
  ): { perfectScore: number; speedBonus: number; total: number } {
    let perfectScore = 0;
    let speedBonus = 0;

    // Perfect score bonus
    if (rawScore === maxScore && accuracy === 100) {
      perfectScore = maxScore * config.bonuses.perfectScore;
    }

    // Speed bonus (for high accuracy with good speed)
    if (accuracy >= 90 && speed >= 85) {
      const speedMultiplier = Math.min(speed / 85, 1.5); // Cap at 1.5x
      speedBonus = maxScore * config.bonuses.speedBonus * speedMultiplier;
    }

    return {
      perfectScore: Math.round(perfectScore * 100) / 100,
      speedBonus: Math.round(speedBonus * 100) / 100,
      total: Math.round((perfectScore + speedBonus) * 100) / 100
    };
  }

  /**
   * Calculate penalty deductions
   */
  private static calculatePenalties(
    config: ScoringConfig,
    analyses: QuestionAnalysis[],
    timeLimitMinutes?: number,
    actualTimeTaken?: number
  ): { wrongAnswer: number; timeOverage: number; total: number } {
    let wrongAnswer = 0;
    let timeOverage = 0;

    // Wrong answer penalties
    const incorrectAnswers = analyses.filter(a => !a.isCorrect);
    incorrectAnswers.forEach(analysis => {
      wrongAnswer += analysis.maxPoints * config.penalties.wrongAnswer;
    });

    // Time overage penalties
    if (timeLimitMinutes && actualTimeTaken && actualTimeTaken > timeLimitMinutes) {
      const overageMinutes = actualTimeTaken - timeLimitMinutes;
      const maxScore = analyses.reduce((sum, a) => sum + a.maxPoints, 0);
      timeOverage = maxScore * config.penalties.timeOverage * (overageMinutes / timeLimitMinutes);
    }

    return {
      wrongAnswer: Math.round(wrongAnswer * 100) / 100,
      timeOverage: Math.round(timeOverage * 100) / 100,
      total: Math.round((wrongAnswer + timeOverage) * 100) / 100
    };
  }

  /**
   * Generate skill breakdown analysis
   */
  private static generateSkillBreakdown(analyses: QuestionAnalysis[]): SkillBreakdown {
    const skillMap = new Map<string, { correct: number; total: number; points: number; maxPoints: number }>();

    analyses.forEach(analysis => {
      analysis.skillAreas.forEach(skill => {
        if (!skillMap.has(skill)) {
          skillMap.set(skill, { correct: 0, total: 0, points: 0, maxPoints: 0 });
        }
        
        const skillData = skillMap.get(skill)!;
        skillData.total++;
        skillData.maxPoints += analysis.maxPoints;
        
        if (analysis.isCorrect) {
          skillData.correct++;
          skillData.points += analysis.points;
        }
      });
    });

    const breakdown: SkillBreakdown = {};

    skillMap.forEach((data, skill) => {
      const percentage = data.total > 0 ? (data.correct / data.total) * 100 : 0;
      breakdown[skill] = {
        score: data.points,
        maxScore: data.maxPoints,
        percentage: Math.round(percentage * 100) / 100
      };
    });

    return breakdown;
  }

  /**
   * Generate performance recommendations
   */
  private static generateRecommendations(
    accuracy: number,
    speed: number,
    difficulty: number,
    skillBreakdown: SkillBreakdown
  ): string[] {
    const recommendations: string[] = [];

    // Accuracy recommendations
    if (accuracy < 70) {
      recommendations.push('Focus on understanding core concepts before attempting assessments');
      recommendations.push('Review course materials and practice more exercises');
    } else if (accuracy < 85) {
      recommendations.push('Good progress! Review questions you got wrong to improve accuracy');
    } else if (accuracy >= 95) {
      recommendations.push('Excellent accuracy! Consider challenging yourself with advanced topics');
    }

    // Speed recommendations
    if (speed < 50) {
      recommendations.push('Take time to practice questions to improve your response speed');
      recommendations.push('Consider using timed practice sessions to build confidence');
    } else if (speed < 70) {
      recommendations.push('Work on time management strategies during assessments');
    } else if (speed >= 90) {
      recommendations.push('Great time management! You completed the assessment efficiently');
    }

    // Difficulty handling recommendations
    if (difficulty < 60) {
      recommendations.push('Start with easier concepts and gradually work up to more challenging material');
      recommendations.push('Seek additional help with difficult concepts');
    } else if (difficulty >= 85) {
      recommendations.push('You handle challenging questions well - ready for advanced material');
    }

    // Skill-specific recommendations
    const weakSkills = Object.entries(skillBreakdown)
      .filter(([_, data]) => data.percentage < 60)
      .sort((a, b) => a[1].percentage - b[1].percentage)
      .slice(0, 2);

    weakSkills.forEach(([skill, data]) => {
      recommendations.push(`Focus on improving ${skill} skills (current: ${data.percentage}%)`);
    });

    const strongSkills = Object.entries(skillBreakdown)
      .filter(([_, data]) => data.percentage >= 90)
      .slice(0, 2);

    strongSkills.forEach(([skill, _]) => {
      recommendations.push(`Excellent mastery of ${skill} - consider mentoring others`);
    });

    return recommendations.slice(0, 6); // Limit to 6 recommendations
  }

  /**
   * Helper methods
   */
  private static parseScoringConfig(config: any): ScoringConfig {
    if (typeof config === 'string') {
      return JSON.parse(config);
    }
    return config as ScoringConfig;
  }

  private static getDifficultyWeight(difficulty: string): number {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 1.0;
      case 'medium': return 1.2;
      case 'hard': return 1.5;
      default: return 1.0;
    }
  }

  private static getDifficultyFromWeight(weight: number): 'easy' | 'medium' | 'hard' {
    if (weight <= 1.0) return 'easy';
    if (weight <= 1.2) return 'medium';
    return 'hard';
  }

  private static generateIncorrectFeedback(
    question: AssessmentQuestion,
    answer: AssessmentAnswer
  ): string {
    switch (question.type) {
      case 'multiple-choice':
        return `Incorrect. The correct answer was: ${question.correctAnswer}`;
      
      case 'true-false':
        return `Incorrect. The statement was ${question.correctAnswer}`;
      
      case 'short-answer':
        if (Array.isArray(question.correctAnswer)) {
          return `Incorrect. Acceptable answers include: ${question.correctAnswer.join(', ')}`;
        }
        return `Incorrect. The correct answer was: ${question.correctAnswer}`;
      
      default:
        return 'Incorrect answer. Please review the explanation.';
    }
  }
}

// ========================================================================
// Performance Analysis Engine
// ========================================================================

class PerformanceAnalyzer {
  /**
   * Analyze user performance across multiple assessments
   */
  static analyzePerformance(
    userAssessments: UserAssessment[],
    assessments: Assessment[],
    questions: AssessmentQuestion[]
  ): PerformanceMetrics {
    if (userAssessments.length === 0) {
      return this.getEmptyMetrics();
    }

    const assessmentMap = new Map(assessments.map(a => [a.id, a]));
    const questionMap = new Map(questions.map(q => [q.id, q]));

    // Calculate overall accuracy
    const accuracy = userAssessments.reduce((sum, ua) => sum + (ua.score / ua.maxScore), 0) / userAssessments.length * 100;

    // Calculate average time per question
    const totalQuestions = userAssessments.length * 10; // Assuming average 10 questions per assessment
    const totalTime = userAssessments.reduce((sum, ua) => sum + (ua.timeTaken || 0), 0);
    const averageTimePerQuestion = totalQuestions > 0 ? totalTime / totalQuestions : 0;

    // Analyze difficulty handling
    const difficultyHandling = this.analyzeDifficultyHandling(userAssessments, assessmentMap, questionMap);

    // Analyze skill strengths and weaknesses
    const { skillStrengths, skillWeaknesses } = this.analyzeSkillPerformance(userAssessments);

    // Determine overall rank
    const overallRank = this.determineOverallRank(accuracy, averageTimePerQuestion, difficultyHandling);

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      averageTimePerQuestion: Math.round(averageTimePerQuestion * 100) / 100,
      difficultyHandling,
      skillStrengths,
      skillWeaknesses,
      overallRank
    };
  }

  private static getEmptyMetrics(): PerformanceMetrics {
    return {
      accuracy: 0,
      averageTimePerQuestion: 0,
      difficultyHandling: { easy: 0, medium: 0, hard: 0 },
      skillStrengths: [],
      skillWeaknesses: [],
      overallRank: 'poor'
    };
  }

  private static analyzeDifficultyHandling(
    userAssessments: UserAssessment[],
    assessmentMap: Map<string, Assessment>,
    questionMap: Map<string, AssessmentQuestion>
  ): { easy: number; medium: number; hard: number } {
    const difficultyStats = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 }
    };

    userAssessments.forEach(ua => {
      const assessment = assessmentMap.get(ua.assessmentId);
      if (!assessment) return;

      const answers = this.parseAnswers(ua.answers);
      answers.forEach(answer => {
        const question = questionMap.get(answer.questionId);
        if (!question) return;

        const difficulty = question.difficulty as keyof typeof difficultyStats;
        if (difficultyStats[difficulty]) {
          difficultyStats[difficulty].total++;
          if (answer.isCorrect) {
            difficultyStats[difficulty].correct++;
          }
        }
      });
    });

    return {
      easy: difficultyStats.easy.total > 0 ? 
            (difficultyStats.easy.correct / difficultyStats.easy.total) * 100 : 0,
      medium: difficultyStats.medium.total > 0 ? 
              (difficultyStats.medium.correct / difficultyStats.medium.total) * 100 : 0,
      hard: difficultyStats.hard.total > 0 ? 
            (difficultyStats.hard.correct / difficultyStats.hard.total) * 100 : 0
    };
  }

  private static analyzeSkillPerformance(
    userAssessments: UserAssessment[]
  ): { skillStrengths: string[]; skillWeaknesses: string[] } {
    const skillMap = new Map<string, { correct: number; total: number }>();

    userAssessments.forEach(ua => {
      const skillBreakdown = this.parseSkillBreakdown(ua.skillBreakdown);
      if (skillBreakdown) {
        Object.entries(skillBreakdown).forEach(([skill, data]) => {
          if (!skillMap.has(skill)) {
            skillMap.set(skill, { correct: 0, total: 0 });
          }
          const skillData = skillMap.get(skill)!;
          skillData.total += data.maxScore;
          skillData.correct += data.score;
        });
      }
    });

    const skillPerformances = Array.from(skillMap.entries())
      .map(([skill, data]) => ({
        skill,
        percentage: data.total > 0 ? (data.correct / data.total) * 100 : 0
      }))
      .sort((a, b) => b.percentage - a.percentage);

    const skillStrengths = skillPerformances
      .filter(sp => sp.percentage >= 80)
      .slice(0, 3)
      .map(sp => sp.skill);

    const skillWeaknesses = skillPerformances
      .filter(sp => sp.percentage < 60)
      .slice(-3)
      .reverse()
      .map(sp => sp.skill);

    return { skillStrengths, skillWeaknesses };
  }

  private static determineOverallRank(
    accuracy: number,
    averageTimePerQuestion: number,
    difficultyHandling: { easy: number; medium: number; hard: number }
  ): 'excellent' | 'good' | 'average' | 'needs-improvement' | 'poor' {
    const avgDifficultyScore = (difficultyHandling.easy + difficultyHandling.medium + difficultyHandling.hard) / 3;
    const timeScore = averageTimePerQuestion < 60 ? 100 : Math.max(0, 100 - (averageTimePerQuestion - 60));

    const overallScore = (accuracy * 0.5) + (avgDifficultyScore * 0.3) + (timeScore * 0.2);

    if (overallScore >= 90) return 'excellent';
    if (overallScore >= 80) return 'good';
    if (overallScore >= 70) return 'average';
    if (overallScore >= 60) return 'needs-improvement';
    return 'poor';
  }

  private static parseAnswers(answers: any): AssessmentAnswer[] {
    if (!answers) return [];
    if (Array.isArray(answers)) return answers;
    
    try {
      const parsed = typeof answers === 'string' ? JSON.parse(answers) : answers;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private static parseSkillBreakdown(skillBreakdown: any): SkillBreakdown | null {
    if (!skillBreakdown) return null;
    if (typeof skillBreakdown === 'object') return skillBreakdown;
    
    try {
      return typeof skillBreakdown === 'string' ? JSON.parse(skillBreakdown) : null;
    } catch {
      return null;
    }
  }
}

// ========================================================================
// Adaptive Scoring System
// ========================================================================

class AdaptiveScoring {
  /**
   * Adjust scoring based on user's historical performance
   */
  static adjustScoringForUser(
    baseConfig: ScoringConfig,
    userPerformanceHistory: PerformanceMetrics
  ): ScoringConfig {
    const adjustedConfig = { ...baseConfig };

    // Adjust weightings based on user strengths/weaknesses
    if (userPerformanceHistory.accuracy < 70) {
      // For struggling users, emphasize accuracy over speed
      adjustedConfig.weightings.accuracy = Math.min(0.7, baseConfig.weightings.accuracy + 0.1);
      adjustedConfig.weightings.speed = Math.max(0.1, baseConfig.weightings.speed - 0.05);
    } else if (userPerformanceHistory.accuracy > 90) {
      // For high performers, increase speed importance
      adjustedConfig.weightings.speed = Math.min(0.4, baseConfig.weightings.speed + 0.1);
      adjustedConfig.weightings.accuracy = Math.max(0.4, baseConfig.weightings.accuracy - 0.05);
    }

    // Adjust penalties based on performance level
    if (userPerformanceHistory.overallRank === 'excellent' || userPerformanceHistory.overallRank === 'good') {
      // Reduce penalties for good performers
      adjustedConfig.penalties.wrongAnswer *= 0.8;
      adjustedConfig.penalties.timeOverage *= 0.8;
    } else if (userPerformanceHistory.overallRank === 'needs-improvement' || userPerformanceHistory.overallRank === 'poor') {
      // Increase bonuses for struggling users to encourage progress
      adjustedConfig.bonuses.perfectScore *= 1.2;
      adjustedConfig.bonuses.speedBonus *= 1.1;
    }

    return adjustedConfig;
  }

  /**
   * Calculate dynamic pass threshold based on question difficulty distribution
   */
  static calculateDynamicPassThreshold(
    questions: AssessmentQuestion[],
    baseThreshold: number = 70
  ): number {
    if (questions.length === 0) return baseThreshold;

    const difficultyDistribution = {
      easy: questions.filter(q => q.difficulty === 'easy').length,
      medium: questions.filter(q => q.difficulty === 'medium').length,
      hard: questions.filter(q => q.difficulty === 'hard').length
    };

    const totalQuestions = questions.length;
    const difficultyScore = 
      (difficultyDistribution.easy * 1.0 +
       difficultyDistribution.medium * 1.2 +
       difficultyDistribution.hard * 1.5) / totalQuestions;

    // Adjust threshold based on difficulty
    let adjustedThreshold = baseThreshold;

    if (difficultyScore > 1.3) {
      // Harder assessment - lower threshold
      adjustedThreshold = Math.max(60, baseThreshold - 5);
    } else if (difficultyScore < 1.1) {
      // Easier assessment - higher threshold
      adjustedThreshold = Math.min(85, baseThreshold + 5);
    }

    return Math.round(adjustedThreshold);
  }
}

// ========================================================================
// Export all scoring classes
// ========================================================================

export {
  AssessmentScoringEngine,
  PerformanceAnalyzer,
  AdaptiveScoring
};