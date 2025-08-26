/**
 * Global Setup for Playwright E2E Tests
 * Handles authentication, database seeding, and test environment preparation
 */

import { chromium, FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');

  try {
    // 1. Ensure the development server is ready
    console.log('📡 Checking development server...');
    const baseURL = process.env.BASE_URL || 'http://localhost:8820';
    
    // Wait for server to be ready (with timeout)
    let serverReady = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!serverReady && attempts < maxAttempts) {
      try {
        const response = await fetch(`${baseURL}/api/health`);
        if (response.ok) {
          serverReady = true;
          console.log('✅ Development server is ready');
        }
      } catch (error) {
        attempts++;
        console.log(`⏳ Waiting for server... (attempt ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!serverReady) {
      throw new Error('❌ Development server not ready after 60 seconds');
    }

    // 2. Seed test database with necessary data
    console.log('🌱 Seeding test database...');
    try {
      await execAsync('npm run db:seed-test-users');
      console.log('✅ Test users seeded successfully');
    } catch (error) {
      console.warn('⚠️ Database seeding failed (might be already seeded):', error);
    }

    // 3. Setup authentication state
    console.log('🔐 Setting up authentication state...');
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to login page and authenticate
    await page.goto(`${baseURL}/auth/login`);

    // Use test credentials
    const testUser = {
      email: process.env.TEST_USER_EMAIL || 'test@pokeriq.com',
      password: process.env.TEST_USER_PASSWORD || 'TestPassword123!'
    };

    // Fill login form
    await page.fill('[data-testid=email]', testUser.email);
    await page.fill('[data-testid=password]', testUser.password);
    await page.click('[data-testid=login-button]');

    // Wait for successful login (redirect to dashboard)
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('✅ Authentication successful');
    } catch (error) {
      console.log('⚠️ Login redirect not detected, checking for auth token...');
      // Alternative check for auth state
      const authCookie = await context.cookies();
      if (authCookie.some(cookie => cookie.name.includes('auth') || cookie.name.includes('token'))) {
        console.log('✅ Authentication token found');
      } else {
        console.warn('⚠️ No authentication token found');
      }
    }

    // Save authentication state
    await context.storageState({ path: 'test-results/auth.json' });
    console.log('💾 Authentication state saved');

    await browser.close();

    // 4. Verify test data integrity
    console.log('🔍 Verifying test data...');
    try {
      const testDataCheck = await fetch(`${baseURL}/api/test/verify-data`, {
        headers: {
          'Cookie': `auth-token=${process.env.TEST_AUTH_TOKEN || 'test-token'}`
        }
      });
      
      if (testDataCheck.ok) {
        const data = await testDataCheck.json();
        console.log('✅ Test data verified:', {
          courses: data.coursesCount,
          assessments: data.assessmentsCount,
          users: data.usersCount
        });
      }
    } catch (error) {
      console.warn('⚠️ Test data verification failed:', error);
    }

    // 5. Clear any existing test artifacts
    console.log('🧹 Cleaning test artifacts...');
    try {
      await execAsync('rm -rf test-results/screenshots test-results/videos test-results/traces');
      await execAsync('mkdir -p test-results/screenshots test-results/videos test-results/traces');
      console.log('✅ Test artifacts cleaned');
    } catch (error) {
      console.warn('⚠️ Artifact cleanup failed:', error);
    }

    console.log('🎉 Global setup completed successfully!');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;