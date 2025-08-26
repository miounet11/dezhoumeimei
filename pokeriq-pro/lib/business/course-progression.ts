/**
 * Course Progression Business Logic for Dezhoumama Learning Platform
 * Handles course progression algorithms, prerequisite checking, and completion tracking
 */

import {
  Course,
  UserProgress,
  CourseLevel,
  TestScore,
  Assessment,
  User,
  SkillBreakdown,
  LearningAnalytics
} from '@/lib/types/dezhoumama';

// ========================================================================
// Types for Course Progression
// ========================================================================

export interface ProgressionResult {
  success: boolean;
  message: string;
  code: string;
  data?: any;
}

export interface PrerequisiteCheckResult {
  canEnroll: boolean;
  missingPrerequisites: Course[];
  completedPrerequisites: Course[];
  message: string;
}

export interface CompletionCriteria {
  minimumCompletionRate: number;
  requiredAssessments: string[];
  passingScore: number;
  minimumStudyTime?: number;
}

export interface ProgressionPath {
  currentCourse: Course;
  nextRecommendedCourses: Course[];
  unlockedCourses: Course[];
  pathToGoal?: Course[];
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  courses: Course[];
  estimatedTimeMinutes: number;
  skillsGained: string[];
  difficulty: CourseLevel;
}

// ========================================================================
// Prerequisites Logic
// ========================================================================

export class PrerequisiteManager {
  /**
   * Check if user can enroll in a course based on prerequisites
   */
  static checkPrerequisites(
    course: Course,
    userProgress: UserProgress[],
    allCourses: Course[]
  ): PrerequisiteCheckResult {
    if (!course.prerequisites || course.prerequisites.length === 0) {
      return {
        canEnroll: true,
        missingPrerequisites: [],
        completedPrerequisites: [],
        message: 'No prerequisites required'
      };
    }

    const courseMap = new Map(allCourses.map(c => [c.id, c]));
    const progressMap = new Map(userProgress.map(p => [p.courseId, p]));

    const missingPrerequisites: Course[] = [];
    const completedPrerequisites: Course[] = [];

    for (const prereqId of course.prerequisites) {
      const prereqCourse = courseMap.get(prereqId);
      if (!prereqCourse) {
        // Course not found - should be handled at data validation level
        continue;
      }

      const progress = progressMap.get(prereqId);
      if (!progress || !this.isCourseCompleted(progress)) {
        missingPrerequisites.push(prereqCourse);
      } else {
        completedPrerequisites.push(prereqCourse);
      }
    }

    const canEnroll = missingPrerequisites.length === 0;
    const message = canEnroll 
      ? 'All prerequisites completed'
      : `Missing ${missingPrerequisites.length} prerequisite(s): ${missingPrerequisites.map(c => c.title).join(', ')}`;

    return {
      canEnroll,
      missingPrerequisites,
      completedPrerequisites,
      message
    };
  }

