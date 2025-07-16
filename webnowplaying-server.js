import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// Store current media state from WebNowPlaying
let currentMedia = null;

// Middleware
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

/**
 * Get current media detection data (WebNowPlaying format)
 */
app.get('/api/media/detect', (req, res) => {
    console.log('🔍 [API] Media detection requested');
    
    if (currentMedia && currentMedia.title) {
        console.log('✅ [API] Returning WebNowPlaying data:', {
            title: currentMedia.title,
            artist: currentMedia.artist,
            source: 'WebNowPlaying'
        });
        
        res.json({
            success: true,
            data: {
                title: currentMedia.title,
                artist: currentMedia.artist,
                album: currentMedia.album || null,
                source: 'WebNowPlaying',
                url: null,
                playbackState: currentMedia.state === 'PLAYING' ? 'playing' : 'paused',
                artwork: currentMedia.cover || null,
                supportsControl: true,
                isPlaying: currentMedia.state === 'PLAYING',
                duration: currentMedia.duration || 0,
                position: currentMedia.position || 0
            }
        });
    } else {
        console.log('❌ [API] No media data from WebNowPlaying');
        res.json({
            success: false,
            error: 'No media detected',
            data: null
        });
    }
});

/**
 * Get current media status (same as detect but different endpoint for dashboard compatibility)
 */
app.get('/api/media/status', (req, res) => {
    console.log('🔍 [API] Media status requested');
    
    if (currentMedia && currentMedia.title) {
        console.log('✅ [API] Returning WebNowPlaying status:', {
            title: currentMedia.title,
            artist: currentMedia.artist,
            source: 'WebNowPlaying'
        });
        
        res.json({
            success: true,
            data: {
                title: currentMedia.title,
                artist: currentMedia.artist,
                album: currentMedia.album || null,
                source: 'WebNowPlaying',
                url: null,
                playbackState: currentMedia.state === 'PLAYING' ? 'playing' : 'paused',
                artwork: currentMedia.cover || null,
                supportsControl: true,
                isPlaying: currentMedia.state === 'PLAYING',
                duration: currentMedia.duration || 0,
                position: currentMedia.position || 0
            }
        });
    } else {
        console.log('❌ [API] No media status from WebNowPlaying');
        res.json({
            success: false,
            error: 'No media detected',
            data: null
        });
    }
});

/**
 * Control media playback
 */
app.post('/api/media/control', (req, res) => {
    const { action } = req.body;
    console.log(`🎛️ [Control] Received command: ${action}`);
    
    // Broadcast control command to WebNowPlaying extension via WebSocket
    const controlMessage = {
        type: 'control',
        action: action
    };
    
    // Send to all connected WebSocket clients (WebNowPlaying extension)
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(controlMessage));
        }
    });
    
    res.json({
        success: true,
        message: `✅ WebNowPlaying control command sent: ${action}`
    });
});

// Create HTTP server and WebSocket server
const server = createServer(app);
const wss = new WebSocketServer({ server });

/**
 * WebSocket handler for WebNowPlaying extension
 */
wss.on('connection', (ws) => {
    console.log('🔌 WebNowPlaying extension connected');
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            console.log('📦 [WebSocket] Received from extension:', JSON.stringify(message, null, 2));
            
            // Handle WebNowPlaying data format
            if (message.player) {
                // Standard WebNowPlaying format
                currentMedia = {
                    title: message.player.title || 'Unknown',
                    artist: message.player.artist || 'Unknown',
                    album: message.player.album || null,
                    state: message.player.state || 'UNKNOWN',
                    position: message.player.position || 0,
                    duration: message.player.duration || 0,
                    cover: message.player.cover || null,
                    timestamp: Date.now()
                };
                
                console.log('🎵 [WebNowPlaying] Updated media state:', {
                    title: currentMedia.title,
                    artist: currentMedia.artist,
                    state: currentMedia.state
                });
            }
            
            // Handle alternative formats (Media Session API)
            else if (message.title || message.metadata) {
                const metadata = message.metadata || message;
                currentMedia = {
                    title: metadata.title || message.title || 'Unknown',
                    artist: metadata.artist || message.artist || 'Unknown', 
                    album: metadata.album || message.album || null,
                    state: message.state || message.playbackState || 'PLAYING',
                    position: message.position || 0,
                    duration: message.duration || 0,
                    cover: metadata.artwork?.[0]?.src || message.artwork || null,
                    timestamp: Date.now()
                };
                
                console.log('🎵 [Media Session] Updated media state:', {
                    title: currentMedia.title,
                    artist: currentMedia.artist,
                    state: currentMedia.state
                });
            }
            
        } catch (error) {
            console.error('❌ [WebSocket] Error parsing message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('🔌 WebNowPlaying extension disconnected');
    });
    
    ws.on('error', (error) => {
        console.error('❌ [WebSocket] Connection error:', error);
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to DeskThing WebNowPlaying Server'
    }));
});

// Serve static files (placed after API routes to avoid conflicts)
app.use(express.static(__dirname));

// Serve the dashboard UI
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'media-dashboard.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        hasMedia: !!currentMedia
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`🎵 WebNowPlaying DeskThing Server running at http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server running at ws://localhost:${PORT}`);
    console.log('📊 Available endpoints:');
    console.log('  GET  /api/media/detect  - Get current media from WebNowPlaying');  
    console.log('  POST /api/media/control - Send control commands to WebNowPlaying');
    console.log('  GET  /health           - Server health check');
    console.log('  WS   /                 - WebSocket for WebNowPlaying extension');
    console.log('  GET  /                 - Dashboard UI');
    console.log('🔥 Server ready! Install WebNowPlaying extension and it should connect automatically.');
    console.log('📱 Extension URL: https://chromewebstore.google.com/detail/webnowplaying/jfakgfcdgpghbbefmdfjkbdlibjgnbli');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 Server shutting down...');
    server.close();
});

process.on('SIGINT', () => {
    console.log('\n👋 Server shutting down...');
    server.close();
    process.exit(0);
}); 