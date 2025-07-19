/**
 * DeskThing Media Bridge - Popup Script
 * Enhanced with real-time WebSocket updates
 */

// Get version dynamically from manifest
const EXTENSION_VERSION = chrome.runtime.getManifest().version;
let dashboardUrl = 'http://localhost:8080';
let currentMedia = null;
let isPlaying = false;
let logs = [];
let refreshTimer = null;
let ws = null;
let reconnectTimer = null;

function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  logs.unshift(`[${timestamp}] ${message}`);
  if (logs.length > 50) logs.pop();
  
  const logsEl = document.getElementById('logs');
  if (logsEl) {
    logsEl.innerHTML = logs.slice(0, 10).join('\n');
  }
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function connectWebSocket() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return; // Already connected
  }
  
  try {
    log('🔌 Connecting to WebSocket...');
    ws = new WebSocket('ws://localhost:8080');
    
    ws.onopen = function() {
      log('✅ WebSocket connected - real-time updates enabled');
      document.getElementById('status').className = 'status connected';
      document.getElementById('statusText').textContent = 'Connected (Real-time)';
      
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };
    
    ws.onmessage = function(event) {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'media-update' && message.data) {
          console.log('🔍 [Popup] Raw WebSocket data:', message.data);
          console.log('🔍 [Popup] isPlaying value:', message.data.isPlaying, typeof message.data.isPlaying);
          
          currentMedia = message.data;
          updateMediaDisplay(message.data);
          log(`🎵 Real-time update: ${message.data.title}`);
        }
      } catch (error) {
        log(`❌ WebSocket message error: ${error.message}`);
      }
    };
    
    ws.onclose = function() {
      log('❌ WebSocket disconnected');
      document.getElementById('status').className = 'status disconnected';
      document.getElementById('statusText').textContent = 'WebSocket Disconnected';
      
      // Auto-reconnect after 3 seconds
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          log('🔄 Attempting WebSocket reconnect...');
          connectWebSocket();
        }, 3000);
      }
    };
    
    ws.onerror = function(error) {
      log(`❌ WebSocket error: ${error.message || 'Connection failed'}`);
    };
    
  } catch (error) {
    log(`❌ WebSocket connection failed: ${error.message}`);
    // Fallback to REST API mode
    fallbackToRestMode();
  }
}

function fallbackToRestMode() {
  log('📡 Falling back to REST API mode');
  document.getElementById('statusText').textContent = 'REST API Mode';
  checkStatus();
}

async function checkStatus() {
  try {
    log('Checking dashboard health...');
    const response = await fetch(`${dashboardUrl}/health`);
    if (response.ok) {
      const data = await response.json();
      document.getElementById('status').className = 'status connected';
      document.getElementById('statusText').textContent = `Connected (${data.status})`;
      document.getElementById('lastUpdate').textContent = `Last checked: ${new Date().toLocaleTimeString()}`;
      log('✅ Dashboard health check passed');
      
      // Get current media if not using WebSocket
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        await refreshMedia();
      }
    } else {
      throw new Error('Dashboard health check failed');
    }
  } catch (error) {
    document.getElementById('status').className = 'status disconnected';
    document.getElementById('statusText').textContent = 'Dashboard Not Reachable';
    document.getElementById('lastUpdate').textContent = `Error: ${error.message}`;
    document.getElementById('mediaInfo').className = 'media-info hidden';
    log(`❌ Health check failed: ${error.message}`);
  }
}

async function refreshMedia() {
  try {
    log('Refreshing media status...');
    const mediaResponse = await fetch(`${dashboardUrl}/api/media/status`);
    if (mediaResponse.ok) {
      const data = await mediaResponse.json();
      if (data.success && data.data) {
        currentMedia = data.data;
        updateMediaDisplay(data.data);
        log(`🎵 Media found: ${data.data.title}`);
      } else {
        currentMedia = null;
        document.getElementById('mediaInfo').className = 'media-info hidden';
        log('No media detected');
      }
    }
  } catch (error) {
    log(`❌ Media refresh failed: ${error.message}`);
  }
}

