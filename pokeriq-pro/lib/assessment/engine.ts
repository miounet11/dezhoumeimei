/**
 * Assessment Engine
 * Core engine for assessment management, adaptive testing, and personalized feedback
 */

import {
  Assessment,
  AssessmentQuestion,
  AssessmentAnswer,
  ScoringConfig,
  SkillBreakdown,
  UserAssessment
} from '@/lib/types/dezhoumama';
import { 
  ScoringResult,
  PerformanceMetrics,
  AssessmentScoringEngine,
  PerformanceAnalyzer
} from '@/lib/business/assessment-scoring';
import { getUserAssessmentAnalytics } from '@/lib/db/queries/assessments';
import { createLogger } from '@/lib/logger';

const logger = createLogger('assessment-engine');

// ========================================================================
// Assessment Engine Interface Types
// ========================================================================

export interface AdaptiveFeedback {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  nextSteps: string[];
  studyPlan: StudyPlanItem[];
}

export interface StudyPlanItem {
  topic: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // minutes
  resources: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface PersonalizedQuestion {
  question: AssessmentQuestion;
  adaptedDifficulty: string;
  reasoning: string;
  skillFocus: string[];
}

export interface AssessmentRecommendation {
  type: 'retake' | 'practice' | 'study' | 'advance';
  title: string;
  description: string;
  priority: number;
  estimatedBenefit: string;
  actionUrl?: string;
}

// ========================================================================
// Main Assessment Engine Class
// ========================================================================

export class AssessmentEngine {
  /**
   * Generate adaptive feedback based on assessment results and user history
   */
  static async generateAdaptiveFeedback(
    scoringResult: ScoringResult,
    questions: AssessmentQuestion[],
    answers: AssessmentAnswer[],
    userId: string
  ): Promise<AdaptiveFeedback> {
    try {
      // Get user's historical performance
      const analyticsResult = await getUserAssessmentAnalytics(userId);
      const analytics = analyticsResult.success ? analyticsResult.data : null;

      // Analyze current performance
      const strengths = this.identifyStrengths(scoringResult, questions, answers);
      const weaknesses = this.identifyWeaknesses(scoringResult, questions, answers);
      
      // Generate personalized recommendations
      const recommendations = this.generatePersonalizedRecommendations(
        scoringResult,
        strengths,
        weaknesses,
        analytics
      );

      // Create next steps
      const nextSteps = this.generateNextSteps(scoringResult, weaknesses, analytics);

      // Build study plan
      const studyPlan = this.createStudyPlan(weaknesses, scoringResult.skillBreakdown, analytics);

      return {
        strengths,
        weaknesses,
        recommendations,
        nextSteps,
        studyPlan
      };
    } catch (error) {
      logger.error('Error generating adaptive feedback', { error, userId });
      
      // Fallback feedback
      return {
        strengths: ['Completed the assessment'],
        weaknesses: ['Review areas where you scored below average'],
        recommendations: ['Continue practicing to improve your skills'],
        nextSteps: ['Take more assessments to track progress'],
        studyPlan: []
      };
    }
  }

