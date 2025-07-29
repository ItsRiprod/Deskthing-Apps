/**
 * CACP Popup Script - Global Media Controller Interface
 * 
 * Shows all active media sources across all tabs and provides centralized control
 */

import logger from './logger.js';

// Get version dynamically from manifest
const EXTENSION_VERSION = chrome.runtime.getManifest().version;
let logs = [];

// Initialize structured logger
const popupLogger = logger.popup;

class CACPPopup {
  constructor() {
    this.globalState = null;
    this.updateInterval = null;
    this.isRefreshing = false;
    
    popupLogger.info('CACP Popup initialized');
  }

  /**
   * Initialize popup interface
   */
  async initialize() {
    popupLogger.debug('Initializing popup interface');
    
    // Set up UI event listeners
    this.setupEventListeners();
    
    // Set version in UI
    this.updateVersionDisplay();
    
    // Start periodic updates
    this.startPeriodicUpdates();
    
    // Load initial state
    await this.refreshGlobalState();
    
    popupLogger.info('Popup interface ready');
  }

  /**
   * Set up event listeners for UI elements
   */
  setupEventListeners() {
    // Global control buttons
    const globalPlayBtn = document.getElementById('globalPlay');
    const globalPauseBtn = document.getElementById('globalPause');
    const globalNextBtn = document.getElementById('globalNext');
    const globalPrevBtn = document.getElementById('globalPrev');

    if (globalPlayBtn) globalPlayBtn.addEventListener('click', () => this.sendGlobalCommand('play'));
    if (globalPauseBtn) globalPauseBtn.addEventListener('click', () => this.sendGlobalCommand('pause'));
    if (globalNextBtn) globalNextBtn.addEventListener('click', () => this.sendGlobalCommand('next'));
    if (globalPrevBtn) globalPrevBtn.addEventListener('click', () => this.sendGlobalCommand('previous'));

    // Refresh button
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => this.refreshGlobalState());

    // Copy logs button
    const copyLogsBtn = document.getElementById('copyLogsBtn');
    if (copyLogsBtn) copyLogsBtn.addEventListener('click', () => this.copyLogs());

    // Debug toggle functionality
    const debugToggle = document.getElementById('debugToggle');
    const debugInfo = document.getElementById('debugInfo');
    if (debugToggle && debugInfo) {
      debugToggle.addEventListener('click', () => {
        debugInfo.classList.toggle('hidden');
      });
    }

