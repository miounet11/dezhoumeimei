'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Play, Pause,
  CheckCircle, Circle, Clock, BookOpen, FileText, Video, Award,
  BarChart3, Target, ArrowRight, SkipForward, SkipBack, MoreHorizontal,
  Lock, Unlock, Star, Bookmark, AlertCircle, TrendingUp, PlayCircle
} from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('chapter-navigation');

/**
 * Chapter and Section Data Structures
 */
export interface ChapterSection {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'text' | 'interactive' | 'assessment' | 'practice';
  duration?: number; // in seconds
  contentUrl?: string;
  thumbnailUrl?: string;
  isRequired: boolean;
  prerequisites?: string[]; // section IDs
  tags?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  metadata?: {
    videoLength?: number;
    wordCount?: number;
    estimatedReadTime?: number;
    practiceProblems?: number;
  };
}

export interface CourseChapter {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  isLocked: boolean;
  prerequisites?: string[]; // chapter IDs
  order: number;
  sections: ChapterSection[];
  estimatedDuration: number; // total duration in seconds
  metadata?: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    objectives: string[];
    keyTopics: string[];
  };
}

export interface ChapterProgress {
  chapterId: string;
  sectionProgress: {
    [sectionId: string]: {
      completed: boolean;
      progress: number; // 0-100
      timeSpent: number; // seconds
      lastAccessed?: Date;
      score?: number; // for assessments
      attempts?: number;
      bookmarks?: number;
      notes?: number;
    };
  };
  completionRate: number; // 0-100
  totalTimeSpent: number; // seconds
  lastAccessed?: Date;
  isCompleted: boolean;
}

interface ChapterNavigationProps {
  chapters: CourseChapter[];
  currentChapterId: string;
  currentSectionId: string;
  progress: { [chapterId: string]: ChapterProgress };
  onChapterChange: (chapterId: string) => void;
  onSectionChange: (sectionId: string, chapterId: string) => void;
  onTogglePlayPause?: () => void;
  isPlaying?: boolean;
  canNavigate?: boolean;
  showMiniMap?: boolean;
  className?: string;
}

/**
 * Section Progress Indicator Component
 */
interface SectionProgressProps {
  section: ChapterSection;
  progress?: ChapterProgress['sectionProgress'][string];
  isActive: boolean;
  isLocked: boolean;
  onClick: () => void;
  compact?: boolean;
}

