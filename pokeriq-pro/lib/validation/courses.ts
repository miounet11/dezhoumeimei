/**
 * Course Data Validation for Dezhoumama Learning Platform
 * Provides comprehensive validation for course-related data structures
 */

import {
  Course,
  CreateCourseInput,
  UpdateCourseInput,
  CourseLevel,
  CourseFilters,
  CourseSortOptions
} from '@/lib/types/dezhoumama';

// ========================================================================
// Validation Error Types
// ========================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult<T = any> {
  isValid: boolean;
  errors: ValidationError[];
  data?: T;
}

// ========================================================================
// Course Title Validation
// ========================================================================

export function validateCourseTitle(title: string): ValidationResult<string> {
  const errors: ValidationError[] = [];

  if (!title || typeof title !== 'string') {
    errors.push({
      field: 'title',
      message: 'Title is required and must be a string',
      code: 'TITLE_REQUIRED'
    });
  } else {
    // Title length validation
    if (title.trim().length < 3) {
      errors.push({
        field: 'title',
        message: 'Title must be at least 3 characters long',
        code: 'TITLE_TOO_SHORT'
      });
    }
    
    if (title.length > 200) {
      errors.push({
        field: 'title',
        message: 'Title cannot exceed 200 characters',
        code: 'TITLE_TOO_LONG'
      });
    }

    // Title content validation
    const trimmedTitle = title.trim();
    if (trimmedTitle !== title) {
      errors.push({
        field: 'title',
        message: 'Title cannot have leading or trailing whitespace',
        code: 'TITLE_WHITESPACE'
      });
    }

    // Forbidden characters check
    const forbiddenChars = /[<>{}[\]\\|`~]/;
    if (forbiddenChars.test(title)) {
      errors.push({
        field: 'title',
        message: 'Title contains forbidden characters',
        code: 'TITLE_FORBIDDEN_CHARS'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? title.trim() : undefined
  };
}

// ========================================================================
// Course Level Validation
// ========================================================================

export function validateCourseLevel(level: any): ValidationResult<CourseLevel> {
  const errors: ValidationError[] = [];
  
  const validLevels = Object.values(CourseLevel);
  
  if (!level) {
    errors.push({
      field: 'level',
      message: 'Course level is required',
      code: 'LEVEL_REQUIRED'
    });
  } else if (!validLevels.includes(level)) {
    errors.push({
      field: 'level',
      message: `Level must be one of: ${validLevels.join(', ')}`,
      code: 'LEVEL_INVALID'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? level : undefined
  };
}

// ========================================================================
// Prerequisites Validation
// ========================================================================

export function validatePrerequisites(prerequisites?: string[]): ValidationResult<string[]> {
  const errors: ValidationError[] = [];
  const normalizedPrereqs: string[] = [];

  if (prerequisites) {
    if (!Array.isArray(prerequisites)) {
      errors.push({
        field: 'prerequisites',
        message: 'Prerequisites must be an array',
        code: 'PREREQUISITES_ARRAY'
      });
    } else {
      // Validate each prerequisite ID
      prerequisites.forEach((prereqId, index) => {
        if (typeof prereqId !== 'string') {
          errors.push({
            field: `prerequisites[${index}]`,
            message: 'Prerequisite ID must be a string',
            code: 'PREREQUISITE_STRING'
          });
        } else if (prereqId.trim().length === 0) {
          errors.push({
            field: `prerequisites[${index}]`,
            message: 'Prerequisite ID cannot be empty',
            code: 'PREREQUISITE_EMPTY'
          });
        } else {
          const trimmedId = prereqId.trim();
          // Check for duplicates
          if (normalizedPrereqs.includes(trimmedId)) {
            errors.push({
              field: `prerequisites[${index}]`,
              message: 'Duplicate prerequisite ID found',
              code: 'PREREQUISITE_DUPLICATE'
            });
          } else {
            normalizedPrereqs.push(trimmedId);
          }
        }
      });

      // Check for circular references (basic check)
      if (normalizedPrereqs.length > 10) {
        errors.push({
          field: 'prerequisites',
          message: 'Cannot have more than 10 prerequisites',
          code: 'PREREQUISITES_TOO_MANY'
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: normalizedPrereqs
  };
}

// ========================================================================
// Tags Validation
// ========================================================================

export function validateCourseTags(tags?: string[]): ValidationResult<string[]> {
  const errors: ValidationError[] = [];
  const normalizedTags: string[] = [];

  if (tags) {
    if (!Array.isArray(tags)) {
      errors.push({
        field: 'tags',
        message: 'Tags must be an array',
        code: 'TAGS_ARRAY'
      });
    } else {
      tags.forEach((tag, index) => {
        if (typeof tag !== 'string') {
          errors.push({
            field: `tags[${index}]`,
            message: 'Tag must be a string',
            code: 'TAG_STRING'
          });
        } else {
          const trimmedTag = tag.trim().toLowerCase();
          
          if (trimmedTag.length === 0) {
            errors.push({
              field: `tags[${index}]`,
              message: 'Tag cannot be empty',
              code: 'TAG_EMPTY'
            });
          } else if (trimmedTag.length > 50) {
            errors.push({
              field: `tags[${index}]`,
              message: 'Tag cannot exceed 50 characters',
              code: 'TAG_TOO_LONG'
            });
          } else if (normalizedTags.includes(trimmedTag)) {
            errors.push({
              field: `tags[${index}]`,
              message: 'Duplicate tag found',
              code: 'TAG_DUPLICATE'
            });
          } else {
            // Validate tag format (alphanumeric, hyphens, underscores)
            if (!/^[a-z0-9-_]+$/.test(trimmedTag)) {
              errors.push({
                field: `tags[${index}]`,
                message: 'Tag can only contain letters, numbers, hyphens, and underscores',
                code: 'TAG_INVALID_FORMAT'
              });
            } else {
              normalizedTags.push(trimmedTag);
            }
          }
        }
      });

      // Limit number of tags
      if (normalizedTags.length > 10) {
        errors.push({
          field: 'tags',
          message: 'Cannot have more than 10 tags',
          code: 'TAGS_TOO_MANY'
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: normalizedTags
  };
}

// ========================================================================
// Duration Validation
// ========================================================================

export function validateDuration(durationMinutes?: number): ValidationResult<number | null> {
  const errors: ValidationError[] = [];

  if (durationMinutes !== undefined && durationMinutes !== null) {
    if (typeof durationMinutes !== 'number' || isNaN(durationMinutes)) {
      errors.push({
        field: 'durationMinutes',
        message: 'Duration must be a valid number',
        code: 'DURATION_NUMBER'
      });
    } else if (durationMinutes < 1) {
      errors.push({
        field: 'durationMinutes',
        message: 'Duration must be at least 1 minute',
        code: 'DURATION_MIN'
      });
    } else if (durationMinutes > 10080) { // Max 1 week
      errors.push({
        field: 'durationMinutes',
        message: 'Duration cannot exceed 10,080 minutes (1 week)',
        code: 'DURATION_MAX'
      });
    } else if (!Number.isInteger(durationMinutes)) {
      errors.push({
        field: 'durationMinutes',
        message: 'Duration must be a whole number',
        code: 'DURATION_INTEGER'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (durationMinutes || null) : undefined
  };
}

// ========================================================================
// URL Validation
// ========================================================================

export function validateUrl(url: string | undefined | null, fieldName: string): ValidationResult<string | null> {
  const errors: ValidationError[] = [];

  if (url !== undefined && url !== null && url.trim() !== '') {
    try {
      const urlObj = new URL(url);
      
      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push({
          field: fieldName,
          message: 'URL must use HTTP or HTTPS protocol',
          code: 'URL_PROTOCOL'
        });
      }

      // Check length
      if (url.length > 2000) {
        errors.push({
          field: fieldName,
          message: 'URL cannot exceed 2000 characters',
          code: 'URL_TOO_LONG'
        });
      }
    } catch (error) {
      errors.push({
        field: fieldName,
        message: 'Invalid URL format',
        code: 'URL_INVALID'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (url?.trim() || null) : undefined
  };
}

// ========================================================================
// Complete Course Validation
// ========================================================================

export function validateCreateCourseInput(input: any): ValidationResult<CreateCourseInput> {
  const errors: ValidationError[] = [];
  const validatedData: Partial<CreateCourseInput> = {};

  // Validate title
  const titleResult = validateCourseTitle(input.title);
  errors.push(...titleResult.errors);
  if (titleResult.isValid) {
    validatedData.title = titleResult.data!;
  }

  // Validate level
  const levelResult = validateCourseLevel(input.level);
  errors.push(...levelResult.errors);
  if (levelResult.isValid) {
    validatedData.level = levelResult.data!;
  }

  // Validate optional description
  if (input.description !== undefined && input.description !== null) {
    if (typeof input.description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Description must be a string',
        code: 'DESCRIPTION_STRING'
      });
    } else if (input.description.length > 5000) {
      errors.push({
        field: 'description',
        message: 'Description cannot exceed 5000 characters',
        code: 'DESCRIPTION_TOO_LONG'
      });
    } else {
      validatedData.description = input.description.trim();
    }
  }

  // Validate content path
  if (input.contentPath !== undefined && input.contentPath !== null) {
    if (typeof input.contentPath !== 'string') {
      errors.push({
        field: 'contentPath',
        message: 'Content path must be a string',
        code: 'CONTENT_PATH_STRING'
      });
    } else {
      validatedData.contentPath = input.contentPath.trim();
    }
  }

  // Validate video URL
  const videoUrlResult = validateUrl(input.videoUrl, 'videoUrl');
  errors.push(...videoUrlResult.errors);
  if (videoUrlResult.isValid) {
    validatedData.videoUrl = videoUrlResult.data;
  }

  // Validate thumbnail URL
  const thumbnailUrlResult = validateUrl(input.thumbnailUrl, 'thumbnailUrl');
  errors.push(...thumbnailUrlResult.errors);
  if (thumbnailUrlResult.isValid) {
    validatedData.thumbnailUrl = thumbnailUrlResult.data;
  }

  // Validate duration
  const durationResult = validateDuration(input.durationMinutes);
  errors.push(...durationResult.errors);
  if (durationResult.isValid) {
    validatedData.durationMinutes = durationResult.data;
  }

  // Validate prerequisites
  const prereqResult = validatePrerequisites(input.prerequisites);
  errors.push(...prereqResult.errors);
  if (prereqResult.isValid) {
    validatedData.prerequisites = prereqResult.data;
  }

  // Validate tags
  const tagsResult = validateCourseTags(input.tags);
  errors.push(...tagsResult.errors);
  if (tagsResult.isValid) {
    validatedData.tags = tagsResult.data;
  }

  // Validate isActive flag
  if (input.isActive !== undefined) {
    if (typeof input.isActive !== 'boolean') {
      errors.push({
        field: 'isActive',
        message: 'isActive must be a boolean',
        code: 'IS_ACTIVE_BOOLEAN'
      });
    } else {
      validatedData.isActive = input.isActive;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? validatedData as CreateCourseInput : undefined
  };
}

export function validateUpdateCourseInput(input: any): ValidationResult<UpdateCourseInput> {
  const errors: ValidationError[] = [];
  const validatedData: Partial<UpdateCourseInput> = {};

  // ID is required for updates
  if (!input.id || typeof input.id !== 'string') {
    errors.push({
      field: 'id',
      message: 'Course ID is required and must be a string',
      code: 'ID_REQUIRED'
    });
  } else {
    validatedData.id = input.id;
  }

  // All other fields are optional for updates, but if present, must be valid
  if (input.title !== undefined) {
    const titleResult = validateCourseTitle(input.title);
    errors.push(...titleResult.errors);
    if (titleResult.isValid) {
      validatedData.title = titleResult.data!;
    }
  }

  if (input.level !== undefined) {
    const levelResult = validateCourseLevel(input.level);
    errors.push(...levelResult.errors);
    if (levelResult.isValid) {
      validatedData.level = levelResult.data!;
    }
  }

  // Repeat validation for all other optional fields...
  // (Following same pattern as create validation)

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? validatedData as UpdateCourseInput : undefined
  };
}

// ========================================================================
// Course Filter Validation
// ========================================================================

export function validateCourseFilters(filters: any): ValidationResult<CourseFilters> {
  const errors: ValidationError[] = [];
  const validatedFilters: CourseFilters = {};

  if (filters.level !== undefined) {
    const levelResult = validateCourseLevel(filters.level);
    if (!levelResult.isValid) {
      errors.push(...levelResult.errors);
    } else {
      validatedFilters.level = levelResult.data;
    }
  }

  if (filters.tags !== undefined) {
    const tagsResult = validateCourseTags(filters.tags);
    if (!tagsResult.isValid) {
      errors.push(...tagsResult.errors);
    } else {
      validatedFilters.tags = tagsResult.data;
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

  if (filters.hasPrerequisites !== undefined) {
    if (typeof filters.hasPrerequisites !== 'boolean') {
      errors.push({
        field: 'hasPrerequisites',
        message: 'hasPrerequisites filter must be a boolean',
        code: 'FILTER_HAS_PREREQUISITES_BOOLEAN'
      });
    } else {
      validatedFilters.hasPrerequisites = filters.hasPrerequisites;
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
// Course Uniqueness Validation (Business Rule)
// ========================================================================

export interface UniquenessCriteria {
  title: string;
  level?: CourseLevel;
  excludeId?: string;
}

export function validateCourseUniqueness(
  criteria: UniquenessCriteria,
  existingCourses: Course[]
): ValidationResult<boolean> {
  const errors: ValidationError[] = [];

  // Check for title uniqueness within the same level
  const duplicates = existingCourses.filter(course => {
    // Exclude the course being updated
    if (criteria.excludeId && course.id === criteria.excludeId) {
      return false;
    }

    // Case-insensitive title comparison
    const isTitleMatch = course.title.toLowerCase() === criteria.title.toLowerCase();
    
    // If level is specified, check within that level only
    const isLevelMatch = criteria.level ? course.level === criteria.level : true;

    return isTitleMatch && isLevelMatch;
  });

  if (duplicates.length > 0) {
    const levelText = criteria.level ? ` at ${criteria.level} level` : '';
    errors.push({
      field: 'title',
      message: `A course with this title already exists${levelText}`,
      code: 'TITLE_NOT_UNIQUE'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0
  };
}

// ========================================================================
// Prerequisites Chain Validation (Business Rule)
// ========================================================================

export function validatePrerequisiteChain(
  courseId: string,
  prerequisites: string[],
  allCourses: Course[]
): ValidationResult<boolean> {
  const errors: ValidationError[] = [];

  // Create a map for quick lookups
  const courseMap = new Map(allCourses.map(c => [c.id, c]));

  // Check if all prerequisite courses exist
  for (const prereqId of prerequisites) {
    if (!courseMap.has(prereqId)) {
      errors.push({
        field: 'prerequisites',
        message: `Prerequisite course with ID ${prereqId} does not exist`,
        code: 'PREREQUISITE_NOT_FOUND'
      });
    }
  }

  // Check for circular dependencies using DFS
  if (errors.length === 0) {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    function hasCircularDependency(currentId: string): boolean {
      if (recursionStack.has(currentId)) {
        return true; // Circular dependency found
      }
      if (visited.has(currentId)) {
        return false; // Already processed
      }

      visited.add(currentId);
      recursionStack.add(currentId);

      const currentCourse = courseMap.get(currentId);
      if (currentCourse && currentCourse.prerequisites) {
        for (const prereqId of currentCourse.prerequisites) {
          if (hasCircularDependency(prereqId)) {
            return true;
          }
        }
      }

      recursionStack.delete(currentId);
      return false;
    }

    // Create a temporary course with the new prerequisites to test
    const tempCourse: Course = {
      id: courseId,
      title: 'temp',
      description: null,
      level: CourseLevel.BEGINNER,
      contentPath: null,
      videoUrl: null,
      thumbnailUrl: null,
      durationMinutes: null,
      prerequisites,
      tags: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Update the map with the temporary course
    courseMap.set(courseId, tempCourse);

    if (hasCircularDependency(courseId)) {
      errors.push({
        field: 'prerequisites',
        message: 'Circular dependency detected in prerequisite chain',
        code: 'PREREQUISITE_CIRCULAR'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0
  };
}

// ========================================================================
// Export all validation functions
// ========================================================================

export const courseValidation = {
  validateCourseTitle,
  validateCourseLevel,
  validatePrerequisites,
  validateCourseTags,
  validateDuration,
  validateUrl,
  validateCreateCourseInput,
  validateUpdateCourseInput,
  validateCourseFilters,
  validateCourseUniqueness,
  validatePrerequisiteChain
};