    popupLogger.debug('Event listeners set up');
  }

  /**
   * Update version display
   */
  updateVersionDisplay() {
    const versionEl = document.getElementById('version');
    if (versionEl) {
      versionEl.textContent = `v${EXTENSION_VERSION}`;
    }
  }

  /**
   * Start periodic updates
   */
  startPeriodicUpdates() {
    this.updateInterval = setInterval(() => {
      this.refreshGlobalState();
    }, 3000); // Update every 3 seconds
  }

  /**
   * Get global media state from background script
   */
  async refreshGlobalState() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;

    try {
      const response = await chrome.runtime.sendMessage({ type: 'get-global-state' });
      
      if (response) {
        this.globalState = response;
        this.updateUI();
        
        popupLogger.trace('Global state updated', {
          sourceCount: response.sources?.length || 0,
          currentPriority: response.currentPriority?.site
        });
      }
    } catch (error) {
      this.log('Failed to get global state: ' + error.message, 'error');
      popupLogger.error('Failed to refresh global state', { error: error.message });
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Update the entire UI based on current global state
   */
  updateUI() {
    if (!this.globalState) {
      this.showNoSources();
      return;
    }

    const { sources, currentPriority, totalSources } = this.globalState;
    
    // Update status
    this.updateStatus(totalSources, currentPriority);
    
    // Update sources list
    this.updateSourcesList(sources);
    
    // Update global controls
    this.updateGlobalControls(currentPriority);
  }

  /**
   * Show no sources message
   */
  showNoSources() {
    const statusEl = document.getElementById('status');
    const sourcesListEl = document.getElementById('sourcesList');
    
    if (statusEl) {
      statusEl.innerHTML = '<div class="status-item"><span class="status-label">Status:</span><span class="status-value">No active media sources</span></div>';
    }
    
    if (sourcesListEl) {
      sourcesListEl.innerHTML = '<div class="no-sources"><p>🎵 No media detected</p><p>Open a supported music site in any tab to get started!</p><div class="supported-sites"><small>Supported: SoundCloud, YouTube, Spotify, Apple Music</small></div></div>';
    }

    // Disable global controls
    this.setGlobalControlsEnabled(false);
  }

  /**
   * Update status section
   */
  updateStatus(totalSources, currentPriority) {
    const statusEl = document.getElementById('status');
    if (!statusEl) return;

    const prioritySite = currentPriority ? currentPriority.site : 'None';
    const priorityTrack = currentPriority?.trackInfo?.title || 'No track';

    statusEl.innerHTML = '<div class="status-item"><span class="status-label">Active Sources:</span><span class="status-value">' + totalSources + '</span></div><div class="status-item"><span class="status-label">Priority:</span><span class="status-value">' + prioritySite + '</span></div><div class="status-item"><span class="status-label">Now Playing:</span><span class="status-value">' + priorityTrack + '</span></div>';
  }

  /**
   * Update sources list
   */
  updateSourcesList(sources) {
    const sourcesListEl = document.getElementById('sourcesList');
    if (!sourcesListEl) return;

    if (sources.length === 0) {
      this.showNoSources();
      return;
    }

    sourcesListEl.innerHTML = sources.map(source => this.createSourceItem(source)).join('');

    // Add event listeners to source controls
    sources.forEach(source => {
      this.attachSourceEventListeners(source.tabId);
    });
  }

  /**
   * Create HTML for a single source item
   */
  createSourceItem(source) {
    const isPriority = source.isPriority;
    const trackTitle = source.trackInfo?.title || 'Unknown Track';
    const trackArtist = source.trackInfo?.artist || 'Unknown Artist';
    const isPlaying = source.isPlaying;
    const canControl = source.canControl;
    const isActive = source.isActive;
    
    const priorityBadge = isPriority ? '<span class="priority-badge">★ Priority</span>' : '';
    const statusIcon = isActive ? (isPlaying ? '▶️' : '⏸️') : '⏹️';
    const statusText = isActive ? (isPlaying ? 'Playing' : 'Paused') : 'Inactive';
    
    return '<div class="source-item ' + (isPriority ? 'priority' : '') + ' ' + (isActive ? 'active' : 'inactive') + '" data-tab-id="' + source.tabId + '"><div class="source-header"><div class="source-info"><div class="source-site">' + source.site + ' ' + priorityBadge + '</div><div class="source-status">' + statusIcon + ' ' + statusText + '</div></div><div class="source-controls">' + (canControl && isActive ? '<button class="control-btn prev-btn" data-command="previous" data-tab-id="' + source.tabId + '" title="Previous">⏮️</button><button class="control-btn ' + (isPlaying ? 'pause-btn' : 'play-btn') + '" data-command="' + (isPlaying ? 'pause' : 'play') + '" data-tab-id="' + source.tabId + '" title="' + (isPlaying ? 'Pause' : 'Play') + '">' + (isPlaying ? '⏸️' : '▶️') + '</button><button class="control-btn next-btn" data-command="next" data-tab-id="' + source.tabId + '" title="Next">⏭️</button>' : '<span class="no-controls">' + (!canControl ? 'No controls' : 'Not ready') + '</span>') + '</div></div><div class="source-track"><div class="track-title">' + trackTitle + '</div><div class="track-artist">' + trackArtist + '</div></div>' + (!isPriority && isActive ? '<button class="set-priority-btn" data-tab-id="' + source.tabId + '">Set as Priority</button>' : '') + '</div>';
  }

  /**
   * Attach event listeners to source controls
   */
  attachSourceEventListeners(tabId) {
    // Control buttons
    const controlBtns = document.querySelectorAll('[data-tab-id="' + tabId + '"][data-command]');
    controlBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const command = e.target.dataset.command;
        const targetTabId = parseInt(e.target.dataset.tabId);
        this.sendSourceCommand(command, targetTabId);
      });
    });

    // Set priority button
    const priorityBtn = document.querySelector('.set-priority-btn[data-tab-id="' + tabId + '"]');
    if (priorityBtn) {
      priorityBtn.addEventListener('click', (e) => {
        const targetTabId = parseInt(e.target.dataset.tabId);
        this.setPriority(targetTabId);
      });
    }
  }

  /**
   * Update global controls based on priority source
   */
  updateGlobalControls(currentPriority) {
    const hasActivePriority = currentPriority && currentPriority.isActive;
    this.setGlobalControlsEnabled(hasActivePriority);

    if (hasActivePriority) {
      // Update play/pause button state
      const globalPlayBtn = document.getElementById('globalPlay');
      const globalPauseBtn = document.getElementById('globalPause');
      
      if (globalPlayBtn && globalPauseBtn) {
        if (currentPriority.isPlaying) {
          globalPlayBtn.style.display = 'none';
          globalPauseBtn.style.display = 'inline-block';
        } else {
          globalPlayBtn.style.display = 'inline-block';
          globalPauseBtn.style.display = 'none';
        }
      }
    }
  }

  /**
   * Enable/disable global control buttons
   */
  setGlobalControlsEnabled(enabled) {
    const globalControls = document.querySelectorAll('.global-controls button');
    globalControls.forEach(btn => {
      btn.disabled = !enabled;
    });
  }

  /**
   * Send command to highest priority source
   */
  async sendGlobalCommand(command) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'control-media',
        command: command
      });

      if (response.success) {
        this.log('Global ' + command + ' command sent successfully');
        // Refresh state to see changes
        setTimeout(() => this.refreshGlobalState(), 100);
      } else {
        this.log('Global ' + command + ' command failed: ' + response.error, 'error');
      }
    } catch (error) {
      this.log('Failed to send global ' + command + ' command: ' + error.message, 'error');
    }
  }

  /**
   * Send command to specific source
   */
  async sendSourceCommand(command, tabId) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'control-media',
        command: command,
        tabId: tabId
      });

      if (response.success) {
        this.log(command + ' command sent to tab ' + tabId);
        // Refresh state to see changes
        setTimeout(() => this.refreshGlobalState(), 100);
      } else {
        this.log(command + ' command failed for tab ' + tabId + ': ' + response.error, 'error');
      }
    } catch (error) {
      this.log('Failed to send ' + command + ' command to tab ' + tabId + ': ' + error.message, 'error');
    }
  }

  /**
   * Set a source as priority
   */
  async setPriority(tabId) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'set-priority-source',
        tabId: tabId
      });

      if (response.success) {
        this.log('Set tab ' + tabId + ' as priority source');
        this.refreshGlobalState();
      } else {
        this.log('Failed to set priority: ' + response.error, 'error');
      }
    } catch (error) {
      this.log('Failed to set priority for tab ' + tabId + ': ' + error.message, 'error');
    }
  }

  /**
   * Log message with timestamp
   */
  log(message, level = 'info', data = null) {
    const timestamp = new Date().toLocaleTimeString();
    logs.unshift('[' + timestamp + '] ' + message);
    if (logs.length > 100) logs.pop();
    
    // Also log to structured logger
    if (data) {
      popupLogger[level](message, data);
    } else {
      popupLogger[level](message);
    }
    
    this.updateLogsDisplay();
  }

  /**
   * Update logs display
   */
  updateLogsDisplay() {
    const logsEl = document.getElementById('logs');
    if (logsEl) {
      logsEl.textContent = logs.slice(0, 20).join('\n');
      logsEl.scrollTop = 0;
    }
  }

  /**
   * Copy all logs to clipboard
   */
  copyLogs() {
    const allLogs = logs.join('\n');
    navigator.clipboard.writeText(allLogs).then(() => {
      this.log('Logs copied to clipboard');
    }).catch(err => {
      this.log('Failed to copy logs: ' + err.message, 'error');
    });
  }

  /**
   * Cleanup when popup closes
   */
  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    popupLogger.debug('Popup cleanup complete');
  }
}

// Initialize popup when DOM is ready
let popupInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    popupInstance = new CACPPopup();
    await popupInstance.initialize();
  } catch (error) {
    console.error('Failed to initialize CACP popup:', error);
  }
});

// Cleanup on window unload
window.addEventListener('beforeunload', () => {
  if (popupInstance) {
    popupInstance.cleanup();
  }
});

// Listen for background script updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type.startsWith('popup-')) {
    // Handle real-time updates from background script
    if (popupInstance) {
      popupInstance.refreshGlobalState();
    }
  }
});

console.log('[CACP Popup] Global media controller popup loaded');
