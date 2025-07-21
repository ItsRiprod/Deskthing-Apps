/**
 * SoundCloud App Tester - Popup Script
 * Tests Chrome Extension → DeskThing App Integration
 */

// Get version dynamically from manifest
const EXTENSION_VERSION = chrome.runtime.getManifest().version;
let currentMedia = null;
let isPlaying = false;
let logs = [];
let ws = null;
let reconnectTimer = null;
let currentTab = null;

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
  resultEl.textContent = message;
  resultEl.className = `command-result ${isSuccess ? 'success' : 'error'}`;
  
  setTimeout(() => {
    resultEl.style.display = 'none';
  }, 3000);
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
      document.getElementById('status').className = 'status connected';
      document.getElementById('statusText').textContent = 'Connected to DeskThing';
      
      // Send connection message
      const connectionMessage = {
        type: 'connection',
        source: 'chrome-extension-popup',
        version: EXTENSION_VERSION,
        message: 'Popup tester connected',
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
      document.getElementById('status').className = 'status disconnected';
      document.getElementById('statusText').textContent = 'Disconnected';
      
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
    };
    
  } catch (error) {
    log(`❌ Connection failed: ${error.message}`);
    showCommandResult('Failed to connect to DeskThing', false);
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
        source: 'popup-test'
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
  
  // Update artwork
  const artworkEl = document.getElementById('artwork');
  if (media.artwork) {
    artworkEl.src = media.artwork;
    artworkEl.className = 'artwork';
  } else {
    artworkEl.className = 'artwork hidden';
  }
  
  // Update time info
  document.getElementById('currentTime').textContent = formatTime(media.position);
  document.getElementById('totalTime').textContent = formatTime(media.duration);
  
  // Update progress bar
  const progress = media.duration > 0 ? (media.position / media.duration) * 100 : 0;
  document.getElementById('progressFill').style.width = `${progress}%`;
  
  // Update play state
  isPlaying = media.isPlaying;
  document.getElementById('playState').textContent = isPlaying ? '✅' : '❌';
  document.getElementById('playPauseBtn').textContent = isPlaying ? '⏸️' : '▶️';
  
  // Update source
  document.getElementById('source').textContent = media.source || 'Page';
  
  // Update debug info
  updateDebugInfo(media);
  
  currentMedia = media;
}

function updateDebugInfo(media) {
  const debugContent = document.getElementById('debugContent');
  if (debugContent && media) {
    debugContent.innerHTML = `
      <strong>Extension:</strong> v${EXTENSION_VERSION}<br>
      <strong>WebSocket:</strong> ${ws && ws.readyState === WebSocket.OPEN ? 'Connected' : 'Disconnected'}<br>
      <strong>Title:</strong> ${media.title || 'N/A'}<br>
      <strong>Artist:</strong> ${media.artist || 'N/A'}<br>
      <strong>Album:</strong> ${media.album || 'N/A'}<br>
      <strong>Duration:</strong> ${media.duration || 0}s<br>
      <strong>Position:</strong> ${media.position || 0}s<br>
      <strong>Playing:</strong> ${media.isPlaying ? 'Yes' : 'No'}<br>
      <strong>Source:</strong> ${media.source || 'N/A'}<br>
      <strong>Has Artwork:</strong> ${media.artwork ? 'Yes' : 'No'}<br>
      <strong>Timestamp:</strong> ${new Date().toLocaleTimeString()}
    `;
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
  } else if (message.type === 'websocket-status') {
    log(`🔌 WebSocket status: ${message.status}`);
  }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  log(`☁️ SoundCloud App Tester v${EXTENSION_VERSION} opened`);
  
  // Update version display
  document.getElementById('version').textContent = `v${EXTENSION_VERSION} - Direct Integration`;
  
  // Set up event listeners
  document.getElementById('prevBtn').addEventListener('click', () => sendControlCommand('previoustrack'));
  document.getElementById('playPauseBtn').addEventListener('click', () => sendControlCommand(isPlaying ? 'pause' : 'play'));
  document.getElementById('nextBtn').addEventListener('click', () => sendControlCommand('nexttrack'));
  
  // Test buttons
  document.getElementById('testPlayBtn').addEventListener('click', () => sendControlCommand('play'));
  document.getElementById('testPauseBtn').addEventListener('click', () => sendControlCommand('pause'));
  document.getElementById('testPrevBtn').addEventListener('click', () => sendControlCommand('previoustrack'));
  document.getElementById('testNextBtn').addEventListener('click', () => sendControlCommand('nexttrack'));
  
  // Main controls
  document.getElementById('refreshBtn').addEventListener('click', extractMediaNow);
  document.getElementById('connectBtn').addEventListener('click', connectToDeskThing);
  document.getElementById('extractBtn').addEventListener('click', extractMediaNow);
  document.getElementById('clearLogsBtn').addEventListener('click', clearLogs);
  document.getElementById('debugToggle').addEventListener('click', toggleDebug);
  document.getElementById('copyLogsBtn').addEventListener('click', copyLogs);
  
  // Auto-connect to DeskThing
  connectToDeskThing();
  
  // Request initial media data
  setTimeout(extractMediaNow, 1000);
  
  // Cleanup when popup closes
  window.addEventListener('beforeunload', cleanup);
  
  log('✅ Popup initialized - ready for testing');
}); 