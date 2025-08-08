/**
 * CACP Extension Popup Interface
 * Testing and monitoring interface for Chrome extension
 */

import logger from '@crimsonsunset/jsg-logger';

// Get version dynamically from manifest
const EXTENSION_VERSION = chrome.runtime.getManifest().version;
let logs = [];

// Initialize popup logger
const popupLogger = logger.popup;

// Utility to format seconds to mm:ss
function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + String(r).padStart(2, '0');
}

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
    
    // Ensure debug logs panel starts expanded by default
    try {
      const debugInfo = document.getElementById('debugInfo');
      if (debugInfo) {
        debugInfo.classList.remove('hidden');
      }
    } catch {}

    // Start periodic updates
    this.startPeriodicUpdates();
    
    // Load initial state
    await this.refreshGlobalState();
    
    popupLogger.info('Popup interface ready');

    // Prime the log view so users see something immediately
    this.log('Popup opened (v' + EXTENSION_VERSION + ')');
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
    // Poll frequently; background will dedupe
    this.updateInterval = setInterval(() => {
      this.refreshGlobalState();
    }, 1000);
    // Subscribe to background push events even if popup reopens later
    chrome.runtime.sendMessage({ type: 'get-global-state' }).then(() => {}).catch(() => {});

    // Lifecycle diagnostics to catch the popup "dying" issue
    try {
      const start = Date.now();
      this.log('Popup heartbeat started');
      this.heartbeat = setInterval(() => {
        const aliveMs = Date.now() - start;
        if (aliveMs % 5000 < 1000) {
          // Log every ~5s without spamming
          popupLogger.trace('Popup heartbeat', { aliveMs });
        }
      }, 1000);

      // Log visibility changes; Chrome may suspend timers when hidden
      document.addEventListener('visibilitychange', () => {
        popupLogger.debug('Popup visibilitychange', { hidden: document.hidden });
      });

      // Log runtime disconnects which could kill messaging
      chrome.runtime.onDisconnect.addListener((port) => {
        popupLogger.warn('Popup runtime disconnect detected');
      });
    } catch {}
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
    const artwork = currentPriority?.trackInfo?.artwork?.[0]?.src || currentPriority?.trackInfo?.artwork?.[0] || '';
    const isPlaying = !!currentPriority?.isPlaying;
    const currentTime = currentPriority?.currentTime ?? 0;
    const duration = currentPriority?.duration ?? 0;
    const pct = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

    statusEl.innerHTML = '' +
      '<div class="status-item"><span class="status-label">Active Sources:</span><span class="status-value">' + totalSources + '</span></div>' +
      '<div class="status-item"><span class="status-label">Priority:</span><span class="status-value">' + prioritySite + '</span></div>' +
      '<div class="status-item" style="align-items:flex-start; gap:8px">' +
      '  <span class="status-label" style="margin-top:2px">Now Playing:</span>' +
      '  <span class="status-value" style="display:flex; align-items:center; gap:10px;">' +
      (artwork ? '<img src="' + artwork + '" alt="art" style="width:36px; height:36px; object-fit:cover; border-radius:4px; border:1px solid #333;" />' : '') +
      '    <div style="display:flex; flex-direction:column; gap:6px; min-width:220px;">' +
      '      <div>' + priorityTrack + '</div>' +
      '      <div style="height:6px; background:#333; border-radius:4px; overflow:hidden; position:relative;">' +
      '        <div style="position:absolute; left:0; top:0; bottom:0; width:' + pct + '%; background:' + (isPlaying ? '#00B894' : '#555') + ';"></div>' +
      '      </div>' +
      '      <div style="font-size:10px; color:#888">' + (formatTime(currentTime)) + ' / ' + (formatTime(duration)) + (isPlaying ? ' • Playing' : ' • Paused') + '</div>' +
      '    </div>' +
      '  </span>' +
      '</div>';
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
    const artwork = source.trackInfo?.artwork?.[0]?.src || source.trackInfo?.artwork?.[0] || '';
    const isPlaying = source.isPlaying;
    const canControl = source.canControl;
    const isActive = source.isActive;
    const pct = source.duration > 0 ? Math.round((source.currentTime / source.duration) * 100) : 0;
    
    const priorityBadge = isPriority ? '<span class="priority-badge">★ Priority</span>' : '';
    const statusIcon = isActive ? (isPlaying ? '▶️' : '⏸️') : '⏹️';
    const statusText = isActive ? (isPlaying ? 'Playing' : 'Paused') : 'Inactive';
    
    return '' +
      '<div class="source-item ' + (isPriority ? 'priority' : '') + ' ' + (isActive ? 'active' : 'inactive') + '" data-tab-id="' + source.tabId + '">' +
      '  <div class="source-header">' +
      '    <div class="source-info">' +
      '      <div class="source-site">' + source.site + ' ' + priorityBadge + '</div>' +
      '      <div class="source-status">' + statusIcon + ' ' + statusText + '</div>' +
      '    </div>' +
      '    <div class="source-controls">' + (canControl && isActive ? (
      '      <button class="control-btn prev-btn" data-command="previous" data-tab-id="' + source.tabId + '" title="Previous">⏮️</button>' +
      '      <button class="control-btn ' + (isPlaying ? 'pause-btn' : 'play-btn') + '" data-command="' + (isPlaying ? 'pause' : 'play') + '" data-tab-id="' + source.tabId + '" title="' + (isPlaying ? 'Pause' : 'Play') + '">' + (isPlaying ? '⏸️' : '▶️') + '</button>' +
      '      <button class="control-btn next-btn" data-command="next" data-tab-id="' + source.tabId + '" title="Next">⏭️</button>'
      ) : '<span class="no-controls">' + (!canControl ? 'No controls' : 'Not ready') + '</span>') +
      '    </div>' +
      '  </div>' +
      '  <div class="source-track" style="display:flex; gap:10px; align-items:center;">' +
      (artwork ? '<img src="' + artwork + '" alt="art" style="width:34px; height:34px; object-fit:cover; border-radius:4px; border:1px solid #333;" />' : '') +
      '    <div style="flex:1; min-width:120px;">' +
      '      <div class="track-title">' + trackTitle + '</div>' +
      '      <div class="track-artist">' + trackArtist + '</div>' +
      '      <div style="height:6px; background:#333; border-radius:4px; overflow:hidden; position:relative; margin-top:6px;">' +
      '        <div style="position:absolute; left:0; top:0; bottom:0; width:' + pct + '%; background:' + (isPlaying ? '#00B894' : '#555') + ';"></div>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      (!isPriority && isActive ? '<button class="set-priority-btn" data-tab-id="' + source.tabId + '">Set as Priority</button>' : '') +
      '</div>';
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
    if (this.heartbeat) {
      clearInterval(this.heartbeat);
    }
    popupLogger.debug('Popup cleanup complete');
  }
}

// Initialize popup when DOM is ready
let popupInstance = null;

const initializePopup = async () => {
  try {
    popupInstance = new CACPPopup();
    await popupInstance.initialize();
  } catch (error) {
    popupLogger.error('Failed to initialize CACP popup', {
      error: error.message,
      stack: error.stack
    });
  }
};

// Initialize when DOM loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
}

popupLogger.info('CACP popup script loaded');

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
