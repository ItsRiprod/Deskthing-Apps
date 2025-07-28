/**
 * CACP (Chrome Audio Control Platform) - Main Orchestrator
 * 
 * Coordinates all CACP components and manages the extension lifecycle.
 * Handles site detection, priority management, and communication with DeskThing.
 */

import { SiteDetector } from './managers/site-detector.js';
import { PriorityManager } from './managers/priority-manager.js';
import { WebSocketManager } from './managers/websocket-manager.js';
import { logger } from './logger.js';

// Import site handlers
import { SoundCloudHandler } from './sites/soundcloud.js';
import { YouTubeHandler } from './sites/youtube.js';

class CACP {
  constructor() {
    // Initialize logger
    this.log = logger.cacp;
    
    // Core managers
    this.siteDetector = new SiteDetector();
    this.priorityManager = new PriorityManager();
    this.websocketManager = new WebSocketManager();
    
    // State
    this.isInitialized = false;
    this.currentHandler = null;
    this.activeSiteName = null;
    this.mediaUpdateInterval = null;
    this.timeUpdateInterval = null;
    this.lastMediaData = null;
    this.lastTimeData = null;
    
    // Configuration
    this.mediaUpdateIntervalMs = 1000; // 1 second
    this.timeUpdateIntervalMs = 1000; // 1 second
    this.maxRetries = 3;
    this.retryDelay = 1000;
    
    this.log.debug('CACP Orchestrator created', {
      config: {
        mediaUpdateInterval: this.mediaUpdateIntervalMs,
        timeUpdateInterval: this.timeUpdateIntervalMs,
        maxRetries: this.maxRetries,
        retryDelay: this.retryDelay
      }
    });
  }

  /**
   * Initialize CACP system
   */
  async initialize() {
    if (this.isInitialized) {
      this.log.debug('CACP already initialized, skipping');
      return;
    }

    this.log.info('Initializing CACP system...');
    const startTime = performance.now();

    try {
      // Register site handlers
      this.log.debug('Registering site handlers');
      await this.registerSiteHandlers();

      // Set up WebSocket event handlers
      this.log.debug('Setting up WebSocket handlers');
      this.setupWebSocketHandlers();

      // Set up popup communication
      this.log.debug('Setting up popup communication');
      this.setupPopupCommunication();

      // Detect current site
      this.log.debug('Detecting current site');
      await this.detectCurrentSite();

      // Connect to DeskThing
      this.log.debug('Connecting to DeskThing');
      await this.connectToDeskThing();

      // Start monitoring intervals
      this.log.debug('Starting monitoring intervals');
      this.startMonitoring();

      // Listen for URL changes
      this.log.debug('Setting up URL change listener');
      this.setupURLChangeListener();

      this.isInitialized = true;
      const initTime = performance.now() - startTime;
      
      this.log.info('CACP initialization complete', {
        initializationTime: `${initTime.toFixed(2)}ms`,
        activeSite: this.activeSiteName,
        hasHandler: !!this.currentHandler
      });

      // Notify popup of status change
      this.notifyPopupStatusUpdate();

    } catch (error) {
      this.log.error('CACP initialization failed', {
        error: error.message,
        stack: error.stack,
        initializationStep: 'unknown'
      });
      throw error;
    }
  }

  /**
   * Register all available site handlers
   */
  async registerSiteHandlers() {
    console.log('[CACP] Registering site handlers...');

    // Register SoundCloud handler with high priority (10 = highest)
    this.siteDetector.registerHandler(SoundCloudHandler, 10);
    
    // Register YouTube handler with medium priority (20)
    this.siteDetector.registerHandler(YouTubeHandler, 20);

    const registeredCount = this.siteDetector.getRegisteredSites().length;
    console.log(`[CACP] Registered ${registeredCount} site handlers`);
  }

  /**
   * Set up WebSocket event handlers
   */
  setupWebSocketHandlers() {
    // Handle incoming messages from DeskThing
    this.websocketManager.setMessageHandler((message) => {
      this.handleDeskThingMessage(message);
    });

    // Handle connection state changes
    this.websocketManager.setConnectionHandlers(
      () => this.onWebSocketConnected(),
      () => this.onWebSocketDisconnected(),
      (error) => this.onWebSocketError(error)
    );
  }

