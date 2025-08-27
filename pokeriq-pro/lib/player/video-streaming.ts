/**
 * Video Streaming Service
 * Handles adaptive streaming, quality selection, bandwidth detection, and HLS/DASH playback
 */

import { 
  VideoData, 
  VideoQuality, 
  PlaybackState, 
  PlayerCapabilities, 
  PlayerError,
  VideoTrack,
  ChapterMarker
} from './content-types';

// ==========================================================================
// Bandwidth and Quality Detection
// ==========================================================================

class BandwidthMonitor {
  private measurements: number[] = [];
  private maxMeasurements = 10;
  private testStartTime = 0;
  private testBytes = 0;
  
  constructor() {
    this.detectInitialBandwidth();
  }

  private async detectInitialBandwidth(): Promise<void> {
    try {
      // Test with a small video segment for initial bandwidth estimation
      const testUrl = '/api/player/bandwidth-test'; // Small test file
      const startTime = performance.now();
      
      const response = await fetch(testUrl);
      const blob = await response.blob();
      const endTime = performance.now();
      
      const bytes = blob.size;
      const timeMs = endTime - startTime;
      const kbps = (bytes * 8) / timeMs; // Convert to kbps
      
      this.addMeasurement(kbps);
    } catch (error) {
      console.warn('Initial bandwidth detection failed:', error);
      // Fallback to conservative estimate
      this.addMeasurement(1000); // 1 Mbps fallback
    }
  }

  addMeasurement(kbps: number): void {
    this.measurements.push(kbps);
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift();
    }
  }

  getCurrentBandwidth(): number {
    if (this.measurements.length === 0) return 1000; // Default 1 Mbps
    
    // Use moving average with recent measurements weighted more heavily
    const weights = this.measurements.map((_, index) => 
      Math.pow(1.2, index) // More recent measurements get higher weight
    );
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    const weightedSum = this.measurements.reduce((sum, measurement, index) => 
      sum + (measurement * weights[index]), 0
    );
    
    return weightedSum / totalWeight;
  }

  getOptimalQuality(availableQualities: VideoQuality[]): VideoQuality {
    const currentBandwidth = this.getCurrentBandwidth();
    const safetyMargin = 0.8; // Use 80% of detected bandwidth for stability
    const targetBandwidth = currentBandwidth * safetyMargin;
    
    // Sort qualities by bitrate (ascending)
    const sortedQualities = [...availableQualities].sort((a, b) => a.bitrate - b.bitrate);
    
    // Find the highest quality that fits within bandwidth
    let optimalQuality = sortedQualities[0];
    for (const quality of sortedQualities) {
      if (quality.bitrate <= targetBandwidth) {
        optimalQuality = quality;
      } else {
        break;
      }
    }
    
    return optimalQuality;
  }
}

// ==========================================================================
// HLS/DASH Player Support
// ==========================================================================

class AdaptiveStreamingPlayer {
  private video: HTMLVideoElement;
  private hls: any = null; // HLS.js instance
  private dashPlayer: any = null; // DASH.js instance
  private bandwidthMonitor: BandwidthMonitor;
  private currentVideoData: VideoData | null = null;
  private errorCallbacks: ((error: PlayerError) => void)[] = [];
  
