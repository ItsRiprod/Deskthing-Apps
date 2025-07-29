/**
 * Configuration Manager for CACP Logger
 * Handles loading, merging, and validation of logger configurations
 */

import defaultConfig from './default-config.json' assert { type: 'json' };
import { COMPONENT_SCHEME, LEVEL_SCHEME } from './component-schemes.js';

export class ConfigManager {
  constructor() {
    this.config = { ...defaultConfig };
    this.loadedPaths = [];
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
   * Deep merge two configuration objects
   * @private
   */
  mergeConfigs(base, override) {
    const merged = { ...base };
    
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
   * Get component configuration
   * @param {string} componentName - Component identifier
   * @returns {Object} Component configuration
   */
  getComponentConfig(componentName) {
    // Check if component exists in loaded config
    if (this.config.components && this.config.components[componentName]) {
      return this.config.components[componentName];
    }
    
    // Fallback to default schemes
    return COMPONENT_SCHEME[componentName] || COMPONENT_SCHEME['cacp'];
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
   * Get configuration summary for debugging
   * @returns {Object} Configuration summary
   */
  getSummary() {
    return {
      projectName: this.getProjectName(),
      globalLevel: this.getGlobalLevel(),
      loadedPaths: this.loadedPaths,
      componentCount: this.getAvailableComponents().length,
      autoRegister: this.isAutoRegisterEnabled(),
      format: this.getFormatConfig()
    };
  }
}

// Create singleton instance
export const configManager = new ConfigManager();