const SectionProgressIndicator: React.FC<SectionProgressProps> = ({
  section,
  progress,
  isActive,
  isLocked,
  onClick,
  compact = false
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video size={compact ? 14 : 16} />;
      case 'text':
        return <FileText size={compact ? 14 : 16} />;
      case 'interactive':
        return <Target size={compact ? 14 : 16} />;
      case 'assessment':
        return <Award size={compact ? 14 : 16} />;
      case 'practice':
        return <BarChart3 size={compact ? 14 : 16} />;
      default:
        return <BookOpen size={compact ? 14 : 16} />;
    }
  };

  const getStatusIcon = () => {
    if (isLocked) {
      return <Lock size={compact ? 12 : 14} className="text-gray-400" />;
    }
    
    if (progress?.completed) {
      return <CheckCircle size={compact ? 12 : 14} className="text-green-500" />;
    }
    
    if (progress?.progress && progress.progress > 0) {
      return (
        <div className={`relative ${compact ? 'w-3 h-3' : 'w-4 h-4'}`}>
          <Circle size={compact ? 12 : 14} className="text-blue-500" />
          <div 
            className={`absolute inset-0 ${compact ? 'w-3 h-3' : 'w-4 h-4'} rounded-full border-2 border-blue-500`}
            style={{
              background: `conic-gradient(#3B82F6 0deg ${progress.progress * 3.6}deg, transparent ${progress.progress * 3.6}deg 360deg)`
            }}
          />
        </div>
      );
    }
    
    return <Circle size={compact ? 12 : 14} className="text-gray-300" />;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    return progress?.progress || 0;
  };

  return (
    <div
      onClick={onClick}
      className={`
        group cursor-pointer transition-all duration-200
        ${compact ? 'p-2' : 'p-3'} 
        ${isActive 
          ? 'bg-blue-50 border-l-4 border-blue-500' 
          : 'hover:bg-gray-50'
        }
        ${isLocked ? 'cursor-not-allowed opacity-60' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        {/* Status and Type Icons */}
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <div className={`text-gray-500 ${progress?.completed ? 'text-green-600' : ''}`}>
            {getTypeIcon(section.type)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium truncate ${compact ? 'text-sm' : 'text-base'} ${
              isActive ? 'text-blue-900' : 'text-gray-900'
            }`}>
              {section.title}
            </h4>
            
            <div className="flex items-center gap-2 ml-2">
              {/* Duration */}
              {section.duration && (
                <span className={`text-gray-500 flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                  <Clock size={compact ? 10 : 12} />
                  {formatDuration(section.duration)}
                </span>
              )}
              
              {/* Progress Indicators */}
              {progress && (
                <div className="flex items-center gap-1">
                  {progress.bookmarks && progress.bookmarks > 0 && (
                    <span className={`text-blue-500 flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                      <Bookmark size={compact ? 10 : 12} />
                      <span>{progress.bookmarks}</span>
                    </span>
                  )}
                  {progress.notes && progress.notes > 0 && (
                    <span className={`text-green-500 flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'}`}>
                      <FileText size={compact ? 10 : 12} />
                      <span>{progress.notes}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {!compact && section.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {section.description}
            </p>
          )}

          {/* Progress Bar */}
          {!compact && progress && progress.progress > 0 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all ${
                    progress.completed ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
              {progress.timeSpent > 0 && (
                <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                  <span>{Math.round(getProgressPercentage())}% complete</span>
                  <span>{formatDuration(progress.timeSpent)} spent</span>
                </div>
              )}
            </div>
          )}

          {/* Compact progress bar */}
          {compact && progress && progress.progress > 0 && (
            <div className="mt-1">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all ${
                    progress.completed ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>
          )}

          {/* Tags and Difficulty */}
          {!compact && (section.tags || section.difficulty) && (
            <div className="flex items-center gap-2 mt-2">
              {section.difficulty && (
                <span className={`px-2 py-0.5 text-xs rounded ${
                  section.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                  section.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {section.difficulty}
                </span>
              )}
              {section.isRequired && (
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                  Required
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Chapter Overview Component
 */
interface ChapterOverviewProps {
  chapter: CourseChapter;
  progress: ChapterProgress;
  isActive: boolean;
  isLocked: boolean;
  onClick: () => void;
  onToggle: () => void;
  isExpanded: boolean;
  compact?: boolean;
}

const ChapterOverview: React.FC<ChapterOverviewProps> = ({
  chapter,
  progress,
  isActive,
  isLocked,
  onClick,
  onToggle,
  isExpanded,
  compact = false
}) => {
  const completedSections = Object.values(progress.sectionProgress)
    .filter(sp => sp.completed).length;
  
  const totalSections = chapter.sections.length;
  const completionRate = progress.completionRate;

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      {/* Chapter Header */}
      <div
        className={`
          p-4 cursor-pointer transition-all hover:bg-gray-50
          ${isActive ? 'bg-blue-50' : ''}
          ${isLocked ? 'cursor-not-allowed opacity-60' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1" onClick={onClick}>
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {isLocked ? (
                <Lock size={20} className="text-gray-400" />
              ) : progress.isCompleted ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : completionRate > 0 ? (
                <div className="relative w-5 h-5">
                  <Circle size={20} className="text-blue-500" />
                  <div 
                    className="absolute inset-0 w-5 h-5 rounded-full border-2 border-blue-500"
                    style={{
                      background: `conic-gradient(#3B82F6 0deg ${completionRate * 3.6}deg, transparent ${completionRate * 3.6}deg 360deg)`
                    }}
                  />
                </div>
              ) : (
                <Circle size={20} className="text-gray-300" />
              )}
            </div>

            {/* Chapter Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${isActive ? 'text-blue-900' : 'text-gray-900'} ${compact ? 'text-base' : 'text-lg'}`}>
                  Chapter {chapter.order}: {chapter.title}
                </h3>
                <div className="flex items-center gap-3 ml-4">
                  {/* Progress Stats */}
                  <div className={`text-sm text-gray-600 flex items-center gap-4 ${compact ? 'hidden sm:flex' : ''}`}>
                    <span>{completedSections}/{totalSections} sections</span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatDuration(chapter.estimatedDuration)}
                    </span>
                    {progress.totalTimeSpent > 0 && (
                      <span className="text-blue-600">
                        {formatDuration(progress.totalTimeSpent)} spent
                      </span>
                    )}
                  </div>
                  
                  {/* Completion Percentage */}
                  <div className={`text-sm font-medium ${
                    progress.isCompleted ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {Math.round(completionRate)}%
                  </div>
                </div>
              </div>

              {!compact && chapter.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {chapter.description}
                </p>
              )}

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      progress.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              {/* Chapter Metadata */}
              {!compact && chapter.metadata && (
                <div className="flex items-center gap-4 mt-2">
                  {chapter.metadata.difficulty && (
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      chapter.metadata.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                      chapter.metadata.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {chapter.metadata.difficulty}
                    </span>
                  )}
                  {chapter.metadata.keyTopics && (
                    <span className="text-xs text-gray-500">
                      Topics: {chapter.metadata.keyTopics.slice(0, 3).join(', ')}
                      {chapter.metadata.keyTopics.length > 3 && '...'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-100 rounded ml-2 flex-shrink-0"
            disabled={isLocked}
          >
            {isExpanded ? (
              <ChevronUp size={20} className="text-gray-600" />
            ) : (
              <ChevronDown size={20} className="text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Navigation Controls Component
 */
interface NavigationControlsProps {
  currentChapter: CourseChapter;
  currentSection: ChapterSection;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onTogglePlayPause?: () => void;
  isPlaying?: boolean;
  compact?: boolean;
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
  currentChapter,
  currentSection,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onTogglePlayPause,
  isPlaying,
  compact = false
}) => {
  return (
    <div className={`border-t bg-gray-50 ${compact ? 'p-2' : 'p-4'}`}>
      <div className="flex items-center justify-between">
        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={`
            flex items-center gap-2 px-3 py-2 rounded transition-all
            ${canGoPrevious 
              ? 'text-gray-700 hover:bg-gray-200' 
              : 'text-gray-400 cursor-not-allowed'
            }
            ${compact ? 'text-sm px-2 py-1' : ''}
          `}
        >
          <SkipBack size={compact ? 16 : 18} />
          {!compact && <span>Previous</span>}
        </button>

        {/* Current Section Info */}
        <div className="flex items-center gap-3 text-center flex-1 mx-4">
          {onTogglePlayPause && currentSection.type === 'video' && (
            <button
              onClick={onTogglePlayPause}
              className={`
                p-3 rounded-full transition-all shadow-md
                ${isPlaying 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-white hover:bg-gray-50 text-blue-600'
                }
              `}
            >
              {isPlaying ? (
                <Pause size={compact ? 16 : 20} />
              ) : (
                <Play size={compact ? 16 : 20} />
              )}
            </button>
          )}
          
          {!compact && (
            <div>
              <div className="text-sm text-gray-600">
                Chapter {currentChapter.order}
              </div>
              <div className="font-medium text-gray-900">
                {currentSection.title}
              </div>
            </div>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className={`
            flex items-center gap-2 px-3 py-2 rounded transition-all
            ${canGoNext 
              ? 'text-gray-700 hover:bg-gray-200' 
              : 'text-gray-400 cursor-not-allowed'
            }
            ${compact ? 'text-sm px-2 py-1' : ''}
          `}
        >
          {!compact && <span>Next</span>}
          <SkipForward size={compact ? 16 : 18} />
        </button>
      </div>
    </div>
  );
};

/**
 * Progress Mini-Map Component
 */
interface ProgressMiniMapProps {
  chapters: CourseChapter[];
  progress: { [chapterId: string]: ChapterProgress };
  currentChapterId: string;
  currentSectionId: string;
  onSectionClick: (sectionId: string, chapterId: string) => void;
}

const ProgressMiniMap: React.FC<ProgressMiniMapProps> = ({
  chapters,
  progress,
  currentChapterId,
  currentSectionId,
  onSectionClick
}) => {
  const totalSections = chapters.reduce((total, chapter) => total + chapter.sections.length, 0);
  const completedSections = chapters.reduce((total, chapter) => {
    const chapterProgress = progress[chapter.id];
    if (!chapterProgress) return total;
    return total + Object.values(chapterProgress.sectionProgress).filter(sp => sp.completed).length;
  }, 0);

  return (
    <div className="border-t p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">Course Progress</h4>
        <span className="text-sm text-gray-600">
          {completedSections}/{totalSections} sections
        </span>
      </div>
      
      <div className="space-y-2">
        {chapters.map(chapter => {
          const chapterProgress = progress[chapter.id];
          const isCurrentChapter = chapter.id === currentChapterId;
          
          return (
            <div key={chapter.id} className={`${isCurrentChapter ? 'bg-blue-50 p-2 rounded' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${isCurrentChapter ? 'text-blue-900' : 'text-gray-700'}`}>
                  Ch {chapter.order}
                </span>
                {chapterProgress && (
                  <span className="text-xs text-gray-500">
                    {Math.round(chapterProgress.completionRate)}%
                  </span>
                )}
              </div>
              
              <div className="flex gap-1">
                {chapter.sections.map((section, index) => {
                  const sectionProgress = chapterProgress?.sectionProgress[section.id];
                  const isCurrentSection = section.id === currentSectionId;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => onSectionClick(section.id, chapter.id)}
                      className={`
                        w-6 h-2 rounded-sm transition-all hover:h-3
                        ${isCurrentSection 
                          ? 'bg-blue-600 h-3' 
                          : sectionProgress?.completed 
                            ? 'bg-green-500' 
                            : sectionProgress?.progress && sectionProgress.progress > 0
                              ? 'bg-blue-400'
                              : 'bg-gray-200'
                        }
                      `}
                      title={section.title}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 bg-green-500 rounded-full transition-all"
            style={{ width: `${(completedSections / totalSections) * 100}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">
          {Math.round((completedSections / totalSections) * 100)}% Complete
        </div>
      </div>
    </div>
  );
};

/**
 * Main ChapterNavigation Component
 */
export const ChapterNavigation: React.FC<ChapterNavigationProps> = ({
  chapters,
  currentChapterId,
  currentSectionId,
  progress,
  onChapterChange,
  onSectionChange,
  onTogglePlayPause,
  isPlaying = false,
  canNavigate = true,
  showMiniMap = true,
  className = ""
}) => {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set([currentChapterId]));
  const [isCompact, setIsCompact] = useState(false);

  const currentChapter = chapters.find(ch => ch.id === currentChapterId);
  const currentSection = currentChapter?.sections.find(sec => sec.id === currentSectionId);

  // Auto-expand current chapter
  useEffect(() => {
    setExpandedChapters(prev => new Set([...prev, currentChapterId]));
  }, [currentChapterId]);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const handleSectionClick = (sectionId: string, chapterId: string) => {
    if (!canNavigate) return;

    const chapter = chapters.find(ch => ch.id === chapterId);
    const section = chapter?.sections.find(sec => sec.id === sectionId);
    
    if (!chapter || !section) return;

    // Check if section is locked
    const isLocked = chapter.isLocked || !checkSectionUnlocked(section, chapter, progress[chapterId]);
    if (isLocked) return;

    if (chapterId !== currentChapterId) {
      onChapterChange(chapterId);
    }
    onSectionChange(sectionId, chapterId);
  };

  const checkSectionUnlocked = (
    section: ChapterSection, 
    chapter: CourseChapter, 
    chapterProgress?: ChapterProgress
  ): boolean => {
    if (chapter.isLocked) return false;
    if (!section.prerequisites || section.prerequisites.length === 0) return true;
    if (!chapterProgress) return false;

    return section.prerequisites.every(prereqId => {
      const prereqProgress = chapterProgress.sectionProgress[prereqId];
      return prereqProgress?.completed || false;
    });
  };

  const getNavigationState = () => {
    if (!currentChapter || !currentSection) return { canPrevious: false, canNext: false };

    const currentChapterIndex = chapters.findIndex(ch => ch.id === currentChapterId);
    const currentSectionIndex = currentChapter.sections.findIndex(sec => sec.id === currentSectionId);

    const canPrevious = currentChapterIndex > 0 || currentSectionIndex > 0;
    
    let canNext = false;
    if (currentSectionIndex < currentChapter.sections.length - 1) {
      canNext = true;
    } else if (currentChapterIndex < chapters.length - 1) {
      const nextChapter = chapters[currentChapterIndex + 1];
      canNext = !nextChapter.isLocked;
    }

    return { canPrevious, canNext };
  };

  const { canPrevious, canNext } = getNavigationState();

  const navigatePrevious = () => {
    if (!canNavigate || !canPrevious) return;

    const currentChapterIndex = chapters.findIndex(ch => ch.id === currentChapterId);
    const currentSectionIndex = currentChapter!.sections.findIndex(sec => sec.id === currentSectionId);

    if (currentSectionIndex > 0) {
      // Previous section in same chapter
      const previousSection = currentChapter!.sections[currentSectionIndex - 1];
      handleSectionClick(previousSection.id, currentChapterId);
    } else if (currentChapterIndex > 0) {
      // Last section of previous chapter
      const previousChapter = chapters[currentChapterIndex - 1];
      const lastSection = previousChapter.sections[previousChapter.sections.length - 1];
      handleSectionClick(lastSection.id, previousChapter.id);
    }
  };

  const navigateNext = () => {
    if (!canNavigate || !canNext) return;

    const currentChapterIndex = chapters.findIndex(ch => ch.id === currentChapterId);
    const currentSectionIndex = currentChapter!.sections.findIndex(sec => sec.id === currentSectionId);

    if (currentSectionIndex < currentChapter!.sections.length - 1) {
      // Next section in same chapter
      const nextSection = currentChapter!.sections[currentSectionIndex + 1];
      handleSectionClick(nextSection.id, currentChapterId);
    } else if (currentChapterIndex < chapters.length - 1) {
      // First section of next chapter
      const nextChapter = chapters[currentChapterIndex + 1];
      const firstSection = nextChapter.sections[0];
      handleSectionClick(firstSection.id, nextChapter.id);
    }
  };

  if (!currentChapter || !currentSection) {
    return (
      <div className={`chapter-navigation ${className}`}>
        <div className="p-4 text-center text-gray-500">
          <AlertCircle size={24} className="mx-auto mb-2" />
          <p>Chapter navigation not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`chapter-navigation ${className} flex flex-col h-full bg-white border-r`}>
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Course Navigation</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsCompact(!isCompact)}
              className="p-1 hover:bg-gray-200 rounded"
              title={isCompact ? "Expand view" : "Compact view"}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
        
        {/* Overall Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Overall Progress</span>
            <span>
              {Object.values(progress).reduce((total, chapterProgress) => {
                return total + Object.values(chapterProgress.sectionProgress).filter(sp => sp.completed).length;
              }, 0)} / {chapters.reduce((total, ch) => total + ch.sections.length, 0)} sections
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 bg-green-500 rounded-full transition-all"
              style={{ 
                width: `${(Object.values(progress).reduce((total, chapterProgress) => {
                  return total + Object.values(chapterProgress.sectionProgress).filter(sp => sp.completed).length;
                }, 0) / chapters.reduce((total, ch) => total + ch.sections.length, 0)) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Chapters List */}
      <div className="flex-1 overflow-y-auto">
        {chapters.map(chapter => {
          const chapterProgress = progress[chapter.id] || {
            chapterId: chapter.id,
            sectionProgress: {},
            completionRate: 0,
            totalTimeSpent: 0,
            isCompleted: false
          };
          
          const isExpanded = expandedChapters.has(chapter.id);
          const isActiveChapter = chapter.id === currentChapterId;
          
          return (
            <div key={chapter.id}>
              <ChapterOverview
                chapter={chapter}
                progress={chapterProgress}
                isActive={isActiveChapter}
                isLocked={chapter.isLocked}
                onClick={() => !chapter.isLocked && onChapterChange(chapter.id)}
                onToggle={() => toggleChapter(chapter.id)}
                isExpanded={isExpanded}
                compact={isCompact}
              />
              
              {isExpanded && !chapter.isLocked && (
                <div className="border-l-2 border-gray-100 ml-6">
                  {chapter.sections.map(section => {
                    const sectionProgress = chapterProgress.sectionProgress[section.id];
                    const isActiveSection = section.id === currentSectionId && isActiveChapter;
                    const isLocked = !checkSectionUnlocked(section, chapter, chapterProgress);
                    
                    return (
                      <SectionProgressIndicator
                        key={section.id}
                        section={section}
                        progress={sectionProgress}
                        isActive={isActiveSection}
                        isLocked={isLocked}
                        onClick={() => handleSectionClick(section.id, chapter.id)}
                        compact={isCompact}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mini Map */}
      {showMiniMap && !isCompact && (
        <ProgressMiniMap
          chapters={chapters}
          progress={progress}
          currentChapterId={currentChapterId}
          currentSectionId={currentSectionId}
          onSectionClick={handleSectionClick}
        />
      )}

      {/* Navigation Controls */}
      <NavigationControls
        currentChapter={currentChapter}
        currentSection={currentSection}
        canGoPrevious={canPrevious}
        canGoNext={canNext}
        onPrevious={navigatePrevious}
        onNext={navigateNext}
        onTogglePlayPause={onTogglePlayPause}
        isPlaying={isPlaying}
        compact={isCompact}
      />
    </div>
  );
};

export default ChapterNavigation;