'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Beaker,
  Info,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Target,
  Settings,
  Eye,
  EyeOff,
  BarChart3,
  Zap
} from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ab-test-notice');

interface ABTest {
  id: string;
  name: string;
  description: string;
  variant: 'A' | 'B' | 'C';
  variantName: string;
  category: 'ui' | 'algorithm' | 'content' | 'feature';
  objective: string;
  duration: {
    start: string;
    end: string;
    remaining: number; // days
  };
  participation: {
    isParticipating: boolean;
    canOptOut: boolean;
    enrolledAt?: string;
    optedOutAt?: string;
  };
  impact: {
    level: 'low' | 'medium' | 'high';
    areas: string[];
    benefits: string[];
    risks: string[];
  };
  progress: {
    dataCollected: number; // percentage
    minSampleSize: number;
    currentSampleSize: number;
  };
  privacy: {
    dataTypes: string[];
    retention: string;
    anonymous: boolean;
  };
}

interface ABTestNoticeProps {
  tests: ABTest[];
  position?: 'top' | 'bottom' | 'sidebar' | 'modal';
  showDetails?: boolean;
  allowOptOut?: boolean;
  onOptOut?: (testId: string) => void;
  onOptIn?: (testId: string) => void;
  onViewDetails?: (testId: string) => void;
  className?: string;
}

