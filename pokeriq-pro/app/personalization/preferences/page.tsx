'use client';

import React, { useState, useEffect } from 'react';
import { Card, Typography, Spin, Alert, Button, message } from 'antd';
import { motion } from 'framer-motion';
import { Settings, ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import PreferencesPanel from '@/components/personalization/PreferencesPanel';
import { logger } from '@/lib/logger';

const { Title, Text } = Typography;

interface UserPreferences {
  learning: {
    preferredTime: string;
    sessionDuration: number;
    difficultyLevel: string;
    focusAreas: string[];
    learningStyle: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    reminders: boolean;
    achievements: boolean;
    recommendations: boolean;
  };
  ui: {
    theme: string;
    language: string;
    animations: boolean;
    soundEffects: boolean;
    compactMode: boolean;
  };
  privacy: {
    dataCollection: boolean;
    analytics: boolean;
    personalizedAds: boolean;
    shareProgress: boolean;
  };
}

const PreferencesPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/personalization/preferences');
        if (!response.ok) {
          throw new Error('Failed to fetch preferences');
        }
        
        const data = await response.json();
        setPreferences(data);
        
        logger.info('Preferences loaded successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        logger.error('Failed to load preferences:', err);
        
        // Use mock data for development
        setPreferences({
          learning: {
            preferredTime: 'evening',
            sessionDuration: 30,
            difficultyLevel: 'intermediate',
            focusAreas: ['preflop', 'postflop'],
            learningStyle: 'visual',
          },
          notifications: {
            email: true,
            push: true,
            reminders: true,
            achievements: true,
            recommendations: false,
          },
          ui: {
            theme: 'light',
            language: 'en',
            animations: true,
            soundEffects: false,
            compactMode: false,
          },
          privacy: {
            dataCollection: true,
            analytics: true,
            personalizedAds: false,
            shareProgress: true,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handlePreferencesChange = (newPreferences: UserPreferences) => {
    setPreferences(newPreferences);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      
      const response = await fetch('/api/personalization/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      setHasChanges(false);
      message.success('Preferences saved successfully!');
      logger.info('Preferences saved successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      message.error(`Failed to save preferences: ${errorMessage}`);
      logger.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmLeave) return;
    }
    router.push('/personalization');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <div className="min-h-screen p-6">
        <Alert
          message="Error Loading Preferences"
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <Title level={2} className="!mb-0">Preferences</Title>
                    <Text className="text-gray-600">
                      Customize your learning experience and account settings
                    </Text>
                  </div>
                </div>
              </div>
              
              {hasChanges && (
                <Button
                  type="primary"
                  icon={<Save className="w-4 h-4" />}
                  loading={saving}
                  onClick={handleSave}
                  className="flex items-center space-x-2"
                >
                  Save Changes
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="shadow-lg">
            {preferences && (
              <PreferencesPanel
                preferences={preferences}
                onChange={handlePreferencesChange}
              />
            )}
          </Card>
        </motion.div>

        {/* Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8"
        >
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <div className="text-center">
              <Title level={4} className="text-green-700">Need Help?</Title>
              <Text className="text-green-600">
                Your preferences help us personalize your learning experience. 
                Changes are saved automatically and take effect immediately.
              </Text>
              <div className="mt-4 space-y-2 text-left">
                <div>
                  <Text strong className="text-green-700">Learning Preferences:</Text>
                  <Text className="block text-green-600">
                    Customize when and how you prefer to learn
                  </Text>
                </div>
                <div>
                  <Text strong className="text-green-700">Notifications:</Text>
                  <Text className="block text-green-600">
                    Control what notifications you receive and how
                  </Text>
                </div>
                <div>
                  <Text strong className="text-green-700">Interface:</Text>
                  <Text className="block text-green-600">
                    Adjust the look and feel of your learning environment
                  </Text>
                </div>
                <div>
                  <Text strong className="text-green-700">Privacy:</Text>
                  <Text className="block text-green-600">
                    Manage your data and privacy settings
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Alert
              message="Unsaved Changes"
              description="You have unsaved changes. Don't forget to save!"
              type="warning"
              showIcon
              action={
                <Button
                  type="primary"
                  size="small"
                  icon={<Save className="w-3 h-3" />}
                  loading={saving}
                  onClick={handleSave}
                >
                  Save
                </Button>
              }
              className="shadow-lg"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PreferencesPage;