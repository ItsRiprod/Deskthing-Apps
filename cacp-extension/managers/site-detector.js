/**
 * Site Detector for CACP (Chrome Audio Control Platform)
 * 
 * Handles URL-based site detection and active site management.
 * Determines which site handlers should be active based on current tab URL.
 */

import { logger } from '../logger.js';

export class SiteDetector {
  constructor() {
    // Initialize logger
    this.log = logger.siteDetector;
    
    this.registeredHandlers = new Map(); // handlerClass -> { name, patterns, priority }
    this.activeSites = new Set(); // Currently active site names
    this.currentUrl = '';
    this.matchedHandlers = []; // Handlers that match current URL
    
    this.log.debug('Site Detector created', {
      initialState: {
        registeredHandlers: this.registeredHandlers.size,
        activeSites: Array.from(this.activeSites),
        currentUrl: this.currentUrl
      }
    });
  }

  /**
   * Register a site handler class
   * @param {class} HandlerClass Site handler class with config
   * @param {number} priority Priority level (lower = higher priority)
   */
  registerHandler(HandlerClass, priority = 100) {
    const config = HandlerClass.config;
    
    if (!config || !config.name || !config.urlPatterns) {
      this.log.error('Invalid handler config - missing required fields', {
        handlerClass: HandlerClass.name,
        hasConfig: !!config,
        hasName: !!config?.name,
        hasUrlPatterns: !!config?.urlPatterns,
        configKeys: config ? Object.keys(config) : []
      });
      return false;
    }

    this.registeredHandlers.set(HandlerClass, {
      name: config.name,
      patterns: config.urlPatterns,
      priority: priority,
      class: HandlerClass
    });

    this.log.info('Site handler registered', {
      name: config.name,
      priority,
      patterns: config.urlPatterns,
      totalHandlers: this.registeredHandlers.size
    });
    
    return true;
  }

  /**
   * Update current URL and detect matching sites
   * @param {string} url Current page URL
   * @returns {Object[]} Array of matching handler info
   */
  detectSites(url) {
    const previousUrl = this.currentUrl;
    const urlChanged = previousUrl !== url;
    
    this.currentUrl = url;
    this.matchedHandlers = [];

    this.log.debug('Detecting sites for URL', {
      url,
      urlChanged,
      previousUrl,
      registeredHandlers: this.registeredHandlers.size
    });

    // Check each registered handler against current URL
    for (const [HandlerClass, info] of this.registeredHandlers.entries()) {
      if (this.urlMatches(url, info.patterns)) {
        this.matchedHandlers.push({
          name: info.name,
          class: HandlerClass,
          priority: info.priority,
          isActive: this.activeSites.has(info.name)
        });
        
        this.log.trace('Site pattern matched', {
          siteName: info.name,
          priority: info.priority,
          patterns: info.patterns,
          isActive: this.activeSites.has(info.name)
        });
      }
    }

    // Sort by priority (lower number = higher priority)
    this.matchedHandlers.sort((a, b) => a.priority - b.priority);

    this.log.info('Site detection complete', {
      url,
      matchedSites: this.matchedHandlers.map(h => ({
        name: h.name,
        priority: h.priority,
        isActive: h.isActive
      })),
      totalMatches: this.matchedHandlers.length,
      primarySite: this.matchedHandlers[0]?.name || null
    });

    return this.matchedHandlers;
  }

  /**
   * Check if URL matches any of the given patterns
   * @param {string} url URL to check
   * @param {string[]} patterns Array of URL patterns
   * @returns {boolean} True if URL matches any pattern
   */
  urlMatches(url, patterns) {
    if (!url || !patterns || !Array.isArray(patterns)) return false;

    const normalizedUrl = url.toLowerCase();
    
    return patterns.some(pattern => {
      const normalizedPattern = pattern.toLowerCase();
      
      // Simple contains check for now
      // Could be enhanced with regex patterns later
      return normalizedUrl.includes(normalizedPattern);
    });
  }

  /**
   * Get the highest priority matching handler for current URL
   * @returns {Object|null} Handler info or null if none match
   */
  getPrimaryHandler() {
    if (this.matchedHandlers.length === 0) return null;
    return this.matchedHandlers[0]; // Already sorted by priority
  }

