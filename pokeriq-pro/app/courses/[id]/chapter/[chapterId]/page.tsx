'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { notFound, redirect } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Course, CourseLevel } from '@prisma/client';
import VideoPlayer from '../../../../../components/player/VideoPlayer';
import ContentRenderer from '../../../../../components/player/ContentRenderer';
import ProgressTracker from '../../../../../components/player/ProgressTracker';
import NoteTaking from '../../../../../components/player/NoteTaking';
import BookmarkManager from '../../../../../components/player/BookmarkManager';
import AssessmentEmbed from '../../../../../components/player/AssessmentEmbed';
import { VideoData, ContentBlock, PlayerState, Chapter } from '../../../../../lib/player/content-types';
import { useAuth } from '../../../../../lib/auth/auth-context';
import { Loading } from '../../../../../components/ui/Loading';
import { Toast } from '../../../../../components/ui/Toast';

// Dynamic imports for performance
const InteractiveContent = dynamic(() => import('../../../../../components/player/InteractiveContent'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
});

interface ChapterPlayerPageProps {
  params: {
    id: string;
    chapterId: string;
  };
  searchParams?: {
    time?: string;
    autoplay?: string;
    fullscreen?: string;
  };
}

interface CourseData extends Course {
  chapters: Chapter[];
  userProgress?: {
    completionRate: number;
    currentSection: number;
    lastAccessed: string;
  };
}

interface ChapterData extends Chapter {
  content: ContentBlock[];
  nextChapter?: Chapter;
  prevChapter?: Chapter;
}

