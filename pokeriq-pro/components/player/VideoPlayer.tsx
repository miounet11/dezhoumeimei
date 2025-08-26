'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  VideoData, 
  PlaybackState, 
  PlayerPreferences, 
  ChapterMarker, 
  PlayerError, 
  VideoQuality, 
  PlaybackRate 
} from '../../lib/player/content-types';
import { 
  AdaptiveStreamingPlayer, 
  ChapterManager, 
  ProgressTracker, 
  formatTime, 
  detectPlayerCapabilities 
} from '../../lib/player/video-streaming';

interface VideoPlayerProps {
  videoData: VideoData;
  userId: string;
  courseId: string;
  contentBlockId: string;
  preferences?: Partial<PlayerPreferences>;
  autoplay?: boolean;
  onError?: (error: PlayerError) => void;
  onProgress?: (progress: { currentTime: number; duration: number; completionRate: number }) => void;
  onChapterChange?: (chapter: ChapterMarker | null) => void;
  onPlaybackStateChange?: (state: PlaybackState) => void;
  className?: string;
}

const PLAYBACK_RATES: PlaybackRate[] = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

export default function VideoPlayer({
  videoData,
  userId,
  courseId,
  contentBlockId,
  preferences = {},
  autoplay = false,
  onError,
  onProgress,
  onChapterChange,
  onPlaybackStateChange,
  className = ''
}: VideoPlayerProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  
  // Services
  const [streamingPlayer, setStreamingPlayer] = useState<AdaptiveStreamingPlayer | null>(null);
  const [chapterManager] = useState(() => new ChapterManager());
  const [progressTracker] = useState(() => new ProgressTracker(courseId, userId, contentBlockId));

  // State
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    buffered: null,
    playbackRate: preferences.defaultPlaybackRate || 1.0,
    volume: preferences.volume || 1.0,
    muted: false,
    quality: preferences.defaultQuality || 'auto',
    isFullscreen: false,
    isPictureInPicture: false,
    isBuffering: false,
    error: null
  });

  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [availableQualities, setAvailableQualities] = useState<VideoQuality[]>([]);
  const [currentChapter, setCurrentChapter] = useState<ChapterMarker | null>(null);

  // Player capabilities
  const capabilities = useMemo(() => detectPlayerCapabilities(), []);

  // Initialize player
  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const player = new AdaptiveStreamingPlayer(video);
    setStreamingPlayer(player);

    // Setup error handling
    player.onError((error) => {
      setPlaybackState(prev => ({ ...prev, error: error.message }));
      onError?.(error);
    });

    // Load video
    player.loadVideo(videoData).then(() => {
      setAvailableQualities(player.getAvailableQualities());
      setIsLoading(false);
    }).catch((error) => {
      setIsLoading(false);
      onError?.(error);
    });

    // Setup chapters
    if (videoData.chapters) {
      chapterManager.setChapters(videoData.chapters);
      chapterManager.onChapterChange((chapter) => {
        setCurrentChapter(chapter);
        onChapterChange?.(chapter);
      });
    }

    return () => {
      player.destroy();
      progressTracker.stopTracking();
    };
  }, [videoData, chapterManager, progressTracker, onError, onChapterChange]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updatePlaybackState = () => {
      const newState: PlaybackState = {
        isPlaying: !video.paused && !video.ended,
        currentTime: video.currentTime,
        duration: video.duration || 0,
        buffered: video.buffered,
        playbackRate: video.playbackRate,
        volume: video.volume,
        muted: video.muted,
        quality: streamingPlayer?.getCurrentQuality() || 'auto',
        isFullscreen: document.fullscreenElement === containerRef.current,
        isPictureInPicture: document.pictureInPictureElement === video,
        isBuffering: video.readyState < video.HAVE_FUTURE_DATA && !video.paused,
        error: playbackState.error
      };
      
      setPlaybackState(newState);
      onPlaybackStateChange?.(newState);
    };

    const handleTimeUpdate = () => {
      updatePlaybackState();
      
      // Update chapter
      if (videoData.chapters) {
        chapterManager.getCurrentChapter(video.currentTime);
      }
      
      // Progress tracking
      if (onProgress) {
        const completionRate = video.duration > 0 ? (video.currentTime / video.duration) * 100 : 0;
        onProgress({
          currentTime: video.currentTime,
          duration: video.duration,
          completionRate
        });
      }
    };

    const handleLoadedMetadata = async () => {
      updatePlaybackState();
      
      // Auto-resume from last position
      if (preferences.rememberPosition) {
        const lastPosition = await progressTracker.getLastPosition();
        if (lastPosition > 10) { // Only resume if more than 10 seconds
          video.currentTime = lastPosition;
        }
      }
      
      // Start progress tracking
      progressTracker.startTracking(video);
      
      // Auto-play if enabled
      if (autoplay && preferences.autoplay !== false) {
        video.play();
      }
    };

    // Event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', updatePlaybackState);
    video.addEventListener('pause', updatePlaybackState);
    video.addEventListener('ended', updatePlaybackState);
    video.addEventListener('volumechange', updatePlaybackState);
    video.addEventListener('ratechange', updatePlaybackState);
    video.addEventListener('waiting', updatePlaybackState);
    video.addEventListener('canplay', updatePlaybackState);
    video.addEventListener('error', updatePlaybackState);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', updatePlaybackState);
      video.removeEventListener('pause', updatePlaybackState);
      video.removeEventListener('ended', updatePlaybackState);
      video.removeEventListener('volumechange', updatePlaybackState);
      video.removeEventListener('ratechange', updatePlaybackState);
      video.removeEventListener('waiting', updatePlaybackState);
      video.removeEventListener('canplay', updatePlaybackState);
      video.removeEventListener('error', updatePlaybackState);
    };
  }, [videoData, preferences, autoplay, streamingPlayer, chapterManager, progressTracker, playbackState.error, onProgress, onPlaybackStateChange]);

  // Controls visibility
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (playbackState.isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [playbackState.isPlaying]);

  // Playback controls
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    
    if (playbackState.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  }, [playbackState.isPlaying]);

  const seek = useCallback((time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = Math.max(0, Math.min(1, volume));
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
  }, []);

  const setPlaybackRate = useCallback((rate: PlaybackRate) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setShowSpeedMenu(false);
  }, []);

  const setQuality = useCallback((quality: string) => {
    streamingPlayer?.setQuality(quality);
    setShowQualityMenu(false);
  }, [streamingPlayer]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  const togglePictureInPicture = useCallback(() => {
    if (!videoRef.current) return;
    
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else {
      videoRef.current.requestPictureInPicture();
    }
  }, []);

  const seekToChapter = useCallback((chapterId: string) => {
    const chapter = chapterManager.seekToChapter(chapterId);
    if (chapter) {
      seek(chapter.time);
      setShowChapters(false);
    }
  }, [chapterManager, seek]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!preferences.keyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when player is focused or no input is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || 
                            activeElement?.tagName === 'TEXTAREA' ||
                            activeElement?.contentEditable === 'true';
      
      if (isInputFocused) return;

      switch (event.key) {
        case ' ':
          event.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          seek(Math.max(0, playbackState.currentTime - 10));
          break;
        case 'ArrowRight':
          event.preventDefault();
          seek(Math.min(playbackState.duration, playbackState.currentTime + 10));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setVolume(Math.min(1, playbackState.volume + 0.1));
          break;
        case 'ArrowDown':
          event.preventDefault();
          setVolume(Math.max(0, playbackState.volume - 0.1));
          break;
        case 'm':
        case 'M':
          event.preventDefault();
          toggleMute();
          break;
        case 'f':
        case 'F':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'p':
        case 'P':
          if (capabilities.supportsPictureInPicture) {
            event.preventDefault();
            togglePictureInPicture();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    preferences.keyboardShortcuts,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    togglePictureInPicture,
    playbackState,
    capabilities.supportsPictureInPicture
  ]);

  if (isLoading) {
    return (
      <div className={`relative bg-black aspect-video flex items-center justify-center ${className}`}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black aspect-video group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={videoData.poster}
        onClick={togglePlayPause}
        playsInline
        preload="metadata"
      >
        {/* Subtitles */}
        {videoData.subtitles?.map((subtitle) => (
          <track
            key={subtitle.language}
            kind="subtitles"
            src={subtitle.src}
            srcLang={subtitle.language}
            label={subtitle.label}
            default={subtitle.default}
          />
        ))}
      </video>

      {/* Loading Overlay */}
      {playbackState.isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error Overlay */}
      {playbackState.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-white text-center p-4">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="mb-2">播放出错</p>
            <p className="text-sm opacity-75">{playbackState.error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <div className="relative group/progress">
            <input
              type="range"
              min="0"
              max={playbackState.duration || 0}
              value={playbackState.currentTime}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                  (playbackState.currentTime / playbackState.duration) * 100
                }%, #4b5563 ${(playbackState.currentTime / playbackState.duration) * 100}%, #4b5563 100%)`
              }}
            />
            
            {/* Buffered Progress */}
            {playbackState.buffered && playbackState.duration > 0 && (
              <div 
                className="absolute top-0 h-1 bg-gray-400 rounded-lg pointer-events-none"
                style={{
                  width: `${
                    playbackState.buffered.length > 0
                      ? (playbackState.buffered.end(playbackState.buffered.length - 1) / playbackState.duration) * 100
                      : 0
                  }%`
                }}
              />
            )}

            {/* Chapter Markers */}
            {videoData.chapters?.map((chapter) => (
              <div
                key={chapter.id}
                className="absolute top-0 w-1 h-1 bg-yellow-400 rounded-full cursor-pointer hover:bg-yellow-300 transition-colors"
                style={{ left: `${(chapter.time / playbackState.duration) * 100}%` }}
                onClick={() => seek(chapter.time)}
                title={chapter.title}
              />
            ))}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center space-x-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="text-white hover:text-blue-400 transition-colors p-1"
              title={playbackState.isPlaying ? '暂停' : '播放'}
            >
              {playbackState.isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Volume */}
            <div className="relative" onMouseEnter={() => setShowVolumeSlider(true)} onMouseLeave={() => setShowVolumeSlider(false)}>
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors p-1"
                title={playbackState.muted ? '取消静音' : '静音'}
              >
                {playbackState.muted || playbackState.volume === 0 ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.066 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.066l4.317-3.793zm0 2.769L7.5 7.25H3v5.5h4.5l1.883 1.405V5.845z" clipRule="evenodd" />
                    <path d="M12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.066 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.066l4.317-3.793a1 1 0 011.617.793zM16 8a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              {/* Volume Slider */}
              {showVolumeSlider && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-black bg-opacity-75 rounded-lg p-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={playbackState.volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="h-20 w-4 slider vertical"
                    style={{ writingMode: 'bt-lr' }}
                  />
                </div>
              )}
            </div>

            {/* Time Display */}
            <div className="text-white text-sm">
              {formatTime(playbackState.currentTime)} / {formatTime(playbackState.duration)}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Chapters */}
            {videoData.chapters && videoData.chapters.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowChapters(!showChapters)}
                  className="text-white hover:text-blue-400 transition-colors p-1"
                  title="章节"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Chapters Menu */}
                {showChapters && (
                  <div className="absolute bottom-full right-0 mb-2 w-64 max-h-64 overflow-y-auto bg-black bg-opacity-90 rounded-lg p-2">
                    {videoData.chapters.map((chapter) => (
                      <button
                        key={chapter.id}
                        onClick={() => seekToChapter(chapter.id)}
                        className={`w-full text-left p-2 rounded hover:bg-blue-600 transition-colors ${
                          currentChapter?.id === chapter.id ? 'bg-blue-600' : ''
                        }`}
                      >
                        <div className="text-white text-sm font-medium">{chapter.title}</div>
                        <div className="text-gray-400 text-xs">{formatTime(chapter.time)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Speed Control */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-white hover:text-blue-400 transition-colors p-1 text-sm"
                title="播放速度"
              >
                {playbackState.playbackRate}x
              </button>

              {/* Speed Menu */}
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black bg-opacity-90 rounded-lg p-2">
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setPlaybackRate(rate)}
                      className={`block w-full text-left px-3 py-1 rounded text-sm transition-colors ${
                        playbackState.playbackRate === rate
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality Control */}
            {availableQualities.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu(!showQualityMenu)}
                  className="text-white hover:text-blue-400 transition-colors p-1 text-sm"
                  title="画质设置"
                >
                  {playbackState.quality}
                </button>

                {/* Quality Menu */}
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black bg-opacity-90 rounded-lg p-2">
                    {availableQualities.map((quality) => (
                      <button
                        key={quality.label}
                        onClick={() => setQuality(quality.label)}
                        className={`block w-full text-left px-3 py-1 rounded text-sm transition-colors ${
                          playbackState.quality === quality.label
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {quality.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Picture in Picture */}
            {capabilities.supportsPictureInPicture && (
              <button
                onClick={togglePictureInPicture}
                className="text-white hover:text-blue-400 transition-colors p-1"
                title="画中画"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h14a1 1 0 011 1v11a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm13 1.5H5v7h10v-7z" />
                  <path d="M12 8a1 1 0 011-1h3a1 1 0 011 1v2a1 1 0 01-1 1h-3a1 1 0 01-1-1V8z" />
                </svg>
              </button>
            )}

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors p-1"
              title="全屏"
            >
              {playbackState.isFullscreen ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a1 1 0 011-1h2a1 1 0 110 2H7v1a1 1 0 11-2 0zm0 2a1 1 0 112 0v1h1a1 1 0 110 2H6a1 1 0 01-1-1v-2zm6-6a1 1 0 100 2h1v1a1 1 0 102 0V7a1 1 0 00-1-1h-2zm2 6a1 1 0 11-2 0v1h-1a1 1 0 100 2h2a1 1 0 001-1v-2z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CSS for custom slider styling */}
      <style jsx>{`
        .slider {
          -webkit-appearance: none;
          appearance: none;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }

        .vertical {
          writing-mode: bt-lr;
        }
      `}</style>
    </div>
  );
}