  /**
   * Get all matching handlers for current URL
   * @returns {Object[]} Array of handler info, sorted by priority
   */
  getMatchingHandlers() {
    return [...this.matchedHandlers];
  }

  /**
   * Mark a site as active (has audio playing)
   * @param {string} siteName Site name to mark as active
   */
  markSiteActive(siteName) {
    this.activeSites.add(siteName);
    
    // Update active status in matched handlers
    this.matchedHandlers.forEach(handler => {
      if (handler.name === siteName) {
        handler.isActive = true;
      }
    });

    console.log(`[CACP] Site marked as active: ${siteName}`);
    this.logActiveStatus();
  }

  /**
   * Mark a site as inactive (no audio playing)
   * @param {string} siteName Site name to mark as inactive
   */
  markSiteInactive(siteName) {
    this.activeSites.delete(siteName);
    
    // Update active status in matched handlers
    this.matchedHandlers.forEach(handler => {
      if (handler.name === siteName) {
        handler.isActive = false;
      }
    });

    console.log(`[CACP] Site marked as inactive: ${siteName}`);
    this.logActiveStatus();
  }

  /**
   * Get all currently active sites
   * @returns {string[]} Array of active site names
   */
  getActiveSites() {
    return Array.from(this.activeSites);
  }

  /**
   * Get the highest priority active site that matches current URL
   * @returns {Object|null} Active handler info or null
   */
  getActiveHandler() {
    // Find highest priority handler that is both matched and active
    const activeHandler = this.matchedHandlers.find(handler => handler.isActive);
    return activeHandler || null;
  }

  /**
   * Check if any sites are currently active
   * @returns {boolean} True if any sites have active audio
   */
  hasActiveSites() {
    return this.activeSites.size > 0;
  }

  /**
   * Check if current URL has any matching handlers
   * @returns {boolean} True if current URL matches registered handlers
   */
  hasMatchingSites() {
    return this.matchedHandlers.length > 0;
  }

  /**
   * Get site handler class by name
   * @param {string} siteName Site name to find
   * @returns {class|null} Handler class or null if not found
   */
  getHandlerClass(siteName) {
    for (const [HandlerClass, info] of this.registeredHandlers.entries()) {
      if (info.name === siteName || info.name.toLowerCase() === siteName.toLowerCase()) {
        return HandlerClass;
      }
    }
    return null;
  }

  /**
   * Get all registered site names
   * @returns {string[]} Array of registered site names
   */
  getRegisteredSites() {
    return Array.from(this.registeredHandlers.values()).map(info => info.name);
  }

  /**
   * Create handler instance for a site
   * @param {string} siteName Site name
   * @returns {Object|null} Handler instance or null if not found
   */
  createHandlerInstance(siteName) {
    const HandlerClass = this.getHandlerClass(siteName);
    if (HandlerClass) {
      try {
        return new HandlerClass();
      } catch (error) {
        console.error(`[CACP] Failed to create handler for ${siteName}:`, error);
      }
    }
    return null;
  }

  /**
   * Get detection status summary
   * @returns {Object} Status object with detection info
   */
  getStatus() {
    return {
      currentUrl: this.currentUrl,
      registeredHandlers: this.getRegisteredSites(),
      matchedHandlers: this.matchedHandlers.map(h => ({
        name: h.name,
        priority: h.priority,
        isActive: h.isActive
      })),
      activeSites: this.getActiveSites(),
      primaryHandler: this.getPrimaryHandler()?.name || null,
      activeHandler: this.getActiveHandler()?.name || null
    };
  }

  /**
   * Log current active status for debugging
   */
  logActiveStatus() {
    if (this.activeSites.size > 0) {
      console.log(`[CACP] Active sites: [${Array.from(this.activeSites).join(', ')}]`);
      const activeHandler = this.getActiveHandler();
      if (activeHandler) {
        console.log(`[CACP] Active handler: ${activeHandler.name} (priority: ${activeHandler.priority})`);
      }
    } else {
      console.log('[CACP] No active sites');
    }
  }

  /**
   * Reset all detection state
   */
  reset() {
    this.activeSites.clear();
    this.currentUrl = '';
    this.matchedHandlers = [];
    console.log('[CACP] Site detector reset');
  }
}

export default SiteDetector;
