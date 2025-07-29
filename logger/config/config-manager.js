/**
 * Configuration Manager for CACP Logger
 * Handles loading, merging, and validation of logger configurations
 * Implements smart level resolution and file override system
 */

import defaultConfig from '@cacp/logger/config/default';
import {COMPONENT_SCHEME, LEVEL_SCHEME} from '@cacp/logger/config/schemes';

export class ConfigManager {
    constructor() {
        this.config = {...defaultConfig};
        this.loadedPaths = [];
        this.currentFile = null; // Track current file for overrides
    }

    /**
     * Load configuration from a file path or object
     * @param {string|Object} configSource - File path or config object
     * @returns {Promise<Object>} Merged configuration
     */
    async loadConfig(configSource) {
        try {
            let externalConfig = {};

            if (typeof configSource === 'string') {
                // Load from file path
                if (configSource.startsWith('./') || configSource.startsWith('../')) {
                    // Relative path - attempt to load
                    try {
                        const response = await fetch(configSource);
                        if (response.ok) {
                            externalConfig = await response.json();
                            this.loadedPaths.push(configSource);
                        }
                    } catch (error) {
                        console.warn(`Failed to load config from ${configSource}:`, error.message);
                    }
                }
            } else if (typeof configSource === 'object') {
                // Direct config object
                externalConfig = configSource;
            }

            // Merge configurations
            this.config = this.mergeConfigs(this.config, externalConfig);

            return this.config;
        } catch (error) {
            console.error('ConfigManager: Error loading configuration:', error);
            return this.config; // Return default config on error
        }
    }

    /**
     * Set current file context for override resolution
     * @param {string} filePath - Current file path being logged from
     */
    setCurrentFile(filePath) {
        this.currentFile = filePath;
    }

    /**
     * Deep merge two configuration objects
     * @private
     */
    mergeConfigs(base, override) {
        const merged = {...base};

        for (const key in override) {
            if (override.hasOwnProperty(key)) {
                if (typeof override[key] === 'object' && !Array.isArray(override[key])) {
                    merged[key] = this.mergeConfigs(merged[key] || {}, override[key]);
                } else {
                    merged[key] = override[key];
                }
            }
        }

        return merged;
    }

    /**
     * Get effective log level using hierarchy: file override > component level > global level
     * @param {string} componentName - Component identifier
     * @param {string} filePath - Optional file path for override checking
     * @returns {string} Effective log level
     */
    getEffectiveLevel(componentName, filePath = null) {
        const checkFile = filePath || this.currentFile;

        // 1. Check file overrides first (highest priority)
        if (checkFile && this.config.fileOverrides) {
            const fileOverride = this.getFileOverride(checkFile);
            if (fileOverride && fileOverride.level) {
                return fileOverride.level;
            }
        }

        // 2. Check component-specific level
        if (this.config.components && this.config.components[componentName] && this.config.components[componentName].level) {
            return this.config.components[componentName].level;
        }

        // 3. Fall back to global level
        return this.config.globalLevel || 'info';
    }