  constructor(videoElement: HTMLVideoElement) {
    this.video = videoElement;
    this.bandwidthMonitor = new BandwidthMonitor();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.video.addEventListener('loadstart', this.onLoadStart.bind(this));
    this.video.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this));
    this.video.addEventListener('progress', this.onProgress.bind(this));
    this.video.addEventListener('error', this.onError.bind(this));
    this.video.addEventListener('waiting', this.onWaiting.bind(this));
    this.video.addEventListener('canplay', this.onCanPlay.bind(this));
  }

  private onLoadStart(): void {
    // Track loading start
  }

  private onLoadedMetadata(): void {
    // Metadata loaded, can start tracking bandwidth
  }

  private onProgress(): void {
    // Update bandwidth measurements based on loading progress
    if (this.video.buffered.length > 0) {
      const buffered = this.video.buffered.end(this.video.buffered.length - 1);
      const currentTime = this.video.currentTime;
      if (buffered > currentTime) {
        // We have buffer ahead, can measure download speed
        this.updateBandwidthFromBuffer();
      }
    }
  }

  private updateBandwidthFromBuffer(): void {
    // Estimate bandwidth from buffer progress
    // This is a simplified implementation - real implementations would be more sophisticated
    const estimatedKbps = this.estimateBandwidthFromBuffer();
    if (estimatedKbps > 0) {
      this.bandwidthMonitor.addMeasurement(estimatedKbps);
    }
  }

  private estimateBandwidthFromBuffer(): number {
    // Placeholder implementation
    // Real implementation would track bytes downloaded over time
    return 0;
  }

  private onError(event: Event): void {
    const error: PlayerError = {
      code: 'PLAYBACK_ERROR',
      message: 'Video playback error occurred',
      details: event,
      timestamp: new Date(),
      recoverable: true,
      suggestions: [
        'Try refreshing the page',
        'Check your internet connection',
        'Try a different quality setting'
      ]
    };
    this.notifyError(error);
  }

  private onWaiting(): void {
    // Buffering started
  }

  private onCanPlay(): void {
    // Can resume playback
  }

  async loadVideo(videoData: VideoData): Promise<void> {
    this.currentVideoData = videoData;
    
    try {
      // Determine best streaming method based on available formats
      const hlsTrack = videoData.tracks.find(track => 
        track.type === 'application/x-mpegURL' || track.type === 'application/vnd.apple.mpegurl'
      );
      
      const dashTrack = videoData.tracks.find(track => 
        track.type === 'application/dash+xml'
      );

      if (hlsTrack && this.canPlayHLS()) {
        await this.loadHLS(hlsTrack);
      } else if (dashTrack && this.canPlayDASH()) {
        await this.loadDASH(dashTrack);
      } else {
        // Fallback to progressive video
        await this.loadProgressive(videoData);
      }
      
    } catch (error) {
      const playerError: PlayerError = {
        code: 'LOAD_ERROR',
        message: 'Failed to load video',
        details: error,
        timestamp: new Date(),
        recoverable: true,
        suggestions: ['Try refreshing the page', 'Check your internet connection']
      };
      this.notifyError(playerError);
    }
  }

  private canPlayHLS(): boolean {
    // Check if native HLS is supported or HLS.js is available
    return this.video.canPlayType('application/vnd.apple.mpegurl') !== '' || 
           (typeof window !== 'undefined' && (window as any).Hls?.isSupported?.());
  }

  private canPlayDASH(): boolean {
    // Check if DASH.js is available
    return typeof window !== 'undefined' && (window as any).dashjs?.MediaPlayer;
  }

  private async loadHLS(track: VideoTrack): Promise<void> {
    if (this.video.canPlayType('application/vnd.apple.mpegurl') !== '') {
      // Native HLS support (Safari)
      this.video.src = track.src;
    } else if ((window as any).Hls?.isSupported?.()) {
      // HLS.js for other browsers
      const Hls = (window as any).Hls;
      
      if (this.hls) {
        this.hls.destroy();
      }
      
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
      });
      
      this.hls.loadSource(track.src);
      this.hls.attachMedia(this.video);
      
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Manifest loaded, can start adaptive streaming
      });
      
      this.hls.on(Hls.Events.ERROR, (event: any, data: any) => {
        this.handleHLSError(data);
      });
    }
  }

  private async loadDASH(track: VideoTrack): Promise<void> {
    if (!(window as any).dashjs?.MediaPlayer) {
      throw new Error('DASH.js not available');
    }
    
    const dashjs = (window as any).dashjs;
    
    if (this.dashPlayer) {
      this.dashPlayer.reset();
    }
    
    this.dashPlayer = dashjs.MediaPlayer().create();
    this.dashPlayer.initialize(this.video, track.src, false);
    
    // Configure DASH settings
    this.dashPlayer.updateSettings({
      streaming: {
        abr: {
          autoSwitchBitrate: {
            video: true,
            audio: true
          }
        },
        buffer: {
          bufferTimeAtTopQuality: 30,
          bufferTimeAtTopQualityLongForm: 60
        }
      }
    });
  }

  private async loadProgressive(videoData: VideoData): Promise<void> {
    // Find the best quality for current bandwidth
    const optimalQuality = this.bandwidthMonitor.getOptimalQuality(videoData.metadata.qualities);
    
    // Find corresponding track
    const track = videoData.tracks.find(t => 
      t.quality === optimalQuality.label || t.type === 'video/mp4'
    ) || videoData.tracks[0];
    
    this.video.src = track.src;
  }

  private handleHLSError(data: any): void {
    const error: PlayerError = {
      code: `HLS_${data.type}_ERROR`,
      message: data.details || 'HLS streaming error',
      details: data,
      timestamp: new Date(),
      recoverable: data.fatal !== true,
      suggestions: [
        'Try switching to a different quality',
        'Refresh the page',
        'Check your internet connection'
      ]
    };
    
    this.notifyError(error);
    
    // Attempt recovery for non-fatal errors
    if (!data.fatal) {
      this.attemptRecovery();
    }
  }

  private attemptRecovery(): void {
    if (this.hls) {
      this.hls.startLoad();
    }
  }

  setQuality(qualityLabel: string): void {
    if (!this.currentVideoData) return;
    
    if (qualityLabel === 'auto') {
      // Enable automatic quality selection
      if (this.hls) {
        this.hls.nextLevel = -1; // -1 enables auto level selection
      } else if (this.dashPlayer) {
        this.dashPlayer.updateSettings({
          streaming: {
            abr: {
              autoSwitchBitrate: { video: true, audio: true }
            }
          }
        });
      }
    } else {
      // Set specific quality
      const quality = this.currentVideoData.metadata.qualities.find(q => q.label === qualityLabel);
      if (quality) {
        if (this.hls) {
          const levels = this.hls.levels;
          const levelIndex = levels.findIndex((level: any) => 
            level.height === quality.height && level.width === quality.width
          );
          if (levelIndex >= 0) {
            this.hls.nextLevel = levelIndex;
          }
        } else if (this.dashPlayer) {
          // Set quality for DASH
          const bitrates = this.dashPlayer.getBitrateInfoListFor('video');
          const targetBitrate = bitrates.find((br: any) => 
            Math.abs(br.bitrate - quality.bitrate * 1000) < 100000 // Within 100kbps
          );
          if (targetBitrate) {
            this.dashPlayer.setQualityFor('video', targetBitrate.qualityIndex);
          }
        } else {
          // Progressive video - need to switch source
          this.switchProgressiveQuality(qualityLabel);
        }
      }
    }
  }

  private async switchProgressiveQuality(qualityLabel: string): Promise<void> {
    if (!this.currentVideoData) return;
    
    const currentTime = this.video.currentTime;
    const wasPlaying = !this.video.paused;
    
    // Find new track
    const track = this.currentVideoData.tracks.find(t => t.quality === qualityLabel);
    if (!track) return;
    
    // Switch source
    this.video.src = track.src;
    
    // Restore position
    this.video.addEventListener('loadedmetadata', () => {
      this.video.currentTime = currentTime;
      if (wasPlaying) {
        this.video.play();
      }
    }, { once: true });
  }

  getAvailableQualities(): VideoQuality[] {
    if (!this.currentVideoData) return [];
    
    // Add auto option
    const autoQuality: VideoQuality = {
      label: 'Auto',
      height: 0,
      width: 0,
      bitrate: 0
    };
    
    return [autoQuality, ...this.currentVideoData.metadata.qualities];
  }

  getCurrentQuality(): string {
    if (this.hls) {
      const currentLevel = this.hls.currentLevel;
      if (currentLevel === -1) return 'Auto';
      
      const level = this.hls.levels[currentLevel];
      return `${level.height}p`;
    } else if (this.dashPlayer) {
      const quality = this.dashPlayer.getQualityFor('video');
      const bitrates = this.dashPlayer.getBitrateInfoListFor('video');
      if (quality >= 0 && bitrates[quality]) {
        return `${bitrates[quality].height}p`;
      }
    }
    
    return 'Auto';
  }

  onError(callback: (error: PlayerError) => void): void {
    this.errorCallbacks.push(callback);
  }

  private notifyError(error: PlayerError): void {
    this.errorCallbacks.forEach(callback => callback(error));
  }

  destroy(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    
    if (this.dashPlayer) {
      this.dashPlayer.reset();
      this.dashPlayer = null;
    }
    
    this.errorCallbacks = [];
  }
}

