import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { execSync } from 'child_process';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import MusicDetector from './scripts/music-debug.js';
import MediaSessionDetector from './scripts/media-session-detector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// Global state
let currentMedia = null;

// Middleware
app.use(express.json());

// Log all requests to see if extension is making ANY requests
app.use((req, res, next) => {
  console.log(`📡 [Server] ${req.method} ${req.url} from ${req.ip} - ${req.headers['user-agent']?.substring(0, 50) || 'no user agent'}`);
  next();
});
app.use(express.static(__dirname));

// CORS middleware for browser requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Create instances
const legacyDetector = new MusicDetector();
const mediaSessionDetector = new MediaSessionDetector();

/**
 * Enhanced media detection using Chrome Extension first, then fallbacks
 */
app.get('/api/media/detect', async (req, res) => {
  try {
    console.log('🔍 [Dashboard] Detecting current media...');
    
    let music = null;
    
    // First priority: Chrome Extension data (most accurate)
    if (currentMedia && currentMedia.timestamp && (Date.now() - currentMedia.timestamp < 10000)) {
      console.log('✅ [Dashboard] Using Chrome Extension data (most recent)');
      music = currentMedia;
    } else {
      // Fallback: Try MediaSession API (modern approach)
      music = await mediaSessionDetector.detectMediaSession();
      
      if (!music || music.error) {
        console.log('🔄 [Dashboard] MediaSession failed, trying legacy detection...');
        // Final fallback: legacy AppleScript approach
        music = await legacyDetector.detectMusic();
      }
    }
    
    if (music && !music.error) {
      console.log('✅ [Dashboard] Media detected:', {
        title: music.title,
        artist: music.artist,
        source: music.source,
        method: music.source === 'soundcloud.com' ? 'MediaSession' : 'Legacy',
        hasArtwork: !!music.artwork
      });
      
      res.json({ 
        success: true, 
        data: music,
        method: music.source === 'soundcloud.com' ? 'MediaSession' : 'Legacy'
      });
    } else {
      console.log('❌ [Dashboard] No media detected');
      res.json({ 
        success: false, 
        data: null 
      });
    }
  } catch (error) {
    console.error('❌ [Dashboard] Detection error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Enhanced media control using MediaSession API
 */
app.post('/api/media/control', async (req, res) => {
  try {
    const { action } = req.body;
    console.log(`🎮 [Dashboard] Control request: ${action}`);
    
    if (!action || !['play', 'pause', 'nexttrack', 'previoustrack'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use: play, pause, nexttrack, previoustrack'
      });
    }
    
    // Try MediaSession control first
    const success = await mediaSessionDetector.sendMediaControl(action);
    
    if (success) {
      console.log(`✅ [Dashboard] Control successful: ${action}`);
      res.json({
        success: true,
        message: `${action} command sent`,
        method: 'MediaSession'
      });
    } else {
      console.log(`❌ [Dashboard] Control failed: ${action}`);
      res.status(500).json({
        success: false,
        error: `Failed to send ${action} command`
      });
    }
    
  } catch (error) {
    console.error('❌ [Dashboard] Control error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Seek to specific position in track
 */
app.post('/api/media/seek', async (req, res) => {
  try {
    const { position } = req.body;
    
    console.log('🔍 [Dashboard] Raw seek request body:', req.body);
    console.log('🔍 [Dashboard] Position type:', typeof position);
    console.log('🔍 [Dashboard] Position value:', position);
    
    if (typeof position !== 'number' || position < 0) {
      console.log('❌ [Dashboard] Invalid position value');
      return res.status(400).json({
        success: false,
        error: 'Valid position in seconds is required'
      });
    }
    
    console.log(`🔍 [Dashboard] Seek request: ${position}s`);
    console.log(`🔍 [Dashboard] Current media state:`, {
      hasCurrentMedia: !!currentMedia,
      title: currentMedia?.title,
      duration: currentMedia?.duration,
      position: currentMedia?.position
    });
    
    const success = await mediaSessionDetector.seekToPosition(position);
    
    if (success) {
      console.log(`✅ [Dashboard] Seek successful: ${position}s`);
      res.json({
        success: true,
        position: position
      });
    } else {
      console.log(`❌ [Dashboard] Seek failed: ${position}s`);
      res.status(500).json({
        success: false,
        error: `Failed to seek to ${position}s`
      });
    }
  } catch (error) {
    console.error('❌ [Dashboard] Seek error:', error.message);
    console.error('❌ [Dashboard] Seek error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get enhanced media info with position tracking
 */
app.get('/api/media/status', async (req, res) => {
  try {
    console.log('🔍 [Dashboard] Getting media status...');
    
    let music = null;
    
    // Debug current media state
    console.log('🔍 [Dashboard] currentMedia state:', {
      hasCurrentMedia: !!currentMedia,
      timestamp: currentMedia?.timestamp,
      timeDiff: currentMedia?.timestamp ? Date.now() - currentMedia.timestamp : 'N/A',
      isRecent: currentMedia?.timestamp ? (Date.now() - currentMedia.timestamp < 10000) : false
    });
    
    // First priority: Chrome Extension data (most accurate)
    if (currentMedia && currentMedia.timestamp && (Date.now() - currentMedia.timestamp < 10000)) {
      console.log('✅ [Dashboard] Using Chrome Extension data (most recent)');
      console.log('📊 [Dashboard] Chrome Extension data:', currentMedia);
      music = currentMedia;
    } else {
      console.log('🔄 [Dashboard] No recent Chrome Extension data, trying MediaSession...');
      // Fallback: Try MediaSession for enhanced info
      music = await mediaSessionDetector.detectMediaSession();
      console.log('📊 [Dashboard] MediaSession result:', music);
      
      // Show debug info if available
      if (music && music.debug) {
        console.log('🔍 [Dashboard] MediaSession debug info:', {
          audioElementsFound: music.debug.audioElementsFound,
          audioElementsWithDuration: music.debug.audioElementsWithDuration,
          audioElementsWithCurrentTime: music.debug.audioElementsWithCurrentTime,
          rawDuration: music.debug.rawDuration,
          rawCurrentTime: music.debug.rawCurrentTime,
          firstAudioElement: music.debug.audioElementDetails[0] || 'none'
        });
      }
      
      if (!music || music.error) {
        console.log('🔄 [Dashboard] MediaSession failed, trying legacy detection...');
        // Final fallback: legacy detection
        music = await legacyDetector.detectMusic();
        console.log('📊 [Dashboard] Legacy detection result:', music);
      }
    }
    
    if (music && !music.error) {
      console.log('✅ [Dashboard] Media status:', {
        title: music.title,
        isPlaying: music.isPlaying,
        duration: music.duration,
        position: music.position,
        hasArtwork: !!music.artwork
      });
      
      res.json({
        success: true,
        data: music
      });
    } else {
      console.log('❌ [Dashboard] No media playing');
      res.json({
        success: false,
        data: {
          title: 'No track playing',
          artist: 'Unknown artist',
          album: '',
          source: 'No source',
          url: null,
          artwork: null,
          isPlaying: false,
          position: 0,
          duration: 0
        }
      });
    }
  } catch (error) {
    console.error('❌ [Dashboard] Status error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple ping endpoint for extension to test connectivity
app.get('/api/ping', (req, res) => {
  console.log('🏓 [Ping] Extension connectivity test');
  res.json({ 
    success: true, 
    message: 'Dashboard server is reachable', 
    timestamp: new Date().toISOString(),
    serverVersion: 'Enhanced v2.0'
  });
});

// Alternative nowplaying endpoint (some extensions use this)
app.post('/nowplaying', (req, res) => {
  console.log('🌐 [Chrome Extension] nowplaying endpoint hit');
  console.log('🌐 [Chrome Extension] Data:', req.body);
  res.redirect(307, '/api/obs-nowplaying');
});

// Add this endpoint for Now Playing - OBS Chrome extension
app.post('/api/obs-nowplaying', (req, res) => {
  console.log('🌐 [Chrome Extension] === NEW REQUEST ===');
  console.log('🌐 [Chrome Extension] Timestamp:', new Date().toISOString());
  console.log('🌐 [Chrome Extension] Headers:', req.headers);
  console.log('🌐 [Chrome Extension] User-Agent:', req.headers['user-agent']);
  console.log('🌐 [Chrome Extension] Received data:', req.body);
  
  try {
    const chromeData = req.body;
    
    // Convert OBS extension format to DeskThing format
    const mediaData = {
      title: chromeData.title || chromeData.songName || 'Unknown Track',
      artist: chromeData.artist || chromeData.artistName || 'Unknown Artist',
      album: chromeData.album || '',
      source: 'Chrome Extension',
      artwork: chromeData.artwork || chromeData.cover || null,
      isPlaying: chromeData.playbackState === 'playing' || chromeData.isPlaying === true,
      duration: chromeData.duration || 0,
      position: chromeData.position || chromeData.currentTime || 0,
      url: chromeData.url || ''
    };
    
    console.log('✅ [Chrome Extension] Processed:', mediaData);
    
    // Store as current media with high priority
    currentMedia = {
      ...mediaData,
      source: 'chrome-extension',
      timestamp: Date.now()
    };
    
    // Forward to any connected clients (like Car Thing)
    if (typeof broadcastToCarThing === 'function') {
      broadcastToCarThing(currentMedia);
    }
    
    res.json({ success: true, message: 'Media data received' });
    
  } catch (error) {
    console.error('❌ [Chrome Extension] Error processing data:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Add legacy endpoint for chrome extension compatibility
app.post('/nowplaying', (req, res) => {
  // Redirect to the new endpoint
  return app.request.body = req.body, 
         app.request.method = 'POST',
         app.request.url = '/api/obs-nowplaying',
         req.body;
});

// Enhanced metadata endpoint using MediaSession
app.get('/api/media/metadata', async (req, res) => {
  try {
    console.log('🎨 [Dashboard] Getting enhanced metadata...');
    
    const metadata = await mediaSessionDetector.getEnhancedMetadata();
    
    if (metadata && !metadata.error) {
      console.log('✅ [Dashboard] Enhanced metadata retrieved');
      res.json({
        success: true,
        data: metadata
      });
    } else {
      res.json({
        success: false,
        error: 'No enhanced metadata available'
      });
    }
  } catch (error) {
    console.error('❌ [Dashboard] Metadata error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    methods: ['MediaSession', 'Legacy AppleScript']
  });
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('🔌 [WebSocket] Client connected');
  
  ws.on('message', (message) => {
    console.log('📨 [WebSocket] Received:', message.toString());
  });
  
  ws.on('close', () => {
    console.log('🔌 [WebSocket] Client disconnected');
  });
  
  // Send initial status
  (async () => {
    try {
      let music = await mediaSessionDetector.detectMediaSession();
      if (!music || music.error) {
        music = await legacyDetector.detectMusic();
      }
      
      if (music && !music.error) {
        ws.send(JSON.stringify({
          type: 'media-update',
          data: music
        }));
      }
    } catch (error) {
      console.error('❌ [WebSocket] Initial status error:', error.message);
    }
  })();
});

// Dashboard UI
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>DeskThing Media Dashboard</title>
        <meta charset="utf-8">
        <style>
          body { font-family: system-ui; margin: 2rem; background: #f8f9fa; color: #212529; }
          .container { max-width: 800px; margin: 0 auto; }
          .status { padding: 1.5rem; background: #ffffff; border: 1px solid #dee2e6; border-radius: 12px; margin: 1rem 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .controls { display: flex; gap: 0.5rem; margin: 1rem 0; justify-content: center; }
          button { padding: 0.6rem 1.2rem; background: #007aff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
          button:hover { background: #0056b3; transform: translateY(-1px); }
          .metadata { display: grid; grid-template-columns: auto 1fr; gap: 1rem; align-items: center; }
          .artwork { width: 120px; height: 120px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
          .track-info h3 { margin: 0 0 0.5rem 0; font-size: 1.3rem; color: #212529; }
          .track-info p { margin: 0.25rem 0; color: #6c757d; }
          .progress-container { margin: 1rem 0; }
          .progress-bar { width: 100%; height: 6px; background: #e9ecef; border-radius: 3px; cursor: pointer; position: relative; }
          .progress-fill { height: 100%; background: linear-gradient(90deg, #007aff, #0056b3); border-radius: 3px; transition: width 0.3s ease; }
          .progress-times { display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.85rem; color: #6c757d; }
          .refresh-btn { margin-top: 1rem; background: #6c757d; }
          .refresh-btn:hover { background: #495057; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎵 DeskThing Media Dashboard</h1>
          <p>Enhanced with <strong>navigator.mediaSession</strong> API</p>
          
          <div class="status" id="status">
            <p>Loading media status...</p>
          </div>
          
          <div class="controls">
            <button onclick="sendControl('previoustrack')">⏮️ Previous</button>
            <button onclick="sendControl('play')">▶️ Play</button>
            <button onclick="sendControl('pause')">⏸️ Pause</button>
            <button onclick="sendControl('nexttrack')">⏭️ Next</button>
          </div>
          
          <button onclick="refreshStatus()" class="refresh-btn">🔄 Refresh Status</button>
        </div>
        
        <script>
          // Auto-format time function
          function formatTime(seconds) {
            if (!seconds || seconds <= 0) return '0:00';
            
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            
            if (hours > 0) {
              return \`\${hours}:\${minutes.toString().padStart(2, '0')}:\${secs.toString().padStart(2, '0')}\`;
            } else {
              return \`\${minutes}:\${secs.toString().padStart(2, '0')}\`;
            }
          }
          
          // Seek to position
          async function seekTo(event) {
            const progressBar = event.currentTarget;
            const rect = progressBar.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const percentage = clickX / rect.width;
            
            const statusDiv = document.getElementById('status');
            const durationElement = progressBar.dataset.duration;
            
            if (durationElement) {
              const duration = parseFloat(durationElement);
              const seekPosition = duration * percentage;
              
              try {
                const response = await fetch('/api/media/seek', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ position: seekPosition })
                });
                
                if (response.ok) {
                  console.log(\`Seeked to \${formatTime(seekPosition)}\`);
                  setTimeout(refreshStatus, 500); // Refresh after seek
                } else {
                  console.error('Seek failed');
                }
              } catch (error) {
                console.error('Seek error:', error);
              }
            }
          }
          
          async function refreshStatus() {
            try {
              const response = await fetch('/api/media/status');
              const data = await response.json();
              
              const statusDiv = document.getElementById('status');
              
              if (data.success && data.data) {
                const media = data.data;
                const progress = media.duration > 0 ? (media.position / media.duration) * 100 : 0;
                
                statusDiv.innerHTML = \`
                  <div class="metadata">
                    \${media.artwork ? \`<img src="\${media.artwork}" class="artwork" alt="Artwork">\` : '<div class="artwork" style="background: #e9ecef;"></div>'}
                    <div class="track-info">
                      <h3>\${media.title}</h3>
                      <p><strong>Artist:</strong> \${media.artist}</p>
                      <p><strong>Album:</strong> \${media.album || 'N/A'}</p>
                      <p><strong>Source:</strong> \${media.source}</p>
                      <p><strong>Status:</strong> \${media.isPlaying ? '▶️ Playing' : '⏸️ Paused'}</p>
                      
                      <div class="progress-container">
                        <div class="progress-bar" onclick="seekTo(event)" data-duration="\${media.duration || 0}">
                          <div class="progress-fill" style="width: \${progress}%"></div>
                        </div>
                        <div class="progress-times">
                          <span>\${formatTime(media.position || 0)}</span>
                          <span>\${formatTime(media.duration || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                \`;
              } else {
                statusDiv.innerHTML = '<p>❌ No media detected</p>';
              }
            } catch (error) {
              document.getElementById('status').innerHTML = \`<p>❌ Error: \${error.message}</p>\`;
            }
          }
          
          async function sendControl(action) {
            try {
              const response = await fetch('/api/media/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
              });
              
              const data = await response.json();
              console.log('Control response:', data);
              
              // Refresh status after control
              setTimeout(refreshStatus, 500);
            } catch (error) {
              console.error('Control error:', error);
            }
          }
          
          // Auto-refresh every 5 seconds
          setInterval(refreshStatus, 5000);
          
          // Initial load
          refreshStatus();
        </script>
      </body>
    </html>
  `);
});

// Start server
server.listen(PORT, () => {
  console.log(`🎵 Enhanced Media Dashboard server running at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server running at ws://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`  GET  /api/media/detect    - Detect current media (MediaSession + Legacy)`);
  console.log(`  GET  /api/media/status    - Get media with position`);
  console.log(`  GET  /api/media/metadata  - Get enhanced metadata with artwork`);
  console.log(`  POST /api/media/control   - Send control commands (play/pause/next/prev)`);
  console.log(`  POST /obs-nowplaying      - Chrome extension endpoint`);
  console.log(`  POST /nowplaying          - Chrome extension endpoint`);
  console.log(`  GET  /health              - Server health check`);
  console.log(`  WS   /                    - WebSocket for real-time data`);
  console.log(`  GET  /                    - Enhanced Dashboard UI`);
  console.log(`🔥 Server ready! Enhanced with navigator.mediaSession API`);
  
  // Auto-detect on startup
  (async () => {
    try {
      let music = await mediaSessionDetector.detectMediaSession();
      if (!music || music.error) {
        music = await legacyDetector.detectMusic();
      }
      
      if (music && !music.error) {
        console.log('🎵 [Startup] Current media:', {
          title: music.title,
          artist: music.artist,
          source: music.source
        });
      }
    } catch (error) {
      console.error('❌ [Startup] Detection error:', error.message);
    }
  })();
}); 