  /**
   * Build prerequisite dependency graph
   */
  static buildDependencyGraph(courses: Course[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    courses.forEach(course => {
      graph.set(course.id, course.prerequisites || []);
    });

    return graph;
  }

  /**
   * Get all courses that have the given course as a prerequisite
   */
  static getCoursesUnlockedBy(courseId: string, allCourses: Course[]): Course[] {
    return allCourses.filter(course => 
      course.prerequisites && course.prerequisites.includes(courseId)
    );
  }

  /**
   * Get the complete prerequisite chain for a course
   */
  static getPrerequisiteChain(
    courseId: string, 
    allCourses: Course[]
  ): Course[] {
    const courseMap = new Map(allCourses.map(c => [c.id, c]));
    const visited = new Set<string>();
    const chain: Course[] = [];

    function collectPrerequisites(id: string) {
      if (visited.has(id)) return;
      visited.add(id);

      const course = courseMap.get(id);
      if (course && course.prerequisites) {
        course.prerequisites.forEach(prereqId => {
          collectPrerequisites(prereqId);
          const prereqCourse = courseMap.get(prereqId);
          if (prereqCourse && !chain.find(c => c.id === prereqId)) {
            chain.push(prereqCourse);
          }
        });
      }
    }

    collectPrerequisites(courseId);
    return chain;
  }

  private static isCourseCompleted(progress: UserProgress): boolean {
    return progress.completionRate >= 100 || progress.completedAt !== null;
  }
}

// ========================================================================
// Completion Tracking Logic
// ========================================================================

export class CompletionTracker {
  /**
   * Check if course meets completion criteria
   */
  static checkCompletion(
    progress: UserProgress,
    course: Course,
    assessments: Assessment[],
    criteria: CompletionCriteria
  ): ProgressionResult {
    const results: string[] = [];

    // Check completion rate
    if (progress.completionRate < criteria.minimumCompletionRate) {
      results.push(`Completion rate ${progress.completionRate}% is below required ${criteria.minimumCompletionRate}%`);
    }

    // Check required assessments
    if (criteria.requiredAssessments.length > 0) {
      const testScores = this.parseTestScores(progress.testScores);
      const completedAssessments = new Set(testScores.map(ts => ts.assessmentId));
      
      const missingAssessments = criteria.requiredAssessments.filter(
        assessmentId => !completedAssessments.has(assessmentId)
      );

      if (missingAssessments.length > 0) {
        results.push(`Missing required assessments: ${missingAssessments.length}`);
      }

      // Check passing scores for completed assessments
      const failedAssessments = testScores.filter(ts => 
        criteria.requiredAssessments.includes(ts.assessmentId) && 
        ts.percentage < criteria.passingScore
      );

      if (failedAssessments.length > 0) {
        results.push(`${failedAssessments.length} assessment(s) below passing score of ${criteria.passingScore}%`);
      }
    }

    // Check minimum study time
    if (criteria.minimumStudyTime && progress.studyTimeMinutes < criteria.minimumStudyTime) {
      results.push(`Study time ${progress.studyTimeMinutes} minutes is below required ${criteria.minimumStudyTime} minutes`);
    }

    const success = results.length === 0;

    return {
      success,
      message: success ? 'Course completion criteria met' : results.join('; '),
      code: success ? 'COMPLETION_SUCCESS' : 'COMPLETION_INCOMPLETE',
      data: {
        completionRate: progress.completionRate,
        studyTime: progress.studyTimeMinutes,
        assessmentsPassed: criteria.requiredAssessments.length - results.length
      }
    };
  }

  /**
   * Calculate overall course completion percentage
   */
  static calculateOverallCompletion(
    progress: UserProgress,
    course: Course,
    assessments: Assessment[]
  ): number {
    const weights = {
      content: 0.6,        // 60% for content completion
      assessments: 0.3,    // 30% for assessments
      timeSpent: 0.1       // 10% for time engagement
    };

    // Content completion
    const contentScore = Math.min(progress.completionRate, 100);

    // Assessment completion
    const testScores = this.parseTestScores(progress.testScores);
    const courseAssessments = assessments.filter(a => a.courseId === course.id);
    
    let assessmentScore = 0;
    if (courseAssessments.length > 0) {
      const completedAssessments = testScores.filter(ts => 
        courseAssessments.some(ca => ca.id === ts.assessmentId)
      );
      
      if (completedAssessments.length > 0) {
        const avgAssessmentScore = completedAssessments.reduce((sum, ts) => sum + ts.percentage, 0) / completedAssessments.length;
        const completionRatio = completedAssessments.length / courseAssessments.length;
        assessmentScore = avgAssessmentScore * completionRatio;
      }
    } else {
      assessmentScore = 100; // No assessments means full score for this component
    }

    // Time engagement (based on expected vs actual study time)
    const expectedTime = course.durationMinutes || 60; // Default 1 hour if not specified
    const timeEngagementScore = Math.min((progress.studyTimeMinutes / expectedTime) * 100, 100);

    // Calculate weighted average
    const overallCompletion = 
      (contentScore * weights.content) +
      (assessmentScore * weights.assessments) +
      (timeEngagementScore * weights.timeSpent);

    return Math.round(overallCompletion * 100) / 100;
  }

