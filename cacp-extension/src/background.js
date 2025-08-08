/**
 * CACP Background Script - Global Media Manager
 * Coordinates multi-tab media control across different music sites
 */

import logger from '@crimsonsunset/jsg-logger';
// Bridge connection to DeskThing shallow app server
let ws = null; // WebSocket
let wsConnected = false;
let reconnectDelayMs = 1000;
const MAX_RECONNECT_DELAY_MS = 15000;
const DEFAULT_WS_URL = 'ws://127.0.0.1:8081';

// Initialize logger
const backgroundLogger = logger.cacp.child({ component: 'background' });

/**
 * Global Media State Manager
 * Tracks all active media sources across all browser tabs
 */
class GlobalMediaManager {
  constructor() {
    this.activeSources = new Map(); // tabId -> MediaSource
    this.currentPriority = null; // Currently highest priority source
    this.siteHandlers = new Map(); // tabId -> handler info
    this.updateInterval = null;
    
    backgroundLogger.info('GlobalMediaManager initialized');
    this.startPeriodicUpdates();
  }

  /**
   * Register a media source from a tab
   */
  registerSource(tabId, sourceData) {
    const source = {
      tabId,
      site: sourceData.site,
      isActive: sourceData.isActive,
      trackInfo: sourceData.trackInfo,
      isPlaying: sourceData.isPlaying,
      canControl: sourceData.canControl,
      lastUpdate: Date.now(),
      priority: sourceData.priority || 1
    };

    this.activeSources.set(tabId, source);
    this.updatePriority();
    
    backgroundLogger.debug('Media source registered', {
      tabId,
      site: source.site,
      isActive: source.isActive,
      trackTitle: source.trackInfo?.title
    });

    // Notify popup if open
    this.notifyPopup('sources-updated', this.getSourcesList());
    // Push current priority snapshot to app bridge
    pushPriorityToBridge(this.currentPriority);
  }

  /**
   * Update existing source
   */
  updateSource(tabId, updates) {
    const source = this.activeSources.get(tabId);
    if (source) {
      Object.assign(source, updates, { lastUpdate: Date.now() });
      this.updatePriority();
      
      backgroundLogger.trace('Media source updated', {
        tabId,
        updates: Object.keys(updates)
      });

      this.notifyPopup('sources-updated', this.getSourcesList());
      // Push current priority snapshot to app bridge
      pushPriorityToBridge(this.currentPriority);
    }
  }

  /**
   * Remove a media source (tab closed or no longer has media)
   */
  removeSource(tabId) {
    const source = this.activeSources.get(tabId);
    if (source) {
      this.activeSources.delete(tabId);
      this.updatePriority();
      
      backgroundLogger.debug('Media source removed', {
        tabId,
        site: source.site
      });

      this.notifyPopup('sources-updated', this.getSourcesList());
    }
  }

  /**
   * Update priority ranking - determine which source should be the primary
   */
  updatePriority() {
    let highestPriority = null;
    let highestScore = -1;

    for (const source of this.activeSources.values()) {
      // Calculate priority score
      let score = source.priority || 1;
      
      // Boost score for actively playing media
      if (source.isPlaying) score += 10;
      
      // Boost score for sources that can be controlled
      if (source.canControl) score += 5;
      
      // Boost score for active/ready sources
      if (source.isActive) score += 2;

      if (score > highestScore) {
        highestScore = score;
        highestPriority = source;
      }
    }

    const previousPriority = this.currentPriority?.tabId;
    this.currentPriority = highestPriority;

    if (previousPriority !== highestPriority?.tabId) {
      backgroundLogger.info('Priority changed', {
        previousTab: previousPriority,
        newTab: highestPriority?.tabId,
        newSite: highestPriority?.site,
        score: highestScore
      });

      this.notifyPopup('priority-changed', {
        currentPriority: highestPriority,
        allSources: this.getSourcesList()
      });
      // Push latest priority snapshot to app bridge
      pushPriorityToBridge(highestPriority);
    }
  }

