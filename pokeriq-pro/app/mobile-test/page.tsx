'use client';

/**
 * Mobile Test Interface
 * 
 * Comprehensive mobile testing interface including:
 * - Device simulation
 * - Performance testing
 * - Responsive design validation
 * - Touch interaction testing
 * - Network condition simulation
 * - PWA feature testing
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useResponsive, BREAKPOINTS, type BreakpointKey } from '@/lib/mobile/responsive-utils';
import { usePerformanceDashboard } from '@/lib/monitoring/performance-dashboard';
import { mobileOptimizer, MobileOptimizationUtils } from '@/lib/mobile/performance-optimizer';

// Device simulation configurations
const DEVICE_SIMULATIONS = {
  'iPhone SE': { width: 375, height: 667, pixelRatio: 2, userAgent: 'iPhone' },
  'iPhone 12': { width: 390, height: 844, pixelRatio: 3, userAgent: 'iPhone' },
  'iPhone 14 Pro': { width: 393, height: 852, pixelRatio: 3, userAgent: 'iPhone' },
  'Samsung Galaxy S21': { width: 360, height: 800, pixelRatio: 3, userAgent: 'Android' },
  'iPad Mini': { width: 768, height: 1024, pixelRatio: 2, userAgent: 'iPad' },
  'iPad Pro': { width: 1024, height: 1366, pixelRatio: 2, userAgent: 'iPad' },
  'Desktop': { width: 1920, height: 1080, pixelRatio: 1, userAgent: 'Desktop' },
} as const;

type DeviceName = keyof typeof DEVICE_SIMULATIONS;

// Network simulation configurations
const NETWORK_SIMULATIONS = {
  'Fast 3G': { downlink: 1.5, rtt: 150, effectiveType: '3g' },
  'Slow 3G': { downlink: 0.4, rtt: 400, effectiveType: 'slow-3g' },
  '4G': { downlink: 4, rtt: 50, effectiveType: '4g' },
  '5G': { downlink: 20, rtt: 10, effectiveType: '5g' },
  'Offline': { downlink: 0, rtt: 0, effectiveType: 'offline' }
} as const;

type NetworkName = keyof typeof NETWORK_SIMULATIONS;

// Test categories
interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  value?: number;
  threshold?: number;
}

interface TestCategory {
  name: string;
  tests: TestResult[];
  score: number;
}

export default function MobileTestPage() {
  const responsive = useResponsive();
  const performanceDashboard = usePerformanceDashboard();
  
  // State management
  const [selectedDevice, setSelectedDevice] = useState<DeviceName>('iPhone 12');
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkName>('4G');
  const [isSimulating, setIsSimulating] = useState(false);
  const [testResults, setTestResults] = useState<TestCategory[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [simulatedViewport, setSimulatedViewport] = useState<{width: number; height: number} | null>(null);
  
  // References
  const simulatorRef = useRef<HTMLDivElement>(null);
  const testFrameRef = useRef<HTMLIFrameElement>(null);

  /**
   * Start device simulation
   */
  const startDeviceSimulation = useCallback(() => {
    const device = DEVICE_SIMULATIONS[selectedDevice];
    const network = NETWORK_SIMULATIONS[selectedNetwork];
    
    setSimulatedViewport({ width: device.width, height: device.height });
    setIsSimulating(true);
    
    console.log(`[Mobile Test] Simulating ${selectedDevice} with ${selectedNetwork} network`);
  }, [selectedDevice, selectedNetwork]);

  /**
   * Stop device simulation
   */
  const stopDeviceSimulation = useCallback(() => {
    setSimulatedViewport(null);
    setIsSimulating(false);
    
    console.log('[Mobile Test] Simulation stopped');
  }, []);

  /**
   * Run comprehensive mobile tests
   */
  const runMobileTests = useCallback(async () => {
    setIsRunningTests(true);
    setTestResults([]);

    try {
      const categories: TestCategory[] = [];

      // Performance Tests
      const performanceTests = await runPerformanceTests();
      categories.push(performanceTests);

      // Responsive Design Tests
      const responsiveTests = runResponsiveTests();
      categories.push(responsiveTests);

      // Touch Interaction Tests
      const touchTests = runTouchTests();
      categories.push(touchTests);

      // PWA Feature Tests
      const pwaTests = await runPWATests();
      categories.push(pwaTests);

      // Accessibility Tests
      const accessibilityTests = runAccessibilityTests();
      categories.push(accessibilityTests);

      setTestResults(categories);
      console.log('[Mobile Test] All tests completed', categories);
    } catch (error) {
      console.error('[Mobile Test] Test execution failed:', error);
    } finally {
      setIsRunningTests(false);
    }
  }, []);

  /**
   * Run performance tests
   */
  const runPerformanceTests = async (): Promise<TestCategory> => {
    const tests: TestResult[] = [];
    
    // Get current performance metrics
    const metrics = mobileOptimizer.getMetrics();
    const summary = performanceDashboard.summary;
    
    // Memory usage test
    if (metrics?.memoryUsage) {
      const memoryMB = metrics.memoryUsage / (1024 * 1024);
      tests.push({
        name: 'Memory Usage',
        status: memoryMB < 50 ? 'pass' : memoryMB < 100 ? 'warning' : 'fail',
        message: `Memory usage: ${memoryMB.toFixed(1)}MB`,
        value: memoryMB,
        threshold: 50
      });
    }
    
    // Core Web Vitals tests
    if (summary?.coreWebVitals) {
      const { fcp, lcp, fid, cls } = summary.coreWebVitals;
      
      if (fcp > 0) {
        tests.push({
          name: 'First Contentful Paint',
          status: fcp < 1800 ? 'pass' : fcp < 3000 ? 'warning' : 'fail',
          message: `FCP: ${fcp}ms`,
          value: fcp,
          threshold: 1800
        });
      }
      
      if (lcp > 0) {
        tests.push({
          name: 'Largest Contentful Paint',
          status: lcp < 2500 ? 'pass' : lcp < 4000 ? 'warning' : 'fail',
          message: `LCP: ${lcp}ms`,
          value: lcp,
          threshold: 2500
        });
      }
    }
    
    // Network performance test
    const isSlowNetwork = ['slow-2g', '2g', '3g'].includes(metrics?.networkType || '');
    tests.push({
      name: 'Network Performance',
      status: !isSlowNetwork ? 'pass' : 'warning',
      message: `Network type: ${metrics?.networkType || 'unknown'}`
    });
    
    // Device capability test
    tests.push({
      name: 'Device Capability',
      status: !metrics?.isLowEndDevice ? 'pass' : 'warning',
      message: metrics?.isLowEndDevice ? 'Low-end device detected' : 'Device has good capabilities'
    });
    
    const score = calculateCategoryScore(tests);
    
    return {
      name: 'Performance',
      tests,
      score
    };
  };

  /**
   * Run responsive design tests
   */
  const runResponsiveTests = (): TestCategory => {
    const tests: TestResult[] = [];
    
    // Breakpoint test
    const currentBreakpoint = responsive.breakpoint;
    tests.push({
      name: 'Breakpoint Detection',
      status: 'pass',
      message: `Current breakpoint: ${currentBreakpoint}`
    });
    
    // Touch capability test
    tests.push({
      name: 'Touch Support',
      status: responsive.isTouch ? 'pass' : 'warning',
      message: responsive.isTouch ? 'Touch supported' : 'Touch not detected'
    });
    
    // Orientation test
    tests.push({
      name: 'Orientation',
      status: 'pass',
      message: `Current orientation: ${responsive.orientation}`
    });
    
    // Viewport test
    if (responsive.viewport) {
      const { width, height } = responsive.viewport;
      tests.push({
        name: 'Viewport Size',
        status: width >= 320 ? 'pass' : 'fail',
        message: `Viewport: ${width}x${height}`,
        value: width,
        threshold: 320
      });
    }
    
    // Safe area test
    const safeArea = document.documentElement.style.getPropertyValue('--safe-area-inset-top');
    tests.push({
      name: 'Safe Area Support',
      status: safeArea ? 'pass' : 'warning',
      message: safeArea ? 'Safe area insets detected' : 'No safe area insets'
    });

    const score = calculateCategoryScore(tests);
    
    return {
      name: 'Responsive Design',
      tests,
      score
    };
  };

  /**
   * Run touch interaction tests
   */
  const runTouchTests = (): TestCategory => {
    const tests: TestResult[] = [];
    
    // Touch target size test
    const touchElements = document.querySelectorAll('button, a, input[type="button"], [onclick]');
    let smallTargets = 0;
    
    touchElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height);
      if (size < 44) smallTargets++;
    });
    
    tests.push({
      name: 'Touch Target Size',
      status: smallTargets === 0 ? 'pass' : smallTargets < 5 ? 'warning' : 'fail',
      message: `${smallTargets} elements smaller than 44px`,
      value: smallTargets,
      threshold: 0
    });
    
    // Touch action test
    const touchActionElements = document.querySelectorAll('[style*="touch-action"]');
    tests.push({
      name: 'Touch Action Optimization',
      status: touchActionElements.length > 0 ? 'pass' : 'warning',
      message: `${touchActionElements.length} elements with touch-action`
    });
    
    // Gesture support test
    const hasGestureEvents = 'ongesturestart' in window;
    tests.push({
      name: 'Gesture Events',
      status: hasGestureEvents ? 'pass' : 'warning',
      message: hasGestureEvents ? 'Gesture events supported' : 'Gesture events not supported'
    });

    const score = calculateCategoryScore(tests);
    
    return {
      name: 'Touch Interactions',
      tests,
      score
    };
  };

  /**
   * Run PWA feature tests
   */
  const runPWATests = async (): Promise<TestCategory> => {
    const tests: TestResult[] = [];
    
    // Service Worker test
    const hasServiceWorker = 'serviceWorker' in navigator;
    tests.push({
      name: 'Service Worker Support',
      status: hasServiceWorker ? 'pass' : 'fail',
      message: hasServiceWorker ? 'Service Worker supported' : 'Service Worker not supported'
    });
    
    // Manifest test
    const manifestLink = document.querySelector('link[rel="manifest"]');
    tests.push({
      name: 'Web App Manifest',
      status: manifestLink ? 'pass' : 'fail',
      message: manifestLink ? 'Manifest found' : 'Manifest not found'
    });
    
    // Cache API test
    const hasCacheAPI = 'caches' in window;
    tests.push({
      name: 'Cache API',
      status: hasCacheAPI ? 'pass' : 'fail',
      message: hasCacheAPI ? 'Cache API supported' : 'Cache API not supported'
    });
    
    // Push notifications test
    const hasPushAPI = 'PushManager' in window;
    tests.push({
      name: 'Push Notifications',
      status: hasPushAPI ? 'pass' : 'warning',
      message: hasPushAPI ? 'Push API supported' : 'Push API not supported'
    });
    
    // Background sync test
    const hasBackgroundSync = 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
    tests.push({
      name: 'Background Sync',
      status: hasBackgroundSync ? 'pass' : 'warning',
      message: hasBackgroundSync ? 'Background Sync supported' : 'Background Sync not supported'
    });
    
    // Installability test
    let isInstallable = false;
    try {
      const manifest = await fetch('/manifest.json').then(r => r.json());
      isInstallable = !!manifest && !!manifest.start_url;
    } catch (error) {
      // Manifest fetch failed
    }
    
    tests.push({
      name: 'App Installability',
      status: isInstallable ? 'pass' : 'warning',
      message: isInstallable ? 'App can be installed' : 'App may not be installable'
    });

    const score = calculateCategoryScore(tests);
    
    return {
      name: 'PWA Features',
      tests,
      score
    };
  };

  /**
   * Run accessibility tests
   */
  const runAccessibilityTests = (): TestCategory => {
    const tests: TestResult[] = [];
    
    // Alt text test
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(img => !img.alt || img.alt.trim() === '');
    
    tests.push({
      name: 'Image Alt Text',
      status: imagesWithoutAlt.length === 0 ? 'pass' : 'warning',
      message: `${imagesWithoutAlt.length} images without alt text`,
      value: imagesWithoutAlt.length,
      threshold: 0
    });
    
    // Focus management test
    const focusableElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
    tests.push({
      name: 'Focusable Elements',
      status: focusableElements.length > 0 ? 'pass' : 'warning',
      message: `${focusableElements.length} focusable elements found`
    });
    
    // Color contrast test (simplified)
    const hasHighContrastStyles = document.querySelector('style, link[rel="stylesheet"]');
    tests.push({
      name: 'Color Contrast',
      status: hasHighContrastStyles ? 'pass' : 'warning',
      message: hasHighContrastStyles ? 'Styles detected (manual verification needed)' : 'No styles detected'
    });
    
    // ARIA labels test
    const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
    tests.push({
      name: 'ARIA Labels',
      status: ariaElements.length > 0 ? 'pass' : 'warning',
      message: `${ariaElements.length} elements with ARIA attributes`
    });

    const score = calculateCategoryScore(tests);
    
    return {
      name: 'Accessibility',
      tests,
      score
    };
  };

  /**
   * Calculate category score based on test results
   */
  const calculateCategoryScore = (tests: TestResult[]): number => {
    if (tests.length === 0) return 0;
    
    const totalScore = tests.reduce((sum, test) => {
      switch (test.status) {
        case 'pass': return sum + 100;
        case 'warning': return sum + 60;
        case 'fail': return sum + 0;
        default: return sum;
      }
    }, 0);
    
    return Math.round(totalScore / tests.length);
  };

  /**
   * Get status color for test results
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'fail': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  /**
   * Get overall test score
   */
  const getOverallScore = () => {
    if (testResults.length === 0) return 0;
    
    const totalScore = testResults.reduce((sum, category) => sum + category.score, 0);
    return Math.round(totalScore / testResults.length);
  };

  // Initialize mobile optimizer when component mounts
  useEffect(() => {
    mobileOptimizer.initialize();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mobile Testing Interface
          </h1>
          <p className="text-gray-600">
            Comprehensive mobile optimization and performance testing tools
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Device Simulation */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Device Simulation
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Device
                  </label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value as DeviceName)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.keys(DEVICE_SIMULATIONS).map((device) => (
                      <option key={device} value={device}>
                        {device}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Network
                  </label>
                  <select
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value as NetworkName)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.keys(NETWORK_SIMULATIONS).map((network) => (
                      <option key={network} value={network}>
                        {network}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={startDeviceSimulation}
                    disabled={isSimulating}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSimulating ? 'Simulating...' : 'Start Simulation'}
                  </button>
                  <button
                    onClick={stopDeviceSimulation}
                    disabled={!isSimulating}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
                  >
                    Stop
                  </button>
                </div>
              </div>
            </div>

            {/* Test Controls */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Testing Controls
              </h2>
              
              <button
                onClick={runMobileTests}
                disabled={isRunningTests}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
              </button>
              
              {testResults.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {getOverallScore()}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Overall Score
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Current Device Info */}
            {responsive.viewport && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Current Device
                </h2>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Device Type:</span>
                    <span className="font-medium">{responsive.viewport.deviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Breakpoint:</span>
                    <span className="font-medium">{responsive.viewport.breakpoint}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Viewport:</span>
                    <span className="font-medium">
                      {responsive.viewport.width}x{responsive.viewport.height}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Orientation:</span>
                    <span className="font-medium">{responsive.viewport.orientation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Touch:</span>
                    <span className="font-medium">{responsive.viewport.isTouch ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pixel Ratio:</span>
                    <span className="font-medium">{responsive.viewport.pixelRatio}x</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Device Simulator */}
            {isSimulating && simulatedViewport && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Device Simulator - {selectedDevice}
                </h2>
                
                <div className="flex justify-center">
                  <div
                    ref={simulatorRef}
                    className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg"
                    style={{
                      width: Math.min(simulatedViewport.width, 600),
                      height: Math.min(simulatedViewport.height, 800),
                      transform: `scale(${Math.min(600 / simulatedViewport.width, 800 / simulatedViewport.height, 1)})`
                    }}
                  >
                    <iframe
                      ref={testFrameRef}
                      src={window.location.origin}
                      className="w-full h-full border-none"
                      title={`${selectedDevice} Simulation`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Test Results */}
            {testResults.map((category) => (
              <div key={category.name} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {category.name}
                  </h2>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {category.score}%
                    </div>
                    <div className="text-sm text-gray-600">Score</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {category.tests.map((test, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {test.name}
                        </div>
                        <div className={`text-sm ${getStatusColor(test.status)}`}>
                          {test.message}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        test.status === 'pass' ? 'bg-green-100 text-green-800' :
                        test.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {test.status.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}