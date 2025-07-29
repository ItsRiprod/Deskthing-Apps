/**
 * Smart Adaptive Pino Logger Configuration
 * Auto-detects environment and uses optimal formatter while maintaining consistent appearance
 */

import pino from 'pino';

// Shared emoji and color scheme for consistent appearance
const COMPONENT_SCHEME = {
  'cacp': { emoji: '🎯', color: '#4A90E2', name: 'CACP-Core' },
  'soundcloud': { emoji: '🎵', color: '#FF5500', name: 'SoundCloud' },
  'youtube': { emoji: '📹', color: '#FF0000', name: 'YouTube' },
  'site-detector': { emoji: '🔍', color: '#00C896', name: 'SiteDetector' },
  'websocket': { emoji: '🌐', color: '#9B59B6', name: 'WebSocket' },
  'popup': { emoji: '🎛️', color: '#FF6B6B', name: 'Popup' },
  'background': { emoji: '🔧', color: '#4ECDC4', name: 'Background' },
  'priority-manager': { emoji: '⚖️', color: '#45B7D1', name: 'PriorityManager' },
  'settings': { emoji: '⚙️', color: '#96CEB4', name: 'Settings' },
  'test': { emoji: '🧪', color: '#FFEAA7', name: 'Test' }
};

const LEVEL_SCHEME = {
  10: { emoji: '🔍', color: '#6C7B7F', name: 'TRACE' },
  20: { emoji: '🐛', color: '#74B9FF', name: 'DEBUG' },
  30: { emoji: '✨', color: '#00B894', name: 'INFO' },
  40: { emoji: '⚠️', color: '#FDCB6E', name: 'WARN' },
  50: { emoji: '🚨', color: '#E17055', name: 'ERROR' },
  60: { emoji: '💀', color: '#D63031', name: 'FATAL' }
};

/**
 * Environment detection
 */
const isBrowser = () => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

const isCLI = () => {
  return typeof process !== 'undefined' && process.stdout && process.stdout.isTTY;
};

/**
 * Browser formatter that mimics pino-colada output
 */
const createBrowserFormatter = (componentName) => {
  const component = COMPONENT_SCHEME[componentName] || COMPONENT_SCHEME['cacp'];
  
  return {
    write: (data) => {
      try {
        const logData = typeof data === 'string' ? JSON.parse(data) : data;
        const level = LEVEL_SCHEME[logData.level] || LEVEL_SCHEME[30];
        const timestamp = new Date(logData.time).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3
        });
        
        // Format like: "15:31:42 ✨ [SOUNDCLOUD] Site detection complete"
        const message = logData.msg || '';
        const componentName = component.name.toUpperCase().replace(/([a-z])([A-Z])/g, '$1-$2');
        
        // Use browser console styling to match the new bracket format
        console.log(
          `%c${timestamp} %c${level.emoji} %c[${componentName}] %c${message}`,
          'color: #888; font-family: monospace;',                    // timestamp
          `color: ${level.color}; font-size: 14px;`,                 // level emoji  
          `color: ${component.color}; font-weight: bold;`,           // [COMPONENT-NAME]
          'color: inherit;'                                          // message
        );

        // Extract and display additional context data (the missing JSON payloads!)
        const excludeKeys = new Set(['level', 'time', 'msg', 'name', 'pid', 'hostname', 'v']);
        const contextData = {};
        
        Object.keys(logData).forEach(key => {
          if (!excludeKeys.has(key)) {
            contextData[key] = logData[key];
          }
        });

        // Show context data if present
        if (Object.keys(contextData).length > 0) {
          // Format context data with tree-like structure
          Object.entries(contextData).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              console.log(`   ├─ %c${key}:`, 'color: #00C896; font-weight: bold;', value);
            } else {
              console.log(`   ├─ %c${key}: %c${value}`, 'color: #00C896; font-weight: bold;', 'color: inherit;');
            }
          });
        }
        
        // Show error stack trace if present
        if (logData.err && logData.err.stack) {
          console.error('   ╰─ Error Stack:');
          console.error(logData.err.stack);
        }
        
      } catch (error) {
        // Fallback for malformed data
        console.log(data);
      }
    }
  };
};

/**
 * CLI formatter using pino-colada (when available)
 */
const createCLIFormatter = () => {
  try {
    // Try to use pino-colada if available
    const pinoColada = require('pino-colada');
    return pinoColada();
  } catch (error) {
    // Fallback to pino-pretty if pino-colada not available
    try {
      const pinoPretty = require('pino-pretty');
      return pinoPretty({
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        messageFormat: (log, messageKey, levelLabel) => {
          const component = COMPONENT_SCHEME[log.name] || COMPONENT_SCHEME['cacp'];
          const componentName = component.name.toUpperCase().replace(/([a-z])([A-Z])/g, '$1-$2');
          const level = LEVEL_SCHEME[log.level] || LEVEL_SCHEME[30];
          return `${level.emoji} [${componentName}] ${log[messageKey]}`;
        },
        customPrettifiers: {
          level: () => '', // Hide level since we show it in messageFormat
          time: (timestamp) => timestamp,
          name: () => '' // Hide name since we show it in messageFormat
        }
      });
    } catch (error) {
      // Ultimate fallback - basic JSON
      return {
        write: (data) => console.log(data)
      };
    }
  }
};

/**
 * Create environment-appropriate logger
 */
const createLogger = (componentName) => {
  const component = COMPONENT_SCHEME[componentName] || COMPONENT_SCHEME['cacp'];
  
  let stream;
  let config = {
    name: componentName,
    level: 'trace'
  };

  if (isBrowser()) {
    // Browser environment - use custom formatter
    stream = createBrowserFormatter(componentName);
    config.browser = {
      write: stream.write,
      asObject: false
    };
  } else if (isCLI()) {
    // CLI environment - use pino-colada or pino-pretty
    stream = createCLIFormatter();
    config.prettyPrint = true;
  } else {
    // Server/production environment - structured JSON
    config.level = 'info';
  }

  const logger = stream ? pino(config, stream) : pino(config);
  
  // Add environment info for debugging
  logger.trace(`${component.emoji} Logger initialized`, {
    component: componentName,
    environment: isBrowser() ? 'browser' : isCLI() ? 'cli' : 'server',
    formatter: isBrowser() ? 'custom-browser' : isCLI() ? 'pino-colada' : 'json'
  });
  
  return logger;
};

/**
 * Enhanced loggers with environment detection
 */
const enhancedLoggers = {};

// Create loggers for each component
Object.keys(COMPONENT_SCHEME).forEach(componentName => {
  enhancedLoggers[componentName] = createLogger(componentName);
});

// Legacy compatibility
enhancedLoggers.siteDetector = enhancedLoggers['site-detector'];
enhancedLoggers.priorityManager = enhancedLoggers['priority-manager'];

// Helper to create new loggers on demand
enhancedLoggers.createLogger = (componentName) => {
  if (!enhancedLoggers[componentName]) {
    enhancedLoggers[componentName] = createLogger(componentName);
  }
  return enhancedLoggers[componentName];
};

// Export configuration info
enhancedLoggers.config = {
  environment: isBrowser() ? 'browser' : isCLI() ? 'cli' : 'server',
  components: COMPONENT_SCHEME,
  levels: LEVEL_SCHEME
};

export default enhancedLoggers; 