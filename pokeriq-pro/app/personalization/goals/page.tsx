'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin, Alert, Button, Tabs, Statistic } from 'antd';
import { motion } from 'framer-motion';
import { Target, ArrowLeft, Plus, Trophy, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import GoalSetting from '@/components/personalization/GoalSetting';
import GoalTracker from '@/components/personalization/GoalTracker';
import MilestoneCard from '@/components/personalization/MilestoneCard';
import { logger } from '@/lib/logger';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'skill' | 'achievement' | 'time' | 'custom';
  target: number;
  current: number;
  deadline: string;
  status: 'active' | 'completed' | 'paused' | 'overdue';
  priority: 'high' | 'medium' | 'low';
  category: string;
  milestones: Milestone[];
  createdAt: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  locked: boolean;
  reward?: string;
  completedAt?: string;
}

interface GoalsStats {
  totalGoals: number;
  activeGoals: number;
  completedGoals: number;
  overdueGoals: number;
  totalMilestones: number;
  completedMilestones: number;
  averageProgress: number;
  completionRate: number;
}

const GoalsPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<GoalsStats | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showGoalCreator, setShowGoalCreator] = useState(false);

  useEffect(() => {
    const fetchGoalsData = async () => {
      try {
        setLoading(true);
        
        // Fetch goals and stats
        const [goalsResponse, statsResponse] = await Promise.all([
          fetch('/api/personalization/goals'),
          fetch('/api/personalization/goals/stats')
        ]);

        if (!goalsResponse.ok || !statsResponse.ok) {
          throw new Error('Failed to fetch goals data');
        }
        
        const [goalsData, statsData] = await Promise.all([
          goalsResponse.json(),
          statsResponse.json()
        ]);

        setGoals(goalsData);
        setStats(statsData);
        
        logger.info('Goals data loaded successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        logger.error('Failed to load goals data:', err);
        
        // Use mock data for development
        const mockGoals: Goal[] = [
          {
            id: '1',
            title: 'Master Preflop Strategy',
            description: 'Complete all preflop training modules and achieve 90% accuracy',
            type: 'skill',
            target: 100,
            current: 75,
            deadline: '2024-03-15',
            status: 'active',
            priority: 'high',
            category: 'Preflop',
            createdAt: '2024-01-15',
            milestones: [
              {
                id: '1-1',
                title: 'Complete Basic Ranges',
                description: 'Master basic opening ranges for all positions',
                target: 20,
                current: 20,
                completed: true,
                locked: false,
                reward: 'Preflop Badge',
                completedAt: '2024-02-01'
              },
              {
                id: '1-2',
                title: 'Advanced 3-bet Strategy',
                description: 'Learn advanced 3-betting concepts',
                target: 30,
                current: 25,
                completed: false,
                locked: false
              }
            ]
          },
          {
            id: '2',
            title: 'Daily Study Streak',
            description: 'Study poker for at least 30 minutes every day for 30 days',
            type: 'time',
            target: 30,
            current: 12,
            deadline: '2024-04-01',
            status: 'active',
            priority: 'medium',
            category: 'Consistency',
            createdAt: '2024-02-01',
            milestones: [
              {
                id: '2-1',
                title: '7-Day Streak',
                description: 'Complete 7 consecutive days of study',
                target: 7,
                current: 7,
                completed: true,
                locked: false,
                reward: 'Consistency Badge',
                completedAt: '2024-02-08'
              }
            ]
          }
        ];

        const mockStats: GoalsStats = {
          totalGoals: 2,
          activeGoals: 2,
          completedGoals: 0,
          overdueGoals: 0,
          totalMilestones: 3,
          completedMilestones: 2,
          averageProgress: 68,
          completionRate: 67
        };

        setGoals(mockGoals);
        setStats(mockStats);
      } finally {
        setLoading(false);
      }
    };

    fetchGoalsData();
  }, []);

  const handleGoalCreate = (newGoal: Partial<Goal>) => {
    // Handle goal creation
    logger.info('Creating new goal:', newGoal);
    setShowGoalCreator(false);
    // Refresh goals data
    // In real implementation, make API call to create goal
  };

  const handleBack = () => {
    router.push('/personalization');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error && !goals.length) {
    return (
      <div className="min-h-screen p-6">
        <Alert
          message="Error Loading Goals"
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
                  <div className="p-3 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <Title level={2} className="!mb-0">Goals & Milestones</Title>
                    <Text className="text-gray-600">
                      Set, track, and achieve your learning objectives
                    </Text>
                  </div>
                </div>
              </div>
              
              <Button
                type="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowGoalCreator(true)}
                className="flex items-center space-x-2"
              >
                New Goal
              </Button>
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
                <Card>
                  <Statistic
                    title="Active Goals"
                    value={stats.activeGoals}
                    prefix={<Target className="w-4 h-4 text-green-500" />}
                    valueStyle={{ color: '#10b981' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Completed Goals"
                    value={stats.completedGoals}
                    prefix={<CheckCircle className="w-4 h-4 text-blue-500" />}
                    valueStyle={{ color: '#3b82f6' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Milestones Completed"
                    value={stats.completedMilestones}
                    suffix={`/ ${stats.totalMilestones}`}
                    prefix={<Trophy className="w-4 h-4 text-yellow-500" />}
                    valueStyle={{ color: '#f59e0b' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Average Progress"
                    value={stats.averageProgress}
                    suffix="%"
                    prefix={<Clock className="w-4 h-4 text-purple-500" />}
                    valueStyle={{ color: '#8b5cf6' }}
                  />
                </Card>
              </Col>
            </Row>
          </motion.div>
        )}

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="shadow-lg">
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="Overview" key="overview">
                <div className="space-y-6">
                  {/* Active Goals */}
                  <div>
                    <Title level={4} className="mb-4">Active Goals</Title>
                    <Row gutter={[16, 16]}>
                      {goals.filter(g => g.status === 'active').map((goal) => (
                        <Col key={goal.id} xs={24} lg={12}>
                          <Card className="h-full">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <Title level={5} className="!mb-1">{goal.title}</Title>
                                <Text className="text-gray-600">{goal.description}</Text>
                              </div>
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                goal.priority === 'high' ? 'bg-red-100 text-red-700' :
                                goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {goal.priority}
                              </div>
                            </div>
                            
                            <div className="mb-3">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{Math.round((goal.current / goal.target) * 100)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                                  style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                                />
                              </div>
                            </div>
                            
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
                              <span>{goal.milestones.filter(m => m.completed).length} / {goal.milestones.length} milestones</span>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>

                  {/* Recent Milestones */}
                  <div>
                    <Title level={4} className="mb-4">Recent Milestones</Title>
                    <Row gutter={[16, 16]}>
                      {goals.flatMap(g => g.milestones)
                        .filter(m => !m.locked)
                        .slice(0, 4)
                        .map((milestone) => (
                          <Col key={milestone.id} xs={24} sm={12} lg={6}>
                            <MilestoneCard
                              milestone={milestone}
                              onComplete={() => {}}
                              onClaim={() => {}}
                            />
                          </Col>
                        ))}
                    </Row>
                  </div>
                </div>
              </TabPane>

              <TabPane tab="Goal Tracker" key="tracker">
                <GoalTracker
                  goals={goals}
                  onUpdateGoal={() => {}}
                  onDeleteGoal={() => {}}
                />
              </TabPane>

              <TabPane tab="Create Goal" key="create">
                <GoalSetting
                  onGoalCreate={handleGoalCreate}
                  existingGoals={goals}
                />
              </TabPane>
            </Tabs>
          </Card>
        </motion.div>

        {/* Motivational Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <Title level={3} className="!text-white !mb-1">Stay Motivated!</Title>
                  <Text className="text-purple-100">
                    Every small step brings you closer to your poker mastery goals
                  </Text>
                </div>
              </div>
              <Target className="w-12 h-12 opacity-20" />
            </div>
            <div className="mt-4 pt-4 border-t border-white border-opacity-20">
              <Text className="text-purple-100">
                {stats && stats.averageProgress > 75 
                  ? "You're doing amazing! Keep up the excellent progress."
                  : stats && stats.averageProgress > 50
                  ? "Great momentum! You're more than halfway to your goals."
                  : "Every journey starts with a single step. You've got this!"
                }
              </Text>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default GoalsPage;