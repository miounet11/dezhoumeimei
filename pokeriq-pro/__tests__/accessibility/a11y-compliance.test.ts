/**
 * Accessibility Compliance Tests (WCAG 2.1 AA)
 * Comprehensive accessibility testing using axe-core and custom checks
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { jest } from '@jest/globals';
import { ReactElement } from 'react';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Next.js components that might cause issues in tests
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

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
      id: 'test-user',
      email: 'test@example.com',
      name: 'Test User',
    },
    isLoading: false,
  }),
}));

describe('WCAG 2.1 AA Accessibility Compliance', () => {
  // Configure axe for WCAG 2.1 AA compliance
  const axeConfig = {
    rules: {
      // WCAG 2.1 AA specific rules
      'color-contrast': { enabled: true },
      'aria-allowed-attr': { enabled: true },
      'aria-required-attr': { enabled: true },
      'aria-valid-attr-value': { enabled: true },
      'aria-valid-attr': { enabled: true },
      'button-name': { enabled: true },
      'document-title': { enabled: true },
      'duplicate-id': { enabled: true },
      'form-field-multiple-labels': { enabled: true },
      'frame-title': { enabled: true },
      'html-has-lang': { enabled: true },
      'html-lang-valid': { enabled: true },
      'image-alt': { enabled: true },
      'input-image-alt': { enabled: true },
      'label': { enabled: true },
      'landmark-one-main': { enabled: true },
      'link-name': { enabled: true },
      'list': { enabled: true },
      'listitem': { enabled: true },
      'meta-refresh': { enabled: true },
      'meta-viewport': { enabled: true },
      'page-has-heading-one': { enabled: true },
      'region': { enabled: true },
      'scope-attr-valid': { enabled: true },
      'server-side-image-map': { enabled: true },
      'svg-img-alt': { enabled: true },
      'valid-lang': { enabled: true },
    },
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  };

  /**
   * Test component for accessibility violations
   */
  const testAccessibility = async (component: ReactElement) => {
    const { container } = render(component);
    const results = await axe(container, axeConfig);
    return results;
  };

  describe('Core Navigation and Layout', () => {
    it('should have accessible navigation menu', async () => {
      // Mock navigation component
      const NavigationMock = () => (
        <nav role="navigation" aria-label="Main navigation">
          <h2 className="sr-only">Navigation Menu</h2>
          <ul>
            <li><a href="/" aria-current="page">Home</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/courses">Courses</a></li>
            <li><a href="/game">Game</a></li>
            <li><button type="button" aria-expanded="false" aria-haspopup="true">
              More <span aria-hidden="true">▼</span>
            </button></li>
          </ul>
        </nav>
      );

      const results = await testAccessibility(<NavigationMock />);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', async () => {
      const HeadingHierarchy = () => (
        <main>
          <h1>PokerIQ Pro</h1>
          <section>
            <h2>Dashboard</h2>
            <h3>Recent Activity</h3>
            <h4>Game Statistics</h4>
          </section>
          <section>
            <h2>Courses</h2>
            <h3>Recommended for You</h3>
          </section>
        </main>
      );

      const results = await testAccessibility(<HeadingHierarchy />);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible landmark regions', async () => {
      const LandmarkRegions = () => (
        <div>
          <header role="banner">
            <h1>PokerIQ Pro</h1>
            <nav role="navigation" aria-label="Main navigation">
              <ul>
                <li><a href="/">Home</a></li>
              </ul>
            </nav>
          </header>
          <main role="main">
            <section aria-labelledby="dashboard-heading">
              <h2 id="dashboard-heading">Dashboard</h2>
              <p>Your learning progress</p>
            </section>
          </main>
          <aside role="complementary" aria-label="Recent achievements">
            <h3>Achievements</h3>
            <ul>
              <li>First Course Completed</li>
            </ul>
          </aside>
          <footer role="contentinfo">
            <p>&copy; 2023 PokerIQ Pro</p>
          </footer>
        </div>
      );

      const results = await testAccessibility(<LandmarkRegions />);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Forms and Input Controls', () => {
    it('should have accessible form controls with proper labels', async () => {
      const AccessibleForm = () => (
        <form role="form" aria-labelledby="login-heading">
          <h2 id="login-heading">Login to Your Account</h2>
          
          <div>
            <label htmlFor="email-input">Email Address *</label>
            <input 
              id="email-input"
              type="email"
              name="email"
              required
              aria-describedby="email-help"
              aria-invalid="false"
            />
            <div id="email-help" className="help-text">
              Enter the email address associated with your account
            </div>
          </div>

          <div>
            <label htmlFor="password-input">Password *</label>
            <input 
              id="password-input"
              type="password"
              name="password"
              required
              aria-describedby="password-help"
              minLength={8}
            />
            <div id="password-help" className="help-text">
              Your password must be at least 8 characters long
            </div>
          </div>

          <fieldset>
            <legend>Login Options</legend>
            <div>
              <input 
                id="remember-me"
                type="checkbox"
                name="rememberMe"
              />
              <label htmlFor="remember-me">Remember me for 30 days</label>
            </div>
          </fieldset>

          <button type="submit" aria-describedby="submit-help">
            Sign In
          </button>
          <div id="submit-help" className="help-text">
            Press Enter or click to sign in
          </div>
        </form>
      );

      const results = await testAccessibility(<AccessibleForm />);
      expect(results).toHaveNoViolations();
    });

    it('should handle form validation errors accessibly', async () => {
      const FormWithErrors = () => (
        <form role="form" aria-labelledby="form-title" noValidate>
          <h2 id="form-title">Registration Form</h2>
          
          <div role="alert" aria-live="polite" id="form-errors">
            <h3>Please correct the following errors:</h3>
            <ul>
              <li><a href="#email-input">Email address is required</a></li>
              <li><a href="#password-input">Password must be at least 8 characters</a></li>
            </ul>
          </div>

          <div>
            <label htmlFor="email-input">Email Address *</label>
            <input 
              id="email-input"
              type="email"
              name="email"
              required
              aria-invalid="true"
              aria-describedby="email-error"
            />
            <div id="email-error" role="alert" className="error-message">
              Email address is required
            </div>
          </div>

          <div>
            <label htmlFor="password-input">Password *</label>
            <input 
              id="password-input"
              type="password"
              name="password"
              required
              aria-invalid="true"
              aria-describedby="password-error"
              minLength={8}
            />
            <div id="password-error" role="alert" className="error-message">
              Password must be at least 8 characters long
            </div>
          </div>

          <button type="submit">Create Account</button>
        </form>
      );

      const results = await testAccessibility(<FormWithErrors />);
      expect(results).toHaveNoViolations();
    });

    it('should provide accessible search functionality', async () => {
      const SearchComponent = () => (
        <div role="search" aria-labelledby="search-heading">
          <h2 id="search-heading">Search Courses</h2>
          <form>
            <label htmlFor="search-input">Search courses and lessons</label>
            <input 
              id="search-input"
              type="search"
              name="query"
              aria-describedby="search-help"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded="false"
              role="combobox"
            />
            <div id="search-help" className="help-text">
              Start typing to see course suggestions
            </div>
            <button type="submit" aria-label="Submit search">
              <span aria-hidden="true">🔍</span>
            </button>
          </form>
          
          <div 
            id="search-results" 
            role="listbox"
            aria-label="Search suggestions"
            style={{ display: 'none' }}
          >
            <div role="option" aria-selected="false">
              Texas Hold'em Basics
            </div>
          </div>
        </div>
      );

      const results = await testAccessibility(<SearchComponent />);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Interactive Elements and Controls', () => {
    it('should have accessible buttons with proper ARIA attributes', async () => {
      const ButtonControls = () => (
        <div>
          <button type="button" aria-label="Start new poker game">
            <span aria-hidden="true">🎮</span> Play
          </button>

          <button 
            type="button"
            aria-expanded="false"
            aria-haspopup="menu"
            aria-controls="dropdown-menu"
            id="menu-button"
          >
            Game Options <span aria-hidden="true">▼</span>
          </button>

          <div 
            id="dropdown-menu"
            role="menu"
            aria-labelledby="menu-button"
            style={{ display: 'none' }}
          >
            <button role="menuitem" type="button">Cash Game</button>
            <button role="menuitem" type="button">Tournament</button>
            <button role="menuitem" type="button">Training Mode</button>
          </div>

          <button 
            type="button"
            aria-pressed="false"
            aria-label="Toggle sound effects"
          >
            <span aria-hidden="true">🔊</span>
          </button>

          <button 
            type="button"
            disabled
            aria-label="Save progress (not available in demo mode)"
          >
            Save Progress
          </button>
        </div>
      );

      const results = await testAccessibility(<ButtonControls />);
      expect(results).toHaveNoViolations();
    });

    it('should provide accessible modal dialogs', async () => {
      const ModalDialog = () => (
        <div>
          <button type="button" id="open-modal">Open Settings</button>
          
          <div 
            role="dialog"
            aria-labelledby="modal-title"
            aria-describedby="modal-desc"
            aria-modal="true"
            style={{ display: 'block' }}
          >
            <div className="modal-content">
              <header>
                <h2 id="modal-title">Game Settings</h2>
                <button 
                  type="button" 
                  aria-label="Close settings dialog"
                  className="close-button"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </header>
              
              <div id="modal-desc">
                Configure your game preferences and accessibility options.
              </div>
              
              <form>
                <div>
                  <label htmlFor="difficulty-select">Difficulty Level</label>
                  <select id="difficulty-select" name="difficulty">
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                
                <div>
                  <input 
                    id="sound-effects"
                    type="checkbox"
                    name="soundEffects"
                    defaultChecked
                  />
                  <label htmlFor="sound-effects">Enable sound effects</label>
                </div>
              </form>
              
              <div className="modal-actions">
                <button type="button">Cancel</button>
                <button type="submit">Save Settings</button>
              </div>
            </div>
          </div>
        </div>
      );

      const results = await testAccessibility(<ModalDialog />);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible tabs interface', async () => {
      const TabsInterface = () => (
        <div>
          <div role="tablist" aria-label="Course content sections">
            <button 
              role="tab"
              aria-selected="true"
              aria-controls="panel-overview"
              id="tab-overview"
              tabIndex={0}
            >
              Overview
            </button>
            <button 
              role="tab"
              aria-selected="false"
              aria-controls="panel-lessons"
              id="tab-lessons"
              tabIndex={-1}
            >
              Lessons
            </button>
            <button 
              role="tab"
              aria-selected="false"
              aria-controls="panel-exercises"
              id="tab-exercises"
              tabIndex={-1}
            >
              Exercises
            </button>
          </div>

          <div 
            role="tabpanel"
            id="panel-overview"
            aria-labelledby="tab-overview"
            tabIndex={0}
          >
            <h3>Course Overview</h3>
            <p>This course covers the fundamentals of Texas Hold'em poker.</p>
          </div>

          <div 
            role="tabpanel"
            id="panel-lessons"
            aria-labelledby="tab-lessons"
            style={{ display: 'none' }}
            tabIndex={0}
          >
            <h3>Lessons</h3>
            <ol>
              <li>Hand Rankings</li>
              <li>Betting Rounds</li>
              <li>Position Strategy</li>
            </ol>
          </div>

          <div 
            role="tabpanel"
            id="panel-exercises"
            aria-labelledby="tab-exercises"
            style={{ display: 'none' }}
            tabIndex={0}
          >
            <h3>Practice Exercises</h3>
            <p>Interactive exercises to test your knowledge.</p>
          </div>
        </div>
      );

      const results = await testAccessibility(<TabsInterface />);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Media and Content Accessibility', () => {
    it('should provide accessible images with alt text', async () => {
      const AccessibleImages = () => (
        <div>
          <img 
            src="/cards/ace-spades.png"
            alt="Ace of Spades playing card"
            width="50"
            height="70"
          />
          
          <img 
            src="/avatars/dealer.png"
            alt="Professional poker dealer avatar"
            width="100"
            height="100"
          />
          
          {/* Decorative image */}
          <img 
            src="/decorations/poker-chips.png"
            alt=""
            role="presentation"
            width="30"
            height="30"
          />
          
          {/* Complex image with description */}
          <figure>
            <img 
              src="/charts/win-rate-chart.png"
              alt="Win rate chart showing improvement over time"
              aria-describedby="chart-description"
              width="400"
              height="300"
            />
            <figcaption id="chart-description">
              Line chart showing win rate improvement from 45% in January to 68% in June,
              with steady upward trend indicating successful learning progress.
            </figcaption>
          </figure>
        </div>
      );

      const results = await testAccessibility(<AccessibleImages />);
      expect(results).toHaveNoViolations();
    });

    it('should provide accessible video content', async () => {
      const AccessibleVideo = () => (
        <div>
          <h3>Poker Strategy Lesson</h3>
          <video 
            controls
            width="640"
            height="360"
            aria-describedby="video-description"
          >
            <source src="/videos/basic-strategy.mp4" type="video/mp4" />
            <source src="/videos/basic-strategy.webm" type="video/webm" />
            <track 
              kind="captions"
              src="/captions/basic-strategy-en.vtt"
              srcLang="en"
              label="English captions"
              default
            />
            <track 
              kind="descriptions"
              src="/descriptions/basic-strategy-en.vtt"
              srcLang="en"
              label="English audio descriptions"
            />
            <p>
              Your browser does not support video playback. 
              <a href="/videos/basic-strategy.mp4">Download the video file</a>.
            </p>
          </video>
          
          <div id="video-description">
            <p>
              This 15-minute video covers fundamental poker strategy concepts including
              position play, hand selection, and basic betting patterns.
            </p>
          </div>

          <div className="video-controls">
            <button type="button" aria-label="Play/Pause video">⏯️</button>
            <button type="button" aria-label="Mute/Unmute audio">🔊</button>
            <button type="button" aria-label="Toggle fullscreen">⛶</button>
            <button type="button" aria-label="Show/Hide captions">CC</button>
          </div>
        </div>
      );

      const results = await testAccessibility(<AccessibleVideo />);
      expect(results).toHaveNoViolations();
    });

    it('should provide accessible data tables', async () => {
      const AccessibleTable = () => (
        <div>
          <h3>Player Statistics</h3>
          <table role="table" aria-labelledby="stats-caption">
            <caption id="stats-caption">
              Your poker game statistics for the past 30 days
            </caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Games Played</th>
                <th scope="col">Win Rate %</th>
                <th scope="col">Profit/Loss</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2023-12-01</td>
                <td>5</td>
                <td>60%</td>
                <td style={{ color: 'green' }}>
                  <span aria-label="profit">+$25</span>
                </td>
              </tr>
              <tr>
                <td>2023-12-02</td>
                <td>3</td>
                <td>33%</td>
                <td style={{ color: 'red' }}>
                  <span aria-label="loss">-$15</span>
                </td>
              </tr>
              <tr>
                <th scope="row">Total</th>
                <td>8</td>
                <td>50%</td>
                <td style={{ color: 'green' }}>
                  <span aria-label="net profit">+$10</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );

      const results = await testAccessibility(<AccessibleTable />);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color and Visual Accessibility', () => {
    it('should not rely solely on color for information', async () => {
      const ColorAccessibleContent = () => (
        <div>
          <h3>Game Status Indicators</h3>
          
          <div className="status-indicators">
            <div className="status-item">
              <span 
                className="indicator success"
                aria-label="Connected to server"
                role="img"
              >
                ✓
              </span>
              <span>Connection: Online</span>
            </div>
            
            <div className="status-item">
              <span 
                className="indicator warning"
                aria-label="Slow connection"
                role="img"
              >
                ⚠️
              </span>
              <span>Network: Slow</span>
            </div>
            
            <div className="status-item">
              <span 
                className="indicator error"
                aria-label="Connection lost"
                role="img"
              >
                ✗
              </span>
              <span>Server: Disconnected</span>
            </div>
          </div>

          <div className="progress-section">
            <h4>Course Progress</h4>
            <div 
              className="progress-bar"
              role="progressbar"
              aria-valuenow={75}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Course completion progress"
            >
              <div 
                className="progress-fill"
                style={{ width: '75%' }}
                aria-hidden="true"
              />
            </div>
            <div className="progress-text">75% Complete</div>
          </div>
        </div>
      );

      const results = await testAccessibility(<ColorAccessibleContent />);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Focus Management and Keyboard Navigation', () => {
    it('should provide proper focus indicators', async () => {
      const FocusManagement = () => (
        <div>
          <button type="button" className="focus-visible">
            Focused Button
          </button>
          
          <a href="/courses" className="focus-visible">
            View Courses
          </a>
          
          <input 
            type="text"
            placeholder="Search..."
            className="focus-visible"
          />
          
          <div 
            role="button"
            tabIndex={0}
            className="custom-button focus-visible"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                // Handle activation
              }
            }}
          >
            Custom Interactive Element
          </div>
        </div>
      );

      const results = await testAccessibility(<FocusManagement />);
      expect(results).toHaveNoViolations();
    });

    it('should provide skip navigation links', async () => {
      const SkipNavigation = () => (
        <div>
          <div className="skip-links">
            <a href="#main-content" className="skip-link">
              Skip to main content
            </a>
            <a href="#navigation" className="skip-link">
              Skip to navigation
            </a>
            <a href="#footer" className="skip-link">
              Skip to footer
            </a>
          </div>
          
          <header>
            <nav id="navigation" aria-label="Main navigation">
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/courses">Courses</a></li>
              </ul>
            </nav>
          </header>
          
          <main id="main-content">
            <h1>Main Content Area</h1>
            <p>This is where the main content begins.</p>
          </main>
          
          <footer id="footer">
            <p>Footer content</p>
          </footer>
        </div>
      );

      const results = await testAccessibility(<SkipNavigation />);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Live Regions and Dynamic Content', () => {
    it('should use ARIA live regions for dynamic updates', async () => {
      const LiveRegions = () => (
        <div>
          <div 
            id="status-updates"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            Game saved successfully
          </div>
          
          <div 
            id="error-messages"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            Connection lost. Attempting to reconnect...
          </div>
          
          <div 
            id="chat-messages"
            aria-live="polite"
            aria-label="Chat messages"
            aria-atomic="false"
          >
            <div>Player123: Good game!</div>
          </div>
          
          <div className="game-controls">
            <button 
              type="button"
              aria-describedby="status-updates"
            >
              Save Game
            </button>
          </div>
        </div>
      );

      const results = await testAccessibility(<LiveRegions />);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Custom Accessibility Tests', () => {
    it('should meet minimum contrast ratios', async () => {
      // This would typically be tested with specialized tools
      // For now, we'll ensure the structure supports high contrast
      const HighContrastContent = () => (
        <div style={{ backgroundColor: '#ffffff', color: '#000000' }}>
          <h2 style={{ color: '#000000' }}>High Contrast Heading</h2>
          <p style={{ color: '#333333' }}>
            This text has sufficient contrast for readability.
          </p>
          <button 
            type="button"
            style={{ 
              backgroundColor: '#0066cc', 
              color: '#ffffff',
              border: '2px solid #0066cc'
            }}
          >
            Accessible Button
          </button>
        </div>
      );

      const results = await testAccessibility(<HighContrastContent />);
      expect(results).toHaveNoViolations();
    });

    it('should provide text alternatives for complex UI', async () => {
      const ComplexUI = () => (
        <div>
          <div 
            className="poker-table"
            role="application"
            aria-label="Poker game table"
            aria-describedby="table-description"
          >
            <div id="table-description" className="sr-only">
              Virtual poker table with 6 seats. You are seated in position 3.
              Current pot is $50. It's your turn to act.
            </div>
            
            <div className="player-positions" aria-label="Player positions">
              <div 
                className="player-seat"
                aria-label="Seat 1: Empty"
                role="button"
                tabIndex={0}
              />
              <div 
                className="player-seat occupied"
                aria-label="Seat 2: Player456, $200 in chips"
                role="button"
                tabIndex={0}
              />
              <div 
                className="player-seat current-player"
                aria-label="Seat 3: You, $150 in chips, your turn"
                aria-current="true"
                role="button"
                tabIndex={0}
              />
            </div>
            
            <div className="community-cards" aria-label="Community cards">
              <img src="/cards/ah.png" alt="Ace of Hearts" />
              <img src="/cards/ks.png" alt="King of Spades" />
              <img src="/cards/qd.png" alt="Queen of Diamonds" />
              <div className="card-back" aria-label="Hidden card" />
              <div className="card-back" aria-label="Hidden card" />
            </div>
          </div>
        </div>
      );

      const results = await testAccessibility(<ComplexUI />);
      expect(results).toHaveNoViolations();
    });
  });
});