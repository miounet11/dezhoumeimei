/**
 * End-to-End User Journey Tests
 * Complete user workflows testing with Playwright
 */

import { test, expect } from '@playwright/test';

// Test data configuration
const TEST_USER = {
  email: 'e2e.test@pokeriq.com',
  password: 'TestPassword123!',
  name: 'E2E Test User'
};

const TEST_COURSE = {
  id: 'basics-101',
  title: 'Poker Basics 101'
};

test.describe('Complete User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test data and context
    await page.goto('/');
    
    // Add viewport size for consistency
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('User Registration and Onboarding Flow', () => {
    test('should complete full registration and onboarding process', async ({ page }) => {
      // Navigate to registration
      await page.goto('/auth/register');
      
      // Fill registration form
      await page.fill('[data-testid=name]', TEST_USER.name);
      await page.fill('[data-testid=email]', TEST_USER.email);
      await page.fill('[data-testid=password]', TEST_USER.password);
      await page.fill('[data-testid=confirmPassword]', TEST_USER.password);
      
      // Accept terms
      await page.check('[data-testid=acceptTerms]');
      
      // Submit registration
      await page.click('[data-testid=register-button]');
      
      // Should redirect to onboarding
      await expect(page).toHaveURL(/.*onboarding.*/);
      
      // Complete onboarding steps
      await page.waitForSelector('[data-testid=onboarding-welcome]');
      await expect(page.locator('h1')).toContainText('Welcome to PokerIQ Pro');
      
      // Step 1: Basic preferences
      await page.click('[data-testid=skill-level-intermediate]');
      await page.click('[data-testid=next-step]');
      
      // Step 2: Goals selection
      await page.check('[data-testid=goal-improve-skills]');
      await page.check('[data-testid=goal-learn-gto]');
      await page.click('[data-testid=next-step]');
      
      // Step 3: Complete onboarding
      await page.click('[data-testid=complete-onboarding]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard.*/);
      await expect(page.locator('[data-testid=welcome-message]')).toBeVisible();
    });

    test('should handle registration validation errors', async ({ page }) => {
      await page.goto('/auth/register');
      
      // Try to submit without required fields
      await page.click('[data-testid=register-button]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid=error-email]')).toBeVisible();
      await expect(page.locator('[data-testid=error-password]')).toBeVisible();
      
      // Fill invalid email
      await page.fill('[data-testid=email]', 'invalid-email');
      await page.click('[data-testid=register-button]');
      
      // Should show email format error
      await expect(page.locator('[data-testid=error-email]')).toContainText('valid email');
    });
  });

  test.describe('Course Learning Journey', () => {
    test('should complete full course learning workflow', async ({ page }) => {
      // Login first
      await page.goto('/auth/login');
      await page.fill('[data-testid=email]', TEST_USER.email);
      await page.fill('[data-testid=password]', TEST_USER.password);
      await page.click('[data-testid=login-button]');
      
      // Navigate to courses
      await page.goto('/courses');
      await expect(page.locator('h1')).toContainText('Courses');
      
      // Select a course
      await page.click(`[data-testid=course-card-${TEST_COURSE.id}]`);
      
      // Course detail page
      await expect(page).toHaveURL(new RegExp(`.*courses/${TEST_COURSE.id}.*`));
      await expect(page.locator('h1')).toContainText(TEST_COURSE.title);
      
      // Start course
      await page.click('[data-testid=start-course]');
      
      // First lesson/chapter
      await page.waitForSelector('[data-testid=video-player]');
      await expect(page.locator('[data-testid=chapter-title]')).toBeVisible();
      
      // Simulate video watching (skip to end)
      const videoPlayer = page.locator('[data-testid=video-player] video');
      await videoPlayer.evaluate((video: HTMLVideoElement) => {
        video.currentTime = video.duration;
      });
      
      // Wait for video completion
      await page.waitForSelector('[data-testid=video-completed]', { timeout: 10000 });
      
      // Progress to next chapter
      await page.click('[data-testid=next-chapter]');
      
      // Complete chapter assessment
      await page.waitForSelector('[data-testid=chapter-quiz]');
      
      // Answer quiz questions
      await page.click('[data-testid=answer-option-0]'); // First question
      await page.click('[data-testid=next-question]');
      
      await page.click('[data-testid=answer-option-1]'); // Second question
      await page.click('[data-testid=submit-quiz]');
      
      // Check quiz results
      await expect(page.locator('[data-testid=quiz-score]')).toBeVisible();
      await expect(page.locator('[data-testid=quiz-passed]')).toBeVisible();
      
      // Continue to course completion
      await page.click('[data-testid=continue-course]');
      
      // Complete all remaining chapters (simulate)
      for (let i = 0; i < 3; i++) {
        try {
          await page.waitForSelector('[data-testid=next-chapter]', { timeout: 5000 });
          await page.click('[data-testid=next-chapter]');
        } catch {
          break; // No more chapters
        }
      }
      
      // Course completion
      await expect(page.locator('[data-testid=course-completed]')).toBeVisible();
      await expect(page.locator('[data-testid=certificate-earned]')).toBeVisible();
    });

    test('should track and display learning progress', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check progress indicators
      await expect(page.locator('[data-testid=overall-progress]')).toBeVisible();
      await expect(page.locator('[data-testid=courses-completed]')).toBeVisible();
      await expect(page.locator('[data-testid=hours-studied]')).toBeVisible();
      
      // Check recent activity
      await expect(page.locator('[data-testid=recent-activity]')).toBeVisible();
      
      // Navigate to detailed analytics
      await page.click('[data-testid=view-analytics]');
      await expect(page).toHaveURL(/.*analytics.*/);
      
      // Verify analytics charts
      await expect(page.locator('[data-testid=progress-chart]')).toBeVisible();
      await expect(page.locator('[data-testid=skill-breakdown]')).toBeVisible();
    });
  });

  test.describe('Assessment and Testing Workflow', () => {
    test('should complete skill assessment', async ({ page }) => {
      await page.goto('/assessments');
      
      // Select skill assessment
      await page.click('[data-testid=skill-assessment-card]');
      
      // Assessment instructions
      await expect(page.locator('[data-testid=assessment-instructions]')).toBeVisible();
      await page.click('[data-testid=start-assessment]');
      
      // Answer assessment questions
      const questionCount = await page.locator('[data-testid=question]').count();
      
      for (let i = 0; i < questionCount; i++) {
        // Wait for question to load
        await page.waitForSelector(`[data-testid=question-${i}]`);
        
        // Select an answer (first option for simplicity)
        await page.click(`[data-testid=question-${i}] [data-testid=option-0]`);
        
        if (i < questionCount - 1) {
          await page.click('[data-testid=next-question]');
        }
      }
      
      // Submit assessment
      await page.click('[data-testid=submit-assessment]');
      
      // Confirm submission
      await page.click('[data-testid=confirm-submit]');
      
      // View results
      await expect(page.locator('[data-testid=assessment-score]')).toBeVisible();
      await expect(page.locator('[data-testid=skill-breakdown]')).toBeVisible();
      await expect(page.locator('[data-testid=recommendations]')).toBeVisible();
    });

    test('should provide detailed feedback and recommendations', async ({ page }) => {
      await page.goto('/assessments/results/latest');
      
      // Check detailed results
      await expect(page.locator('[data-testid=overall-score]')).toBeVisible();
      await expect(page.locator('[data-testid=category-scores]')).toBeVisible();
      
      // View question-by-question breakdown
      await page.click('[data-testid=view-detailed-results]');
      
      await expect(page.locator('[data-testid=question-feedback]')).toBeVisible();
      await expect(page.locator('[data-testid=explanation]')).toBeVisible();
      
      // Check recommendations
      await page.click('[data-testid=view-recommendations]');
      
      await expect(page.locator('[data-testid=recommended-courses]')).toBeVisible();
      await expect(page.locator('[data-testid=study-plan]')).toBeVisible();
    });
  });

  test.describe('Game Playing and Training Workflow', () => {
    test('should complete poker game session', async ({ page }) => {
      await page.goto('/game');
      
      // Game setup
      await expect(page.locator('[data-testid=game-setup]')).toBeVisible();
      
      // Select game type
      await page.click('[data-testid=game-type-holdem]');
      
      // Set blinds
      await page.fill('[data-testid=small-blind]', '1');
      await page.fill('[data-testid=big-blind]', '2');
      
      // Start game
      await page.click('[data-testid=start-game]');
      
      // Wait for game to load
      await page.waitForSelector('[data-testid=poker-table]');
      await expect(page.locator('[data-testid=player-cards]')).toBeVisible();
      
      // Play a hand
      await page.waitForSelector('[data-testid=action-buttons]');
      
      // Make decisions based on available actions
      const foldButton = page.locator('[data-testid=action-fold]');
      const callButton = page.locator('[data-testid=action-call]');
      const betButton = page.locator('[data-testid=action-bet]');
      
      if (await betButton.isVisible()) {
        await betButton.click();
        // Enter bet amount
        await page.fill('[data-testid=bet-amount]', '5');
        await page.click('[data-testid=confirm-bet]');
      } else if (await callButton.isVisible()) {
        await callButton.click();
      } else {
        await foldButton.click();
      }
      
      // Wait for hand completion
      await page.waitForSelector('[data-testid=hand-result]', { timeout: 10000 });
      
      // Continue playing or end session
      const continueButton = page.locator('[data-testid=continue-playing]');
      if (await continueButton.isVisible()) {
        await continueButton.click();
      }
      
      // End game session
      await page.click('[data-testid=end-session]');
      
      // View session summary
      await expect(page.locator('[data-testid=session-summary]')).toBeVisible();
      await expect(page.locator('[data-testid=hands-played]')).toBeVisible();
      await expect(page.locator('[data-testid=win-rate]')).toBeVisible();
    });

    test('should use GTO training features', async ({ page }) => {
      await page.goto('/gto-training');
      
      // Select training scenario
      await page.click('[data-testid=scenario-preflop-raising]');
      
      // Training interface
      await expect(page.locator('[data-testid=training-scenario]')).toBeVisible();
      await expect(page.locator('[data-testid=gto-recommendations]')).toBeVisible();
      
      // Make training decision
      await page.click('[data-testid=training-action-raise]');
      
      // View GTO feedback
      await expect(page.locator('[data-testid=gto-feedback]')).toBeVisible();
      await expect(page.locator('[data-testid=optimal-play-percentage]')).toBeVisible();
      
      // Continue training
      await page.click('[data-testid=next-scenario]');
      
      // Complete training session
      for (let i = 0; i < 5; i++) {
        try {
          await page.waitForSelector('[data-testid=training-action-buttons]', { timeout: 3000 });
          await page.click('[data-testid=training-action-call]'); // Default action
          await page.click('[data-testid=next-scenario]');
        } catch {
          break; // Training complete
        }
      }
      
      // View training results
      await expect(page.locator('[data-testid=training-results]')).toBeVisible();
      await expect(page.locator('[data-testid=accuracy-score]')).toBeVisible();
    });
  });

  test.describe('Social and Community Features', () => {
    test('should interact with leaderboards and social features', async ({ page }) => {
      await page.goto('/social');
      
      // View leaderboards
      await expect(page.locator('[data-testid=leaderboard]')).toBeVisible();
      await expect(page.locator('[data-testid=user-ranking]')).toBeVisible();
      
      // Check achievements
      await page.click('[data-testid=achievements-tab]');
      await expect(page.locator('[data-testid=achievement-badges]')).toBeVisible();
      
      // View community discussions (if available)
      if (await page.locator('[data-testid=community-tab]').isVisible()) {
        await page.click('[data-testid=community-tab]');
        await expect(page.locator('[data-testid=discussion-posts]')).toBeVisible();
      }
    });
  });

  test.describe('User Profile and Settings', () => {
    test('should manage user profile and preferences', async ({ page }) => {
      await page.goto('/profile');
      
      // View profile information
      await expect(page.locator('[data-testid=user-profile]')).toBeVisible();
      await expect(page.locator('[data-testid=profile-stats]')).toBeVisible();
      
      // Edit profile
      await page.click('[data-testid=edit-profile]');
      
      // Update profile information
      await page.fill('[data-testid=display-name]', 'Updated Test User');
      await page.selectOption('[data-testid=skill-level]', 'advanced');
      
      // Save changes
      await page.click('[data-testid=save-profile]');
      
      // Verify changes saved
      await expect(page.locator('[data-testid=profile-updated-message]')).toBeVisible();
      
      // Navigate to settings
      await page.goto('/settings');
      
      // Update preferences
      await page.check('[data-testid=email-notifications]');
      await page.selectOption('[data-testid=theme-preference]', 'dark');
      
      // Save settings
      await page.click('[data-testid=save-settings]');
      
      // Verify settings saved
      await expect(page.locator('[data-testid=settings-updated-message]')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work properly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      // Check mobile navigation
      await expect(page.locator('[data-testid=mobile-menu-trigger]')).toBeVisible();
      await page.click('[data-testid=mobile-menu-trigger]');
      
      await expect(page.locator('[data-testid=mobile-navigation]')).toBeVisible();
      
      // Navigate through mobile interface
      await page.click('[data-testid=mobile-nav-dashboard]');
      await expect(page).toHaveURL(/.*dashboard.*/);
      
      // Check mobile-specific UI elements
      await expect(page.locator('[data-testid=mobile-stats-cards]')).toBeVisible();
      
      // Test mobile game interface
      await page.goto('/game');
      
      // Should adapt to mobile layout
      await expect(page.locator('[data-testid=mobile-game-controls]')).toBeVisible();
      
      // Test touch interactions
      await page.tap('[data-testid=mobile-action-button]');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network failures gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => {
        route.abort('failed');
      });
      
      await page.goto('/dashboard');
      
      // Should show error state
      await expect(page.locator('[data-testid=network-error]')).toBeVisible();
      await expect(page.locator('[data-testid=retry-button]')).toBeVisible();
      
      // Clear route override
      await page.unroute('**/api/**');
      
      // Retry should work
      await page.click('[data-testid=retry-button]');
      await expect(page.locator('[data-testid=dashboard-content]')).toBeVisible();
    });

    test('should handle authentication expiration', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Simulate auth token expiration
      await page.evaluate(() => {
        localStorage.removeItem('auth-token');
        document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      });
      
      // Navigate to protected page
      await page.goto('/profile');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*login.*/);
      await expect(page.locator('[data-testid=login-form]')).toBeVisible();
    });

    test('should handle slow loading gracefully', async ({ page }) => {
      // Simulate slow network
      await page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 3000);
      });
      
      await page.goto('/courses');
      
      // Should show loading state
      await expect(page.locator('[data-testid=loading-spinner]')).toBeVisible();
      
      // Eventually load content
      await expect(page.locator('[data-testid=courses-list]')).toBeVisible({ timeout: 10000 });
    });
  });
});