function updateMediaDisplay(media) {
  console.log('🎵 [Popup] updateMediaDisplay called with:', { isPlaying: media.isPlaying, title: media.title });
  
  document.getElementById('mediaInfo').className = 'media-info';
  document.getElementById('trackTitle').textContent = media.title || 'Unknown Track';
  document.getElementById('trackArtist').textContent = `by ${media.artist || 'Unknown Artist'}`;
  
  // Update time info
  document.getElementById('currentTime').textContent = formatTime(media.position);
  document.getElementById('totalTime').textContent = formatTime(media.duration);
  
  // Update progress bar
  const progress = media.duration > 0 ? (media.position / media.duration) * 100 : 0;
  document.getElementById('progressFill').style.width = `${progress}%`;
  
  // Update play state
  isPlaying = media.isPlaying;
  const playStateElement = document.getElementById('playState');
  const newPlayState = isPlaying ? '✅' : '❌';
  
  console.log('🎵 [Popup] Setting play state:', { isPlaying, newPlayState, element: !!playStateElement });
  
  if (playStateElement) {
    playStateElement.textContent = newPlayState;
  }
  document.getElementById('playPauseBtn').textContent = isPlaying ? '⏸️' : '▶️';
  
  // Update source
  document.getElementById('source').textContent = media.source || 'N/A';
  
  // Enable controls
  const buttons = document.querySelectorAll('.media-controls button');
  buttons.forEach(btn => btn.disabled = false);
  
  // Update debug info
  updateDebugInfo(media);
}

function updateDebugInfo(media) {
  const debugContent = document.getElementById('debugContent');
  if (debugContent) {
    const connectionType = ws && ws.readyState === WebSocket.OPEN ? 'WebSocket (Real-time)' : 'REST API';
    debugContent.innerHTML = `
      <strong>Extension:</strong> v${EXTENSION_VERSION}<br>
      <strong>Connection:</strong> ${connectionType}<br>
      <strong>Method:</strong> ${media.method || 'Event-driven'}<br>
      <strong>Duration:</strong> ${media.duration}s<br>
      <strong>Position:</strong> ${media.position}s<br>
      <strong>Source:</strong> ${media.source}<br>
      <strong>URL:</strong> ${media.url ? media.url.substring(0, 50) + '...' : 'N/A'}<br>
      <strong>Has Artwork:</strong> ${media.hasArtwork ? 'Yes' : 'No'}<br>
      <strong>Timestamp:</strong> ${media.timestamp ? new Date(media.timestamp).toLocaleTimeString() : 'N/A'}
    `;
  }
}

async function sendControl(action) {
  try {
    log(`Sending control: ${action}`);
    const response = await fetch(`${dashboardUrl}/api/media/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    
    if (response.ok) {
      log(`✅ Control sent: ${action}`);
      // If using REST mode, refresh after control command
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        if (refreshTimer) clearTimeout(refreshTimer);
        refreshTimer = setTimeout(refreshMedia, 500);
      }
    } else {
      log(`❌ Control failed: ${action}`);
    }
  } catch (error) {
    log(`❌ Control error: ${error.message}`);
  }
}

function togglePlayPause() {
  const action = isPlaying ? 'pause' : 'play';
  sendControl(action);
}

async function testConnection() {
  document.getElementById('statusText').textContent = 'Testing...';
  log('Manual connection test initiated');
  
  // Try WebSocket first, then fallback to REST
  connectWebSocket();
  setTimeout(checkStatus, 1000);
}

function openDashboard() {
  chrome.tabs.create({ url: dashboardUrl });
  log('Opening dashboard in new tab');
}

function toggleDebug() {
  const debugInfo = document.getElementById('debugInfo');
  if (debugInfo.style.display === 'none' || !debugInfo.style.display) {
    debugInfo.style.display = 'block';
    log('Debug panel opened');
  } else {
    debugInfo.style.display = 'none';
  }
}

// Manual refresh function for user-triggered updates
async function manualRefresh() {
  log('🔄 Manual refresh requested');
  if (ws && ws.readyState === WebSocket.OPEN) {
    log('Using WebSocket connection - data should update automatically');
  } else {
    await refreshMedia();
  }
}

// Cleanup function
function cleanup() {
  if (ws) {
    ws.close();
    ws = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  log(`Extension popup opened (v${EXTENSION_VERSION}) - Real-time WebSocket Mode`);
  
  // Update version display
  document.getElementById('version').textContent = `Version ${EXTENSION_VERSION} Enhanced (Real-time)`;
  
  // Set up event listeners
  document.getElementById('prevBtn').addEventListener('click', () => sendControl('previoustrack'));
  document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
  document.getElementById('nextBtn').addEventListener('click', () => sendControl('nexttrack'));
  
  document.querySelector('[data-action="test"]').addEventListener('click', testConnection);
  document.querySelector('[data-action="dashboard"]').addEventListener('click', openDashboard);
  document.querySelector('[data-action="refresh"]').addEventListener('click', manualRefresh);
  document.querySelector('[data-action="debug"]').addEventListener('click', toggleDebug);
  
  // Start with WebSocket connection
  connectWebSocket();
  
  // Listen for page visibility changes to reconnect if needed
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      log('Popup became visible - ensuring connection');
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        connectWebSocket();
      }
    }
  });
  
  // Cleanup when popup closes
  window.addEventListener('beforeunload', cleanup);
  
  log('✅ Popup initialized with real-time WebSocket connection');
}); 