  /**
   * Get formatted list of all sources for popup display
   */
  getSourcesList() {
    return Array.from(this.activeSources.values()).map(source => ({
      tabId: source.tabId,
      site: source.site,
      trackInfo: source.trackInfo,
      isPlaying: source.isPlaying,
      canControl: source.canControl,
      isActive: source.isActive,
      currentTime: source.currentTime || 0,
      duration: source.duration || 0,
      isPriority: source.tabId === this.currentPriority?.tabId,
      priority: source.priority,
      lastUpdate: source.lastUpdate
    }));
  }

  /**
   * Send control command to specific source or current priority
   */
  async sendControlCommand(command, tabId = null) {
    const targetTabId = tabId || this.currentPriority?.tabId;
    
    if (!targetTabId) {
      backgroundLogger.warn('No target tab for control command', { command });
      return { success: false, error: 'No active media source' };
    }

    try {
      const payload = { type: 'media-control', command };
      // Allow optional time param for seek
      if (command === 'seek' && typeof arguments[2] === 'number') {
        payload.time = arguments[2];
      }
      const response = await chrome.tabs.sendMessage(targetTabId, payload);

      backgroundLogger.debug('Control command sent', {
        command,
        targetTabId,
        success: response?.success
      });

      return response;
    } catch (error) {
      backgroundLogger.error('Failed to send control command', {
        command,
        targetTabId,
        error: error.message
      });
      
      // Remove source if tab is unreachable
      this.removeSource(targetTabId);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notify popup of changes
   */
  notifyPopup(type, data) {
    chrome.runtime.sendMessage({
      type: `popup-${type}`,
      data: data
    }).catch(() => {
      // Popup might not be open, which is fine
    });
  }

  /**
   * Clean up stale sources periodically
   */
  startPeriodicUpdates() {
    this.updateInterval = setInterval(() => {
      const now = Date.now();
      const staleThreshold = 30000; // 30 seconds

      for (const [tabId, source] of this.activeSources.entries()) {
        if (now - source.lastUpdate > staleThreshold) {
          backgroundLogger.debug('Removing stale source', { tabId, site: source.site });
          this.removeSource(tabId);
        }
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Get current state for popup
   */
  getCurrentState() {
    return {
      sources: this.getSourcesList(),
      currentPriority: this.currentPriority,
      totalSources: this.activeSources.size
    };
  }
}

// Initialize global media manager
const mediaManager = new GlobalMediaManager();

// Extension lifecycle handlers
backgroundLogger.info('CACP Background service worker started', {
  version: chrome.runtime.getManifest().version,
  timestamp: Date.now()
});

chrome.runtime.onInstalled.addListener((details) => {
  backgroundLogger.info('Extension lifecycle event', {
    reason: details.reason,
    previousVersion: details.previousVersion
  });
});

// Handle tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  mediaManager.removeSource(tabId);
  backgroundLogger.debug('Tab removed, cleaning up media source', { tabId });
});

// Enhanced message handling for global media control
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  
  backgroundLogger.debug('Message received', {
    type: message.type,
    tabId,
    hasData: !!message.data
  });

  switch (message.type) {
    case 'register-media-source':
      mediaManager.registerSource(tabId, message.data);
      sendResponse({ success: true });
      break;

    case 'update-media-source':
      mediaManager.updateSource(tabId, message.data);
      sendResponse({ success: true });
      break;

    case 'remove-media-source':
      mediaManager.removeSource(tabId);
      sendResponse({ success: true });
      break;

    case 'get-global-state':
      // Popup requesting current state
      sendResponse(mediaManager.getCurrentState());
      break;

    case 'control-media':
      // Popup sending control command (optional time for seek)
      mediaManager.sendControlCommand(message.command, message.tabId, message.time)
        .then(result => sendResponse(result));
      return true; // Async response

    case 'set-priority-source':
      // Popup manually setting priority
      const source = mediaManager.activeSources.get(message.tabId);
      if (source) {
        source.priority = 100; // Boost priority
        mediaManager.updatePriority();
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Source not found' });
      }
      break;

    case 'get-status':
      sendResponse({
        status: 'active',
        version: chrome.runtime.getManifest().version,
        activeSources: mediaManager.activeSources.size
      });
      break;

    default:
      backgroundLogger.warn('Unknown message type', { type: message.type });
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true; // Keep message channel open
});

// Keep service worker alive
let keepAliveInterval = setInterval(() => {
  chrome.runtime.getPlatformInfo(() => {});
}, 25000);

backgroundLogger.info('Global Media Controller ready');
backgroundLogger.debug('CACP Background Global Media Controller initialized'); 

// --------------- Bridge: WS client ----------------
function getBridgeUrl() {
  // Allow override via storage later; for now fixed default
  return DEFAULT_WS_URL;
}

function connectBridge() {
  try {
    const url = getBridgeUrl();
    ws = new WebSocket(url);

    ws.addEventListener('open', () => {
      wsConnected = true;
      reconnectDelayMs = 1000;
      backgroundLogger.info('Connected to CACP app bridge', { url });
      // Identify extension/version
      const hello = {
        type: 'connection',
        source: 'cacp-extension',
        version: chrome.runtime.getManifest().version,
        ts: Date.now()
      };
      try { ws.send(JSON.stringify(hello)); } catch {}
      // Send initial snapshot if available
      pushPriorityToBridge(mediaManager.currentPriority);
    });

    ws.addEventListener('close', () => {
      wsConnected = false;
      ws = null;
      backgroundLogger.warn('Bridge disconnected, scheduling reconnect', { reconnectDelayMs });
      setTimeout(connectBridge, reconnectDelayMs);
      reconnectDelayMs = Math.min(reconnectDelayMs * 2, MAX_RECONNECT_DELAY_MS);
    });

    ws.addEventListener('error', (e) => {
      backgroundLogger.warn('Bridge socket error', { message: e?.message || 'unknown' });
    });

    ws.addEventListener('message', async (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg?.type === 'media-command' && msg?.action) {
          // Map action names to our internal commands
          const action = String(msg.action).toLowerCase();
          switch (action) {
            case 'play':
              await mediaManager.sendControlCommand('play');
              break;
            case 'pause':
              await mediaManager.sendControlCommand('pause');
              break;
            case 'previoustrack':
            case 'previous':
              await mediaManager.sendControlCommand('previous');
              break;
            case 'nexttrack':
            case 'next':
              await mediaManager.sendControlCommand('next');
              break;
            case 'seek':
              if (typeof msg.time === 'number') {
                await mediaManager.sendControlCommand('seek', null, msg.time);
              }
              break;
            default:
              backgroundLogger.debug('Unknown bridge command', { action });
          }
        }
      } catch (err) {
        backgroundLogger.warn('Failed to process bridge message', { error: err?.message });
      }
    });
  } catch (e) {
    backgroundLogger.error('Failed to create bridge socket', { error: e?.message });
  }
}

function pushPriorityToBridge(priority) {
  if (!priority || !wsConnected || !ws) return;
  const track = priority.trackInfo || {};
  const mediaData = {
    type: 'mediaData',
    site: priority.site,
    sourceId: priority.tabId,
    data: {
      title: track.title,
      artist: track.artist,
      album: track.album || '',
      artwork: Array.isArray(track.artwork) && track.artwork.length ? track.artwork[0]?.src || track.artwork[0] : undefined,
      isPlaying: !!priority.isPlaying
    }
  };
  const timeupdate = {
    type: 'timeupdate',
    currentTime: priority.currentTime || 0,
    duration: priority.duration || 0,
    isPlaying: !!priority.isPlaying
  };
  try {
    ws.send(JSON.stringify(mediaData));
    ws.send(JSON.stringify(timeupdate));
  } catch {}
}

// Establish bridge connection at startup
connectBridge();