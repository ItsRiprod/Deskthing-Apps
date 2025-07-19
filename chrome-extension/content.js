/**
 * DeskThing Media Bridge - Content Script
 * Enhanced version with better SoundCloud support and MediaSession handling
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
 * 🚀 Web Audio API Interception - Makes hidden audio elements visible
 * This hooks into SoundCloud's Web Audio API usage and exposes the underlying audio elements
 * so our existing Chrome API approach can find them with querySelectorAll('audio, video')
 */
(function interceptWebAudioAPI() {
  console.log('🔧 [WebAudio] Setting up Web Audio API interception...');
  
  // Store discovered audio elements
  window.discoveredAudioElements = new Set();
  
  // 1. Hook AudioContext creation
  const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
  if (OriginalAudioContext) {
    function InterceptedAudioContext(...args) {
      console.log('🎵 [WebAudio] AudioContext created');
      const ctx = new OriginalAudioContext(...args);
      
      // Hook createMediaElementSource to catch hidden audio elements
      const originalCreateMediaElementSource = ctx.createMediaElementSource;
      ctx.createMediaElementSource = function(element) {
        console.log('🎵 [WebAudio] Found audio element via Web Audio API:', element);
        console.log('🎵 [WebAudio] Element details:', {
          tagName: element.tagName,
          src: element.src,
          currentTime: element.currentTime,
          duration: element.duration,
          paused: element.paused
        });
        
        // Store this element so our existing code can find it
        window.discoveredAudioElements.add(element);
        
        // Dispatch a custom event to notify our MediaBridge
        const event = new CustomEvent('webaudio-element-discovered', {
          detail: { audioElement: element, audioContext: ctx }
        });
        document.dispatchEvent(event);
        
        return originalCreateMediaElementSource.call(this, element);
      };
      
      // Hook createBufferSource for additional audio detection
      const originalCreateBufferSource = ctx.createBufferSource;
      ctx.createBufferSource = function() {
        console.log('🎵 [WebAudio] Buffer source created');
        const source = originalCreateBufferSource.call(this);
        
        // Hook start method to detect playback
        const originalStart = source.start;
        source.start = function(...args) {
          console.log('🎵 [WebAudio] Buffer playback started');
          const event = new CustomEvent('webaudio-playback-started', {
            detail: { source, audioContext: ctx, args }
          });
          document.dispatchEvent(event);
          return originalStart.apply(this, args);
        };
        
        return source;
      };
      
      return ctx;
    }
    
    // Copy static methods
    Object.setPrototypeOf(InterceptedAudioContext.prototype, OriginalAudioContext.prototype);
    Object.setPrototypeOf(InterceptedAudioContext, OriginalAudioContext);
    
    // Replace the global AudioContext
    window.AudioContext = InterceptedAudioContext;
    window.webkitAudioContext = InterceptedAudioContext;
    
    console.log('✅ [WebAudio] AudioContext interception installed');
  }
  
  // 2. Hook HTMLAudioElement creation
  const originalAudio = window.Audio;
  window.Audio = function(...args) {
    console.log('🎵 [WebAudio] New Audio() created');
    const audio = new originalAudio(...args);
    window.discoveredAudioElements.add(audio);
    
    // Dispatch event for new Audio() elements
    setTimeout(() => {
      const event = new CustomEvent('webaudio-element-discovered', {
        detail: { audioElement: audio }
      });
      document.dispatchEvent(event);
    }, 100);
    
    return audio;
  };
  
  // 3. Enhanced querySelectorAll wrapper
  const originalQuerySelectorAll = Document.prototype.querySelectorAll;
  Document.prototype.querySelectorAll = function(selector) {
    const results = originalQuerySelectorAll.call(this, selector);
    
    // If looking for audio/video elements, also include our discovered elements
    if (selector.includes('audio') || selector.includes('video')) {
      const discoveredElements = Array.from(window.discoveredAudioElements);
      if (discoveredElements.length > 0) {
        console.log(`🎵 [WebAudio] querySelectorAll('${selector}') enhanced with ${discoveredElements.length} discovered elements`);
        
        // Create a combined NodeList-like object
        const combined = Array.from(results).concat(discoveredElements);
        combined.length = combined.length; // Make it look like NodeList
        return combined;
      }
    }
    
    return results;
  };
  
  console.log('✅ [WebAudio] Web Audio API interception complete');
})();

