/**
 * Metrics Calculator for Dashboard
 * Advanced performance metrics and trend analysis calculations
 */

import { createLogger } from '@/lib/logger';
import { type UserProgress, type UserAssessment, type User } from '@prisma/client';

const logger = createLogger('metrics-calculator');

export interface PerformanceMetrics {
  skillMastery: SkillMasteryMetric[];
  learningEfficiency: LearningEfficiencyMetric;
  progressVelocity: ProgressVelocityMetric;
  engagementScore: EngagementScoreMetric;
  retentionPrediction: RetentionPredictionMetric;
  competencyGaps: CompetencyGapMetric[];
}

export interface SkillMasteryMetric {
  skillName: string;
  category: string;
  currentLevel: number;
  masteryPercentage: number;
  confidenceInterval: [number, number];
  progressTrend: TrendDirection;
  timeToMastery: number; // estimated days
  strongAreas: string[];
  weakAreas: string[];
  recommendedActions: string[];
}

export interface LearningEfficiencyMetric {
  overallEfficiency: number; // 0-100 score
  timeEfficiency: number; // study time vs progress ratio
  accuracyEfficiency: number; // assessment accuracy vs attempts
  retentionEfficiency: number; // knowledge retention over time
  practiceEfficiency: number; // improvement per practice session
  recommendedOptimizations: string[];
}

export interface ProgressVelocityMetric {
  currentVelocity: number; // topics/week
  averageVelocity: number; // historical average
  velocityTrend: TrendDirection;
  accelerationFactor: number; // rate of velocity change
  predictedCompletion: {
    nextMilestone: Date;
    fullProgram: Date;
    confidence: number;
  };
  velocityFactors: {
    studyTimeImpact: number;
    difficultyImpact: number;
    motivationImpact: number;
  };
}

export interface EngagementScoreMetric {
  overallScore: number; // 0-100
  components: {
    sessionFrequency: number;
    sessionDuration: number;
    interactionDepth: number;
    challengeAcceptance: number;
    progressConsistency: number;
  };
  engagementPattern: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  riskFactors: string[];
  enhancementOpportunities: string[];
}

export interface RetentionPredictionMetric {
  retentionProbability: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  keyIndicators: {
    engagementTrend: number;
    performanceTrend: number;
    timeInvestmentTrend: number;
    difficultyFrustration: number;
  };
  interventionRecommendations: string[];
  optimalCheckInTime: Date;
}

export interface CompetencyGapMetric {
  competencyArea: string;
  currentLevel: number;
  targetLevel: number;
  gapSize: number;
  impactOnOverallProgress: number;
  timeToClose: number; // estimated days
  prerequisites: string[];
  recommendedResources: string[];
  difficultyLevel: 'easy' | 'medium' | 'hard';
}

export type TrendDirection = 'strongly_increasing' | 'increasing' | 'stable' | 'decreasing' | 'strongly_decreasing';

export interface TrendAnalysis {
  direction: TrendDirection;
  strength: number; // 0-1
  confidence: number; // 0-1
  changeRate: number;
  significantPoints: Array<{
    date: Date;
    value: number;
    type: 'peak' | 'valley' | 'inflection';
  }>;
}

export class MetricsCalculator {
  /**
   * Calculate comprehensive performance metrics for a user
   */
  static calculatePerformanceMetrics(
    userProgress: (UserProgress & { course: { tags: string[]; level: string; title: string } })[],
    userAssessments: (UserAssessment & { assessment: { course: { tags: string[] } } })[],
    user: Pick<User, 'createdAt' | 'lastLoginAt' | 'level' | 'xp'>
  ): PerformanceMetrics {
    logger.info('Calculating comprehensive performance metrics', {
      progressCount: userProgress.length,
      assessmentCount: userAssessments.length
    });

    const skillMastery = this.calculateSkillMastery(userProgress, userAssessments);
    const learningEfficiency = this.calculateLearningEfficiency(userProgress, userAssessments);
    const progressVelocity = this.calculateProgressVelocity(userProgress);
    const engagementScore = this.calculateEngagementScore(userProgress, userAssessments, user);
    const retentionPrediction = this.calculateRetentionPrediction(userProgress, userAssessments, user);
    const competencyGaps = this.calculateCompetencyGaps(userProgress, userAssessments);

    return {
      skillMastery,
      learningEfficiency,
      progressVelocity,
      engagementScore,
      retentionPrediction,
      competencyGaps
    };
  }

