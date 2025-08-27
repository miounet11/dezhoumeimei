'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  Eye,
  EyeOff,
  Target,
  Brain,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  TrendingUp,
  X,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('personalized-hints');

interface Hint {
  id: string;
  type: 'strategy' | 'calculation' | 'psychology' | 'warning' | 'encouragement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  content: string;
  reasoning: string;
  skillFocus: string[];
  triggeredBy: string;
  timing: 'immediate' | 'delayed' | 'contextual';
  adaptationLevel: number; // 1-5, how personalized this hint is
  confidence: number; // 0-1, AI's confidence in this hint
  expectedImpact: 'high' | 'medium' | 'low';
  previouslyShown?: boolean;
  effectiveness?: number; // user feedback 0-1
}

interface UserLearningProfile {
  learningStyle: 'visual' | 'practical' | 'theoretical' | 'social';
  preferredHintLevel: 'minimal' | 'moderate' | 'detailed';
  weaknessPatterns: Array<{
    pattern: string;
    severity: number;
    frequency: number;
  }>;
  skillGaps: Record<string, number>;
  attentionSpan: number; // seconds
  recentMistakes: string[];
}

interface PersonalizedHintsProps {
  userId: string;
  gameContext?: {
    situation: string;
    position: string;
    stackSize: number;
    potSize: number;
    opponentCount: number;
  };
  userProfile: UserLearningProfile;
  currentSkill?: string;
  showHints?: boolean;
  enableVoice?: boolean;
  adaptiveMode?: boolean;
  onHintFeedback?: (hintId: string, helpful: boolean, rating?: number) => void;
  onHintDismiss?: (hintId: string, reason: string) => void;
  className?: string;
}

