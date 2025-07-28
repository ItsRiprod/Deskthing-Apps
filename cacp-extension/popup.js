/**
 * CACP (Chrome Audio Control Platform) - Popup Script
 * Enhanced from SoundCloud popup with multi-site capabilities
 */

// Get version dynamically from manifest
const EXTENSION_VERSION = chrome.runtime.getManifest().version;
let currentMedia = null;
let isPlaying = false;
let logs = [];
let ws = null;
let reconnectTimer = null;
let currentTab = null;
let cacpStatus = null;

function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  logs.unshift(`[${timestamp}] ${message}`);
  if (logs.length > 100) logs.pop();
  
  const logsEl = document.getElementById('logs');
  if (logsEl) {
    const copyButton = '<button class="copy-button" id="copyLogsBtn" title="Copy all logs">📋</button>';
    logsEl.innerHTML = copyButton + logs.slice(0, 20).join('\n');
    logsEl.scrollTop = 0;
    
    // Re-attach copy button listener after updating innerHTML
    const copyBtn = document.getElementById('copyLogsBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', copyLogs);
    }
  }
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showCommandResult(message, isSuccess = true) {
  const resultEl = document.getElementById('commandResult');
  if (resultEl) {
    resultEl.textContent = message;
    resultEl.className = `command-result ${isSuccess ? 'success' : 'error'}`;
    
    setTimeout(() => {
      resultEl.style.display = 'none';
    }, 3000);
  }
}

function connectToDeskThing() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    log('✅ Already connected to DeskThing');
    return;
  }
  
  try {
    log('🔌 Connecting to DeskThing app (localhost:8081)...');
    ws = new WebSocket('ws://localhost:8081');
    
    ws.onopen = function() {
      log('✅ Connected to DeskThing app WebSocket');
      updateWebSocketStatus('Connected', 'connected');
      
      // Send connection message (CACP version)
      const connectionMessage = {
        type: 'connection',
        source: 'cacp-extension-popup',
        version: EXTENSION_VERSION,
        message: 'CACP Popup connected',
        timestamp: Date.now()
      };
      ws.send(JSON.stringify(connectionMessage));
      
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };
    
    ws.onmessage = function(event) {
      try {
        const message = JSON.parse(event.data);
        log(`📨 DeskThing: ${message.type || 'unknown message'}`);
        
        if (message.type === 'media-command') {
          log(`🎮 Command from DeskThing: ${message.action}`);
          showCommandResult(`Command received: ${message.action}`, true);
        }
      } catch (error) {
        log(`❌ Message parse error: ${error.message}`);
      }
    };
    
    ws.onclose = function() {
      log('❌ DeskThing connection closed');
      updateWebSocketStatus('Disconnected', 'disconnected');
      
      // Auto-reconnect after 3 seconds
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          log('🔄 Attempting to reconnect...');
          connectToDeskThing();
        }, 3000);
      }
    };
    
    ws.onerror = function(error) {
      log(`❌ WebSocket error: ${error.message || 'Connection failed'}`);
      showCommandResult('Connection to DeskThing failed', false);
      updateWebSocketStatus('Error', 'disconnected');
    };
    
  } catch (error) {
    log(`❌ Connection failed: ${error.message}`);
    showCommandResult('Failed to connect to DeskThing', false);
    updateWebSocketStatus('Failed', 'disconnected');
  }
}

async function getCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    return tab;
  } catch (error) {
    log(`❌ Failed to get current tab: ${error.message}`);
    return null;
  }
}

async function sendMessageToContentScript(message) {
  try {
    const tab = await getCurrentTab();
    if (!tab) {
      throw new Error('No active tab found');
    }
    
    const response = await chrome.tabs.sendMessage(tab.id, message);
    return response;
  } catch (error) {
    log(`❌ Content script message failed: ${error.message}`);
    showCommandResult('Failed to communicate with page', false);
    throw error;
  }
}

async function getCacpStatus() {
  try {
    // Try to get CACP status from content script
    const response = await sendMessageToContentScript({
      type: 'get-cacp-status',
      timestamp: Date.now()
    });
    
    if (response && response.status) {
      return response.status;
    }
    
    // Fallback: try to get status from window.CACP if available
    const cacpResponse = await sendMessageToContentScript({
      type: 'get-status',
      timestamp: Date.now()
    });
    
    return cacpResponse;
  } catch (error) {
    log(`⚠️ CACP status unavailable: ${error.message}`);
    return null;
  }
}

async function extractMediaNow() {
  try {
    log('🎵 Requesting immediate media extraction...');
    const response = await sendMessageToContentScript({
      type: 'extract-media',
      timestamp: Date.now()
    });
    
    if (response && response.success) {
      log('✅ Media extraction triggered');
      showCommandResult('Media extraction requested', true);
    } else {
      log('⚠️ No media found on page');
      showCommandResult('No media detected on current page', false);
    }
  } catch (error) {
    log(`❌ Media extraction failed: ${error.message}`);
  }
}

