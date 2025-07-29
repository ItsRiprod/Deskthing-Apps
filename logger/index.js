/**
 * CACP Portable Logger System
 * Main entry point for the smart adaptive logging system
 */

import pino from 'pino';
import {configManager} from '@cacp/logger/config/manager';
import {COMPONENT_SCHEME} from '@cacp/logger/config/schemes';
import defaultConfig from '@cacp/logger/config/default';
import {getEnvironment, isBrowser, isCLI} from '@cacp/logger/utils/environment';
import {createBrowserFormatter} from '@cacp/logger/formatters/browser';
import {createCLIFormatter} from '@cacp/logger/formatters/cli';
import {createServerFormatter, getServerConfig} from '@cacp/logger/formatters/server';
import {LogStore} from '@cacp/logger/stores/log-store';

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
                    configPaths: configManager.loadedPaths,
                    fileOverrides: Object.keys(configManager.config.fileOverrides || {}).length
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
                    projectName: configManager.getProjectName(),
                    fileOverrides: Object.keys(configManager.config.fileOverrides || {}).length,
                    timestampMode: configManager.getTimestampMode()
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
            level: configManager.getEffectiveLevel(componentName) // Use smart level resolution
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
            config = {...config, ...getServerConfig()};
        }

        const logger = stream ? pino(config, stream) : pino(config);

        // Add component emoji to logger for easy identification
        logger._componentEmoji = component.emoji;
        logger._componentName = component.name;
        logger._effectiveLevel = configManager.getEffectiveLevel(componentName);

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

            // Enhanced runtime controls with all new features
            controls: {
                // Level controls
                setLevel: (component, level) => {
                    if (this.loggers[component]) {
                        this.loggers[component].level = level;
                        this.loggers[component]._effectiveLevel = level;
                    }
                },
                getLevel: (component) => {
                    return this.loggers[component]?._effectiveLevel;
                },

                // Component controls
                listComponents: () => Object.keys(this.loggers),
                enableDebugMode: () => {
                    Object.keys(this.loggers).forEach(component => {
                        this.controls.setLevel(component, 'debug');
                    });
                },
                enableTraceMode: () => {
                    Object.keys(this.loggers).forEach(component => {
                        this.controls.setLevel(component, 'trace');
                    });
                },

                // File override controls
                addFileOverride: (filePath, overrideConfig) => {
                    configManager.addFileOverride(filePath, overrideConfig);
                    // Refresh affected loggers
                    this.refreshLoggers();
                },
                removeFileOverride: (filePath) => {
                    if (configManager.config.fileOverrides) {
                        delete configManager.config.fileOverrides[filePath];
                        this.refreshLoggers();
                    }
                },
                listFileOverrides: () => {
                    return Object.keys(configManager.config.fileOverrides || {});
                },

                // Timestamp controls
                setTimestampMode: (mode) => {
                    configManager.config.timestampMode = mode;
                },
                getTimestampMode: () => {
                    return configManager.getTimestampMode();
                },
                getTimestampModes: () => {
                    return ['absolute', 'readable', 'relative', 'disable'];
                },

                // Display controls
                setDisplayOption: (option, enabled) => {
                    if (!configManager.config.display) {
                        configManager.config.display = {};
                    }
                    configManager.config.display[option] = enabled;
                },
                getDisplayConfig: () => {
                    return configManager.getDisplayConfig();
                },
                toggleDisplayOption: (option) => {
                    const current = configManager.getDisplayConfig();
                    this.controls.setDisplayOption(option, !current[option]);
                },

                // Statistics and debugging
                getStats: () => this.logStore.getStats(),
                getConfigSummary: () => configManager.getSummary(),

                // Advanced configuration
                setComponentLevel: (component, level) => {
                    if (!configManager.config.components[component]) {
                        configManager.config.components[component] = {};
                    }
                    configManager.config.components[component].level = level;
                    this.refreshLoggers();
                },
                getComponentLevel: (component) => {
                    return configManager.config.components?.[component]?.level;
                },

                // System controls
                refresh: () => this.refreshLoggers(),
                reset: () => {
                    configManager.config = {...defaultConfig};
                    this.refreshLoggers();
                }
            }
        };
    }

    /**
     * Refresh all loggers with updated configuration
     * @private
     */
    refreshLoggers() {
        Object.keys(this.loggers).forEach(componentName => {
            this.loggers[componentName] = this.createLogger(componentName);
        });
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
            config: {environment: 'fallback'},
            logStore: {getRecent: () => [], clear: () => {}},
            controls: {
                setLevel: () => {},
                getLevel: () => 'info',
                listComponents: () => [],
                enableDebugMode: () => {},
                getStats: () => ({total: 0})
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
export {logger as CACPLogger};
