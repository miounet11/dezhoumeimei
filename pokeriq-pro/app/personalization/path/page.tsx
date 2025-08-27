'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin, Alert, Button, Progress, Tag, Timeline } from 'antd';
import { motion } from 'framer-motion';
import { BookOpen, ArrowLeft, Play, CheckCircle, Lock, Star, Clock, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';
import LearningPathViewer from '@/components/personalization/LearningPathViewer';
import { logger } from '@/lib/logger';

const { Title, Text } = Typography;

interface LearningStep {
  id: string;
  title: string;
  description: string;
  type: 'lesson' | 'practice' | 'quiz' | 'challenge';
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  progress: number;
  prerequisites: string[];
  skills: string[];
  rewards: string[];
  estimatedTime: string;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalSteps: number;
  completedSteps: number;
  estimatedTime: string;
  progress: number;
  skills: string[];
  steps: LearningStep[];
  personalizedFor: string[];
}

interface PathStats {
  totalPaths: number;
  activePaths: number;
  completedPaths: number;
  totalLessons: number;
  completedLessons: number;
  averageProgress: number;
  skillsImproved: number;
  timeSpent: string;
}

const LearningPathPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [stats, setStats] = useState<PathStats | null>(null);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);

  useEffect(() => {
    const fetchLearningPathData = async () => {
      try {
        setLoading(true);
        
        // Fetch learning paths and stats
        const [pathsResponse, statsResponse] = await Promise.all([
          fetch('/api/personalization/learning-path'),
          fetch('/api/personalization/learning-path/stats')
        ]);

        if (!pathsResponse.ok || !statsResponse.ok) {
          throw new Error('Failed to fetch learning path data');
        }
        
        const [pathsData, statsData] = await Promise.all([
          pathsResponse.json(),
          statsResponse.json()
        ]);

        setPaths(pathsData);
        setStats(statsData);
        setSelectedPath(pathsData[0] || null);
        
        logger.info('Learning path data loaded successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        logger.error('Failed to load learning path data:', err);
        
        // Use mock data for development
        const mockPaths: LearningPath[] = [
          {
            id: '1',
            title: 'Preflop Mastery Path',
            description: 'Master preflop play from basics to advanced concepts',
            category: 'Preflop',
            difficulty: 'intermediate',
            totalSteps: 8,
            completedSteps: 5,
            estimatedTime: '4-6 weeks',
            progress: 62,
            skills: ['Position Play', 'Range Construction', '3-bet Strategy'],
            personalizedFor: ['GTO Focus', 'Tournament Play'],
            steps: [
              {
                id: '1-1',
                title: 'Basic Opening Ranges',
                description: 'Learn fundamental opening ranges for all positions',
                type: 'lesson',
                duration: 45,
                difficulty: 'beginner',
                status: 'completed',
                progress: 100,
                prerequisites: [],
                skills: ['Position Play', 'Range Construction'],
                rewards: ['Preflop Basics Badge'],
                estimatedTime: '45 min'
              },
              {
                id: '1-2',
                title: 'Defending Against 3-bets',
                description: 'Learn how to respond to 3-bet aggression',
                type: 'practice',
                duration: 60,
                difficulty: 'intermediate',
                status: 'in_progress',
                progress: 40,
                prerequisites: ['1-1'],
                skills: ['3-bet Defense', 'Range Construction'],
                rewards: ['3-bet Defense Badge'],
                estimatedTime: '1 hour'
              },
              {
                id: '1-3',
                title: 'Advanced 4-bet Strategy',
                description: 'Master 4-betting concepts and ranges',
                type: 'lesson',
                duration: 75,
                difficulty: 'advanced',
                status: 'locked',
                progress: 0,
                prerequisites: ['1-2'],
                skills: ['4-bet Strategy', 'Bluff Construction'],
                rewards: ['4-bet Master Badge', '100 XP'],
                estimatedTime: '1.25 hours'
              }
            ]
          },
          {
            id: '2',
            title: 'Postflop Fundamentals',
            description: 'Build a solid foundation in postflop play',
            category: 'Postflop',
            difficulty: 'beginner',
            totalSteps: 6,
            completedSteps: 2,
            estimatedTime: '3-4 weeks',
            progress: 33,
            skills: ['C-betting', 'Pot Control', 'Value Betting'],
            personalizedFor: ['Cash Games', 'Beginner Friendly'],
            steps: [
              {
                id: '2-1',
                title: 'Continuation Betting Basics',
                description: 'Learn when and how to continuation bet',
                type: 'lesson',
                duration: 50,
                difficulty: 'beginner',
                status: 'completed',
                progress: 100,
                prerequisites: [],
                skills: ['C-betting', 'Board Analysis'],
                rewards: ['C-bet Badge'],
                estimatedTime: '50 min'
              },
              {
                id: '2-2',
                title: 'Turn and River Play',
                description: 'Navigate later streets with confidence',
                type: 'practice',
                duration: 90,
                difficulty: 'intermediate',
                status: 'available',
                progress: 0,
                prerequisites: ['2-1'],
                skills: ['Turn Play', 'River Play', 'Value Betting'],
                rewards: ['Streets Master Badge'],
                estimatedTime: '1.5 hours'
              }
            ]
          }
        ];

        const mockStats: PathStats = {
          totalPaths: 2,
          activePaths: 2,
          completedPaths: 0,
          totalLessons: 14,
          completedLessons: 7,
          averageProgress: 47,
          skillsImproved: 8,
          timeSpent: '12h 30m'
        };

        setPaths(mockPaths);
        setStats(mockStats);
        setSelectedPath(mockPaths[0]);
      } finally {
        setLoading(false);
      }
    };

    fetchLearningPathData();
  }, []);

  const handleStepStart = (stepId: string) => {
    logger.info('Starting learning step:', stepId);
    // In real implementation, navigate to the lesson/practice
  };

  const handleBack = () => {
    router.push('/personalization');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#52c41a';
      case 'in_progress': return '#1890ff';
      case 'available': return '#faad14';
      case 'locked': return '#d9d9d9';
      default: return '#d9d9d9';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4" />;
      case 'available': return <BookOpen className="w-4 h-4" />;
      case 'locked': return <Lock className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error && !paths.length) {
    return (
      <div className="min-h-screen p-6">
        <Alert
          message="Error Loading Learning Path"
          description={error}
          type="error"
          showIcon
          className="max-w-2xl mx-auto"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  type="text"
                  icon={<ArrowLeft className="w-4 h-4" />}
                  onClick={handleBack}
                  className="flex items-center space-x-2"
                >
                  Back
                </Button>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <Title level={2} className="!mb-0">Learning Path</Title>
                    <Text className="text-gray-600">
                      Your personalized journey to poker mastery
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.activePaths}</div>
                  <div className="text-sm text-gray-600">Active Paths</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.completedLessons}</div>
                  <div className="text-sm text-gray-600">Lessons Completed</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.skillsImproved}</div>
                  <div className="text-sm text-gray-600">Skills Improved</div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.timeSpent}</div>
                  <div className="text-sm text-gray-600">Time Invested</div>
                </Card>
              </Col>
            </Row>
          </motion.div>
        )}

        <Row gutter={[24, 24]}>
          {/* Learning Paths List */}
          <Col xs={24} lg={8}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card title="Your Learning Paths" className="shadow-lg">
                <div className="space-y-4">
                  {paths.map((path) => (
                    <motion.div
                      key={path.id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedPath?.id === path.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPath(path)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Title level={5} className="!mb-0">{path.title}</Title>
                        <Tag color={
                          path.difficulty === 'beginner' ? 'green' :
                          path.difficulty === 'intermediate' ? 'orange' : 'red'
                        }>
                          {path.difficulty}
                        </Tag>
                      </div>
                      <Text className="text-gray-600 text-sm block mb-3">{path.description}</Text>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{path.progress}%</span>
                        </div>
                        <Progress percent={path.progress} strokeColor="#1890ff" />
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{path.completedSteps}/{path.totalSteps} steps</span>
                        <span>{path.estimatedTime}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </Col>

          {/* Selected Path Details */}
          <Col xs={24} lg={16}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {selectedPath ? (
                <Card className="shadow-lg">
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Title level={3} className="!mb-2">{selectedPath.title}</Title>
                        <Text className="text-gray-600">{selectedPath.description}</Text>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <Text className="text-sm">Personalized for you</Text>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedPath.skills.map((skill) => (
                        <Tag key={skill} color="blue">{skill}</Tag>
                      ))}
                    </div>

                    <Progress percent={selectedPath.progress} strokeColor="#52c41a" />
                  </div>

                  {/* Learning Steps Timeline */}
                  <Title level={4} className="mb-4">Learning Steps</Title>
                  <Timeline>
                    {selectedPath.steps.map((step) => (
                      <Timeline.Item
                        key={step.id}
                        color={getStatusColor(step.status)}
                        dot={getStatusIcon(step.status)}
                      >
                        <Card size="small" className="mb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <Title level={5} className="!mb-0">{step.title}</Title>
                                <Tag color={
                                  step.type === 'lesson' ? 'blue' :
                                  step.type === 'practice' ? 'green' :
                                  step.type === 'quiz' ? 'orange' : 'purple'
                                }>
                                  {step.type}
                                </Tag>
                                <Tag color={
                                  step.difficulty === 'beginner' ? 'green' :
                                  step.difficulty === 'intermediate' ? 'orange' : 'red'
                                }>
                                  {step.difficulty}
                                </Tag>
                              </div>
                              <Text className="text-gray-600 block mb-2">{step.description}</Text>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{step.estimatedTime}</span>
                                </span>
                                <span>{step.skills.join(', ')}</span>
                              </div>

                              {step.status === 'in_progress' && step.progress > 0 && (
                                <Progress 
                                  percent={step.progress} 
                                  size="small" 
                                  className="mb-2"
                                />
                              )}

                              {step.rewards.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <Award className="w-3 h-3 text-yellow-500" />
                                  <Text className="text-xs text-yellow-600">
                                    Rewards: {step.rewards.join(', ')}
                                  </Text>
                                </div>
                              )}
                            </div>
                            
                            <div className="ml-4">
                              {step.status === 'available' && (
                                <Button
                                  type="primary"
                                  icon={<Play className="w-3 h-3" />}
                                  size="small"
                                  onClick={() => handleStepStart(step.id)}
                                >
                                  Start
                                </Button>
                              )}
                              {step.status === 'in_progress' && (
                                <Button
                                  type="primary"
                                  icon={<Play className="w-3 h-3" />}
                                  size="small"
                                  onClick={() => handleStepStart(step.id)}
                                >
                                  Continue
                                </Button>
                              )}
                              {step.status === 'completed' && (
                                <Button
                                  type="default"
                                  icon={<CheckCircle className="w-3 h-3" />}
                                  size="small"
                                  disabled
                                >
                                  Completed
                                </Button>
                              )}
                              {step.status === 'locked' && (
                                <Button
                                  type="default"
                                  icon={<Lock className="w-3 h-3" />}
                                  size="small"
                                  disabled
                                >
                                  Locked
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Card>
              ) : (
                <Card className="shadow-lg">
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <Title level={4} className="text-gray-500">Select a Learning Path</Title>
                    <Text className="text-gray-400">
                      Choose a learning path from the left to view details and start learning
                    </Text>
                  </div>
                </Card>
              )}
            </motion.div>
          </Col>
        </Row>

        {/* Motivation Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <Title level={3} className="!text-white !mb-1">Personalized Learning</Title>
                  <Text className="text-indigo-100">
                    Your learning path adapts to your progress and preferences
                  </Text>
                </div>
              </div>
              <BookOpen className="w-12 h-12 opacity-20" />
            </div>
            <div className="mt-4 pt-4 border-t border-white border-opacity-20">
              <Text className="text-indigo-100">
                Our AI continuously optimizes your learning path based on your performance, 
                preferred learning style, and goals to ensure the most effective learning experience.
              </Text>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LearningPathPage;