  /**
   * Get next recommended actions for a user after assessment
   */
  static async getNextRecommendations(
    userId: string,
    assessment: Assessment,
    scoringResult: ScoringResult
  ): Promise<AssessmentRecommendation[]> {
    try {
      const recommendations: AssessmentRecommendation[] = [];
      const percentage = scoringResult.percentage;
      const passThreshold = assessment.passThreshold;

      // Performance-based recommendations
      if (percentage < passThreshold) {
        if (percentage < passThreshold * 0.7) {
          // Far from passing
          recommendations.push({
            type: 'study',
            title: 'Intensive Study Recommended',
            description: `Your score of ${percentage.toFixed(1)}% indicates you need more preparation. Focus on fundamental concepts before retaking.`,
            priority: 1,
            estimatedBenefit: 'High - Address knowledge gaps',
            actionUrl: `/courses?related=${assessment.courseId}`
          });
        }

        recommendations.push({
          type: 'retake',
          title: 'Retake Assessment',
          description: `You can improve your score. You have ${assessment.maxAttempts - 1} more attempts remaining.`,
          priority: 2,
          estimatedBenefit: 'Medium - Improve certification score'
        });
      } else {
        // Passed - suggest advancement
        recommendations.push({
          type: 'advance',
          title: 'Advanced Topics',
          description: `Great job! With ${percentage.toFixed(1)}%, you're ready for more challenging material.`,
          priority: 1,
          estimatedBenefit: 'High - Accelerate learning',
          actionUrl: `/courses?level=advanced&prerequisite=${assessment.courseId}`
        });
      }

      // Skill-specific recommendations
      const weakSkills = Object.entries(scoringResult.skillBreakdown)
        .filter(([_, data]) => data.percentage < 70)
        .sort(([,a], [,b]) => a.percentage - b.percentage)
        .slice(0, 2);

      weakSkills.forEach(([skill, data]) => {
        recommendations.push({
          type: 'practice',
          title: `Practice ${skill}`,
          description: `Your ${skill} score (${data.percentage.toFixed(1)}%) could use improvement.`,
          priority: 3,
          estimatedBenefit: 'Medium - Strengthen weak areas',
          actionUrl: `/practice?skill=${encodeURIComponent(skill)}`
        });
      });

      // Speed-based recommendations
      if (scoringResult.breakdown.speed < 70) {
        recommendations.push({
          type: 'practice',
          title: 'Speed Training',
          description: 'Practice timed exercises to improve your response speed and confidence.',
          priority: 4,
          estimatedBenefit: 'Medium - Build fluency'
        });
      }

      return recommendations.sort((a, b) => a.priority - b.priority);
    } catch (error) {
      logger.error('Error generating recommendations', { error, userId });
      return [];
    }
  }

  /**
   * Create adaptive question selection based on user performance
   */
  static async selectAdaptiveQuestions(
    userId: string,
    questionPool: AssessmentQuestion[],
    targetDifficulty: string = 'medium',
    skillFocus?: string[]
  ): Promise<PersonalizedQuestion[]> {
    try {
      // Get user performance history
      const analyticsResult = await getUserAssessmentAnalytics(userId);
      const analytics = analyticsResult.success ? analyticsResult.data : null;

      const adaptedQuestions: PersonalizedQuestion[] = [];

      // Filter questions by skill focus if specified
      let filteredQuestions = skillFocus 
        ? questionPool.filter(q => 
            q.tags && skillFocus.some(skill => 
              q.tags!.some(tag => tag.toLowerCase().includes(skill.toLowerCase()))
            )
          )
        : questionPool;

      // If no skill-focused questions found, use all questions
      if (filteredQuestions.length === 0) {
        filteredQuestions = questionPool;
      }

      // Adaptive difficulty adjustment
      for (const question of filteredQuestions.slice(0, 20)) {
        let adaptedDifficulty = question.difficulty;
        let reasoning = 'Standard difficulty level';

        if (analytics) {
          // Adjust based on user's historical performance
          const userStrengths = analytics.skillStrengths || [];
          const userWeaknesses = analytics.skillWeaknesses || [];
          
          const questionSkills = question.tags || [];
          const hasStrengthOverlap = questionSkills.some(tag => 
            userStrengths.some(strength => 
              tag.toLowerCase().includes(strength.toLowerCase())
            )
          );
          
          const hasWeaknessOverlap = questionSkills.some(tag => 
            userWeaknesses.some(weakness => 
              tag.toLowerCase().includes(weakness.toLowerCase())
            )
          );

          if (hasWeaknessOverlap && question.difficulty === 'hard') {
            adaptedDifficulty = 'medium';
            reasoning = 'Reduced difficulty due to identified weakness in this skill area';
          } else if (hasStrengthOverlap && question.difficulty === 'easy') {
            adaptedDifficulty = 'medium';
            reasoning = 'Increased difficulty based on demonstrated strength';
          } else if (analytics.averageScore > 85 && question.difficulty !== 'hard') {
            adaptedDifficulty = 'hard';
            reasoning = 'Increased difficulty for high-performing user';
          }
        }

        adaptedQuestions.push({
          question: {
            ...question,
            difficulty: adaptedDifficulty as any
          },
          adaptedDifficulty,
          reasoning,
          skillFocus: question.tags || []
        });
      }

      return adaptedQuestions;
    } catch (error) {
      logger.error('Error selecting adaptive questions', { error, userId });
      
      // Fallback to original questions
      return questionPool.slice(0, 20).map(question => ({
        question,
        adaptedDifficulty: question.difficulty,
        reasoning: 'Standard question selection',
        skillFocus: question.tags || []
      }));
    }
  }