class MediaBridge {
  constructor() {
    this.version = EXTENSION_VERSION;
    this.dashboardUrl = 'http://localhost:8080';
    this.lastSentData = null;
    // No polling intervals needed - fully event-driven!
    
    // ⚡ WebSocket connection for instant cross-window commands
    this.ws = null;
    this.wsUrl = 'ws://localhost:8080';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    
    this.init();
  }
  
  init() {
    console.log(`🚀 Enhanced MediaSession monitoring initialized v${this.version}`);
    
    // Check extension context health
    this.checkExtensionContext();
    
    // 🚀 Set up Web Audio API event listeners
    this.setupWebAudioListeners();
    
    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }
  
  /**
   * 🔍 Check if Chrome Extension context is healthy
   */
  checkExtensionContext() {
    try {
      if (!chrome.runtime?.id) {
        console.warn(`⚠️ [MediaBridge] Extension context is invalid on init`);
        return false;
      }
      
      // Test a simple message to background script
      chrome.runtime.sendMessage({ type: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn(`⚠️ [MediaBridge] Extension context test failed:`, chrome.runtime.lastError.message);
        } else {
          console.log(`✅ [MediaBridge] Extension context is healthy`);
        }
      });
      
      return true;
    } catch (error) {
      console.warn(`⚠️ [MediaBridge] Extension context check failed:`, error.message);
      return false;
    }
  }
  
  /**
   * 🚀 Set up Web Audio API event listeners
   * Responds to audio elements discovered by the Web Audio API interception
   */
  setupWebAudioListeners() {
    console.log('🎵 [WebAudio] Setting up Web Audio API event listeners...');
    
    // Listen for discovered audio elements
    document.addEventListener('webaudio-element-discovered', (event) => {
      const { audioElement, audioContext } = event.detail;
      console.log('🎵 [WebAudio] Audio element discovered via Web Audio API:', audioElement);
      
      // Immediately check for media data since we found a new audio element
      setTimeout(() => {
        console.log('🔄 [WebAudio] Checking media data after element discovery...');
        this.checkAndSendMediaData();
      }, 500);
      
      // Set up direct listeners on the discovered element for real-time updates
      this.setupDirectAudioListeners(audioElement);
    });
    
    // Listen for Web Audio playback events
    document.addEventListener('webaudio-playback-started', (event) => {
      console.log('🎵 [WebAudio] Playback started via Web Audio API');
      setTimeout(() => this.checkAndSendMediaData(), 200);
    });
    
    console.log('✅ [WebAudio] Web Audio API event listeners setup complete');
  }
  
  /**
   * 🎵 Set up direct event listeners on discovered audio elements
   */
  setupDirectAudioListeners(audioElement) {
    if (!audioElement || audioElement.deskthing_listeners_added) return;
    
    console.log('🎵 [WebAudio] Setting up direct listeners on audio element');
    
    // Mark this element as having listeners to avoid duplicates
    audioElement.deskthing_listeners_added = true;
    
    // Essential audio events for real-time updates
    const events = [
      'loadedmetadata', 'durationchange', 'timeupdate', 
      'play', 'pause', 'seeking', 'seeked',
      'loadeddata', 'canplay', 'progress'
    ];
    
    events.forEach(eventType => {
      audioElement.addEventListener(eventType, () => {
        console.log(`🎵 [WebAudio] ${eventType} event from discovered element`);
        // Slight delay to ensure DOM is updated
        setTimeout(() => this.checkAndSendMediaData(), 100);
      });
    });
    
    console.log(`✅ [WebAudio] Direct listeners added to audio element (${events.length} events)`);
  }
  
  start() {
    console.log(`⚡ Starting WebSocket-powered MediaSession monitoring v${this.version}...`);
    
    // 🚀 PRIMARY: WebSocket connection for instant cross-window control (NO POLLING!)
    this.connectWebSocket();
    
    // 🎧 EVENT-DRIVEN: Listen for audio/video element changes
    this.setupMediaElementListeners();
    
    // 📱 EVENT-DRIVEN: Listen for MediaSession metadata changes  
    this.setupMediaSessionListeners();
    
    // 🔄 EVENT-DRIVEN: Listen for page navigation changes
    this.setupNavigationListeners();
    
    // Send initial data after a delay to ensure page is loaded
    setTimeout(() => this.checkAndSendMediaData(), 2000);
    
  }
  
  setupMediaElementListeners() {
    // Listen for media element events (with more comprehensive coverage)
    const events = ['play', 'pause', 'loadedmetadata', 'timeupdate', 'durationchange', 'loadeddata'];
    
    events.forEach(eventType => {
      document.addEventListener(eventType, () => {
        console.log(`🎵 ${eventType} event detected (v${this.version})`);
        setTimeout(() => this.checkAndSendMediaData(), 300);
      }, true);
    });
    
    // Listen for navigation changes (SPA sites)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        console.log('🔗 Navigation detected, waiting for media to load...');
        setTimeout(() => this.checkAndSendMediaData(), 3000);
      }
    }).observe(document, { subtree: true, childList: true });
    
  }
  
        setupMediaSessionListeners() {
    // MediaSession monitoring via event-driven approach (no polling!)
    if (navigator.mediaSession) {
      console.log('📱 Setting up MediaSession listeners (event-driven, no polling)');
      
      // MediaSession changes are now captured by media element events
      // and WebSocket real-time updates - no additional polling needed!
      
      // Initial check for existing metadata
      if (navigator.mediaSession.metadata) {
        console.log('📱 Initial MediaSession metadata detected');
        this.checkAndSendMediaData();
      }
    }
  }
  
  setupNavigationListeners() {
    // Listen for page navigation changes
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        console.log('🔗 Navigation detected, waiting for media to load...');
        setTimeout(() => this.checkAndSendMediaData(), 3000);
      }
    }).observe(document, { subtree: true, childList: true });
  }
  
  getMediaSessionData() {
    try {
      // First, try to get comprehensive data from audio/video elements
      const mediaElements = document.querySelectorAll('audio, video');
      let bestMediaElement = null;
      let duration = 0;
      let position = 0;
      let isPlaying = false;
      
      console.log(`🎵 Found ${mediaElements.length} media elements`);
      
      // Find the best media element (one that's actually playing or has content)
      for (const media of mediaElements) {
        console.log(`🎵 Media element check:`, {
          readyState: media.readyState,
          duration: media.duration,
          currentTime: media.currentTime,
          paused: media.paused,
          ended: media.ended,
          src: media.src?.substring(0, 100)
        });
        
        // Be more aggressive - accept any media with duration > 0 OR currentTime > 0
        if ((media.duration > 0) || (media.currentTime > 0) || (media.readyState >= 1)) {
          bestMediaElement = media;
          duration = Math.floor(media.duration) || 0;
          position = Math.floor(media.currentTime) || 0;
          isPlaying = !media.paused && !media.ended;
          
          // 🚀 CRITICAL FIX: Write position data TO MediaSession
          if (navigator.mediaSession && 'setPositionState' in navigator.mediaSession && duration > 0) {
            try {
              navigator.mediaSession.setPositionState({
                duration: duration,
                playbackRate: media.playbackRate || 1.0,
                position: position
              });
              console.log('✅ Updated MediaSession position state:', { duration, position });
            } catch (e) {
              console.log('❌ MediaSession setPositionState failed:', e);
            }
          }
          
          console.log('🎵 Selected media element:', {
            duration,
            position,
            isPlaying,
            readyState: media.readyState,
            src: media.src?.substring(0, 100)
          });
          
          // Don't break - keep looking for a better one
          if (media.duration > 0 && media.currentTime > 0) {
            break; // This is definitely the active one
          }
        }
      }
      
      // Check MediaSession API for metadata
      let mediaSessionData = null;
      if (navigator.mediaSession && navigator.mediaSession.metadata) {
        const metadata = navigator.mediaSession.metadata;
        const playbackState = navigator.mediaSession.playbackState;
        
        console.log('🎵 MediaSession data found:', {
          title: metadata.title,
          artist: metadata.artist,
          playbackState,
          hasArtwork: !!(metadata.artwork && metadata.artwork.length > 0)
        });
        
        mediaSessionData = {
          title: metadata.title || 'Unknown Title',
          artist: metadata.artist || 'Unknown Artist',
          album: metadata.album || '',
          artwork: metadata.artwork && metadata.artwork.length > 0 ? 
            metadata.artwork[0].src : null,
          playbackState: playbackState || (isPlaying ? 'playing' : 'paused')
        };
        
        // If MediaSession says playing but we couldn't detect from media elements, trust MediaSession
        if (playbackState === 'playing' && !isPlaying) {
          isPlaying = true;
        }
      }
      
      // If we have MediaSession metadata, use it; otherwise fall back to DOM
      if (mediaSessionData) {
        return {
          ...mediaSessionData,
          source: `${window.location.hostname} (MediaSession)`,
          url: window.location.href,
          isPlaying: isPlaying,
          duration: duration,
          position: position,
          method: 'MediaSession+Audio',
          version: this.version,
          timestamp: Date.now()
        };
      }
      
      // Fallback to DOM scraping if no MediaSession
      const domData = this.getDOMMediaData();
      if (domData && bestMediaElement) {
        // Enhance DOM data with audio element timing info
        domData.duration = duration;
        domData.position = position;
        domData.isPlaying = isPlaying;
      }
      
      if (domData) {
        domData.version = this.version;
      }
      
      return domData;
      
    } catch (error) {
      console.error('❌ MediaSession error:', error);
      return this.getDOMMediaData();
    }
  }
  
  getDOMMediaData() {
    try {
      // Site-specific extractors
      const extractors = {
        'soundcloud.com': this.extractSoundCloudData.bind(this),
        'youtube.com': this.extractYouTubeData.bind(this),
        'music.youtube.com': this.extractYouTubeMusicData.bind(this),
        'open.spotify.com': this.extractSpotifyData.bind(this)
      };
      
      const hostname = window.location.hostname.replace('www.', '');
      const extractor = extractors[hostname];
      
      if (extractor) {
        const data = extractor();
        if (data) {
          return {
            ...data,
            source: `${hostname} (DOM)`,
            url: window.location.href,
            method: 'DOM',
            version: this.version,
            timestamp: Date.now()
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ DOM extraction error:', error);
      return null;
    }
  }
  
  extractSoundCloudData() {
    // Enhanced SoundCloud extraction with better audio element detection
    console.log('🎵 Extracting SoundCloud data...');
    
    // First try to get audio element data with more aggressive searching
    const audioElements = document.querySelectorAll('audio');
    let duration = 0;
    let position = 0;
    let isPlaying = false;
    
    console.log(`🎵 SoundCloud: Found ${audioElements.length} audio elements`);
    
    for (const audio of audioElements) {
      console.log('🎵 SoundCloud audio details:', {
        duration: audio.duration,
        currentTime: audio.currentTime,
        paused: audio.paused,
        readyState: audio.readyState,
        networkState: audio.networkState,
        src: audio.src?.substring(0, 50)
      });
      
      // Be more aggressive - accept any audio element with timing data OR that's playing
      if (audio.duration > 0 || audio.currentTime > 0 || !audio.paused || audio.readyState >= 1) {
        duration = Math.floor(audio.duration) || 0;
        position = Math.floor(audio.currentTime) || 0;
        isPlaying = !audio.paused && !audio.ended;
        console.log('✅ SoundCloud selected audio element:', { duration, position, isPlaying });
        break;
      }
    }
    
    // If no duration from audio elements, try to get from progress bar or time displays
    if (duration === 0) {
      // Try to find duration from SoundCloud's progress bar or time display
      const timeElement = document.querySelector('.playbackTimeline__timePassed, .playbackTimeline__duration');
      if (timeElement) {
        const timeText = timeElement.textContent;
        const timeMatch = timeText.match(/(\d+):(\d+)/);
        if (timeMatch) {
          duration = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
          console.log('📊 SoundCloud extracted duration from DOM:', duration);
        }
      }
    }
    
    // Extract title and artist from multiple sources
    let title = 'Unknown Track';
    let artist = 'Unknown Artist';
    let artwork = null;
    
    // Method 1: Try current track info from player
    const trackTitle = document.querySelector('.playbackSoundBadge__titleLink')?.textContent?.trim();
    const trackArtist = document.querySelector('.playbackSoundBadge__lightLink')?.textContent?.trim();
    
    if (trackTitle && trackArtist) {
      title = trackTitle;
      artist = trackArtist;
      console.log('🎵 SoundCloud player data:', { title, artist });
    } else {
      // Method 2: Extract from page title
      const pageTitle = document.title;
      if (pageTitle.includes(' by ')) {
        const parts = pageTitle.split(' by ');
        title = parts[0].replace(/^Stream /, '').trim();
        artist = parts[1].split(' | ')[0].trim();
        console.log('🎵 SoundCloud title parsing:', { title, artist });
      }
    }
    
    // Get artwork
    artwork = document.querySelector('.playbackSoundBadge .image__full')?.src || 
              document.querySelector('.image__full')?.src || null;
    
    // Check play state from button if we couldn't get it from audio element
    if (!isPlaying && duration === 0) {
      const playButton = document.querySelector('.playControl');
      if (playButton) {
        // If button shows "Pause", then it's playing
        isPlaying = playButton.title?.includes('Pause') || 
                   playButton.querySelector('[aria-label*="Pause"]') !== null;
      }
    }
    
    const result = {
      title,
      artist,
      album: '',
      artwork,
      isPlaying,
      duration,
      position
    };
    
    console.log('🎵 Final SoundCloud data:', result);
    return result;
  }
  
  extractYouTubeData() {
    const video = document.querySelector('video');
    if (!video) return null;
    
    const title = document.querySelector('#title h1')?.textContent?.trim();
    const channel = document.querySelector('#channel-name a')?.textContent?.trim();
    
    return {
      title: title || document.title.replace(' - YouTube', ''),
      artist: channel || 'YouTube',
      album: '',
      artwork: document.querySelector('.ytp-cued-thumbnail-overlay-image')?.src || null,
      isPlaying: !video.paused,
      duration: Math.floor(video.duration) || 0,
      position: Math.floor(video.currentTime) || 0
    };
  }
  
  extractYouTubeMusicData() {
    const title = document.querySelector('.title')?.textContent?.trim();
    const artist = document.querySelector('.byline')?.textContent?.trim();
    const video = document.querySelector('video');
    
    return {
      title: title || document.title.replace(' - YouTube Music', ''),
      artist: artist || 'Unknown Artist',
      album: '',
      artwork: document.querySelector('.image')?.src || null,
      isPlaying: video ? !video.paused : false,
      duration: video ? Math.floor(video.duration) || 0 : 0,
      position: video ? Math.floor(video.currentTime) || 0 : 0
    };
  }
  
  extractSpotifyData() {
    const title = document.querySelector('[data-testid="entityTitle"]')?.textContent?.trim();
    const artist = document.querySelector('[data-testid="context-item-info-artist"]')?.textContent?.trim();
    
    // Check play state
    const playButton = document.querySelector('[data-testid="control-button-play"]');
    const isPlaying = !playButton; // If play button exists, it's paused
    
    return {
      title: title || document.title.split(' • ')[0],
      artist: artist || document.title.split(' • ')[1] || 'Unknown Artist',
      album: '',
      artwork: document.querySelector('img[data-testid="cover-art"]')?.src || null,
      isPlaying: isPlaying,
      duration: 0,
      position: 0
    };
  }
  
  async checkAndSendMediaData() {
    try {
      const mediaData = this.getMediaSessionData();
      
      if (mediaData && this.hasDataChanged(mediaData)) {
        console.log(`📤 Sending enhanced media data v${this.version}:`, {
          title: mediaData.title,
          artist: mediaData.artist,
          isPlaying: mediaData.isPlaying,
          duration: mediaData.duration,
          position: mediaData.position,
          method: mediaData.method,
          version: mediaData.version
        });
        
        const success = await this.sendToDashboard(mediaData);
        if (success) {
          this.lastSentData = mediaData;
          this.retryCount = 0; // Reset retry count on success
        }
      }
    } catch (error) {
      console.error('❌ Error checking media data:', error);
    }
  }
  
  hasDataChanged(newData) {
    if (!this.lastSentData) return true;
    
    // Check key fields for changes
    const keyFields = ['title', 'artist', 'isPlaying', 'position'];
    return keyFields.some(field => {
      if (field === 'position') {
        // Only update position if it changed significantly (>3 seconds) or if duration info is new
        const positionDiff = Math.abs((newData[field] || 0) - (this.lastSentData[field] || 0));
        const hasNewDuration = newData.duration > 0 && (this.lastSentData.duration || 0) === 0;
        return positionDiff > 3 || hasNewDuration;
      }
      return newData[field] !== this.lastSentData[field];
    });
  }
  
  async sendToDashboard(data) {
    try {
      const response = await fetch(`${this.dashboardUrl}/api/obs-nowplaying`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        console.log(`✅ Data sent to dashboard successfully (v${this.version})`);
        return true;
      } else {
        console.error('❌ Dashboard response error:', response.status);
        return false;
      }
    } catch (error) {
      this.retryCount++;
      if (this.retryCount <= this.maxRetries) {
        console.log(`⚠️ Dashboard not reachable, retry ${this.retryCount}/${this.maxRetries} (v${this.version})`);
      } else {
        console.log(`⚠️ Dashboard not reachable (max retries reached) (v${this.version})`);
      }
      return false;
    }
  }
  
  /**
   * 🚀 BREAKTHROUGH FEATURE: WebSocket connection for instant cross-window control
   */
  async connectWebSocket() {
    console.log(`⚡ [MediaBridge] Connecting to WebSocket for instant commands v${this.version}`);
    
    // First check if dashboard server is reachable
    try {
      console.log(`🔍 [MediaBridge] Checking if dashboard server is running...`);
      const pingResponse = await fetch('http://localhost:8080/api/ping');
      if (!pingResponse.ok) {
        throw new Error(`Dashboard server responded with ${pingResponse.status}`);
      }
      console.log(`✅ [MediaBridge] Dashboard server is running, connecting WebSocket...`);
    } catch (error) {
      console.error(`❌ [MediaBridge] Dashboard server not reachable:`, error.message);
      console.log(`🔄 [MediaBridge] Will retry WebSocket connection later...`);
      this.reconnectWebSocket();
      return;
    }
    
    try {
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.onopen = () => {
        console.log(`✅ [MediaBridge] WebSocket connected to ${this.wsUrl}`);
        this.reconnectAttempts = 0;
        
        // Register as extension connection
        this.ws.send(JSON.stringify({
          type: 'extension-register',
          url: window.location.href,
          timestamp: Date.now(),
          version: this.version
        }));
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log(`📥 [MediaBridge] Received WebSocket message:`, message);
          
          if (message.type === 'media-command') {
            console.log(`🎮 [MediaBridge] Processing instant command: ${message.action}`);
            this.executeCommand(message);
          } else if (message.type === 'registration-success') {
            console.log(`🎯 [MediaBridge] Successfully registered with dashboard`);
          }
          
        } catch (error) {
          console.error(`❌ [MediaBridge] WebSocket message parsing error:`, error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log(`🔌 [MediaBridge] WebSocket disconnected:`, {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean
        });
        this.reconnectWebSocket();
      };
      
      this.ws.onerror = (event) => {
        console.error(`❌ [MediaBridge] WebSocket error details:`, {
          type: event.type,
          target: event.target?.readyState,
          url: this.wsUrl,
          timestamp: new Date().toISOString()
        });
        
        // More specific error based on readyState
        if (event.target?.readyState === WebSocket.CONNECTING) {
          console.error(`❌ [MediaBridge] Failed to connect to dashboard server at ${this.wsUrl}`);
          console.log(`💡 [MediaBridge] Make sure dashboard server is running on port 8080`);
        } else if (event.target?.readyState === WebSocket.CLOSING) {
          console.error(`❌ [MediaBridge] WebSocket connection closing unexpectedly`);
        } else {
          console.error(`❌ [MediaBridge] WebSocket error in state: ${event.target?.readyState}`);
        }
      };
      
    } catch (error) {
      console.error(`❌ [MediaBridge] WebSocket connection failed:`, error.message);
      console.log(`🔄 [MediaBridge] Will retry connection...`);
      this.reconnectWebSocket();
    }
  }
  
  /**
   * 🔄 Reconnect WebSocket with exponential backoff
   */
  reconnectWebSocket() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ [MediaBridge] Max WebSocket reconnection attempts reached`);
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    
    console.log(`🔄 [MediaBridge] Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }
  
  /**
   * 🎮 Execute WebSocket command via background script
   */
  async executeCommand(command) {
    const startTime = Date.now();
    console.log(`🎮 [MediaBridge] Executing WebSocket command: ${command.action} (ID: ${command.id})`);
    
    try {
      // Execute via background script (existing cross-window logic)
      const result = await this.executeCommandViaBackground(command);
      const executionTime = Date.now() - startTime;
      
      console.log(`✅ [MediaBridge] Command executed in ${executionTime}ms`);
      
      // Send result back via WebSocket
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'command-result',
          commandId: command.id,
          success: true,
          result: result,
          executionTime: executionTime,
          timestamp: Date.now()
        }));
      }
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ [MediaBridge] Command failed in ${executionTime}ms:`, error);
      
      // Send error result back via WebSocket
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'command-result',
          commandId: command.id,
          success: false,
          error: error.message,
          executionTime: executionTime,
          timestamp: Date.now()
        }));
      }
    }
  }
  
  /**
   * 📥 DEPRECATED: Polling replaced by WebSocket real-time communication
   * This function is no longer used - WebSocket provides instant command delivery
   */
  
  /**
   * 🎮 Execute command via background script (cross-window coordination)
   */
  async executeCommandViaBackground(commandData) {
    try {
      console.log(`🎮 [MediaBridge] Executing command via background script:`, commandData);
      console.log(`📤 [MediaBridge] Sending message to background script...`);
      
      // Check if extension context is valid
      if (!chrome.runtime?.id) {
        throw new Error('Extension context invalidated - reload required');
      }
      
      // Send to background script for cross-window coordination
      const response = await chrome.runtime.sendMessage({
        type: 'mediaControl',
        command: commandData.action || commandData.command, // Support both WebSocket and polling formats
        commandId: commandData.id,
        source: 'websocket-command'
      });
      
      console.log(`📬 [MediaBridge] Background script response:`, response);
      
      if (response) {
        console.log(`✅ [MediaBridge] Got valid response from background script`);
        return response; // Return response for WebSocket result handling
      } else {
        console.log(`⚠️ [MediaBridge] No response from background script`);
        throw new Error('No response from background script');
      }
      
    } catch (error) {
      console.error(`❌ [MediaBridge] Command execution error:`, error);
      
      // Handle extension context invalidation specifically
      if (error.message.includes('Extension context invalidated') || 
          error.message.includes('context invalidated')) {
        console.log(`🔄 [MediaBridge] Extension context invalidated - need to reload page or extension`);
        
        // Try to reload content script
        console.log(`🔄 [MediaBridge] Attempting to reload content script...`);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
      
      // Re-throw error for WebSocket error handling
      throw error;
    }
  }
  
  /**
   * 📬 Report command execution result back to dashboard
   */
  async reportCommandResult(commandId, result) {
    try {
      console.log(`📬 [MediaBridge] Reporting result for command ${commandId}:`, result);
      
      const payload = {
        commandId: commandId,
        success: result.success,
        result: result,
        tabUrl: window.location.href,
        timestamp: Date.now()
      };
      
      console.log(`📤 [MediaBridge] Sending result payload:`, payload);
      
      const response = await fetch(`${this.dashboardUrl}/api/extension/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        console.log(`✅ [MediaBridge] Command result reported successfully: ${commandId}`);
      } else {
        console.log(`❌ [MediaBridge] Failed to report result - Status: ${response.status}`);
      }
      
    } catch (error) {
      console.error(`❌ [MediaBridge] Failed to report command result:`, error);
    }
  }
  
  /**
   * 🛑 Cleanup method (no polling to stop - fully event-driven!)
   */
  stopCommandPolling() {
    // No polling intervals to clean up - extension is fully event-driven!
    console.log(`✅ [MediaBridge] No polling to stop - using real-time WebSocket`);
  }
}

