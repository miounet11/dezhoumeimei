/**
 * Assessment Data Validation for Dezhoumama Learning Platform
 * Provides comprehensive validation for assessment-related data structures
 * including complex JSON validation for questions and scoring configurations
 */

import {
  Assessment,
  CreateAssessmentInput,
  UpdateAssessmentInput,
  AssessmentQuestion,
  ScoringConfig,
  AssessmentAnswer,
  AssessmentFilters,
  UserAssessment,
  CreateUserAssessmentInput,
  SkillBreakdown
} from '@/lib/types/dezhoumama';

import { ValidationError, ValidationResult } from './courses';

// ========================================================================
// Question Type Validation
// ========================================================================

export const VALID_QUESTION_TYPES = ['multiple-choice', 'true-false', 'short-answer', 'essay', 'scenario'] as const;
export type QuestionType = typeof VALID_QUESTION_TYPES[number];

export const VALID_DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const;
export type DifficultyLevel = typeof VALID_DIFFICULTY_LEVELS[number];

// ========================================================================
// Assessment Question Validation
// ========================================================================

export function validateAssessmentQuestion(question: any, index: number): ValidationResult<AssessmentQuestion> {
  const errors: ValidationError[] = [];
  const fieldPrefix = `questions[${index}]`;

  // Validate question ID
  if (!question.id || typeof question.id !== 'string') {
    errors.push({
      field: `${fieldPrefix}.id`,
      message: 'Question ID is required and must be a string',
      code: 'QUESTION_ID_REQUIRED'
    });
  } else if (question.id.trim().length === 0) {
    errors.push({
      field: `${fieldPrefix}.id`,
      message: 'Question ID cannot be empty',
      code: 'QUESTION_ID_EMPTY'
    });
  }

  // Validate question type
  if (!question.type || !VALID_QUESTION_TYPES.includes(question.type)) {
    errors.push({
      field: `${fieldPrefix}.type`,
      message: `Question type must be one of: ${VALID_QUESTION_TYPES.join(', ')}`,
      code: 'QUESTION_TYPE_INVALID'
    });
  }

  // Validate question text
  if (!question.question || typeof question.question !== 'string') {
    errors.push({
      field: `${fieldPrefix}.question`,
      message: 'Question text is required and must be a string',
      code: 'QUESTION_TEXT_REQUIRED'
    });
  } else if (question.question.trim().length < 10) {
    errors.push({
      field: `${fieldPrefix}.question`,
      message: 'Question text must be at least 10 characters long',
      code: 'QUESTION_TEXT_TOO_SHORT'
    });
  } else if (question.question.length > 2000) {
    errors.push({
      field: `${fieldPrefix}.question`,
      message: 'Question text cannot exceed 2000 characters',
      code: 'QUESTION_TEXT_TOO_LONG'
    });
  }

  // Validate options (for multiple choice questions)
  if (question.type === 'multiple-choice') {
    if (!question.options || !Array.isArray(question.options)) {
      errors.push({
        field: `${fieldPrefix}.options`,
        message: 'Multiple choice questions must have an options array',
        code: 'QUESTION_OPTIONS_REQUIRED'
      });
    } else {
      if (question.options.length < 2) {
        errors.push({
          field: `${fieldPrefix}.options`,
          message: 'Multiple choice questions must have at least 2 options',
          code: 'QUESTION_OPTIONS_MIN'
        });
      } else if (question.options.length > 6) {
        errors.push({
          field: `${fieldPrefix}.options`,
          message: 'Multiple choice questions cannot have more than 6 options',
          code: 'QUESTION_OPTIONS_MAX'
        });
      }

      // Validate each option
      question.options.forEach((option: any, optionIndex: number) => {
        if (!option || typeof option !== 'string') {
          errors.push({
            field: `${fieldPrefix}.options[${optionIndex}]`,
            message: 'Option must be a non-empty string',
            code: 'QUESTION_OPTION_INVALID'
          });
        } else if (option.trim().length === 0) {
          errors.push({
            field: `${fieldPrefix}.options[${optionIndex}]`,
            message: 'Option cannot be empty',
            code: 'QUESTION_OPTION_EMPTY'
          });
        } else if (option.length > 500) {
          errors.push({
            field: `${fieldPrefix}.options[${optionIndex}]`,
            message: 'Option text cannot exceed 500 characters',
            code: 'QUESTION_OPTION_TOO_LONG'
          });
        }
      });

      // Check for duplicate options
      const uniqueOptions = new Set(question.options.map((opt: string) => opt.trim().toLowerCase()));
      if (uniqueOptions.size !== question.options.length) {
        errors.push({
          field: `${fieldPrefix}.options`,
          message: 'Duplicate options are not allowed',
          code: 'QUESTION_OPTIONS_DUPLICATE'
        });
      }
    }
  }

  // Validate correct answer
  if (question.correctAnswer === undefined || question.correctAnswer === null) {
    errors.push({
      field: `${fieldPrefix}.correctAnswer`,
      message: 'Correct answer is required',
      code: 'QUESTION_ANSWER_REQUIRED'
    });
  } else {
    // Validate based on question type
    switch (question.type) {
      case 'multiple-choice':
        if (typeof question.correctAnswer !== 'string') {
          errors.push({
            field: `${fieldPrefix}.correctAnswer`,
            message: 'Multiple choice correct answer must be a string',
            code: 'QUESTION_ANSWER_STRING'
          });
        } else if (question.options && !question.options.includes(question.correctAnswer)) {
          errors.push({
            field: `${fieldPrefix}.correctAnswer`,
            message: 'Correct answer must be one of the provided options',
            code: 'QUESTION_ANSWER_NOT_IN_OPTIONS'
          });
        }
        break;

      case 'true-false':
        if (typeof question.correctAnswer !== 'string' || !['true', 'false'].includes(question.correctAnswer.toLowerCase())) {
          errors.push({
            field: `${fieldPrefix}.correctAnswer`,
            message: 'True/false correct answer must be "true" or "false"',
            code: 'QUESTION_ANSWER_BOOLEAN'
          });
        }
        break;

      case 'short-answer':
      case 'essay':
        if (typeof question.correctAnswer !== 'string' && !Array.isArray(question.correctAnswer)) {
          errors.push({
            field: `${fieldPrefix}.correctAnswer`,
            message: 'Short answer/essay correct answer must be a string or array of strings',
            code: 'QUESTION_ANSWER_FORMAT'
          });
        } else if (Array.isArray(question.correctAnswer)) {
          // Validate array of acceptable answers
          question.correctAnswer.forEach((answer: any, answerIndex: number) => {
            if (typeof answer !== 'string' || answer.trim().length === 0) {
              errors.push({
                field: `${fieldPrefix}.correctAnswer[${answerIndex}]`,
                message: 'Each acceptable answer must be a non-empty string',
                code: 'QUESTION_ANSWER_ARRAY_ITEM'
              });
            }
          });
        }
        break;

      case 'scenario':
        // Scenario questions may have complex answer structures
        if (typeof question.correctAnswer !== 'string' && typeof question.correctAnswer !== 'object') {
          errors.push({
            field: `${fieldPrefix}.correctAnswer`,
            message: 'Scenario correct answer must be a string or object',
            code: 'QUESTION_ANSWER_SCENARIO'
          });
        }
        break;
    }
  }

  // Validate points
  if (typeof question.points !== 'number' || question.points <= 0) {
    errors.push({
      field: `${fieldPrefix}.points`,
      message: 'Question points must be a positive number',
      code: 'QUESTION_POINTS_INVALID'
    });
  } else if (question.points > 100) {
    errors.push({
      field: `${fieldPrefix}.points`,
      message: 'Question points cannot exceed 100',
      code: 'QUESTION_POINTS_MAX'
    });
  } else if (!Number.isInteger(question.points)) {
    errors.push({
      field: `${fieldPrefix}.points`,
      message: 'Question points must be a whole number',
      code: 'QUESTION_POINTS_INTEGER'
    });
  }

  // Validate difficulty
  if (!question.difficulty || !VALID_DIFFICULTY_LEVELS.includes(question.difficulty)) {
    errors.push({
      field: `${fieldPrefix}.difficulty`,
      message: `Question difficulty must be one of: ${VALID_DIFFICULTY_LEVELS.join(', ')}`,
      code: 'QUESTION_DIFFICULTY_INVALID'
    });
  }

  // Validate optional explanation
  if (question.explanation !== undefined && question.explanation !== null) {
    if (typeof question.explanation !== 'string') {
      errors.push({
        field: `${fieldPrefix}.explanation`,
        message: 'Question explanation must be a string',
        code: 'QUESTION_EXPLANATION_STRING'
      });
    } else if (question.explanation.length > 1000) {
      errors.push({
        field: `${fieldPrefix}.explanation`,
        message: 'Question explanation cannot exceed 1000 characters',
        code: 'QUESTION_EXPLANATION_TOO_LONG'
      });
    }
  }

  // Validate optional tags
  if (question.tags !== undefined && question.tags !== null) {
    if (!Array.isArray(question.tags)) {
      errors.push({
        field: `${fieldPrefix}.tags`,
        message: 'Question tags must be an array',
        code: 'QUESTION_TAGS_ARRAY'
      });
    } else {
      question.tags.forEach((tag: any, tagIndex: number) => {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          errors.push({
            field: `${fieldPrefix}.tags[${tagIndex}]`,
            message: 'Question tag must be a non-empty string',
            code: 'QUESTION_TAG_INVALID'
          });
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? question as AssessmentQuestion : undefined
  };
}

// ========================================================================
// Scoring Configuration Validation
// ========================================================================

export function validateScoringConfig(config: any): ValidationResult<ScoringConfig> {
  const errors: ValidationError[] = [];

  // Validate total points
  if (typeof config.totalPoints !== 'number' || config.totalPoints <= 0) {
    errors.push({
      field: 'scoringConfig.totalPoints',
      message: 'Total points must be a positive number',
      code: 'SCORING_TOTAL_POINTS_INVALID'
    });
  } else if (!Number.isInteger(config.totalPoints)) {
    errors.push({
      field: 'scoringConfig.totalPoints',
      message: 'Total points must be a whole number',
      code: 'SCORING_TOTAL_POINTS_INTEGER'
    });
  }

  // Validate weightings
  if (!config.weightings || typeof config.weightings !== 'object') {
    errors.push({
      field: 'scoringConfig.weightings',
      message: 'Weightings configuration is required',
      code: 'SCORING_WEIGHTINGS_REQUIRED'
    });
  } else {
    const requiredWeightings = ['accuracy', 'speed', 'difficulty'];
    
    requiredWeightings.forEach(weight => {
      if (typeof config.weightings[weight] !== 'number') {
        errors.push({
          field: `scoringConfig.weightings.${weight}`,
          message: `${weight} weighting must be a number`,
          code: 'SCORING_WEIGHTING_NUMBER'
        });
      } else if (config.weightings[weight] < 0 || config.weightings[weight] > 1) {
        errors.push({
          field: `scoringConfig.weightings.${weight}`,
          message: `${weight} weighting must be between 0 and 1`,
          code: 'SCORING_WEIGHTING_RANGE'
        });
      }
    });

    // Check if weightings sum to 1 (within tolerance)
    const totalWeight = requiredWeightings.reduce((sum, weight) => {
      return sum + (config.weightings[weight] || 0);
    }, 0);

    if (Math.abs(totalWeight - 1.0) > 0.001) {
      errors.push({
        field: 'scoringConfig.weightings',
        message: 'Weightings must sum to 1.0',
        code: 'SCORING_WEIGHTINGS_SUM'
      });
    }
  }

  // Validate penalties
  if (!config.penalties || typeof config.penalties !== 'object') {
    errors.push({
      field: 'scoringConfig.penalties',
      message: 'Penalties configuration is required',
      code: 'SCORING_PENALTIES_REQUIRED'
    });
  } else {
    const requiredPenalties = ['wrongAnswer', 'timeOverage'];
    
    requiredPenalties.forEach(penalty => {
      if (typeof config.penalties[penalty] !== 'number') {
        errors.push({
          field: `scoringConfig.penalties.${penalty}`,
          message: `${penalty} penalty must be a number`,
          code: 'SCORING_PENALTY_NUMBER'
        });
      } else if (config.penalties[penalty] < 0 || config.penalties[penalty] > 1) {
        errors.push({
          field: `scoringConfig.penalties.${penalty}`,
          message: `${penalty} penalty must be between 0 and 1`,
          code: 'SCORING_PENALTY_RANGE'
        });
      }
    });
  }

  // Validate bonuses
  if (!config.bonuses || typeof config.bonuses !== 'object') {
    errors.push({
      field: 'scoringConfig.bonuses',
      message: 'Bonuses configuration is required',
      code: 'SCORING_BONUSES_REQUIRED'
    });
  } else {
    const requiredBonuses = ['perfectScore', 'speedBonus'];
    
    requiredBonuses.forEach(bonus => {
      if (typeof config.bonuses[bonus] !== 'number') {
        errors.push({
          field: `scoringConfig.bonuses.${bonus}`,
          message: `${bonus} bonus must be a number`,
          code: 'SCORING_BONUS_NUMBER'
        });
      } else if (config.bonuses[bonus] < 0 || config.bonuses[bonus] > 2) {
        errors.push({
          field: `scoringConfig.bonuses.${bonus}`,
          message: `${bonus} bonus must be between 0 and 2`,
          code: 'SCORING_BONUS_RANGE'
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? config as ScoringConfig : undefined
  };
}

// ========================================================================
// Assessment Input Validation
// ========================================================================

export function validateCreateAssessmentInput(input: any): ValidationResult<CreateAssessmentInput> {
  const errors: ValidationError[] = [];
  const validatedData: Partial<CreateAssessmentInput> = {};

  // Validate course ID
  if (!input.courseId || typeof input.courseId !== 'string') {
    errors.push({
      field: 'courseId',
      message: 'Course ID is required and must be a string',
      code: 'ASSESSMENT_COURSE_ID_REQUIRED'
    });
  } else {
    validatedData.courseId = input.courseId;
  }

  // Validate title
  if (!input.title || typeof input.title !== 'string') {
    errors.push({
      field: 'title',
      message: 'Assessment title is required and must be a string',
      code: 'ASSESSMENT_TITLE_REQUIRED'
    });
  } else if (input.title.trim().length < 3) {
    errors.push({
      field: 'title',
      message: 'Assessment title must be at least 3 characters long',
      code: 'ASSESSMENT_TITLE_TOO_SHORT'
    });
  } else if (input.title.length > 200) {
    errors.push({
      field: 'title',
      message: 'Assessment title cannot exceed 200 characters',
      code: 'ASSESSMENT_TITLE_TOO_LONG'
    });
  } else {
    validatedData.title = input.title.trim();
  }

  // Validate optional description
  if (input.description !== undefined && input.description !== null) {
    if (typeof input.description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Assessment description must be a string',
        code: 'ASSESSMENT_DESCRIPTION_STRING'
      });
    } else if (input.description.length > 1000) {
      errors.push({
        field: 'description',
        message: 'Assessment description cannot exceed 1000 characters',
        code: 'ASSESSMENT_DESCRIPTION_TOO_LONG'
      });
    } else {
      validatedData.description = input.description.trim();
    }
  }

  // Validate questions
  if (!input.questions || !Array.isArray(input.questions)) {
    errors.push({
      field: 'questions',
      message: 'Assessment questions are required and must be an array',
      code: 'ASSESSMENT_QUESTIONS_REQUIRED'
    });
  } else if (input.questions.length === 0) {
    errors.push({
      field: 'questions',
      message: 'Assessment must have at least one question',
      code: 'ASSESSMENT_QUESTIONS_EMPTY'
    });
  } else if (input.questions.length > 100) {
    errors.push({
      field: 'questions',
      message: 'Assessment cannot have more than 100 questions',
      code: 'ASSESSMENT_QUESTIONS_TOO_MANY'
    });
  } else {
    const validatedQuestions: AssessmentQuestion[] = [];
    const questionIds = new Set<string>();

    input.questions.forEach((question: any, index: number) => {
      const questionResult = validateAssessmentQuestion(question, index);
      errors.push(...questionResult.errors);
      
      if (questionResult.isValid && questionResult.data) {
        // Check for duplicate question IDs
        if (questionIds.has(question.id)) {
          errors.push({
            field: `questions[${index}].id`,
            message: 'Duplicate question ID found',
            code: 'QUESTION_ID_DUPLICATE'
          });
        } else {
          questionIds.add(question.id);
          validatedQuestions.push(questionResult.data);
        }
      }
    });

    if (errors.length === 0) {
      validatedData.questions = validatedQuestions;
    }
  }

  // Validate scoring configuration
  if (!input.scoringConfig) {
    errors.push({
      field: 'scoringConfig',
      message: 'Scoring configuration is required',
      code: 'ASSESSMENT_SCORING_CONFIG_REQUIRED'
    });
  } else {
    const scoringResult = validateScoringConfig(input.scoringConfig);
    errors.push(...scoringResult.errors);
    if (scoringResult.isValid) {
      validatedData.scoringConfig = scoringResult.data!;
    }
  }

  // Validate difficulty
  if (!input.difficulty || typeof input.difficulty !== 'string') {
    errors.push({
      field: 'difficulty',
      message: 'Assessment difficulty is required and must be a string',
      code: 'ASSESSMENT_DIFFICULTY_REQUIRED'
    });
  } else {
    validatedData.difficulty = input.difficulty;
  }

  // Validate pass threshold
  if (input.passThreshold !== undefined) {
    if (typeof input.passThreshold !== 'number' || input.passThreshold < 0 || input.passThreshold > 100) {
      errors.push({
        field: 'passThreshold',
        message: 'Pass threshold must be a number between 0 and 100',
        code: 'ASSESSMENT_PASS_THRESHOLD_RANGE'
      });
    } else {
      validatedData.passThreshold = input.passThreshold;
    }
  }

  // Validate time limit
  if (input.timeLimitMinutes !== undefined && input.timeLimitMinutes !== null) {
    if (typeof input.timeLimitMinutes !== 'number' || input.timeLimitMinutes <= 0) {
      errors.push({
        field: 'timeLimitMinutes',
        message: 'Time limit must be a positive number',
        code: 'ASSESSMENT_TIME_LIMIT_POSITIVE'
      });
    } else if (input.timeLimitMinutes > 480) { // Max 8 hours
      errors.push({
        field: 'timeLimitMinutes',
        message: 'Time limit cannot exceed 480 minutes (8 hours)',
        code: 'ASSESSMENT_TIME_LIMIT_MAX'
      });
    } else {
      validatedData.timeLimitMinutes = input.timeLimitMinutes;
    }
  }

  // Validate max attempts
  if (input.maxAttempts !== undefined) {
    if (typeof input.maxAttempts !== 'number' || input.maxAttempts < 1 || input.maxAttempts > 10) {
      errors.push({
        field: 'maxAttempts',
        message: 'Max attempts must be a number between 1 and 10',
        code: 'ASSESSMENT_MAX_ATTEMPTS_RANGE'
      });
    } else if (!Number.isInteger(input.maxAttempts)) {
      errors.push({
        field: 'maxAttempts',
        message: 'Max attempts must be a whole number',
        code: 'ASSESSMENT_MAX_ATTEMPTS_INTEGER'
      });
    } else {
      validatedData.maxAttempts = input.maxAttempts;
    }
  }

  // Validate isActive flag
  if (input.isActive !== undefined) {
    if (typeof input.isActive !== 'boolean') {
      errors.push({
        field: 'isActive',
        message: 'isActive must be a boolean',
        code: 'ASSESSMENT_IS_ACTIVE_BOOLEAN'
      });
    } else {
      validatedData.isActive = input.isActive;
    }
  }

  // Cross-validation: Check if total points match questions
  if (validatedData.questions && validatedData.scoringConfig) {
    const calculatedTotal = validatedData.questions.reduce((sum, q) => sum + q.points, 0);
    if (calculatedTotal !== validatedData.scoringConfig.totalPoints) {
      errors.push({
        field: 'scoringConfig.totalPoints',
        message: `Total points in scoring config (${validatedData.scoringConfig.totalPoints}) must match sum of question points (${calculatedTotal})`,
        code: 'ASSESSMENT_TOTAL_POINTS_MISMATCH'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? validatedData as CreateAssessmentInput : undefined
  };
}

// ========================================================================
// Assessment Answer Validation
// ========================================================================

export function validateAssessmentAnswer(answer: any, question: AssessmentQuestion, index: number): ValidationResult<AssessmentAnswer> {
  const errors: ValidationError[] = [];
  const fieldPrefix = `answers[${index}]`;

  // Validate question ID match
  if (answer.questionId !== question.id) {
    errors.push({
      field: `${fieldPrefix}.questionId`,
      message: 'Answer question ID does not match question ID',
      code: 'ANSWER_QUESTION_ID_MISMATCH'
    });
  }

  // Validate answer format based on question type
  if (answer.answer === undefined || answer.answer === null) {
    errors.push({
      field: `${fieldPrefix}.answer`,
      message: 'Answer is required',
      code: 'ANSWER_REQUIRED'
    });
  } else {
    switch (question.type) {
      case 'multiple-choice':
        if (typeof answer.answer !== 'string') {
          errors.push({
            field: `${fieldPrefix}.answer`,
            message: 'Multiple choice answer must be a string',
            code: 'ANSWER_MC_STRING'
          });
        } else if (question.options && !question.options.includes(answer.answer)) {
          errors.push({
            field: `${fieldPrefix}.answer`,
            message: 'Answer must be one of the available options',
            code: 'ANSWER_MC_INVALID_OPTION'
          });
        }
        break;

      case 'true-false':
        if (typeof answer.answer !== 'string' || !['true', 'false'].includes(answer.answer.toLowerCase())) {
          errors.push({
            field: `${fieldPrefix}.answer`,
            message: 'True/false answer must be "true" or "false"',
            code: 'ANSWER_TF_INVALID'
          });
        }
        break;

      case 'short-answer':
      case 'essay':
        if (typeof answer.answer !== 'string') {
          errors.push({
            field: `${fieldPrefix}.answer`,
            message: 'Text answer must be a string',
            code: 'ANSWER_TEXT_STRING'
          });
        } else if (answer.answer.trim().length === 0) {
          errors.push({
            field: `${fieldPrefix}.answer`,
            message: 'Text answer cannot be empty',
            code: 'ANSWER_TEXT_EMPTY'
          });
        }
        break;

      case 'scenario':
        // Scenario answers can be strings or objects
        if (typeof answer.answer !== 'string' && typeof answer.answer !== 'object') {
          errors.push({
            field: `${fieldPrefix}.answer`,
            message: 'Scenario answer must be a string or object',
            code: 'ANSWER_SCENARIO_FORMAT'
          });
        }
        break;
    }
  }

  // Validate points (should match question points if correct, 0 if incorrect)
  if (typeof answer.points !== 'number' || answer.points < 0) {
    errors.push({
      field: `${fieldPrefix}.points`,
      message: 'Answer points must be a non-negative number',
      code: 'ANSWER_POINTS_INVALID'
    });
  } else if (answer.points > question.points) {
    errors.push({
      field: `${fieldPrefix}.points`,
      message: 'Answer points cannot exceed question points',
      code: 'ANSWER_POINTS_EXCEED'
    });
  }

  // Validate isCorrect boolean
  if (typeof answer.isCorrect !== 'boolean') {
    errors.push({
      field: `${fieldPrefix}.isCorrect`,
      message: 'isCorrect must be a boolean',
      code: 'ANSWER_IS_CORRECT_BOOLEAN'
    });
  }

  // Validate optional time taken
  if (answer.timeTaken !== undefined && answer.timeTaken !== null) {
    if (typeof answer.timeTaken !== 'number' || answer.timeTaken < 0) {
      errors.push({
        field: `${fieldPrefix}.timeTaken`,
        message: 'Time taken must be a non-negative number',
        code: 'ANSWER_TIME_TAKEN_INVALID'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? answer as AssessmentAnswer : undefined
  };
}

// ========================================================================
// User Assessment Validation
// ========================================================================

export function validateCreateUserAssessmentInput(
  input: any,
  assessment: Assessment,
  questions: AssessmentQuestion[]
): ValidationResult<CreateUserAssessmentInput> {
  const errors: ValidationError[] = [];
  const validatedData: Partial<CreateUserAssessmentInput> = {};

  // Validate user ID
  if (!input.userId || typeof input.userId !== 'string') {
    errors.push({
      field: 'userId',
      message: 'User ID is required and must be a string',
      code: 'USER_ASSESSMENT_USER_ID_REQUIRED'
    });
  } else {
    validatedData.userId = input.userId;
  }

  // Validate assessment ID
  if (input.assessmentId !== assessment.id) {
    errors.push({
      field: 'assessmentId',
      message: 'Assessment ID does not match provided assessment',
      code: 'USER_ASSESSMENT_ID_MISMATCH'
    });
  } else {
    validatedData.assessmentId = input.assessmentId;
  }

  // Validate score
  if (typeof input.score !== 'number' || input.score < 0) {
    errors.push({
      field: 'score',
      message: 'Score must be a non-negative number',
      code: 'USER_ASSESSMENT_SCORE_INVALID'
    });
  } else if (input.score > input.maxScore) {
    errors.push({
      field: 'score',
      message: 'Score cannot exceed max score',
      code: 'USER_ASSESSMENT_SCORE_EXCEED'
    });
  } else {
    validatedData.score = input.score;
  }

  // Validate max score
  if (typeof input.maxScore !== 'number' || input.maxScore <= 0) {
    errors.push({
      field: 'maxScore',
      message: 'Max score must be a positive number',
      code: 'USER_ASSESSMENT_MAX_SCORE_INVALID'
    });
  } else {
    validatedData.maxScore = input.maxScore;
  }

  // Validate answers
  if (!input.answers || !Array.isArray(input.answers)) {
    errors.push({
      field: 'answers',
      message: 'Answers are required and must be an array',
      code: 'USER_ASSESSMENT_ANSWERS_REQUIRED'
    });
  } else {
    const validatedAnswers: AssessmentAnswer[] = [];
    const answeredQuestionIds = new Set<string>();

    input.answers.forEach((answer: any, index: number) => {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) {
        errors.push({
          field: `answers[${index}].questionId`,
          message: 'Question ID not found in assessment',
          code: 'ANSWER_QUESTION_NOT_FOUND'
        });
      } else {
        const answerResult = validateAssessmentAnswer(answer, question, index);
        errors.push(...answerResult.errors);
        
        if (answerResult.isValid && answerResult.data) {
          if (answeredQuestionIds.has(answer.questionId)) {
            errors.push({
              field: `answers[${index}].questionId`,
              message: 'Duplicate answer for question',
              code: 'ANSWER_DUPLICATE'
            });
          } else {
            answeredQuestionIds.add(answer.questionId);
            validatedAnswers.push(answerResult.data);
          }
        }
      }
    });

    // Check if all questions were answered
    if (answeredQuestionIds.size !== questions.length) {
      errors.push({
        field: 'answers',
        message: 'All questions must be answered',
        code: 'USER_ASSESSMENT_INCOMPLETE'
      });
    }

    if (errors.length === 0) {
      validatedData.answers = validatedAnswers;
    }
  }

  // Validate time taken
  if (input.timeTaken !== undefined && input.timeTaken !== null) {
    if (typeof input.timeTaken !== 'number' || input.timeTaken < 0) {
      errors.push({
        field: 'timeTaken',
        message: 'Time taken must be a non-negative number',
        code: 'USER_ASSESSMENT_TIME_INVALID'
      });
    } else {
      validatedData.timeTaken = input.timeTaken;
    }
  }

  // Validate skill breakdown
  if (input.skillBreakdown !== undefined && input.skillBreakdown !== null) {
    if (typeof input.skillBreakdown !== 'object') {
      errors.push({
        field: 'skillBreakdown',
        message: 'Skill breakdown must be an object',
        code: 'USER_ASSESSMENT_SKILL_BREAKDOWN_OBJECT'
      });
    } else {
      // Validate each skill area
      Object.entries(input.skillBreakdown).forEach(([skillArea, skillData]: [string, any]) => {
        if (!skillData || typeof skillData !== 'object') {
          errors.push({
            field: `skillBreakdown.${skillArea}`,
            message: 'Skill data must be an object',
            code: 'SKILL_BREAKDOWN_DATA_OBJECT'
          });
        } else {
          const requiredFields = ['score', 'maxScore', 'percentage'];
          requiredFields.forEach(field => {
            if (typeof skillData[field] !== 'number' || skillData[field] < 0) {
              errors.push({
                field: `skillBreakdown.${skillArea}.${field}`,
                message: `${field} must be a non-negative number`,
                code: 'SKILL_BREAKDOWN_FIELD_INVALID'
              });
            }
          });

          // Validate percentage calculation
          if (skillData.maxScore > 0) {
            const calculatedPercentage = Math.round((skillData.score / skillData.maxScore) * 100);
            if (Math.abs(skillData.percentage - calculatedPercentage) > 1) {
              errors.push({
                field: `skillBreakdown.${skillArea}.percentage`,
                message: 'Percentage does not match score calculation',
                code: 'SKILL_BREAKDOWN_PERCENTAGE_MISMATCH'
              });
            }
          }
        }
      });

      if (errors.length === 0) {
        validatedData.skillBreakdown = input.skillBreakdown;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? validatedData as CreateUserAssessmentInput : undefined
  };
}

// ========================================================================
// Assessment Filter Validation
// ========================================================================

export function validateAssessmentFilters(filters: any): ValidationResult<AssessmentFilters> {
  const errors: ValidationError[] = [];
  const validatedFilters: AssessmentFilters = {};

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

  if (filters.difficulty !== undefined) {
    if (typeof filters.difficulty !== 'string') {
      errors.push({
        field: 'difficulty',
        message: 'Difficulty filter must be a string',
        code: 'FILTER_DIFFICULTY_STRING'
      });
    } else {
      validatedFilters.difficulty = filters.difficulty;
    }
  }

  if (filters.isActive !== undefined) {
    if (typeof filters.isActive !== 'boolean') {
      errors.push({
        field: 'isActive',
        message: 'isActive filter must be a boolean',
        code: 'FILTER_IS_ACTIVE_BOOLEAN'
      });
    } else {
      validatedFilters.isActive = filters.isActive;
    }
  }

  if (filters.search !== undefined) {
    if (typeof filters.search !== 'string') {
      errors.push({
        field: 'search',
        message: 'Search term must be a string',
        code: 'FILTER_SEARCH_STRING'
      });
    } else if (filters.search.length > 200) {
      errors.push({
        field: 'search',
        message: 'Search term cannot exceed 200 characters',
        code: 'FILTER_SEARCH_TOO_LONG'
      });
    } else {
      validatedFilters.search = filters.search.trim();
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: validatedFilters
  };
}

// ========================================================================
// Export all validation functions
// ========================================================================

export const assessmentValidation = {
  validateAssessmentQuestion,
  validateScoringConfig,
  validateCreateAssessmentInput,
  validateAssessmentAnswer,
  validateCreateUserAssessmentInput,
  validateAssessmentFilters,
  VALID_QUESTION_TYPES,
  VALID_DIFFICULTY_LEVELS
};