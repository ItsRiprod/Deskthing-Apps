/**
 * DeskThing Media Bridge - Content Script
 * SoundCloud MSE + MediaSession API Integration
 * @version Dynamic (reads from manifest)
 */

// Get version dynamically from manifest
const getExtensionVersion = () => {
  try {
    return chrome.runtime.getManifest().version;
  } catch (error) {
    console.warn('Could not get extension version:', error);
    return 'unknown';
  }
};

const EXTENSION_VERSION = getExtensionVersion();

console.log(`🎵 DeskThing Media Bridge v${EXTENSION_VERSION} loaded on:`, window.location.hostname);
console.log(`🔍 [Content] Page URL:`, window.location.href);
console.log(`🔍 [Content] Page readyState:`, document.readyState);

/**
 * 🎯 SoundCloud MSE Detection & MediaSession Integration
 * Based on actual SoundCloud architecture: Fetch API + MediaSource Extensions + MediaSession
 */

class SoundCloudMSEDetector {
  constructor() {
    this.isStreamingActive = false;
    this.currentTrack = null;
    this.mediaSessionData = {};
    this.positionUpdateInterval = null;
    this.setupFetchInterception();
    this.setupMediaSessionMonitoring();
    this.setupMediaSourceDetection();
  }

  /**
   * 🔗 Intercept Fetch API calls to detect audio streaming
   */
  setupFetchInterception() {
    console.log('🔧 [MSE] Setting up Fetch API interception...');
    
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const urlString = typeof url === 'string' ? url : url.toString();
      
      // Detect SoundCloud audio segment requests
      if (urlString.includes('media-streaming.soundcloud.cloud') && 
          (urlString.includes('.m4s') || urlString.includes('aac_'))) {
        
        console.log('🎵 [MSE] Audio segment detected:', urlString);
        this.handleAudioSegmentRequest(urlString);
      }
      
      return originalFetch.apply(this, args);
    };
  }

  /**
   * 📡 Monitor MediaSession API for position and metadata
   */
  setupMediaSessionMonitoring() {
    console.log('🔧 [MediaSession] Setting up MediaSession monitoring...');
    
    // Check MediaSession availability
    if (!navigator.mediaSession) {
      console.warn('⚠️ [MediaSession] MediaSession API not available');
      return;
    }

    // Monitor MediaSession metadata changes
    const checkMediaSession = () => {
      if (navigator.mediaSession.metadata) {
        const metadata = navigator.mediaSession.metadata;
        const newTrack = {
          title: metadata.title || 'Unknown',
          artist: metadata.artist || 'Unknown',
          album: metadata.album || '',
          artwork: metadata.artwork || []
        };

        // Check if track changed
        if (!this.currentTrack || this.currentTrack.title !== newTrack.title) {
          console.log('🎵 [MediaSession] New track detected:', newTrack);
          this.currentTrack = newTrack;
          this.onTrackChange(newTrack);
        }
      }

      // Check playback state
      const playbackState = navigator.mediaSession.playbackState;
      if (playbackState) {
        this.handlePlaybackStateChange(playbackState);
      }
    };

    // Poll MediaSession data
    setInterval(checkMediaSession, 500);
  }

  /**
   * 🎬 Detect MediaSource usage for duration/position
   */
  setupMediaSourceDetection() {
    console.log('🔧 [MediaSource] Setting up MediaSource detection...');
    
    // Hook MediaSource constructor
    const OriginalMediaSource = window.MediaSource;
    if (OriginalMediaSource) {
      window.MediaSource = function(...args) {
        console.log('🎵 [MediaSource] MediaSource created');
        const ms = new OriginalMediaSource(...args);
        
        // Hook sourceopen event
        ms.addEventListener('sourceopen', () => {
          console.log('🎵 [MediaSource] Source opened - streaming active');
          this.isStreamingActive = true;
          this.startPositionTracking();
        });

        ms.addEventListener('sourceclose', () => {
          console.log('🎵 [MediaSource] Source closed - streaming stopped');
          this.isStreamingActive = false;
          this.stopPositionTracking();
        });

        return ms;
      }.bind(this);
    }

    // Also hook HTMLMediaElement.srcObject for MSE detection
    this.hookMediaElementSrcObject();
  }

  /**
   * 🔗 Hook HTMLMediaElement.srcObject to detect MSE usage
   */
  hookMediaElementSrcObject() {
    const elements = ['HTMLAudioElement', 'HTMLVideoElement', 'HTMLMediaElement'];
    
    elements.forEach(elementName => {
      const ElementClass = window[elementName];
      if (ElementClass && ElementClass.prototype) {
        const originalSrcObjectDescriptor = Object.getOwnPropertyDescriptor(ElementClass.prototype, 'srcObject');
        
        if (originalSrcObjectDescriptor && originalSrcObjectDescriptor.set) {
          Object.defineProperty(ElementClass.prototype, 'srcObject', {
            set: function(value) {
              if (value instanceof MediaSource) {
                console.log('🎵 [MSE] MediaSource attached to', elementName, this);
                window.discoveredMSEElement = this;
                this.addEventListener('timeupdate', () => this.handleTimeUpdate());
                this.addEventListener('durationchange', () => this.handleDurationChange());
                this.addEventListener('play', () => this.handlePlay());
                this.addEventListener('pause', () => this.handlePause());
              }
              return originalSrcObjectDescriptor.set.call(this, value);
            },
            get: originalSrcObjectDescriptor.get,
            configurable: true,
            enumerable: true
          });
        }
      }
    });
  }

  /**
   * 🎵 Handle audio segment streaming detection
   */
  handleAudioSegmentRequest(url) {
    if (!this.isStreamingActive) {
      this.isStreamingActive = true;
      console.log('🎵 [MSE] Audio streaming started');
      this.startPositionTracking();
    }
  }

  /**
   * ▶️ Handle track changes
   */
  onTrackChange(track) {
    console.log('🎵 [Track] Track changed:', track);
    this.broadcastMediaData({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: track.artwork[0]?.src || '',
      isPlaying: navigator.mediaSession.playbackState === 'playing'
    });
  }

  /**
   * ⏯️ Handle playback state changes
   */
  handlePlaybackStateChange(state) {
    console.log('🎵 [MediaSession] Playback state:', state);
    
    if (state === 'playing') {
      this.startPositionTracking();
    } else if (state === 'paused') {
      this.stopPositionTracking();
    }

    this.broadcastMediaData({
      isPlaying: state === 'playing',
      isPaused: state === 'paused'
    });
  }

  /**
   * ⏱️ Start tracking playback position
   */
  startPositionTracking() {
    if (this.positionUpdateInterval) return;
    
    console.log('🎵 [Position] Starting position tracking...');
    
    this.positionUpdateInterval = setInterval(() => {
      this.updatePosition();
    }, 1000);
  }

  /**
   * ⏸️ Stop tracking playback position
   */
  stopPositionTracking() {
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval);
      this.positionUpdateInterval = null;
      console.log('🎵 [Position] Stopped position tracking');
    }
  }

  /**
   * 📊 Update current position and duration
   */
  updatePosition() {
    // Try to get position from discovered MSE element
    if (window.discoveredMSEElement) {
      const element = window.discoveredMSEElement;
      const position = element.currentTime || 0;
      const duration = element.duration || 0;
      
      if (duration > 0) {
        console.log(`🎵 [Position] MSE Element - Position: ${position.toFixed(1)}s / Duration: ${duration.toFixed(1)}s`);
        this.broadcastTimeUpdate(position, duration);
        return;
      }
    }

    // Fallback: Try to find any media element
    const mediaElements = document.querySelectorAll('audio, video');
    for (const element of mediaElements) {
      if (element.duration && element.duration > 0) {
        console.log(`🎵 [Position] Found media element - Position: ${element.currentTime.toFixed(1)}s / Duration: ${element.duration.toFixed(1)}s`);
        this.broadcastTimeUpdate(element.currentTime, element.duration);
        return;
      }
    }

    // Last resort: Use MediaSession position data if available
    this.estimatePositionFromMediaSession();
  }

  /**
   * 🔮 Estimate position from MediaSession (experimental)
   */
  estimatePositionFromMediaSession() {
    // MediaSession doesn't directly provide position, but we can estimate
    // This is a placeholder for more advanced position detection
    console.log('🎵 [Position] Using MediaSession estimation (limited accuracy)');
  }

  /**
   * 📡 Broadcast time updates via WebSocket
   */
  broadcastTimeUpdate(position, duration) {
    if (window.mediaWebSocket && window.mediaWebSocket.readyState === WebSocket.OPEN) {
      window.mediaWebSocket.send(JSON.stringify({
        type: 'timeupdate',
        currentTime: position,
        duration: duration,
        timestamp: Date.now()
      }));
    }
  }
  
  /**
   * 📡 Broadcast media data via WebSocket
   */
  broadcastMediaData(data) {
    if (window.mediaWebSocket && window.mediaWebSocket.readyState === WebSocket.OPEN) {
      window.mediaWebSocket.send(JSON.stringify({
        type: 'mediaData',
        data: data,
        timestamp: Date.now()
      }));
    }
  }
}

