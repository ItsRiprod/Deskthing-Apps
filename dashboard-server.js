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
 * Enhanced media detection using MediaSession API first, then fallback
 */
app.get('/api/media/detect', async (req, res) => {
  try {
    console.log('🔍 [Dashboard] Detecting current media...');
    
    // Try MediaSession API first (modern approach)
    let music = await mediaSessionDetector.detectMediaSession();
    
    if (!music || music.error) {
      console.log('🔄 [Dashboard] MediaSession failed, trying legacy detection...');
      // Fallback to legacy AppleScript approach
      music = await legacyDetector.detectMusic();
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
 * Get enhanced media info with position tracking
 */
app.get('/api/media/status', async (req, res) => {
  try {
    console.log('🔍 [Dashboard] Getting media status...');
    
    let music = null;
    
    // First priority: Chrome Extension data (most accurate)
    if (currentMedia && currentMedia.timestamp && (Date.now() - currentMedia.timestamp < 10000)) {
      console.log('✅ [Dashboard] Using Chrome Extension data (most recent)');
      music = currentMedia;
    } else {
      // Fallback: Try MediaSession for enhanced info
      music = await mediaSessionDetector.detectMediaSession();
      
      if (!music || music.error) {
        // Final fallback: legacy detection
        music = await legacyDetector.detectMusic();
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

// Add this endpoint for Now Playing - OBS Chrome extension
app.post('/api/obs-nowplaying', (req, res) => {
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
          body { font-family: system-ui; margin: 2rem; background: #1a1a1a; color: #fff; }
          .container { max-width: 800px; margin: 0 auto; }
          .status { padding: 1rem; background: #2a2a2a; border-radius: 8px; margin: 1rem 0; }
          .controls { display: flex; gap: 1rem; margin: 1rem 0; }
          button { padding: 0.5rem 1rem; background: #007aff; color: white; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background: #0056b3; }
          .metadata { display: grid; grid-template-columns: auto 1fr; gap: 0.5rem; }
          .artwork { width: 100px; height: 100px; object-fit: cover; border-radius: 8px; }
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
          
          <button onclick="refreshStatus()">🔄 Refresh Status</button>
        </div>
        
        <script>
          async function refreshStatus() {
            try {
              const response = await fetch('/api/media/status');
              const data = await response.json();
              
              const statusDiv = document.getElementById('status');
              
              if (data.success && data.data) {
                const media = data.data;
                statusDiv.innerHTML = \`
                  <div class="metadata">
                    \${media.artwork ? \`<img src="\${media.artwork}" class="artwork" alt="Artwork">\` : '<div class="artwork" style="background: #333;"></div>'}
                    <div>
                      <h3>\${media.title}</h3>
                      <p><strong>Artist:</strong> \${media.artist}</p>
                      <p><strong>Album:</strong> \${media.album || 'N/A'}</p>
                      <p><strong>Source:</strong> \${media.source}</p>
                      <p><strong>Status:</strong> \${media.isPlaying ? '▶️ Playing' : '⏸️ Paused'}</p>
                      \${media.duration ? \`<p><strong>Duration:</strong> \${Math.floor(media.duration / 60)}:\${(media.duration % 60).toString().padStart(2, '0')}</p>\` : ''}
                      \${media.position ? \`<p><strong>Position:</strong> \${Math.floor(media.position / 60)}:\${(media.position % 60).toString().padStart(2, '0')}</p>\` : ''}
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