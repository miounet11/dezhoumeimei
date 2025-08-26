'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Course, CourseLevel } from '@prisma/client';
import VideoPlayer from '../../../../components/player/VideoPlayer';
import ContentRenderer from '../../../../components/player/ContentRenderer';
import ProgressTracker from '../../../../components/player/ProgressTracker';
import ChapterNavigation from '../../../../components/player/ChapterNavigation';
import NoteTaking from '../../../../components/player/NoteTaking';
import BookmarkManager from '../../../../components/player/BookmarkManager';
import AssessmentEmbed from '../../../../components/player/AssessmentEmbed';
import { VideoData, ContentBlock, PlayerState, Chapter } from '../../../../lib/player/content-types';
import { useAuth } from '../../../../lib/auth/auth-context';
import { Loading } from '../../../../components/ui/Loading';
import { Toast } from '../../../../components/ui/Toast';

// Dynamic imports for performance
const InteractiveContent = dynamic(() => import('../../../../components/player/InteractiveContent'), {
  loading: () => <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
});

interface CoursePlayerPageProps {
  params: {
    id: string;
  };
  searchParams?: {
    chapter?: string;
    time?: string;
    autoplay?: string;
  };
}

interface CourseData extends Course {
  chapters: Chapter[];
  assessments: any[];
  userProgress?: {
    completionRate: number;
    currentSection: number;
    lastAccessed: string;
  };
}

export default function CoursePlayerPage({ params, searchParams }: CoursePlayerPageProps) {
  const { user, isAuthenticated } = useAuth();
  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentContent, setCurrentContent] = useState<ContentBlock[]>([]);
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'chapters' | 'notes' | 'bookmarks' | 'resources'>('chapters');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      window.location.href = '/auth/login?returnUrl=' + encodeURIComponent(window.location.pathname);
    }
  }, [isAuthenticated, isLoading]);

  // Load course data
  useEffect(() => {
    const loadCourseData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch course data with user progress
        const response = await fetch(`/api/courses/${params.id}/content`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error('Failed to load course data');
        }

        const data: CourseData = await response.json();
        setCourseData(data);

        // Set initial chapter
        const initialChapterId = searchParams?.chapter || data.chapters[0]?.id;
        const initialChapter = data.chapters.find(c => c.id === initialChapterId) || data.chapters[0];
        
        if (initialChapter) {
          setCurrentChapter(initialChapter);
          await loadChapterContent(initialChapter.id);
        }

      } catch (err) {
        console.error('Error loading course:', err);
        setError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadCourseData();
    }
  }, [params.id, isAuthenticated, searchParams?.chapter]);

  // Load chapter content
  const loadChapterContent = async (chapterId: string) => {
    try {
      const response = await fetch(`/api/courses/${params.id}/chapters/${chapterId}/content`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load chapter content');
      }

      const content: ContentBlock[] = await response.json();
      setCurrentContent(content);
    } catch (err) {
      console.error('Error loading chapter content:', err);
      setError('Failed to load chapter content');
    }
  };

  // Handle chapter change
  const handleChapterChange = async (chapter: Chapter) => {
    setCurrentChapter(chapter);
    await loadChapterContent(chapter.id);
    
    // Update URL without page refresh
    const url = new URL(window.location.href);
    url.searchParams.set('chapter', chapter.id);
    window.history.replaceState({}, '', url.toString());
  };

  // Handle progress updates
  const handleProgressUpdate = async (progress: {
    currentTime: number;
    duration: number;
    completionRate: number;
  }) => {
    if (!user || !currentChapter) return;

    try {
      await fetch('/api/player/progress', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: params.id,
          chapterId: currentChapter.id,
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

  // Handle player errors
  const handlePlayerError = (error: any) => {
    console.error('Player error:', error);
    setError(`Video player error: ${error.message || 'Unknown error'}`);
    setToast({
      message: 'Video playback error occurred. Please try refreshing the page.',
      type: 'error'
    });
  };

  // Auto-resume functionality
  const startTime = useMemo(() => {
    if (searchParams?.time) {
      return parseFloat(searchParams.time);
    }
    return courseData?.userProgress?.currentSection || 0;
  }, [searchParams?.time, courseData?.userProgress]);

  // Show loading state
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loading />
          <p className="text-gray-300 mt-4">Loading course...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !courseData || !currentChapter) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-white text-2xl mb-4">Course Not Available</h1>
          <p className="text-gray-300 mb-6">
            {error || 'This course could not be loaded. It may not exist or you may not have access to it.'}
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render main content based on content type
  const renderMainContent = () => {
    if (currentContent.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
          <p className="text-gray-400">No content available for this chapter.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {currentContent.map((block, index) => {
          switch (block.type) {
            case 'video':
              return (
                <VideoPlayer
                  key={`${block.id}-${index}`}
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
              );
            case 'text':
            case 'markdown':
              return (
                <ContentRenderer
                  key={`${block.id}-${index}`}
                  content={block}
                  className="bg-gray-800 p-6 rounded-lg"
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
                  onComplete={(results) => console.log('Assessment completed:', results)}
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
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="text-gray-400 hover:text-white transition-colors"
              title="Back to courses"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-white text-xl font-semibold">{courseData.title}</h1>
              {currentChapter && (
                <p className="text-gray-400 text-sm">{currentChapter.title}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ProgressTracker
              courseId={params.id}
              userId={user!.id}
              currentProgress={courseData.userProgress?.completionRate || 0}
              className="hidden sm:block"
            />
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white transition-colors lg:hidden"
              title="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'lg:mr-80' : ''}`}>
          <div className="p-6">
            {renderMainContent()}
          </div>
        </main>

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 right-0 z-30 w-80 bg-gray-800 border-l border-gray-700 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          lg:relative lg:translate-x-0 lg:inset-y-auto lg:z-auto
          ${sidebarOpen ? 'block' : 'hidden lg:block'}
        `}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="border-b border-gray-700 px-4 py-3">
              <div className="flex space-x-1">
                {(['chapters', 'notes', 'bookmarks', 'resources'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'chapters' && (
                <ChapterNavigation
                  chapters={courseData.chapters}
                  currentChapter={currentChapter}
                  onChapterSelect={handleChapterChange}
                  userProgress={courseData.userProgress}
                />
              )}
              
              {activeTab === 'notes' && (
                <NoteTaking
                  courseId={params.id}
                  chapterId={currentChapter.id}
                  userId={user!.id}
                  currentTime={playerState.currentTime}
                />
              )}
              
              {activeTab === 'bookmarks' && (
                <BookmarkManager
                  courseId={params.id}
                  chapterId={currentChapter.id}
                  userId={user!.id}
                  currentTime={playerState.currentTime}
                />
              )}
              
              {activeTab === 'resources' && (
                <div className="p-4">
                  <h3 className="text-white font-medium mb-4">Course Resources</h3>
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">
                      Resources will be available when provided by the instructor.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}