export const PersonalizedHints: React.FC<PersonalizedHintsProps> = ({
  userId,
  gameContext,
  userProfile,
  currentSkill,
  showHints = true,
  enableVoice = false,
  adaptiveMode = true,
  onHintFeedback,
  onHintDismiss,
  className = ''
}) => {
  const [activeHints, setActiveHints] = useState<Hint[]>([]);
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());
  const [hintSettings, setHintSettings] = useState({
    enabled: showHints,
    level: userProfile.preferredHintLevel,
    voice: enableVoice,
    adaptive: adaptiveMode
  });
  const [showSettings, setShowSettings] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [hintHistory, setHintHistory] = useState<string[]>([]);

  useEffect(() => {
    if (hintSettings.enabled) {
      generatePersonalizedHints();
    } else {
      setActiveHints([]);
    }
  }, [gameContext, userProfile, currentSkill, hintSettings]);

  const generatePersonalizedHints = () => {
    const hints: Hint[] = [];

    // Generate strategy hints based on weakness patterns
    userProfile.weaknessPatterns.forEach(weakness => {
      if (weakness.severity > 0.6 && weakness.frequency > 0.3) {
        const strategyHint = generateStrategyHint(weakness);
        if (strategyHint) hints.push(strategyHint);
      }
    });

    // Generate contextual hints based on game situation
    if (gameContext) {
      const contextualHints = generateContextualHints(gameContext);
      hints.push(...contextualHints);
    }

    // Generate skill-specific hints
    if (currentSkill && userProfile.skillGaps[currentSkill] > 200) {
      const skillHint = generateSkillHint(currentSkill);
      if (skillHint) hints.push(skillHint);
    }

    // Generate encouragement hints based on recent performance
    const encouragementHint = generateEncouragementHint();
    if (encouragementHint) hints.push(encouragementHint);

    // Sort by priority and filter
    const prioritizedHints = hints
      .sort((a, b) => getPriorityScore(b) - getPriorityScore(a))
      .filter(hint => !dismissedHints.has(hint.id))
      .slice(0, getMaxHints());

    setActiveHints(prioritizedHints);
    
    // Voice announcement for critical hints
    if (hintSettings.voice && prioritizedHints.some(h => h.priority === 'critical')) {
      announceHint(prioritizedHints.find(h => h.priority === 'critical')!);
    }

    logger.info('Personalized hints generated', { 
      count: prioritizedHints.length, 
      userId,
      context: gameContext?.situation 
    });
  };

  const generateStrategyHint = (weakness: { pattern: string; severity: number }): Hint | null => {
    const hintMap: Record<string, Omit<Hint, 'id'>> = {
      '过度保守': {
        type: 'strategy',
        priority: 'high',
        title: '考虑更积极的策略',
        content: '在有价值的情况下，不要害怕下注。您的牌力足够支持更激进的打法。',
        reasoning: '根据您的历史数据，您在强牌时过于保守，错失了价值',
        skillFocus: ['postflop', 'value_betting'],
        triggeredBy: 'weakness_pattern',
        timing: 'contextual',
        adaptationLevel: 4,
        confidence: 0.85,
        expectedImpact: 'high'
      },
      '过度激进': {
        type: 'strategy',
        priority: 'high',
        title: '控制激进程度',
        content: '在不确定的情况下，保持谨慎。考虑对手的可能手牌范围。',
        reasoning: '您倾向于过度激进，这在某些情况下可能导致损失',
        skillFocus: ['psychology', 'hand_reading'],
        triggeredBy: 'weakness_pattern',
        timing: 'immediate',
        adaptationLevel: 4,
        confidence: 0.82,
        expectedImpact: 'high'
      },
      '错失价值': {
        type: 'strategy',
        priority: 'medium',
        title: '寻找价值下注机会',
        content: '当您有强牌时，考虑如何从弱牌中获得更多价值。',
        reasoning: '您经常在有强牌时未能最大化价值',
        skillFocus: ['value_betting', 'bet_sizing'],
        triggeredBy: 'weakness_pattern',
        timing: 'contextual',
        adaptationLevel: 3,
        confidence: 0.78,
        expectedImpact: 'medium'
      }
    };

    const hintTemplate = hintMap[weakness.pattern];
    if (!hintTemplate) return null;

    return {
      id: `strategy_${weakness.pattern}_${Date.now()}`,
      ...hintTemplate
    };
  };

  const generateContextualHints = (context: typeof gameContext): Hint[] => {
    if (!context) return [];

    const hints: Hint[] = [];

    // Position-based hints
    if (context.position === 'early' && context.opponentCount > 5) {
      hints.push({
        id: `context_position_${Date.now()}`,
        type: 'strategy',
        priority: 'medium',
        title: '早期位置要谨慎',
        content: '在早期位置面对多个对手时，应该收紧手牌范围。',
        reasoning: '多人底池中早期位置的不利因素',
        skillFocus: ['preflop', 'position'],
        triggeredBy: 'position_analysis',
        timing: 'immediate',
        adaptationLevel: 2,
        confidence: 0.9,
        expectedImpact: 'medium'
      });
    }

    // Stack size hints
    if (context.stackSize < context.potSize * 2) {
      hints.push({
        id: `context_stack_${Date.now()}`,
        type: 'warning',
        priority: 'high',
        title: '注意筹码量',
        content: '您的筹码相对底池很小，考虑全下或放弃。',
        reasoning: '短筹码情况需要调整策略',
        skillFocus: ['tournament', 'stack_management'],
        triggeredBy: 'stack_analysis',
        timing: 'immediate',
        adaptationLevel: 3,
        confidence: 0.95,
        expectedImpact: 'high'
      });
    }

    return hints;
  };

  const generateSkillHint = (skill: string): Hint | null => {
    const skillHints: Record<string, Omit<Hint, 'id'>> = {
      'hand_reading': {
        type: 'psychology',
        priority: 'medium',
        title: '练习读牌技巧',
        content: '观察对手的下注模式和时机，这能帮助您更好地判断他们的手牌范围。',
        reasoning: '您在读牌方面还有提升空间',
        skillFocus: ['psychology', 'hand_reading'],
        triggeredBy: 'skill_gap_analysis',
        timing: 'contextual',
        adaptationLevel: 3,
        confidence: 0.75,
        expectedImpact: 'medium'
      },
      'pot_odds': {
        type: 'calculation',
        priority: 'medium',
        title: '计算底池赔率',
        content: '快速计算：所需赔率 = 跟注额 / (底池 + 跟注额)。这个决策很重要。',
        reasoning: '数学计算是您需要加强的领域',
        skillFocus: ['mathematics', 'pot_odds'],
        triggeredBy: 'skill_gap_analysis',
        timing: 'immediate',
        adaptationLevel: 4,
        confidence: 0.9,
        expectedImpact: 'high'
      }
    };

    const hintTemplate = skillHints[skill];
    if (!hintTemplate) return null;

    return {
      id: `skill_${skill}_${Date.now()}`,
      ...hintTemplate
    };
  };

  const generateEncouragementHint = (): Hint | null => {
    // This would be based on recent performance data
    return {
      id: `encouragement_${Date.now()}`,
      type: 'encouragement',
      priority: 'low',
      title: '保持专注',
      content: '您今天的表现很好！继续运用您学到的策略。',
      reasoning: '正面反馈有助于保持学习动力',
      skillFocus: ['mindset'],
      triggeredBy: 'performance_analysis',
      timing: 'delayed',
      adaptationLevel: 2,
      confidence: 0.7,
      expectedImpact: 'low'
    };
  };

  const getPriorityScore = (hint: Hint): number => {
    const priorityScores = { critical: 4, high: 3, medium: 2, low: 1 };
    const baseScore = priorityScores[hint.priority];
    const adaptationBonus = hint.adaptationLevel * 0.2;
    const confidenceBonus = hint.confidence * 0.5;
    
    return baseScore + adaptationBonus + confidenceBonus;
  };

  const getMaxHints = (): number => {
    const levelLimits = {
      minimal: 1,
      moderate: 2,
      detailed: 3
    };
    return levelLimits[hintSettings.level];
  };

  const announceHint = (hint: Hint) => {
    if ('speechSynthesis' in window && hintSettings.voice) {
      const utterance = new SpeechSynthesisUtterance(hint.content);
      utterance.rate = 0.8;
      utterance.pitch = 1.1;
      speechSynthesis.speak(utterance);
    }
  };

  const handleHintFeedback = (hint: Hint, helpful: boolean, rating?: number) => {
    onHintFeedback?.(hint.id, helpful, rating);
    setHintHistory(prev => [...prev, hint.id]);
    logger.info('Hint feedback provided', { hintId: hint.id, helpful, rating });
  };

  const handleHintDismiss = (hint: Hint, reason: string) => {
    setDismissedHints(prev => new Set([...prev, hint.id]));
    setActiveHints(prev => prev.filter(h => h.id !== hint.id));
    onHintDismiss?.(hint.id, reason);
    logger.info('Hint dismissed', { hintId: hint.id, reason });
  };

  const getHintIcon = (type: string) => {
    const icons = {
      strategy: <Target className="w-4 h-4" />,
      calculation: <Brain className="w-4 h-4" />,
      psychology: <Eye className="w-4 h-4" />,
      warning: <AlertTriangle className="w-4 h-4" />,
      encouragement: <Star className="w-4 h-4" />
    };
    return icons[type as keyof typeof icons] || <Lightbulb className="w-4 h-4" />;
  };

  const getHintColor = (type: string, priority: string) => {
    if (priority === 'critical') return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    
    const colors = {
      strategy: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
      calculation: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
      psychology: 'border-green-500 bg-green-50 dark:bg-green-900/20',
      warning: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
      encouragement: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
    };
    
    return colors[type as keyof typeof colors] || colors.strategy;
  };

  if (!hintSettings.enabled || activeHints.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Settings Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            个性化提示 ({activeHints.length})
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setHintSettings(prev => ({ ...prev, voice: !prev.voice }))}
            className={`p-1 rounded transition-colors duration-200 ${
              hintSettings.voice 
                ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/20' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
            title="语音提示"
          >
            {hintSettings.voice ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            title="设置"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setHintSettings(prev => ({ ...prev, enabled: false }))}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
            title="隐藏提示"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  提示详细程度
                </label>
                <div className="flex space-x-2">
                  {(['minimal', 'moderate', 'detailed'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setHintSettings(prev => ({ ...prev, level }))}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${
                        hintSettings.level === level
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {level === 'minimal' ? '简洁' : level === 'moderate' ? '适中' : '详细'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">智能适应</span>
                <button
                  onClick={() => setHintSettings(prev => ({ ...prev, adaptive: !prev.adaptive }))}
                  className={`
                    relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                    ${hintSettings.adaptive ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-3 w-3 transform rounded-full bg-white transition-transform
                      ${hintSettings.adaptive ? 'translate-x-5' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Hints */}
      <AnimatePresence mode="popLayout">
        {activeHints.map((hint, index) => (
          <motion.div
            key={hint.id}
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`
              relative rounded-lg border-l-4 p-4 shadow-sm
              ${getHintColor(hint.type, hint.priority)}
            `}
          >
            {/* Hint Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={`mt-0.5 ${hint.priority === 'critical' ? 'text-red-600' : 'text-gray-600'}`}>
                  {getHintIcon(hint.type)}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {hint.title}
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                    {hint.content}
                  </p>

                  {/* Reasoning (for detailed level) */}
                  {hintSettings.level === 'detailed' && (
                    <p className="text-gray-600 dark:text-gray-400 text-xs mt-2 italic">
                      💡 {hint.reasoning}
                    </p>
                  )}

                  {/* Hint Metadata */}
                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>{hint.expectedImpact === 'high' ? '高影响' : hint.expectedImpact === 'medium' ? '中影响' : '低影响'}</span>
                    </span>
                    
                    <span className="flex items-center space-x-1">
                      <Target className="w-3 h-3" />
                      <span>{hint.skillFocus.join(', ')}</span>
                    </span>
                    
                    <span>
                      {Math.round(hint.confidence * 100)}% 置信度
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={() => handleHintFeedback(hint, true, 5)}
                  className="p-1 text-gray-400 hover:text-green-600 transition-colors duration-200"
                  title="有用"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleHintFeedback(hint, false, 1)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                  title="无用"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleHintDismiss(hint, 'user_dismissed')}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  title="关闭"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Priority Indicator */}
            {hint.priority === 'critical' && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
              />
            )}

            {/* Adaptation Level Indicator */}
            {hint.adaptationLevel >= 4 && (
              <div className="absolute top-2 right-2">
                <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  <Brain className="w-3 h-3" />
                  <span>高度个性化</span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Re-enable Button */}
      {!hintSettings.enabled && (
        <button
          onClick={() => setHintSettings(prev => ({ ...prev, enabled: true }))}
          className="w-full py-2 px-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors duration-200"
        >
          <Eye className="w-4 h-4 inline mr-2" />
          显示个性化提示
        </button>
      )}
    </div>
  );
};

export default PersonalizedHints;