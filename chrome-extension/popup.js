/**
 * DeskThing Media Bridge - Popup Script
 * Separated JavaScript to comply with Chrome extension CSP
 */

const EXTENSION_VERSION = "2.2";
let dashboardUrl = 'http://localhost:8080';
let currentMedia = null;
let isPlaying = false;
let logs = [];

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

async function checkStatus() {
  try {
    log('Checking dashboard connection...');
    const response = await fetch(`${dashboardUrl}/api/ping`);
    if (response.ok) {
      const data = await response.json();
      document.getElementById('status').className = 'status connected';
      document.getElementById('statusText').textContent = `Connected (${data.serverVersion})`;
      document.getElementById('lastUpdate').textContent = `Last checked: ${new Date().toLocaleTimeString()}`;
      log('✅ Dashboard connected');
      
      // Get current media
      await refreshMedia();
    } else {
      throw new Error('Dashboard not responding');
    }
  } catch (error) {
    document.getElementById('status').className = 'status disconnected';
    document.getElementById('statusText').textContent = 'Dashboard Not Reachable';
    document.getElementById('lastUpdate').textContent = `Error: ${error.message}`;
    document.getElementById('mediaInfo').className = 'media-info hidden';
    log(`❌ Connection failed: ${error.message}`);
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
  document.getElementById('playState').textContent = isPlaying ? '✅' : '❌';
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
    debugContent.innerHTML = `
      <strong>Extension:</strong> v${EXTENSION_VERSION}<br>
      <strong>Method:</strong> ${media.method || 'N/A'}<br>
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
      setTimeout(refreshMedia, 500); // Refresh after control
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
  await checkStatus();
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  log(`Extension popup opened (v${EXTENSION_VERSION})`);
  
  // Set up event listeners instead of inline onclick handlers
  document.getElementById('prevBtn').addEventListener('click', () => sendControl('previoustrack'));
  document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
  document.getElementById('nextBtn').addEventListener('click', () => sendControl('nexttrack'));
  
  document.querySelector('[data-action="test"]').addEventListener('click', testConnection);
  document.querySelector('[data-action="dashboard"]').addEventListener('click', openDashboard);
  document.querySelector('[data-action="refresh"]').addEventListener('click', refreshMedia);
  document.querySelector('[data-action="debug"]').addEventListener('click', toggleDebug);
  
  // Start checking status
  checkStatus();
  
  // Auto-refresh media every 5 seconds when popup is open
  setInterval(refreshMedia, 5000);
}); 