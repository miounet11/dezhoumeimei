'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ContentBlock, 
  VideoData, 
  TextContent, 
  InteractiveData, 
  AssessmentData, 
  CodeData, 
  ImageData,
  ContentType,
  ProgressData
} from '../../lib/player/content-types';
import VideoPlayer from './VideoPlayer';
import InteractiveContent from './InteractiveContent';

interface ContentRendererProps {
  contentBlock: ContentBlock;
  userId: string;
  courseId: string;
  onProgress?: (progress: ProgressData) => void;
  onComplete?: (contentBlockId: string) => void;
  onError?: (error: Error) => void;
  className?: string;
}

// Markdown renderer component
function MarkdownRenderer({ content, className = '' }: { content: string; className?: string }) {
  // This is a simplified markdown renderer
  // In production, you'd use a library like react-markdown or @uiw/react-md-editor
  const processedContent = useMemo(() => {
    let html = content;
    
    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mb-2 text-gray-800">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3 text-gray-800">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 text-gray-900">$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-100 rounded p-4 my-4 overflow-x-auto"><code class="text-sm">$2</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-sm font-mono">$1</code>');
    
    // Lists
    html = html.replace(/^\* (.+$)/gm, '<li class="ml-4 list-disc">$1</li>');
    html = html.replace(/^\d+\. (.+$)/gm, '<li class="ml-4 list-decimal">$1</li>');
    
    // Wrap consecutive list items in ul/ol
    html = html.replace(/(<li class="ml-4 list-disc">.*<\/li>\s*)+/g, '<ul class="my-2">$&</ul>');
    html = html.replace(/(<li class="ml-4 list-decimal">.*<\/li>\s*)+/g, '<ol class="my-2">$&</ol>');
    
    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p class="mb-4">');
    html = '<p class="mb-4">' + html + '</p>';
    
    // Line breaks
    html = html.replace(/\n/g, '<br />');
    
    return html;
  }, [content]);

  return (
    <div 
      className={`prose max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}

// Text content renderer
function TextContentRenderer({ 
  content, 
  onProgress 
}: { 
  content: TextContent; 
  onProgress?: (progress: { estimatedProgress: number }) => void;
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasStartedReading, setHasStartedReading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      
      setScrollProgress(scrollPercent);
      
      if (!hasStartedReading && scrollPercent > 5) {
        setHasStartedReading(true);
      }

      onProgress?.({ estimatedProgress: scrollPercent });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasStartedReading, onProgress]);

  // Table of contents
  const tableOfContents = content.tableOfContents || [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-blue-500 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Table of Contents */}
      {tableOfContents.length > 0 && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">目录</h3>
          <nav>
            <ul className="space-y-1">
              {tableOfContents.map((item, index) => (
                <li key={index} className={`ml-${(item.level - 1) * 4}`}>
                  <a 
                    href={`#${item.anchor}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {/* Content */}
      <article className="text-gray-700 leading-relaxed">
        {/* Reading Time Estimate */}
        <div className="mb-6 text-sm text-gray-500 flex items-center space-x-4">
          <span>📖 预计阅读时间: {content.estimatedReadingTime} 分钟</span>
          <span>📄 字数: {content.wordCount.toLocaleString()}</span>
          <span>🌐 语言: {content.language === 'zh' ? '中文' : content.language}</span>
        </div>

        {/* Render content based on format */}
        {content.format === 'markdown' && (
          <MarkdownRenderer content={content.content} />
        )}
        
        {content.format === 'html' && (
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />
        )}
        
        {content.format === 'plain' && (
          <div className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg">
            {content.content}
          </div>
        )}
      </article>

      {/* Reading completion indicator */}
      {scrollProgress > 90 && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <div className="text-green-600 mb-2">✅</div>
          <p className="text-green-800 font-medium">阅读完成！</p>
          <p className="text-green-600 text-sm">您已完成本节内容的学习</p>
        </div>
      )}
    </div>
  );
}

