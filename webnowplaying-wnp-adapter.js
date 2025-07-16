/**
 * WebNowPlaying DeskThing Adapter
 * Uses Unix Domain Socket communication like the official CLI adapter
 */

const express = require('express');
const net = require('net');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = 8080;

// Storage for current media data
let currentMedia = {
    title: null,
    artist: null,
    album: null,
    state: 'STOPPED',
    cover: null
};

// WebNowPlaying Unix socket path (macOS)
const WNP_SOCKET_PATH = path.join(os.tmpdir(), 'wnp-cli.sock');

/**
 * JSDoc for the WebNowPlaying adapter server
 */
class WebNowPlayingAdapter {
    constructor() {
        this.socket = null;
        this.reconnectTimer = null;
        this.isConnected = false;
        this.setupServer();
        this.connectToWNP();
    }

    /**
     * Set up Express server and routes
     */
    setupServer() {
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
         * Get current media status - DeskThing endpoint
         */
        app.get('/api/media/status', (req, res) => {
            console.log('🔍 [API] Media status requested');
            
            if (currentMedia && currentMedia.title) {
                console.log('✅ [API] Returning WNP data:', {
                    title: currentMedia.title,
                    artist: currentMedia.artist,
                    source: 'WebNowPlaying-CLI'
                });
                
                res.json({
                    success: true,
                    data: {
                        title: currentMedia.title,
                        artist: currentMedia.artist,
                        album: currentMedia.album || null,
                        source: 'WebNowPlaying-CLI',
                        url: null,
                        playbackState: currentMedia.state === 'PLAYING' ? 'playing' : 'paused',
                        artwork: currentMedia.cover || null,
                        supportsControl: true,
                        isPlaying: currentMedia.state === 'PLAYING'
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
         * Get current media detection data - Legacy endpoint
         */
        app.get('/api/media/detect', (req, res) => {
            console.log('🔍 [API] Media detection requested');
            
            if (currentMedia && currentMedia.title) {
                console.log('✅ [API] Returning WNP data:', {
                    title: currentMedia.title,
                    artist: currentMedia.artist,
                    source: 'WebNowPlaying-CLI'
                });
                
                res.json({
                    success: true,
                    data: {
                        title: currentMedia.title,
                        artist: currentMedia.artist,
                        album: currentMedia.album || null,
                        source: 'WebNowPlaying-CLI',
                        url: null,
                        playbackState: currentMedia.state === 'PLAYING' ? 'playing' : 'paused',
                        artwork: currentMedia.cover || null,
                        supportsControl: true,
                        isPlaying: currentMedia.state === 'PLAYING'
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
         * Send control commands to WebNowPlaying
         */
        app.post('/api/media/control', (req, res) => {
            const { command } = req.body;
            console.log('🎮 [API] Control command requested:', command);
            
            // Send command to WebNowPlaying CLI
            this.sendCommand(command);
            
            res.json({
                success: true,
                message: `Command "${command}" sent to WebNowPlaying`
            });
        });

        /**
         * Health check endpoint
         */
        app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                hasMedia: !!(currentMedia && currentMedia.title),
                wnpConnected: this.isConnected
            });
        });

        // Serve static files (placed after API routes to avoid conflicts)
        app.use(express.static(__dirname));

        // Serve the dashboard UI
        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'media-dashboard.html'));
        });
    }

    /**
     * Connect to WebNowPlaying CLI daemon via Unix socket
     */
    connectToWNP() {
        console.log('🔌 [WNP] Attempting to connect to WebNowPlaying CLI...');
        
        // Check if socket file exists
        if (!fs.existsSync(WNP_SOCKET_PATH)) {
            console.log('❌ [WNP] WebNowPlaying CLI socket not found. Make sure wnpcli daemon is running.');
            this.scheduleReconnect();
            return;
        }

        this.socket = net.createConnection(WNP_SOCKET_PATH);

        this.socket.on('connect', () => {
            console.log('✅ [WNP] Connected to WebNowPlaying CLI daemon');
            this.isConnected = true;
            
            // Request initial media data
            this.requestMediaData();
            
            // Set up periodic polling for media updates
            this.startPolling();
        });

        this.socket.on('data', (data) => {
            try {
                const response = data.toString().trim();
                console.log('📦 [WNP] Received data:', response);
                
                if (response) {
                    this.parseMediaData(response);
                }
            } catch (error) {
                console.error('❌ [WNP] Error parsing data:', error);
            }
        });

        this.socket.on('error', (error) => {
            console.error('❌ [WNP] Socket error:', error.message);
            this.isConnected = false;
            this.scheduleReconnect();
        });

        this.socket.on('close', () => {
            console.log('🔌 [WNP] Connection closed');
            this.isConnected = false;
            this.scheduleReconnect();
        });
    }

    /**
     * Request current media data from WNP CLI
     */
    requestMediaData() {
        if (this.isConnected && this.socket) {
            // Request metadata in JSON format
            this.socket.write('metadata -f "%j"\n');
        }
    }

    /**
     * Send control command to WNP CLI  
     */
    sendCommand(command) {
        if (!this.isConnected || !this.socket) {
            console.log('❌ [WNP] Not connected to WebNowPlaying CLI');
            return;
        }

        let wnpCommand;
        switch (command) {
            case 'play':
            case 'pause':
                wnpCommand = 'play-pause';
                break;
            case 'next':
                wnpCommand = 'skip-next';
                break;
            case 'previous':
                wnpCommand = 'skip-previous';
                break;
            default:
                console.log('❌ [WNP] Unknown command:', command);
                return;
        }

        console.log('📤 [WNP] Sending command:', wnpCommand);
        this.socket.write(`${wnpCommand}\n`);
    }

    /**
     * Parse media data from WNP CLI response
     */
    parseMediaData(data) {
        try {
            // Try to parse as JSON first
            const mediaData = JSON.parse(data);
            
            currentMedia = {
                title: mediaData.title || null,
                artist: mediaData.artist || null,
                album: mediaData.album || null,
                state: mediaData.state || 'STOPPED',
                cover: mediaData.cover || null
            };

            console.log('🎵 [WNP] Updated media data:', {
                title: currentMedia.title,
                artist: currentMedia.artist,
                state: currentMedia.state
            });

        } catch (error) {
            // Fallback: try to parse as plain text
            console.log('🔍 [WNP] Parsing as plain text response');
            
            if (data.includes('title:') && data.includes('artist:')) {
                const lines = data.split('\n');
                const mediaObj = {};
                
                lines.forEach(line => {
                    const [key, ...valueParts] = line.split(':');
                    if (key && valueParts.length > 0) {
                        mediaObj[key.trim()] = valueParts.join(':').trim();
                    }
                });

                currentMedia = {
                    title: mediaObj.title || null,
                    artist: mediaObj.artist || null,
                    album: mediaObj.album || null,
                    state: mediaObj.state || 'STOPPED',
                    cover: mediaObj.cover || null
                };
            }
        }
    }

    /**
     * Start polling for media updates
     */
    startPolling() {
        setInterval(() => {
            if (this.isConnected) {
                this.requestMediaData();
            }
        }, 2000); // Poll every 2 seconds
    }

    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        this.reconnectTimer = setTimeout(() => {
            this.connectToWNP();
        }, 5000); // Try to reconnect every 5 seconds
    }

    /**
     * Start the adapter server
     */
    start() {
        app.listen(PORT, () => {
            console.log('🎵 WebNowPlaying DeskThing Adapter running at http://localhost:' + PORT);
            console.log('📊 Available endpoints:');
            console.log('  GET  /api/media/detect  - Get current media from WebNowPlaying');
            console.log('  GET  /api/media/status  - Get current media status');  
            console.log('  POST /api/media/control - Send control commands to WebNowPlaying');
            console.log('  GET  /health           - Server health check');
            console.log('  GET  /                 - Dashboard UI');
            console.log('🔥 Server ready! Make sure WebNowPlaying CLI daemon is running:');
            console.log('📱 Install: brew install keifufu/tap/wnpcli');
            console.log('🚀 Start daemon: wnpcli start-daemon');
        });

        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n👋 Server shutting down...');
            if (this.socket) {
                this.socket.end();
            }
            process.exit(0);
        });
    }
}

// Start the adapter
const adapter = new WebNowPlayingAdapter();
adapter.start(); 