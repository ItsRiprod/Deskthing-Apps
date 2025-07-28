/**
 * WebSocket Manager for CACP (Chrome Audio Control Platform)
 * 
 * Handles WebSocket communication between Chrome extension and DeskThing app.
 * Sends site-identified messages and routes commands to appropriate handlers.
 */

export class WebSocketManager {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.pingInterval = null;
    this.pingIntervalTime = 30000; // 30 seconds
    this.commandId = 0;
    this.pendingCommands = new Map(); // commandId -> { resolve, reject, timeout }
    
    // Connection config
    this.host = 'localhost';
    this.port = 8081;
    this.protocol = 'ws';
    
    // Event handlers
    this.onMessageHandler = null;
    this.onConnectedHandler = null;
    this.onDisconnectedHandler = null;
    this.onErrorHandler = null;
  }

  /**
   * Connect to DeskThing WebSocket server
   * @returns {Promise<boolean>} True if connected successfully
   */
  async connect() {
    if (this.isConnected || this.isConnecting) {
      return this.isConnected;
    }

    this.isConnecting = true;
    const url = `${this.protocol}://${this.host}:${this.port}`;

    try {
      console.log(`[CACP] Connecting to WebSocket: ${url}`);
      
      this.ws = new WebSocket(url);
      
      // Set up event handlers
      this.ws.onopen = (event) => this.handleOpen(event);
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onclose = (event) => this.handleClose(event);
      this.ws.onerror = (event) => this.handleError(event);

      // Wait for connection to establish
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000);

        this.ws.onopen = (event) => {
          clearTimeout(timeout);
          this.handleOpen(event);
          resolve(true);
        };

        this.ws.onerror = (event) => {
          clearTimeout(timeout);
          this.handleError(event);
          resolve(false);
        };
      });

    } catch (error) {
      console.error('[CACP] WebSocket connection failed:', error);
      this.isConnecting = false;
      return false;
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.ws) {
      console.log('[CACP] Disconnecting WebSocket');
      this.ws.close(1000, 'Client disconnect');
    }
    this.cleanup();
  }

  /**
   * Send message to DeskThing app
   * @param {Object} message Message object
   * @param {string} siteName Site name for identification
   */
  sendMessage(message, siteName) {
    if (!this.isConnected || !this.ws) {
      console.warn('[CACP] Cannot send message - not connected:', message);
      return false;
    }

    try {
      // Add site identification to all messages
      const messageWithSite = {
        ...message,
        site: siteName
      };

      this.ws.send(JSON.stringify(messageWithSite));
      console.log(`[CACP] Sent message to DeskThing:`, messageWithSite);
      return true;
    } catch (error) {
      console.error('[CACP] Failed to send message:', error);
      return false;
    }
  }

  /**
   * Send connection handshake
   * @param {string} siteName Site name
   * @param {string} version Extension version
   */
  sendConnectionHandshake(siteName, version = '0.1.0') {
    return this.sendMessage({
      type: 'connection',
      source: 'chrome-extension',
      version: version
    }, siteName);
  }

  /**
   * Send media data update
   * @param {Object} mediaData Track metadata
   * @param {string} siteName Site name
   */
  sendMediaData(mediaData, siteName) {
    return this.sendMessage({
      type: 'mediaData',
      data: mediaData
    }, siteName);
  }

  /**
   * Send time update
   * @param {number} currentTime Current position in seconds
   * @param {number} duration Total duration in seconds
   * @param {boolean} isPlaying Whether audio is playing
   * @param {string} siteName Site name
   */
  sendTimeUpdate(currentTime, duration, isPlaying, siteName) {
    return this.sendMessage({
      type: 'timeupdate',
      currentTime,
      duration,
      isPlaying
    }, siteName);
  }

  /**
   * Send command result
   * @param {string} commandId Command ID from original command
   * @param {boolean} success Whether command succeeded
   * @param {Object} result Command result data
   * @param {string} siteName Site name
   */
  sendCommandResult(commandId, success, result, siteName) {
    return this.sendMessage({
      type: 'command-result',
      commandId,
      success,
      result
    }, siteName);
  }

  /**
   * Send command with response tracking
   * @param {Object} command Command object
   * @param {string} siteName Site name
   * @param {number} timeoutMs Timeout in milliseconds
   * @returns {Promise<Object>} Command response
   */
  async sendCommand(command, siteName, timeoutMs = 5000) {
    const commandId = (++this.commandId).toString();
    const commandWithId = {
      ...command,
      id: commandId
    };

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingCommands.delete(commandId);
        reject(new Error(`Command ${commandId} timed out`));
      }, timeoutMs);

      // Store pending command
      this.pendingCommands.set(commandId, {
        resolve,
        reject,
        timeout
      });

      // Send command
      if (!this.sendMessage(commandWithId, siteName)) {
        this.pendingCommands.delete(commandId);
        clearTimeout(timeout);
        reject(new Error('Failed to send command'));
      }
    });
  }

  /**
   * Set message handler
   * @param {Function} handler Handler function for incoming messages
   */
  setMessageHandler(handler) {
    this.onMessageHandler = handler;
  }

  /**
   * Set connection state handlers
   * @param {Function} onConnected Handler for connection established
   * @param {Function} onDisconnected Handler for connection lost
   * @param {Function} onError Handler for connection errors
   */
  setConnectionHandlers(onConnected, onDisconnected, onError) {
    this.onConnectedHandler = onConnected;
    this.onDisconnectedHandler = onDisconnected;
    this.onErrorHandler = onError;
  }

  /**
   * Handle WebSocket open event
   */
  handleOpen(event) {
    console.log('[CACP] WebSocket connected');
    this.isConnected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000; // Reset delay

    // Start ping interval
    this.startPingInterval();

    // Notify handler
    if (this.onConnectedHandler) {
      this.onConnectedHandler(event);
    }
  }

  /**
   * Handle WebSocket message event
   */
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      console.log('[CACP] Received message from DeskThing:', message);

      // Handle command responses
      if (message.type === 'command-result' && message.commandId) {
        this.handleCommandResponse(message);
        return;
      }

      // Forward to message handler
      if (this.onMessageHandler) {
        this.onMessageHandler(message);
      }

    } catch (error) {
      console.error('[CACP] Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  handleClose(event) {
    console.log(`[CACP] WebSocket closed: ${event.code} - ${event.reason}`);
    this.cleanup();

    // Notify handler
    if (this.onDisconnectedHandler) {
      this.onDisconnectedHandler(event);
    }

    // Attempt reconnection if not intentional close
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  handleError(event) {
    console.error('[CACP] WebSocket error:', event);
    this.isConnecting = false;

    // Notify handler
    if (this.onErrorHandler) {
      this.onErrorHandler(event);
    }
  }

  /**
   * Handle command response
   */
  handleCommandResponse(message) {
    const { commandId, success, result } = message;
    const pending = this.pendingCommands.get(commandId);

    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingCommands.delete(commandId);

      if (success) {
        pending.resolve(result);
      } else {
        pending.reject(new Error(result?.error || 'Command failed'));
      }
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    this.reconnectAttempts++;
    
    console.log(`[CACP] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff with jitter
    this.reconnectDelay = Math.min(
      this.reconnectDelay * 2 + Math.random() * 1000,
      this.maxReconnectDelay
    );
  }

  /**
   * Start ping interval to keep connection alive
   */
  startPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({ type: 'ping' }, 'system');
      }
    }, this.pingIntervalTime);
  }

  /**
   * Clean up connection state
   */
  cleanup() {
    this.isConnected = false;
    this.isConnecting = false;
    this.ws = null;

    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Reject all pending commands
    for (const [commandId, pending] of this.pendingCommands.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection closed'));
    }
    this.pendingCommands.clear();
  }

  /**
   * Get connection status
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      pendingCommands: this.pendingCommands.size,
      url: `${this.protocol}://${this.host}:${this.port}`
    };
  }

  /**
   * Set connection parameters
   * @param {string} host WebSocket host
   * @param {number} port WebSocket port
   * @param {string} protocol WebSocket protocol (ws or wss)
   */
  setConnectionParams(host, port, protocol = 'ws') {
    this.host = host;
    this.port = port;
    this.protocol = protocol;
  }

  /**
   * Test connection without full setup
   * @returns {Promise<boolean>} True if server is reachable
   */
  async testConnection() {
    const url = `${this.protocol}://${this.host}:${this.port}`;
    
    try {
      const testWs = new WebSocket(url);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 3000);
        
        testWs.onopen = () => {
          clearTimeout(timeout);
          testWs.close();
          resolve(true);
        };
        
        testWs.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      });
    } catch (error) {
      return false;
    }
  }
}

export default WebSocketManager;