async function sendControlCommand(action) {
  try {
    log(`🎮 Sending control command: ${action}`);
    
    // Send to content script first
    await sendMessageToContentScript({
      type: 'media-control',
      action: action,
      timestamp: Date.now()
    });
    
    // Also send via WebSocket if connected (for testing DeskThing response)
    if (ws && ws.readyState === WebSocket.OPEN) {
      const command = {
        type: 'media-command',
        action: action,
        timestamp: Date.now(),
        source: 'cacp-popup-test'
      };
      ws.send(JSON.stringify(command));
    }
    
    log(`✅ Control command sent: ${action}`);
    showCommandResult(`Command sent: ${action}`, true);
  } catch (error) {
    log(`❌ Control command failed: ${error.message}`);
    showCommandResult(`Failed to send ${action} command`, false);
  }
}

function updateMediaDisplay(media) {
  if (!media) {
    document.getElementById('mediaInfo').className = 'media-info hidden';
    return;
  }
  
  document.getElementById('mediaInfo').className = 'media-info';
  document.getElementById('trackTitle').textContent = media.title || 'Unknown Track';
  document.getElementById('trackArtist').textContent = media.artist || 'Unknown Artist';
  document.getElementById('trackAlbum').textContent = media.album || '';
  
  // Update site badge
  const siteBadge = document.getElementById('site-badge');
  const siteName = media.site || 'Unknown';
  siteBadge.textContent = siteName;
  siteBadge.className = `site-badge ${siteName.toLowerCase()}`;
  
  // Update artwork
  const artworkEl = document.getElementById('artwork');
  if (media.artwork && media.artwork.length > 0) {
    artworkEl.src = media.artwork[0];
    artworkEl.className = 'artwork';
  } else {
    artworkEl.className = 'artwork hidden';
  }
  
  // Update time info
  document.getElementById('currentTime').textContent = formatTime(media.currentTime || media.position);
  document.getElementById('totalTime').textContent = formatTime(media.duration);
  
  // Update progress bar
  const currentTime = media.currentTime || media.position || 0;
  const progress = media.duration > 0 ? (currentTime / media.duration) * 100 : 0;
  document.getElementById('progressFill').style.width = `${progress}%`;
  
  // Update play state
  isPlaying = media.isPlaying;
  document.getElementById('playState').textContent = isPlaying ? '✅' : '❌';
  document.getElementById('playPauseBtn').textContent = isPlaying ? '⏸️' : '▶️';
  
  // Update source
  document.getElementById('source').textContent = media.site || 'Page';
  
  currentMedia = media;
}

function updateSystemStatus(status) {
  if (!status) return;
  
  cacpStatus = status;
  
  // Update orchestrator status
  if (status.isInitialized) {
    updateOrchestratorStatus('Running', 'connected');
  } else {
    updateOrchestratorStatus('Not initialized', 'disconnected');
  }
  
  // Update handler status
  if (status.activeSiteName) {
    updateHandlerStatus(status.activeSiteName, 'connected');
  } else if (status.hasActiveHandler) {
    updateHandlerStatus('Active', 'partial');
  } else {
    updateHandlerStatus('None', 'disconnected');
  }
  
  // Update detection status
  const matchedCount = status.siteDetector?.matchedHandlers?.length || 0;
  const registeredCount = status.siteDetector?.registeredHandlers?.length || 0;
  
  if (matchedCount > 0) {
    updateDetectionStatus(`${matchedCount} detected`, 'connected');
  } else if (registeredCount > 0) {
    updateDetectionStatus('No matches', 'partial');
  } else {
    updateDetectionStatus('No handlers', 'disconnected');
  }
  
  // Update site detection panel
  updateSiteDetectionPanel(status);
  
  // Update debug info
  updateDebugInfo(status);
}

