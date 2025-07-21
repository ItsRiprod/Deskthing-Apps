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
      // 🔍 COMPREHENSIVE TIMING DEBUG LOGGING
      this.debugAllTimingSources();
      
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
    // 🎯 Priority 1: Extract timing from SoundCloud DOM elements
    const soundcloudTiming = this.extractSoundCloudTiming();
    if (soundcloudTiming.duration > 0) {
      console.log(`🎵 [Position] SoundCloud DOM - Position: ${soundcloudTiming.position}s / Duration: ${soundcloudTiming.duration}s`);
      this.broadcastTimeUpdate(soundcloudTiming.position, soundcloudTiming.duration);
      return;
    }

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
   * 🔍 DEBUG: Comprehensive timing sources analysis
   */
  debugAllTimingSources() {
    // Only log comprehensive debug every 10th call to avoid spam (every 5 seconds)
    if (!this.debugCallCount) this.debugCallCount = 0;
    this.debugCallCount++;
    
    if (this.debugCallCount % 10 !== 0) return;
    
    console.log('🔍 ===== COMPREHENSIVE TIMING SOURCES DEBUG =====');
    
    // 1. MediaSession API Analysis
    console.log('🎵 [DEBUG] MediaSession API:', {
      available: !!navigator.mediaSession,
      metadata: navigator.mediaSession?.metadata,
      playbackState: navigator.mediaSession?.playbackState,
      positionState: navigator.mediaSession?.positionState || 'NOT_AVAILABLE'
    });
    
    // 2. HTML5 Audio/Video Elements
    const mediaElements = document.querySelectorAll('audio, video');
    console.log(`🎵 [DEBUG] Found ${mediaElements.length} HTML5 media elements:`);
    mediaElements.forEach((element, index) => {
      console.log(`  Element ${index}:`, {
        tagName: element.tagName,
        src: element.src || element.currentSrc || 'NO_SRC',
        currentTime: element.currentTime,
        duration: element.duration,
        paused: element.paused,
        readyState: element.readyState,
        networkState: element.networkState,
        srcObject: !!element.srcObject,
        buffered: element.buffered.length > 0 ? `${element.buffered.start(0)}-${element.buffered.end(0)}` : 'NONE'
      });
    });
    
    // 3. SoundCloud Internal Objects
    console.log('🎵 [DEBUG] SoundCloud Internal Objects:', {
      SC: !!window.SC,
      require: !!window.require,
      webpackChunkName: !!window.webpackChunkName,
      playerKeys: Object.keys(window).filter(k => k.toLowerCase().includes('player')),
      audioKeys: Object.keys(window).filter(k => k.toLowerCase().includes('audio')),
      timeKeys: Object.keys(window).filter(k => k.toLowerCase().includes('time'))
    });
    
    // 4. Performance API for Network Timing
    const performanceEntries = performance.getEntriesByType('resource');
    const streamingResources = performanceEntries
      .filter(entry => 
        entry.name.includes('stream') || 
        entry.name.includes('audio') || 
        entry.name.includes('.mp3') || 
        entry.name.includes('.m4a') ||
        entry.name.includes('media')
      )
      .slice(-3); // Last 3 entries
      
    console.log('🎵 [DEBUG] Recent Streaming Resources:', streamingResources.map(entry => ({
      url: entry.name.split('?')[0],
      duration: entry.duration,
      responseEnd: entry.responseEnd,
      transferSize: entry.transferSize
    })));
    
    // 5. Document Timing Properties
    const docTiming = {
      documentReadyState: document.readyState,
      visibilityState: document.visibilityState,
      lastModified: document.lastModified
    };
    console.log('🎵 [DEBUG] Document Timing:', docTiming);
    
    // 6. Advanced Audio Context Detection
    const audioContextTypes = ['AudioContext', 'webkitAudioContext'];
    const audioContextInfo = audioContextTypes.map(type => ({
      type,
      available: !!window[type],
      instances: window.audioContexts ? window.audioContexts.length : 'UNKNOWN'
    }));
    console.log('🎵 [DEBUG] AudioContext Info:', audioContextInfo);
    
    // 7. Search for SoundCloud-specific timing data in DOM
    const timingElements = document.querySelectorAll('[class*="time"], [class*="duration"], [class*="progress"]');
    console.log(`🎵 [DEBUG] Found ${timingElements.length} timing-related DOM elements:`);
    
    // 🔍 DETAILED DOM ELEMENT INSPECTION
    timingElements.forEach((element, index) => {
      const elementInfo = {
        index: index,
        tagName: element.tagName,
        className: element.className,
        id: element.id || 'NO_ID',
        textContent: element.textContent?.trim() || 'NO_TEXT',
        innerHTML: element.innerHTML?.slice(0, 200) || 'NO_HTML',
        value: element.value || 'NO_VALUE',
        title: element.title || 'NO_TITLE',
        ariaLabel: element.getAttribute('aria-label') || 'NO_ARIA',
        style: element.style.cssText || 'NO_STYLE',
        offsetWidth: element.offsetWidth,
        offsetLeft: element.offsetLeft,
        dataset: {...element.dataset}
      };
      console.log(`  🎯 Element ${index}:`, elementInfo);
    });
    
    // 8. Look for common SoundCloud player class patterns
    const playerElements = document.querySelectorAll('[class*="player"], [class*="Player"], [class*="playback"], [class*="Playback"]');
    console.log(`🎵 [DEBUG] Found ${playerElements.length} player-related elements:`);
    Array.from(playerElements).slice(0, 3).forEach((element, index) => {
      console.log(`  🎮 Player ${index}:`, {
        className: element.className,
        textContent: element.textContent?.slice(0, 100),
        childElementCount: element.childElementCount
      });
    });
    
    // 9. Look for progress bars and sliders
    const progressElements = document.querySelectorAll('input[type="range"], [role="slider"], [class*="slider"], [class*="bar"]');
    console.log(`🎵 [DEBUG] Found ${progressElements.length} progress/slider elements:`);
    progressElements.forEach((element, index) => {
      console.log(`  📊 Progress ${index}:`, {
        tagName: element.tagName,
        type: element.type,
        value: element.value,
        min: element.min,
        max: element.max,
        className: element.className,
        role: element.getAttribute('role'),
        ariaValueNow: element.getAttribute('aria-valuenow'),
        ariaValueMin: element.getAttribute('aria-valuemin'),
        ariaValueMax: element.getAttribute('aria-valuemax')
      });
    });
    
    console.log('🔍 ===== END COMPREHENSIVE DEBUG =====');
  }

  /**
   * Extract timing data from SoundCloud DOM elements with continuity validation
   * @returns {Object} {position: number, duration: number} in seconds
   */
  extractSoundCloudTiming() {
    try {
      // Get current position from playbackTimeline__timePassed
      const positionElement = document.querySelector('.playbackTimeline__timePassed');
      const durationElement = document.querySelector('.playbackTimeline__duration');
      
      let position = 0;
      let duration = 0;
      
      if (positionElement && positionElement.textContent) {
        // Parse "Current time: 11 seconds0:11" to extract seconds
        const positionMatch = positionElement.textContent.match(/(\d+)\s+seconds?/);
        if (positionMatch) {
          position = parseInt(positionMatch[1], 10);
        }
      }
      
      if (durationElement && durationElement.textContent) {
        // Parse "Duration: 3 minutes 46 seconds3:46" to extract total seconds
        const durationText = durationElement.textContent;
        const minutesMatch = durationText.match(/(\d+)\s+minutes?/);
        const secondsMatch = durationText.match(/(\d+)\s+seconds?/);
        
        if (minutesMatch && secondsMatch) {
          duration = (parseInt(minutesMatch[1], 10) * 60) + parseInt(secondsMatch[1], 10);
        } else if (secondsMatch) {
          duration = parseInt(secondsMatch[1], 10);
        }
      }
      
      // 🔧 TIMING CONTINUITY VALIDATION - Prevent chunk reload resets
      const now = Date.now();
      const lastTiming = window.lastSoundCloudTiming || { position: 0, duration: 0, timestamp: 0 };
      const timeDiff = (now - lastTiming.timestamp) / 1000; // seconds since last update
      
      // Check for suspicious backward jumps (SoundCloud chunk reloading)
      if (lastTiming.position > 0 && position < lastTiming.position) {
        const backwardJump = lastTiming.position - position;
        
        // If we jump backward by >3 seconds but duration is same, it's likely a chunk reload
        if (backwardJump > 3 && duration === lastTiming.duration && timeDiff < 10) {
          console.log(`🔄 [SoundCloud] Chunk reload detected - ignoring ${backwardJump}s backward jump`);
          // Return last known position + estimated progress
          const estimatedPosition = Math.min(lastTiming.position + Math.floor(timeDiff), duration);
          window.lastSoundCloudTiming = { position: estimatedPosition, duration, timestamp: now };
          return { position: estimatedPosition, duration };
        }
        
        // If duration changed significantly, it's likely a new song - allow the reset
        if (Math.abs(duration - lastTiming.duration) > 5) {
          console.log(`🎵 [SoundCloud] New song detected - duration changed: ${lastTiming.duration}s → ${duration}s`);
        }
      }
      
      console.log(`🎯 [SoundCloud] Extracted timing: position=${position}s, duration=${duration}s`);
      
      // Store current timing for next validation
      window.lastSoundCloudTiming = { position, duration, timestamp: now };
      
      return { position, duration };
    } catch (error) {
      console.warn('🎯 [SoundCloud] Failed to extract timing:', error);
      return { position: 0, duration: 0 };
    }
  }

  /**
   * 📡 Broadcast time updates via WebSocket
   */
  broadcastTimeUpdate(position, duration) {
    if (window.mediaWebSocket && window.mediaWebSocket.readyState === WebSocket.OPEN) {
      // Get current playback state from MediaSession
      const isCurrentlyPlaying = navigator.mediaSession?.playbackState === 'playing';
      
      window.mediaWebSocket.send(JSON.stringify({
        type: 'timeupdate',
        currentTime: position,
        duration: duration,
        isPlaying: isCurrentlyPlaying,
        canSeek: true,
        source: 'soundcloud-dom',
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
      console.log('🔗 [WebSocket] Connecting to dashboard server...', {
        attempt: this.reconnectAttempts + 1,
        maxAttempts: this.maxReconnectAttempts,
        url: 'ws://localhost:8080'
      });
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
        console.error('💥 [WebSocket] Connection error:', {
          type: error.type,
          target: error.target.url,
          readyState: error.target.readyState,
          error: error
        });
        this.scheduleReconnect();
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
    
    // Add small delay to prevent rapid-fire commands (SoundCloud rate limits 'j' key)
    setTimeout(() => {
      console.log('🎹 [Control] Trying SoundCloud keyboard shortcut (j)');
      const success = document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'j', // SoundCloud shortcut for next
        code: 'KeyJ',
        bubbles: true,
        cancelable: true
      }));
      
      console.log(`🎹 [Control] Keyboard shortcut dispatched: ${success}`);
    }, 50);
    
    // Backup: DOM click after longer delay (SoundCloud seems to rate limit 'j' more than other keys)
    setTimeout(() => {
      const nextButton = document.querySelector(
        '.skipControl__next, ' +
        '.playControls__control.playControls__next, ' +
        '[aria-label*="Skip to next" i], ' +
        '[title*="next" i], ' +
        'button[aria-label*="Skip to next track" i]'
      );
      
      if (nextButton && !nextButton.disabled) {
        console.log('🔄 [Control] Backup: clicking next button');
        nextButton.click();
      } else {
        console.log('⚠️ [Control] No next button found for backup');
      }
    }, 600); // Longer delay for next track to avoid rate limiting
  }

  handlePrevious() {
    console.log('⏮️ [Control] Previous track command');
    
    // Primary: Try SoundCloud keyboard shortcut (most reliable for SoundCloud)
    console.log('🎹 [Control] Trying SoundCloud keyboard shortcut (k)');
    const success = document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k', // SoundCloud shortcut for previous
      code: 'KeyK',
      bubbles: true,
      cancelable: true
    }));
    
    console.log(`🎹 [Control] Keyboard shortcut dispatched: ${success}`);
    
    // Backup: DOM click after delay (only if hotkey might have failed)  
    setTimeout(() => {
      const prevButton = document.querySelector(
        '.skipControl__previous, ' +
        '.playControls__control.playControls__prev, ' +
        '[aria-label*="Skip to previous" i], ' +
        '[title*="previous" i]'
      );
      
      if (prevButton && !prevButton.disabled) {
        console.log('🔄 [Control] Backup: clicking previous button');
        prevButton.click();
      } else {
        console.log('⚠️ [Control] No previous button found for backup');
      }
    }, 200);
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