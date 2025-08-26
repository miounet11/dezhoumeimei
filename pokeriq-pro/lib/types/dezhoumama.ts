/**
 * TypeScript Types for Dezhoumama Learning Platform
 * Generated from Prisma schema models
 */

import { Prisma } from '@prisma/client';

// ==========================================================================
// Core Learning Platform Types
// ==========================================================================

// Course Management Types
export interface Course {
  id: string;
  title: string;
  description: string | null;
  level: CourseLevel;
  contentPath: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  durationMinutes: number | null;
  prerequisites: string[]; // Array of course IDs
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseWithRelations extends Course {
  assessments: Assessment[];
  userProgress: UserProgress[];
}

export interface CreateCourseInput {
  title: string;
  description?: string;
  level: CourseLevel;
  contentPath?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  durationMinutes?: number;
  prerequisites?: string[];
  tags?: string[];
  isActive?: boolean;
}

export interface UpdateCourseInput extends Partial<CreateCourseInput> {
  id: string;
}

// Assessment Types
export interface Assessment {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  questions: Prisma.JsonValue; // Structured quiz questions
  scoringConfig: Prisma.JsonValue; // Scoring rules and weights
  difficulty: string;
  passThreshold: number; // Percentage
  timeLimitMinutes: number | null;
  maxAttempts: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentWithRelations extends Assessment {
  course: Course;
  userAssessments: UserAssessment[];
}

export interface CreateAssessmentInput {
  courseId: string;
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
  scoringConfig: ScoringConfig;
  difficulty: string;
  passThreshold?: number;
  timeLimitMinutes?: number;
  maxAttempts?: number;
  isActive?: boolean;
}

export interface UpdateAssessmentInput extends Partial<CreateAssessmentInput> {
  id: string;
}

// Assessment Question Structure
export interface AssessmentQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'scenario';
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[];
}

// Scoring Configuration
export interface ScoringConfig {
  totalPoints: number;
  weightings: {
    accuracy: number;
    speed: number;
    difficulty: number;
  };
  penalties: {
    wrongAnswer: number;
    timeOverage: number;
  };
  bonuses: {
    perfectScore: number;
    speedBonus: number;
  };
}

// User Progress Types
export interface UserProgress {
  id: string;
  userId: string;
  courseId: string;
  completionRate: number; // Percentage
  currentSection: number;
  testScores: Prisma.JsonValue; // Array of assessment results
  studyTimeMinutes: number;
  lastAccessed: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProgressWithRelations extends UserProgress {
  user: User;
  course: Course;
}

export interface CreateUserProgressInput {
  userId: string;
  courseId: string;
  completionRate?: number;
  currentSection?: number;
  testScores?: TestScore[];
  studyTimeMinutes?: number;
}

export interface UpdateUserProgressInput extends Partial<CreateUserProgressInput> {
  id: string;
}

// Test Score Structure
export interface TestScore {
  assessmentId: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: Date;
  timeTaken?: number;
  skillBreakdown?: SkillBreakdown;
}

export interface SkillBreakdown {
  [skillArea: string]: {
    score: number;
    maxScore: number;
    percentage: number;
  };
}

// User Assessment Types
export interface UserAssessment {
  id: string;
  userId: string;
  assessmentId: string;
  score: number;
  maxScore: number;
  timeTaken: number | null; // Seconds
  answers: Prisma.JsonValue;
  skillBreakdown: Prisma.JsonValue | null;
  completedAt: Date;
}

export interface UserAssessmentWithRelations extends UserAssessment {
  user: User;
  assessment: Assessment;
}

export interface CreateUserAssessmentInput {
  userId: string;
  assessmentId: string;
  score: number;
  maxScore: number;
  timeTaken?: number;
  answers: AssessmentAnswer[];
  skillBreakdown?: SkillBreakdown;
}

// Assessment Answer Structure
export interface AssessmentAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  points: number;
  timeTaken?: number;
}

// Learning Character Types
export interface LearningCharacter {
  id: string;
  name: string;
  displayName: string;
  personalityConfig: Prisma.JsonValue; // AI personality parameters
  avatarUrl: string | null;
  specialization: string; // tournament, cash, theory, etc.
  description: string | null;
  backstory: string | null;
  skillLevel: CharacterSkillLevel;
  conversationStyle: CharacterStyle;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningCharacterWithRelations extends LearningCharacter {
  chatSessions: ChatSession[];
}

export interface CreateLearningCharacterInput {
  name: string;
  displayName: string;
  personalityConfig: PersonalityConfig;
  avatarUrl?: string;
  specialization: string;
  description?: string;
  backstory?: string;
  skillLevel: CharacterSkillLevel;
  conversationStyle: CharacterStyle;
  isActive?: boolean;
}

export interface UpdateLearningCharacterInput extends Partial<CreateLearningCharacterInput> {
  id: string;
}

// Personality Configuration
export interface PersonalityConfig {
  traits: {
    friendliness: number; // 0-1
    formality: number; // 0-1
    patience: number; // 0-1
    enthusiasm: number; // 0-1
    analytical: number; // 0-1
    supportive: number; // 0-1
  };
  teachingStyle: {
    usesExamples: boolean;
    encouragesQuestions: boolean;
    providesDetails: boolean;
    usesHumor: boolean;
    givesPracticalTips: boolean;
  };
  expertise: {
    areas: string[]; // e.g., ['preflop', 'postflop', 'tournament', 'psychology']
    level: 'beginner' | 'intermediate' | 'expert' | 'master';
    specialFocus?: string[];
  };
  conversationPatterns: {
    greeting: string[];
    encouragement: string[];
    explanation: string[];
    questioning: string[];
    farewell: string[];
  };
}

// Chat Session Types
export interface ChatSession {
  id: string;
  userId: string;
  characterId: string;
  sessionName: string | null;
  conversationHistory: Prisma.JsonValue; // Array of message objects
  contextData: Prisma.JsonValue; // Session context and metadata
  isActive: boolean;
  startedAt: Date;
  lastMessageAt: Date;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSessionWithRelations extends ChatSession {
  user: User;
  character: LearningCharacter;
}

export interface CreateChatSessionInput {
  userId: string;
  characterId: string;
  sessionName?: string;
  conversationHistory?: ChatMessage[];
  contextData?: SessionContext;
}

export interface UpdateChatSessionInput extends Partial<CreateChatSessionInput> {
  id: string;
  isActive?: boolean;
  endedAt?: Date;
}

// Chat Message Structure
export interface ChatMessage {
  id: string;
  timestamp: Date;
  sender: 'user' | 'character' | 'system';
  content: string;
  metadata?: {
    emotionalTone?: string;
    confidence?: number;
    processingTime?: number;
    suggestedFollowups?: string[];
  };
}

// Session Context
export interface SessionContext {
  currentTopic?: string;
  learningGoals?: string[];
  userLevel?: string;
  previousSessions?: number;
  gameContext?: {
    lastGameType?: string;
    recentPerformance?: any;
    focusAreas?: string[];
  };
  preferences?: {
    explanationDepth?: 'brief' | 'detailed' | 'comprehensive';
    exampleFrequency?: 'minimal' | 'moderate' | 'extensive';
    interactionStyle?: 'formal' | 'casual' | 'mixed';
  };
}

// ==========================================================================
// Enums (matching Prisma schema)
// ==========================================================================

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}

export enum CharacterSkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT'
}

export enum CharacterStyle {
  FRIENDLY = 'FRIENDLY',
  ANALYTICAL = 'ANALYTICAL',
  COMPETITIVE = 'COMPETITIVE',
  CASUAL = 'CASUAL',
  FORMAL = 'FORMAL',
  DIRECT = 'DIRECT',
  HUMOROUS = 'HUMOROUS'
}

// ==========================================================================
// Query and Filter Types
// ==========================================================================

// Course Filtering
export interface CourseFilters {
  level?: CourseLevel;
  tags?: string[];
  isActive?: boolean;
  hasPrerequisites?: boolean;
  search?: string;
}

export interface CourseSortOptions {
  field: 'title' | 'level' | 'createdAt' | 'durationMinutes';
  direction: 'asc' | 'desc';
}

// Assessment Filtering
export interface AssessmentFilters {
  courseId?: string;
  difficulty?: string;
  isActive?: boolean;
  search?: string;
}

export interface AssessmentSortOptions {
  field: 'title' | 'difficulty' | 'createdAt';
  direction: 'asc' | 'desc';
}

// Progress Filtering
export interface ProgressFilters {
  userId?: string;
  courseId?: string;
  completionRate?: {
    min?: number;
    max?: number;
  };
  lastAccessedAfter?: Date;
  lastAccessedBefore?: Date;
  completed?: boolean;
}

export interface ProgressSortOptions {
  field: 'completionRate' | 'lastAccessed' | 'studyTimeMinutes';
  direction: 'asc' | 'desc';
}

// Character Filtering
export interface CharacterFilters {
  specialization?: string;
  skillLevel?: CharacterSkillLevel;
  conversationStyle?: CharacterStyle;
  isActive?: boolean;
  search?: string;
}

export interface CharacterSortOptions {
  field: 'name' | 'specialization' | 'skillLevel' | 'createdAt';
  direction: 'asc' | 'desc';
}

// Chat Session Filtering
export interface ChatSessionFilters {
  userId?: string;
  characterId?: string;
  isActive?: boolean;
  startedAfter?: Date;
  startedBefore?: Date;
  lastMessageAfter?: Date;
}

export interface ChatSessionSortOptions {
  field: 'startedAt' | 'lastMessageAt' | 'createdAt';
  direction: 'asc' | 'desc';
}

// ==========================================================================
// Utility Types
// ==========================================================================

// Pagination
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Query Results
export interface QueryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTime?: number;
    recordsAffected?: number;
    cacheHit?: boolean;
  };
}

// User reference (minimal, from existing system)
export interface User {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  level: number;
  xp: number;
  createdAt: Date;
  updatedAt: Date;
}

// Learning Analytics Types
export interface LearningAnalytics {
  courseProgress: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    averageCompletionRate: number;
  };
  assessmentPerformance: {
    totalAssessments: number;
    averageScore: number;
    passRate: number;
    improvementTrend: number;
  };
  studyPatterns: {
    totalStudyTime: number;
    averageSessionDuration: number;
    mostActiveTimeOfDay: string;
    consistencyScore: number;
  };
  skillDevelopment: {
    strongestAreas: string[];
    weakestAreas: string[];
    improvementAreas: string[];
    masteredSkills: string[];
  };
}

// Export all types
export type {
  // Core types are already exported above
};