function updateSiteDetectionPanel(status) {
  const detectedSitesEl = document.getElementById('detected-sites');
  const autoSwitchEl = document.getElementById('auto-switch-status');
  const conflictEl = document.getElementById('conflict-status');
  
  if (!status || !status.siteDetector) {
    detectedSitesEl.innerHTML = `
      <div class="site inactive">
        <span>CACP not initialized</span>
        <span class="site-priority">Refresh page</span>
      </div>
    `;
    return;
  }
  
  const matchedHandlers = status.siteDetector.matchedHandlers || [];
  const activeSites = status.siteDetector.activeSites || [];
  const registeredHandlers = status.siteDetector.registeredHandlers || [];
  
  if (matchedHandlers.length === 0) {
    detectedSitesEl.innerHTML = `
      <div class="site inactive">
        <span>No supported sites detected</span>
        <span class="site-priority">${registeredHandlers.length} handlers registered</span>
      </div>
    `;
  } else {
    const sitesHtml = matchedHandlers.map((handler, index) => {
      const isActive = activeSites.includes(handler.name);
      const isPrimary = index === 0;
      const className = isActive ? 'active' : (isPrimary ? 'detected' : 'inactive');
      
      return `
        <div class="site ${className}">
          <span>${handler.name} ${isPrimary ? '(Primary)' : ''}</span>
          <span class="site-priority">Priority: ${handler.priority}</span>
        </div>
      `;
    }).join('');
    
    detectedSitesEl.innerHTML = sitesHtml;
  }
  
  // Update auto-switch status
  const autoSwitchEnabled = status.priorityManager?.autoSwitchEnabled ?? true;
  autoSwitchEl.textContent = `Auto-Switch: ${autoSwitchEnabled ? 'ON' : 'OFF'}`;
  
  // Update conflict status
  const activeCount = activeSites.length;
  if (activeCount > 1) {
    conflictEl.textContent = `Conflicts: ${activeCount} active sites`;
    conflictEl.style.color = '#ff9800';
  } else {
    conflictEl.textContent = 'Conflicts: None';
    conflictEl.style.color = '#ccc';
  }
}

function updateWebSocketStatus(text, status) {
  document.getElementById('websocket-value').textContent = text;
  document.getElementById('websocket-status').className = `status ${status}`;
}

function updateOrchestratorStatus(text, status) {
  document.getElementById('orchestrator-value').textContent = text;
  document.getElementById('orchestrator-status').className = `status ${status}`;
}

function updateHandlerStatus(text, status) {
  document.getElementById('handler-value').textContent = text;
  document.getElementById('handler-status').className = `status ${status}`;
}

function updateDetectionStatus(text, status) {
  document.getElementById('detection-value').textContent = text;
  document.getElementById('detection-status').className = `status ${status}`;
}

function updateDebugInfo(status) {
  const debugContent = document.getElementById('debugContent');
  if (debugContent) {
    const wsStatus = ws && ws.readyState === WebSocket.OPEN ? 'Connected' : 'Disconnected';
    const mediaTitle = currentMedia?.title || 'N/A';
    const mediaArtist = currentMedia?.artist || 'N/A';
    const mediaSite = currentMedia?.site || 'N/A';
    
    let cacpInfo = '';
    if (status) {
      cacpInfo = `
        <strong>CACP System:</strong><br>
        • Initialized: ${status.isInitialized ? 'Yes' : 'No'}<br>
        • Active Site: ${status.activeSiteName || 'None'}<br>
        • Registered Handlers: ${status.siteDetector?.registeredHandlers?.length || 0}<br>
        • Matched Handlers: ${status.siteDetector?.matchedHandlers?.length || 0}<br>
        • Active Sites: ${status.siteDetector?.activeSites?.length || 0}<br>
        • Auto-Switch: ${status.priorityManager?.autoSwitchEnabled ? 'Yes' : 'No'}<br><br>
      `;
    }
    
    debugContent.innerHTML = `
      <strong>Extension:</strong> CACP v${EXTENSION_VERSION}<br>
      <strong>WebSocket:</strong> ${wsStatus}<br>
      <strong>Tab URL:</strong> ${currentTab?.url?.substring(0, 50) || 'N/A'}...<br><br>
      ${cacpInfo}
      <strong>Current Media:</strong><br>
      • Title: ${mediaTitle}<br>
      • Artist: ${mediaArtist}<br>
      • Site: ${mediaSite}<br>
      • Playing: ${currentMedia?.isPlaying ? 'Yes' : 'No'}<br>
      • Duration: ${currentMedia?.duration || 0}s<br>
      • Position: ${currentMedia?.currentTime || currentMedia?.position || 0}s<br>
      • Has Artwork: ${currentMedia?.artwork?.length > 0 ? 'Yes' : 'No'}<br><br>
      <strong>Timestamp:</strong> ${new Date().toLocaleTimeString()}
    `;
  }
}

