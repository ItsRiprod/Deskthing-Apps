/**
 * CACP Enhanced Logger with pino-colada
 * 
 * Provides beautiful emoji-based console output for browser debugging.
 * Uses pino-colada for stunning visual logs during development.
 */

import pino from 'pino';
import enhancedLoggers from './logger-config.js';

// Export the enhanced loggers directly
export default enhancedLoggers;

// Legacy compatibility - provide the individual loggers
export const {
  cacp,
  soundcloud, 
  youtube,
  siteDetector,
  websocket,
  popup,
  background,
  priorityManager,
  settings,
  test,
  createLogger,
  config,
  levels
} = enhancedLoggers; 