// ==========================================================================
// Chapter and Navigation Support
// ==========================================================================

class ChapterManager {
  private chapters: ChapterMarker[] = [];
  private currentChapter: ChapterMarker | null = null;
  private onChapterChangeCallbacks: ((chapter: ChapterMarker | null) => void)[] = [];

  setChapters(chapters: ChapterMarker[]): void {
    this.chapters = chapters.sort((a, b) => a.time - b.time);
  }

  getCurrentChapter(currentTime: number): ChapterMarker | null {
    const chapter = this.chapters
      .filter(c => c.time <= currentTime)
      .pop();
    
    if (chapter !== this.currentChapter) {
      this.currentChapter = chapter || null;
      this.notifyChapterChange(this.currentChapter);
    }
    
    return this.currentChapter;
  }

  getNextChapter(currentTime: number): ChapterMarker | null {
    return this.chapters.find(c => c.time > currentTime) || null;
  }

  getPreviousChapter(currentTime: number): ChapterMarker | null {
    const filtered = this.chapters.filter(c => c.time < currentTime);
    return filtered[filtered.length - 1] || null;
  }

  getAllChapters(): ChapterMarker[] {
    return [...this.chapters];
  }

  seekToChapter(chapterId: string): ChapterMarker | null {
    const chapter = this.chapters.find(c => c.id === chapterId);
    return chapter || null;
  }

