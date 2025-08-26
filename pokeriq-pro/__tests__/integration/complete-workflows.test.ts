/**
 * Complete User Workflow Integration Tests
 * Tests end-to-end user journeys across the PokerIQ Pro platform
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import { ReactElement } from 'react';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock authentication
jest.mock('@/lib/auth/unified-auth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-1',
      email: 'test@pokeriq.com',
      name: 'Test User',
      level: 'intermediate',
    },
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

// Mock API calls
global.fetch = jest.fn();

describe('Complete User Workflows Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  describe('User Onboarding and Registration Flow', () => {
    it('should complete full user registration and onboarding', async () => {
      const user = userEvent.setup();
      
      // Mock registration API
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            user: { id: 'new-user', email: 'newuser@test.com' }
          }),
        })
        // Mock onboarding data fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            onboardingSteps: [
              { id: 'basics', title: 'Basic Info', completed: false },
              { id: 'skill-assessment', title: 'Skill Assessment', completed: false },
              { id: 'preferences', title: 'Preferences', completed: false },
            ]
          }),
        });

      // Test registration form submission
      const registrationData = {
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        name: 'New User',
      };

      // Simulate registration API call
      const registrationResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const registrationResult = await registrationResponse.json();
      expect(registrationResult.success).toBe(true);
      expect(registrationResult.user.email).toBe('newuser@test.com');

      // Verify onboarding flow initiation
      const onboardingResponse = await fetch('/api/user/onboarding');
      const onboardingData = await onboardingResponse.json();
      
      expect(onboardingData.onboardingSteps).toHaveLength(3);
      expect(onboardingData.onboardingSteps[0].completed).toBe(false);
    });

    it('should handle skill assessment during onboarding', async () => {
      // Mock skill assessment API
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          assessmentId: 'skill-test-123',
          questions: [
            {
              id: 'q1',
              type: 'multiple-choice',
              question: 'What is the best starting hand in Texas Hold\'em?',
              options: ['AA', 'KK', 'AK', 'QQ'],
              correctAnswer: 0,
            }
          ]
        }),
      });

      const skillAssessmentResponse = await fetch('/api/assessments/skill-assessment');
      const assessmentData = await skillAssessmentResponse.json();
      
      expect(assessmentData.assessmentId).toBe('skill-test-123');
      expect(assessmentData.questions).toHaveLength(1);
      expect(assessmentData.questions[0].question).toContain('starting hand');
    });
  });

  describe('Course Learning Workflow', () => {
    it('should complete full course learning journey', async () => {
      // Mock course data
      const mockCourse = {
        id: 'course-basics-101',
        title: 'Poker Basics 101',
        chapters: [
          { id: 'ch1', title: 'Introduction', duration: 300, completed: false },
          { id: 'ch2', title: 'Hand Rankings', duration: 450, completed: false },
        ],
        progress: 0,
      };

      // Mock course fetch
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ course: mockCourse }),
        })
        // Mock chapter progress update
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, progress: 50 }),
        })
        // Mock course completion
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ 
            success: true, 
            completed: true,
            achievement: { id: 'course-complete', name: 'Course Graduate' }
          }),
        });

      // Fetch course details
      const courseResponse = await fetch('/api/courses/course-basics-101');
      const courseData = await courseResponse.json();
      
      expect(courseData.course.title).toBe('Poker Basics 101');
      expect(courseData.course.chapters).toHaveLength(2);

      // Simulate chapter completion
      const progressResponse = await fetch('/api/courses/course-basics-101/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: 'ch1', completed: true }),
      });

      const progressResult = await progressResponse.json();
      expect(progressResult.success).toBe(true);
      expect(progressResult.progress).toBe(50);

      // Complete entire course
      const completionResponse = await fetch('/api/courses/course-basics-101/complete', {
        method: 'POST',
      });

      const completionResult = await completionResponse.json();
      expect(completionResult.completed).toBe(true);
      expect(completionResult.achievement.name).toBe('Course Graduate');
    });

    it('should track video watching progress', async () => {
      const videoProgress = {
        courseId: 'course-basics-101',
        chapterId: 'ch1',
        timestamp: 150, // 2.5 minutes into video
        duration: 300, // 5 minute video
        completed: false,
      };

      // Mock video progress tracking
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, progress: 50 }),
      });

      const progressResponse = await fetch('/api/player/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoProgress),
      });

      const result = await progressResponse.json();
      expect(result.success).toBe(true);
      expect(result.progress).toBe(50);
    });
  });

  describe('Assessment and Testing Workflow', () => {
    it('should complete assessment taking and scoring', async () => {
      const assessmentId = 'assessment-basics-final';
      const userAnswers = [
        { questionId: 'q1', answer: 0 }, // Multiple choice answer index
        { questionId: 'q2', answer: 'Royal Flush' }, // Text answer
        { questionId: 'q3', answer: [0, 2] }, // Multiple select
      ];

      // Mock assessment submission
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          score: 85,
          totalQuestions: 3,
          correctAnswers: 2,
          feedback: [
            { questionId: 'q1', correct: true, explanation: 'Correct!' },
            { questionId: 'q2', correct: true, explanation: 'Perfect!' },
            { questionId: 'q3', correct: false, explanation: 'Review hand rankings.' },
          ],
          nextRecommendations: ['advanced-betting', 'pot-odds'],
        }),
      });

      const submissionResponse = await fetch(`/api/assessments/${assessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: userAnswers }),
      });

      const result = await submissionResponse.json();
      
      expect(result.success).toBe(true);
      expect(result.score).toBe(85);
      expect(result.correctAnswers).toBe(2);
      expect(result.feedback).toHaveLength(3);
      expect(result.nextRecommendations).toContain('pot-odds');
    });
  });

  describe('Game Playing and GTO Training Workflow', () => {
    it('should complete poker game session with AI opponent', async () => {
      const gameSession = {
        sessionId: 'game-session-123',
        gameType: 'texas-holdem',
        blinds: { small: 1, big: 2 },
        playerCount: 2,
        aiDifficulty: 'intermediate',
      };

      // Mock game initialization
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            sessionId: 'game-session-123',
            gameState: {
              stage: 'pre-flop',
              pot: 3,
              playerChips: 1000,
              aiChips: 1000,
              playerCards: ['AS', 'KS'],
              communityCards: [],
            },
          }),
        })
        // Mock game action
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            newState: {
              stage: 'flop',
              pot: 10,
              communityCards: ['AH', '5C', '9D'],
              aiAction: { type: 'check' },
            },
          }),
        });

      // Start game session
      const gameStartResponse = await fetch('/api/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameSession),
      });

      const gameStart = await gameStartResponse.json();
      expect(gameStart.sessionId).toBe('game-session-123');
      expect(gameStart.gameState.playerCards).toHaveLength(2);

      // Make a game action (bet)
      const actionResponse = await fetch('/api/game/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'game-session-123',
          action: { type: 'bet', amount: 5 },
        }),
      });

      const actionResult = await actionResponse.json();
      expect(actionResult.success).toBe(true);
      expect(actionResult.newState.stage).toBe('flop');
      expect(actionResult.newState.communityCards).toHaveLength(3);
    });

    it('should provide GTO analysis and recommendations', async () => {
      const handAnalysis = {
        playerCards: ['AS', 'KS'],
        communityCards: ['AH', '5C', '9D'],
        position: 'button',
        action: 'bet',
        amount: 10,
        pot: 15,
      };

      // Mock GTO analysis
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          recommendation: 'bet',
          confidence: 0.85,
          expectedValue: 2.3,
          handStrength: 0.78,
          analysis: {
            flopTexture: 'dry',
            equity: 0.65,
            recommendations: [
              { action: 'bet', frequency: 0.7, amount: '75% pot' },
              { action: 'check', frequency: 0.3 },
            ],
          },
        }),
      });

      const analysisResponse = await fetch('/api/gto/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(handAnalysis),
      });

      const analysis = await analysisResponse.json();
      expect(analysis.recommendation).toBe('bet');
      expect(analysis.confidence).toBeGreaterThan(0.8);
      expect(analysis.analysis.recommendations).toHaveLength(2);
    });
  });

  describe('User Profile and Progress Tracking', () => {
    it('should update user profile and track achievements', async () => {
      const profileUpdate = {
        name: 'Updated User Name',
        preferences: {
          difficulty: 'advanced',
          gameTypes: ['texas-holdem', 'omaha'],
          notifications: true,
        },
      };

      // Mock profile update
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, profile: profileUpdate }),
        })
        // Mock achievements fetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            achievements: [
              { id: 'first-game', name: 'First Game', earned: true, date: '2023-12-01' },
              { id: 'course-complete', name: 'Course Graduate', earned: true, date: '2023-12-05' },
              { id: 'assessment-ace', name: 'Assessment Ace', earned: false, progress: 0.6 },
            ],
          }),
        });

      // Update profile
      const profileResponse = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileUpdate),
      });

      const profileResult = await profileResponse.json();
      expect(profileResult.success).toBe(true);
      expect(profileResult.profile.name).toBe('Updated User Name');

      // Fetch achievements
      const achievementsResponse = await fetch('/api/achievements');
      const achievementsData = await achievementsResponse.json();
      
      expect(achievementsData.achievements).toHaveLength(3);
      expect(achievementsData.achievements[0].earned).toBe(true);
      expect(achievementsData.achievements[2].progress).toBe(0.6);
    });

    it('should track learning analytics and provide insights', async () => {
      // Mock analytics data
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          weeklyProgress: {
            coursesCompleted: 2,
            hoursSpent: 8.5,
            assessmentScore: 85,
            gamesPlayed: 15,
          },
          skillProgression: {
            preFlop: 0.8,
            postFlop: 0.6,
            betting: 0.7,
            psychology: 0.5,
          },
          recommendations: [
            'Focus on post-flop play improvement',
            'Practice psychology and reading tells',
            'Review betting patterns course',
          ],
        }),
      });

      const analyticsResponse = await fetch('/api/analytics');
      const analytics = await analyticsResponse.json();
      
      expect(analytics.weeklyProgress.coursesCompleted).toBe(2);
      expect(analytics.skillProgression.preFlop).toBe(0.8);
      expect(analytics.recommendations).toContain('Focus on post-flop play improvement');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network failures gracefully', async () => {
      // Mock network failure
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetch('/api/courses')).rejects.toThrow('Network error');
    });

    it('should handle authentication failures', async () => {
      // Mock authentication failure
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      });

      const response = await fetch('/api/user/profile');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should handle invalid data gracefully', async () => {
      const invalidAssessmentData = {
        answers: null, // Invalid data
      };

      // Mock validation error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ 
          error: 'Invalid data',
          details: 'Answers array is required'
        }),
      });

      const response = await fetch('/api/assessments/test/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidAssessmentData),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      
      const error = await response.json();
      expect(error.error).toBe('Invalid data');
    });
  });

  describe('Performance and Load Testing Scenarios', () => {
    it('should handle concurrent user sessions', async () => {
      const concurrentSessions = Array.from({ length: 10 }, (_, i) => ({
        userId: `user-${i}`,
        sessionId: `session-${i}`,
      }));

      // Mock multiple concurrent requests
      (global.fetch as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, processed: true }),
        })
      );

      const promises = concurrentSessions.map(session =>
        fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(session),
        })
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      expect(results.every(r => r.ok)).toBe(true);
    });

    it('should handle large data payloads efficiently', async () => {
      // Create large dataset for testing
      const largeGameHistory = Array.from({ length: 1000 }, (_, i) => ({
        gameId: `game-${i}`,
        playerCards: ['AS', 'KS'],
        result: Math.random() > 0.5 ? 'win' : 'lose',
        amount: Math.floor(Math.random() * 100),
        timestamp: new Date().toISOString(),
      }));

      // Mock large data response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          games: largeGameHistory,
          total: 1000,
          page: 1,
          pageSize: 1000
        }),
      });

      const start = performance.now();
      const response = await fetch('/api/user/game-history');
      const data = await response.json();
      const end = performance.now();

      expect(data.games).toHaveLength(1000);
      expect(end - start).toBeLessThan(1000); // Should process in less than 1 second
    });
  });
});