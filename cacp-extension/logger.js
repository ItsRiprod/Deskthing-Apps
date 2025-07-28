/**
 * CACP Logger System
 * 
 * Pino-powered structured logging for Chrome extensions.
 * Supports scoped loggers, JSON pretty-printing, and granular level control.
 */

import pino from 'pino';
import { loggerConfig } from './logger-config.js';

/**
 * Global log store for popup display
 */
const logStore = {
  entries: [],
  maxEntries: 1000,
  
  add(entry) {
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
    
    // Notify popup if it's listening
    if (window.cacpLoggerUpdate) {
      window.cacpLoggerUpdate(entry);
    }
  },
  
  get(filter = {}) {
    return this.entries.filter(entry => {
      if (filter.scope && entry.scope !== filter.scope) return false;
      if (filter.level && entry.level !== filter.level) return false;
      if (filter.since && entry.timestamp < filter.since) return false;
      return true;
    });
  },
  
  clear() {
    this.entries = [];
  }
};

/**
 * Utility functions
 */
function formatTimestamp() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

function formatValue(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  
  // Pretty-print objects and arrays
  try {
    return JSON.stringify(value, null, 2);
  } catch (e) {
    return String(value);
  }
}

function shouldLog(scopeName, level) {
  // Check global enabled
  if (!loggerConfig.global.enabled) return false;
  
  // Check scope exists and is enabled
  const scope = loggerConfig.scopes[scopeName];
  if (!scope || !scope.enabled) return false;
  
  // Check level is enabled for this scope
  return scope.levels[level] === true;
}

/**
 * Core logger class powered by Pino
 */
class ScopedLogger {
  constructor(scopeName) {
    this.scopeName = scopeName;
    this.scope = loggerConfig.scopes[scopeName];
    
    if (!this.scope) {
      console.warn(`Logger scope '${scopeName}' not found in configuration`);
      this.scope = {
        enabled: true,
        prefix: `[${scopeName}]`,
        color: '#999999',
        levels: { debug: true, info: true, warn: true, error: true, trace: false }
      };
    }

    // Create Pino logger instance with browser configuration
    this.pinoLogger = pino({
      name: scopeName,
      level: this._getLowestEnabledLevel(),
      browser: {
        asObject: true,
        formatters: {
          level(label, number) {
            return { level: label };
          },
          log(object) {
            // Add our scope prefix and color info
            return {
              ...object,
              scope: scopeName,
              prefix: this.scope.prefix,
              color: this.scope.color
            };
          }
        },
        serialize: true,
        write: {
          // Custom write function to integrate with our log store and console formatting
          write: (obj) => this._handlePinoOutput(obj)
        }
      }
    });
  }

  _getLowestEnabledLevel() {
    const levels = ['trace', 'debug', 'info', 'warn', 'error'];
    for (const level of levels) {
      if (this.scope.levels[level]) {
        return level;
      }
    }
    return 'info'; // fallback
  }

  _handlePinoOutput(logObj) {
    if (!shouldLog(this.scopeName, logObj.level)) return;

    const timestamp = formatTimestamp();
    const prefix = this.scope.prefix;
    const color = loggerConfig.global.useColors ? this.scope.color : null;

    // Create log entry for storage
    const logEntry = {
      timestamp: logObj.time || Date.now(),
      timestampFormatted: timestamp,
      scope: this.scopeName,
      level: logObj.level,
      message: logObj.msg || '',
      data: logObj.data || null,
      prefix,
      pinoObj: logObj // Store original Pino object
    };

    // Store in log store
    logStore.add(logEntry);

    // Console output with color formatting
    const consoleMethod = logObj.level === 'error' ? 'error' : 
                         logObj.level === 'warn' ? 'warn' : 
                         logObj.level === 'debug' ? 'debug' : 'log';

    if (color && loggerConfig.global.useColors) {
      if (logObj.data !== undefined) {
        console[consoleMethod](
          `%c${timestamp} ${prefix}%c ${logObj.msg}`,
          `color: ${color}; font-weight: bold`,
          'color: inherit',
          logObj.data
        );
      } else {
        console[consoleMethod](
          `%c${timestamp} ${prefix}%c ${logObj.msg}`,
          `color: ${color}; font-weight: bold`,
          'color: inherit'
        );
      }
    } else {
      if (logObj.data !== undefined) {
        console[consoleMethod](`${timestamp} ${prefix} ${logObj.msg}`, logObj.data);
      } else {
        console[consoleMethod](`${timestamp} ${prefix} ${logObj.msg}`);
      }
    }
  }

  _shouldLogLevel(level) {
    return shouldLog(this.scopeName, level);
  }

  // Log level methods - delegate to Pino
  trace(message, data) { 
    if (this._shouldLogLevel('trace')) {
      this.pinoLogger.trace({ data }, message); 
    }
  }
  