  /**
   * Get completion criteria for a course based on its level
   */
  static getStandardCompletionCriteria(course: Course): CompletionCriteria {
    const baseCriteria = {
      minimumCompletionRate: 80,
      passingScore: 70,
      requiredAssessments: [] as string[]
    };

    switch (course.level) {
      case CourseLevel.BEGINNER:
        return {
          ...baseCriteria,
          minimumCompletionRate: 75,
          passingScore: 65
        };

      case CourseLevel.INTERMEDIATE:
        return {
          ...baseCriteria,
          minimumCompletionRate: 85,
          passingScore: 75,
          minimumStudyTime: course.durationMinutes ? Math.floor(course.durationMinutes * 0.8) : undefined
        };

      case CourseLevel.ADVANCED:
        return {
          ...baseCriteria,
          minimumCompletionRate: 90,
          passingScore: 80,
          minimumStudyTime: course.durationMinutes ? Math.floor(course.durationMinutes * 0.9) : undefined
        };

      default:
        return baseCriteria;
    }
  }

  private static parseTestScores(testScores: any): TestScore[] {
    if (!testScores) return [];
    if (Array.isArray(testScores)) return testScores;
    
    try {
      const parsed = typeof testScores === 'string' ? JSON.parse(testScores) : testScores;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}

// ========================================================================
// Learning Path Logic
// ========================================================================

export class LearningPathManager {
  /**
   * Generate recommended learning path based on user's current progress and goals
   */
  static generateLearningPath(
    user: User,
    userProgress: UserProgress[],
    allCourses: Course[],
    targetSkills?: string[]
  ): ProgressionPath[] {
    const progressMap = new Map(userProgress.map(p => [p.courseId, p]));
    const completedCourseIds = new Set(
      userProgress
        .filter(p => CompletionTracker.calculateOverallCompletion(p, allCourses.find(c => c.id === p.courseId)!, []) >= 80)
        .map(p => p.courseId)
    );

    const paths: ProgressionPath[] = [];

    // Find courses user is currently taking
    const currentCourses = userProgress
      .filter(p => p.completionRate > 0 && p.completionRate < 100 && !p.completedAt)
      .map(p => allCourses.find(c => c.id === p.courseId)!)
      .filter(Boolean);

    // For each current course, find what comes next
    currentCourses.forEach(currentCourse => {
      const nextCourses = this.findNextRecommendedCourses(
        currentCourse,
        completedCourseIds,
        allCourses,
        targetSkills
      );

      const unlockedCourses = this.findUnlockedCourses(
        completedCourseIds,
        allCourses
      );

      paths.push({
        currentCourse,
        nextRecommendedCourses: nextCourses,
        unlockedCourses: unlockedCourses
      });
    });

    // If no current courses, recommend starting points
    if (paths.length === 0) {
      const startingCourses = this.findStartingCourses(allCourses, targetSkills);
      
      if (startingCourses.length > 0) {
        paths.push({
          currentCourse: startingCourses[0], // Use first as "current"
          nextRecommendedCourses: startingCourses.slice(1),
          unlockedCourses: startingCourses
        });
      }
    }

    return paths;
  }

  /**
   * Create predefined learning paths for common skill tracks
   */
  static createSkillTrackPaths(courses: Course[]): LearningPath[] {
    const paths: LearningPath[] = [];

    // Poker Fundamentals Path
    const fundamentalsCourses = courses.filter(c => 
      c.tags.some(tag => ['basics', 'fundamentals', 'beginner'].includes(tag)) &&
      c.level === CourseLevel.BEGINNER
    ).sort((a, b) => a.title.localeCompare(b.title));

    if (fundamentalsCourses.length > 0) {
      paths.push({
        id: 'poker-fundamentals',
        name: 'Poker Fundamentals',
        description: 'Master the basics of Texas Hold\'em poker',
        courses: fundamentalsCourses,
        estimatedTimeMinutes: fundamentalsCourses.reduce((sum, c) => sum + (c.durationMinutes || 60), 0),
        skillsGained: ['hand-rankings', 'betting', 'position-play', 'basic-strategy'],
        difficulty: CourseLevel.BEGINNER
      });
    }

    // Advanced Strategy Path
    const advancedCourses = courses.filter(c =>
      c.tags.some(tag => ['advanced', 'gto', 'strategy'].includes(tag)) &&
      c.level === CourseLevel.ADVANCED
    ).sort((a, b) => a.title.localeCompare(b.title));

    if (advancedCourses.length > 0) {
      paths.push({
        id: 'advanced-strategy',
        name: 'Advanced Strategy',
        description: 'Master advanced concepts and GTO play',
        courses: advancedCourses,
        estimatedTimeMinutes: advancedCourses.reduce((sum, c) => sum + (c.durationMinutes || 90), 0),
        skillsGained: ['gto-strategy', 'range-analysis', 'advanced-math', 'exploitation'],
        difficulty: CourseLevel.ADVANCED
      });
    }

    // Tournament Path
    const tournamentCourses = courses.filter(c =>
      c.tags.some(tag => ['tournament', 'mtt', 'sit-and-go'].includes(tag))
    ).sort((a, b) => a.title.localeCompare(b.title));

    if (tournamentCourses.length > 0) {
      paths.push({
        id: 'tournament-mastery',
        name: 'Tournament Mastery',
        description: 'Excel in tournament poker formats',
        courses: tournamentCourses,
        estimatedTimeMinutes: tournamentCourses.reduce((sum, c) => sum + (c.durationMinutes || 75), 0),
        skillsGained: ['tournament-strategy', 'stack-management', 'bubble-play', 'final-table'],
        difficulty: CourseLevel.INTERMEDIATE
      });
    }

    return paths;
  }

  /**
   * Get optimal course sequence to reach a target skill level
   */
  static getOptimalSequence(
    currentLevel: CourseLevel,
    targetLevel: CourseLevel,
    specialization: string,
    courses: Course[]
  ): Course[] {
    const relevantCourses = courses.filter(c => 
      c.tags.includes(specialization) || 
      c.specialization === specialization ||
      c.description?.toLowerCase().includes(specialization.toLowerCase())
    );

    const sequence: Course[] = [];

    // Start from current level and work up
    const levels = [CourseLevel.BEGINNER, CourseLevel.INTERMEDIATE, CourseLevel.ADVANCED];
    const startIndex = levels.indexOf(currentLevel);
    const endIndex = levels.indexOf(targetLevel);

    for (let i = startIndex; i <= endIndex; i++) {
      const levelCourses = relevantCourses
        .filter(c => c.level === levels[i])
        .sort((a, b) => {
          // Sort by prerequisites (courses with fewer prerequisites first)
          const aPrereqs = a.prerequisites?.length || 0;
          const bPrereqs = b.prerequisites?.length || 0;
          return aPrereqs - bPrereqs;
        });

      sequence.push(...levelCourses);
    }

    return this.orderByPrerequisites(sequence);
  }

  private static findNextRecommendedCourses(
    currentCourse: Course,
    completedCourseIds: Set<string>,
    allCourses: Course[],
    targetSkills?: string[]
  ): Course[] {
    // Find courses that have the current course as a prerequisite
    const directNext = allCourses.filter(course =>
      course.prerequisites && course.prerequisites.includes(currentCourse.id) &&
      !completedCourseIds.has(course.id)
    );

    // Find courses with similar tags but higher level
    const similarCourses = allCourses.filter(course => {
      if (completedCourseIds.has(course.id)) return false;
      if (course.level === currentCourse.level) return false;
      
      const sharedTags = course.tags.filter(tag => currentCourse.tags.includes(tag));
      return sharedTags.length >= 2; // At least 2 shared tags
    });

    // Combine and prioritize
    const combined = [...directNext, ...similarCourses];
    
    return this.prioritizeCourses(combined, targetSkills).slice(0, 5); // Top 5 recommendations
  }

  private static findUnlockedCourses(
    completedCourseIds: Set<string>,
    allCourses: Course[]
  ): Course[] {
    return allCourses.filter(course => {
      if (completedCourseIds.has(course.id)) return false;
      
      // Check if all prerequisites are completed
      if (course.prerequisites && course.prerequisites.length > 0) {
        return course.prerequisites.every(prereqId => completedCourseIds.has(prereqId));
      }
      
      return true; // No prerequisites means it's unlocked
    });
  }

  private static findStartingCourses(
    allCourses: Course[],
    targetSkills?: string[]
  ): Course[] {
    const beginnerCourses = allCourses.filter(course =>
      course.level === CourseLevel.BEGINNER &&
      (!course.prerequisites || course.prerequisites.length === 0)
    );

    return this.prioritizeCourses(beginnerCourses, targetSkills);
  }

  private static prioritizeCourses(courses: Course[], targetSkills?: string[]): Course[] {
    if (!targetSkills || targetSkills.length === 0) {
      return courses.sort((a, b) => a.title.localeCompare(b.title));
    }

    return courses.sort((a, b) => {
      // Calculate relevance score based on matching tags
      const aScore = a.tags.filter(tag => targetSkills.includes(tag)).length;
      const bScore = b.tags.filter(tag => targetSkills.includes(tag)).length;
      
      if (aScore !== bScore) {
        return bScore - aScore; // Higher score first
      }
      
      return a.title.localeCompare(b.title);
    });
  }

  private static orderByPrerequisites(courses: Course[]): Course[] {
    const ordered: Course[] = [];
    const remaining = [...courses];
    const courseMap = new Map(courses.map(c => [c.id, c]));

    while (remaining.length > 0) {
      const nextCourse = remaining.find(course => {
        if (!course.prerequisites || course.prerequisites.length === 0) {
          return true;
        }
        
        return course.prerequisites.every(prereqId => 
          ordered.some(orderedCourse => orderedCourse.id === prereqId) ||
          !courseMap.has(prereqId) // Prerequisite not in our list
        );
      });

      if (nextCourse) {
        ordered.push(nextCourse);
        remaining.splice(remaining.indexOf(nextCourse), 1);
      } else {
        // Circular dependency or missing prerequisite - just add the first remaining
        ordered.push(remaining[0]);
        remaining.splice(0, 1);
      }
    }

    return ordered;
  }
}

// ========================================================================
// Progress Analytics
// ========================================================================

export class ProgressAnalytics {
  /**
   * Generate learning analytics for a user
   */
  static generateAnalytics(
    user: User,
    userProgress: UserProgress[],
    allCourses: Course[],
    assessments: Assessment[]
  ): LearningAnalytics {
    const courseMap = new Map(allCourses.map(c => [c.id, c]));
    
    // Course progress analytics
    const totalCourses = userProgress.length;
    const completedCourses = userProgress.filter(p => 
      CompletionTracker.calculateOverallCompletion(p, courseMap.get(p.courseId)!, assessments) >= 100
    ).length;
    const inProgressCourses = userProgress.filter(p => 
      p.completionRate > 0 && p.completionRate < 100
    ).length;
    const averageCompletionRate = totalCourses > 0 
      ? userProgress.reduce((sum, p) => sum + p.completionRate, 0) / totalCourses
      : 0;

    // Assessment performance
    const allTestScores = userProgress.flatMap(p => 
      CompletionTracker['parseTestScores'](p.testScores)
    );
    const totalAssessments = allTestScores.length;
    const averageScore = totalAssessments > 0
      ? allTestScores.reduce((sum, ts) => sum + ts.percentage, 0) / totalAssessments
      : 0;
    const passRate = totalAssessments > 0
      ? (allTestScores.filter(ts => ts.percentage >= 70).length / totalAssessments) * 100
      : 0;

    // Calculate improvement trend (simple linear regression on recent scores)
    const recentScores = allTestScores
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
      .slice(-10); // Last 10 assessments
    const improvementTrend = this.calculateTrend(recentScores.map(ts => ts.percentage));

    // Study patterns
    const totalStudyTime = userProgress.reduce((sum, p) => sum + p.studyTimeMinutes, 0);
    const averageSessionDuration = totalCourses > 0 ? totalStudyTime / totalCourses : 0;
    const consistencyScore = this.calculateConsistencyScore(userProgress);

    // Skill development analysis
    const skillBreakdowns = userProgress
      .map(p => CompletionTracker['parseTestScores'](p.testScores))
      .flat()
      .map(ts => ts.skillBreakdown)
      .filter(Boolean);

    const skillAnalysis = this.analyzeSkillDevelopment(skillBreakdowns);

    return {
      courseProgress: {
        totalCourses,
        completedCourses,
        inProgressCourses,
        averageCompletionRate: Math.round(averageCompletionRate * 100) / 100
      },
      assessmentPerformance: {
        totalAssessments,
        averageScore: Math.round(averageScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        improvementTrend: Math.round(improvementTrend * 100) / 100
      },
      studyPatterns: {
        totalStudyTime,
        averageSessionDuration: Math.round(averageSessionDuration),
        mostActiveTimeOfDay: 'morning', // Would need session timing data to calculate
        consistencyScore: Math.round(consistencyScore * 100) / 100
      },
      skillDevelopment: skillAnalysis
    };
  }

  private static calculateTrend(scores: number[]): number {
    if (scores.length < 2) return 0;

    const n = scores.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices 0, 1, 2, ..., n-1
    const sumY = scores.reduce((sum, score) => sum + score, 0);
    const sumXY = scores.reduce((sum, score, index) => sum + (index * score), 0);
    const sumX2 = scores.reduce((sum, _, index) => sum + (index * index), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope; // Positive = improving, negative = declining
  }

  private static calculateConsistencyScore(userProgress: UserProgress[]): number {
    if (userProgress.length === 0) return 0;

    // Calculate based on regularity of study sessions
    const studyTimes = userProgress.map(p => p.studyTimeMinutes).filter(t => t > 0);
    if (studyTimes.length < 2) return studyTimes.length > 0 ? 0.5 : 0;

    const mean = studyTimes.reduce((sum, t) => sum + t, 0) / studyTimes.length;
    const variance = studyTimes.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / studyTimes.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation relative to mean = higher consistency
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
    return Math.max(0, 1 - coefficientOfVariation); // Convert to 0-1 score
  }

  private static analyzeSkillDevelopment(skillBreakdowns: any[]): any {
    if (skillBreakdowns.length === 0) {
      return {
        strongestAreas: [],
        weakestAreas: [],
        improvementAreas: [],
        masteredSkills: []
      };
    }

    // Aggregate skill performance across all assessments
    const skillAggregation = new Map<string, { scores: number[], total: number }>();

    skillBreakdowns.forEach(breakdown => {
      if (breakdown && typeof breakdown === 'object') {
        Object.entries(breakdown).forEach(([skill, data]: [string, any]) => {
          if (data && typeof data.percentage === 'number') {
            if (!skillAggregation.has(skill)) {
              skillAggregation.set(skill, { scores: [], total: 0 });
            }
            const skillData = skillAggregation.get(skill)!;
            skillData.scores.push(data.percentage);
            skillData.total += data.percentage;
          }
        });
      }
    });

    // Calculate averages and categorize
    const skillAverages = new Map<string, number>();
    skillAggregation.forEach((data, skill) => {
      skillAverages.set(skill, data.total / data.scores.length);
    });

    const sortedSkills = Array.from(skillAverages.entries())
      .sort((a, b) => b[1] - a[1]);

    const strongestAreas = sortedSkills.slice(0, 3).map(s => s[0]);
    const weakestAreas = sortedSkills.slice(-3).map(s => s[0]).reverse();
    const masteredSkills = sortedSkills.filter(s => s[1] >= 90).map(s => s[0]);
    const improvementAreas = sortedSkills.filter(s => s[1] >= 60 && s[1] < 80).map(s => s[0]);

    return {
      strongestAreas,
      weakestAreas,
      improvementAreas,
      masteredSkills
    };
  }
}

// ========================================================================
// Export all business logic classes
// ========================================================================

export {
  PrerequisiteManager,
  CompletionTracker,
  LearningPathManager,
  ProgressAnalytics
};