async function loadStatus() {
  try {
    const tab = await getCurrentTab();
    if (!tab || !tab.url) {
      showError('No active tab found');
      return;
    }
    
    // Check if current tab is a supported site
    const supportedSites = [
      'soundcloud.com',
      'youtube.com', 
      'music.youtube.com',
      'open.spotify.com',
      'music.apple.com'
    ];
    
    const isSupported = supportedSites.some(site => tab.url.includes(site));
    
    if (!isSupported) {
      updateDetectionStatus('Unsupported site', 'disconnected');
      updateOrchestratorStatus('N/A', 'disconnected');
      updateHandlerStatus('N/A', 'disconnected');
      log(`ℹ️ Current site not supported: ${tab.url}`);
      return;
    }
    
    // Get CACP system status
    const status = await getCacpStatus();
    if (status) {
      log('✅ CACP status received');
      updateSystemStatus(status);
      
      // Update media display if available
      if (status.lastMediaData) {
        updateMediaDisplay(status.lastMediaData);
      }
    } else {
      log('⚠️ CACP not responding - may need initialization');
      updateOrchestratorStatus('Not responding', 'disconnected');
      showCommandResult('CACP not responding. Try refreshing the page.', false);
    }
    
  } catch (error) {
    log(`❌ Failed to load status: ${error.message}`);
    showError('Failed to load status: ' + error.message);
  }
}

function toggleDebug() {
  const debugInfo = document.getElementById('debugInfo');
  if (debugInfo.style.display === 'none') {
    debugInfo.style.display = 'block';
    log('📊 Debug panel opened');
  } else {
    debugInfo.style.display = 'none';
  }
}

function clearLogs() {
  logs = [];
  const logsEl = document.getElementById('logs');
  logsEl.innerHTML = '<button class="copy-button" id="copyLogsBtn" title="Copy all logs">📋</button>';
  // Re-attach copy button listener
  document.getElementById('copyLogsBtn').addEventListener('click', copyLogs);
  log('🗑️ Logs cleared');
}

function copyLogs() {
  const logText = logs.join('\n');
  navigator.clipboard.writeText(logText).then(() => {
    const copyBtn = document.getElementById('copyLogsBtn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✅';
    copyBtn.style.background = '#28a745';
    
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.background = '#444';
    }, 1000);
    
    log('📋 Logs copied to clipboard');
  }).catch(err => {
    log('❌ Failed to copy logs: ' + err.message);
  });
}

function showError(message) {
  const errorElement = document.getElementById('error');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  
  document.getElementById('loading').style.display = 'none';
  document.getElementById('content').style.display = 'block';
}

function clearError() {
  const errorElement = document.getElementById('error');
  errorElement.style.display = 'none';
}

function cleanup() {
  if (ws) {
    ws.close();
    ws = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

// Listen for content script messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'media-update') {
    log(`🎵 Media update: ${message.data?.title || 'Unknown'}`);
    updateMediaDisplay(message.data);
  } else if (message.type === 'cacp-status-update') {
    log(`🎯 CACP status update`);
    updateSystemStatus(message.status);
  } else if (message.type === 'websocket-status') {
    log(`🔌 WebSocket status: ${message.status}`);
  }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  log(`🎯 CACP Popup v${EXTENSION_VERSION} opened`);
  
  // Update version display
  document.getElementById('version').textContent = `v${EXTENSION_VERSION} - Universal Platform`;
  
  // Set up event listeners
  
  // Media controls
  document.getElementById('prevBtn')?.addEventListener('click', () => sendControlCommand('previoustrack'));
  document.getElementById('playPauseBtn')?.addEventListener('click', () => sendControlCommand(isPlaying ? 'pause' : 'play'));
  document.getElementById('nextBtn')?.addEventListener('click', () => sendControlCommand('nexttrack'));
  
  // Test controls
  document.getElementById('testPlayBtn')?.addEventListener('click', () => sendControlCommand('play'));
  document.getElementById('testPauseBtn')?.addEventListener('click', () => sendControlCommand('pause'));
  document.getElementById('testPrevBtn')?.addEventListener('click', () => sendControlCommand('previoustrack'));
  document.getElementById('testNextBtn')?.addEventListener('click', () => sendControlCommand('nexttrack'));
  
  // CACP controls
  document.getElementById('refreshBtn')?.addEventListener('click', loadStatus);
  document.getElementById('connectBtn')?.addEventListener('click', connectToDeskThing);
  document.getElementById('settingsBtn')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
  
  // Main controls
  document.getElementById('extractBtn')?.addEventListener('click', extractMediaNow);
  document.getElementById('clearLogsBtn')?.addEventListener('click', clearLogs);
  
  // Debug controls
  document.getElementById('debugToggle')?.addEventListener('click', toggleDebug);
  document.getElementById('copyLogsBtn')?.addEventListener('click', copyLogs);
  
  // Initialize
  clearError();
  
  // Auto-connect to DeskThing
  connectToDeskThing();
  
  // Load initial status
  setTimeout(async () => {
    await loadStatus();
    
    // Hide loading, show content
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';
    
    log('✅ CACP Popup initialized - ready for multi-site control');
  }, 1000);
  
  // Cleanup when popup closes
  window.addEventListener('beforeunload', cleanup);
});

// Auto-refresh status every 3 seconds
setInterval(() => {
  if (document.getElementById('content').style.display !== 'none') {
    loadStatus();
  }
}, 3000); 