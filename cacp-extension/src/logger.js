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
 * Browser-compatible Pino transport that integrates with our log store
 */
function createBrowserTransport(scopeName) {
  return {
    write: (obj) => {
      const scope = loggerConfig.scopes[scopeName];
      if (!scope || !scope.enabled) return;
      
      // Check if this level is enabled
      if (!scope.levels[obj.level]) return;
      
      // Create formatted entry for console and storage
      const timestamp = new Date().toLocaleTimeString();
      const prefix = scope.prefix;
      const color = loggerConfig.global.useColors ? scope.color : null;
      
      // Store entry
      const logEntry = {
        timestamp: obj.time || Date.now(),
        timestampFormatted: timestamp,
        scope: scopeName,
        level: obj.level,
        message: obj.msg,
        data: obj.data || {},
        prefix,
        color
      };
      
      logStore.add(logEntry);
      
      // Console output with styling
      const consoleFn = console[obj.level] || console.log;
      if (color && loggerConfig.global.useColors) {
        consoleFn(`%c${prefix}%c [${obj.level.toUpperCase()}] ${obj.msg}`, 
          `color: ${color}; font-weight: bold`, 
          'color: inherit',
          ...(obj.data ? [obj.data] : [])
        );
      } else {
        consoleFn(`${prefix} [${obj.level.toUpperCase()}] ${obj.msg}`, 
          ...(obj.data ? [obj.data] : [])
        );
      }
    }
  };
}

/**
 * Create a properly configured Pino logger for browser environment
 */
function createPinoLogger(scopeName) {
  const scope = loggerConfig.scopes[scopeName];
  if (!scope) {
    console.warn(`Logger scope '${scopeName}' not found in configuration`);
    return pino({ level: 'info' });
  }
  
  // Determine the lowest enabled level
  const levels = ['trace', 'debug', 'info', 'warn', 'error'];
  const lowestLevel = levels.find(level => scope.levels[level]) || 'info';
  
  return pino({
    name: scopeName,
    level: lowestLevel,
    browser: {
      asObject: true,
      serialize: true,
      formatters: {
        level(label) {
          return { level: label };
        }
      },
      write: createBrowserTransport(scopeName)
    }
  });
}

/**
 * Core scoped logger wrapper
 */
class ScopedLogger {
  constructor(scopeName) {
    this.scopeName = scopeName;
    this.scope = loggerConfig.scopes[scopeName];
    this.pino = createPinoLogger(scopeName);
  }

  // Pino-compatible methods
  trace(obj, msg, ...args) {
    if (typeof obj === 'string') {
      this.pino.trace(obj);
    } else {
      this.pino.trace(obj, msg, ...args);
    }
  }

  debug(obj, msg, ...args) {
    if (typeof obj === 'string') {
      this.pino.debug(obj);
    } else {
      this.pino.debug(obj, msg, ...args);
    }
  }

  info(obj, msg, ...args) {
    if (typeof obj === 'string') {
      this.pino.info(obj);
    } else {
      this.pino.info(obj, msg, ...args);
    }
  }

  warn(obj, msg, ...args) {
    if (typeof obj === 'string') {
      this.pino.warn(obj);
    } else {
      this.pino.warn(obj, msg, ...args);
    }
  }

  error(obj, msg, ...args) {
    if (typeof obj === 'string') {
      this.pino.error(obj);
    } else {
      this.pino.error(obj, msg, ...args);
    }
  }

  // Convenience method for structured object logging
  debugObject(label, obj) {
    this.debug({ data: obj }, label);
  }

  // Create child logger
  child(bindings) {
    return this.pino.child(bindings);
  }
}

/**
 * Child logger for adding context
 */
class ChildLogger {
  constructor(parent, bindings) {
    this.parent = parent;
    this.bindings = bindings;
    this.pino = parent.pino.child(bindings);
  }

  trace(obj, msg, ...args) { 
    return this.pino.trace(obj, msg, ...args); 
  }
  debug(obj, msg, ...args) { 
    return this.pino.debug(obj, msg, ...args); 
  }
  info(obj, msg, ...args) { 
    return this.pino.info(obj, msg, ...args); 
  }
  warn(obj, msg, ...args) { 
    return this.pino.warn(obj, msg, ...args); 
  }
  error(obj, msg, ...args) { 
    return this.pino.error(obj, msg, ...args); 
  }

  child(additionalBindings) {
    return new ChildLogger(this.parent, { ...this.bindings, ...additionalBindings });
  }
}

/**
 * Logger factory
 */
function createLogger(scopeName) {
  return new ScopedLogger(scopeName);
}

/**
 * Scoped loggers for different components
 */
const logger = {
  soundcloud: createLogger('soundcloud'),
  youtube: createLogger('youtube'),
  siteDetector: createLogger('site-detector'),
  priorityManager: createLogger('priority-manager'),
  websocketManager: createLogger('websocket-manager'),
  cacp: createLogger('cacp'),
  popup: createLogger('popup'),
  
  // Utility functions
  createLogger,
  logStore,
  
  // Global config access
  getConfig() {
    return loggerConfig;
  },
  
  updateConfig(newConfig) {
    Object.assign(loggerConfig, newConfig);
  }
};

// Export for ES modules
export default logger;
export { createLogger, logStore }; 