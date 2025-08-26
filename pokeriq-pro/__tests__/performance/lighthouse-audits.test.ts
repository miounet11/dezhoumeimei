/**
 * Lighthouse Performance Audits Tests
 * Comprehensive performance testing using Lighthouse CI
 */

import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';
import { jest } from '@jest/globals';

// Types for Lighthouse results
interface LighthouseResult {
  lhr: {
    categories: {
      performance: { score: number };
      accessibility: { score: number };
      'best-practices': { score: number };
      seo: { score: number };
      pwa?: { score: number };
    };
    audits: {
      [key: string]: {
        score: number | null;
        numericValue?: number;
        details?: any;
        title: string;
        description: string;
      };
    };
  };
}

interface PerformanceMetrics {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  speedIndex: number;
  timeToInteractive: number;
}

describe('Lighthouse Performance Audits', () => {
  let chrome: any;
  const baseUrl = process.env.BASE_URL || 'http://localhost:8820';
  
  // Test timeout for Lighthouse audits
  const LIGHTHOUSE_TIMEOUT = 60000;

  beforeAll(async () => {
    // Launch Chrome for testing
    chrome = await launch({
      chromeFlags: [
        '--headless',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  });

  afterAll(async () => {
    if (chrome) {
      await chrome.kill();
    }
  });

  /**
   * Run Lighthouse audit for a given URL
   */
  const runLighthouseAudit = async (
    url: string,
    options: any = {}
  ): Promise<LighthouseResult> => {
    const defaultOptions = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
      ...options,
    };

    const result = await lighthouse(url, defaultOptions);
    return result as LighthouseResult;
  };

  /**
   * Extract performance metrics from Lighthouse result
   */
  const extractPerformanceMetrics = (result: LighthouseResult): PerformanceMetrics => {
    const { audits } = result.lhr;
    
    return {
      firstContentfulPaint: audits['first-contentful-paint']?.numericValue || 0,
      largestContentfulPaint: audits['largest-contentful-paint']?.numericValue || 0,
      cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue || 0,
      totalBlockingTime: audits['total-blocking-time']?.numericValue || 0,
      speedIndex: audits['speed-index']?.numericValue || 0,
      timeToInteractive: audits['interactive']?.numericValue || 0,
    };
  };

  describe('Core Pages Performance Audits', () => {
    test('Landing page should meet performance thresholds', async () => {
      const result = await runLighthouseAudit(baseUrl);
      const metrics = extractPerformanceMetrics(result);

      // Performance score should be at least 80%
      expect(result.lhr.categories.performance.score).toBeGreaterThanOrEqual(0.8);

      // Core Web Vitals
      expect(metrics.firstContentfulPaint).toBeLessThanOrEqual(2000); // 2 seconds
      expect(metrics.largestContentfulPaint).toBeLessThanOrEqual(3000); // 3 seconds
      expect(metrics.cumulativeLayoutShift).toBeLessThanOrEqual(0.1); // 0.1 CLS
      expect(metrics.totalBlockingTime).toBeLessThanOrEqual(300); // 300ms TBT
      expect(metrics.speedIndex).toBeLessThanOrEqual(3000); // 3 seconds SI
      expect(metrics.timeToInteractive).toBeLessThanOrEqual(4000); // 4 seconds TTI
    }, LIGHTHOUSE_TIMEOUT);

    test('Dashboard should perform well under load', async () => {
      const result = await runLighthouseAudit(`${baseUrl}/dashboard`, {
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4, // Slow 4G
          cpuSlowdownMultiplier: 4,
        },
      });

      const metrics = extractPerformanceMetrics(result);

      expect(result.lhr.categories.performance.score).toBeGreaterThanOrEqual(0.75);
      expect(metrics.largestContentfulPaint).toBeLessThanOrEqual(4000); // Allow 4s on slow network
      expect(metrics.cumulativeLayoutShift).toBeLessThanOrEqual(0.1);
    }, LIGHTHOUSE_TIMEOUT);

    test('Game interface should maintain 60fps performance', async () => {
      const result = await runLighthouseAudit(`${baseUrl}/game`);
      const metrics = extractPerformanceMetrics(result);

      expect(result.lhr.categories.performance.score).toBeGreaterThanOrEqual(0.8);
      
      // Critical for game interface - low TBT for smooth interactions
      expect(metrics.totalBlockingTime).toBeLessThanOrEqual(150);
      expect(metrics.cumulativeLayoutShift).toBeLessThanOrEqual(0.05); // Stricter for game UI
    }, LIGHTHOUSE_TIMEOUT);

    test('Course player should optimize video delivery', async () => {
      const result = await runLighthouseAudit(`${baseUrl}/courses/test-course`);
      
      expect(result.lhr.categories.performance.score).toBeGreaterThanOrEqual(0.75);
      
      // Check for efficient video loading
      const audits = result.lhr.audits;
      expect(audits['efficient-animated-content']?.score).toBeGreaterThanOrEqual(0.5);
      expect(audits['offscreen-images']?.score).toBeGreaterThanOrEqual(0.8);
    }, LIGHTHOUSE_TIMEOUT);
  });

  describe('Mobile Performance Audits', () => {
    test('Mobile landing page should meet performance standards', async () => {
      const result = await runLighthouseAudit(baseUrl, {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 360,
          height: 640,
          deviceScaleFactor: 2,
        },
      });

      const metrics = extractPerformanceMetrics(result);

      expect(result.lhr.categories.performance.score).toBeGreaterThanOrEqual(0.75);
      expect(metrics.firstContentfulPaint).toBeLessThanOrEqual(2500);
      expect(metrics.largestContentfulPaint).toBeLessThanOrEqual(4000);
    }, LIGHTHOUSE_TIMEOUT);

    test('Mobile game interface should be responsive', async () => {
      const result = await runLighthouseAudit(`${baseUrl}/game`, {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 812, // iPhone X dimensions
          deviceScaleFactor: 3,
        },
      });

      expect(result.lhr.categories.performance.score).toBeGreaterThanOrEqual(0.7);
      
      // Mobile-specific checks
      const audits = result.lhr.audits;
      expect(audits['viewport']?.score).toBe(1); // Proper viewport meta tag
      expect(audits['tap-targets']?.score).toBeGreaterThanOrEqual(0.9); // Touch targets
    }, LIGHTHOUSE_TIMEOUT);
  });

  describe('Resource Optimization Audits', () => {
    test('Should use efficient image formats and compression', async () => {
      const result = await runLighthouseAudit(baseUrl);
      const audits = result.lhr.audits;

      // Image optimization checks
      expect(audits['modern-image-formats']?.score).toBeGreaterThanOrEqual(0.8);
      expect(audits['uses-optimized-images']?.score).toBeGreaterThanOrEqual(0.8);
      expect(audits['uses-responsive-images']?.score).toBeGreaterThanOrEqual(0.8);
      expect(audits['offscreen-images']?.score).toBeGreaterThanOrEqual(0.9);
    }, LIGHTHOUSE_TIMEOUT);

    test('Should minimize and compress CSS/JS resources', async () => {
      const result = await runLighthouseAudit(baseUrl);
      const audits = result.lhr.audits;

      // Code optimization checks
      expect(audits['unminified-css']?.score).toBe(1);
      expect(audits['unminified-javascript']?.score).toBe(1);
      expect(audits['uses-text-compression']?.score).toBeGreaterThanOrEqual(0.9);
      
      // Unused code detection
      if (audits['unused-css-rules']?.score !== null) {
        expect(audits['unused-css-rules'].score).toBeGreaterThanOrEqual(0.7);
      }
      if (audits['unused-javascript']?.score !== null) {
        expect(audits['unused-javascript'].score).toBeGreaterThanOrEqual(0.7);
      }
    }, LIGHTHOUSE_TIMEOUT);

    test('Should efficiently cache resources', async () => {
      const result = await runLighthouseAudit(baseUrl);
      const audits = result.lhr.audits;

      // Caching checks
      expect(audits['uses-long-cache-ttl']?.score).toBeGreaterThanOrEqual(0.7);
      if (audits['uses-rel-preconnect']?.score !== null) {
        expect(audits['uses-rel-preconnect'].score).toBeGreaterThanOrEqual(0.8);
      }
    }, LIGHTHOUSE_TIMEOUT);
  });

  describe('Progressive Web App Features', () => {
    test('Should implement basic PWA features', async () => {
      const result = await runLighthouseAudit(baseUrl, {
        onlyCategories: ['pwa'],
      });

      const audits = result.lhr.audits;

      // Basic PWA requirements
      expect(audits['is-on-https']?.score).toBe(1);
      expect(audits['viewport']?.score).toBe(1);
      expect(audits['service-worker']?.score).toBeGreaterThanOrEqual(0.5);
      
      if (audits['installable-manifest']?.score !== null) {
        expect(audits['installable-manifest'].score).toBeGreaterThanOrEqual(0.8);
      }
    }, LIGHTHOUSE_TIMEOUT);

    test('Should work offline for core features', async () => {
      const result = await runLighthouseAudit(baseUrl, {
        onlyCategories: ['pwa'],
      });

      const audits = result.lhr.audits;
      
      // Offline functionality
      if (audits['works-offline']?.score !== null) {
        expect(audits['works-offline'].score).toBeGreaterThanOrEqual(0.5);
      }
    }, LIGHTHOUSE_TIMEOUT);
  });

  describe('Performance Budget Tests', () => {
    test('Should respect JavaScript bundle size limits', async () => {
      const result = await runLighthouseAudit(baseUrl);
      const audits = result.lhr.audits;

      // Bundle size checks
      if (audits['total-byte-weight']?.numericValue) {
        expect(audits['total-byte-weight'].numericValue).toBeLessThanOrEqual(3000000); // 3MB total
      }
      
      if (audits['dom-size']?.numericValue) {
        expect(audits['dom-size'].numericValue).toBeLessThanOrEqual(1500); // DOM nodes
      }
    }, LIGHTHOUSE_TIMEOUT);

    test('Should limit main thread blocking time', async () => {
      const result = await runLighthouseAudit(baseUrl);
      const audits = result.lhr.audits;

      // Main thread work
      if (audits['mainthread-work-breakdown']?.numericValue) {
        expect(audits['mainthread-work-breakdown'].numericValue).toBeLessThanOrEqual(4000);
      }
      
      if (audits['bootup-time']?.numericValue) {
        expect(audits['bootup-time'].numericValue).toBeLessThanOrEqual(3500);
      }
    }, LIGHTHOUSE_TIMEOUT);
  });

  describe('Network Performance Tests', () => {
    test('Should minimize network requests', async () => {
      const result = await runLighthouseAudit(baseUrl);
      const audits = result.lhr.audits;

      // Network efficiency
      if (audits['network-requests']?.details?.items) {
        const requests = audits['network-requests'].details.items;
        expect(requests.length).toBeLessThanOrEqual(50); // Reasonable request limit
      }
      
      if (audits['critical-request-chains']) {
        // Should minimize critical request chains
        expect(audits['critical-request-chains'].score).toBeGreaterThanOrEqual(0.7);
      }
    }, LIGHTHOUSE_TIMEOUT);

    test('Should use HTTP/2 and HTTPS', async () => {
      const result = await runLighthouseAudit(baseUrl);
      const audits = result.lhr.audits;

      expect(audits['is-on-https']?.score).toBe(1);
      if (audits['uses-http2']?.score !== null) {
        expect(audits['uses-http2'].score).toBeGreaterThanOrEqual(0.8);
      }
    }, LIGHTHOUSE_TIMEOUT);
  });

  describe('Performance Regression Tests', () => {
    test('Should maintain performance consistency across pages', async () => {
      const pages = [
        '',
        '/dashboard',
        '/courses',
        '/game',
        '/profile',
      ];

      const results = await Promise.all(
        pages.map(page => runLighthouseAudit(`${baseUrl}${page}`))
      );

      const performanceScores = results.map(result => result.lhr.categories.performance.score);
      const avgScore = performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length;
      
      expect(avgScore).toBeGreaterThanOrEqual(0.75);
      
      // No page should be significantly worse than the average
      performanceScores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(avgScore - 0.2);
      });
    }, LIGHTHOUSE_TIMEOUT * 5);

    test('Should track performance metrics over time', async () => {
      const result = await runLighthouseAudit(baseUrl);
      const metrics = extractPerformanceMetrics(result);

      // Store baseline metrics (in real implementation, this would use a database)
      const baselineMetrics = {
        firstContentfulPaint: 1800,
        largestContentfulPaint: 2800,
        cumulativeLayoutShift: 0.08,
        totalBlockingTime: 250,
        speedIndex: 2500,
        timeToInteractive: 3500,
      };

      // Check for regression (allow 10% variance)
      expect(metrics.firstContentfulPaint).toBeLessThanOrEqual(baselineMetrics.firstContentfulPaint * 1.1);
      expect(metrics.largestContentfulPaint).toBeLessThanOrEqual(baselineMetrics.largestContentfulPaint * 1.1);
      expect(metrics.cumulativeLayoutShift).toBeLessThanOrEqual(baselineMetrics.cumulativeLayoutShift * 1.1);
      expect(metrics.totalBlockingTime).toBeLessThanOrEqual(baselineMetrics.totalBlockingTime * 1.1);
      expect(metrics.speedIndex).toBeLessThanOrEqual(baselineMetrics.speedIndex * 1.1);
      expect(metrics.timeToInteractive).toBeLessThanOrEqual(baselineMetrics.timeToInteractive * 1.1);
    }, LIGHTHOUSE_TIMEOUT);
  });

  describe('Performance Monitoring Integration', () => {
    test('Should generate performance report', async () => {
      const result = await runLighthouseAudit(baseUrl);
      const metrics = extractPerformanceMetrics(result);
      
      // Create performance report
      const report = {
        timestamp: new Date().toISOString(),
        url: baseUrl,
        performanceScore: result.lhr.categories.performance.score,
        accessibilityScore: result.lhr.categories.accessibility.score,
        bestPracticesScore: result.lhr.categories['best-practices'].score,
        seoScore: result.lhr.categories.seo.score,
        metrics,
        audits: {
          criticalIssues: Object.keys(result.lhr.audits)
            .filter(key => result.lhr.audits[key].score !== null && result.lhr.audits[key].score < 0.5)
            .map(key => ({
              audit: key,
              score: result.lhr.audits[key].score,
              title: result.lhr.audits[key].title,
            })),
        },
      };

      expect(report.performanceScore).toBeGreaterThanOrEqual(0.75);
      expect(report.criticalIssues.length).toBeLessThanOrEqual(3);
      
      // In a real implementation, this report would be saved to monitoring system
      console.log('Performance Report Generated:', {
        performanceScore: report.performanceScore,
        criticalIssues: report.criticalIssues.length,
        lcp: metrics.largestContentfulPaint,
        cls: metrics.cumulativeLayoutShift,
      });
    }, LIGHTHOUSE_TIMEOUT);
  });
});