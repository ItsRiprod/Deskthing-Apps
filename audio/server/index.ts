import { DeskThing } from "@deskthing/server";
import { DESKTHING_EVENTS } from "@deskthing/types";
import { initializeListeners } from "./initializer"
import { MediaStore } from "./mediaStore";
import { deleteImages } from "./imageUtils";
import { WebSocketServer } from 'ws';

let wss: WebSocketServer | null = null;

/**
 * Initialize WebSocket server for Chrome extension connections
 * Following Discord/Spotify DeskThing app patterns for external data sources
 */
const initializeWebSocketServer = async () => {
  try {
    wss = new WebSocketServer({ port: 8081 });
    console.log('🎵 [Audio] WebSocket server listening on port 8081 for Chrome extension');
    
    wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      console.log(`🔌 [Audio] Chrome extension connected from: ${clientIp}`);
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log(`📨 [Audio] Received from extension:`, message.type || 'unknown');
          
          // Route extension messages to MediaStore
          const mediaStore = MediaStore.getInstance();
          
          // Set WebSocket connection for sending commands back to extension
          mediaStore.setExtensionWebSocket(ws);
          
          // Process the message
          mediaStore.handleExtensionMessage(message);
          
        } catch (error) {
          console.error('❌ [Audio] WebSocket message parse error:', error);
        }
      });
      
      ws.on('close', () => {
        console.log('🔌 [Audio] Chrome extension disconnected');
      });
      
      ws.on('error', (error) => {
        console.error('❌ [Audio] WebSocket client error:', error);
      });
    });
    
    wss.on('error', (error) => {
      console.error('❌ [Audio] WebSocket server error:', error);
    });
    
  } catch (error) {
    console.error('❌ [Audio] Failed to start WebSocket server:', error);
  }
};

const start = async () => {
  await initializeListeners()
  await initializeWebSocketServer() // Add WebSocket server for Chrome extension
  DeskThing.sendLog('Audio Server Started with Chrome Extension WebSocket support!');
};

const stop = async () => {
  // Function called when the server is stopped
  const mediaStore = MediaStore.getInstance()
  mediaStore.stop()
  deleteImages()
  
  // Close WebSocket server
  if (wss) {
    wss.close((error) => {
      if (error) {
        console.error('❌ [Audio] Error closing WebSocket server:', error);
      } else {
        console.log('🔌 [Audio] WebSocket server closed');
      }
    });
    wss = null;
  }
  
  DeskThing.sendLog('Server Stopped');
};

const purge = async () => {
  // Function called when the server is stopped
  const mediaStore = MediaStore.getInstance()
  mediaStore.purge()
  deleteImages()
  
  // Close WebSocket server
  if (wss) {
    wss.close();
    wss = null;
  }
  
  DeskThing.sendLog('Server Purged');
};

// Main Entrypoint of the server
DeskThing.on(DESKTHING_EVENTS.START, start);

// Main exit point of the server
DeskThing.on(DESKTHING_EVENTS.STOP, stop);

// Main exit point of the server
DeskThing.on(DESKTHING_EVENTS.PURGE, purge);