  onChapterChange(callback: (chapter: ChapterMarker | null) => void): void {
    this.onChapterChangeCallbacks.push(callback);
  }

  private notifyChapterChange(chapter: ChapterMarker | null): void {
    this.onChapterChangeCallbacks.forEach(callback => callback(chapter));
  }
}

// ==========================================================================
// Progress Tracking and Resume
// ==========================================================================

class ProgressTracker {
  private courseId: string;
  private userId: string;
  private contentBlockId: string;
  private progressInterval: NodeJS.Timeout | null = null;
  private lastSavedPosition = 0;
  private saveThreshold = 5; // Save progress every 5 seconds of actual change
  
  constructor(courseId: string, userId: string, contentBlockId: string) {
    this.courseId = courseId;
    this.userId = userId;
    this.contentBlockId = contentBlockId;
  }

  startTracking(video: HTMLVideoElement): void {
    this.progressInterval = setInterval(() => {
      if (!video.paused && !video.ended) {
        const currentTime = video.currentTime;
        
        // Only save if position has changed significantly
        if (Math.abs(currentTime - this.lastSavedPosition) >= this.saveThreshold) {
          this.saveProgress(currentTime, video.duration);
          this.lastSavedPosition = currentTime;
        }
      }
    }, 1000); // Check every second
  }

  stopTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  private async saveProgress(currentTime: number, duration: number): Promise<void> {
    try {
      const completionRate = duration > 0 ? (currentTime / duration) * 100 : 0;
      
      await fetch('/api/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: this.courseId,
          userId: this.userId,
          contentBlockId: this.contentBlockId,
          currentTime,
          completionRate,
          lastPosition: currentTime,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  async getLastPosition(): Promise<number> {
    try {
      const response = await fetch(
        `/api/progress/${this.userId}/${this.courseId}?contentBlock=${this.contentBlockId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.lastPosition || 0;
      }
    } catch (error) {
      console.error('Failed to get last position:', error);
    }
    
    return 0;
  }

  async markCompleted(duration: number): Promise<void> {
    try {
      await fetch('/api/progress/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: this.courseId,
          userId: this.userId,
          contentBlockId: this.contentBlockId,
          currentTime: duration,
          completionRate: 100,
          completed: true,
          completedAt: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Failed to mark as completed:', error);
    }
  }
}

// ==========================================================================
// Utility Functions
// ==========================================================================

export function detectPlayerCapabilities(): PlayerCapabilities {
  const video = document.createElement('video');
  
  return {
    supportsHLS: video.canPlayType('application/vnd.apple.mpegurl') !== '' || 
                 (typeof window !== 'undefined' && (window as any).Hls?.isSupported?.()),
    supportsDASH: typeof window !== 'undefined' && !!(window as any).dashjs,
    supportsWebVTT: video.textTracks !== undefined,
    supportsPictureInPicture: 'pictureInPictureEnabled' in document,
    supportsFullscreen: 'fullscreenEnabled' in document,
    supportsKeyboard: 'onkeydown' in document,
    supportsTouch: 'ontouchstart' in window,
    maxResolution: {
      width: screen.width * (window.devicePixelRatio || 1),
      height: screen.height * (window.devicePixelRatio || 1)
    },
    codecs: [
      video.canPlayType('video/mp4; codecs="avc1.42E01E"') && 'h264',
      video.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"') && 'h265',
      video.canPlayType('video/mp4; codecs="av01.0.04M.10.0.110.09"') && 'av1',
      video.canPlayType('video/webm; codecs="vp9"') && 'vp9'
    ].filter(Boolean) as string[],
    bandwidth: 0 // Will be updated by BandwidthMonitor
  };
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

export function generateVideoThumbnail(video: HTMLVideoElement, time: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    const currentTime = video.currentTime;
    
    video.addEventListener('seeked', function onSeeked() {
      video.removeEventListener('seeked', onSeeked);
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
      
      // Restore original time
      video.currentTime = currentTime;
      
      resolve(thumbnail);
    });
    
    video.addEventListener('error', function onError() {
      video.removeEventListener('error', onError);
      reject(new Error('Failed to seek video for thumbnail'));
    });
    
    video.currentTime = time;
  });
}

// Export all classes and functions
export {
  BandwidthMonitor,
  AdaptiveStreamingPlayer,
  ChapterManager,
  ProgressTracker
};