  /**
   * Analyze trend in time series data
   */
  static analyzeTrend(dataPoints: Array<{ date: Date; value: number }>): TrendAnalysis {
    if (dataPoints.length < 2) {
      return {
        direction: 'stable',
        strength: 0,
        confidence: 0,
        changeRate: 0,
        significantPoints: []
      };
    }

    // Sort by date
    const sorted = dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
    const values = sorted.map(d => d.value);
    
    // Linear regression to determine trend
    const n = values.length;
    const sumX = values.reduce((sum, _, i) => sum + i, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumXX = values.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const totalSumSquares = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
    const regressionSumSquares = values.reduce((sum, val, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(predicted - yMean, 2);
    }, 0);
    const rSquared = totalSumSquares > 0 ? regressionSumSquares / totalSumSquares : 0;
    
    // Determine trend direction
    let direction: TrendDirection;
    const normalizedSlope = slope / (Math.max(...values) - Math.min(...values));
    
    if (normalizedSlope > 0.1) direction = 'strongly_increasing';
    else if (normalizedSlope > 0.03) direction = 'increasing';
    else if (normalizedSlope < -0.1) direction = 'strongly_decreasing';
    else if (normalizedSlope < -0.03) direction = 'decreasing';
    else direction = 'stable';
    
    const strength = Math.abs(normalizedSlope);
    const confidence = Math.sqrt(rSquared);
    
    // Find significant points (peaks, valleys, inflections)
    const significantPoints = this.findSignificantPoints(sorted);
    
    return {
      direction,
      strength: Math.min(strength, 1),
      confidence: Math.min(confidence, 1),
      changeRate: slope,
      significantPoints
    };
  }

  /**
   * Calculate moving averages for smoothing trends
   */
  static calculateMovingAverage(
    dataPoints: Array<{ date: Date; value: number }>,
    windowSize: number = 7
  ): Array<{ date: Date; value: number; average: number }> {
    const sorted = dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return sorted.map((point, index) => {
      const start = Math.max(0, index - Math.floor(windowSize / 2));
      const end = Math.min(sorted.length, start + windowSize);
      const window = sorted.slice(start, end);
      const average = window.reduce((sum, p) => sum + p.value, 0) / window.length;
      
      return {
        ...point,
        average
      };
    });
  }

  /**
   * Calculate statistical confidence intervals
   */
  static calculateConfidenceInterval(
    values: number[],
    confidenceLevel: number = 0.95
  ): [number, number] {
    if (values.length === 0) return [0, 0];
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    const standardError = Math.sqrt(variance / values.length);
    
    // Use t-distribution for small samples, normal for large samples
    const tValue = values.length < 30 ? this.getTValue(values.length - 1, confidenceLevel) : 1.96;
    const marginOfError = tValue * standardError;
    
    return [mean - marginOfError, mean + marginOfError];
  }

  // Private calculation methods

  private static calculateSkillMastery(
    userProgress: (UserProgress & { course: { tags: string[]; level: string; title: string } })[],
    userAssessments: (UserAssessment & { assessment: { course: { tags: string[] } } })[]
  ): SkillMasteryMetric[] {
    const skillCategories = {
      'preflop': ['preflop', 'starting-hands', 'position', 'ranges'],
      'postflop': ['postflop', 'betting', 'pot-odds', 'value-betting'],
      'psychology': ['psychology', 'bluffing', 'reading', 'mental-game'],
      'mathematics': ['math', 'probability', 'ev', 'combinatorics'],
      'bankroll': ['bankroll', 'money-management', 'variance'],
      'tournament': ['tournament', 'mtt', 'sng', 'bubble-play']
    };

    const skillMetrics: SkillMasteryMetric[] = [];

    for (const [skillName, tags] of Object.entries(skillCategories)) {
      const relevantProgress = userProgress.filter(p => 
        p.course.tags.some(tag => tags.includes(tag.toLowerCase()))
      );
      
      const relevantAssessments = userAssessments.filter(a =>
        a.assessment.course.tags.some(tag => tags.includes(tag.toLowerCase()))
      );

      if (relevantProgress.length === 0) {
        skillMetrics.push({
          skillName: skillName.charAt(0).toUpperCase() + skillName.slice(1),
          category: 'Poker Skills',
          currentLevel: 0,
          masteryPercentage: 0,
          confidenceInterval: [0, 0],
          progressTrend: 'stable',
          timeToMastery: Infinity,
          strongAreas: [],
          weakAreas: tags,
          recommendedActions: [`Start with ${skillName} fundamentals`]
        });
        continue;
      }

      // Calculate current level and mastery
      const avgProgress = relevantProgress.reduce((sum, p) => sum + p.completionRate, 0) / relevantProgress.length;
      const avgScore = relevantAssessments.length > 0 
        ? relevantAssessments.reduce((sum, a) => sum + (a.score / a.maxScore * 100), 0) / relevantAssessments.length
        : 0;

      const currentLevel = Math.round((avgProgress + avgScore) / 2);
      const masteryPercentage = Math.min(currentLevel, 100);

      // Calculate confidence interval
      const allScores = relevantAssessments.map(a => (a.score / a.maxScore) * 100);
      const confidenceInterval = this.calculateConfidenceInterval(allScores);

      // Analyze trend
      const progressData = relevantProgress.map(p => ({
        date: p.lastAccessed,
        value: p.completionRate
      }));
      const trendAnalysis = this.analyzeTrend(progressData);

      // Calculate time to mastery (simplified)
      const recentProgress = relevantProgress
        .filter(p => p.lastAccessed >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
      
      let timeToMastery = Infinity;
      if (recentProgress.length > 1) {
        const progressRate = trendAnalysis.changeRate;
        const remainingProgress = 100 - masteryPercentage;
        timeToMastery = progressRate > 0 ? Math.ceil(remainingProgress / progressRate) : Infinity;
      }

      // Identify strong and weak areas
      const topicScores = new Map<string, number[]>();
      relevantAssessments.forEach(a => {
        a.assessment.course.tags.forEach(tag => {
          if (tags.includes(tag.toLowerCase())) {
            if (!topicScores.has(tag)) topicScores.set(tag, []);
            topicScores.get(tag)!.push((a.score / a.maxScore) * 100);
          }
        });
      });

      const topicAverages = Array.from(topicScores.entries()).map(([topic, scores]) => ({
        topic,
        average: scores.reduce((sum, s) => sum + s, 0) / scores.length
      }));

      const avgTopicScore = topicAverages.reduce((sum, t) => sum + t.average, 0) / topicAverages.length;
      const strongAreas = topicAverages.filter(t => t.average > avgTopicScore + 10).map(t => t.topic);
      const weakAreas = topicAverages.filter(t => t.average < avgTopicScore - 10).map(t => t.topic);

      // Generate recommendations
      const recommendedActions = [];
      if (masteryPercentage < 30) {
        recommendedActions.push(`Focus on ${skillName} fundamentals`);
      } else if (masteryPercentage < 70) {
        recommendedActions.push(`Practice advanced ${skillName} concepts`);
        if (weakAreas.length > 0) {
          recommendedActions.push(`Strengthen weak areas: ${weakAreas.join(', ')}`);
        }
      } else {
        recommendedActions.push(`Master expert-level ${skillName} techniques`);
        recommendedActions.push('Apply knowledge in challenging scenarios');
      }

      skillMetrics.push({
        skillName: skillName.charAt(0).toUpperCase() + skillName.slice(1),
        category: 'Poker Skills',
        currentLevel,
        masteryPercentage,
        confidenceInterval,
        progressTrend: trendAnalysis.direction,
        timeToMastery,
        strongAreas,
        weakAreas,
        recommendedActions
      });
    }

    return skillMetrics;
  }

  private static calculateLearningEfficiency(
    userProgress: (UserProgress & { course: { tags: string[]; level: string } })[],
    userAssessments: (UserAssessment & { assessment: { course: { tags: string[] } } })[]
  ): LearningEfficiencyMetric {
    // Time efficiency: progress per time spent
    const totalTime = userProgress.reduce((sum, p) => sum + p.studyTimeMinutes, 0);
    const totalProgress = userProgress.reduce((sum, p) => sum + p.completionRate, 0);
    const timeEfficiency = totalTime > 0 ? (totalProgress / totalTime) * 100 : 0;

    // Accuracy efficiency: average score vs attempts
    const assessmentAttempts = userAssessments.length;
    const totalScore = userAssessments.reduce((sum, a) => sum + (a.score / a.maxScore * 100), 0);
    const accuracyEfficiency = assessmentAttempts > 0 ? totalScore / assessmentAttempts : 0;

    // Retention efficiency: performance consistency over time
    const sortedAssessments = userAssessments
      .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
    
    let retentionEfficiency = 100;
    if (sortedAssessments.length > 1) {
      const recentScores = sortedAssessments.slice(-Math.ceil(sortedAssessments.length / 3));
      const olderScores = sortedAssessments.slice(0, Math.floor(sortedAssessments.length / 3));
      
      const recentAvg = recentScores.reduce((sum, a) => sum + (a.score / a.maxScore * 100), 0) / recentScores.length;
      const olderAvg = olderScores.reduce((sum, a) => sum + (a.score / a.maxScore * 100), 0) / olderScores.length;
      
      retentionEfficiency = olderAvg > 0 ? (recentAvg / olderAvg) * 100 : recentAvg;
    }

    // Practice efficiency: improvement per session
    const practiceScores = sortedAssessments.map((a, i) => ({
      session: i + 1,
      score: (a.score / a.maxScore) * 100
    }));

    const practiceEfficiency = practiceScores.length > 1 
      ? this.analyzeTrend(practiceScores.map((p, i) => ({ 
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000), 
          value: p.score 
        }))).changeRate * 10 + 50 // Normalize to 0-100 scale
      : 50;

    const overallEfficiency = Math.round(
      (timeEfficiency * 0.3 + accuracyEfficiency * 0.3 + retentionEfficiency * 0.2 + practiceEfficiency * 0.2)
    );

    // Generate optimization recommendations
    const recommendedOptimizations = [];
    if (timeEfficiency < 30) {
      recommendedOptimizations.push('Increase study frequency for better time efficiency');
    }
    if (accuracyEfficiency < 70) {
      recommendedOptimizations.push('Review fundamentals before attempting assessments');
    }
    if (retentionEfficiency < 80) {
      recommendedOptimizations.push('Use spaced repetition to improve knowledge retention');
    }
    if (practiceEfficiency < 40) {
      recommendedOptimizations.push('Focus on deliberate practice with immediate feedback');
    }

    return {
      overallEfficiency: Math.min(Math.max(overallEfficiency, 0), 100),
      timeEfficiency: Math.min(Math.max(timeEfficiency, 0), 100),
      accuracyEfficiency: Math.min(Math.max(accuracyEfficiency, 0), 100),
      retentionEfficiency: Math.min(Math.max(retentionEfficiency, 0), 100),
      practiceEfficiency: Math.min(Math.max(practiceEfficiency, 0), 100),
      recommendedOptimizations
    };
  }

  private static calculateProgressVelocity(
    userProgress: (UserProgress & { course: { tags: string[]; level: string } })[]
  ): ProgressVelocityMetric {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Recent velocity (topics completed in last week)
    const recentProgress = userProgress.filter(p => p.lastAccessed >= oneWeekAgo);
    const currentVelocity = recentProgress.filter(p => p.completionRate >= 100).length;

    // Historical average velocity
    const historicalProgress = userProgress.filter(p => p.completedAt);
    const totalWeeks = historicalProgress.length > 0 
      ? Math.max(1, Math.ceil((now.getTime() - Math.min(...historicalProgress.map(p => p.createdAt.getTime()))) / (7 * 24 * 60 * 60 * 1000)))
      : 1;
    const averageVelocity = historicalProgress.length / totalWeeks;

    // Velocity trend
    const weeklyData = [];
    for (let i = 0; i < 12; i++) { // Last 12 weeks
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekCompletions = userProgress.filter(p => 
        p.completedAt && p.completedAt >= weekStart && p.completedAt < weekEnd
      ).length;
      
      weeklyData.push({
        date: weekStart,
        value: weekCompletions
      });
    }

    const velocityTrendAnalysis = this.analyzeTrend(weeklyData);
    const accelerationFactor = velocityTrendAnalysis.changeRate;

    // Prediction calculations
    const remainingCourses = userProgress.filter(p => p.completionRate < 100).length;
    const nextMilestoneDistance = Math.min(5, remainingCourses); // Next 5 courses as milestone
    
    const predictedWeeksToMilestone = currentVelocity > 0 
      ? Math.ceil(nextMilestoneDistance / currentVelocity)
      : Infinity;
    const predictedWeeksToCompletion = currentVelocity > 0 
      ? Math.ceil(remainingCourses / currentVelocity)
      : Infinity;

    const nextMilestone = predictedWeeksToMilestone < Infinity 
      ? new Date(now.getTime() + predictedWeeksToMilestone * 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // Default to 1 year

    const fullProgram = predictedWeeksToCompletion < Infinity
      ? new Date(now.getTime() + predictedWeeksToCompletion * 7 * 24 * 60 * 60 * 1000)
      : new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // Default to 1 year

    const confidence = velocityTrendAnalysis.confidence;

    // Velocity factors analysis
    const studyTimeImpact = this.calculateCorrelation(
      userProgress.map(p => p.studyTimeMinutes),
      userProgress.map(p => p.completionRate)
    );

    const difficultyImpact = this.calculateDifficultyImpact(userProgress);
    const motivationImpact = this.calculateMotivationImpact(userProgress);

    return {
      currentVelocity,
      averageVelocity,
      velocityTrend: velocityTrendAnalysis.direction,
      accelerationFactor,
      predictedCompletion: {
        nextMilestone,
        fullProgram,
        confidence
      },
      velocityFactors: {
        studyTimeImpact,
        difficultyImpact,
        motivationImpact
      }
    };
  }

  private static calculateEngagementScore(
    userProgress: (UserProgress & { course: { tags: string[]; level: string } })[],
    userAssessments: (UserAssessment & { assessment: { course: { tags: string[] } } })[],
    user: Pick<User, 'createdAt' | 'lastLoginAt' | 'level' | 'xp'>
  ): EngagementScoreMetric {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Session frequency (0-100)
    const recentSessions = userProgress.filter(p => p.lastAccessed >= thirtyDaysAgo).length;
    const sessionFrequency = Math.min((recentSessions / 30) * 100, 100);

    // Session duration (0-100)
    const avgSessionDuration = recentSessions > 0 
      ? userProgress
          .filter(p => p.lastAccessed >= thirtyDaysAgo)
          .reduce((sum, p) => sum + p.studyTimeMinutes, 0) / recentSessions
      : 0;
    const sessionDuration = Math.min((avgSessionDuration / 60) * 100, 100); // Normalize to hours

    // Interaction depth (assessment participation rate)
    const assessmentRate = recentSessions > 0 
      ? (userAssessments.filter(a => a.completedAt >= thirtyDaysAgo).length / recentSessions) * 100
      : 0;
    const interactionDepth = Math.min(assessmentRate, 100);

    // Challenge acceptance (attempting difficult content)
    const advancedContent = userProgress.filter(p => 
      p.course.level === 'ADVANCED' && p.lastAccessed >= thirtyDaysAgo
    ).length;
    const challengeAcceptance = Math.min((advancedContent / Math.max(1, recentSessions)) * 200, 100);

    // Progress consistency (regularity of engagement)
    const dailyActivity = new Map<string, number>();
    userProgress
      .filter(p => p.lastAccessed >= thirtyDaysAgo)
      .forEach(p => {
        const day = p.lastAccessed.toDateString();
        dailyActivity.set(day, (dailyActivity.get(day) || 0) + 1);
      });
    
    const activeDays = dailyActivity.size;
    const progressConsistency = (activeDays / 30) * 100;

    // Overall score
    const overallScore = Math.round(
      (sessionFrequency * 0.25 + 
       sessionDuration * 0.2 + 
       interactionDepth * 0.2 + 
       challengeAcceptance * 0.15 + 
       progressConsistency * 0.2)
    );

    // Engagement pattern analysis
    const engagementData = Array.from(dailyActivity.entries()).map(([day, count]) => ({
      date: new Date(day),
      value: count
    }));
    const trendAnalysis = this.analyzeTrend(engagementData);
    
    let engagementPattern: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    if (trendAnalysis.strength > 0.3) {
      engagementPattern = trendAnalysis.direction.includes('increasing') ? 'increasing' : 'decreasing';
    } else if (trendAnalysis.confidence < 0.4) {
      engagementPattern = 'volatile';
    } else {
      engagementPattern = 'stable';
    }

    // Risk factors and enhancement opportunities
    const riskFactors = [];
    const enhancementOpportunities = [];

    if (sessionFrequency < 30) riskFactors.push('Low session frequency');
    if (sessionDuration < 20) riskFactors.push('Short session durations');
    if (interactionDepth < 50) riskFactors.push('Low assessment participation');
    if (progressConsistency < 40) riskFactors.push('Inconsistent progress');

    if (challengeAcceptance < 30) enhancementOpportunities.push('Try more challenging content');
    if (sessionDuration < 50) enhancementOpportunities.push('Extend study sessions for better focus');
    if (interactionDepth < 70) enhancementOpportunities.push('Engage more with assessments and feedback');

    return {
      overallScore: Math.min(Math.max(overallScore, 0), 100),
      components: {
        sessionFrequency: Math.min(Math.max(sessionFrequency, 0), 100),
        sessionDuration: Math.min(Math.max(sessionDuration, 0), 100),
        interactionDepth: Math.min(Math.max(interactionDepth, 0), 100),
        challengeAcceptance: Math.min(Math.max(challengeAcceptance, 0), 100),
        progressConsistency: Math.min(Math.max(progressConsistency, 0), 100)
      },
      engagementPattern,
      riskFactors,
      enhancementOpportunities
    };
  }

  private static calculateRetentionPrediction(
    userProgress: (UserProgress & { course: { tags: string[]; level: string } })[],
    userAssessments: (UserAssessment & { assessment: { course: { tags: string[] } } })[],
    user: Pick<User, 'createdAt' | 'lastLoginAt' | 'level' | 'xp'>
  ): RetentionPredictionMetric {
    const now = new Date();
    const daysSinceJoined = Math.ceil((now.getTime() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000));
    const daysSinceLastLogin = user.lastLoginAt 
      ? Math.ceil((now.getTime() - user.lastLoginAt.getTime()) / (24 * 60 * 60 * 1000))
      : 365;

    // Engagement trend
    const recentEngagement = userProgress.filter(p => 
      p.lastAccessed >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    ).length;
    const olderEngagement = userProgress.filter(p => 
      p.lastAccessed >= new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000) &&
      p.lastAccessed < new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    ).length;
    
    const engagementTrend = olderEngagement > 0 ? (recentEngagement / olderEngagement) * 100 - 100 : 0;

    // Performance trend
    const recentAssessments = userAssessments
      .filter(a => a.completedAt >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000))
      .map(a => (a.score / a.maxScore) * 100);
    const olderAssessments = userAssessments
      .filter(a => 
        a.completedAt >= new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000) &&
        a.completedAt < new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      )
      .map(a => (a.score / a.maxScore) * 100);

