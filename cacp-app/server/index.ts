import { DeskThing } from "@deskthing/server";
import { DESKTHING_EVENTS } from "@deskthing/types";
import { WebSocketServer, WebSocket } from 'ws';
import { CACPMediaStore } from "./mediaStore";
import { deleteImages } from "./imageUtils";
import { initializeListeners } from "./initializer";
import { readFileSync } from 'fs';
import { join } from 'path';

let wss: WebSocketServer | null = null;

/**
 * Enhanced CACP Server with comprehensive logging and image processing
 * Borrowed robust functionality from SoundCloud app for production-ready operation
 */

// Dynamic version loading for logging
let CACP_VERSION = 'unknown';
try {
  const packagePath = join(__dirname, '../package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  CACP_VERSION = packageJson.version;
} catch (error) {
  console.warn('Could not load CACP version from package.json');
}

type ExtensionMessage = {
  type: 'connection' | 'mediaData' | 'timeupdate' | 'command-result';
  site?: string;
  sourceId?: string | number;
  data?: { title?: string; artist?: string; album?: string; artwork?: string; isPlaying?: boolean };
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  version?: string;
  action?: string;
  success?: boolean;
  commandId?: string;
};

const startWsServer = async () => {
  const port = Number(process.env.CACP_WS_PORT || 8081);
  wss = new WebSocketServer({ port });
  DeskThing.sendLog(`🎯 [CACP-Server] WebSocket server listening on port ${port} for Chrome extension connections`);

  wss.on('connection', (ws, req) => {
    const clientIp = req.socket.remoteAddress;
    DeskThing.sendLog(`🔌 [CACP-Server] Chrome extension connected from: ${clientIp}`);
    
    // Get MediaStore instance and set WebSocket connection
    const mediaStore = CACPMediaStore.getInstance();
    mediaStore.setExtensionWebSocket(ws);

    ws.on('message', (raw) => {
      try {
        const msg: ExtensionMessage = JSON.parse(raw.toString());
        DeskThing.sendLog(`📨 [CACP-Server] Received from extension: ${msg.type} ${msg.site ? `(${msg.site})` : ''}`);
        
        // Route all messages to MediaStore for processing
        mediaStore.handleExtensionMessage(msg);
        
      } catch (error: any) {
        DeskThing.sendError(`❌ [CACP-Server] WebSocket message parse error: ${error?.message || error}`);
        console.error('Full parse error:', error);
      }
    });

    ws.on('close', () => {
      DeskThing.sendLog('🔌 [CACP-Server] Chrome extension disconnected');
    });

    ws.on('error', (error) => {
      DeskThing.sendError(`❌ [CACP-Server] WebSocket client error: ${error.message}`);
    });
  });

  wss.on('error', (error) => {
    DeskThing.sendError(`❌ [CACP-Server] WebSocket server error: ${error.message}`);
  });
};



const start = async () => {
  try {
    DeskThing.sendLog(`🚀 [CACP-Server] Starting enhanced CACP app v${CACP_VERSION} with comprehensive logging and image processing`);
    
    // Initialize event listeners first
    await initializeListeners();
    
    // Start WebSocket server
    await startWsServer();
    
    DeskThing.sendLog(`✅ [CACP-Server] CACP App v${CACP_VERSION} Started Successfully - Ready for Chrome extension connections`);
    
    // Log status for debugging
    const mediaStore = CACPMediaStore.getInstance();
    const status = mediaStore.getStatus();
    DeskThing.sendLog(`📊 [CACP-Server] v${CACP_VERSION} Initial status: ${JSON.stringify(status, null, 2)}`);
    
  } catch (error: any) {
    DeskThing.sendError(`❌ [CACP-Server] Failed to start CACP app: ${error?.message || error}`);
    throw error;
  }
};

const stop = async () => {
  try {
    DeskThing.sendLog('🛑 [CACP-Server] Stopping CACP app');
    
    // Stop MediaStore
    const mediaStore = CACPMediaStore.getInstance();
    mediaStore.stop();
    
    // Close WebSocket server
    if (wss) {
      wss.close((error) => {
        if (error) {
          DeskThing.sendError(`❌ [CACP-Server] Error closing WebSocket server: ${error.message}`);
        } else {
          DeskThing.sendLog('🔌 [CACP-Server] WebSocket server closed successfully');
        }
      });
      wss = null;
    }
    
    // Clean up images
    deleteImages();
    
    DeskThing.sendLog('✅ [CACP-Server] CACP App Stopped Successfully');
    
  } catch (error: any) {
    DeskThing.sendError(`❌ [CACP-Server] Error during stop: ${error?.message || error}`);
  }
};

const purge = async () => {
  try {
    DeskThing.sendLog('🧹 [CACP-Server] Purging CACP app data');
    
    // Purge MediaStore
    const mediaStore = CACPMediaStore.getInstance();
    mediaStore.purge();
    
    // Close WebSocket server
    if (wss) {
      wss.close();
      wss = null;
    }
    
    // Clean up images
    deleteImages();
    
    DeskThing.sendLog('✅ [CACP-Server] CACP App Purged Successfully');
    
  } catch (error: any) {
    DeskThing.sendError(`❌ [CACP-Server] Error during purge: ${error?.message || error}`);
  }
};

DeskThing.on(DESKTHING_EVENTS.START, start);
DeskThing.on(DESKTHING_EVENTS.STOP, stop);
DeskThing.on(DESKTHING_EVENTS.PURGE, purge);

