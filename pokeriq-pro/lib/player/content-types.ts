/**
 * Content Types and Interfaces for Course Player System
 * Defines the structure for video content, interactive elements, and content blocks
 */

// ==========================================================================
// Video Data Models
// ==========================================================================

export interface VideoQuality {
  label: string; // "1080p", "720p", "480p", "auto"
  height: number;
  width: number;
  bitrate: number; // kbps
  url?: string; // HLS/DASH manifest URL
}

export interface VideoTrack {
  src: string; // Video source URL
  type: string; // "application/x-mpegURL" for HLS, "application/dash+xml" for DASH
  quality?: string;
  label?: string;
}

export interface VideoSubtitle {
  src: string;
  language: string; // "en", "zh", "zh-CN"
  label: string; // "English", "中文", etc.
  default?: boolean;
}

export interface ChapterMarker {
  id: string;
  time: number; // seconds
  title: string;
  description?: string;
  thumbnail?: string;
  type?: 'chapter' | 'section' | 'important' | 'quiz';
}

export interface VideoData {
  id: string;
  title: string;
  description?: string;
  duration: number; // seconds
  poster?: string; // poster image URL
  tracks: VideoTrack[]; // Multiple quality/format tracks
  subtitles?: VideoSubtitle[];
  chapters?: ChapterMarker[];
  thumbnailTrack?: string; // VTT file for thumbnail previews
  metadata: VideoMetadata;
}

export interface VideoMetadata {
  codec: string; // "h264", "h265", "av1"
  format: string; // "mp4", "hls", "dash"
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  bitrate: number; // kbps
  size: number; // bytes
  checksum?: string;
  uploadedAt: Date;
  transcoded: boolean;
  qualities: VideoQuality[];
}

// ==========================================================================
// Interactive Elements
// ==========================================================================

export interface InteractiveHotspot {
  id: string;
  type: 'click' | 'hover' | 'quiz' | 'note' | 'link';
  position: {
    x: number; // percentage (0-100)
    y: number; // percentage (0-100)
  };
  size: {
    width: number; // percentage
    height: number; // percentage
  };
  timeRange: {
    start: number; // seconds
    end: number; // seconds
  };
  content: {
    title?: string;
    description?: string;
    action?: string; // URL or action identifier
    data?: any; // Additional data for the interaction
  };
  styling?: {
    backgroundColor?: string;
    borderColor?: string;
    opacity?: number;
    animation?: 'pulse' | 'fade' | 'bounce' | 'none';
  };
}

export interface InteractiveScenario {
  id: string;
  title: string;
  description: string;
  triggerTime: number; // seconds when scenario becomes active
  scenario: {
    situation: string;
    context: any; // Poker game state or other context
    choices: Array<{
      id: string;
      text: string;
      feedback?: string;
      isOptimal?: boolean;
      outcome?: any;
    }>;
  };
  timeLimit?: number; // seconds to respond
  canSkip?: boolean;
  points?: number;
}

export interface InteractiveData {
  hotspots?: InteractiveHotspot[];
  scenarios?: InteractiveScenario[];
  quizzes?: InlineQuiz[];
  notes?: InteractiveNote[];
  overlays?: ContentOverlay[];
}

export interface InlineQuiz {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'poker-scenario';
  question: string;
  triggerTime: number; // seconds when quiz appears
  pauseVideo?: boolean;
  timeLimit?: number; // seconds
  options?: string[]; // for multiple choice
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface InteractiveNote {
  id: string;
  time: number; // seconds
  content: string;
  author?: string;
  type: 'student' | 'instructor' | 'system';
  isPublic?: boolean;
  replies?: InteractiveNote[];
  metadata?: {
    importance?: 'low' | 'medium' | 'high';
    category?: string;
    tags?: string[];
  };
}

export interface ContentOverlay {
  id: string;
  type: 'text' | 'image' | 'html' | 'component';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'custom';
  timeRange: {
    start: number;
    end: number;
  };
  content: string; // Text content, HTML, or component identifier
  styling?: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: string;
    padding?: string;
    borderRadius?: string;
    opacity?: number;
  };
  customPosition?: {
    x: number; // percentage
    y: number; // percentage
  };
}

// ==========================================================================
// Content Block System
// ==========================================================================

export interface ContentMetadata {
  id: string;
  title?: string;
  description?: string;
  duration?: number; // seconds for video, estimated reading time for text
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  prerequisites?: string[];
  learningObjectives?: string[];
  assessmentCriteria?: string[];
  lastUpdated: Date;
  version: string;
  author?: string;
}

export interface InteractionConfig {
  enabled: boolean;
  allowNotes?: boolean;
  allowBookmarks?: boolean;
  allowDiscussion?: boolean;
  trackProgress?: boolean;
  requireCompletion?: boolean;
  minimumWatchTime?: number; // percentage (0-100)
  pauseOnInteraction?: boolean;
}

export interface ContentBlock {
  id: string;
  type: 'video' | 'text' | 'interactive' | 'assessment' | 'code' | 'image';
  order: number; // For sequencing
  data: {
    content: string | VideoData | InteractiveData | AssessmentData | CodeData | ImageData;
    metadata: ContentMetadata;
    interactions: InteractionConfig;
  };
}

export interface TextContent {
  format: 'markdown' | 'html' | 'plain';
  content: string;
  estimatedReadingTime: number; // minutes
  wordCount: number;
  language: string;
  tableOfContents?: Array<{
    level: number;
    title: string;
    anchor: string;
  }>;
}

