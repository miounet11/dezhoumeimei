'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown,
  Send,
  X,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Bug,
  Heart,
  Smile,
  Meh,
  Frown,
  Camera,
  Mic,
  MicOff,
  Image,
  Settings,
  Filter,
  BarChart3
} from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('feedback-collector');

interface FeedbackItem {
  id: string;
  type: 'rating' | 'text' | 'bug' | 'feature' | 'improvement';
  category: 'ui' | 'performance' | 'content' | 'navigation' | 'general';
  rating?: number;
  title?: string;
  description: string;
  screenshot?: File;
  audioNote?: Blob;
  context: {
    page: string;
    feature: string;
    timestamp: string;
    userAgent: string;
    sessionId: string;
  };
  sentiment: 'positive' | 'neutral' | 'negative';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  anonymous: boolean;
}

interface FeedbackPrompt {
  id: string;
  trigger: 'time' | 'action' | 'error' | 'completion' | 'manual';
  title: string;
  description: string;
  type: FeedbackItem['type'];
  category: FeedbackItem['category'];
  quickOptions?: Array<{
    label: string;
    value: string;
    emoji: string;
  }>;
  customFields?: Array<{
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'rating';
    options?: string[];
    required: boolean;
  }>;
}

interface FeedbackCollectorProps {
  userId: string;
  context?: {
    page: string;
    feature: string;
    action?: string;
  };
  prompts?: FeedbackPrompt[];
  trigger?: 'manual' | 'automatic' | 'prompt';
  position?: 'bottom-right' | 'bottom-left' | 'center' | 'sidebar';
  showFloatingButton?: boolean;
  allowScreenshot?: boolean;
  allowAudio?: boolean;
  onFeedbackSubmit?: (feedback: FeedbackItem) => void;
  onFeedbackClose?: () => void;
  className?: string;
}

