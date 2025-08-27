'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Spin, Alert } from 'antd';
import { motion } from 'framer-motion';
import { User, Target, TrendingUp, BookOpen, Settings, Brain, Trophy } from 'lucide-react';
import PersonalizationDashboard from '@/components/personalization/PersonalizationDashboard';
import { logger } from '@/lib/logger';

const { Title, Text } = Typography;

interface PersonalizationStats {
  totalRecommendations: number;
  activeGoals: number;
  completedMilestones: number;
  learningStreak: number;
  skillsImproved: number;
  adaptationScore: number;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const PersonalizationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PersonalizationStats | null>(null);

  const quickActions: QuickAction[] = [
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Customize your learning experience',
      icon: <Settings className="w-6 h-6" />,
      href: '/personalization/preferences',
      color: 'bg-blue-500',
    },
    {
      id: 'goals',
      title: 'Goals & Milestones',
      description: 'Set and track your learning objectives',
      icon: <Target className="w-6 h-6" />,
      href: '/personalization/goals',
      color: 'bg-green-500',
    },
    {
      id: 'path',
      title: 'Learning Path',
      description: 'View your personalized learning journey',
      icon: <BookOpen className="w-6 h-6" />,
      href: '/personalization/path',
      color: 'bg-purple-500',
    },
    {
      id: 'insights',
      title: 'AI Insights',
      description: 'Get personalized recommendations',
      icon: <Brain className="w-6 h-6" />,
      href: '/dashboard/analytics',
      color: 'bg-orange-500',
    },
  ];

  useEffect(() => {
    const fetchPersonalizationData = async () => {
      try {
        setLoading(true);
        
        // Fetch personalization stats
        const response = await fetch('/api/personalization/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch personalization data');
        }
        
        const data = await response.json();
        setStats(data);
        
        logger.info('Personalization data loaded successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        logger.error('Failed to load personalization data:', err);
        
        // Use mock data for development
        setStats({
          totalRecommendations: 24,
          activeGoals: 3,
          completedMilestones: 8,
          learningStreak: 7,
          skillsImproved: 5,
          adaptationScore: 87,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalizationData();
  }, []);

  const handleQuickAction = (href: string) => {
    window.location.href = href;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen p-6">
        <Alert
          message="Error Loading Personalization"
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
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <Title level={2} className="!mb-0">Personalization Center</Title>
                <Text className="text-gray-600">
                  Your AI-powered learning experience, tailored just for you
                </Text>
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
              <Col xs={24} sm={12} lg={4}>
                <Card className="text-center h-full">
                  <div className="p-2">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalRecommendations}</div>
                    <div className="text-sm text-gray-600">Recommendations</div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={4}>
                <Card className="text-center h-full">
                  <div className="p-2">
                    <div className="text-2xl font-bold text-green-600">{stats.activeGoals}</div>
                    <div className="text-sm text-gray-600">Active Goals</div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={4}>
                <Card className="text-center h-full">
                  <div className="p-2">
                    <div className="text-2xl font-bold text-purple-600">{stats.completedMilestones}</div>
                    <div className="text-sm text-gray-600">Milestones</div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={4}>
                <Card className="text-center h-full">
                  <div className="p-2">
                    <div className="text-2xl font-bold text-orange-600">{stats.learningStreak}</div>
                    <div className="text-sm text-gray-600">Day Streak</div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={4}>
                <Card className="text-center h-full">
                  <div className="p-2">
                    <div className="text-2xl font-bold text-red-600">{stats.skillsImproved}</div>
                    <div className="text-sm text-gray-600">Skills Improved</div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={4}>
                <Card className="text-center h-full">
                  <div className="p-2">
                    <div className="text-2xl font-bold text-indigo-600">{stats.adaptationScore}%</div>
                    <div className="text-sm text-gray-600">Adaptation Score</div>
                  </div>
                </Card>
              </Col>
            </Row>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Title level={3} className="mb-4">Quick Actions</Title>
          <Row gutter={[16, 16]}>
            {quickActions.map((action, index) => (
              <Col key={action.id} xs={24} sm={12} lg={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="cursor-pointer"
                  onClick={() => handleQuickAction(action.href)}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${action.color}`}>
                        <div className="text-white">
                          {action.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <Title level={4} className="!mb-1">{action.title}</Title>
                        <Text className="text-gray-600">{action.description}</Text>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>

        {/* Main Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="shadow-lg">
            <PersonalizationDashboard />
          </Card>
        </motion.div>

        {/* AI Insights Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                  <Brain className="w-8 h-8" />
                </div>
                <div>
                  <Title level={3} className="!text-white !mb-1">AI-Powered Insights</Title>
                  <Text className="text-blue-100">
                    Get personalized recommendations based on your learning patterns
                  </Text>
                </div>
              </div>
              <Trophy className="w-12 h-12 opacity-20" />
            </div>
            <div className="mt-4 pt-4 border-t border-white border-opacity-20">
              <Text className="text-blue-100">
                Your personalization engine is continuously learning from your interactions 
                to provide better recommendations and adapt to your learning style.
              </Text>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PersonalizationPage;