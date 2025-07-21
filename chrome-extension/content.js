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
 * 🎯 Smart Logging Manager - Reduces verbose playback logs
 */
class SmartLogger {
  constructor() {
    this.lastLoggedPosition = 0;
    this.lastLoggedTime = 0;
    this.logInterval = 20000; // 20 seconds
    this.jumpThreshold = 5; // 5 second jump considered scrubbing (increased from 3)
    this.scrubSessionActive = false;
    this.lastPlaybackState = null;
    this.lastLoggedJump = { position: 0, time: 0 };
    this.jumpLogCooldown = 2000; // 2 seconds cooldown between jump logs
  }

  shouldLogPosition(position, currentTime = Date.now()) {
    const timeSinceLastLog = currentTime - this.lastLoggedTime;
    const positionDiff = Math.abs(position - this.lastLoggedPosition);
    
    // Always log if it's been 20+ seconds
    if (timeSinceLastLog >= this.logInterval) {
      this.lastLoggedPosition = position;
      this.lastLoggedTime = currentTime;
      return { shouldLog: true, reason: 'interval' };
    }
    
    // Only log jumps if not in cooldown and significant enough
    if (positionDiff >= this.jumpThreshold) {
      const timeSinceLastJump = currentTime - this.lastLoggedJump.time;
      const jumpPosDiff = Math.abs(position - this.lastLoggedJump.position);
      
      // Only log if enough time has passed or position is significantly different
      if (timeSinceLastJump >= this.jumpLogCooldown && jumpPosDiff >= this.jumpThreshold) {
        this.lastLoggedPosition = position;
        this.lastLoggedTime = currentTime;
        this.lastLoggedJump = { position, time: currentTime };
        return { shouldLog: true, reason: 'jump' };
      }
    }
    
    return { shouldLog: false, reason: 'normal' };
  }

  shouldLogPlaybackState(state) {
    if (this.lastPlaybackState !== state) {
      this.lastPlaybackState = state;
      return true;
    }
    return false;
  }

  startScrubSession() {
    if (!this.scrubSessionActive) {
      this.scrubSessionActive = true;
      return true; // Log scrub start
    }
    return false; // Don't log, already in session
  }

  endScrubSession() {
    if (this.scrubSessionActive) {
      this.scrubSessionActive = false;
      return true; // Log scrub end
    }
    return false;
  }

  reset() {
    this.lastLoggedPosition = 0;
    this.lastLoggedTime = 0;
    this.scrubSessionActive = false;
    this.lastPlaybackState = null;
    this.lastLoggedJump = { position: 0, time: 0 };
  }
}

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
    this.logger = new SmartLogger();
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
      
      // Detect SoundCloud audio segment requests (reduce logging)
      if (urlString.includes('media-streaming.soundcloud.cloud') && 
          (urlString.includes('.m4s') || urlString.includes('aac_'))) {
        
        // Only log first segment to avoid spam
        if (!this.segmentLogged) {
          console.log('🎵 [MSE] Audio segment streaming detected');
          this.segmentLogged = true;
        }
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
          console.log('🎵 [Track] New track detected:', newTrack.title);
          this.currentTrack = newTrack;
          this.logger.reset(); // Reset logging when track changes
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
    setInterval(checkMediaSession, 1000);
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
                this.addEventListener('seeking', () => this.handleSeeking());
                this.addEventListener('seeked', () => this.handleSeeked());
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
    // Only log state changes, not every state check
    if (this.logger.shouldLogPlaybackState(state)) {
      console.log('🎵 [MediaSession] Playback state:', state);
    }
    
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
    // Extract timing from SoundCloud DOM elements
    const soundcloudTiming = this.extractSoundCloudTiming();
    if (soundcloudTiming.duration > 0) {
      // Smart logging - only log jumps or every 20 seconds
      const logCheck = this.logger.shouldLogPosition(soundcloudTiming.position);
      if (logCheck.shouldLog) {
        if (logCheck.reason === 'jump') {
          console.log(`🎯 [Position] JUMP detected: ${soundcloudTiming.position}s / ${soundcloudTiming.duration}s`);
        } else {
          console.log(`⏱️ [Position] ${soundcloudTiming.position}s / ${soundcloudTiming.duration}s`);
        }
      }
      this.broadcastTimeUpdate(soundcloudTiming.position, soundcloudTiming.duration);
      return;
    }

    // Try to get position from discovered MSE element
    if (window.discoveredMSEElement) {
      const element = window.discoveredMSEElement;
      const position = element.currentTime || 0;
      const duration = element.duration || 0;
      
      if (duration > 0) {
        this.broadcastTimeUpdate(position, duration);
        return;
      }
    }

    // Fallback: Try to find any media element
    const mediaElements = document.querySelectorAll('audio, video');
    for (const element of mediaElements) {
      if (element.duration && element.duration > 0) {
        this.broadcastTimeUpdate(element.currentTime, element.duration);
        return;
      }
    }
  }

  /**
   * Extract timing data - ALWAYS calculate position from progress bar percentage
   * @returns {Object} {position: number, duration: number} in seconds
   */
  extractSoundCloudTiming() {
    try {
      let position = 0;
      let duration = 0;
      
      // Get duration from text elements (reliable)
      const durationElement = document.querySelector('.playbackTimeline__duration');
      if (durationElement && durationElement.textContent) {
        const durationText = durationElement.textContent;
        
        // Try multiple patterns for duration
        const minutesMatch = durationText.match(/(\d+)\s+minutes?/);
        const secondsMatch = durationText.match(/(\d+)\s+seconds?/);
        
        if (minutesMatch && secondsMatch) {
          duration = (parseInt(minutesMatch[1], 10) * 60) + parseInt(secondsMatch[1], 10);
        } else if (secondsMatch) {
          duration = parseInt(secondsMatch[1], 10);
        } else {
          // Try time format like "7:17"
          const timeMatch = durationText.match(/(\d+):(\d+)/);
          if (timeMatch) {
            duration = (parseInt(timeMatch[1], 10) * 60) + parseInt(timeMatch[2], 10);
          }
        }
      }
      
      // Calculate position from progress bar percentage (on every tick)
      if (duration > 0) {
        // Try the main timeline progress bar first
        const progressBar = document.querySelector('.playbackTimeline__progressBar');
        
        if (progressBar && progressBar.parentElement) {
          const computedStyle = window.getComputedStyle(progressBar);
          const parentStyle = window.getComputedStyle(progressBar.parentElement);
          
          const barWidth = parseFloat(computedStyle.width);
          const parentWidth = parseFloat(parentStyle.width);
          
          if (barWidth >= 0 && parentWidth > 0) {
            const percentage = barWidth / parentWidth;
            position = Math.round(duration * percentage);
          }
        }
      }
      
      // Fallback only if progress bar calculation completely failed
      if (position === 0 && duration > 0) {
        const positionElement = document.querySelector('.playbackTimeline__timePassed');
        if (positionElement && positionElement.textContent) {
          const text = positionElement.textContent;
          
          // Try different patterns
          let positionMatch = text.match(/(\d+)\s+seconds?/);
          if (!positionMatch) {
            positionMatch = text.match(/(\d+):(\d+)/);
            if (positionMatch) {
              position = (parseInt(positionMatch[1], 10) * 60) + parseInt(positionMatch[2], 10);
            }
          } else {
            position = parseInt(positionMatch[1], 10);
          }
        }
      }
      
      // Method 4: Fallback - try to find any media elements
      if (position === 0 && duration === 0) {
        const mediaElements = document.querySelectorAll('audio, video');
        for (const element of mediaElements) {
          if (element.currentTime >= 0 && element.duration > 0) {
            position = Math.floor(element.currentTime);
            duration = Math.floor(element.duration);
            break;
          }
        }
      }
      
      // Store current timing
      const now = Date.now();
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
   * 🎯 Force immediate timing update (for seeking/scrubbing)
   */
  requestTimingUpdate() {
    console.log('🎯 [Seek Update] Starting forced timing extraction...');
    const timing = this.extractSoundCloudTiming();
    if (timing && timing.duration > 0) {
      console.log(`🎯🎯🎯 [SEEK UPDATE] Broadcasting new position: ${timing.position}s / ${timing.duration}s 🎯🎯🎯`);
      this.broadcastTimeUpdate(timing.position, timing.duration);
    } else {
      console.warn('🎯 [Seek Update] Could not extract timing data - timing object:', timing);
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
              console.log(`🔗 [WebSocket] Connecting to Audio App... (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        this.ws = new WebSocket('ws://localhost:8081');
      window.mediaWebSocket = this.ws;
      
      this.ws.onopen = () => {
                  console.log('✅ [WebSocket] Connected to Audio App server');
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
        console.error('💥 [WebSocket] Connection error');
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
    // Only log important commands
    if (message.type === 'media-command' || message.type === 'seek') {
      console.log(`📨 [WebSocket] ${message.type}:`, message.action || `${message.time}s`);
    }
    
    switch (message.type) {
      case 'media-command':
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

  handleSeeking() {
    // Don't log individual seeking events
    if (window.deskThingMSE) {
      window.deskThingMSE.requestTimingUpdate();
    }
  }

  handleSeeked() {
    // Don't log individual seeked events
    setTimeout(() => {
      if (window.deskThingMSE) {
        window.deskThingMSE.requestTimingUpdate();
      }
    }, 100);
  }

  handleNext() {
    console.log('⏭️ [Control] Next track command');
    
    setTimeout(() => {
      const success = document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'j',
        code: 'KeyJ',
        bubbles: true,
        cancelable: true
      }));
    }, 50);
    
    setTimeout(() => {
      const nextButton = document.querySelector(
        '.playControls__next, ' +
        '.skipControl__next, ' +
        'button[title="Skip to next"], ' +
        'button[aria-label*="Skip to next" i]'
      );
      
      if (nextButton && !nextButton.disabled) {
        console.log('⏭️ [Control] Clicking next button:', nextButton.className);
        nextButton.click();
      } else {
        console.log('❌ [Control] Next button not found or disabled');
      }
    }, 600);
  }

  handlePrevious() {
    console.log('⏮️ [Control] Previous track command');
    
    const success = document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k',
      code: 'KeyK',
      bubbles: true,
      cancelable: true
    }));
    
    setTimeout(() => {
      const prevButton = document.querySelector(
        '.playControls__prev, ' +
        '.skipControl__previous, ' +
        'button[title="Skip to previous"], ' +
        'button[aria-label*="Skip to previous" i]'
      );
      
      if (prevButton && !prevButton.disabled) {
        console.log('⏮️ [Control] Clicking prev button:', prevButton.className);
        prevButton.click();
      } else {
        console.log('❌ [Control] Previous button not found or disabled');
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
 * 🎯 Setup timeline scrub detection for SoundCloud
 */
function setupTimelineScrubDetection() {
  console.log('🎯 [Scrub] Setting up timeline scrub detection...');
  
  let scrubTimeout;
  let scrubSessionTimeout;
  
  const debouncedUpdate = () => {
    clearTimeout(scrubTimeout);
    scrubTimeout = setTimeout(() => {
      if (window.deskThingMSE) {
        window.deskThingMSE.requestTimingUpdate();
      }
    }, 200);
  };
  
  const startScrubSession = () => {
    if (window.deskThingMSE && window.deskThingMSE.logger.startScrubSession()) {
      console.log('🎯 [Scrub] Scrub session started');
    }
    clearTimeout(scrubSessionTimeout);
    
    // End scrub session after 1 second of no activity
    scrubSessionTimeout = setTimeout(() => {
      if (window.deskThingMSE && window.deskThingMSE.logger.endScrubSession()) {
        console.log('🎯 [Scrub] Scrub session ended');
      }
    }, 1000);
  };
  
  // Set up observers for timeline elements
  const observeTimeline = () => {
    const timelineSelectors = [
      '.playbackTimeline',
      '.playbackTimeline__progressWrapper',
      '.playbackTimeline__progressBackground',
      '.playbackTimeline__progressBar',
      '.playbackTimeline__progressHandle'
    ];
    
    timelineSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        // Avoid duplicate listeners
        if (element.dataset.scrubDetected) return;
        element.dataset.scrubDetected = 'true';
        
        // Only log the scrub detection setup once per selector
        if (!element.dataset.setupLogged) {
          console.log(`🎯 [Scrub] Added scrub detection to: ${selector}`);
          element.dataset.setupLogged = 'true';
        }
        
        // Use the same handler for all events to avoid spam
        const scrubHandler = () => {
          startScrubSession();
          debouncedUpdate();
        };
        
        element.addEventListener('mousedown', scrubHandler);
        element.addEventListener('mouseup', scrubHandler);
        element.addEventListener('click', scrubHandler);
        element.addEventListener('input', scrubHandler);
        element.addEventListener('change', scrubHandler);
        element.addEventListener('keyup', scrubHandler);
      });
    });
  };
  
  // Initial setup
  observeTimeline();
  
  // Re-observe when DOM changes (SoundCloud is an SPA)
  const observer = new MutationObserver(() => {
    observeTimeline();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('✅ [Scrub] Timeline scrub detection setup complete');
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
  
  // Setup timeline scrub detection for SoundCloud
  setupTimelineScrubDetection();
  
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

// Listen for messages from popup for testing
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('🔍 [Content] Received message from popup:', message);
  
  if (message.type === 'extract-media') {
    console.log('🎵 [Content] Popup requested media extraction');
    if (window.deskThingMSE) {
      window.deskThingMSE.requestTimingUpdate();
      const currentData = window.deskThingMSE.getCurrentMediaData?.() || null;
      sendResponse({ success: true, data: currentData });
    } else {
      sendResponse({ success: false, error: 'MSE not initialized' });
    }
  } else if (message.type === 'media-control') {
    console.log(`🎮 [Content] Popup sent control: ${message.action}`);
    try {
      handleMediaCommand(message.action);
      sendResponse({ success: true, action: message.action });
    } catch (error) {
      console.error('❌ [Content] Control failed:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
  
  return true; // Keep message channel open
});

// Handle media control commands from popup
function handleMediaCommand(action) {
  console.log(`🎮 [Content] Executing: ${action}`);
  
  switch (action) {
    case 'play':
      // Try multiple play button selectors
      const playBtn = document.querySelector('[title="Play"]') || 
                     document.querySelector('.playButton') ||
                     document.querySelector('[aria-label*="play" i]');
      if (playBtn) {
        console.log('▶️ [Content] Clicking play button');
        playBtn.click();
      } else {
        console.log('▶️ [Content] Using spacebar');
        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      }
      break;
      
    case 'pause':
      const pauseBtn = document.querySelector('[title="Pause"]') || 
                      document.querySelector('.pauseButton') ||
                      document.querySelector('[aria-label*="pause" i]');
      if (pauseBtn) {
        console.log('⏸️ [Content] Clicking pause button');
        pauseBtn.click();
      } else {
        console.log('⏸️ [Content] Using spacebar');
        document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      }
      break;
      
    case 'nexttrack':
      const nextBtn = document.querySelector('.playControls__next') ||
                     document.querySelector('.skipControl__next') ||
                     document.querySelector('button[title="Skip to next"]');
      if (nextBtn) {
        console.log('⏭️ [Content] Clicking next button:', nextBtn.className);
        nextBtn.click();
      } else {
        console.log('❌ [Content] Next button not found');
      }
      break;
      
    case 'previoustrack':
      const prevBtn = document.querySelector('.playControls__prev') ||
                     document.querySelector('.skipControl__previous') ||
                     document.querySelector('button[title="Skip to previous"]');
      if (prevBtn) {
        console.log('⏮️ [Content] Clicking previous button:', prevBtn.className);
        prevBtn.click();
      } else {
        console.log('❌ [Content] Previous button not found');
      }
      break;
      
    default:
      console.log(`⚠️ [Content] Unknown command: ${action}`);
  }
} 