export interface AssessmentData {
  id: string;
  type: 'quiz' | 'scenario' | 'coding' | 'case-study';
  questions: any[]; // Defined by existing assessment system
  passingScore: number;
  timeLimit?: number;
  attempts: number;
  randomizeQuestions?: boolean;
  showFeedback?: boolean;
}

export interface CodeData {
  language: string; // "javascript", "python", "typescript", etc.
  code: string;
  title?: string;
  description?: string;
  isRunnable?: boolean;
  expectedOutput?: string;
  tests?: Array<{
    input: any;
    expectedOutput: any;
    description?: string;
  }>;
}

export interface ImageData {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  format: 'jpeg' | 'png' | 'webp' | 'svg';
  sizes?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  metadata?: {
    exif?: any;
    uploadedAt: Date;
    size: number;
  };
}

// ==========================================================================
// Player State and Configuration
// ==========================================================================

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number; // seconds
  duration: number; // seconds
  buffered: TimeRanges | null;
  playbackRate: number; // 0.5, 1.0, 1.25, 1.5, 2.0
  volume: number; // 0-1
  muted: boolean;
  quality: string; // "auto", "1080p", "720p", etc.
  isFullscreen: boolean;
  isPictureInPicture: boolean;
  isBuffering: boolean;
  error: string | null;
}

export interface PlayerPreferences {
  defaultQuality: string;
  defaultPlaybackRate: number;
  autoplay: boolean;
  showSubtitles: boolean;
  subtitleLanguage: string;
  volume: number;
  keyboardShortcuts: boolean;
  skipIntroOutro: boolean;
  rememberPosition: boolean;
  theme: 'dark' | 'light' | 'auto';
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
  };
}

export interface PlayerCapabilities {
  supportsHLS: boolean;
  supportsDASH: boolean;
  supportsWebVTT: boolean;
  supportsPictureInPicture: boolean;
  supportsFullscreen: boolean;
  supportsKeyboard: boolean;
  supportsTouch: boolean;
  maxResolution: {
    width: number;
    height: number;
  };
  codecs: string[];
  bandwidth: number; // estimated bandwidth in kbps
}

// ==========================================================================
// Progress Tracking
// ==========================================================================

export interface ProgressData {
  courseId: string;
  userId: string;
  contentBlockId: string;
  currentTime: number; // current playback position
  totalTime: number; // total content duration
  completionRate: number; // percentage 0-100
  watchTime: number; // total time actually watched
  interactions: InteractionEvent[];
  bookmarks: Bookmark[];
  notes: StudentNote[];
  assessmentScores: AssessmentResult[];
  lastPosition: number; // last known position for resume
  completedSections: string[]; // IDs of completed content blocks
  startedAt: Date;
  lastUpdated: Date;
  completedAt?: Date;
}

export interface InteractionEvent {
  id: string;
  type: 'play' | 'pause' | 'seek' | 'quality-change' | 'speed-change' | 'hotspot-click' | 'quiz-answer' | 'note-add' | 'bookmark-add';
  timestamp: Date;
  data: {
    time?: number; // playback time when event occurred
    from?: number; // for seek events
    to?: number; // for seek events
    value?: any; // additional event data
  };
  metadata?: {
    sessionId: string;
    deviceType: string;
    browserInfo: string;
  };
}

export interface Bookmark {
  id: string;
  time: number; // seconds
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentNote {
  id: string;
  time: number; // seconds
  content: string;
  type: 'private' | 'shared' | 'public';
  category?: string;
  tags?: string[];
  attachments?: string[];
  replies?: StudentNote[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentResult {
  assessmentId: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  timeTaken: number; // seconds
  completedAt: Date;
  answers: any[];
  feedback?: string;
}

// ==========================================================================
// Error Handling and Logging
// ==========================================================================

export interface PlayerError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
  suggestions?: string[];
}

export interface PlayerLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  timestamp: Date;
  sessionId: string;
  component?: string;
}

// ==========================================================================
// Export Types
// ==========================================================================

export type ContentType = 'video' | 'text' | 'interactive' | 'assessment' | 'code' | 'image';
export type PlaybackRate = 0.5 | 0.75 | 1.0 | 1.25 | 1.5 | 1.75 | 2.0;
export type VideoFormat = 'mp4' | 'hls' | 'dash' | 'webm';
export type InteractionType = 'click' | 'hover' | 'quiz' | 'note' | 'link' | 'hotspot';
export type PlayerTheme = 'dark' | 'light' | 'auto';
export type PlayerSize = 'small' | 'medium' | 'large' | 'fullscreen';

// Re-export everything as a namespace for cleaner imports
export namespace PlayerTypes {
  export type {
    VideoData,
    VideoQuality,
    VideoTrack,
    VideoSubtitle,
    ChapterMarker,
    VideoMetadata,
    InteractiveHotspot,
    InteractiveScenario,
    InteractiveData,
    InlineQuiz,
    InteractiveNote,
    ContentOverlay,
    ContentBlock,
    ContentMetadata,
    InteractionConfig,
    TextContent,
    AssessmentData,
    CodeData,
    ImageData,
    PlaybackState,
    PlayerPreferences,
    PlayerCapabilities,
    ProgressData,
    InteractionEvent,
    Bookmark,
    StudentNote,
    AssessmentResult,
    PlayerError,
    PlayerLog
  };
}