export default function ChapterPlayerPage({ params, searchParams }: ChapterPlayerPageProps) {
  const { user, isAuthenticated } = useAuth();
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    buffered: null,
    playbackRate: 1.0,
    volume: 1.0,
    muted: false,
    quality: 'auto',
    isFullscreen: false,
    isPictureInPicture: false,
    isBuffering: false,
    error: null
  });
  const [showSidebar, setShowSidebar] = useState(false);
  const [activePanel, setActivePanel] = useState<'notes' | 'bookmarks'>('notes');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      redirect(`/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isAuthenticated, isLoading]);

  // Load course and chapter data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load course data first
        const courseResponse = await fetch(`/api/courses/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!courseResponse.ok) {
          if (courseResponse.status === 404) {
            notFound();
          }
          throw new Error('Failed to load course data');
        }

        const course: CourseData = await courseResponse.json();
        setCourseData(course);

        // Load specific chapter data
        const chapterResponse = await fetch(`/api/courses/${params.id}/chapters/${params.chapterId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!chapterResponse.ok) {
          if (chapterResponse.status === 404) {
            notFound();
          }
          throw new Error('Failed to load chapter data');
        }

        const chapter: ChapterData = await chapterResponse.json();
        
        // Find next and previous chapters
        const currentIndex = course.chapters.findIndex(c => c.id === params.chapterId);
        if (currentIndex !== -1) {
          chapter.nextChapter = course.chapters[currentIndex + 1] || undefined;
          chapter.prevChapter = course.chapters[currentIndex - 1] || undefined;
        }

        setChapterData(chapter);

        // Handle fullscreen from search params
        if (searchParams?.fullscreen === 'true') {
          setTimeout(() => {
            const playerContainer = document.querySelector('[data-player-container]');
            if (playerContainer) {
              (playerContainer as HTMLElement).requestFullscreen?.();
            }
          }, 1000);
        }

      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load course data');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadData();
    }
  }, [params.id, params.chapterId, isAuthenticated, searchParams?.fullscreen]);

  // Handle progress updates
  const handleProgressUpdate = async (progress: {
    currentTime: number;
    duration: number;
    completionRate: number;
  }) => {
    if (!user || !chapterData) return;

    try {
      await fetch('/api/player/progress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: params.id,
          chapterId: params.chapterId,
          userId: user.id,
          currentTime: progress.currentTime,
          duration: progress.duration,
          completionRate: progress.completionRate
        })
      });
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  // Handle chapter completion and auto-navigation
  const handleChapterComplete = () => {
    if (chapterData?.nextChapter) {
      setToast({
        message: 'Chapter completed! Moving to next chapter...',
        type: 'success'
      });
      
      setTimeout(() => {
        window.location.href = `/courses/${params.id}/chapter/${chapterData.nextChapter!.id}`;
      }, 2000);
    } else {
      setToast({
        message: 'Congratulations! You have completed this course.',
        type: 'success'
      });
    }
  };

  // Handle player errors
  const handlePlayerError = (error: any) => {
    console.error('Player error:', error);
    setError(`Video player error: ${error.message || 'Unknown error'}`);
    setToast({
      message: 'Video playback error occurred. Please try refreshing the page.',
      type: 'error'
    });
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target && (e.target as Element).tagName === 'INPUT') return;
      
      switch (e.key.toLowerCase()) {
        case 'n':
          setShowSidebar(true);
          setActivePanel('notes');
          break;
        case 'b':
          setShowSidebar(true);
          setActivePanel('bookmarks');
          break;
        case 'escape':
          setShowSidebar(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Auto-resume functionality
  const startTime = useMemo(() => {
    if (searchParams?.time) {
      return parseFloat(searchParams.time);
    }
    return 0; // Could load from user progress for this specific chapter
  }, [searchParams?.time]);

  // Show loading state
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loading />
          <p className="text-gray-300 mt-4">Loading chapter...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !courseData || !chapterData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-white text-2xl mb-4">Chapter Not Available</h1>
          <p className="text-gray-300 mb-6">
            {error || 'This chapter could not be loaded. It may not exist or you may not have access to it.'}
          </p>
          <div className="space-x-4">
            <Link
              href={`/courses/${params.id}/play`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors inline-block"
            >
              Back to Course
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render main content
  const renderChapterContent = () => {
    if (!chapterData.content || chapterData.content.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
          <p className="text-gray-400">No content available for this chapter.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {chapterData.content.map((block, index) => {
          switch (block.type) {
            case 'video':
              return (
                <div key={`${block.id}-${index}`} data-player-container>
                  <VideoPlayer
                    videoData={block.data as VideoData}
                    userId={user!.id}
                    courseId={params.id}
                    contentBlockId={block.id}
                    autoplay={searchParams?.autoplay === 'true'}
                    onError={handlePlayerError}
                    onProgress={handleProgressUpdate}
                    onPlaybackStateChange={setPlayerState}
                    className="w-full"
                  />
                </div>
              );
            case 'text':
            case 'markdown':
              return (
                <ContentRenderer
                  key={`${block.id}-${index}`}
                  content={block}
                  className="bg-gray-800 p-6 rounded-lg text-white"
                />
              );
            case 'interactive':
              return (
                <InteractiveContent
                  key={`${block.id}-${index}`}
                  content={block}
                  onInteraction={(data) => console.log('Interaction:', data)}
                  className="bg-gray-800 rounded-lg"
                />
              );
            case 'assessment':
              return (
                <AssessmentEmbed
                  key={`${block.id}-${index}`}
                  assessmentData={block.data}
                  onComplete={handleChapterComplete}
                  className="bg-gray-800 rounded-lg"
                />
              );
            default:
              return (
                <div key={`${block.id}-${index}`} className="bg-gray-800 p-4 rounded-lg">
                  <p className="text-gray-400">Unsupported content type: {block.type}</p>
                </div>
              );
          }
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Navigation Header - Only visible when not in fullscreen */}
      {!playerState.isFullscreen && (
        <header className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/courses/${params.id}/play`}
                className="text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                title="Back to course overview"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div className="text-white">
                <h1 className="font-medium">{chapterData.title}</h1>
                <p className="text-sm text-gray-400">{courseData.title}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Chapter Navigation */}
              {chapterData.prevChapter && (
                <Link
                  href={`/courses/${params.id}/chapter/${chapterData.prevChapter.id}`}
                  className="text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                  title="Previous chapter"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
              )}
              
              {chapterData.nextChapter && (
                <Link
                  href={`/courses/${params.id}/chapter/${chapterData.nextChapter.id}`}
                  className="text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                  title="Next chapter"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}

              {/* Sidebar Toggle */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                title="Toggle notes and bookmarks (N)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>

              {/* Progress Indicator */}
              <ProgressTracker
                courseId={params.id}
                userId={user!.id}
                currentProgress={courseData.userProgress?.completionRate || 0}
                className="hidden sm:block"
              />
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="relative">
        {renderChapterContent()}
      </main>

      {/* Floating Sidebar */}
      {showSidebar && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowSidebar(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900 z-50 border-l border-gray-700">
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActivePanel('notes')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      activePanel === 'notes'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Notes
                  </button>
                  <button
                    onClick={() => setActivePanel('bookmarks')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      activePanel === 'bookmarks'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Bookmarks
                  </button>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto">
                {activePanel === 'notes' && (
                  <NoteTaking
                    courseId={params.id}
                    chapterId={params.chapterId}
                    userId={user!.id}
                    currentTime={playerState.currentTime}
                  />
                )}
                
                {activePanel === 'bookmarks' && (
                  <BookmarkManager
                    courseId={params.id}
                    chapterId={params.chapterId}
                    userId={user!.id}
                    currentTime={playerState.currentTime}
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      {!playerState.isFullscreen && (
        <div className="fixed bottom-4 left-4 text-xs text-gray-500">
          <div>N: Notes | B: Bookmarks | ESC: Close</div>
        </div>
      )}
    </div>
  );
}