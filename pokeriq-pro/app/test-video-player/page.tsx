'use client';

import React from 'react';
import VideoPlayer from '../../components/player/VideoPlayer';
import ContentRenderer from '../../components/player/ContentRenderer';
import { VideoData, ContentBlock, TextContent } from '../../lib/player/content-types';

// Sample video data for testing
const sampleVideoData: VideoData = {
  id: 'test-video-1',
  title: 'Test Video Player',
  description: 'Testing the custom video player implementation',
  duration: 600, // 10 minutes
  poster: 'https://via.placeholder.com/1280x720?text=Video+Poster',
  tracks: [
    {
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'video/mp4',
      quality: '720p',
      label: '720p'
    }
  ],
  chapters: [
    { id: 'ch1', time: 0, title: '介绍', description: '课程介绍' },
    { id: 'ch2', time: 120, title: '基础概念', description: '基本扑克概念' },
    { id: 'ch3', time: 300, title: '高级策略', description: '高级游戏策略' },
    { id: 'ch4', time: 480, title: '实践应用', description: '实际应用演示' }
  ],
  metadata: {
    codec: 'h264',
    format: 'mp4',
    resolution: { width: 1280, height: 720 },
    frameRate: 30,
    bitrate: 2500,
    size: 50000000,
    uploadedAt: new Date(),
    transcoded: true,
    qualities: [
      { label: 'Auto', height: 0, width: 0, bitrate: 0 },
      { label: '720p', height: 720, width: 1280, bitrate: 2500 },
      { label: '480p', height: 480, width: 854, bitrate: 1200 }
    ]
  }
};

// Sample text content for testing
const sampleTextContent: TextContent = {
  format: 'markdown',
  content: `# 扑克基础策略

## 第一章：位置的重要性

在德州扑克中，位置是最重要的概念之一。**位置决定了你在每一轮下注中的行动顺序**，这对你的决策有着深远的影响。

### 位置分类

1. **早期位置 (Early Position)**
   - UTG (Under the Gun)
   - UTG+1

2. **中期位置 (Middle Position)**
   - MP (Middle Position)
   - MP+1

3. **后期位置 (Late Position)**
   - CO (Cut-off)
   - BTN (Button)

4. **盲注位置 (Blind Positions)**
   - SB (Small Blind)
   - BB (Big Blind)

### 位置优势

在后期位置，你可以：
- 看到前面玩家的行动
- 做出更明智的决策
- 更好地控制底池大小
- 更容易偷盲注

## 第二章：起手牌选择

起手牌的选择是扑克策略的基础。不同位置应该采用不同的起手牌策略。

### 强起手牌
- **顶级对子**: AA, KK, QQ
- **强Ace**: AK, AQ (适合位置)
- **同花连子**: 如 JTs, 98s

### 边际起手牌
这些牌在好位置可以游戏，在坏位置应该弃牌：
- 小对子 (22-77)
- 同花Ace (A2s-A9s)
- 连子 (如 JT, 98)

## 小结

掌握位置概念和起手牌选择是成为优秀扑克玩家的第一步。记住：**位置就是力量**！`,
  estimatedReadingTime: 8,
  wordCount: 320,
  language: 'zh',
  tableOfContents: [
    { level: 1, title: '扑克基础策略', anchor: '扑克基础策略' },
    { level: 2, title: '第一章：位置的重要性', anchor: '第一章：位置的重要性' },
    { level: 3, title: '位置分类', anchor: '位置分类' },
    { level: 3, title: '位置优势', anchor: '位置优势' },
    { level: 2, title: '第二章：起手牌选择', anchor: '第二章：起手牌选择' },
    { level: 3, title: '强起手牌', anchor: '强起手牌' },
    { level: 3, title: '边际起手牌', anchor: '边际起手牌' },
    { level: 2, title: '小结', anchor: '小结' }
  ]
};

// Sample content blocks
const videoContentBlock: ContentBlock = {
  id: 'video-block-1',
  type: 'video',
  order: 1,
  data: {
    content: sampleVideoData,
    metadata: {
      id: 'video-metadata-1',
      title: 'Video Player Test',
      description: 'Testing the video player functionality',
      duration: 600,
      difficulty: 'intermediate',
      tags: ['test', 'video-player', 'poker'],
      lastUpdated: new Date(),
      version: '1.0.0',
      author: 'PokerIQ Pro'
    },
    interactions: {
      enabled: true,
      allowNotes: true,
      allowBookmarks: true,
      trackProgress: true,
      requireCompletion: false
    }
  }
};