// Start the media bridge when DOM is ready
console.log('🎵 DeskThing Media Bridge content script loaded!');
const mediaBridge = new MediaBridge();

// Add additional debug logging for troubleshooting
console.log('🔧 [Debug] Extension loaded on:', window.location.href);
console.log('🔧 [Debug] MediaSession available:', !!navigator.mediaSession);
console.log('🔧 [Debug] Audio elements found:', document.querySelectorAll('audio, video').length);

/**
 * 🚀 BREAKTHROUGH FEATURE: Cross-window control message listener
 * This receives control commands from background script for cross-window coordination
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(`📨 [Content] Received message from background:`, message);
  
  if (message.type === 'executeMediaControl') {
    console.log(`🎮 [Content] Executing cross-window control: ${message.command}`);
    
    // Execute the media control command in this tab
    executeMediaControlInTab(message.command)
      .then(result => {
        console.log(`✅ [Content] Control executed successfully:`, result);
        sendResponse({
          success: true,
          command: message.command,
          result: result,
          tabUrl: window.location.href,
          timestamp: Date.now()
        });
      })
      .catch(error => {
        console.error(`❌ [Content] Control execution failed:`, error);
        sendResponse({
          success: false,
          command: message.command,
          error: error.message,
          tabUrl: window.location.href,
          timestamp: Date.now()
        });
      });
    
    return true; // Keep response channel open for async response
  }
  
  // Handle other message types if needed
  return false;
});

/**
 * 🎮 Execute media control commands in this tab
 */
async function executeMediaControlInTab(command) {
  try {
    console.log(`🎵 [Content] Attempting ${command} in tab: ${window.location.hostname}`);
    
    // First, try direct media element control (most reliable)
    const mediaElements = document.querySelectorAll('audio, video');
    let mediaControlled = false;
    
    for (const media of mediaElements) {
      if (media.duration > 0 || media.currentTime > 0) {
        switch (command) {
          case 'play':
            if (media.paused) {
              await media.play();
              mediaControlled = true;
              return { method: 'media-element', element: media.tagName.toLowerCase() };
            }
            break;
            
          case 'pause':
            if (!media.paused) {
              media.pause();
              mediaControlled = true;
              return { method: 'media-element', element: media.tagName.toLowerCase() };
            }
            break;
            
          case 'nexttrack':
          case 'previoustrack':
            // Media elements don't handle track changes - fall through to button clicking
            break;
        }
        
        if (mediaControlled) break;
      }
    }
    
    // If media element control didn't work, try site-specific button clicking
    const buttonResult = await executeSiteSpecificControl(command);
    if (buttonResult.success) {
      return buttonResult;
    }
    
    // Final fallback: keyboard shortcuts
    const keyboardResult = executeKeyboardControl(command);
    if (keyboardResult.success) {
      return keyboardResult;
    }
    
    throw new Error(`No control method worked for ${command}`);
    
  } catch (error) {
    console.error(`❌ [Content] Media control error:`, error);
    throw error;
  }
}

/**
 * 🔘 Site-specific button control
 */
async function executeSiteSpecificControl(command) {
  const hostname = window.location.hostname.replace('www.', '');
  
  let selectors = [];
  
  switch (command) {
    case 'play':
    case 'pause':
      selectors = [
        '.playControl',                           // SoundCloud
        '[data-testid="control-button-playpause"]', // Spotify
        '.ytp-play-button, .ytp-pause-button',    // YouTube
        '[aria-label*="play" i], [aria-label*="pause" i]', // Generic
        '[title*="play" i], [title*="pause" i]'   // Generic
      ];
      break;
      
    case 'nexttrack':
      selectors = [
        '[data-testid="next-button"]',            // Spotify
        '.skipControl__next',                     // SoundCloud
        '.ytp-next-button',                       // YouTube
        '[aria-label*="next" i]',                 // Generic
        '[title*="next" i]'                       // Generic
      ];
      break;
      
    case 'previoustrack':
      selectors = [
        '[data-testid="previous-button"]',        // Spotify
        '.skipControl__previous',                 // SoundCloud
        '.ytp-prev-button',                       // YouTube
        '[aria-label*="previous" i]',             // Generic
        '[title*="previous" i]'                   // Generic
      ];
      break;
  }
  
  for (const selector of selectors) {
    try {
      const button = document.querySelector(selector);
      if (button && button.offsetParent !== null) {
        console.log(`🔘 [Content] Clicking button: ${selector}`);
        button.click();
        
        // Wait a bit to see if it worked
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return {
          success: true,
          method: 'button-click',
          selector: selector,
          site: hostname
        };
      }
    } catch (error) {
      console.warn(`⚠️ [Content] Button click failed for ${selector}:`, error);
    }
  }
  
  return { success: false, method: 'button-click' };
}

/**
 * ⌨️ Keyboard shortcut fallback
 */
function executeKeyboardControl(command) {
  try {
    let keyToPress = null;
    
    switch (command) {
      case 'play':
      case 'pause':
        keyToPress = ' '; // Space bar
        break;
      case 'nexttrack':
        // Some sites support arrow keys
        keyToPress = 'ArrowRight';
        break;
      case 'previoustrack':
        keyToPress = 'ArrowLeft';
        break;
    }
    
    if (keyToPress) {
      console.log(`⌨️ [Content] Sending keyboard event: ${keyToPress}`);
      
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: keyToPress,
        code: keyToPress === ' ' ? 'Space' : keyToPress,
        bubbles: true
      }));
      
      return {
        success: true,
        method: 'keyboard',
        key: keyToPress
      };
    }
    
  } catch (error) {
    console.warn(`⚠️ [Content] Keyboard control failed:`, error);
  }
  
  return { success: false, method: 'keyboard' };
} 