/**
 * 🌐 WebSocket Connection Management
 */
class WebSocketManager {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.connect();
  }

  connect() {
    try {
      console.log('🔗 [WebSocket] Connecting to dashboard server...');
      this.ws = new WebSocket('ws://localhost:8080');
      window.mediaWebSocket = this.ws;
      
      this.ws.onopen = () => {
        console.log('✅ [WebSocket] Connected to dashboard server');
        this.reconnectAttempts = 0;
        this.sendConnectionInfo();
      };
      
      this.ws.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.ws.onclose = () => {
        console.log('❌ [WebSocket] Connection closed');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('💥 [WebSocket] Connection error:', error);
      };
      
    } catch (error) {
      console.error('💥 [WebSocket] Failed to create connection:', error);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`🔄 [WebSocket] Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  sendConnectionInfo() {
    this.send({
      type: 'connection',
      source: 'chrome-extension',
      version: EXTENSION_VERSION,
      url: window.location.href,
      userAgent: navigator.userAgent
    });
  }

  handleMessage(message) {
    console.log('📨 [WebSocket] Received message:', message);
    
    switch (message.type) {
      case 'media-command':
        // Handle dashboard control commands
        console.log(`🎮 [WebSocket] Media command: ${message.action}`);
        switch (message.action) {
          case 'play':
            this.handlePlay();
            break;
          case 'pause':
            this.handlePause();
            break;
          case 'nexttrack':
            this.handleNext();
            break;
          case 'previoustrack':
            this.handlePrevious();
            break;
          default:
            console.warn('⚠️ [WebSocket] Unknown action:', message.action);
        }
        // Send result back to dashboard
        this.send({
          type: 'command-result',
          commandId: message.id,
          success: true,
          result: `Executed ${message.action}`,
          timestamp: Date.now()
        });
        break;
      case 'seek':
        this.handleSeek(message.time);
        break;
      case 'play':
        this.handlePlay();
        break;
      case 'pause':
        this.handlePause();
        break;
      case 'ping':
        this.send({ type: 'pong', timestamp: Date.now() });
        break;
    }
  }

  handleSeek(time) {
    console.log(`🎯 [Seek] Seeking to ${time}s`);
    
    // Try MSE element first
    if (window.discoveredMSEElement) {
      window.discoveredMSEElement.currentTime = time;
      return;
    }

    // Fallback to any media element
    const mediaElements = document.querySelectorAll('audio, video');
    for (const element of mediaElements) {
      if (element.duration && element.duration > 0) {
        element.currentTime = time;
        return;
      }
    }

    console.warn('⚠️ [Seek] No media element found for seeking');
  }

  handlePlay() {
    console.log('▶️ [Control] Play command');
    
    // Try MediaSession first
    if (navigator.mediaSession && navigator.mediaSession.setActionHandler) {
      navigator.mediaSession.setActionHandler('play', null);
    }

    // Try media elements
    const mediaElements = document.querySelectorAll('audio, video');
    for (const element of mediaElements) {
      if (element.play) {
        element.play();
        return;
      }
    }

    // Try clicking play button
    const playButton = document.querySelector('.playControl, .playButton, [aria-label*="play" i]');
    if (playButton) {
      playButton.click();
    }
  }

  handlePause() {
    console.log('⏸️ [Control] Pause command');
    
    // Try MediaSession first
    if (navigator.mediaSession && navigator.mediaSession.setActionHandler) {
      navigator.mediaSession.setActionHandler('pause', null);
    }

    // Try media elements
    const mediaElements = document.querySelectorAll('audio, video');
    for (const element of mediaElements) {
      if (element.pause) {
        element.pause();
        return;
      }
    }

    // Try clicking pause button
    const pauseButton = document.querySelector('.pauseControl, .pauseButton, [aria-label*="pause" i]');
    if (pauseButton) {
      pauseButton.click();
    }
  }

  handleNext() {
    console.log('⏭️ [Control] Next track command');
    
    // Try MediaSession first
    if (navigator.mediaSession && navigator.mediaSession.setActionHandler) {
      navigator.mediaSession.setActionHandler('nexttrack', null);
    }

    // Try clicking next button
    const nextButton = document.querySelector('.skipControl__next, .nextButton, [aria-label*="next" i], [title*="next" i]');
    if (nextButton) {
      nextButton.click();
      return;
    }

    console.warn('⚠️ [Control] No next button found');
  }

  handlePrevious() {
    console.log('⏮️ [Control] Previous track command');
    
    // Try MediaSession first
    if (navigator.mediaSession && navigator.mediaSession.setActionHandler) {
      navigator.mediaSession.setActionHandler('previoustrack', null);
    }

    // Try clicking previous button
    const prevButton = document.querySelector('.skipControl__previous, .prevButton, [aria-label*="previous" i], [title*="previous" i]');
    if (prevButton) {
      prevButton.click();
      return;
    }

    console.warn('⚠️ [Control] No previous button found');
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

/**
 * 🚀 Initialize Everything
 */
function initialize() {
  console.log('🚀 [Init] Initializing DeskThing Media Bridge...');
  
  // Initialize MSE detector for SoundCloud
  const mseDetector = new SoundCloudMSEDetector();
  
  // Initialize WebSocket connection
  const wsManager = new WebSocketManager();
  
  // Store references globally for debugging
  window.deskThingMSE = mseDetector;
  window.deskThingWS = wsManager;
  
  console.log('✅ [Init] DeskThing Media Bridge initialized');
}

// Initialize when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Also initialize on navigation changes (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log('🔄 [Navigation] URL changed, reinitializing...');
    setTimeout(initialize, 1000);
  }
}).observe(document, { subtree: true, childList: true }); 