const textContentBlock: ContentBlock = {
  id: 'text-block-1',
  type: 'text',
  order: 2,
  data: {
    content: sampleTextContent,
    metadata: {
      id: 'text-metadata-1',
      title: 'Text Renderer Test',
      description: 'Testing the text content rendering',
      difficulty: 'beginner',
      tags: ['test', 'text-content', 'poker-strategy'],
      lastUpdated: new Date(),
      version: '1.0.0',
      author: 'PokerIQ Pro'
    },
    interactions: {
      enabled: true,
      allowNotes: true,
      allowBookmarks: true,
      trackProgress: true,
      requireCompletion: false
    }
  }
};

export default function TestVideoPlayerPage() {
  const handleProgress = (progress: any) => {
    console.log('Progress update:', progress);
  };

  const handleError = (error: any) => {
    console.error('Player error:', error);
  };

  const handleComplete = (contentBlockId: string) => {
    console.log('Content completed:', contentBlockId);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Video Player System Test
          </h1>
          <p className="text-gray-600">
            Testing the comprehensive video player and content renderer implementation
          </p>
        </div>

        {/* Video Player Test */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            📹 Video Player Component
          </h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <VideoPlayer
              videoData={sampleVideoData}
              userId="test-user-123"
              courseId="test-course-456"
              contentBlockId="video-block-1"
              onProgress={handleProgress}
              onError={handleError}
              className="w-full"
            />
          </div>
          
          {/* Video Player Features */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Features Tested:</h3>
            <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
              <li>Custom video controls with branding</li>
              <li>Playback speed adjustment (0.5x to 2x)</li>
              <li>Quality selection (simulated adaptive streaming)</li>
              <li>Chapter markers and navigation</li>
              <li>Volume control and mute functionality</li>
              <li>Fullscreen and picture-in-picture support</li>
              <li>Progress tracking and auto-resume</li>
              <li>Keyboard shortcuts (Space, Arrow keys, F, M, P)</li>
            </ul>
          </div>
        </div>

        {/* Content Renderer Test - Video */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🎬 Content Renderer - Video
          </h2>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <ContentRenderer
              contentBlock={videoContentBlock}
              userId="test-user-123"
              courseId="test-course-456"
              onProgress={handleProgress}
              onComplete={handleComplete}
              onError={handleError}
            />
          </div>
        </div>

        {/* Content Renderer Test - Text */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            📄 Content Renderer - Text
          </h2>
          <div className="bg-white rounded-lg shadow-lg">
            <ContentRenderer
              contentBlock={textContentBlock}
              userId="test-user-123"
              courseId="test-course-456"
              onProgress={handleProgress}
              onComplete={handleComplete}
              onError={handleError}
            />
          </div>
          
          {/* Text Renderer Features */}
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Text Features Tested:</h3>
            <ul className="list-disc list-inside text-green-800 text-sm space-y-1">
              <li>Markdown content rendering</li>
              <li>Table of contents generation</li>
              <li>Reading progress tracking</li>
              <li>Estimated reading time display</li>
              <li>Content metadata display</li>
              <li>Responsive text layout</li>
            </ul>
          </div>
        </div>

        {/* System Architecture Info */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            🏗️ System Architecture
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Core Components</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>📦 <strong>content-types.ts</strong> - Type definitions and interfaces</li>
                <li>📡 <strong>video-streaming.ts</strong> - Adaptive streaming and HLS/DASH support</li>
                <li>🎥 <strong>VideoPlayer.tsx</strong> - Custom video player component</li>
                <li>📝 <strong>ContentRenderer.tsx</strong> - Multi-format content renderer</li>
                <li>⚡ <strong>InteractiveContent.tsx</strong> - Interactive elements and hotspots</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Integration Features</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>🔗 <strong>player-integration.ts</strong> - Database integration</li>
                <li>📊 <strong>Progress Tracking</strong> - Real-time learning analytics</li>
                <li>🎯 <strong>Course Integration</strong> - Existing Course/UserProgress models</li>
                <li>📈 <strong>Analytics</strong> - Detailed interaction tracking</li>
                <li>💾 <strong>Auto-resume</strong> - Cross-device continuity</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">Technical Specifications:</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <strong>Video Formats:</strong><br />
                HLS, DASH, MP4, WebM
              </div>
              <div>
                <strong>Content Types:</strong><br />
                Video, Text, Interactive, Code, Images
              </div>
              <div>
                <strong>Features:</strong><br />
                Adaptive streaming, Progress tracking, Keyboard shortcuts
              </div>
            </div>
          </div>
        </div>

        {/* Development Notes */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">🚧 Development Notes:</h3>
          <ul className="text-yellow-700 text-sm space-y-1">
            <li>• This test page uses sample data - integrate with real course content as needed</li>
            <li>• Video streaming uses sample video from Google Cloud Storage</li>
            <li>• Progress tracking is functional but requires database connection for persistence</li>
            <li>• Interactive content features can be extended based on specific requirements</li>
            <li>• All components are fully responsive and accessibility-compliant</li>
          </ul>
        </div>
      </div>
    </div>
  );
}