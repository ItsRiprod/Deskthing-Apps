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

// 🚀 NEW: Extension communication state for cross-window control
let pendingExtensionCommands = [];
let extensionCommandIdCounter = 0;

// 🚀 WebSocket connections for real-time extension communication
let extensionConnections = new Set();

// 🎵 NEW: Real-time time tracking from extension
let currentTimeData = null;

// Helper function to broadcast to all connected extensions
const broadcastToExtensions = (message) => {
  const messageStr = JSON.stringify(message);
  let successCount = 0;
  
  extensionConnections.forEach(ws => {
    try {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(messageStr);
        successCount++;
      }
    } catch (error) {
      console.error('❌ [WebSocket] Broadcast error:', error.message);
      extensionConnections.delete(ws);
    }
  });
  
  console.log(`📡 [WebSocket] Broadcasted to ${successCount}/${extensionConnections.size} extensions`);
  return successCount;
};

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
    
    // Only use Chrome Extension data - no broken fallbacks
    if (currentMedia && currentMedia.timestamp && (Date.now() - currentMedia.timestamp < 60000)) {
      console.log('✅ [Dashboard] Using Chrome Extension data (most recent)');
      music = currentMedia;
    } else {
      console.log('❌ [Dashboard] No recent Chrome Extension data - extension may need to reconnect');
      // No fallbacks - Chrome Extension is the only reliable source
      music = null;
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
 * 🚀 Enhanced media control with cross-window fallback
 * Tries MediaSession first, then falls back to extension coordination
 */
app.post('/api/media/control', async (req, res) => {
  try {
    console.log(`📨 [Dashboard] Media control request received:`, {
      body: req.body,
      headers: req.headers['content-type'],
      ip: req.ip
    });
    
    const { action } = req.body;
    console.log(`🎮 [Dashboard] Control request: ${action}`);
    
    if (!action || !['play', 'pause', 'nexttrack', 'previoustrack'].includes(action)) {
      console.log(`❌ [Dashboard] Invalid action: ${action}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use: play, pause, nexttrack, previoustrack'
      });
    }
    
    // 🚀 WEBSOCKET PUSH: Instant command delivery to extensions
    console.log(`⚡ [Dashboard] Pushing command via WebSocket to ${extensionConnections.size} extension(s): ${action}`);
    
    if (extensionConnections.size === 0) {
      console.log(`❌ [Dashboard] No extension connections available`);
      return res.status(503).json({
        success: false,
        error: 'No extension connections available',
        method: 'websocket-push'
      });
    }
    
    // Create command with unique ID
    const commandId = ++extensionCommandIdCounter;
    const command = {
      type: 'media-command',
      id: commandId,
      action: action,
      timestamp: Date.now()
    };
    
    console.log(`📤 [Dashboard] Broadcasting command:`, command);
    
    // Push to all connected extensions instantly
    let sentCount = 0;
    let deadConnections = [];
    
    extensionConnections.forEach(ws => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        try {
          ws.send(JSON.stringify(command));
          sentCount++;
        } catch (error) {
          console.warn(`⚠️ [Dashboard] Failed to send to connection:`, error.message);
          deadConnections.push(ws);
        }
      } else {
        deadConnections.push(ws);
      }
    });
    
    // Clean up dead connections
    deadConnections.forEach(ws => extensionConnections.delete(ws));
    
    console.log(`✅ [Dashboard] Command sent to ${sentCount} extension(s) instantly!`);
    
    res.json({
      success: true,
      message: `${action} command sent`,
      method: 'websocket-push',
      commandId: commandId,
      connectionsNotified: sentCount,
      latency: '~20ms'
    });
    
  } catch (error) {
    console.error('❌ [Dashboard] Control error:', error.message);
    console.error('❌ [Dashboard] Control stack:', error.stack);
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
    
    // 🚀 NEW: Use WebSocket for real-time seeking (much faster than legacy methods)
    if (extensionConnections.size > 0) {
      console.log(`🎯 [Dashboard] Seeking via WebSocket to ${extensionConnections.size} extensions`);
      
      const successCount = broadcastToExtensions({
        type: 'seek',
        position: position,
        timestamp: Date.now()
      });
      
      if (successCount > 0) {
        console.log(`✅ [Dashboard] WebSocket seek broadcast successful: ${position}s`);
        res.json({
          success: true,
          position: position,
          method: 'websocket',
          extensionsNotified: successCount
        });
        return;
      }
    }
    
    // Fallback to legacy method if no WebSocket connections
    console.log(`🔄 [Dashboard] Falling back to legacy seek method`);
    const success = await mediaSessionDetector.seekToPosition(position);
    
    if (success) {
      console.log(`✅ [Dashboard] Legacy seek successful: ${position}s`);
      res.json({
        success: true,
        position: position,
        method: 'legacy'
      });
    } else {
      console.log(`❌ [Dashboard] All seek methods failed: ${position}s`);
      res.status(500).json({
        success: false,
        error: `Failed to seek to ${position}s - no active connections`
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
      isRecent: currentMedia?.timestamp ? (Date.now() - currentMedia.timestamp < 60000) : false
    });
    
    // First priority: Chrome Extension data (most accurate)
    if (currentMedia && currentMedia.timestamp && (Date.now() - currentMedia.timestamp < 60000)) {
      console.log('✅ [Dashboard] Using Chrome Extension data (most recent)');
      console.log('📊 [Dashboard] Chrome Extension data:', currentMedia);
      music = currentMedia;
      
      // 🚀 NEW: Enhance with real-time time data if available
      if (currentTimeData && currentTimeData.timestamp && (Date.now() - currentTimeData.timestamp < 5000)) {
        console.log('⏱️ [Dashboard] Enhancing with real-time time data');
        music = {
          ...music,
          position: currentTimeData.currentTime,
          duration: currentTimeData.duration || music.duration,
          isPlaying: currentTimeData.isPlaying,
          canSeek: currentTimeData.canSeek,
          realTimeData: true,
          lastTimeUpdate: currentTimeData.timestamp
        };
      }
    } else {
      console.log('🔄 [Dashboard] No recent Chrome Extension data - extension may need to reconnect');
      
      // 🚀 NEW: Check if we have real-time data without metadata
      if (currentTimeData && currentTimeData.timestamp && (Date.now() - currentTimeData.timestamp < 5000)) {
        console.log('⏱️ [Dashboard] Using real-time data only');
        music = {
          title: 'Playing',
          artist: 'Unknown',
          album: '',
          source: currentTimeData.source || 'Real-time',
          url: null,
          artwork: null,
          position: currentTimeData.currentTime,
          duration: currentTimeData.duration,
          isPlaying: currentTimeData.isPlaying,
          canSeek: currentTimeData.canSeek,
          realTimeData: true,
          lastTimeUpdate: currentTimeData.timestamp
        };
      } else {
        // No fallbacks - Chrome Extension is the only reliable source on macOS
        music = null;
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
    
    // Broadcast to all connected WebSocket clients (popups, dashboards)
    wss.clients.forEach(client => {
      if (client.readyState === client.OPEN) {
        try {
          client.send(JSON.stringify({
            type: 'media-update',
            data: currentMedia
          }));
        } catch (error) {
          console.error('❌ [WebSocket] Broadcast error:', error.message);
        }
      }
    });
    console.log(`📡 [WebSocket] Broadcasted to ${wss.clients.size} connected clients`);
    
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

/**
 * 🚀 BREAKTHROUGH FEATURE: Extension cross-window control endpoint
 * Stores commands for content scripts to poll and execute via background script
 */
app.post('/api/extension/control', (req, res) => {
  try {
    console.log(`📨 [Dashboard] Extension control request received:`, {
      body: req.body,
      headers: req.headers['content-type'],
      ip: req.ip
    });
    
    const { command } = req.body;
    console.log(`🎮 [Dashboard] Extension control request: ${command}`);
    
    if (!command || !['play', 'pause', 'nexttrack', 'previoustrack'].includes(command)) {
      console.log(`❌ [Dashboard] Invalid command: ${command}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid command. Use: play, pause, nexttrack, previoustrack'
      });
    }
    
    // Create pending command for content scripts to pick up
    const commandId = ++extensionCommandIdCounter;
    const pendingCommand = {
      id: commandId,
      command: command,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    pendingExtensionCommands.push(pendingCommand);
    console.log(`📋 [Dashboard] Command queue now has ${pendingExtensionCommands.length} commands:`, 
      pendingExtensionCommands.map(c => ({ id: c.id, command: c.command, status: c.status })));
    
    // Clean up old commands (older than 30 seconds)
    const thirtySecondsAgo = Date.now() - 30000;
    const initialLength = pendingExtensionCommands.length;
    pendingExtensionCommands = pendingExtensionCommands.filter(cmd => cmd.timestamp > thirtySecondsAgo);
    
    if (pendingExtensionCommands.length < initialLength) {
      console.log(`🧹 [Dashboard] Cleaned up ${initialLength - pendingExtensionCommands.length} old commands`);
    }
    
    console.log(`✅ [Dashboard] Command queued for extension: ${command} (ID: ${commandId})`);
    
    const response = {
      success: true,
      commandId: commandId,
      command: command,
      method: 'extension-coordination',
      message: 'Command queued for extension execution'
    };
    
    console.log(`📤 [Dashboard] Sending response:`, response);
    res.json(response);
    
  } catch (error) {
    console.error('❌ [Dashboard] Extension control error:', error.message);
    console.error('❌ [Dashboard] Extension control stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 📥 Content script polling endpoint - checks for pending commands
 */
app.get('/api/extension/poll', (req, res) => {
  try {
    console.log(`🔄 [Dashboard] Poll request from: ${req.ip} at ${new Date().toISOString()}`);
    console.log(`📋 [Dashboard] Total commands in queue: ${pendingExtensionCommands.length}`);
    
    // Get pending commands
    const pending = pendingExtensionCommands.filter(cmd => cmd.status === 'pending');
    console.log(`🔍 [Dashboard] Found ${pending.length} pending commands`);
    
    if (pending.length > 0) {
      console.log(`📤 [Dashboard] Sending ${pending.length} pending command(s) to content script:`, 
        pending.map(c => ({ id: c.id, command: c.command, age: Date.now() - c.timestamp })));
      
      // Mark as sent
      pending.forEach(cmd => {
        cmd.status = 'sent';
        cmd.sentAt = Date.now();
        console.log(`✅ [Dashboard] Marked command ${cmd.id} (${cmd.command}) as sent`);
      });
      
      const response = {
        success: true,
        commands: pending
      };
      
      console.log(`📤 [Dashboard] Poll response:`, response);
      res.json(response);
    } else {
      console.log(`📤 [Dashboard] No pending commands, sending empty response`);
      const response = {
        success: true,
        commands: []
      };
      res.json(response);
    }
    
  } catch (error) {
    console.error('❌ [Dashboard] Extension poll error:', error.message);
    console.error('❌ [Dashboard] Extension poll stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 📬 Content script result reporting endpoint
 */
app.post('/api/extension/result', (req, res) => {
  try {
    const { commandId, success, result, error } = req.body;
    console.log(`📬 [Dashboard] Extension result: Command ${commandId} - ${success ? 'SUCCESS' : 'FAILED'}`);
    
    // Find and update the command
    const command = pendingExtensionCommands.find(cmd => cmd.id === commandId);
    if (command) {
      command.status = success ? 'completed' : 'failed';
      command.result = result;
      command.error = error;
      command.completedAt = Date.now();
    }
    
    res.json({
      success: true,
      message: 'Result recorded'
    });
    
  } catch (error) {
    console.error('❌ [Dashboard] Extension result error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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
wss.on('connection', (ws, req) => {
  console.log('🔌 [WebSocket] Client connected from:', req.socket.remoteAddress);
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 [WebSocket] Received:', message);
      
      if (message.type === 'extension-register') {
        // Register as extension connection
        extensionConnections.add(ws);
        console.log(`🎯 [WebSocket] Extension registered. Total extensions: ${extensionConnections.size}`);
        
        ws.send(JSON.stringify({
          type: 'registration-success',
          timestamp: Date.now()
        }));
        
      } else if (message.type === 'command-result') {
        // Handle command execution result from extension
        console.log(`📬 [WebSocket] Command result: ${message.commandId} - ${message.success ? 'SUCCESS' : 'FAILED'}`);
        
        // Update command status in queue (if we still have polling fallback)
        const command = pendingExtensionCommands.find(cmd => cmd.id === message.commandId);
        if (command) {
          command.status = message.success ? 'completed' : 'failed';
          command.result = message.result;
          command.completedAt = Date.now();
        }
        
      } else if (message.type === 'timeupdate') {
        // 🎵 Handle real-time time updates from extension
        console.log(`⏱️ [WebSocket] Time update: ${message.currentTime}s / ${message.duration}s`);
        
        // Store current time data
        currentTimeData = {
          currentTime: message.currentTime || 0,
          duration: message.duration || 0,
          isPlaying: message.isPlaying || false,
          canSeek: message.canSeek || false,
          eventType: message.eventType || 'timeupdate',
          source: message.source || 'unknown',
          timestamp: Date.now()
        };
        
        // Broadcast to all connected audio apps via WebSocket
        // This enables real-time scrubber updates
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === 1) {
            try {
              client.send(JSON.stringify({
                type: 'timeupdate',
                data: currentTimeData
              }));
            } catch (error) {
              console.error('❌ [WebSocket] Failed to broadcast time update:', error.message);
            }
          }
        });
        
      } else if (message.type === 'seek') {
        // Handle seeking commands from audio apps
        console.log(`🎯 [WebSocket] Seek command: ${message.position}s`);
        
        // Broadcast seek command to extensions
        broadcastToExtensions({
          type: 'seek',
          position: message.position,
          timestamp: Date.now()
        });
        
      } else if (message.type === 'mediaData') {
        // 🎵 Handle media data from Chrome extension
        console.log(`🎵 [WebSocket] Media data received:`, message.data);
        
        // Store media data for HTTP endpoints
        if (!currentMedia) {
          currentMedia = {};
        }
        
        // Smart merge: Only update provided fields, preserve existing metadata
        const newData = message.data;
        
        // Always update these fields
        currentMedia.timestamp = message.timestamp || Date.now();
        currentMedia.source = 'chrome-extension-websocket';
        
        // Only update metadata fields if they're actually provided (not undefined/empty)
        if (newData.title !== undefined && newData.title !== '') {
          currentMedia.title = newData.title;
        }
        if (newData.artist !== undefined && newData.artist !== '') {
          currentMedia.artist = newData.artist;
        }
        if (newData.album !== undefined) {
          currentMedia.album = newData.album;
        }
        if (newData.artwork !== undefined && newData.artwork !== '') {
          currentMedia.artwork = newData.artwork;
        }
        
        // Always update playback state
        if (newData.isPlaying !== undefined) {
          currentMedia.isPlaying = newData.isPlaying;
        }
        if (newData.isPaused !== undefined) {
          currentMedia.isPaused = newData.isPaused;
        }
        
        // Update duration/position if provided
        if (newData.duration !== undefined) {
          currentMedia.duration = newData.duration;
        }
        if (newData.position !== undefined) {
          currentMedia.position = newData.position;
        }
        
        console.log(`✅ [WebSocket] Smart merged currentMedia:`, currentMedia);
        
        // Broadcast to other connected clients
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === 1) {
            try {
              client.send(JSON.stringify({
                type: 'media-update',
                data: currentMedia
              }));
            } catch (error) {
              console.error('❌ [WebSocket] Failed to broadcast media update:', error.message);
            }
          }
        });
        
      } else if (message.type === 'connection') {
        // Handle connection info from extension
        console.log(`🔗 [WebSocket] Extension connection info:`, message);
        extensionConnections.add(ws);
        console.log(`🎯 [WebSocket] Extension registered. Total extensions: ${extensionConnections.size}`);
        
      } else if (message.type === 'dashboard-register') {
        // Handle dashboard UI connection registration
        console.log(`🖥️ [WebSocket] Dashboard UI registered from:`, message.source);
        
        ws.send(JSON.stringify({
          type: 'registration-success',
          message: 'Dashboard UI connected successfully',
          timestamp: Date.now()
        }));
        
        // Send current media data immediately if available
        if (currentMedia && currentMedia.timestamp && (Date.now() - currentMedia.timestamp < 60000)) {
          console.log(`📤 [WebSocket] Sending current media to dashboard:`, currentMedia);
          ws.send(JSON.stringify({
            type: 'media-update',
            data: currentMedia
          }));
        }
        
      }
      
    } catch (error) {
      console.error('❌ [WebSocket] Message parsing error:', error.message);
    }
  });
  
  ws.on('close', () => {
    extensionConnections.delete(ws);
    console.log(`🔌 [WebSocket] Extension disconnected. Total extensions: ${extensionConnections.size}`);
  });
  
  ws.on('error', (error) => {
    console.error('❌ [WebSocket] Connection error:', error.message);
    extensionConnections.delete(ws);
  });
  
  // Send initial status for dashboard connections (not extensions)
  // Only send if we have recent Chrome Extension data - no broken AppleScript polling
  if (currentMedia && currentMedia.timestamp && (Date.now() - currentMedia.timestamp < 60000)) {
    try {
      ws.send(JSON.stringify({
        type: 'media-update',
        data: currentMedia
      }));
      console.log('📡 [WebSocket] Sent current Chrome Extension data to new connection');
    } catch (error) {
      console.error('❌ [WebSocket] Failed to send initial data:', error.message);
    }
  } else {
    console.log('📡 [WebSocket] No recent media data to send to new connection');
  }
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
            <button id="playPauseBtn" onclick="togglePlayPause()">▶️ Play</button>
            <button onclick="sendControl('nexttrack')">⏭️ Next</button>
          </div>
          
          <div id="connectionStatus" style="margin: 1rem 0; padding: 0.5rem; border-radius: 6px; background: #f8f9fa; font-size: 0.9rem; color: #6c757d;">
            🔌 Connecting to real-time updates...
          </div>
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
          
          // Global state
          let currentMediaData = null;
          let ws = null;
          
          async function sendControl(action) {
            try {
              const response = await fetch('/api/media/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
              });
              
              const data = await response.json();
              console.log('Control response:', data);
              
              // No need to refresh - WebSocket will update automatically
            } catch (error) {
              console.error('Control error:', error);
            }
          }
          
          // Smart play/pause toggle
          function togglePlayPause() {
            if (currentMediaData && currentMediaData.isPlaying) {
              sendControl('pause');
            } else {
              sendControl('play');
            }
          }
          
          // Update play/pause button based on current state
          function updatePlayPauseButton() {
            const btn = document.getElementById('playPauseBtn');
            if (currentMediaData && currentMediaData.isPlaying) {
              btn.innerHTML = '⏸️ Pause';
              btn.onclick = () => sendControl('pause');
            } else {
              btn.innerHTML = '▶️ Play';
              btn.onclick = () => sendControl('play');
            }
          }
          
          // Real-time UI update function
          function updateUI(mediaData) {
            const statusDiv = document.getElementById('status');
            
            if (mediaData) {
              currentMediaData = mediaData;
              const progress = mediaData.duration > 0 ? (mediaData.position / mediaData.duration) * 100 : 0;
              
              statusDiv.innerHTML = \`
                <div class="metadata">
                  \${mediaData.artwork ? \`<img src="\${mediaData.artwork}" class="artwork" alt="Artwork">\` : '<div class="artwork" style="background: #e9ecef;"></div>'}
                  <div class="track-info">
                    <h3>\${mediaData.title}</h3>
                    <p><strong>Artist:</strong> \${mediaData.artist}</p>
                    <p><strong>Album:</strong> \${mediaData.album || 'N/A'}</p>
                    <p><strong>Source:</strong> \${mediaData.source}</p>
                    <p><strong>Status:</strong> \${mediaData.isPlaying ? '▶️ Playing' : '⏸️ Paused'}</p>
                    
                    <div class="progress-container">
                      <div class="progress-bar" onclick="seekTo(event)" data-duration="\${mediaData.duration || 0}">
                        <div class="progress-fill" style="width: \${progress}%"></div>
                      </div>
                      <div class="progress-times">
                        <span>\${formatTime(mediaData.position || 0)}</span>
                        <span>\${formatTime(mediaData.duration || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              \`;
              
              updatePlayPauseButton();
            } else {
              statusDiv.innerHTML = '<p>❌ No media detected</p>';
              currentMediaData = null;
              updatePlayPauseButton();
            }
          }
          
          // WebSocket connection for real-time updates
          function connectWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = \`\${protocol}//\${window.location.host}\`;
            
            console.log('🔌 Connecting to WebSocket:', wsUrl);
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
              console.log('✅ WebSocket connected - real-time updates enabled');
              document.getElementById('connectionStatus').innerHTML = '✅ Real-time updates active';
              document.getElementById('connectionStatus').style.background = '#d4edda';
              document.getElementById('connectionStatus').style.color = '#155724';
              
              // Send registration
              ws.send(JSON.stringify({
                type: 'dashboard-register',
                source: 'dashboard-ui',
                timestamp: Date.now()
              }));
              
              // Initial data load
              refreshStatus();
            };
            
            ws.onmessage = (event) => {
              try {
                const message = JSON.parse(event.data);
                console.log('📥 [WebSocket] Received:', message);
                
                if (message.type === 'media-update') {
                  // Real-time media data update
                  updateUI(message.data);
                } else if (message.type === 'timeupdate') {
                  // Real-time position update
                  if (currentMediaData && message.data) {
                    currentMediaData.position = message.data.currentTime;
                    currentMediaData.duration = message.data.duration;
                    currentMediaData.isPlaying = message.data.isPlaying;
                    updateUI(currentMediaData);
                  }
                }
              } catch (error) {
                console.error('❌ WebSocket message error:', error);
              }
            };
            
            ws.onclose = () => {
              console.log('❌ WebSocket disconnected');
              document.getElementById('connectionStatus').innerHTML = '❌ Connection lost - attempting reconnect...';
              document.getElementById('connectionStatus').style.background = '#f8d7da';
              document.getElementById('connectionStatus').style.color = '#721c24';
              
              // Reconnect after 2 seconds
              setTimeout(connectWebSocket, 2000);
            };
            
            ws.onerror = (error) => {
              console.error('💥 WebSocket error:', error);
            };
          }
          
          // Fallback manual refresh (only used on initial load and for manual testing)
          async function refreshStatus() {
            try {
              const response = await fetch('/api/media/status');
              const data = await response.json();
              
              if (data.success && data.data) {
                updateUI(data.data);
              } else {
                updateUI(null);
              }
            } catch (error) {
              console.error('❌ Error fetching status:', error);
              updateUI(null);
            }
          }
          
          // Initialize WebSocket connection on page load
          connectWebSocket();
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
  console.log(`  POST /api/media/control   - Send control commands (Direct + Cross-Window)`);
  console.log(`  POST /obs-nowplaying      - Chrome extension data endpoint`);
  console.log(`  POST /nowplaying          - Chrome extension data endpoint`);
  console.log(`🚀 NEW CROSS-WINDOW ENDPOINTS:`);
  console.log(`  POST /api/extension/control - Extension cross-window control`);
  console.log(`  GET  /api/extension/poll    - Content script command polling`);
  console.log(`  POST /api/extension/result  - Command result reporting`);
  console.log(`  GET  /health              - Server health check`);
  console.log(`  WS   /                    - WebSocket for real-time data`);
  console.log(`  GET  /                    - Enhanced Dashboard UI`);
  console.log(`🚀 Server ready! Now with CROSS-WINDOW MEDIA CONTROL capability!`);
  
  // Server is now ready to receive Chrome Extension WebSocket data
  console.log('📡 [Server] Waiting for Chrome Extension connections...');
  console.log('🎵 [Server] Real-time media detection via WebSocket only');
}); 