  debug(message, data) { 
    if (this._shouldLogLevel('debug')) {
      this.pinoLogger.debug({ data }, message); 
    }
  }
  
  info(message, data) { 
    if (this._shouldLogLevel('info')) {
      this.pinoLogger.info({ data }, message); 
    }
  }
  
  warn(message, data) { 
    if (this._shouldLogLevel('warn')) {
      this.pinoLogger.warn({ data }, message); 
    }
  }
  
  error(message, data) { 
    if (this._shouldLogLevel('error')) {
      this.pinoLogger.error({ data }, message); 
    }
  }

  // Structured logging with context (Pino child loggers)
  child(context) {
    return new ChildLogger(this, context);
  }

  // JSON pretty-printing (Pino's structured data support)
  debugObject(message, obj) {
    this.debug(message, obj);
  }

  infoObject(message, obj) {
    this.info(message, obj);
  }

  // Timer utilities
  time(label) {
    this._timers = this._timers || {};
    this._timers[label] = Date.now();
    this.debug(`Timer started: ${label}`);
  }

  timeEnd(label) {
    this._timers = this._timers || {};
    if (this._timers[label]) {
      const duration = Date.now() - this._timers[label];
      this.debug(`Timer ${label}: ${duration}ms`);
      delete this._timers[label];
      return duration;
    } else {
      this.warn(`Timer '${label}' not found`);
      return null;
    }
  }

  // Performance helpers
  mark(label) {
    if (performance && performance.mark) {
      performance.mark(label);
    }
    this.trace(`Performance mark: ${label}`);
  }

  measure(name, startMark, endMark) {
    if (performance && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        this.debug(`Performance measure ${name}: ${measure.duration.toFixed(2)}ms`);
        return measure.duration;
      } catch (e) {
        this.warn(`Performance measure failed: ${e.message}`);
        return null;
      }
    }
    return null;
  }
}

/**
 * Child logger with additional context using Pino child loggers
 */
class ChildLogger {
  constructor(parent, context) {
    this.parent = parent;
    this.scopeName = parent.scopeName;
    this.scope = parent.scope;
    this.context = context;
    
    // Create a Pino child logger with the context
    this.pinoLogger = parent.pinoLogger.child(context);
  }

  _shouldLogLevel(level) {
    return shouldLog(this.scopeName, level);
  }

  // Log level methods - delegate to Pino child
  trace(message, data) { 
    if (this._shouldLogLevel('trace')) {
      this.pinoLogger.trace({ data }, message); 
    }
  }
  
  debug(message, data) { 
    if (this._shouldLogLevel('debug')) {
      this.pinoLogger.debug({ data }, message); 
    }
  }
  
  info(message, data) { 
    if (this._shouldLogLevel('info')) {
      this.pinoLogger.info({ data }, message); 
    }
  }
  
  warn(message, data) { 
    if (this._shouldLogLevel('warn')) {
      this.pinoLogger.warn({ data }, message); 
    }
  }
  
  error(message, data) { 
    if (this._shouldLogLevel('error')) {
      this.pinoLogger.error({ data }, message); 
    }
  }

  // Structured logging
  debugObject(message, obj) {
    this.debug(message, obj);
  }

  infoObject(message, obj) {
    this.info(message, obj);
  }

  // Child of child
  child(additionalContext) {
    return new ChildLogger(this.parent, { ...this.context, ...additionalContext });
  }

  // Timer utilities
  time(label) {
    this.parent.time(`${JSON.stringify(this.context)}.${label}`);
  }

  timeEnd(label) {
    return this.parent.timeEnd(`${JSON.stringify(this.context)}.${label}`);
  }

  // Performance helpers
  mark(label) {
    this.parent.mark(`${JSON.stringify(this.context)}.${label}`);
  }

  measure(name, startMark, endMark) {
    return this.parent.measure(name, startMark, endMark);
  }
}

/**
 * Logger factory
 */
const loggers = new Map();

export function createLogger(scopeName) {
  if (!loggers.has(scopeName)) {
    loggers.set(scopeName, new ScopedLogger(scopeName));
  }
  return loggers.get(scopeName);
}

/**
 * Utilities for accessing log data
 */
export const logs = {
  get: (filter) => logStore.get(filter),
  clear: () => logStore.clear(),
  store: logStore,
  onUpdate: (callback) => {
    window.cacpLoggerUpdate = callback;
  }
};

/**
 * Quick logger instances for common components
 */
export const logger = {
  soundcloud: createLogger('soundcloud'),
  youtube: createLogger('youtube'),
  siteDetector: createLogger('site-detector'),
  priorityManager: createLogger('priority-manager'),
  websocketManager: createLogger('websocket-manager'),
  cacp: createLogger('cacp'),
  popup: createLogger('popup')
};

// Make logger available globally for debugging
window.cacpLogger = {
  ...window.cacpLogger,
  createLogger,
  logger,
  logs,
  logStore
}; 