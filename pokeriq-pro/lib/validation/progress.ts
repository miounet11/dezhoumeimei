/**
 * Progress Data Validation for Dezhoumama Learning Platform
 * Provides comprehensive validation for user progress, test scores, and study metrics
 */

import {
  UserProgress,
  CreateUserProgressInput,
  UpdateUserProgressInput,
  TestScore,
  SkillBreakdown,
  ProgressFilters,
  ChatSession,
  CreateChatSessionInput,
  UpdateChatSessionInput,
  ChatMessage,
  SessionContext,
  PersonalityConfig,
  LearningCharacter,
  CreateLearningCharacterInput
} from '@/lib/types/dezhoumama';

import { ValidationError, ValidationResult } from './courses';

// ========================================================================
// Completion Rate Validation
// ========================================================================

export function validateCompletionRate(completionRate: number): ValidationResult<number> {
  const errors: ValidationError[] = [];

  if (typeof completionRate !== 'number') {
    errors.push({
      field: 'completionRate',
      message: 'Completion rate must be a number',
      code: 'COMPLETION_RATE_NUMBER'
    });
  } else if (isNaN(completionRate)) {
    errors.push({
      field: 'completionRate',
      message: 'Completion rate must be a valid number',
      code: 'COMPLETION_RATE_VALID'
    });
  } else if (completionRate < 0 || completionRate > 100) {
    errors.push({
      field: 'completionRate',
      message: 'Completion rate must be between 0 and 100',
      code: 'COMPLETION_RATE_RANGE'
    });
  } else if (!Number.isInteger(completionRate * 100) / 100) {
    // Allow up to 2 decimal places
    const rounded = Math.round(completionRate * 100) / 100;
    if (Math.abs(completionRate - rounded) > 0.001) {
      errors.push({
        field: 'completionRate',
        message: 'Completion rate can have at most 2 decimal places',
        code: 'COMPLETION_RATE_PRECISION'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? Math.round(completionRate * 100) / 100 : undefined
  };
}

// ========================================================================
// Study Time Validation
// ========================================================================

export function validateStudyTimeMinutes(studyTimeMinutes: number): ValidationResult<number> {
  const errors: ValidationError[] = [];

  if (typeof studyTimeMinutes !== 'number') {
    errors.push({
      field: 'studyTimeMinutes',
      message: 'Study time must be a number',
      code: 'STUDY_TIME_NUMBER'
    });
  } else if (isNaN(studyTimeMinutes)) {
    errors.push({
      field: 'studyTimeMinutes',
      message: 'Study time must be a valid number',
      code: 'STUDY_TIME_VALID'
    });
  } else if (studyTimeMinutes < 0) {
    errors.push({
      field: 'studyTimeMinutes',
      message: 'Study time cannot be negative',
      code: 'STUDY_TIME_NEGATIVE'
    });
  } else if (studyTimeMinutes > 525600) { // Max 1 year in minutes
    errors.push({
      field: 'studyTimeMinutes',
      message: 'Study time cannot exceed 525,600 minutes (1 year)',
      code: 'STUDY_TIME_MAX'
    });
  } else if (!Number.isInteger(studyTimeMinutes)) {
    errors.push({
      field: 'studyTimeMinutes',
      message: 'Study time must be a whole number of minutes',
      code: 'STUDY_TIME_INTEGER'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? studyTimeMinutes : undefined
  };
}

// ========================================================================
// Current Section Validation
// ========================================================================

export function validateCurrentSection(currentSection: number, maxSections?: number): ValidationResult<number> {
  const errors: ValidationError[] = [];

  if (typeof currentSection !== 'number') {
    errors.push({
      field: 'currentSection',
      message: 'Current section must be a number',
      code: 'CURRENT_SECTION_NUMBER'
    });
  } else if (!Number.isInteger(currentSection)) {
    errors.push({
      field: 'currentSection',
      message: 'Current section must be a whole number',
      code: 'CURRENT_SECTION_INTEGER'
    });
  } else if (currentSection < 0) {
    errors.push({
      field: 'currentSection',
      message: 'Current section cannot be negative',
      code: 'CURRENT_SECTION_NEGATIVE'
    });
  } else if (maxSections !== undefined && currentSection > maxSections) {
    errors.push({
      field: 'currentSection',
      message: `Current section cannot exceed ${maxSections}`,
      code: 'CURRENT_SECTION_MAX'
    });
  } else if (currentSection > 1000) { // Reasonable upper limit
    errors.push({
      field: 'currentSection',
      message: 'Current section cannot exceed 1000',
      code: 'CURRENT_SECTION_LIMIT'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? currentSection : undefined
  };
}

// ========================================================================
// Test Score Validation
// ========================================================================

export function validateTestScore(testScore: any, index: number): ValidationResult<TestScore> {
  const errors: ValidationError[] = [];
  const fieldPrefix = `testScores[${index}]`;

  // Validate assessment ID
  if (!testScore.assessmentId || typeof testScore.assessmentId !== 'string') {
    errors.push({
      field: `${fieldPrefix}.assessmentId`,
      message: 'Assessment ID is required and must be a string',
      code: 'TEST_SCORE_ASSESSMENT_ID'
    });
  }

  // Validate score
  if (typeof testScore.score !== 'number' || testScore.score < 0) {
    errors.push({
      field: `${fieldPrefix}.score`,
      message: 'Score must be a non-negative number',
      code: 'TEST_SCORE_SCORE_INVALID'
    });
  }

  // Validate max score
  if (typeof testScore.maxScore !== 'number' || testScore.maxScore <= 0) {
    errors.push({
      field: `${fieldPrefix}.maxScore`,
      message: 'Max score must be a positive number',
      code: 'TEST_SCORE_MAX_SCORE_INVALID'
    });
  }

  // Validate percentage
  if (typeof testScore.percentage !== 'number' || testScore.percentage < 0 || testScore.percentage > 100) {
    errors.push({
      field: `${fieldPrefix}.percentage`,
      message: 'Percentage must be a number between 0 and 100',
      code: 'TEST_SCORE_PERCENTAGE_RANGE'
    });
  }

  // Cross-validate percentage calculation
  if (typeof testScore.score === 'number' && typeof testScore.maxScore === 'number' && 
      testScore.maxScore > 0 && typeof testScore.percentage === 'number') {
    const calculatedPercentage = Math.round((testScore.score / testScore.maxScore) * 100);
    if (Math.abs(testScore.percentage - calculatedPercentage) > 1) {
      errors.push({
        field: `${fieldPrefix}.percentage`,
        message: 'Percentage does not match score calculation',
        code: 'TEST_SCORE_PERCENTAGE_MISMATCH'
      });
    }
  }

  // Validate completed date
  if (!(testScore.completedAt instanceof Date) && typeof testScore.completedAt !== 'string') {
    errors.push({
      field: `${fieldPrefix}.completedAt`,
      message: 'Completed date is required and must be a Date or date string',
      code: 'TEST_SCORE_COMPLETED_AT'
    });
  } else {
    // Try to parse date if it's a string
    let completedDate: Date;
    if (typeof testScore.completedAt === 'string') {
      completedDate = new Date(testScore.completedAt);
      if (isNaN(completedDate.getTime())) {
        errors.push({
          field: `${fieldPrefix}.completedAt`,
          message: 'Invalid date format',
          code: 'TEST_SCORE_COMPLETED_AT_INVALID'
        });
      }
    } else {
      completedDate = testScore.completedAt;
    }

    // Check if date is not in the future
    if (completedDate && completedDate.getTime() > Date.now() + 60000) { // Allow 1 minute tolerance
      errors.push({
        field: `${fieldPrefix}.completedAt`,
        message: 'Completed date cannot be in the future',
        code: 'TEST_SCORE_COMPLETED_AT_FUTURE'
      });
    }
  }

  // Validate optional time taken
  if (testScore.timeTaken !== undefined && testScore.timeTaken !== null) {
    if (typeof testScore.timeTaken !== 'number' || testScore.timeTaken < 0) {
      errors.push({
        field: `${fieldPrefix}.timeTaken`,
        message: 'Time taken must be a non-negative number',
        code: 'TEST_SCORE_TIME_TAKEN'
      });
    } else if (testScore.timeTaken > 28800) { // Max 8 hours in minutes
      errors.push({
        field: `${fieldPrefix}.timeTaken`,
        message: 'Time taken cannot exceed 28,800 minutes (8 hours)',
        code: 'TEST_SCORE_TIME_TAKEN_MAX'
      });
    }
  }

  // Validate optional skill breakdown
  if (testScore.skillBreakdown !== undefined && testScore.skillBreakdown !== null) {
    const skillBreakdownResult = validateSkillBreakdown(testScore.skillBreakdown);
    if (!skillBreakdownResult.isValid) {
      skillBreakdownResult.errors.forEach(error => {
        errors.push({
          ...error,
          field: `${fieldPrefix}.skillBreakdown.${error.field}`
        });
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? testScore as TestScore : undefined
  };
}

// ========================================================================
// Skill Breakdown Validation
// ========================================================================

export function validateSkillBreakdown(skillBreakdown: any): ValidationResult<SkillBreakdown> {
  const errors: ValidationError[] = [];

  if (typeof skillBreakdown !== 'object' || skillBreakdown === null) {
    errors.push({
      field: 'skillBreakdown',
      message: 'Skill breakdown must be an object',
      code: 'SKILL_BREAKDOWN_OBJECT'
    });
  } else {
    // Validate each skill area
    Object.entries(skillBreakdown).forEach(([skillArea, skillData]: [string, any]) => {
      if (typeof skillArea !== 'string' || skillArea.trim().length === 0) {
        errors.push({
          field: 'skillBreakdown',
          message: 'Skill area names must be non-empty strings',
          code: 'SKILL_AREA_NAME'
        });
        return;
      }

      if (!skillData || typeof skillData !== 'object') {
        errors.push({
          field: skillArea,
          message: 'Skill data must be an object',
          code: 'SKILL_DATA_OBJECT'
        });
        return;
      }

      // Validate required fields
      const requiredFields = ['score', 'maxScore', 'percentage'];
      requiredFields.forEach(field => {
        if (typeof skillData[field] !== 'number') {
          errors.push({
            field: `${skillArea}.${field}`,
            message: `${field} must be a number`,
            code: 'SKILL_FIELD_NUMBER'
          });
        } else if (skillData[field] < 0) {
          errors.push({
            field: `${skillArea}.${field}`,
            message: `${field} cannot be negative`,
            code: 'SKILL_FIELD_NEGATIVE'
          });
        }
      });

      // Validate percentage range
      if (typeof skillData.percentage === 'number' && (skillData.percentage < 0 || skillData.percentage > 100)) {
        errors.push({
          field: `${skillArea}.percentage`,
          message: 'Percentage must be between 0 and 100',
          code: 'SKILL_PERCENTAGE_RANGE'
        });
      }

      // Validate score vs maxScore
      if (typeof skillData.score === 'number' && typeof skillData.maxScore === 'number') {
        if (skillData.score > skillData.maxScore) {
          errors.push({
            field: `${skillArea}.score`,
            message: 'Score cannot exceed max score',
            code: 'SKILL_SCORE_EXCEED'
          });
        }

        // Validate percentage calculation
        if (skillData.maxScore > 0 && typeof skillData.percentage === 'number') {
          const calculatedPercentage = Math.round((skillData.score / skillData.maxScore) * 100);
          if (Math.abs(skillData.percentage - calculatedPercentage) > 1) {
            errors.push({
              field: `${skillArea}.percentage`,
              message: 'Percentage does not match score calculation',
              code: 'SKILL_PERCENTAGE_MISMATCH'
            });
          }
        }
      }
    });

    // Limit number of skill areas
    if (Object.keys(skillBreakdown).length > 20) {
      errors.push({
        field: 'skillBreakdown',
        message: 'Cannot have more than 20 skill areas',
        code: 'SKILL_BREAKDOWN_TOO_MANY'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? skillBreakdown as SkillBreakdown : undefined
  };
}

// ========================================================================
// User Progress Input Validation
// ========================================================================

export function validateCreateUserProgressInput(input: any): ValidationResult<CreateUserProgressInput> {
  const errors: ValidationError[] = [];
  const validatedData: Partial<CreateUserProgressInput> = {};

  // Validate user ID
  if (!input.userId || typeof input.userId !== 'string') {
    errors.push({
      field: 'userId',
      message: 'User ID is required and must be a string',
      code: 'PROGRESS_USER_ID_REQUIRED'
    });
  } else {
    validatedData.userId = input.userId;
  }

  // Validate course ID
  if (!input.courseId || typeof input.courseId !== 'string') {
    errors.push({
      field: 'courseId',
      message: 'Course ID is required and must be a string',
      code: 'PROGRESS_COURSE_ID_REQUIRED'
    });
  } else {
    validatedData.courseId = input.courseId;
  }

  // Validate optional completion rate
  if (input.completionRate !== undefined) {
    const completionRateResult = validateCompletionRate(input.completionRate);
    errors.push(...completionRateResult.errors);
    if (completionRateResult.isValid) {
      validatedData.completionRate = completionRateResult.data;
    }
  }

  // Validate optional current section
  if (input.currentSection !== undefined) {
    const currentSectionResult = validateCurrentSection(input.currentSection);
    errors.push(...currentSectionResult.errors);
    if (currentSectionResult.isValid) {
      validatedData.currentSection = currentSectionResult.data;
    }
  }

  // Validate optional test scores
  if (input.testScores !== undefined && input.testScores !== null) {
    if (!Array.isArray(input.testScores)) {
      errors.push({
        field: 'testScores',
        message: 'Test scores must be an array',
        code: 'PROGRESS_TEST_SCORES_ARRAY'
      });
    } else {
      const validatedTestScores: TestScore[] = [];
      const assessmentIds = new Set<string>();

      input.testScores.forEach((testScore: any, index: number) => {
        const testScoreResult = validateTestScore(testScore, index);
        errors.push(...testScoreResult.errors);

        if (testScoreResult.isValid && testScoreResult.data) {
          // Check for duplicate assessment IDs
          if (assessmentIds.has(testScore.assessmentId)) {
            errors.push({
              field: `testScores[${index}].assessmentId`,
              message: 'Duplicate assessment ID found in test scores',
              code: 'PROGRESS_TEST_SCORE_DUPLICATE'
            });
          } else {
            assessmentIds.add(testScore.assessmentId);
            validatedTestScores.push(testScoreResult.data);
          }
        }
      });

      if (errors.length === 0) {
        validatedData.testScores = validatedTestScores;
      }
    }
  }

  // Validate optional study time
  if (input.studyTimeMinutes !== undefined) {
    const studyTimeResult = validateStudyTimeMinutes(input.studyTimeMinutes);
    errors.push(...studyTimeResult.errors);
    if (studyTimeResult.isValid) {
      validatedData.studyTimeMinutes = studyTimeResult.data;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? validatedData as CreateUserProgressInput : undefined
  };
}

export function validateUpdateUserProgressInput(input: any): ValidationResult<UpdateUserProgressInput> {
  const errors: ValidationError[] = [];
  const validatedData: Partial<UpdateUserProgressInput> = {};

  // ID is required for updates
  if (!input.id || typeof input.id !== 'string') {
    errors.push({
      field: 'id',
      message: 'Progress ID is required and must be a string',
      code: 'PROGRESS_ID_REQUIRED'
    });
  } else {
    validatedData.id = input.id;
  }

  // All other fields are optional for updates, but if present, must be valid
  if (input.completionRate !== undefined) {
    const completionRateResult = validateCompletionRate(input.completionRate);
    errors.push(...completionRateResult.errors);
    if (completionRateResult.isValid) {
      validatedData.completionRate = completionRateResult.data;
    }
  }

  if (input.currentSection !== undefined) {
    const currentSectionResult = validateCurrentSection(input.currentSection);
    errors.push(...currentSectionResult.errors);
    if (currentSectionResult.isValid) {
      validatedData.currentSection = currentSectionResult.data;
    }
  }

  if (input.studyTimeMinutes !== undefined) {
    const studyTimeResult = validateStudyTimeMinutes(input.studyTimeMinutes);
    errors.push(...studyTimeResult.errors);
    if (studyTimeResult.isValid) {
      validatedData.studyTimeMinutes = studyTimeResult.data;
    }
  }

  // Handle test scores array update
  if (input.testScores !== undefined && input.testScores !== null) {
    if (!Array.isArray(input.testScores)) {
      errors.push({
        field: 'testScores',
        message: 'Test scores must be an array',
        code: 'PROGRESS_TEST_SCORES_ARRAY'
      });
    } else {
      const validatedTestScores: TestScore[] = [];
      input.testScores.forEach((testScore: any, index: number) => {
        const testScoreResult = validateTestScore(testScore, index);
        errors.push(...testScoreResult.errors);
        if (testScoreResult.isValid && testScoreResult.data) {
          validatedTestScores.push(testScoreResult.data);
        }
      });

      if (errors.length === 0) {
        validatedData.testScores = validatedTestScores;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? validatedData as UpdateUserProgressInput : undefined
  };
}

// ========================================================================
// Progress Filter Validation
// ========================================================================

export function validateProgressFilters(filters: any): ValidationResult<ProgressFilters> {
  const errors: ValidationError[] = [];
  const validatedFilters: ProgressFilters = {};

  if (filters.userId !== undefined) {
    if (typeof filters.userId !== 'string') {
      errors.push({
        field: 'userId',
        message: 'User ID filter must be a string',
        code: 'FILTER_USER_ID_STRING'
      });
    } else {
      validatedFilters.userId = filters.userId;
    }
  }

  if (filters.courseId !== undefined) {
    if (typeof filters.courseId !== 'string') {
      errors.push({
        field: 'courseId',
        message: 'Course ID filter must be a string',
        code: 'FILTER_COURSE_ID_STRING'
      });
    } else {
      validatedFilters.courseId = filters.courseId;
    }
  }

  if (filters.completionRate !== undefined) {
    if (typeof filters.completionRate !== 'object' || filters.completionRate === null) {
      errors.push({
        field: 'completionRate',
        message: 'Completion rate filter must be an object',
        code: 'FILTER_COMPLETION_RATE_OBJECT'
      });
    } else {
      const completionRateFilter: any = {};

      if (filters.completionRate.min !== undefined) {
        const minResult = validateCompletionRate(filters.completionRate.min);
        if (!minResult.isValid) {
          errors.push({
            field: 'completionRate.min',
            message: 'Invalid minimum completion rate',
            code: 'FILTER_COMPLETION_RATE_MIN'
          });
        } else {
          completionRateFilter.min = minResult.data;
        }
      }

      if (filters.completionRate.max !== undefined) {
        const maxResult = validateCompletionRate(filters.completionRate.max);
        if (!maxResult.isValid) {
          errors.push({
            field: 'completionRate.max',
            message: 'Invalid maximum completion rate',
            code: 'FILTER_COMPLETION_RATE_MAX'
          });
        } else {
          completionRateFilter.max = maxResult.data;
        }
      }

      // Validate min <= max
      if (completionRateFilter.min !== undefined && completionRateFilter.max !== undefined &&
          completionRateFilter.min > completionRateFilter.max) {
        errors.push({
          field: 'completionRate',
          message: 'Minimum completion rate cannot exceed maximum',
          code: 'FILTER_COMPLETION_RATE_RANGE'
        });
      }

      if (errors.length === 0) {
        validatedFilters.completionRate = completionRateFilter;
      }
    }
  }

  if (filters.lastAccessedAfter !== undefined) {
    const date = new Date(filters.lastAccessedAfter);
    if (isNaN(date.getTime())) {
      errors.push({
        field: 'lastAccessedAfter',
        message: 'Invalid date format for lastAccessedAfter',
        code: 'FILTER_LAST_ACCESSED_AFTER_DATE'
      });
    } else {
      validatedFilters.lastAccessedAfter = date;
    }
  }

  if (filters.lastAccessedBefore !== undefined) {
    const date = new Date(filters.lastAccessedBefore);
    if (isNaN(date.getTime())) {
      errors.push({
        field: 'lastAccessedBefore',
        message: 'Invalid date format for lastAccessedBefore',
        code: 'FILTER_LAST_ACCESSED_BEFORE_DATE'
      });
    } else {
      validatedFilters.lastAccessedBefore = date;
    }
  }

  if (filters.completed !== undefined) {
    if (typeof filters.completed !== 'boolean') {
      errors.push({
        field: 'completed',
        message: 'Completed filter must be a boolean',
        code: 'FILTER_COMPLETED_BOOLEAN'
      });
    } else {
      validatedFilters.completed = filters.completed;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: validatedFilters
  };
}

// ========================================================================
// Chat Message Validation
// ========================================================================

export function validateChatMessage(message: any, index: number): ValidationResult<ChatMessage> {
  const errors: ValidationError[] = [];
  const fieldPrefix = `conversationHistory[${index}]`;

  // Validate message ID
  if (!message.id || typeof message.id !== 'string') {
    errors.push({
      field: `${fieldPrefix}.id`,
      message: 'Message ID is required and must be a string',
      code: 'CHAT_MESSAGE_ID_REQUIRED'
    });
  }

  // Validate timestamp
  if (!(message.timestamp instanceof Date) && typeof message.timestamp !== 'string') {
    errors.push({
      field: `${fieldPrefix}.timestamp`,
      message: 'Timestamp is required and must be a Date or date string',
      code: 'CHAT_MESSAGE_TIMESTAMP_REQUIRED'
    });
  } else {
    let timestamp: Date;
    if (typeof message.timestamp === 'string') {
      timestamp = new Date(message.timestamp);
      if (isNaN(timestamp.getTime())) {
        errors.push({
          field: `${fieldPrefix}.timestamp`,
          message: 'Invalid timestamp format',
          code: 'CHAT_MESSAGE_TIMESTAMP_INVALID'
        });
      }
    }
  }

  // Validate sender
  const validSenders = ['user', 'character', 'system'];
  if (!message.sender || !validSenders.includes(message.sender)) {
    errors.push({
      field: `${fieldPrefix}.sender`,
      message: `Sender must be one of: ${validSenders.join(', ')}`,
      code: 'CHAT_MESSAGE_SENDER_INVALID'
    });
  }

  // Validate content
  if (!message.content || typeof message.content !== 'string') {
    errors.push({
      field: `${fieldPrefix}.content`,
      message: 'Message content is required and must be a string',
      code: 'CHAT_MESSAGE_CONTENT_REQUIRED'
    });
  } else if (message.content.length > 10000) {
    errors.push({
      field: `${fieldPrefix}.content`,
      message: 'Message content cannot exceed 10,000 characters',
      code: 'CHAT_MESSAGE_CONTENT_TOO_LONG'
    });
  }

  // Validate optional metadata
  if (message.metadata !== undefined && message.metadata !== null) {
    if (typeof message.metadata !== 'object') {
      errors.push({
        field: `${fieldPrefix}.metadata`,
        message: 'Message metadata must be an object',
        code: 'CHAT_MESSAGE_METADATA_OBJECT'
      });
    } else {
      // Validate specific metadata fields if present
      if (message.metadata.confidence !== undefined) {
        if (typeof message.metadata.confidence !== 'number' || 
            message.metadata.confidence < 0 || message.metadata.confidence > 1) {
          errors.push({
            field: `${fieldPrefix}.metadata.confidence`,
            message: 'Confidence must be a number between 0 and 1',
            code: 'CHAT_MESSAGE_CONFIDENCE_RANGE'
          });
        }
      }

      if (message.metadata.processingTime !== undefined) {
        if (typeof message.metadata.processingTime !== 'number' || message.metadata.processingTime < 0) {
          errors.push({
            field: `${fieldPrefix}.metadata.processingTime`,
            message: 'Processing time must be a non-negative number',
            code: 'CHAT_MESSAGE_PROCESSING_TIME'
          });
        }
      }

      if (message.metadata.suggestedFollowups !== undefined) {
        if (!Array.isArray(message.metadata.suggestedFollowups)) {
          errors.push({
            field: `${fieldPrefix}.metadata.suggestedFollowups`,
            message: 'Suggested followups must be an array',
            code: 'CHAT_MESSAGE_FOLLOWUPS_ARRAY'
          });
        } else if (message.metadata.suggestedFollowups.length > 5) {
          errors.push({
            field: `${fieldPrefix}.metadata.suggestedFollowups`,
            message: 'Cannot have more than 5 suggested followups',
            code: 'CHAT_MESSAGE_FOLLOWUPS_TOO_MANY'
          });
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? message as ChatMessage : undefined
  };
}

// ========================================================================
// Personality Configuration Validation
// ========================================================================

export function validatePersonalityConfig(config: any): ValidationResult<PersonalityConfig> {
  const errors: ValidationError[] = [];

  // Validate traits
  if (!config.traits || typeof config.traits !== 'object') {
    errors.push({
      field: 'personalityConfig.traits',
      message: 'Personality traits configuration is required',
      code: 'PERSONALITY_TRAITS_REQUIRED'
    });
  } else {
    const requiredTraits = ['friendliness', 'formality', 'patience', 'enthusiasm', 'analytical', 'supportive'];
    
    requiredTraits.forEach(trait => {
      if (typeof config.traits[trait] !== 'number') {
        errors.push({
          field: `personalityConfig.traits.${trait}`,
          message: `${trait} trait must be a number`,
          code: 'PERSONALITY_TRAIT_NUMBER'
        });
      } else if (config.traits[trait] < 0 || config.traits[trait] > 1) {
        errors.push({
          field: `personalityConfig.traits.${trait}`,
          message: `${trait} trait must be between 0 and 1`,
          code: 'PERSONALITY_TRAIT_RANGE'
        });
      }
    });
  }

  // Validate teaching style
  if (!config.teachingStyle || typeof config.teachingStyle !== 'object') {
    errors.push({
      field: 'personalityConfig.teachingStyle',
      message: 'Teaching style configuration is required',
      code: 'PERSONALITY_TEACHING_STYLE_REQUIRED'
    });
  } else {
    const requiredStyles = ['usesExamples', 'encouragesQuestions', 'providesDetails', 'usesHumor', 'givesPracticalTips'];
    
    requiredStyles.forEach(style => {
      if (typeof config.teachingStyle[style] !== 'boolean') {
        errors.push({
          field: `personalityConfig.teachingStyle.${style}`,
          message: `${style} teaching style must be a boolean`,
          code: 'PERSONALITY_TEACHING_STYLE_BOOLEAN'
        });
      }
    });
  }

  // Validate expertise
  if (!config.expertise || typeof config.expertise !== 'object') {
    errors.push({
      field: 'personalityConfig.expertise',
      message: 'Expertise configuration is required',
      code: 'PERSONALITY_EXPERTISE_REQUIRED'
    });
  } else {
    // Validate areas array
    if (!Array.isArray(config.expertise.areas)) {
      errors.push({
        field: 'personalityConfig.expertise.areas',
        message: 'Expertise areas must be an array',
        code: 'PERSONALITY_EXPERTISE_AREAS_ARRAY'
      });
    } else if (config.expertise.areas.length === 0) {
      errors.push({
        field: 'personalityConfig.expertise.areas',
        message: 'Must have at least one expertise area',
        code: 'PERSONALITY_EXPERTISE_AREAS_EMPTY'
      });
    }

    // Validate level
    const validLevels = ['beginner', 'intermediate', 'expert', 'master'];
    if (!config.expertise.level || !validLevels.includes(config.expertise.level)) {
      errors.push({
        field: 'personalityConfig.expertise.level',
        message: `Expertise level must be one of: ${validLevels.join(', ')}`,
        code: 'PERSONALITY_EXPERTISE_LEVEL_INVALID'
      });
    }
  }

  // Validate conversation patterns
  if (!config.conversationPatterns || typeof config.conversationPatterns !== 'object') {
    errors.push({
      field: 'personalityConfig.conversationPatterns',
      message: 'Conversation patterns configuration is required',
      code: 'PERSONALITY_CONVERSATION_PATTERNS_REQUIRED'
    });
  } else {
    const requiredPatterns = ['greeting', 'encouragement', 'explanation', 'questioning', 'farewell'];
    
    requiredPatterns.forEach(pattern => {
      if (!Array.isArray(config.conversationPatterns[pattern])) {
        errors.push({
          field: `personalityConfig.conversationPatterns.${pattern}`,
          message: `${pattern} patterns must be an array`,
          code: 'PERSONALITY_CONVERSATION_PATTERN_ARRAY'
        });
      } else if (config.conversationPatterns[pattern].length === 0) {
        errors.push({
          field: `personalityConfig.conversationPatterns.${pattern}`,
          message: `Must have at least one ${pattern} pattern`,
          code: 'PERSONALITY_CONVERSATION_PATTERN_EMPTY'
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? config as PersonalityConfig : undefined
  };
}

// ========================================================================
// Export all validation functions
// ========================================================================

export const progressValidation = {
  validateCompletionRate,
  validateStudyTimeMinutes,
  validateCurrentSection,
  validateTestScore,
  validateSkillBreakdown,
  validateCreateUserProgressInput,
  validateUpdateUserProgressInput,
  validateProgressFilters,
  validateChatMessage,
  validatePersonalityConfig
};