  /**
   * Set up communication with popup
   */
  setupPopupCommunication() {
    // Listen for messages from popup and other extension components
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[CACP] Received message:', message.type, 'from:', sender);
      
      switch (message.type) {
        case 'get-cacp-status':
        case 'get-status':
          // Send current CACP status to popup
          sendResponse(this.getStatus());
          break;
          
        case 'extract-media':
          // Force media extraction
          this.updateMediaData();
          sendResponse({ success: true, message: 'Media extraction triggered' });
          break;
          
        case 'media-control':
          // Handle media control commands
          this.handleMediaCommand(message).then(result => {
            sendResponse({ success: true, result });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
          return true; // Keep message channel open for async response
          
        default:
          console.log(`[CACP] Unknown message type: ${message.type}`);
          sendResponse({ success: false, error: 'Unknown message type' });
      }
      
      return true; // Keep message channel open
    });
  }

  /**
   * Detect current site and initialize appropriate handler
   */
  async detectCurrentSite() {
    const currentUrl = window.location.href;
    console.log(`[CACP] Detecting site for URL: ${currentUrl}`);

    // Detect matching handlers
    const matchedHandlers = this.siteDetector.detectSites(currentUrl);
    
    if (matchedHandlers.length === 0) {
      console.log('[CACP] No matching site handlers for current URL');
      this.notifyPopupStatusUpdate();
      return;
    }

    // Get primary handler (highest priority)
    const primaryHandler = this.siteDetector.getPrimaryHandler();
    if (primaryHandler) {
      await this.activateHandler(primaryHandler);
    }
  }

  /**
   * Activate a site handler
   * @param {Object} handlerInfo Handler information from site detector
   */
  async activateHandler(handlerInfo) {
    try {
      console.log(`[CACP] Activating handler: ${handlerInfo.name}`);

      // Create handler instance
      this.currentHandler = this.siteDetector.createHandlerInstance(handlerInfo.name);
      if (!this.currentHandler) {
        throw new Error(`Failed to create handler instance for ${handlerInfo.name}`);
      }

      // Initialize handler
      const initialized = await this.currentHandler.initialize();
      if (!initialized) {
        throw new Error(`Handler initialization failed for ${handlerInfo.name}`);
      }

      this.activeSiteName = handlerInfo.name;
      console.log(`[CACP] Handler activated: ${handlerInfo.name}`);

      // Send connection handshake
      this.sendConnectionHandshake();

      // Notify popup of status change
      this.notifyPopupStatusUpdate();

    } catch (error) {
      console.error(`[CACP] Failed to activate handler ${handlerInfo.name}:`, error);
      this.currentHandler = null;
      this.activeSiteName = null;
      this.notifyPopupStatusUpdate();
    }
  }

  /**
   * Connect to DeskThing WebSocket server
   */
  async connectToDeskThing() {
    console.log('[CACP] Connecting to DeskThing...');
    
    const connected = await this.websocketManager.connect();
    if (connected) {
      console.log('[CACP] Connected to DeskThing');
    } else {
      console.warn('[CACP] Failed to connect to DeskThing');
    }
  }

  /**
   * Start monitoring intervals for media and time updates
   */
  startMonitoring() {
    // Media data monitoring
    this.mediaUpdateInterval = setInterval(() => {
      this.updateMediaData();
    }, this.mediaUpdateIntervalMs);

    // Time progress monitoring
    this.timeUpdateInterval = setInterval(() => {
      this.updateTimeData();
    }, this.timeUpdateIntervalMs);

    console.log('[CACP] Started monitoring intervals');
  }

  /**
   * Stop monitoring intervals
   */
  stopMonitoring() {
    if (this.mediaUpdateInterval) {
      clearInterval(this.mediaUpdateInterval);
      this.mediaUpdateInterval = null;
    }

    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }

    console.log('[CACP] Stopped monitoring intervals');
  }

  /**
   * Update media data and send to DeskThing if changed
   */
  updateMediaData() {
    if (!this.currentHandler || !this.activeSiteName || !this.websocketManager.isConnected) {
      return;
    }

    try {
      const mediaData = this.currentHandler.getTrackInfo();
      
      // Check if data has changed
      if (this.hasMediaDataChanged(mediaData)) {
        this.lastMediaData = mediaData;
        this.websocketManager.sendMediaData(mediaData, this.activeSiteName);
        
        // Update site active status based on playing state
        if (mediaData.isPlaying) {
          this.siteDetector.markSiteActive(this.activeSiteName);
        } else {
          this.siteDetector.markSiteInactive(this.activeSiteName);
        }

        // Notify popup of media update
        this.notifyPopupMediaUpdate(mediaData);
      }
    } catch (error) {
      console.warn('[CACP] Failed to update media data:', error);
    }
  }

  /**
   * Update time data and send to DeskThing if changed
   */
  updateTimeData() {
    if (!this.currentHandler || !this.activeSiteName || !this.websocketManager.isConnected) {
      return;
    }

    try {
      const currentTime = this.currentHandler.getCurrentTime();
      const duration = this.currentHandler.getDuration();
      const isPlaying = this.currentHandler.getPlayingState();

      const timeData = { currentTime, duration, isPlaying };

      // Check if data has changed significantly
      if (this.hasTimeDataChanged(timeData)) {
        this.lastTimeData = timeData;
        this.websocketManager.sendTimeUpdate(currentTime, duration, isPlaying, this.activeSiteName);
      }
    } catch (error) {
      console.warn('[CACP] Failed to update time data:', error);
    }
  }

  /**
   * Check if media data has changed significantly
   * @param {Object} newData New media data
   * @returns {boolean} True if data has changed
   */
  hasMediaDataChanged(newData) {
    if (!this.lastMediaData) return true;

    const fields = ['title', 'artist', 'album', 'isPlaying'];
    return fields.some(field => this.lastMediaData[field] !== newData[field]);
  }

  /**
   * Check if time data has changed significantly
   * @param {Object} newData New time data
   * @returns {boolean} True if data has changed
   */
  hasTimeDataChanged(newData) {
    if (!this.lastTimeData) return true;

    // Only update if time changed by more than 0.5 seconds or playing state changed
    const timeDiff = Math.abs(this.lastTimeData.currentTime - newData.currentTime);
    const playingChanged = this.lastTimeData.isPlaying !== newData.isPlaying;

    return timeDiff > 0.5 || playingChanged;
  }

  /**
   * Handle messages from DeskThing
   * @param {Object} message Incoming message
   */
  async handleDeskThingMessage(message) {
    console.log('[CACP] Handling DeskThing message:', message);

    try {
      switch (message.type) {
        case 'media-command':
          await this.handleMediaCommand(message);
          break;
        case 'seek':
          await this.handleSeekCommand(message);
          break;
        case 'ping':
          // Respond to ping
          this.websocketManager.sendMessage({ type: 'pong' }, this.activeSiteName || 'system');
          break;
        default:
          console.log(`[CACP] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[CACP] Error handling DeskThing message:', error);
    }
  }

  /**
   * Handle media control commands
   * @param {Object} command Media command
   */
  async handleMediaCommand(command) {
    if (!this.currentHandler || !this.activeSiteName) {
      console.warn('[CACP] No active handler for media command');
      return { success: false, error: 'No active handler' };
    }

    const { action, id } = command;
    let result;

    try {
      switch (action) {
        case 'play':
          result = await this.currentHandler.play();
          break;
        case 'pause':
          result = await this.currentHandler.pause();
          break;
        case 'nexttrack':
          result = await this.currentHandler.next();
          break;
        case 'previoustrack':
          result = await this.currentHandler.previous();
          break;
        default:
          throw new Error(`Unknown media action: ${action}`);
      }

      // Send command result via WebSocket if ID provided
      if (id && this.websocketManager.isConnected) {
        this.websocketManager.sendCommandResult(id, result.success, result, this.activeSiteName);
      }

      return result;

    } catch (error) {
      console.error(`[CACP] Media command failed:`, error);
      const errorResult = { success: false, error: error.message };
      
      if (id && this.websocketManager.isConnected) {
        this.websocketManager.sendCommandResult(id, false, errorResult, this.activeSiteName);
      }
      
      return errorResult;
    }
  }

  /**
   * Handle seek commands
   * @param {Object} command Seek command
   */
  async handleSeekCommand(command) {
    if (!this.currentHandler || !this.activeSiteName) {
      console.warn('[CACP] No active handler for seek command');
      return;
    }

    const { time, id } = command;
    
    try {
      const result = await this.currentHandler.seek(time);
      
      if (id) {
        this.websocketManager.sendCommandResult(id, result.success, result, this.activeSiteName);
      }
    } catch (error) {
      console.error('[CACP] Seek command failed:', error);
      if (id) {
        this.websocketManager.sendCommandResult(id, false, { error: error.message }, this.activeSiteName);
      }
    }
  }

  /**
   * Send connection handshake to DeskThing
   */
  sendConnectionHandshake() {
    if (this.activeSiteName && this.websocketManager.isConnected) {
      this.websocketManager.sendConnectionHandshake(this.activeSiteName);
    }
  }

  /**
   * Set up URL change listener for single-page applications
   */
  setupURLChangeListener() {
    // Listen for pushState/replaceState changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.handleURLChange();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.handleURLChange();
    };

    // Listen for popstate events
    window.addEventListener('popstate', () => {
      this.handleURLChange();
    });
  }

  /**
   * Handle URL changes
   */
  async handleURLChange() {
    console.log('[CACP] URL changed, re-detecting site');
    await this.detectCurrentSite();
  }

  /**
   * WebSocket connection established
   */
  onWebSocketConnected() {
    console.log('[CACP] WebSocket connected');
    this.sendConnectionHandshake();
    this.notifyPopupStatusUpdate();
  }

  /**
   * WebSocket connection lost
   */
  onWebSocketDisconnected() {
    console.log('[CACP] WebSocket disconnected');
    this.notifyPopupStatusUpdate();
    // Connection will auto-reconnect via WebSocketManager
  }

  /**
   * WebSocket error occurred
   */
  onWebSocketError(error) {
    console.error('[CACP] WebSocket error:', error);
    this.notifyPopupStatusUpdate();
  }

  /**
   * Notify popup of status update
   */
  notifyPopupStatusUpdate() {
    try {
      chrome.runtime.sendMessage({
        type: 'cacp-status-update',
        status: this.getStatus()
      }).catch(() => {
        // Popup may not be open, ignore error
      });
    } catch (error) {
      // Popup communication not available, ignore
    }
  }

  /**
   * Notify popup of media update
   */
  notifyPopupMediaUpdate(mediaData) {
    try {
      chrome.runtime.sendMessage({
        type: 'media-update',
        data: mediaData
      }).catch(() => {
        // Popup may not be open, ignore error
      });
    } catch (error) {
      // Popup communication not available, ignore
    }
  }

  /**
   * Get current system status
   * @returns {Object} System status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      activeSiteName: this.activeSiteName,
      hasActiveHandler: !!this.currentHandler,
      lastMediaData: this.lastMediaData,
      lastTimeData: this.lastTimeData,
      siteDetector: this.siteDetector.getStatus(),
      priorityManager: this.priorityManager.getStatus(),
      websocketManager: this.websocketManager.getStatus(),
      monitoring: {
        mediaInterval: !!this.mediaUpdateInterval,
        timeInterval: !!this.timeUpdateInterval
      }
    };
  }

  /**
   * Shutdown CACP system
   */
  shutdown() {
    console.log('[CACP] Shutting down...');
    
    this.stopMonitoring();
    this.websocketManager.disconnect();
    this.currentHandler = null;
    this.activeSiteName = null;
    this.isInitialized = false;
    
    console.log('[CACP] Shutdown complete');
  }
}

// Initialize CACP when script loads
let cacpInstance = null;

async function initializeCACP() {
  try {
    if (cacpInstance) {
      console.log('[CACP] Already initialized');
      return;
    }

    cacpInstance = new CACP();
    await cacpInstance.initialize();

    // Make CACP available globally for debugging
    window.CACP = cacpInstance;

  } catch (error) {
    console.error('[CACP] Failed to initialize:', error);
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCACP);
} else {
  initializeCACP();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (cacpInstance) {
    cacpInstance.shutdown();
  }
});

export default CACP;
