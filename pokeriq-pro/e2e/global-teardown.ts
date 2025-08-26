/**
 * Global Teardown for Playwright E2E Tests
 * Cleanup test data, artifacts, and generate test reports
 */

import { FullConfig } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for E2E tests...');

  try {
    // 1. Generate test reports
    console.log('📊 Generating test reports...');
    
    // Generate HTML report if not already generated
    try {
      await execAsync('npx playwright show-report --reporter=html');
      console.log('✅ HTML test report generated');
    } catch (error) {
      console.warn('⚠️ HTML report generation failed:', error);
    }

    // 2. Cleanup test database
    console.log('🗑️ Cleaning test database...');
    try {
      const baseURL = process.env.BASE_URL || 'http://localhost:8820';
      
      // Call cleanup endpoint
      const cleanupResponse = await fetch(`${baseURL}/api/test/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN || 'test-admin-token'}`
        },
        body: JSON.stringify({
          cleanupType: 'test-data',
          preserveBaseData: true
        })
      });

      if (cleanupResponse.ok) {
        const result = await cleanupResponse.json();
        console.log('✅ Test data cleaned:', result);
      }
    } catch (error) {
      console.warn('⚠️ Database cleanup failed:', error);
    }

    // 3. Archive test artifacts
    console.log('📦 Archiving test artifacts...');
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveDir = `test-results/archive-${timestamp}`;
      
      await fs.mkdir(archiveDir, { recursive: true });
      
      // Move screenshots, videos, and traces to archive
      const artifactTypes = ['screenshots', 'videos', 'traces'];
      
      for (const artifactType of artifactTypes) {
        const sourcePath = `test-results/${artifactType}`;
        const targetPath = path.join(archiveDir, artifactType);
        
        try {
          await fs.access(sourcePath);
          await fs.rename(sourcePath, targetPath);
          console.log(`✅ ${artifactType} archived`);
        } catch (error) {
          console.log(`ℹ️ No ${artifactType} to archive`);
        }
      }
      
      // Archive test results JSON
      try {
        await fs.copyFile('test-results/results.json', path.join(archiveDir, 'results.json'));
        console.log('✅ Test results archived');
      } catch (error) {
        console.log('ℹ️ No test results to archive');
      }
      
    } catch (error) {
      console.warn('⚠️ Artifact archiving failed:', error);
    }

    // 4. Generate summary report
    console.log('📝 Generating test summary...');
    try {
      const summaryPath = 'test-results/test-summary.json';
      
      // Read test results if available
      let testResults = null;
      try {
        const resultsContent = await fs.readFile('test-results/results.json', 'utf-8');
        testResults = JSON.parse(resultsContent);
      } catch (error) {
        console.log('ℹ️ No test results file found');
      }

      const summary = {
        timestamp: new Date().toISOString(),
        config: {
          baseURL: process.env.BASE_URL || 'http://localhost:8820',
          browsers: config.projects?.map(p => p.name) || ['chromium'],
        },
        results: testResults ? {
          totalTests: testResults.stats?.total || 0,
          passed: testResults.stats?.passed || 0,
          failed: testResults.stats?.failed || 0,
          skipped: testResults.stats?.skipped || 0,
          duration: testResults.stats?.duration || 0,
        } : null,
        artifacts: {
          screenshots: await countFiles('test-results/screenshots'),
          videos: await countFiles('test-results/videos'),
          traces: await countFiles('test-results/traces'),
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      };

      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
      console.log('✅ Test summary generated:', summaryPath);
      
    } catch (error) {
      console.warn('⚠️ Summary generation failed:', error);
    }

    // 5. Performance metrics collection
    console.log('⚡ Collecting performance metrics...');
    try {
      // This would integrate with your monitoring system
      const performanceMetrics = {
        timestamp: new Date().toISOString(),
        testSuite: 'e2e',
        metrics: {
          // These would come from actual test execution
          averagePageLoadTime: 0,
          totalTestDuration: 0,
          failureRate: 0,
        }
      };

      await fs.writeFile(
        'test-results/performance-metrics.json', 
        JSON.stringify(performanceMetrics, null, 2)
      );
      console.log('✅ Performance metrics collected');
      
    } catch (error) {
      console.warn('⚠️ Performance metrics collection failed:', error);
    }

    // 6. Cleanup temporary files
    console.log('🗂️ Cleaning temporary files...');
    try {
      // Remove temporary auth state file
      try {
        await fs.unlink('test-results/auth.json');
        console.log('✅ Temporary auth file removed');
      } catch (error) {
        // File might not exist
      }

      // Clean up any other temporary files
      const tempFiles = ['.tmp-test-data.json', '.test-session.lock'];
      for (const tempFile of tempFiles) {
        try {
          await fs.unlink(tempFile);
          console.log(`✅ ${tempFile} removed`);
        } catch (error) {
          // File might not exist
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Temporary file cleanup failed:', error);
    }

    // 7. Send notification (if configured)
    console.log('📧 Checking for notification configuration...');
    try {
      if (process.env.TEST_WEBHOOK_URL) {
        const webhookPayload = {
          type: 'test-completion',
          timestamp: new Date().toISOString(),
          status: 'completed',
          environment: process.env.NODE_ENV || 'test',
          summary: 'E2E test suite execution completed'
        };

        const response = await fetch(process.env.TEST_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload)
        });

        if (response.ok) {
          console.log('✅ Test completion notification sent');
        }
      } else {
        console.log('ℹ️ No webhook configured for notifications');
      }
    } catch (error) {
      console.warn('⚠️ Notification failed:', error);
    }

    console.log('🎉 Global teardown completed successfully!');

  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw error to avoid masking test failures
  }
}

/**
 * Count files in a directory
 */
async function countFiles(dirPath: string): Promise<number> {
  try {
    const files = await fs.readdir(dirPath);
    return files.length;
  } catch (error) {
    return 0;
  }
}

export default globalTeardown;