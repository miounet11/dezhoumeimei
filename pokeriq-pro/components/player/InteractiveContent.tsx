'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  InteractiveData,
  InteractiveHotspot,
  InteractiveScenario,
  InlineQuiz,
  InteractiveNote,
  ContentOverlay
} from '../../lib/player/content-types';

interface InteractiveContentProps {
  data: InteractiveData;
  onProgress?: (progress: any) => void;
  onComplete?: () => void;
  className?: string;
}

// Hotspot component for clickable areas
function HotspotComponent({ 
  hotspot, 
  onClick 
}: { 
  hotspot: InteractiveHotspot; 
  onClick: (hotspot: InteractiveHotspot) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    // Show hotspot based on time range
    const checkVisibility = () => {
      const currentTime = 0; // This would come from video player context
      const isInRange = currentTime >= hotspot.timeRange.start && currentTime <= hotspot.timeRange.end;
      setIsVisible(isInRange);
    };

    const interval = setInterval(checkVisibility, 100);
    return () => clearInterval(interval);
  }, [hotspot]);

  if (!isVisible) return null;

  const hotspotStyle = {
    position: 'absolute' as const,
    left: `${hotspot.position.x}%`,
    top: `${hotspot.position.y}%`,
    width: `${hotspot.size.width}%`,
    height: `${hotspot.size.height}%`,
    backgroundColor: hotspot.styling?.backgroundColor || 'rgba(59, 130, 246, 0.3)',
    borderColor: hotspot.styling?.borderColor || '#3b82f6',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderRadius: '4px',
    opacity: hotspot.styling?.opacity || (isHovered ? 0.8 : 0.5),
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const getAnimationClass = () => {
    switch (hotspot.styling?.animation) {
      case 'pulse':
        return 'animate-pulse';
      case 'bounce':
        return 'animate-bounce';
      case 'fade':
        return 'animate-fade-in';
      default:
        return '';
    }
  };

  return (
    <div
      style={hotspotStyle}
      className={`hotspot ${getAnimationClass()} ${isHovered ? 'scale-105' : ''}`}
      onClick={() => onClick(hotspot)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={hotspot.content.title || '点击查看详情'}
    >
      {/* Hotspot indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {hotspot.type === 'quiz' ? '?' :
           hotspot.type === 'note' ? '📝' :
           hotspot.type === 'link' ? '🔗' : 'ℹ️'}
        </div>
      </div>
    </div>
  );
}

// Scenario component for poker scenarios and other interactive situations
function ScenarioComponent({ 
  scenario, 
  onChoice,
  onComplete 
}: { 
  scenario: InteractiveScenario; 
  onChoice: (choiceId: string, isOptimal: boolean) => void;
  onComplete: () => void;
}) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(scenario.timeLimit || 30);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!scenario.timeLimit) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [scenario.timeLimit]);

  const handleChoiceSelect = (choiceId: string) => {
    if (!isActive || selectedChoice) return;
    
    setSelectedChoice(choiceId);
    setShowFeedback(true);
    setIsActive(false);

    const choice = scenario.scenario.choices.find(c => c.id === choiceId);
    if (choice) {
      onChoice(choiceId, choice.isOptimal || false);
    }

    // Auto-complete after showing feedback
    setTimeout(() => {
      onComplete();
    }, 3000);
  };

  const handleSkip = () => {
    setIsActive(false);
    onComplete();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg border">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{scenario.title}</h3>
        <p className="text-gray-600">{scenario.description}</p>
        
        {scenario.timeLimit && isActive && (
          <div className="mt-3 flex items-center space-x-2">
            <span className="text-sm text-gray-500">剩余时间:</span>
            <span className={`text-lg font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-blue-500'}`}>
              {timeLeft}s
            </span>
          </div>
        )}
      </div>

      {/* Scenario Context */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">情况描述</h4>
        <p className="text-gray-700">{scenario.scenario.situation}</p>
        
        {/* Context visualization - for poker scenarios */}
        {scenario.scenario.context && (
          <div className="mt-3 p-3 bg-green-100 rounded border">
            <div className="text-sm font-mono">
              {/* This would render poker game state visualization */}
              <div className="text-center text-gray-600">
                📄 游戏状态可视化区域
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Choices */}
      <div className="space-y-3">
        {scenario.scenario.choices.map((choice) => {
          const isSelected = selectedChoice === choice.id;
          const isOptimal = choice.isOptimal;
          
          let buttonClass = 'w-full p-4 text-left border rounded-lg transition-all duration-200 ';
          
          if (!isActive) {
            buttonClass += 'cursor-not-allowed opacity-50 ';
          } else {
            buttonClass += 'cursor-pointer hover:bg-gray-50 ';
          }

          if (showFeedback && isSelected) {
            buttonClass += isOptimal ? 'border-green-500 bg-green-50 ' : 'border-red-500 bg-red-50 ';
          } else if (showFeedback && isOptimal) {
            buttonClass += 'border-green-500 bg-green-50 ';
          } else {
            buttonClass += 'border-gray-300 ';
          }

          return (
            <button
              key={choice.id}
              onClick={() => handleChoiceSelect(choice.id)}
              disabled={!isActive}
              className={buttonClass}
            >
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-sm font-medium">
                  {String.fromCharCode(65 + scenario.scenario.choices.indexOf(choice))}
                </span>
                <div className="flex-1">
                  <p className="text-gray-900">{choice.text}</p>
                  
                  {showFeedback && isSelected && choice.feedback && (
                    <div className="mt-2 p-2 rounded bg-white border text-sm">
                      <div className={`font-medium ${isOptimal ? 'text-green-600' : 'text-red-600'}`}>
                        {isOptimal ? '✅ 正确选择!' : '❌ 次优选择'}
                      </div>
                      <p className="text-gray-600 mt-1">{choice.feedback}</p>
                    </div>
                  )}
                  
                  {showFeedback && !isSelected && isOptimal && (
                    <div className="mt-2 p-2 rounded bg-green-50 border border-green-200 text-sm">
                      <div className="font-medium text-green-600">✅ 最佳选择</div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 flex justify-between items-center">
        {scenario.canSkip && isActive && (
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            跳过
          </button>
        )}
        
        {scenario.points && (
          <div className="text-sm text-gray-500">
            奖励积分: {scenario.points}
          </div>
        )}
      </div>

      {/* Time's up overlay */}
      {timeLeft === 0 && !selectedChoice && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
          <div className="bg-white p-6 rounded-lg text-center">
            <div className="text-4xl mb-2">⏰</div>
            <h3 className="text-lg font-bold mb-2">时间到!</h3>
            <p className="text-gray-600 mb-4">您没有在规定时间内做出选择</p>
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              继续
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Quiz component for inline quizzes
function QuizComponent({ 
  quiz, 
  onAnswer 
}: { 
  quiz: InlineQuiz; 
  onAnswer: (isCorrect: boolean, answer: string) => void;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit || 60);

  useEffect(() => {
    if (!quiz.timeLimit) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz.timeLimit]);

  const handleSubmit = () => {
    if (!selectedAnswer && quiz.timeLimit && timeLeft > 0) return;
    
    const isCorrect = Array.isArray(quiz.correctAnswer) 
      ? quiz.correctAnswer.includes(selectedAnswer)
      : quiz.correctAnswer === selectedAnswer;
    
    setShowResult(true);
    onAnswer(isCorrect, selectedAnswer);
  };

  const getDifficultyColor = () => {
    switch (quiz.difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg border">
      {/* Header */}
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">快速测试</h3>
          <span className={`text-sm font-medium ${getDifficultyColor()}`}>
            {quiz.difficulty === 'easy' ? '简单' : 
             quiz.difficulty === 'medium' ? '中等' : '困难'}
          </span>
        </div>
        
        {quiz.timeLimit && timeLeft > 0 && !showResult && (
          <div className="text-right">
            <div className="text-sm text-gray-500">剩余时间</div>
            <div className={`text-lg font-bold ${timeLeft <= 10 ? 'text-red-500' : 'text-blue-500'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="mb-6">
        <p className="text-gray-800 text-lg leading-relaxed">{quiz.question}</p>
      </div>

      {/* Answer Options */}
      {quiz.type === 'multiple-choice' && quiz.options && (
        <div className="space-y-3 mb-6">
          {quiz.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = Array.isArray(quiz.correctAnswer) 
              ? quiz.correctAnswer.includes(option)
              : quiz.correctAnswer === option;
            
            let optionClass = 'w-full p-3 text-left border rounded-lg transition-colors ';
            
            if (showResult) {
              if (isSelected && isCorrect) {
                optionClass += 'border-green-500 bg-green-50 text-green-800';
              } else if (isSelected && !isCorrect) {
                optionClass += 'border-red-500 bg-red-50 text-red-800';
              } else if (isCorrect) {
                optionClass += 'border-green-500 bg-green-50 text-green-800';
              } else {
                optionClass += 'border-gray-300 bg-gray-50 text-gray-600';
              }
            } else {
              optionClass += isSelected 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:bg-gray-50 cursor-pointer';
            }

            return (
              <button
                key={index}
                onClick={() => !showResult && setSelectedAnswer(option)}
                disabled={showResult}
                className={optionClass}
              >
                <div className="flex items-center space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                  {showResult && isCorrect && (
                    <span className="ml-auto text-green-600">✓</span>
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <span className="ml-auto text-red-600">✗</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {quiz.type === 'true-false' && (
        <div className="flex space-x-4 mb-6">
          {['true', 'false'].map((option) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = quiz.correctAnswer === option;
            
            let buttonClass = 'flex-1 p-4 text-center border rounded-lg transition-colors ';
            
            if (showResult) {
              if (isSelected && isCorrect) {
                buttonClass += 'border-green-500 bg-green-50 text-green-800';
              } else if (isSelected && !isCorrect) {
                buttonClass += 'border-red-500 bg-red-50 text-red-800';
              } else if (isCorrect) {
                buttonClass += 'border-green-500 bg-green-50 text-green-800';
              } else {
                buttonClass += 'border-gray-300 bg-gray-50 text-gray-600';
              }
            } else {
              buttonClass += isSelected 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:bg-gray-50 cursor-pointer';
            }

            return (
              <button
                key={option}
                onClick={() => !showResult && setSelectedAnswer(option)}
                disabled={showResult}
                className={buttonClass}
              >
                <div className="text-lg font-semibold">
                  {option === 'true' ? '正确 ✓' : '错误 ✗'}
                </div>
                {showResult && isCorrect && (
                  <div className="text-green-600 mt-1">正确答案</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {quiz.type === 'fill-blank' && (
        <div className="mb-6">
          <input
            type="text"
            value={selectedAnswer}
            onChange={(e) => setSelectedAnswer(e.target.value)}
            disabled={showResult}
            placeholder="请输入答案..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>
      )}

      {/* Result and Explanation */}
      {showResult && (
        <div className={`p-4 rounded-lg mb-4 ${
          Array.isArray(quiz.correctAnswer) 
            ? quiz.correctAnswer.includes(selectedAnswer) ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            : quiz.correctAnswer === selectedAnswer ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className={`font-semibold mb-2 ${
            Array.isArray(quiz.correctAnswer) 
              ? quiz.correctAnswer.includes(selectedAnswer) ? 'text-green-800' : 'text-red-800'
              : quiz.correctAnswer === selectedAnswer ? 'text-green-800' : 'text-red-800'
          }`}>
            {Array.isArray(quiz.correctAnswer) 
              ? quiz.correctAnswer.includes(selectedAnswer) ? '回答正确！' : '回答错误'
              : quiz.correctAnswer === selectedAnswer ? '回答正确！' : '回答错误'}
          </div>
          
          {quiz.explanation && (
            <p className="text-gray-700">{quiz.explanation}</p>
          )}
        </div>
      )}

      {/* Submit Button */}
      {!showResult && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            积分: {quiz.points}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            提交答案
          </button>
        </div>
      )}
    </div>
  );
}

// Main Interactive Content Component
export default function InteractiveContent({
  data,
  onProgress,
  onComplete,
  className = ''
}: InteractiveContentProps) {
  const [activeScenario, setActiveScenario] = useState<InteractiveScenario | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<InlineQuiz | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<InteractiveHotspot | null>(null);
  const [completedInteractions, setCompletedInteractions] = useState<Set<string>>(new Set());
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleHotspotClick = useCallback((hotspot: InteractiveHotspot) => {
    setSelectedHotspot(hotspot);
    
    // Handle different hotspot types
    switch (hotspot.type) {
      case 'quiz':
        // Find associated quiz
        const quiz = data.quizzes?.find(q => q.id === hotspot.content.data?.quizId);
        if (quiz) {
          setActiveQuiz(quiz);
        }
        break;
      
      case 'link':
        if (hotspot.content.action) {
          window.open(hotspot.content.action, '_blank');
        }
        break;
      
      default:
        // Show hotspot content in modal or overlay
        break;
    }

    setCompletedInteractions(prev => new Set([...prev, hotspot.id]));
  }, [data.quizzes]);

  const handleScenarioChoice = useCallback((choiceId: string, isOptimal: boolean) => {
    onProgress?.({
      interactionType: 'scenario',
      scenarioId: activeScenario?.id,
      choiceId,
      isOptimal,
      timestamp: new Date()
    });
  }, [activeScenario, onProgress]);

  const handleScenarioComplete = useCallback(() => {
    if (activeScenario) {
      setCompletedInteractions(prev => new Set([...prev, activeScenario.id]));
      setActiveScenario(null);
    }
  }, [activeScenario]);

  const handleQuizAnswer = useCallback((isCorrect: boolean, answer: string) => {
    if (activeQuiz) {
      setCompletedInteractions(prev => new Set([...prev, activeQuiz.id]));
      
      onProgress?.({
        interactionType: 'quiz',
        quizId: activeQuiz.id,
        answer,
        isCorrect,
        points: isCorrect ? activeQuiz.points : 0,
        timestamp: new Date()
      });
      
      setTimeout(() => {
        setActiveQuiz(null);
      }, 2000);
    }
  }, [activeQuiz, onProgress]);

  // Check if all interactions are completed
  const allInteractionsComplete = useMemo(() => {
    const totalInteractions = [
      ...(data.scenarios || []),
      ...(data.quizzes || []),
      ...(data.hotspots?.filter(h => h.type !== 'hover') || [])
    ].length;
    
    return completedInteractions.size >= totalInteractions && totalInteractions > 0;
  }, [data, completedInteractions]);

  useEffect(() => {
    if (allInteractionsComplete) {
      onComplete?.();
    }
  }, [allInteractionsComplete, onComplete]);

  // Auto-trigger scenarios based on time
  useEffect(() => {
    if (!data.scenarios) return;

    const checkScenarios = () => {
      const currentTime = 0; // This would come from video player context
      
      const triggerScenario = data.scenarios.find(scenario => 
        !completedInteractions.has(scenario.id) &&
        currentTime >= scenario.triggerTime &&
        !activeScenario &&
        !activeQuiz
      );

      if (triggerScenario) {
        setActiveScenario(triggerScenario);
      }
    };

    const interval = setInterval(checkScenarios, 1000);
    return () => clearInterval(interval);
  }, [data.scenarios, completedInteractions, activeScenario, activeQuiz]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hotspots Layer */}
      {data.hotspots && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="relative w-full h-full pointer-events-auto">
            {data.hotspots.map(hotspot => (
              <HotspotComponent
                key={hotspot.id}
                hotspot={hotspot}
                onClick={handleHotspotClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Content Overlays */}
      {data.overlays && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {data.overlays.map(overlay => {
            // Render overlays based on time and position
            return (
              <div key={overlay.id} className="overlay-content">
                {/* Overlay rendering logic */}
              </div>
            );
          })}
        </div>
      )}

      {/* Active Scenario Modal */}
      {activeScenario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl max-h-screen overflow-y-auto">
            <ScenarioComponent
              scenario={activeScenario}
              onChoice={handleScenarioChoice}
              onComplete={handleScenarioComplete}
            />
          </div>
        </div>
      )}

      {/* Active Quiz Modal */}
      {activeQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl max-h-screen overflow-y-auto">
            <QuizComponent
              quiz={activeQuiz}
              onAnswer={handleQuizAnswer}
            />
          </div>
        </div>
      )}

      {/* Hotspot Detail Modal */}
      {selectedHotspot && selectedHotspot.type === 'click' && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4"
          onClick={() => setSelectedHotspot(null)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">
                {selectedHotspot.content.title || '详细信息'}
              </h3>
              <button
                onClick={() => setSelectedHotspot(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {selectedHotspot.content.description && (
              <p className="text-gray-700 mb-4">
                {selectedHotspot.content.description}
              </p>
            )}
            
            <button
              onClick={() => setSelectedHotspot(null)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {data.scenarios || data.quizzes ? (
        <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg z-30">
          <div className="text-sm text-gray-600 mb-1">互动进度</div>
          <div className="flex items-center space-x-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ 
                  width: `${(completedInteractions.size / Math.max(1, [
                    ...(data.scenarios || []),
                    ...(data.quizzes || []),
                    ...(data.hotspots?.filter(h => h.type !== 'hover') || [])
                  ].length)) * 100}%`
                }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700">
              {completedInteractions.size}/{[
                ...(data.scenarios || []),
                ...(data.quizzes || []),
                ...(data.hotspots?.filter(h => h.type !== 'hover') || [])
              ].length}
            </span>
          </div>
        </div>
      ) : null}

      {/* Completion Message */}
      {allInteractionsComplete && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl text-center max-w-sm mx-4">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">完成所有互动!</h3>
            <p className="text-gray-600">您已完成本节的所有互动内容</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}