export const FeedbackCollector: React.FC<FeedbackCollectorProps> = ({
  userId,
  context,
  prompts = [],
  trigger = 'manual',
  position = 'bottom-right',
  showFloatingButton = true,
  allowScreenshot = true,
  allowAudio = false,
  onFeedbackSubmit,
  onFeedbackClose,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<'type' | 'details' | 'confirm'>('type');
  const [selectedType, setSelectedType] = useState<FeedbackItem['type'] | null>(null);
  const [feedback, setFeedback] = useState<Partial<FeedbackItem>>({
    anonymous: false,
    tags: []
  });
  const [rating, setRating] = useState<number>(0);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [activePrompt, setActivePrompt] = useState<FeedbackPrompt | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Auto-trigger feedback based on conditions
    if (trigger === 'automatic') {
      const shouldTrigger = checkAutoTriggerConditions();
      if (shouldTrigger) {
        setIsOpen(true);
      }
    }

    // Listen for custom feedback events
    const handleFeedbackTrigger = (event: CustomEvent) => {
      if (event.detail.userId === userId) {
        setActivePrompt(event.detail.prompt);
        setIsOpen(true);
      }
    };

    window.addEventListener('feedbackTrigger', handleFeedbackTrigger as EventListener);
    return () => {
      window.removeEventListener('feedbackTrigger', handleFeedbackTrigger as EventListener);
    };
  }, [userId, trigger]);

  const checkAutoTriggerConditions = (): boolean => {
    // Implement auto-trigger logic based on user behavior
    // For now, return false to prevent unwanted popups
    return false;
  };

  const handleOpen = () => {
    setIsOpen(true);
    setCurrentStep('type');
    setFeedback({
      anonymous: false,
      tags: [],
      context: {
        page: context?.page || window.location.pathname,
        feature: context?.feature || 'unknown',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        sessionId: sessionStorage.getItem('sessionId') || 'unknown'
      }
    });
    logger.info('Feedback collector opened', { userId, context });
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentStep('type');
    setSelectedType(null);
    setRating(0);
    setScreenshot(null);
    setAudioBlob(null);
    setActivePrompt(null);
    onFeedbackClose?.();
  };

  const handleTypeSelect = (type: FeedbackItem['type']) => {
    setSelectedType(type);
    setFeedback(prev => ({ ...prev, type }));
    setCurrentStep('details');
  };

  const handleScreenshot = async () => {
    try {
      // @ts-ignore - getDisplayMedia is not in TypeScript definitions
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' }
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      video.addEventListener('loadedmetadata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0);

        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], 'screenshot.png', { type: 'image/png' });
            setScreenshot(file);
          }
        });

        stream.getTracks().forEach(track => track.stop());
      });
    } catch (error) {
      logger.error('Screenshot capture failed:', error);
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      logger.error('Audio recording failed:', error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const analyzeSentiment = (text: string): 'positive' | 'neutral' | 'negative' => {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', '好', '棒', '优秀', '喜欢'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'broken', 'slow', '差', '烂', '讨厌', '慢'];
    
    const lowerText = text.toLowerCase();
    const positiveScore = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeScore = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  };

  const handleSubmit = async () => {
    if (!selectedType || !feedback.description) return;

    setSubmitting(true);

    try {
      const finalFeedback: FeedbackItem = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: selectedType,
        category: (feedback.category || 'general') as FeedbackItem['category'],
        rating: selectedType === 'rating' ? rating : undefined,
        title: feedback.title,
        description: feedback.description,
        screenshot,
        audioNote: audioBlob,
        context: feedback.context!,
        sentiment: analyzeSentiment(feedback.description),
        priority: rating <= 2 ? 'high' : rating <= 3 ? 'medium' : 'low',
        tags: feedback.tags || [],
        anonymous: feedback.anonymous || false
      };

      onFeedbackSubmit?.(finalFeedback);
      logger.info('Feedback submitted', { 
        feedbackId: finalFeedback.id, 
        type: selectedType, 
        sentiment: finalFeedback.sentiment 
      });

      setCurrentStep('confirm');
      
      // Auto-close after confirmation
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      logger.error('Feedback submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const feedbackTypes = [
    {
      type: 'rating' as const,
      icon: <Star className="w-6 h-6" />,
      title: '评分反馈',
      description: '对功能或体验进行评分',
      color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
    },
    {
      type: 'improvement' as const,
      icon: <Lightbulb className="w-6 h-6" />,
      title: '改进建议',
      description: '提出功能改进想法',
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    },
    {
      type: 'bug' as const,
      icon: <Bug className="w-6 h-6" />,
      title: '错误报告',
      description: '报告发现的问题',
      color: 'bg-red-100 text-red-700 hover:bg-red-200'
    },
    {
      type: 'feature' as const,
      icon: <Heart className="w-6 h-6" />,
      title: '功能请求',
      description: '希望新增的功能',
      color: 'bg-green-100 text-green-700 hover:bg-green-200'
    }
  ];

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6 z-50',
    'bottom-left': 'fixed bottom-6 left-6 z-50',
    'center': 'fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50',
    'sidebar': 'relative'
  };

  return (
    <div className={`${positionClasses[position]} ${className}`}>
      {/* Floating Button */}
      {showFloatingButton && !isOpen && position !== 'center' && position !== 'sidebar' && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleOpen}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors duration-200"
        >
          <MessageSquare className="w-6 h-6" />
        </motion.button>
      )}

      {/* Feedback Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-96 max-h-[600px] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                  {activePrompt?.title || '反馈建议'}
                </h3>
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {activePrompt?.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {activePrompt.description}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <AnimatePresence mode="wait">
                {currentStep === 'type' && (
                  <motion.div
                    key="type"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      选择反馈类型
                    </h4>
                    
                    {feedbackTypes.map(type => (
                      <button
                        key={type.type}
                        onClick={() => handleTypeSelect(type.type)}
                        className={`w-full p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 text-left ${type.color} dark:bg-gray-800 dark:text-gray-200`}
                      >
                        <div className="flex items-center space-x-3">
                          {type.icon}
                          <div>
                            <h5 className="font-medium">{type.title}</h5>
                            <p className="text-sm opacity-75">{type.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}

                {currentStep === 'details' && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    {/* Rating (for rating type) */}
                    {selectedType === 'rating' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          评分 *
                        </label>
                        <div className="flex space-x-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              onClick={() => setRating(star)}
                              className={`p-2 rounded-lg transition-colors duration-200 ${
                                rating >= star
                                  ? 'text-yellow-500'
                                  : 'text-gray-300 hover:text-yellow-400'
                              }`}
                            >
                              <Star className="w-8 h-8 fill-current" />
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm text-gray-500">
                            {rating === 1 ? '很差' : rating === 2 ? '较差' : rating === 3 ? '一般' : rating === 4 ? '良好' : rating === 5 ? '优秀' : '请评分'}
                          </span>
                          <div className="flex space-x-1">
                            {rating === 1 && <Frown className="w-5 h-5 text-red-500" />}
                            {rating === 2 && <Frown className="w-5 h-5 text-orange-500" />}
                            {rating === 3 && <Meh className="w-5 h-5 text-yellow-500" />}
                            {rating === 4 && <Smile className="w-5 h-5 text-green-500" />}
                            {rating === 5 && <Smile className="w-5 h-5 text-green-600" />}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        分类
                      </label>
                      <select
                        value={feedback.category || ''}
                        onChange={(e) => setFeedback(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">选择分类</option>
                        <option value="ui">界面设计</option>
                        <option value="performance">性能</option>
                        <option value="content">内容</option>
                        <option value="navigation">导航</option>
                        <option value="general">通用</option>
                      </select>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        标题
                      </label>
                      <input
                        type="text"
                        value={feedback.title || ''}
                        onChange={(e) => setFeedback(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="简短描述问题或建议"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        详细描述 *
                      </label>
                      <textarea
                        value={feedback.description || ''}
                        onChange={(e) => setFeedback(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="请详细描述您的反馈..."
                        required
                      />
                    </div>

                    {/* Attachments */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        附件 (可选)
                      </h5>
                      
                      <div className="flex space-x-2">
                        {allowScreenshot && (
                          <button
                            onClick={handleScreenshot}
                            className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                          >
                            <Camera className="w-4 h-4" />
                            <span>截图</span>
                          </button>
                        )}
                        
                        {allowAudio && (
                          <button
                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                            className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                              isRecording
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            <span>{isRecording ? '停止录音' : '语音备注'}</span>
                          </button>
                        )}
                      </div>

                      {/* Preview attachments */}
                      {screenshot && (
                        <div className="flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Image className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-700 dark:text-blue-300">
                            截图已添加
                          </span>
                          <button
                            onClick={() => setScreenshot(null)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {audioBlob && (
                        <div className="flex items-center space-x-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <Mic className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-700 dark:text-green-300">
                            语音备注已添加
                          </span>
                          <button
                            onClick={() => setAudioBlob(null)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Anonymous option */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="anonymous"
                        checked={feedback.anonymous || false}
                        onChange={(e) => setFeedback(prev => ({ ...prev, anonymous: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="anonymous" className="text-sm text-gray-700 dark:text-gray-300">
                        匿名提交
                      </label>
                    </div>
                  </motion.div>
                )}

                {currentStep === 'confirm' && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6"
                  >
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      反馈已提交
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      感谢您的反馈，我们会认真考虑您的建议！
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {currentStep !== 'confirm' && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  {currentStep === 'details' && (
                    <button
                      onClick={() => setCurrentStep('type')}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                    >
                      上一步
                    </button>
                  )}
                  
                  <div className="flex space-x-2 ml-auto">
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                    >
                      取消
                    </button>
                    
                    {currentStep === 'details' && (
                      <button
                        onClick={handleSubmit}
                        disabled={!feedback.description || submitting}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <Send className="w-4 h-4" />
                        <span>{submitting ? '提交中...' : '提交'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedbackCollector;