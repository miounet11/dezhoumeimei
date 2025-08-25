'use client';

import React, { useState, useEffect } from 'react';
import { Position, AIOpponentStyle } from '@/types';
import { TrainingSessionManager, TrainingSessionConfig, SessionStatistics } from '@/lib/training/session-manager';
import { AI_OPPONENT_PROFILES } from '@/lib/ai/player-models';
import { getPositionName } from '@/lib/utils/poker';
import { 
  Play, 
  Settings, 
  Users, 
  Target, 
  TrendingUp, 
  Award, 
  Clock, 
  BarChart3,
  Bot,
  Brain,
  Zap,
  Shield,
  Activity,
  CheckCircle
} from 'lucide-react';

export interface TrainingCenterProps {
  userId: string;
  className?: string;
}

interface TrainingMode {
  id: string;
  name: string;
  description: string;
  type: 'preflop' | 'flop' | 'turn' | 'river' | 'full-hand';
  focus: 'gto' | 'exploitative' | 'mixed';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const TRAINING_MODES: TrainingMode[] = [
  {
    id: 'preflop_gto',
    name: 'Preflop GTO',
    description: 'Master optimal preflop ranges and 3-betting frequencies',
    type: 'preflop',
    focus: 'gto',
    difficulty: 'intermediate',
    icon: Target,
    color: 'blue'
  },
  {
    id: 'postflop_fundamentals',
    name: 'Postflop Fundamentals', 
    description: 'Learn continuation betting and board texture analysis',
    type: 'flop',
    focus: 'gto',
    difficulty: 'beginner',
    icon: Brain,
    color: 'green'
  },
  {
    id: 'turn_play',
    name: 'Turn Strategy',
    description: 'Advanced turn play with equity and pot odds calculations',
    type: 'turn',
    focus: 'mixed',
    difficulty: 'advanced',
    icon: Zap,
    color: 'yellow'
  },
  {
    id: 'river_decisions',
    name: 'River Decisions',
    description: 'Value betting, bluffing, and river decision making',
    type: 'river',
    focus: 'exploitative',
    difficulty: 'expert',
    icon: Shield,
    color: 'red'
  },
  {
    id: 'full_hand_analysis',
    name: 'Complete Hand Analysis',
    description: 'Play full hands with real-time GTO feedback',
    type: 'full-hand',
    focus: 'gto',
    difficulty: 'intermediate',
    icon: Activity,
    color: 'purple'
  }
];

export const TrainingCenter: React.FC<TrainingCenterProps> = ({ 
  userId, 
  className = '' 
}) => {
  const [currentView, setCurrentView] = useState<'modes' | 'setup' | 'session' | 'results'>('modes');
  const [selectedMode, setSelectedMode] = useState<TrainingMode | null>(null);
  const [sessionConfig, setSessionConfig] = useState<Partial<TrainingSessionConfig>>({});
  const [sessionManager] = useState(() => new TrainingSessionManager());
  const [currentSession, setCurrentSession] = useState(null);
  const [sessionStats, setSessionStats] = useState<SessionStatistics | null>(null);
  
  // Session configuration state
  const [tableSize, setTableSize] = useState(6);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [selectedOpponents, setSelectedOpponents] = useState<string[]>([]);
  const [sessionLength, setSessionLength] = useState(25);
  const [selectedPosition, setSelectedPosition] = useState<Position>('BTN');

  useEffect(() => {
    // Auto-select opponents based on table size
    if (selectedOpponents.length === 0) {
      const defaultOpponents = AI_OPPONENT_PROFILES.slice(0, Math.min(3, tableSize - 1));
      setSelectedOpponents(defaultOpponents.map(op => op.id));
    }
  }, [tableSize]);

  const handleModeSelect = (mode: TrainingMode) => {
    setSelectedMode(mode);
    setCurrentView('setup');
  };

  const handleStartSession = async () => {
    if (!selectedMode) return;

    const config: TrainingSessionConfig = {
      mode: {
        id: selectedMode.id,
        name: selectedMode.name,
        description: selectedMode.description,
        type: selectedMode.type,
        focus: selectedMode.focus
      },
      scenario: {
        id: `scenario_${selectedMode.id}`,
        title: `${selectedMode.name} Training`,
        position: selectedPosition,
        stackSize: 100,
        opponents: tableSize - 1,
        description: selectedMode.description,
        objectives: generateObjectives(selectedMode)
      },
      aiOpponents: selectedOpponents,
      tableSize,
      difficulty,
      sessionLength,
      focusAreas: [selectedMode.type]
    };

    try {
      const session = await sessionManager.startSession(userId, config);
      setCurrentSession(session);
      setCurrentView('session');
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const handleCompleteSession = async () => {
    try {
      const stats = await sessionManager.completeSession();
      setSessionStats(stats);
      setCurrentView('results');
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const handleBackToModes = () => {
    setCurrentView('modes');
    setSelectedMode(null);
    setCurrentSession(null);
    setSessionStats(null);
  };

  const renderModeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Choose Training Mode</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Select a focused training mode to improve specific aspects of your game
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TRAINING_MODES.map((mode) => {
          const Icon = mode.icon;
          const colorClasses = {
            blue: 'bg-blue-50 border-blue-200 hover:border-blue-300 dark:bg-blue-900 dark:border-blue-700',
            green: 'bg-green-50 border-green-200 hover:border-green-300 dark:bg-green-900 dark:border-green-700',
            yellow: 'bg-yellow-50 border-yellow-200 hover:border-yellow-300 dark:bg-yellow-900 dark:border-yellow-700',
            red: 'bg-red-50 border-red-200 hover:border-red-300 dark:bg-red-900 dark:border-red-700',
            purple: 'bg-purple-50 border-purple-200 hover:border-purple-300 dark:bg-purple-900 dark:border-purple-700'
          };

          const iconColorClasses = {
            blue: 'text-blue-600 dark:text-blue-400',
            green: 'text-green-600 dark:text-green-400',
            yellow: 'text-yellow-600 dark:text-yellow-400',
            red: 'text-red-600 dark:text-red-400',
            purple: 'text-purple-600 dark:text-purple-400'
          };

          return (
            <div
              key={mode.id}
              onClick={() => handleModeSelect(mode)}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-105 ${
                colorClasses[mode.color as keyof typeof colorClasses]
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 ${iconColorClasses[mode.color as keyof typeof iconColorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{mode.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${iconColorClasses[mode.color as keyof typeof iconColorClasses]} bg-white dark:bg-gray-800`}>
                    {mode.difficulty}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {mode.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{mode.type.replace('-', ' ').toUpperCase()}</span>
                <span>{mode.focus.toUpperCase()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSessionSetup = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setCurrentView('modes')}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Back
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Setup: {selectedMode?.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">{selectedMode?.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Game Settings */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Game Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Table Size
              </label>
              <select
                value={tableSize}
                onChange={(e) => setTableSize(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {[2, 3, 4, 5, 6, 9].map(size => (
                  <option key={size} value={size}>{size}-Max</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Position
              </label>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value as Position)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {(['UTG', 'UTG+1', 'MP', 'MP+1', 'CO', 'BTN', 'SB', 'BB'] as Position[]).map(pos => (
                  <option key={pos} value={pos}>
                    {getPositionName(pos)} ({pos})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Session Length
              </label>
              <select
                value={sessionLength}
                onChange={(e) => setSessionLength(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value={10}>10 Hands (Quick)</option>
                <option value={25}>25 Hands (Standard)</option>
                <option value={50}>50 Hands (Extended)</option>
                <option value={100}>100 Hands (Marathon)</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Opponents */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            AI Opponents
          </h3>

          <div className="space-y-3">
            {AI_OPPONENT_PROFILES.slice(0, tableSize - 1).map((opponent) => {
              const isSelected = selectedOpponents.includes(opponent.id);
              
              const styleIcons = {
                'tight-aggressive': Target,
                'loose-aggressive': Zap,
                'gto': Brain,
                'tight-passive': Shield,
                'loose-passive': Activity
              };

              const StyleIcon = styleIcons[opponent.style as keyof typeof styleIcons] || Bot;

              return (
                <div
                  key={opponent.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedOpponents(prev => prev.filter(id => id !== opponent.id));
                    } else if (selectedOpponents.length < tableSize - 1) {
                      setSelectedOpponents(prev => [...prev, opponent.id]);
                    }
                  }}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <StyleIcon className={`w-5 h-5 ${
                        isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {opponent.name}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isSelected 
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                        }`}>
                          {opponent.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {opponent.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>VPIP: {opponent.stats.vpip}%</span>
                        <span>PFR: {opponent.stats.pfr}%</span>
                        <span>AF: {opponent.stats.af}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Selected: {selectedOpponents.length}/{tableSize - 1} opponents
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleStartSession}
          disabled={selectedOpponents.length === 0}
          className="px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <Play className="w-5 h-5" />
          Start Training Session
        </button>
      </div>
    </div>
  );

  const renderActiveSession = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            Training Session Active
          </h2>
          <button
            onClick={handleCompleteSession}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Complete Session
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">12</div>
            <div className="text-blue-600 dark:text-blue-400">Hands Played</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">85%</div>
            <div className="text-blue-600 dark:text-blue-400">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">+2.3</div>
            <div className="text-blue-600 dark:text-blue-400">EV</div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Training session simulation would be implemented here with actual poker hands and GTO feedback.
        </p>
      </div>
    </div>
  );

  const renderSessionResults = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Session Complete!</h2>
        <p className="text-gray-600 dark:text-gray-400">Here's how you performed</p>
      </div>

      {sessionStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 dark:bg-green-900 rounded-lg p-6 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
              {sessionStats.accuracy.toFixed(1)}%
            </div>
            <div className="text-green-600 dark:text-green-400">Decision Accuracy</div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-6 text-center">
            <Award className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {sessionStats.totalEV > 0 ? '+' : ''}{sessionStats.totalEV.toFixed(2)}
            </div>
            <div className="text-blue-600 dark:text-blue-400">Total EV</div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900 rounded-lg p-6 text-center">
            <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-3" />
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
              {sessionStats.timeSpent}m
            </div>
            <div className="text-orange-600 dark:text-orange-400">Time Spent</div>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4">
        <button
          onClick={handleBackToModes}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          New Session
        </button>
        <button
          onClick={() => setCurrentView('setup')}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          Retry Session
        </button>
      </div>
    </div>
  );

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
      {currentView === 'modes' && renderModeSelection()}
      {currentView === 'setup' && renderSessionSetup()}
      {currentView === 'session' && renderActiveSession()}
      {currentView === 'results' && renderSessionResults()}
    </div>
  );
};

// Helper function to generate training objectives
function generateObjectives(mode: TrainingMode): string[] {
  const objectives = {
    preflop_gto: [
      'Master optimal opening ranges by position',
      'Learn proper 3-bet and 4-bet frequencies',
      'Understand position-based adjustments'
    ],
    postflop_fundamentals: [
      'Analyze board textures effectively',
      'Practice continuation betting strategy',
      'Learn when to bet for value vs protection'
    ],
    turn_play: [
      'Master turn barreling concepts',
      'Calculate pot odds and equity',
      'Practice hand reading skills'
    ],
    river_decisions: [
      'Identify thin value betting spots',
      'Choose optimal bluffing hands',
      'Master river decision tree'
    ],
    full_hand_analysis: [
      'Apply GTO principles across all streets',
      'Maintain balanced ranges',
      'Develop complete hand reading skills'
    ]
  };

  return objectives[mode.id as keyof typeof objectives] || [
    'Improve decision making',
    'Apply GTO concepts',
    'Enhance poker skills'
  ];
}