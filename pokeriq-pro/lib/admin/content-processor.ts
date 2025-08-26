/**
 * Content Processing Utilities
 * Handles content validation, sanitization, and processing for the CMS
 */

import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

// Content validation schemas
export interface CourseContent {
  title: string;
  description: string;
  sections: CourseSection[];
  metadata: {
    estimatedMinutes: number;
    difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    tags: string[];
    prerequisites: string[];
  };
}

export interface CourseSection {
  id: string;
  title: string;
  type: 'text' | 'video' | 'quiz' | 'interactive';
  content: string;
  resources?: ContentResource[];
  order: number;
}

export interface ContentResource {
  type: 'image' | 'video' | 'audio' | 'document' | 'link';
  url: string;
  title?: string;
  description?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Validate course content structure and data
 */
export function validateCourseContent(content: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  try {
    // Required fields validation
    if (!content.title || typeof content.title !== 'string' || content.title.trim().length === 0) {
      errors.push({
        field: 'title',
        message: 'Course title is required and must be a non-empty string',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!content.description || typeof content.description !== 'string' || content.description.trim().length === 0) {
      errors.push({
        field: 'description',
        message: 'Course description is required and must be a non-empty string',
        code: 'REQUIRED_FIELD'
      });
    }

    // Title length validation
    if (content.title && content.title.length > 255) {
      errors.push({
        field: 'title',
        message: 'Course title must not exceed 255 characters',
        code: 'FIELD_TOO_LONG'
      });
    }

    // Description length validation
    if (content.description && content.description.length > 5000) {
      warnings.push('Course description is quite long. Consider breaking it into sections.');
    }

    // Sections validation
    if (!content.sections || !Array.isArray(content.sections)) {
      errors.push({
        field: 'sections',
        message: 'Course sections must be an array',
        code: 'INVALID_TYPE'
      });
    } else {
      content.sections.forEach((section: any, index: number) => {
        const sectionErrors = validateCourseSection(section, index);
        errors.push(...sectionErrors);
      });

      if (content.sections.length === 0) {
        warnings.push('Course has no sections. Consider adding content sections.');
      }
    }

    // Metadata validation
    if (content.metadata) {
      if (content.metadata.estimatedMinutes && (typeof content.metadata.estimatedMinutes !== 'number' || content.metadata.estimatedMinutes <= 0)) {
        errors.push({
          field: 'metadata.estimatedMinutes',
          message: 'Estimated minutes must be a positive number',
          code: 'INVALID_VALUE'
        });
      }

      if (content.metadata.tags && !Array.isArray(content.metadata.tags)) {
        errors.push({
          field: 'metadata.tags',
          message: 'Tags must be an array of strings',
          code: 'INVALID_TYPE'
        });
      }

      if (content.metadata.prerequisites && !Array.isArray(content.metadata.prerequisites)) {
        errors.push({
          field: 'metadata.prerequisites',
          message: 'Prerequisites must be an array of strings',
          code: 'INVALID_TYPE'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [{
        field: 'general',
        message: 'Failed to validate content structure',
        code: 'VALIDATION_ERROR'
      }],
      warnings
    };
  }
}

/**
 * Validate individual course section
 */
function validateCourseSection(section: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];
  const fieldPrefix = `sections[${index}]`;

  if (!section.id || typeof section.id !== 'string') {
    errors.push({
      field: `${fieldPrefix}.id`,
      message: 'Section ID is required and must be a string',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!section.title || typeof section.title !== 'string' || section.title.trim().length === 0) {
    errors.push({
      field: `${fieldPrefix}.title`,
      message: 'Section title is required and must be a non-empty string',
      code: 'REQUIRED_FIELD'
    });
  }

  if (!section.type || !['text', 'video', 'quiz', 'interactive'].includes(section.type)) {
    errors.push({
      field: `${fieldPrefix}.type`,
      message: 'Section type must be one of: text, video, quiz, interactive',
      code: 'INVALID_VALUE'
    });
  }

  if (!section.content || typeof section.content !== 'string') {
    errors.push({
      field: `${fieldPrefix}.content`,
      message: 'Section content is required and must be a string',
      code: 'REQUIRED_FIELD'
    });
  }

  if (typeof section.order !== 'number' || section.order < 0) {
    errors.push({
      field: `${fieldPrefix}.order`,
      message: 'Section order must be a non-negative number',
      code: 'INVALID_VALUE'
    });
  }

  return errors;
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtmlContent(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false
  });
}

/**
 * Process Markdown content to HTML
 */
export function processMarkdownContent(markdown: string): string {
  try {
    // Configure marked options
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert line breaks to <br>
      sanitize: false, // We'll sanitize after processing
      smartypants: true // Use smart quotes and dashes
    });

    const html = marked(markdown);
    return sanitizeHtmlContent(html);
  } catch (error) {
    console.error('Markdown processing failed:', error);
    return '<p>Error processing content</p>';
  }
}

/**
 * Extract metadata from content
 */
export function extractContentMetadata(content: string): {
  wordCount: number;
  estimatedReadingTime: number;
  headings: Array<{ level: number; text: string }>;
  links: Array<{ href: string; text: string }>;
  images: Array<{ src: string; alt?: string }>;
} {
  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const estimatedReadingTime = Math.ceil(wordCount / 200); // Assuming 200 WPM reading speed

  // Extract headings (simple regex for markdown)
  const headings: Array<{ level: number; text: string }> = [];
  const headingMatches = content.match(/^(#{1,6})\s+(.+)$/gm);
  if (headingMatches) {
    headingMatches.forEach(match => {
      const level = match.match(/^#+/)?.[0].length || 0;
      const text = match.replace(/^#+\s+/, '').trim();
      headings.push({ level, text });
    });
  }

  // Extract links
  const links: Array<{ href: string; text: string }> = [];
  const linkMatches = content.match(/\[([^\]]+)\]\(([^)]+)\)/g);
  if (linkMatches) {
    linkMatches.forEach(match => {
      const linkMatch = match.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        links.push({ href: linkMatch[2], text: linkMatch[1] });
      }
    });
  }

  // Extract images
  const images: Array<{ src: string; alt?: string }> = [];
  const imageMatches = content.match(/!\[([^\]]*)\]\(([^)]+)\)/g);
  if (imageMatches) {
    imageMatches.forEach(match => {
      const imageMatch = match.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imageMatch) {
        images.push({ src: imageMatch[2], alt: imageMatch[1] || undefined });
      }
    });
  }

  return {
    wordCount,
    estimatedReadingTime,
    headings,
    links,
    images
  };
}

/**
 * Generate content summary/excerpt
 */
export function generateContentSummary(content: string, maxLength: number = 200): string {
  // Remove markdown formatting and HTML tags
  const plainText = content
    .replace(/#{1,6}\s+/g, '') // Remove markdown headers
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Find a good break point (end of sentence or word)
  const truncated = plainText.substring(0, maxLength);
  const lastSentence = truncated.lastIndexOf('.');
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSentence > maxLength * 0.7) {
    return truncated.substring(0, lastSentence + 1);
  } else if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  } else {
    return truncated + '...';
  }
}

/**
 * Validate assessment questions
 */
export function validateAssessmentQuestions(questions: any[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(questions)) {
    return {
      isValid: false,
      errors: [{
        field: 'questions',
        message: 'Questions must be an array',
        code: 'INVALID_TYPE'
      }],
      warnings: []
    };
  }

  if (questions.length === 0) {
    return {
      isValid: false,
      errors: [{
        field: 'questions',
        message: 'At least one question is required',
        code: 'REQUIRED_FIELD'
      }],
      warnings: []
    };
  }

  questions.forEach((question, index) => {
    const fieldPrefix = `questions[${index}]`;

    // Required fields
    if (!question.question || typeof question.question !== 'string' || question.question.trim().length === 0) {
      errors.push({
        field: `${fieldPrefix}.question`,
        message: 'Question text is required',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!question.type || !['multiple_choice', 'true_false', 'scenario'].includes(question.type)) {
      errors.push({
        field: `${fieldPrefix}.type`,
        message: 'Question type must be one of: multiple_choice, true_false, scenario',
        code: 'INVALID_VALUE'
      });
    }

    // Type-specific validation
    if (question.type === 'multiple_choice') {
      if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
        errors.push({
          field: `${fieldPrefix}.options`,
          message: 'Multiple choice questions must have at least 2 options',
          code: 'INVALID_VALUE'
        });
      }

      if (typeof question.correctAnswer !== 'number' || 
          question.correctAnswer < 0 || 
          question.correctAnswer >= (question.options?.length || 0)) {
        errors.push({
          field: `${fieldPrefix}.correctAnswer`,
          message: 'Correct answer must be a valid option index',
          code: 'INVALID_VALUE'
        });
      }
    }

    if (question.type === 'true_false') {
      if (!['true', 'false'].includes(question.correctAnswer)) {
        errors.push({
          field: `${fieldPrefix}.correctAnswer`,
          message: 'True/false questions must have correctAnswer as "true" or "false"',
          code: 'INVALID_VALUE'
        });
      }
    }

    // Points validation
    if (question.points && (typeof question.points !== 'number' || question.points <= 0)) {
      errors.push({
        field: `${fieldPrefix}.points`,
        message: 'Question points must be a positive number',
        code: 'INVALID_VALUE'
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Clean and optimize file uploads
 */
export function validateFileUpload(file: File): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // File size validation (50MB limit)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push({
      field: 'size',
      message: 'File size must not exceed 50MB',
      code: 'FILE_TOO_LARGE'
    });
  }

  // File type validation
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg',
    'audio/mp3', 'audio/wav', 'audio/ogg',
    'application/pdf', 'text/plain', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.type)) {
    errors.push({
      field: 'type',
      message: 'File type not supported',
      code: 'INVALID_FILE_TYPE'
    });
  }

  // Size warnings
  if (file.size > 10 * 1024 * 1024) { // 10MB
    warnings.push('Large files may take longer to upload and load for users.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}