export const ABTestNotice: React.FC<ABTestNoticeProps> = ({
  tests,
  position = 'top',
  showDetails = true,
  allowOptOut = true,
  onOptOut,
  onOptIn,
  onViewDetails,
  className = ''
}) => {
  const [dismissedTests, setDismissedTests] = useState<Set<string>>(new Set());
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [showAllTests, setShowAllTests] = useState(false);
  const [consentGiven, setConsentGiven] = useState<Record<string, boolean>>({});

  const activeTests = tests.filter(test => 
    test.participation.isParticipating && 
    !dismissedTests.has(test.id)
  );

  const optionalTests = tests.filter(test => 
    !test.participation.isParticipating && 
    test.participation.canOptOut
  );

  useEffect(() => {
    // Load consent status from localStorage
    const savedConsent = localStorage.getItem('ab_test_consent');
    if (savedConsent) {
      setConsentGiven(JSON.parse(savedConsent));
    }
  }, []);

  const handleDismiss = (testId: string) => {
    setDismissedTests(prev => new Set([...prev, testId]));
    logger.info('AB test notice dismissed', { testId });
  };

  const handleOptOut = (test: ABTest) => {
    onOptOut?.(test.id);
    handleDismiss(test.id);
    logger.info('User opted out of AB test', { testId: test.id, variant: test.variant });
  };

  const handleOptIn = (test: ABTest) => {
    onOptIn?.(test.id);
    setConsentGiven(prev => {
      const updated = { ...prev, [test.id]: true };
      localStorage.setItem('ab_test_consent', JSON.stringify(updated));
      return updated;
    });
    logger.info('User opted into AB test', { testId: test.id, variant: test.variant });
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      ui: <Settings className="w-4 h-4" />,
      algorithm: <Zap className="w-4 h-4" />,
      content: <Target className="w-4 h-4" />,
      feature: <BarChart3 className="w-4 h-4" />
    };
    return icons[category as keyof typeof icons] || <Beaker className="w-4 h-4" />;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      ui: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      algorithm: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
      content: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      feature: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
    };
    return colors[category as keyof typeof colors] || colors.ui;
  };

  const getImpactColor = (level: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600'
    };
    return colors[level as keyof typeof colors] || colors.medium;
  };

  const formatDaysRemaining = (days: number) => {
    if (days <= 0) return '即将结束';
    if (days === 1) return '剩余1天';
    if (days <= 7) return `剩余${days}天`;
    if (days <= 30) return `剩余${Math.ceil(days / 7)}周`;
    return `剩余${Math.ceil(days / 30)}个月`;
  };

  if (activeTests.length === 0 && optionalTests.length === 0) {
    return null;
  }

  const containerClasses = {
    top: 'fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md',
    bottom: 'fixed bottom-4 right-4 z-50 max-w-sm',
    sidebar: 'sticky top-4 max-w-xs',
    modal: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
  };

  return (
    <div className={`${containerClasses[position]} ${className}`}>
      <AnimatePresence>
        {/* Active AB Tests */}
        {activeTests.map((test, index) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="mb-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getCategoryColor(test.category)}`}>
                    <Beaker className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        实验测试
                      </h4>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                        {test.variantName}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      您正在参与我们的产品优化测试
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {showDetails && (
                    <button
                      onClick={() => setExpandedTest(expandedTest === test.id ? null : test.id)}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                      title="查看详情"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  )}
                  
                  {allowOptOut && test.participation.canOptOut && (
                    <button
                      onClick={() => handleOptOut(test)}
                      className="p-1 text-gray-500 hover:text-red-600 transition-colors duration-200"
                      title="退出测试"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Info */}
              <div className="flex items-center space-x-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDaysRemaining(test.duration.remaining)}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{test.progress.currentSampleSize}+ 参与者</span>
                </div>
                
                <div className={`flex items-center space-x-1 ${getImpactColor(test.impact.level)}`}>
                  <Target className="w-3 h-3" />
                  <span>{test.impact.level === 'low' ? '轻微' : test.impact.level === 'medium' ? '适中' : '显著'}影响</span>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
              {expandedTest === test.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                >
                  <div className="p-4 space-y-4">
                    {/* Test Description */}
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                        测试说明
                      </h5>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {test.description}
                      </p>
                    </div>

                    {/* Objective */}
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                        测试目标
                      </h5>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {test.objective}
                      </p>
                    </div>

                    {/* Impact Areas */}
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                        影响范围
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {test.impact.areas.map(area => (
                          <span
                            key={area}
                            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Benefits & Risks */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-green-700 dark:text-green-300 text-sm mb-2">
                          潜在收益
                        </h5>
                        <ul className="space-y-1">
                          {test.impact.benefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-start space-x-1 text-xs">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="font-medium text-orange-700 dark:text-orange-300 text-sm mb-2">
                          注意事项
                        </h5>
                        <ul className="space-y-1">
                          {test.impact.risks.map((risk, idx) => (
                            <li key={idx} className="flex items-start space-x-1 text-xs">
                              <AlertCircle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400">{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Privacy Information */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                      <h5 className="font-medium text-blue-800 dark:text-blue-200 text-sm mb-2">
                        隐私保护
                      </h5>
                      <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                        <div className="flex items-center space-x-2">
                          <Eye className="w-3 h-3" />
                          <span>收集数据：{test.privacy.dataTypes.join(', ')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3 h-3" />
                          <span>保存期限：{test.privacy.retention}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {test.privacy.anonymous ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-orange-500" />
                          )}
                          <span>{test.privacy.anonymous ? '完全匿名' : '可识别身份'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-700 dark:text-gray-300">数据收集进度</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {test.progress.dataCollected}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <motion.div
                          className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${test.progress.dataCollected}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => onViewDetails?.(test.id)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        了解更多
                      </button>
                      
                      {allowOptOut && test.participation.canOptOut && (
                        <button
                          onClick={() => handleOptOut(test)}
                          className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                        >
                          退出测试
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {/* Optional AB Tests */}
        {optionalTests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-700 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Beaker className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-purple-800 dark:text-purple-200">
                  可选实验
                </h4>
              </div>
              
              <button
                onClick={() => setShowAllTests(!showAllTests)}
                className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm"
              >
                {showAllTests ? '收起' : `查看 ${optionalTests.length} 个实验`}
              </button>
            </div>

            <p className="text-purple-700 dark:text-purple-300 text-sm mb-3">
              参与可选实验，帮助我们改善产品体验
            </p>

            <AnimatePresence>
              {showAllTests && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  {optionalTests.map(test => (
                    <div
                      key={test.id}
                      className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                            {test.name}
                          </h5>
                          <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                            {test.description}
                          </p>
                          
                          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              {getCategoryIcon(test.category)}
                              <span>{test.category}</span>
                            </div>
                            
                            <div className={`flex items-center space-x-1 ${getImpactColor(test.impact.level)}`}>
                              <Target className="w-3 h-3" />
                              <span>{test.impact.level === 'low' ? '低' : test.impact.level === 'medium' ? '中' : '高'}影响</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOptIn(test)}
                          className="ml-3 px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors duration-200"
                        >
                          加入
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ABTestNotice;