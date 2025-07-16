import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { execSync } from 'child_process';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import MusicDetector from './scripts/music-debug.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// CORS middleware for browser requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

/**
 * Get current media detection data
 */
app.get('/api/media/detect', async (req, res) => {
  try {
    console.log('🔍 [Dashboard] Detecting current media...');
    
    const detector = new MusicDetector();
    const music = await detector.detectMusic();
    
    if (music) {
      console.log('✅ [Dashboard] Media detected:', {
        title: music.title,
        artist: music.artist,
        source: music.source,
        hasArtwork: !!music.artwork
      });
      
      res.json({ 
        success: true, 
        data: music 
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
 * Send media control commands
 */
app.post('/api/media/control', async (req, res) => {
  try {
    const { action } = req.body;
    console.log(`🎛️  [Dashboard] Control command: ${action}`);
    
    if (!['play-pause', 'next', 'previous'].includes(action)) {
      return res.json({ success: false, error: 'Invalid action' });
    }
    
    const result = await sendControlCommand(action);
    res.json(result);
    
  } catch (error) {
    console.error('❌ [Dashboard] Control failed:', error.message);
    res.json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Helper function to send control commands
 */
async function sendControlCommand(action) {
  try {
    console.log(`🎛️  Sending ${action} command...`);
    const result = execSync(`node scripts/player-control.js ${action}`, {
      encoding: 'utf8',
      timeout: 5000
    });
    console.log(`✅ Control result: ${result.trim()}`);
    return { success: true, message: result.trim() };
  } catch (error) {
    console.error(`❌ Control command failed:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get enhanced media info with position tracking
 */
app.get('/api/media/status', async (req, res) => {
  try {
    console.log('🔍 [Dashboard] Getting media status...');
    
    const detector = new MusicDetector();
    const music = await detector.detectMusic();
    
    if (music) {
      console.log('✅ [Dashboard] Media status:', {
        title: music.title,
        isPlaying: music.isPlaying,
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
      isPlaying: chromeData.isPlaying !== false, // default to true
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

// Add common endpoints the extension might try
app.post('/obs-nowplaying', (req, res) => {
  console.log('🌐 [Chrome Extension /obs-nowplaying] Received data:', req.body);
  // Use same handler logic
  const chromeData = req.body;
  const mediaData = {
    title: chromeData.title || chromeData.songName || 'Unknown Track',
    artist: chromeData.artist || chromeData.artistName || 'Unknown Artist',
    album: chromeData.album || '',
    source: 'Chrome Extension (obs-nowplaying)',
    artwork: chromeData.artwork || chromeData.cover || null,
    isPlaying: chromeData.isPlaying !== false,
    duration: chromeData.duration || 0,
    position: chromeData.position || chromeData.currentTime || 0,
    url: chromeData.url || ''
  };
  
  console.log('✅ [Chrome Extension /obs-nowplaying] Processed:', mediaData);
  res.json({ success: true, message: 'Data received' });
});

app.post('/nowplaying', (req, res) => {
  console.log('🌐 [Chrome Extension /nowplaying] Received data:', req.body);
  // Use same handler logic
  const chromeData = req.body;
  const mediaData = {
    title: chromeData.title || chromeData.songName || 'Unknown Track',
    artist: chromeData.artist || chromeData.artistName || 'Unknown Artist',
    source: 'Chrome Extension (nowplaying)'
  };
  
  console.log('✅ [Chrome Extension /nowplaying] Processed:', mediaData);
  res.json({ success: true, message: 'Data received' });
});

// Removed problematic catch-all route to fix path-to-regexp error
// Specific endpoints are defined above for Chrome extension compatibility

// Serve the dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'media-dashboard.html'));
});

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('🔌 Chrome extension connected via WebSocket');
    
    ws.on('message', (data) => {
        try {
            const mediaData = JSON.parse(data.toString());
            console.log('🌐 [WebSocket] Received Chrome extension data:', mediaData);
            
            // Broadcast to all connected clients
            wss.clients.forEach((client) => {
                if (client.readyState === 1) { // WebSocket.OPEN
                    client.send(JSON.stringify({
                        type: 'mediaUpdate',
                        data: mediaData
                    }));
                }
            });
        } catch (error) {
            console.error('❌ [WebSocket] Error parsing message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('🔌 Chrome extension disconnected');
    });
    
    // Send initial status
    ws.send(JSON.stringify({
        type: 'status',
        message: 'Connected to DeskThing Media Server'
    }));
});

// Start server
server.listen(PORT, () => {
    console.log(`🎵 Media Dashboard server running at http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server running at ws://localhost:${PORT}`);
    console.log('📊 Available endpoints:');
    console.log('  GET  /api/media/detect  - Detect current media');  
    console.log('  GET  /api/media/status  - Get media with position');
    console.log('  POST /api/media/control - Send control commands');
    console.log('  POST /obs-nowplaying    - Chrome extension endpoint');
    console.log('  POST /nowplaying        - Chrome extension endpoint');
    console.log('  WS   /                  - WebSocket for real-time data');
    console.log('  GET  /                  - Dashboard UI');
    console.log('🔥 Server ready! Waiting for Chrome extension data...');
});

// Keep the server running
process.on('SIGTERM', () => {
    console.log('👋 Server shutting down...');
    server.close();
});

process.on('SIGINT', () => {
    console.log('\n👋 Server shutting down...');
    server.close();
    process.exit(0);
});

// Remove export for direct execution
// export default app; 