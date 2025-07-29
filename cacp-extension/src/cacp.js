/**
 * CACP (Chrome Audio Control Platform) - Content Script
 * 
 * Global Media Source Reporter - Each tab registers with background script
 * and reports media status for centralized control
 */

import logger from './logger.js';

// Import site handlers
import { SiteDetector } from './managers/site-detector.js';
import { SoundCloudHandler } from './sites/soundcloud.js';
import { YouTubeHandler } from './sites/youtube.js';

class CACPMediaSource {
  constructor() {
    // Initialize logger
    this.log = logger.cacp;
    
    // Core components
    this.siteDetector = new SiteDetector();
    this.currentHandler = null;
    this.activeSiteName = null;
    
    // State tracking
    this.isRegistered = false;
    this.lastReportedState = null;
    this.reportingInterval = null;
    this.tabId = null;
    
    // Configuration
    this.reportIntervalMs = 2000; // Report every 2 seconds
    this.maxRetries = 3;
    
    this.log.debug('CACP Media Source created', {
      url: window.location.href,
      title: document.title
    });
  }

  /**
   * Initialize this media source
   */
  async initialize() {
    this.log.info('Initializing CACP Media Source...', {
      url: window.location.href
    });

    try {
      // Get tab ID from background script
      await this.getTabId();
      
      // Register site handlers
      await this.registerSiteHandlers();
      
      // Detect if this site is supported
      await this.detectSite();
      
      // Set up message listener for control commands
      this.setupMessageListener();
      
      // Register with background script if we have a handler
      if (this.currentHandler) {
        await this.registerWithBackground();
        this.startReporting();
      }
      
      // Listen for URL changes (SPA navigation)
      this.setupURLChangeListener();
      
      // Clean up on page unload
      this.setupUnloadHandler();
      
      this.log.info('CACP Media Source initialized', {
        siteName: this.activeSiteName,
        hasHandler: !!this.currentHandler,
        tabId: this.tabId
      });

    } catch (error) {
      this.log.error('CACP Media Source initialization failed', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Get tab ID from background script
   */
  async getTabId() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'get-status' });
      // Tab ID will be set by background script context
      this.tabId = 'current'; // Placeholder - background script knows which tab sent the message
    } catch (error) {
      this.log.warn('Could not get tab ID', { error: error.message });
    }
  }

  /**
   * Register all available site handlers
   */
  async registerSiteHandlers() {
    this.log.debug('Registering site handlers...');

    // Register SoundCloud handler with high priority (10 = highest)
    this.siteDetector.registerHandler(SoundCloudHandler, 10);
    
    // Register YouTube handler with medium priority (20)
    this.siteDetector.registerHandler(YouTubeHandler, 20);

    const registeredCount = this.siteDetector.getRegisteredSites().length;
    this.log.info(`Registered ${registeredCount} site handlers`);
  }

  /**
   * Detect current site and activate appropriate handler
   */
  async detectSite() {
    this.log.debug('Detecting site for URL:', window.location.href);
    
    const detectedSite = this.siteDetector.detectSite(window.location.href);
    
    if (detectedSite) {
      this.activeSiteName = detectedSite.name;
      this.log.info('Site detection complete', {
        siteName: this.activeSiteName,
        priority: detectedSite.priority
      });
      
      // Activate the handler
      await this.activateHandler(detectedSite.name);
    } else {
      this.log.debug('No supported site detected', {
        url: window.location.href,
        hostname: window.location.hostname
      });
    }
  }

  /**
   * Activate site handler
   */
  async activateHandler(siteName) {
    try {
      this.log.debug(`Activating handler: ${siteName}`);
      
      const HandlerClass = this.siteDetector.getHandler(siteName);
      if (HandlerClass) {
        this.currentHandler = new HandlerClass();
        
        // Initialize the handler
        if (this.currentHandler.initialize) {
          await this.currentHandler.initialize();
        }
        
        this.log.info(`Handler activated: ${siteName}`);
        
        return true;
      } else {
        this.log.error(`No handler found for site: ${siteName}`);
        return false;
      }
    } catch (error) {
      this.log.error(`Failed to activate handler for ${siteName}`, {
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  /**
   * Register this media source with background script
   */
  async registerWithBackground() {
    try {
      const mediaState = this.getCurrentMediaState();
      
      await chrome.runtime.sendMessage({
        type: 'register-media-source',
        data: {
          site: this.activeSiteName,
          isActive: this.currentHandler?.isReady ? this.currentHandler.isReady() : false,
          trackInfo: mediaState.trackInfo,
          isPlaying: mediaState.isPlaying,
          canControl: this.currentHandler?.canControl || true,
          priority: this.siteDetector.getSitePriority(this.activeSiteName) || 1
        }
      });
      
      this.isRegistered = true;
      this.log.debug('Registered with background script', {
        site: this.activeSiteName,
        isActive: mediaState.isActive
      });
      
    } catch (error) {
      this.log.error('Failed to register with background script', {
        error: error.message
      });
    }
  }

  /**
   * Get current media state from handler
   */
  getCurrentMediaState() {
    if (!this.currentHandler) {
      return {
        isActive: false,
        trackInfo: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0
      };
    }

    try {
      const trackInfo = this.currentHandler.getTrackInfo ? this.currentHandler.getTrackInfo() : null;
      const isPlaying = this.currentHandler.isPlaying ? this.currentHandler.isPlaying() : false;
      const currentTime = this.currentHandler.getCurrentTime ? this.currentHandler.getCurrentTime() : 0;
      const duration = this.currentHandler.getDuration ? this.currentHandler.getDuration() : 0;
      const isActive = this.currentHandler.isReady ? this.currentHandler.isReady() : false;

      return {
        isActive,
        trackInfo,
        isPlaying,
        currentTime,
        duration,
        site: this.activeSiteName
      };
    } catch (error) {
      this.log.warn('Error getting media state', { error: error.message });
      return {
        isActive: false,
        trackInfo: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0
      };
    }
  }

  /**
   * Start periodic reporting to background script
   */
  startReporting() {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }

    this.reportingInterval = setInterval(() => {
      this.reportMediaState();
    }, this.reportIntervalMs);

    this.log.debug('Started media state reporting', {
      intervalMs: this.reportIntervalMs
    });
  }

  /**
   * Report current media state to background script
   */
  async reportMediaState() {
    if (!this.isRegistered || !this.currentHandler) {
      return;
    }

    try {
      const currentState = this.getCurrentMediaState();
      
      // Only send update if state has changed significantly
      if (this.hasStateChanged(currentState)) {
        await chrome.runtime.sendMessage({
          type: 'update-media-source',
          data: currentState
        });
        
        this.lastReportedState = { ...currentState };
        
        this.log.trace('Media state reported', {
          site: this.activeSiteName,
          isPlaying: currentState.isPlaying,
          trackTitle: currentState.trackInfo?.title
        });
      }
    } catch (error) {
      this.log.warn('Failed to report media state', {
        error: error.message
      });
    }
  }

  /**
   * Check if media state has changed significantly
   */
  hasStateChanged(newState) {
    if (!this.lastReportedState) return true;
    
    const prev = this.lastReportedState;
    
    // Check significant changes
    return (
      prev.isActive !== newState.isActive ||
      prev.isPlaying !== newState.isPlaying ||
      prev.trackInfo?.title !== newState.trackInfo?.title ||
      prev.trackInfo?.artist !== newState.trackInfo?.artist ||
      Math.abs(prev.currentTime - newState.currentTime) > 5 // 5 second threshold
    );
  }

  /**
   * Handle control commands from background script
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'media-control') {
        this.handleControlCommand(message.command)
          .then(result => sendResponse(result))
          .catch(error => sendResponse({ 
            success: false, 
            error: error.message 
          }));
        return true; // Async response
      }
    });
  }

  /**
   * Handle media control commands
   */
  async handleControlCommand(command) {
    if (!this.currentHandler) {
      return { success: false, error: 'No active handler' };
    }

    this.log.info('Handling control command', { command, site: this.activeSiteName });

    try {
      let result = false;
      
      switch (command) {
        case 'play':
          result = await this.currentHandler.play();
          break;
        case 'pause':
          result = await this.currentHandler.pause();
          break;
        case 'next':
          result = await this.currentHandler.next();
          break;
        case 'previous':
          result = await this.currentHandler.previous();
          break;
        case 'toggle':
          const isPlaying = this.currentHandler.isPlaying ? this.currentHandler.isPlaying() : false;
          result = isPlaying ? await this.currentHandler.pause() : await this.currentHandler.play();
          break;
        default:
          return { success: false, error: `Unknown command: ${command}` };
      }

      // Force immediate state report after control
      setTimeout(() => this.reportMediaState(), 100);

      return { 
        success: !!result, 
        action: command,
        site: this.activeSiteName 
      };
      
    } catch (error) {
      this.log.error('Control command failed', {
        command,
        error: error.message
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Handle URL changes for SPA navigation
   */
  setupURLChangeListener() {
    let lastUrl = window.location.href;
    
    // Monitor for URL changes
    const urlCheckInterval = setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        this.log.debug('URL changed, re-detecting site', { newUrl: lastUrl });
        
        // Re-detect site after URL change
        setTimeout(() => {
          this.detectSite();
        }, 1000);
      }
    }, 1000);

    // Clean up on unload
    window.addEventListener('beforeunload', () => {
      clearInterval(urlCheckInterval);
    });
  }

  /**
   * Clean up when page unloads
   */
  setupUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  /**
   * Clean up resources and unregister
   */
  cleanup() {
    this.log.debug('Cleaning up media source');
    
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }

    if (this.isRegistered) {
      chrome.runtime.sendMessage({
        type: 'remove-media-source'
      }).catch(() => {
        // Background script might be unavailable during cleanup
      });
    }
  }
}

// Initialize CACP Media Source when script loads
const cacpMediaSource = new CACPMediaSource();

// Wait for DOM to be ready, then initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    cacpMediaSource.initialize();
  });
} else {
  // DOM already loaded
  cacpMediaSource.initialize();
}

// Export for potential external access
window.cacpMediaSource = cacpMediaSource;

console.log('[CACP] Media Source content script loaded');