    /**
     * Get file override configuration for a given file path
     * @param {string} filePath - File path to check
     * @returns {Object|null} File override config or null
     */
    getFileOverride(filePath) {
        if (!this.config.fileOverrides || !filePath) {
            return null;
        }

        // Normalize file path (remove leading ./ and ../)
        const normalizedPath = filePath.replace(/^\.\.?\//g, '');

        // Check exact matches first
        if (this.config.fileOverrides[normalizedPath]) {
            return this.config.fileOverrides[normalizedPath];
        }

        // Check pattern matches
        for (const pattern in this.config.fileOverrides) {
            if (this.matchFilePattern(normalizedPath, pattern)) {
                return this.config.fileOverrides[pattern];
            }
        }

        return null;
    }

    /**
     * Match file path against a pattern (supports wildcards)
     * @param {string} filePath - File path to test
     * @param {string} pattern - Pattern to match against
     * @returns {boolean} Whether the file matches the pattern
     * @private
     */
    matchFilePattern(filePath, pattern) {
        // Convert glob pattern to regex
        const regexPattern = pattern
                .replace(/\./g, '\\.')  // Escape dots
                .replace(/\*/g, '.*')   // Convert * to .*
                .replace(/\?/g, '.')    // Convert ? to .
            + '$';                  // End of string

        const regex = new RegExp(regexPattern);
        return regex.test(filePath);
    }

    /**
     * Get component configuration with file override support
     * @param {string} componentName - Component identifier
     * @param {string} filePath - Optional file path for override checking
     * @returns {Object} Component configuration
     */
    getComponentConfig(componentName, filePath = null) {
        const baseComponent = this.config.components?.[componentName] || COMPONENT_SCHEME[componentName] || COMPONENT_SCHEME['cacp'];

        // Check for file-specific overrides
        const checkFile = filePath || this.currentFile;
        if (checkFile) {
            const fileOverride = this.getFileOverride(checkFile);
            if (fileOverride) {
                return {
                    ...baseComponent,
                    ...fileOverride,
                    level: this.getEffectiveLevel(componentName, checkFile)
                };
            }
        }

        return {
            ...baseComponent,
            level: this.getEffectiveLevel(componentName, checkFile)
        };
    }

    /**
     * Get level configuration
     * @param {number} level - Log level number
     * @returns {Object} Level configuration
     */
    getLevelConfig(level) {
        // Check if level exists in loaded config
        if (this.config.levels && this.config.levels[level]) {
            return this.config.levels[level];
        }

        // Fallback to default schemes
        return LEVEL_SCHEME[level] || LEVEL_SCHEME[30];
    }

    /**
     * Get global log level
     * @returns {string} Global log level
     */
    getGlobalLevel() {
        return this.config.globalLevel || 'info';
    }

    /**
     * Get timestamp mode
     * @returns {string} Timestamp mode ('absolute', 'readable', 'relative', 'disable')
     */
    getTimestampMode() {
        return this.config.timestampMode || 'absolute';
    }

    /**
     * Get display configuration with file override support
     * @param {string} filePath - Optional file path for override checking
     * @returns {Object} Display configuration
     */
    getDisplayConfig(filePath = null) {
        const baseDisplay = this.config.display || {
            timestamp: true,
            emoji: true,
            component: true,
            level: false,
            message: true,
            jsonPayload: true,
            stackTrace: true
        };

        // Check for file-specific display overrides
        const checkFile = filePath || this.currentFile;
        if (checkFile) {
            const fileOverride = this.getFileOverride(checkFile);
            if (fileOverride && fileOverride.display) {
                return {
                    ...baseDisplay,
                    ...fileOverride.display
                };
            }
        }

        return baseDisplay;
    }

    /**
     * Get project name
     * @returns {string} Project name
     */
    getProjectName() {
        return this.config.projectName || 'CACP Logger';
    }

    /**
     * Check if auto-registration is enabled
     * @returns {boolean} Auto-registration flag
     */
    isAutoRegisterEnabled() {
        return this.config.autoRegister !== false;
    }

    /**
     * Get formatting configuration
     * @returns {Object} Format configuration
     */
    getFormatConfig() {
        return this.config.format || {
            style: 'brackets',
            componentCase: 'upper',
            timestamp: 'HH:mm:ss.SSS'
        };
    }

    /**
     * Get all available components
     * @returns {Array} Array of component names
     */
    getAvailableComponents() {
        const configComponents = Object.keys(this.config.components || {});
        const schemeComponents = Object.keys(COMPONENT_SCHEME);

        // Combine and deduplicate
        return [...new Set([...configComponents, ...schemeComponents])];
    }

    /**
     * Add or update a component configuration
     * @param {string} componentName - Component identifier
     * @param {Object} componentConfig - Component configuration
     */
    addComponent(componentName, componentConfig) {
        if (!this.config.components) {
            this.config.components = {};
        }

        this.config.components[componentName] = {
            ...this.getComponentConfig(componentName),
            ...componentConfig
        };
    }

    /**
     * Add or update a file override
     * @param {string} filePath - File path or pattern
     * @param {Object} overrideConfig - Override configuration
     */
    addFileOverride(filePath, overrideConfig) {
        if (!this.config.fileOverrides) {
            this.config.fileOverrides = {};
        }

        this.config.fileOverrides[filePath] = overrideConfig;
    }

    /**
     * Format timestamp based on mode
     * @param {number} timestamp - Unix timestamp
     * @param {string} mode - Timestamp mode
     * @returns {string} Formatted timestamp
     */
    formatTimestamp(timestamp, mode = null) {
        const timestampMode = mode || this.getTimestampMode();
        const date = new Date(timestamp);

        switch (timestampMode) {
            case 'readable':
                return date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });

            case 'relative':
                const now = Date.now();
                const diff = now - timestamp;

                if (diff < 1000) return 'now';
                if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
                if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
                return `${Math.floor(diff / 3600000)}h ago`;

            case 'disable':
                return '';

            case 'absolute':
            default:
                return date.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    fractionalSecondDigits: 3
                });
        }
    }

    /**
     * Get configuration summary for debugging
     * @returns {Object} Configuration summary
     */
    getSummary() {
        return {
            projectName: this.getProjectName(),
            globalLevel: this.getGlobalLevel(),
            timestampMode: this.getTimestampMode(),
            loadedPaths: this.loadedPaths,
            componentCount: this.getAvailableComponents().length,
            fileOverrideCount: Object.keys(this.config.fileOverrides || {}).length,
            autoRegister: this.isAutoRegisterEnabled(),
            format: this.getFormatConfig(),
            display: this.getDisplayConfig(),
            currentFile: this.currentFile
        };
    }
}

// Create singleton instance
export const configManager = new ConfigManager();