    const recentAvgScore = recentAssessments.length > 0 
      ? recentAssessments.reduce((sum, s) => sum + s, 0) / recentAssessments.length
      : 0;
    const olderAvgScore = olderAssessments.length > 0
      ? olderAssessments.reduce((sum, s) => sum + s, 0) / olderAssessments.length
      : 0;

    const performanceTrend = olderAvgScore > 0 ? recentAvgScore - olderAvgScore : 0;

    // Time investment trend
    const recentStudyTime = userProgress
      .filter(p => p.lastAccessed >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
      .reduce((sum, p) => sum + p.studyTimeMinutes, 0);
    const olderStudyTime = userProgress
      .filter(p => 
        p.lastAccessed >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) &&
        p.lastAccessed < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      )
      .reduce((sum, p) => sum + p.studyTimeMinutes, 0);

    const timeInvestmentTrend = olderStudyTime > 0 ? (recentStudyTime / olderStudyTime) * 100 - 100 : 0;

    // Difficulty frustration (failing assessments on advanced content)
    const advancedFailures = userAssessments
      .filter(a => a.completedAt >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000))
      .filter(a => (a.score / a.maxScore) < 0.6) // Below 60%
      .length;
    const difficultyFrustration = Math.min((advancedFailures / Math.max(1, recentAssessments.length)) * 100, 100);

    // Calculate retention probability
    let retentionScore = 100;
    
    // Penalize long absence
    if (daysSinceLastLogin > 7) retentionScore -= Math.min(daysSinceLastLogin * 2, 40);
    
    // Penalize declining engagement
    if (engagementTrend < -20) retentionScore -= 15;
    else if (engagementTrend < -50) retentionScore -= 30;
    
    // Penalize declining performance
    if (performanceTrend < -10) retentionScore -= 10;
    else if (performanceTrend < -20) retentionScore -= 20;
    
    // Penalize reduced time investment
    if (timeInvestmentTrend < -30) retentionScore -= 15;
    
    // Penalize high frustration
    if (difficultyFrustration > 50) retentionScore -= 20;
    
    // Bonus for consistent engagement
    if (engagementTrend > 20) retentionScore += 10;
    if (performanceTrend > 10) retentionScore += 10;

    const retentionProbability = Math.min(Math.max(retentionScore, 0), 100);

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (retentionProbability > 70) riskLevel = 'low';
    else if (retentionProbability > 40) riskLevel = 'medium';
    else riskLevel = 'high';

    // Generate intervention recommendations
    const interventionRecommendations = [];
    if (daysSinceLastLogin > 3) {
      interventionRecommendations.push('Send re-engagement notification');
    }
    if (engagementTrend < -20) {
      interventionRecommendations.push('Offer personalized study plan');
    }
    if (performanceTrend < -10) {
      interventionRecommendations.push('Provide additional support resources');
    }
    if (difficultyFrustration > 30) {
      interventionRecommendations.push('Recommend easier content to build confidence');
    }
    if (timeInvestmentTrend < -30) {
      interventionRecommendations.push('Suggest shorter, more frequent study sessions');
    }

    // Optimal check-in time
    const optimalCheckInTime = new Date(now.getTime() + Math.max(1, 14 - daysSinceLastLogin) * 24 * 60 * 60 * 1000);

    return {
      retentionProbability,
      riskLevel,
      keyIndicators: {
        engagementTrend,
        performanceTrend,
        timeInvestmentTrend,
        difficultyFrustration
      },
      interventionRecommendations,
      optimalCheckInTime
    };
  }

  private static calculateCompetencyGaps(
    userProgress: (UserProgress & { course: { tags: string[]; level: string } })[],
    userAssessments: (UserAssessment & { assessment: { course: { tags: string[] } } })[]
  ): CompetencyGapMetric[] {
    const competencyAreas = {
      'Hand Selection': { tags: ['preflop', 'starting-hands'], targetLevel: 85 },
      'Position Play': { tags: ['position', 'button', 'blinds'], targetLevel: 80 },
      'Bet Sizing': { tags: ['betting', 'value-betting', 'bluffing'], targetLevel: 75 },
      'Pot Odds': { tags: ['pot-odds', 'math', 'probability'], targetLevel: 85 },
      'Reading Opponents': { tags: ['psychology', 'reading', 'tells'], targetLevel: 70 },
      'Bankroll Management': { tags: ['bankroll', 'money-management'], targetLevel: 90 }
    };

    const gaps: CompetencyGapMetric[] = [];

    for (const [area, config] of Object.entries(competencyAreas)) {
      const relevantProgress = userProgress.filter(p => 
        p.course.tags.some(tag => config.tags.includes(tag.toLowerCase()))
      );
      
      const relevantAssessments = userAssessments.filter(a =>
        a.assessment.course.tags.some(tag => config.tags.includes(tag.toLowerCase()))
      );

      if (relevantAssessments.length === 0) {
        gaps.push({
          competencyArea: area,
          currentLevel: 0,
          targetLevel: config.targetLevel,
          gapSize: config.targetLevel,
          impactOnOverallProgress: 0.8, // High impact if no assessments
          timeToClose: 30, // Estimate 30 days
          prerequisites: [],
          recommendedResources: [`${area} fundamentals course`],
          difficultyLevel: 'easy'
        });
        continue;
      }

      const currentLevel = Math.round(
        relevantAssessments.reduce((sum, a) => sum + (a.score / a.maxScore * 100), 0) / relevantAssessments.length
      );

      const gapSize = Math.max(0, config.targetLevel - currentLevel);
      
      if (gapSize > 5) { // Only include significant gaps
        const impactOnOverallProgress = gapSize / 100; // Normalize impact
        const timeToClose = Math.ceil(gapSize / 2); // Estimate 2 points improvement per day
        
        let difficultyLevel: 'easy' | 'medium' | 'hard';
        if (gapSize < 15) difficultyLevel = 'easy';
        else if (gapSize < 30) difficultyLevel = 'medium';
        else difficultyLevel = 'hard';

        gaps.push({
          competencyArea: area,
          currentLevel,
          targetLevel: config.targetLevel,
          gapSize,
          impactOnOverallProgress,
          timeToClose,
          prerequisites: currentLevel < 30 ? ['Basic poker fundamentals'] : [],
          recommendedResources: [
            `Advanced ${area} training`,
            `${area} practice exercises`,
            `${area} video tutorials`
          ],
          difficultyLevel
        });
      }
    }

    return gaps.sort((a, b) => b.impactOnOverallProgress - a.impactOnOverallProgress);
  }

  // Utility methods

  private static findSignificantPoints(
    dataPoints: Array<{ date: Date; value: number }>
  ): Array<{ date: Date; value: number; type: 'peak' | 'valley' | 'inflection' }> {
    if (dataPoints.length < 3) return [];

    const points = [];
    
    for (let i = 1; i < dataPoints.length - 1; i++) {
      const prev = dataPoints[i - 1].value;
      const current = dataPoints[i].value;
      const next = dataPoints[i + 1].value;
      
      // Peak detection
      if (current > prev && current > next && (current - Math.min(prev, next)) > 5) {
        points.push({
          date: dataPoints[i].date,
          value: current,
          type: 'peak' as const
        });
      }
      // Valley detection
      else if (current < prev && current < next && (Math.max(prev, next) - current) > 5) {
        points.push({
          date: dataPoints[i].date,
          value: current,
          type: 'valley' as const
        });
      }
      // Inflection point detection (significant change in direction)
      else if (i > 1 && i < dataPoints.length - 2) {
        const prevSlope = current - prev;
        const nextSlope = next - current;
        if (Math.abs(prevSlope - nextSlope) > 10) {
          points.push({
            date: dataPoints[i].date,
            value: current,
            type: 'inflection' as const
          });
        }
      }
    }
    
    return points;
  }

  private static calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + (val * y[i]), 0);
    const sumXX = x.reduce((sum, val) => sum + (val * val), 0);
    const sumYY = y.reduce((sum, val) => sum + (val * val), 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private static calculateDifficultyImpact(
    userProgress: (UserProgress & { course: { level: string } })[]
  ): number {
    const levelScores = userProgress.map(p => ({
      level: p.course.level,
      completion: p.completionRate
    }));

    const beginnerAvg = levelScores
      .filter(l => l.level === 'BEGINNER')
      .reduce((sum, l, _, arr) => sum + l.completion / arr.length, 0);
    
    const advancedAvg = levelScores
      .filter(l => l.level === 'ADVANCED')
      .reduce((sum, l, _, arr) => sum + l.completion / arr.length, 0);

    // Negative impact indicates difficulty is hindering progress
    return beginnerAvg > 0 ? ((advancedAvg - beginnerAvg) / beginnerAvg) * 100 : 0;
  }

  private static calculateMotivationImpact(
    userProgress: (UserProgress & { course: { tags: string[] } })[]
  ): number {
    // Simplified motivation calculation based on consistent progress
    const recentProgress = userProgress
      .filter(p => p.lastAccessed >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000))
      .sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    if (recentProgress.length < 2) return 50; // Neutral

    const progressRates = recentProgress.map((p, i) => {
      if (i === 0) return 0;
      const timeDiff = p.lastAccessed.getTime() - recentProgress[i - 1].lastAccessed.getTime();
      const progressDiff = p.completionRate - recentProgress[i - 1].completionRate;
      return timeDiff > 0 ? (progressDiff / (timeDiff / (24 * 60 * 60 * 1000))) : 0; // Progress per day
    });

    const avgProgressRate = progressRates.reduce((sum, rate) => sum + rate, 0) / progressRates.length;
    return Math.min(Math.max(avgProgressRate * 10 + 50, 0), 100); // Normalize to 0-100
  }

  private static getTValue(degreesOfFreedom: number, confidenceLevel: number): number {
    // Simplified t-value lookup for common confidence levels
    const tTable: Record<number, Record<number, number>> = {
      90: { 1: 6.314, 2: 2.920, 5: 2.015, 10: 1.812, 20: 1.725, 30: 1.697 },
      95: { 1: 12.706, 2: 4.303, 5: 2.571, 10: 2.228, 20: 2.086, 30: 2.042 },
      99: { 1: 63.657, 2: 9.925, 5: 4.032, 10: 3.169, 20: 2.845, 30: 2.750 }
    };

    const confidencePercent = Math.round(confidenceLevel * 100);
    if (!tTable[confidencePercent]) return 1.96; // Default to normal distribution

    const table = tTable[confidencePercent];
    const closestDf = Object.keys(table)
      .map(Number)
      .reduce((prev, curr) => 
        Math.abs(curr - degreesOfFreedom) < Math.abs(prev - degreesOfFreedom) ? curr : prev
      );

    return table[closestDf] || 1.96;
  }
}