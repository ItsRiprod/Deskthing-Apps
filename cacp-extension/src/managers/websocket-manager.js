/**
 * WebSocket Manager for CACP
 * Handles connection to DeskThing app with auto-reconnection and error handling
 */

import logger from '@logger';

export class WebSocketManager {
  constructor() {
    // Initialize logger
    this.log = logger.websocketManager;
    
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
    
    this.log.debug('WebSocket Manager created', {
      config: {
        host: this.host,
        port: this.port,
        protocol: this.protocol,
        maxReconnectAttempts: this.maxReconnectAttempts,
        pingInterval: this.pingIntervalTime
      }
    });
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
      this.log.info('Connecting to WebSocket', { 
        url, 
        attempt: this.reconnectAttempts + 1,
        maxAttempts: this.maxReconnectAttempts 
      });
      
      this.ws = new WebSocket(url);
      
      // Set up event handlers
      this.ws.onopen = (event) => this.handleOpen(event);
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onclose = (event) => this.handleClose(event);
      this.ws.onerror = (event) => this.handleError(event);

      // Wait for connection to establish
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.log.warn('WebSocket connection timeout', { 
            url, 
            timeoutMs: 5000 
          });
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
      this.log.error('WebSocket connection failed', {
        error: error.message,
        url,
        stack: error.stack
      });
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
      this.log.warn('Cannot send message - WebSocket not connected', {
        messageType: message.type,
        siteName,
        isConnected: this.isConnected,
        hasWebSocket: !!this.ws,
        readyState: this.ws?.readyState
      });
      return false;
    }

    try {
      // Add site identification to all messages
      const messageWithSite = {
        ...message,
        site: siteName
      };

      this.ws.send(JSON.stringify(messageWithSite));
      this.log.debug('Message sent to DeskThing', {
        messageType: message.type,
        siteName,
        messageSize: JSON.stringify(messageWithSite).length,
        hasData: !!message.data
      });
      return true;
    } catch (error) {
      this.log.error('Failed to send WebSocket message', {
        error: error.message,
        messageType: message.type,
        siteName,
        connectionState: this.isConnected,
        readyState: this.ws?.readyState
      });
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
    this.log.info('WebSocket connected successfully', {
      readyState: this.ws.readyState,
      url: this.ws.url,
      reconnectAttempts: this.reconnectAttempts,
      protocol: this.ws.protocol
    });
    
    this.isConnected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000; // Reset delay

    // Start ping interval
    this.startPingInterval();
    this.log.debug('Ping interval started', { intervalMs: this.pingIntervalTime });

    // Notify handler
    if (this.onConnectedHandler) {
      this.log.trace('Notifying connected handler');
      this.onConnectedHandler(event);
    }
  }

  /**
   * Handle WebSocket message event
   */
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      this.log.debug('Received message from DeskThing', {
        type: message.type,
        hasData: !!message.data,
        messageSize: event.data.length,
        commandId: message.commandId || null
      });

      // Handle command responses
      if (message.type === 'command-result' && message.commandId) {
        this.log.trace('Handling command response', { 
          commandId: message.commandId,
          success: message.success 
        });
        this.handleCommandResponse(message);
        return;
      }

      // Forward to message handler
      if (this.onMessageHandler) {
        this.log.trace('Forwarding message to handler', { 
          messageType: message.type 
        });
        this.onMessageHandler(message);
      } else {
        this.log.warn('No message handler registered for incoming message', {
          messageType: message.type
        });
      }

    } catch (error) {
      this.log.error('Failed to parse WebSocket message', {
        error: error.message,
        rawData: event.data.substring(0, 200), // First 200 chars for debugging
        dataLength: event.data.length
      });
    }
  }

  /**
   * Handle WebSocket close event
   */
  handleClose(event) {
    const isIntentional = event.code === 1000;
    const willReconnect = !isIntentional && this.reconnectAttempts < this.maxReconnectAttempts;
    
    this.log.info('WebSocket closed', {
      code: event.code,
      reason: event.reason || 'No reason provided',
      wasClean: event.wasClean,
      isIntentional,
      willReconnect,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    });
    
    this.cleanup();

    // Notify handler
    if (this.onDisconnectedHandler) {
      this.log.trace('Notifying disconnected handler');
      this.onDisconnectedHandler(event);
    }

    // Attempt reconnection if not intentional close
    if (willReconnect) {
      this.log.debug('Scheduling reconnect attempt', {
        attempt: this.reconnectAttempts + 1,
        maxAttempts: this.maxReconnectAttempts,
        delay: this.reconnectDelay
      });
      this.scheduleReconnect();
    } else if (!isIntentional) {
      this.log.warn('WebSocket closed and max reconnect attempts reached', {
        finalAttempts: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts
      });
    }
  }

  /**
   * Handle WebSocket error event
   */
  handleError(event) {
    this.log.error('WebSocket error occurred', {
      type: event.type,
      target: event.target?.constructor?.name,
      readyState: this.ws?.readyState,
      url: this.ws?.url,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts
    });
    
    this.isConnecting = false;

    // Notify handler
    if (this.onErrorHandler) {
      this.log.trace('Notifying error handler');
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
