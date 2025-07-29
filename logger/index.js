/**
 * CACP Portable Logger System
 * Main entry point for the smart adaptive logging system
 */

import pino from 'pino';
import { configManager } from './config/config-manager.js';
import { COMPONENT_SCHEME } from './config/component-schemes.js';
import { isBrowser, isCLI, getEnvironment } from './utils/environment-detector.js';
import { createBrowserFormatter } from './formatters/browser-formatter.js';
import { createCLIFormatter } from './formatters/cli-formatter.js';
import { createServerFormatter, getServerConfig } from './formatters/server-formatter.js';
import { LogStore } from './stores/log-store.js';

/**
 * Main Logger Class
 * Manages logger instances and provides the public API
 */
class CACPLogger {
  constructor() {
    this.loggers = {};
    this.logStore = new LogStore();
    this.environment = getEnvironment();
    this.initialized = false;
  }

  /**
   * Initialize the logger system
   * @param {Object} options - Initialization options
   * @returns {Promise<Object>} Logger instance with all components
   */
  async init(options = {}) {
    try {
      // Load configuration
      if (options.configPath || options.config) {
        await configManager.loadConfig(options.configPath || options.config);
      }

      // Create loggers for all available components
      const components = configManager.getAvailableComponents();
      
      components.forEach(componentName => {
        this.loggers[componentName] = this.createLogger(componentName);
      });

      // Create legacy compatibility aliases
      this.createAliases();

      // Add utility methods
      this.addUtilityMethods();

      this.initialized = true;

      // Log initialization success
      if (this.loggers.cacp) {
        this.loggers.cacp.info('CACP Logger initialized', {
          environment: this.environment,
          components: components.length,
          projectName: configManager.getProjectName(),
          configPaths: configManager.loadedPaths
        });
      }

      return this.getLoggerExports();
    } catch (error) {
      console.error('CACP Logger initialization failed:', error);
      // Return minimal fallback logger
      return this.createFallbackLogger();
    }
  }

  /**
   * Initialize synchronously with default configuration
   * @returns {Object} Logger instance with all components
   */
  initSync() {
    try {
      // Create loggers for all available components using default config
      const components = configManager.getAvailableComponents();
      
      components.forEach(componentName => {
        this.loggers[componentName] = this.createLogger(componentName);
      });

      // Create legacy compatibility aliases
      this.createAliases();

      // Add utility methods
      this.addUtilityMethods();

      this.initialized = true;

      // Log initialization success
      if (this.loggers.cacp) {
        this.loggers.cacp.info('CACP Logger initialized (sync)', {
          environment: this.environment,
          components: components.length,
          projectName: configManager.getProjectName()
        });
      }

      return this.getLoggerExports();
    } catch (error) {
      console.error('CACP Logger sync initialization failed:', error);
      // Return minimal fallback logger
      return this.createFallbackLogger();
    }
  }

  /**
   * Create a logger for a specific component
   * @param {string} componentName - Component identifier
   * @returns {Object} Pino logger instance
   */
  createLogger(componentName) {
    const component = configManager.getComponentConfig(componentName);
    
    let stream;
    let config = {
      name: componentName,
      level: configManager.getGlobalLevel()
    };

    if (isBrowser()) {
      // Browser environment - use custom formatter with log store
      stream = createBrowserFormatter(componentName, this.logStore);
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
      stream = createServerFormatter();
      config = { ...config, ...getServerConfig() };
    }

    const logger = stream ? pino(config, stream) : pino(config);
    
    // Add component emoji to logger for easy identification
    logger._componentEmoji = component.emoji;
    logger._componentName = component.name;
    
    return logger;
  }

  /**
   * Create legacy compatibility aliases
   * @private
   */
  createAliases() {
    // Legacy compatibility for existing codebase
    this.loggers.siteDetector = this.loggers['site-detector'];
    this.loggers.priorityManager = this.loggers['priority-manager'];
  }

  /**
   * Add utility methods to the logger exports
   * @private
   */
  addUtilityMethods() {
    // Create logger on demand
    this.createLogger = (componentName) => {
      if (!this.loggers[componentName]) {
        this.loggers[componentName] = this.createLogger(componentName);
      }
      return this.loggers[componentName];
    };
  }

  /**
   * Get the object to export with all loggers and utilities
   * @returns {Object} Complete logger exports
   */
  getLoggerExports() {
    return {
      // All component loggers
      ...this.loggers,
      
      // Utility methods
      createLogger: (componentName) => {
        if (!this.loggers[componentName]) {
          this.loggers[componentName] = this.createLogger(componentName);
        }
        return this.loggers[componentName];
      },

      // Configuration and debugging
      config: {
        environment: this.environment,
        components: COMPONENT_SCHEME,
        summary: configManager.getSummary()
      },

      // Log store for popup/debugging
      logStore: this.logStore,

      // Runtime controls (especially useful for extension popup)
      controls: {
        setLevel: (component, level) => {
          if (this.loggers[component]) {
            this.loggers[component].level = level;
          }
        },
        getLevel: (component) => {
          return this.loggers[component]?.level;
        },
        listComponents: () => Object.keys(this.loggers),
        enableDebugMode: () => {
          Object.values(this.loggers).forEach(logger => {
            logger.level = 'debug';
          });
        },
        enableTraceMode: () => {
          Object.values(this.loggers).forEach(logger => {
            logger.level = 'trace';
          });
        },
        getStats: () => this.logStore.getStats()
      }
    };
  }

  /**
   * Create fallback logger for error scenarios
   * @private
   */
  createFallbackLogger() {
    const fallback = {
      info: console.log,
      debug: console.log,
      trace: console.log,
      warn: console.warn,
      error: console.error,
      fatal: console.error
    };

    return {
      cacp: fallback,
      createLogger: () => fallback,
      config: { environment: 'fallback' },
      logStore: { getRecent: () => [], clear: () => {} },
      controls: {
        setLevel: () => {},
        getLevel: () => 'info',
        listComponents: () => [],
        enableDebugMode: () => {},
        getStats: () => ({ total: 0 })
      }
    };
  }
}

// Create singleton instance
const logger = new CACPLogger();

// Initialize synchronously with default config for immediate use
// (Chrome extensions and other environments that don't support top-level await)
const enhancedLoggers = logger.initSync();

// Make runtime controls available globally in browser for debugging
if (isBrowser() && typeof window !== 'undefined') {
  window.CACP_Logger = enhancedLoggers.controls;
}

// Export both the initialized loggers and the init function for advanced usage
export default enhancedLoggers;
export { logger as CACPLogger };