// Code content renderer
function CodeContentRenderer({ content }: { content: CodeData }) {
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<Array<{ passed: boolean; description?: string }>>([]);

  const runCode = async () => {
    if (!content.isRunnable) return;
    
    setIsRunning(true);
    try {
      // This is a placeholder - in production you'd send to a code execution service
      setTimeout(() => {
        setOutput(content.expectedOutput || 'Code executed successfully');
        
        if (content.tests) {
          const results = content.tests.map(() => ({ passed: true }));
          setTestResults(results);
        }
        
        setIsRunning(false);
      }, 1000);
    } catch (error) {
      setOutput(`Error: ${error}`);
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {content.title && (
        <h2 className="text-2xl font-bold mb-2 text-gray-900">{content.title}</h2>
      )}
      
      {content.description && (
        <p className="text-gray-600 mb-6">{content.description}</p>
      )}

      {/* Code Block */}
      <div className="bg-gray-900 rounded-lg overflow-hidden mb-4">
        <div className="flex justify-between items-center px-4 py-2 bg-gray-800">
          <span className="text-gray-300 text-sm font-mono">{content.language}</span>
          {content.isRunnable && (
            <button
              onClick={runCode}
              disabled={isRunning}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded transition-colors"
            >
              {isRunning ? '运行中...' : '运行代码'}
            </button>
          )}
        </div>
        <pre className="p-4 text-green-400 font-mono text-sm overflow-x-auto">
          <code>{content.code}</code>
        </pre>
      </div>

      {/* Output */}
      {output && (
        <div className="bg-black rounded-lg p-4 mb-4">
          <div className="text-gray-300 text-sm mb-2">输出:</div>
          <pre className="text-green-400 font-mono text-sm">{output}</pre>
        </div>
      )}

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">测试结果</h3>
          {testResults.map((result, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <span className={result.passed ? 'text-green-500' : 'text-red-500'}>
                {result.passed ? '✅' : '❌'}
              </span>
              <span className="text-sm">
                {content.tests?.[index]?.description || `测试 ${index + 1}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Image content renderer
function ImageContentRenderer({ content }: { content: ImageData }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('original');

  const imageSizes = useMemo(() => {
    const sizes = [{ label: '原图', value: 'original', url: content.src }];
    
    if (content.sizes) {
      content.sizes.forEach(size => {
        sizes.push({
          label: `${size.width}x${size.height}`,
          value: `${size.width}x${size.height}`,
          url: size.url
        });
      });
    }
    
    return sizes;
  }, [content]);

  const currentImageUrl = useMemo(() => {
    if (selectedSize === 'original') return content.src;
    return imageSizes.find(size => size.value === selectedSize)?.url || content.src;
  }, [selectedSize, content.src, imageSizes]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Size Selection */}
      {imageSizes.length > 1 && (
        <div className="mb-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">图片尺寸:</label>
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            {imageSizes.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Image */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {hasError ? (
          <div className="flex items-center justify-center h-64 bg-gray-200">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">🖼️</div>
              <p>图片加载失败</p>
            </div>
          </div>
        ) : (
          <img
            src={currentImageUrl}
            alt={content.alt}
            width={content.width}
            height={content.height}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            className="w-full h-auto"
          />
        )}
      </div>

      {/* Caption */}
      {content.caption && (
        <p className="mt-4 text-sm text-gray-600 text-center italic">
          {content.caption}
        </p>
      )}

      {/* Metadata */}
      {content.metadata && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <h4 className="font-medium mb-2">图片信息</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">格式:</span> {content.format.toUpperCase()}
            </div>
            <div>
              <span className="font-medium">尺寸:</span> {content.width} x {content.height}
            </div>
            {content.metadata.size && (
              <div>
                <span className="font-medium">大小:</span> {(content.metadata.size / 1024 / 1024).toFixed(2)} MB
              </div>
            )}
            {content.metadata.uploadedAt && (
              <div>
                <span className="font-medium">上传时间:</span> {new Date(content.metadata.uploadedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Assessment content renderer (placeholder - would integrate with existing assessment system)
function AssessmentRenderer({ content }: { content: AssessmentData }) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="text-4xl mb-4">📝</div>
        <h3 className="text-xl font-semibold mb-2">评估练习</h3>
        <p className="text-gray-600 mb-4">此处将集成现有的评估系统</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          开始评估
        </button>
      </div>
    </div>
  );
}

// Main content renderer component
export default function ContentRenderer({
  contentBlock,
  userId,
  courseId,
  onProgress,
  onComplete,
  onError,
  className = ''
}: ContentRendererProps) {
  const [progressData, setProgressData] = useState<Partial<ProgressData>>({});

  const handleContentProgress = (progress: any) => {
    const updatedProgress: Partial<ProgressData> = {
      ...progressData,
      courseId,
      userId,
      contentBlockId: contentBlock.id,
      lastUpdated: new Date(),
      ...progress
    };
    
    setProgressData(updatedProgress);
    onProgress?.(updatedProgress as ProgressData);
  };

  const handleContentComplete = () => {
    onComplete?.(contentBlock.id);
  };

  const renderContent = () => {
    const { type, data } = contentBlock;

    try {
      switch (type) {
        case 'video':
          return (
            <VideoPlayer
              videoData={data.content as VideoData}
              userId={userId}
              courseId={courseId}
              contentBlockId={contentBlock.id}
              onProgress={handleContentProgress}
              onError={(error) => onError?.(new Error(error.message))}
              className="w-full"
            />
          );

        case 'text':
          return (
            <TextContentRenderer
              content={data.content as TextContent}
              onProgress={handleContentProgress}
            />
          );

        case 'interactive':
          return (
            <InteractiveContent
              data={data.content as InteractiveData}
              onProgress={handleContentProgress}
              onComplete={handleContentComplete}
            />
          );

        case 'code':
          return <CodeContentRenderer content={data.content as CodeData} />;

        case 'image':
          return <ImageContentRenderer content={data.content as ImageData} />;

        case 'assessment':
          return <AssessmentRenderer content={data.content as AssessmentData} />;

        default:
          return (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">❓</div>
              <h3 className="text-xl font-semibold mb-2">不支持的内容类型</h3>
              <p className="text-gray-600">内容类型 "{type}" 暂不支持</p>
            </div>
          );
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Content rendering failed'));
      
      return (
        <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
          <div className="text-4xl mb-4 text-red-500">⚠️</div>
          <h3 className="text-xl font-semibold mb-2 text-red-800">内容渲染失败</h3>
          <p className="text-red-600">无法显示此内容，请稍后重试</p>
        </div>
      );
    }
  };

  return (
    <div className={`content-renderer ${className}`}>
      {/* Content Metadata */}
      {data.metadata.title && (
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {data.metadata.title}
          </h1>
          {data.metadata.description && (
            <p className="text-lg text-gray-600">{data.metadata.description}</p>
          )}
        </div>
      )}

      {/* Learning Objectives */}
      {data.metadata.learningObjectives && data.metadata.learningObjectives.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-blue-800">学习目标</h3>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            {data.metadata.learningObjectives.map((objective, index) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Content */}
      <div className="content-main">
        {renderContent()}
      </div>

      {/* Content Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {data.metadata.difficulty && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                data.metadata.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                data.metadata.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {data.metadata.difficulty === 'beginner' ? '初级' :
                 data.metadata.difficulty === 'intermediate' ? '中级' : '高级'}
              </span>
            )}
            
            {data.metadata.tags && data.metadata.tags.length > 0 && (
              <div className="flex space-x-1">
                {data.metadata.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="text-right">
            <div>版本: {data.metadata.version}</div>
            <div>更新: {new Date(data.metadata.lastUpdated).toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}