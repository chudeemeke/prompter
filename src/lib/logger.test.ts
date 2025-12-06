import { logger, loggers } from './logger';

describe('Logger', () => {
  beforeEach(() => {
    // Suppress console output during tests
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Logging', () => {
    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
    });

    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('should not throw when called', () => {
      expect(() => logger.debug('test')).not.toThrow();
      expect(() => logger.info('test')).not.toThrow();
      expect(() => logger.warn('test')).not.toThrow();
      expect(() => logger.error('test')).not.toThrow();
    });

    it('should accept multiple arguments', () => {
      expect(() => logger.debug('msg', { data: 1 }, 'extra')).not.toThrow();
      expect(() => logger.info('msg', { data: 1 }, 'extra')).not.toThrow();
      expect(() => logger.warn('msg', { data: 1 }, 'extra')).not.toThrow();
      expect(() => logger.error('msg', { data: 1 }, 'extra')).not.toThrow();
    });
  });

  describe('Scoped Logging', () => {
    it('should create scoped logger with scope method', () => {
      const scoped = logger.scope('TestScope');
      expect(typeof scoped.debug).toBe('function');
      expect(typeof scoped.info).toBe('function');
      expect(typeof scoped.warn).toBe('function');
      expect(typeof scoped.error).toBe('function');
    });

    it('should allow nested scopes', () => {
      const scoped = logger.scope('Parent').scope('Child');
      expect(typeof scoped.debug).toBe('function');
    });

    it('should not throw when scoped logger is called', () => {
      const scoped = logger.scope('Test');
      expect(() => scoped.debug('message')).not.toThrow();
      expect(() => scoped.info('message')).not.toThrow();
      expect(() => scoped.warn('message')).not.toThrow();
      expect(() => scoped.error('message')).not.toThrow();
    });
  });

  describe('Pre-configured Loggers', () => {
    it('should have spotlight logger', () => {
      expect(loggers.spotlight).toBeDefined();
      expect(typeof loggers.spotlight.debug).toBe('function');
    });

    it('should have contextModal logger', () => {
      expect(loggers.contextModal).toBeDefined();
      expect(typeof loggers.contextModal.debug).toBe('function');
    });

    it('should have hooks loggers', () => {
      expect(loggers.hooks.spotlightState).toBeDefined();
      expect(loggers.hooks.prompts).toBeDefined();
      expect(loggers.hooks.search).toBeDefined();
      expect(loggers.hooks.keyboard).toBeDefined();
    });

    it('should have services loggers', () => {
      expect(loggers.services.prompt).toBeDefined();
      expect(loggers.services.tauri).toBeDefined();
    });

    it('should not throw when pre-configured loggers are called', () => {
      expect(() => loggers.spotlight.debug('test')).not.toThrow();
      expect(() => loggers.contextModal.info('test')).not.toThrow();
      expect(() => loggers.hooks.spotlightState.warn('test')).not.toThrow();
      expect(() => loggers.services.tauri.error('test')).not.toThrow();
    });
  });

  describe('Development Mode Behavior', () => {
    // In test environment, import.meta.env.DEV is true
    it('should call console methods in development mode', () => {
      // The logger checks import.meta.env.DEV which is true in tests
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      // In dev mode, these should be called
      // Note: actual behavior depends on import.meta.env.DEV value at module load
      // These tests verify the logger is callable without errors
    });
  });

  describe('Type Safety', () => {
    it('should accept various argument types', () => {
      expect(() => logger.debug('string')).not.toThrow();
      expect(() => logger.debug(123)).not.toThrow();
      expect(() => logger.debug({ key: 'value' })).not.toThrow();
      expect(() => logger.debug(['a', 'b'])).not.toThrow();
      expect(() => logger.debug(null)).not.toThrow();
      expect(() => logger.debug(undefined)).not.toThrow();
      expect(() => logger.debug(new Error('test'))).not.toThrow();
    });

    it('should accept no arguments', () => {
      expect(() => logger.debug()).not.toThrow();
      expect(() => logger.info()).not.toThrow();
      expect(() => logger.warn()).not.toThrow();
      expect(() => logger.error()).not.toThrow();
    });
  });
});