  /**
   * Calculate dynamic pass threshold based on user's performance history
   */
  static calculateDynamicPassThreshold(
    baseThreshold: number,
    userPerformanceHistory: PerformanceMetrics,
    assessmentDifficulty: string
  ): number {
    let adjustedThreshold = baseThreshold;

    // Adjust based on user's average performance
    const userAverage = userPerformanceHistory.accuracy;
    
    if (userAverage > 85) {
      // High performer - slightly increase threshold
      adjustedThreshold = Math.min(100, baseThreshold + 5);
    } else if (userAverage < 60) {
      // Struggling user - slightly decrease threshold
      adjustedThreshold = Math.max(50, baseThreshold - 5);
    }

    // Adjust based on assessment difficulty
    switch (assessmentDifficulty.toLowerCase()) {
      case 'hard':
      case 'expert':
        adjustedThreshold = Math.max(50, adjustedThreshold - 10);
        break;
      case 'easy':
      case 'beginner':
        adjustedThreshold = Math.min(90, adjustedThreshold + 5);
        break;
    }

    return Math.round(adjustedThreshold);
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  private static identifyStrengths(
    scoringResult: ScoringResult,
    questions: AssessmentQuestion[],
    answers: AssessmentAnswer[]
  ): string[] {
    const strengths: string[] = [];

    // High overall score
    if (scoringResult.percentage >= 90) {
      strengths.push('Excellent overall performance');
    } else if (scoringResult.percentage >= 80) {
      strengths.push('Strong understanding of the material');
    }

    // Speed strength
    if (scoringResult.breakdown.speed >= 85) {
      strengths.push('Fast and confident responses');
    }

    // Accuracy strength
    if (scoringResult.breakdown.accuracy >= 90) {
      strengths.push('High accuracy in answers');
    }

    // Skill-specific strengths
    Object.entries(scoringResult.skillBreakdown).forEach(([skill, data]) => {
      if (data.percentage >= 85) {
        strengths.push(`Strong ${skill} skills`);
      }
    });

    // Difficulty handling
    const hardQuestions = questions.filter(q => q.difficulty === 'hard');
    const hardAnswers = answers.filter(a => 
      hardQuestions.some(q => q.id === a.questionId && a.isCorrect)
    );
    
    if (hardAnswers.length > 0 && hardAnswers.length / hardQuestions.length >= 0.7) {
      strengths.push('Handles challenging questions well');
    }

    return strengths.length > 0 ? strengths : ['Completed the assessment'];
  }

  private static identifyWeaknesses(
    scoringResult: ScoringResult,
    questions: AssessmentQuestion[],
    answers: AssessmentAnswer[]
  ): string[] {
    const weaknesses: string[] = [];

    // Overall performance issues
    if (scoringResult.percentage < 60) {
      weaknesses.push('Fundamental concepts need reinforcement');
    }

    // Speed issues
    if (scoringResult.breakdown.speed < 60) {
      weaknesses.push('Consider more practice to improve response time');
    }

    // Accuracy issues
    if (scoringResult.breakdown.accuracy < 70) {
      weaknesses.push('Focus on accuracy over speed');
    }

    // Skill-specific weaknesses
    Object.entries(scoringResult.skillBreakdown)
      .filter(([_, data]) => data.percentage < 60)
      .sort(([,a], [,b]) => a.percentage - b.percentage)
      .slice(0, 3)
      .forEach(([skill, data]) => {
        weaknesses.push(`${skill} needs improvement (${data.percentage.toFixed(1)}%)`);
      });

    return weaknesses;
  }

  private static generatePersonalizedRecommendations(
    scoringResult: ScoringResult,
    strengths: string[],
    weaknesses: string[],
    analytics: any
  ): string[] {
    const recommendations: string[] = [];

    // Performance-based recommendations
    if (scoringResult.percentage < 70) {
      recommendations.push('Review course materials before attempting again');
      recommendations.push('Focus on understanding concepts rather than memorizing answers');
    } else if (scoringResult.percentage >= 85) {
      recommendations.push('Consider advancing to more challenging topics');
      recommendations.push('Help other learners to reinforce your knowledge');
    }

    // Skill-specific recommendations
    const weakSkills = Object.entries(scoringResult.skillBreakdown)
      .filter(([_, data]) => data.percentage < 70)
      .slice(0, 2);

    weakSkills.forEach(([skill, _]) => {
      recommendations.push(`Practice more exercises focused on ${skill}`);
    });

    // Speed recommendations
    if (scoringResult.breakdown.speed < 70) {
      recommendations.push('Practice with timed exercises to improve confidence');
    }

    return recommendations;
  }

  private static generateNextSteps(
    scoringResult: ScoringResult,
    weaknesses: string[],
    analytics: any
  ): string[] {
    const steps: string[] = [];

    if (scoringResult.percentage < 70) {
      steps.push('Schedule regular study sessions');
      steps.push('Identify and focus on your weakest topics');
      steps.push('Seek help from instructors or peers');
    } else {
      steps.push('Continue building on your strengths');
      steps.push('Challenge yourself with advanced material');
    }

    if (weaknesses.length > 0) {
      steps.push('Create a targeted improvement plan');
    }

    steps.push('Track your progress with regular assessments');

    return steps;
  }

  private static createStudyPlan(
    weaknesses: string[],
    skillBreakdown: SkillBreakdown,
    analytics: any
  ): StudyPlanItem[] {
    const studyPlan: StudyPlanItem[] = [];

    // Convert skill weaknesses to study plan items
    Object.entries(skillBreakdown)
      .filter(([_, data]) => data.percentage < 70)
      .sort(([,a], [,b]) => a.percentage - b.percentage)
      .slice(0, 3)
      .forEach(([skill, data]) => {
        const priority = data.percentage < 50 ? 'high' : data.percentage < 60 ? 'medium' : 'low';
        const difficulty = data.percentage < 50 ? 'beginner' : 'intermediate';
        
        studyPlan.push({
          topic: skill,
          priority: priority as any,
          estimatedTime: 30 + (70 - data.percentage) * 2, // More time for weaker areas
          resources: [
            `${skill} fundamentals course`,
            `Practice exercises for ${skill}`,
            `${skill} reference materials`
          ],
          difficulty: difficulty as any
        });
      });

    return studyPlan;
  }
}

// Export utility functions
export const assessmentEngine = {
  generateAdaptiveFeedback: AssessmentEngine.generateAdaptiveFeedback,
  getNextRecommendations: AssessmentEngine.getNextRecommendations,
  selectAdaptiveQuestions: AssessmentEngine.selectAdaptiveQuestions,
  calculateDynamicPassThreshold: AssessmentEngine.calculateDynamicPassThreshold
};