/**
 * Lighthouse CI Configuration for PokerIQ Pro
 * Performance, accessibility, and best practices auditing
 */

module.exports = {
  ci: {
    collect: {
      // Number of runs for more reliable results
      numberOfRuns: 3,
      
      // URLs to test
      url: [
        'http://localhost:8820',                    // Landing page
        'http://localhost:8820/dashboard',          // Dashboard
        'http://localhost:8820/courses',            // Course listing
        'http://localhost:8820/game',              // Game interface
        'http://localhost:8820/assessments',        // Assessment page
        'http://localhost:8820/gto-training',      // GTO training
        'http://localhost:8820/profile',           // User profile
        'http://localhost:8820/companion-center',  // Companion center
        'http://localhost:8820/analytics',         // Analytics page
      ],
      
      // Chrome flags for testing
      chromeFlags: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--headless',
      ],
      
      // Settings for data collection
      settings: {
        // Use mobile simulation for mobile performance testing
        formFactor: 'mobile',
        throttling: {
          // Simulate slow 4G
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
        // Screen emulation
        screenEmulation: {
          mobile: true,
          width: 360,
          height: 640,
          deviceScaleFactor: 2,
          disabled: false,
        },
        // Disable storage reset to simulate real usage
        disableStorageReset: false,
      },
    },
    
    assert: {
      // Performance thresholds
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.8 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        
        // Accessibility specific
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'aria-valid-attr': 'error',
        'button-name': 'error',
        'link-name': 'error',
        
        // Best practices
        'uses-https': 'error',
        'is-on-https': 'error',
        'uses-http2': 'warn',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'warn',
        
        // Performance specific
        'uses-text-compression': 'warn',
        'uses-responsive-images': 'warn',
        'efficient-animated-content': 'warn',
        'offscreen-images': 'warn',
        'unminified-css': 'error',
        'unminified-javascript': 'error',
        'unused-css-rules': 'warn',
        'unused-javascript': 'warn',
        'modern-image-formats': 'warn',
        'uses-webp-images': 'warn',
      },
    },
    
    upload: {
      // Upload results to temporary server (can be configured for actual server)
      target: 'temporary-public-storage',
      
      // Additional configuration for result storage
      outputDir: './lighthouse-reports',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%',
    },
    
    server: {
      // Server configuration for CI
      port: 9001,
      storage: {
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lhci.db',
      },
    },
  },
  
  // Desktop configuration for comparison
  desktop: {
    collect: {
      numberOfRuns: 3,
      url: [
        'http://localhost:8820',
        'http://localhost:8820/dashboard',
        'http://localhost:8820/game',
      ],
      settings: {
        formFactor: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        
        // More aggressive desktop thresholds
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
        'total-blocking-time': ['error', { maxNumericValue: 150 }],
        'speed-index': ['error', { maxNumericValue: 2500 }],
      },
    },
  },
};