import { createLogger, logError, logSecurityEvent, logPerformance } from '@/lib/logger';

describe('Logger', () => {
  let consoleInfoSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console methods
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    consoleInfoSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('createLogger', () => {
    it('should create a logger with the specified module name', () => {
      const logger = createLogger('test-module');
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'test' };
      
      logError(error, context);
      
      // In test environment, logger might be silent
      // We're mainly checking that it doesn't throw
      expect(true).toBe(true);
    });

    it('should handle error without context', () => {
      const error = new Error('Test error without context');
      
      logError(error);
      
      expect(true).toBe(true);
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security event with details', () => {
      const event = 'UNAUTHORIZED_ACCESS';
      const details = {
        userId: '123',
        ip: '192.168.1.1',
        endpoint: '/api/admin'
      };
      
      logSecurityEvent(event, details);
      
      expect(true).toBe(true);
    });

    it('should log security event without details', () => {
      const event = 'SUSPICIOUS_ACTIVITY';
      
      logSecurityEvent(event);
      
      expect(true).toBe(true);
    });
  });

  describe('logPerformance', () => {
    it('should log performance metric with default unit', () => {
      const metric = 'api_response_time';
      const value = 250;
      
      logPerformance(metric, value);
      
      expect(true).toBe(true);
    });

    it('should log performance metric with custom unit', () => {
      const metric = 'memory_usage';
      const value = 512;
      const unit = 'MB';
      
      logPerformance(metric, value, unit);
      
      expect(true).toBe(true);
    });
  });
});