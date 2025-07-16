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
wss.on('connection', (ws, req) => {
    console.log('🔌 WebNowPlaying extension connected from:', req.socket.remoteAddress);
    console.log('🔗 Request headers:', req.headers);
    console.log('🔗 Request URL:', req.url);
    
    // Send proper handshake as per WNP protocol
    const handshake = 'ADAPTER_VERSION 1.0.0;WNPRLIB_REVISION 2';
    console.log('📤 Sending handshake:', handshake);
    ws.send(handshake);
    
    const recipients = new Set();
    let mediaInfo = {
        player_name: '',
        is_native: false,
        state: 'STOPPED',
        title: '',
        artist: '',
        album: '',
        cover_url: '',
        duration_seconds: 0,
        position_seconds: 0,
        volume: 100,
        controls: {
            supports_play_pause: true,
            supports_skip_previous: true,
            supports_skip_next: true,
            supports_set_position: false,
            supports_set_volume: false,
            supports_toggle_repeat_mode: false,
            supports_toggle_shuffle_active: false,
            supports_set_rating: false,
            rating_system: 'NONE'
        }
    };
    
    ws.on('message', (data) => {
        try {
            const message = data.toString().trim();
            console.log('📦 [WebSocket] Raw data received:', data);
            console.log('📦 [WebSocket] Message string:', message);
            console.log('📦 [WebSocket] Message length:', message.length);
            
            // Handle recipient registration
            if (message.toUpperCase() === 'RECIPIENT') {
                recipients.add(ws);
                console.log('📝 [WebSocket] Client registered as recipient');
                updateRecipients();
                return;
            }
            
            // Parse message format: "TYPE DATA"
            let type, msgData;
            const spaceIndex = message.indexOf(' ');
            if (spaceIndex !== -1) {
                type = message.substring(0, spaceIndex).toUpperCase();
                msgData = message.substring(spaceIndex + 1);
            } else {
                type = message.toUpperCase();
                msgData = '';
            }
            
            // Handle different message types
            switch (type) {
                case 'PLAYER_NAME':
                    mediaInfo.player_name = msgData;
                    break;
                case 'IS_NATIVE':
                    mediaInfo.is_native = msgData.toLowerCase() === 'true';
                    break;
                case 'STATE':
                    mediaInfo.state = msgData;
                    console.log(`🎵 [WebSocket] State: ${msgData}`);
                    break;
                case 'TITLE':
                    mediaInfo.title = msgData;
                    console.log(`🎵 [WebSocket] Title: ${msgData}`);
                    break;
                case 'ARTIST':
                    mediaInfo.artist = msgData;
                    console.log(`🎵 [WebSocket] Artist: ${msgData}`);
                    break;
                case 'ALBUM':
                    mediaInfo.album = msgData;
                    break;
                case 'COVER_URL':
                    mediaInfo.cover_url = msgData;
                    break;
                case 'DURATION_SECONDS':
                    mediaInfo.duration_seconds = parseInt(msgData) || 0;
                    break;
                case 'POSITION_SECONDS':
                    mediaInfo.position_seconds = parseInt(msgData) || 0;
                    break;
                case 'VOLUME':
                    mediaInfo.volume = parseInt(msgData) || 100;
                    break;
                case 'PLAYER_CONTROLS':
                    try {
                        mediaInfo.controls = JSON.parse(msgData);
                    } catch (e) {
                        console.warn('⚠️  [WebSocket] Failed to parse controls:', e);
                    }
                    break;
                case 'ERROR':
                    console.error('❌ [WebSocket] Browser Error:', msgData);
                    break;
                case 'ERRORDEBUG':
                    console.error('🐛 [WebSocket] Browser Error Trace:', msgData);
                    break;
                default:
                    console.warn(`⚠️  [WebSocket] Unknown message type: ${type} (${message})`);
            }
            
            // Update current media and notify recipients
            if (mediaInfo.title) {
                currentMedia = {
                    title: mediaInfo.title,
                    artist: mediaInfo.artist,
                    album: mediaInfo.album,
                    state: mediaInfo.state,
                    cover: mediaInfo.cover_url,
                    duration: mediaInfo.duration_seconds,
                    position: mediaInfo.position_seconds,
                    volume: mediaInfo.volume,
                    player: mediaInfo.player_name || 'WebNowPlaying',
                    source: 'WebNowPlaying'
                };
                
                console.log('✅ [WebSocket] Media info updated:', {
                    title: currentMedia.title,
                    artist: currentMedia.artist,
                    state: currentMedia.state
                });
                
                updateRecipients();
            }
            
        } catch (error) {
            console.error('❌ [WebSocket] Error parsing message:', error);
            console.error('❌ [WebSocket] Raw data that caused error:', data);
            console.error('❌ [WebSocket] Error details:', error.stack);
        }
    });
    
    function updateRecipients() {
        if (recipients.size > 0) {
            const jsonData = JSON.stringify(mediaInfo);
            recipients.forEach(recipient => {
                if (recipient.readyState === WebSocket.OPEN) {
                    try {
                        recipient.send(jsonData);
                    } catch (e) {
                        console.warn('⚠️  [WebSocket] Failed to send to recipient:', e);
                        recipients.delete(recipient);
                    }
                }
            });
        }
    }
    
    ws.on('close', (code, reason) => {
        console.log('👋 [WebSocket] WebNowPlaying extension disconnected');
        console.log('🔌 Close code:', code, 'Reason:', reason.toString());
        recipients.delete(ws);
    });
    
    ws.on('error', (error) => {
        console.error('❌ [WebSocket] Connection error:', error);
        recipients.delete(ws);
    });
    
    ws.on('open', () => {
        console.log('✅ [WebSocket] Connection opened successfully');
    });
    
    ws.on('ping', (data) => {
        console.log('🏓 [WebSocket] Received ping:', data);
    });
    
    ws.on('pong', (data) => {
        console.log('🏓 [WebSocket] Received pong:', data);
    });
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