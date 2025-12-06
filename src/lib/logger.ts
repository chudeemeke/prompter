/**
 * Production-safe logger utility.
 * Logs are only output in development mode.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.debug('Message', data);
 *   logger.info('Message', data);
 *   logger.warn('Message', data);
 *   logger.error('Message', data);
 */

const isDev = import.meta.env.DEV;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  /** Create a scoped logger with a prefix */
  scope: (prefix: string) => Logger;
}

/**
 * No-op function for production
 */
const noop = (): void => {
  // Intentionally empty for production
};

/**
 * Create a log function for a specific level
 */
const createLogFn = (level: LogLevel, prefix?: string) => {
  if (!isDev) return noop;

  const consoleFn = console[level];
  return (...args: unknown[]) => {
    if (prefix) {
      consoleFn(`[${prefix}]`, ...args);
    } else {
      consoleFn(...args);
    }
  };
};

/**
 * Create a logger instance, optionally with a prefix scope
 */
const createLogger = (prefix?: string): Logger => ({
  debug: createLogFn('debug', prefix),
  info: createLogFn('info', prefix),
  warn: createLogFn('warn', prefix),
  error: createLogFn('error', prefix),
  scope: (newPrefix: string) =>
    createLogger(prefix ? `${prefix}:${newPrefix}` : newPrefix),
});

/**
 * Main logger instance
 *
 * @example
 * // Basic usage
 * logger.debug('Debug message');
 * logger.info('Info message', { data: 'value' });
 * logger.warn('Warning message');
 * logger.error('Error message', error);
 *
 * // Scoped usage
 * const hookLogger = logger.scope('useSpotlightState');
 * hookLogger.debug('Selection changed');
 */
export const logger = createLogger();

/**
 * Pre-configured scoped loggers for common modules
 */
export const loggers = {
  spotlight: logger.scope('SpotlightWindow'),
  contextModal: logger.scope('ContextModal'),
  hooks: {
    spotlightState: logger.scope('useSpotlightState'),
    prompts: logger.scope('usePrompts'),
    search: logger.scope('useSearch'),
    keyboard: logger.scope('useKeyboard'),
    updater: logger.scope('useUpdater'),
  },
  services: {
    prompt: logger.scope('PromptService'),
    tauri: logger.scope('TauriPromptService'),
  },
};
