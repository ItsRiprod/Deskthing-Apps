import { SiteHandler } from './base-handler.js';

/**
 * SoundCloud Site Handler for CACP
 * Extracted from working SoundCloud extension with MSE + MediaSession integration
 */
export class SoundCloudHandler extends SiteHandler {
  static config = {
    name: 'SoundCloud',
    urlPatterns: ['soundcloud.com'],
    selectors: {
      playButton: '[title="Play"], .playButton, [aria-label*="play" i]',
      pauseButton: '[title="Pause"], .pauseButton, [aria-label*="pause" i]',
      nextButton: '.playControls__next, .skipControl__next, button[title="Skip to next"]',
      prevButton: '.playControls__prev, .skipControl__previous, button[title="Skip to previous"]',
      durationElement: '.playbackTimeline__duration',
      positionElement: '.playbackTimeline__timePassed',
      progressBar: '.playbackTimeline__progressBar',
      timeline: '.playbackTimeline, .playbackTimeline__progressWrapper',
      playerContainer: '.playControls, .soundTitle, .playbackSoundBadge'
    }
  };

  constructor() {
    super();
    this.isStreamingActive = false;
    this.currentTrack = null;
    this.mediaSessionData = {};
    this.positionUpdateInterval = null;
    this.lastLoggedPosition = 0;
    this.lastLoggedTime = 0;
    this.segmentLogged = false;
    this.mseElement = null;
  }

  /**
   * Initialize SoundCloud-specific functionality
   */
  async initialize() {
    console.log('[SoundCloud] Initializing handler...');
    
    try {
      // Set up MediaSession monitoring
      this.setupMediaSessionMonitoring();
      
      // Set up MSE detection
      this.setupMSEDetection();
      
      // Set up fetch interception for audio segments
      this.setupFetchInterception();
      
      // Set up timeline scrub detection
      this.setupTimelineScrubDetection();
      
      console.log('[SoundCloud] Handler initialized successfully');
      return true;
    } catch (error) {
      console.error('[SoundCloud] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Check if SoundCloud player is ready
   */
  isReady() {
    // Check if we have player controls or MediaSession
    const hasControls = !!this.getElement(this.constructor.config.selectors.playerContainer);
    const hasMediaSession = navigator.mediaSession && navigator.mediaSession.metadata;
    
    return hasControls || hasMediaSession || this.isStreamingActive;
  }

  /**
   * Check if user is logged in to SoundCloud
   */
  isLoggedIn() {
    // Look for user-specific elements that indicate login
    const userMenu = document.querySelector('.header__userNavButton, .header__userNav');
    const uploadButton = document.querySelector('.header__upload, [href="/upload"]');
    
    return !!(userMenu || uploadButton);
  }

  /**
   * Get current track information
   */
  getTrackInfo() {
    const info = {
      title: 'Unknown Track',
      artist: 'Unknown Artist', 
      album: '',
      artwork: [],
      isPlaying: false,
      site: 'SoundCloud'
    };

    // Try MediaSession first (most reliable)
    if (navigator.mediaSession && navigator.mediaSession.metadata) {
      const metadata = navigator.mediaSession.metadata;
      info.title = metadata.title || info.title;
      info.artist = metadata.artist || info.artist;
      info.album = metadata.album || info.album;
      info.artwork = metadata.artwork || [];
      
      // Get playing state from MediaSession
      info.isPlaying = navigator.mediaSession.playbackState === 'playing';
    }

    // Enhance with DOM elements if MediaSession is incomplete
    if (info.title === 'Unknown Track') {
      // Try to get title from DOM
      const titleElements = [
        '.playbackSoundBadge__titleLink',
        '.soundTitle__title',
        '.trackItem__trackTitle',
        'h1'
      ];
      
      for (const selector of titleElements) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          info.title = element.textContent.trim();
          break;
        }
      }
    }

    if (info.artist === 'Unknown Artist') {
      // Try to get artist from DOM
      const artistElements = [
        '.playbackSoundBadge__lightLink',
        '.soundTitle__username',
        '.trackItem__username'
      ];
      
      for (const selector of artistElements) {
        const element = document.querySelector(selector);
        if (element && element.textContent.trim()) {
          info.artist = element.textContent.trim();
          break;
        }
      }
    }

    // Get artwork if not available from MediaSession
    if (info.artwork.length === 0) {
      const artworkElements = [
        '.playbackSoundBadge__avatar img',
        '.image__full',
        '.sc-artwork img'
      ];
      
      for (const selector of artworkElements) {
        const element = document.querySelector(selector);
        if (element && element.src) {
          info.artwork = [{ src: element.src }];
          break;
        }
      }
    }

    this.currentTrack = info;
    return info;
  }

  /**
   * Get current playback time in seconds
   */
  getCurrentTime() {
    const timing = this.extractSoundCloudTiming();
    return timing.position || 0;
  }

  /**
   * Get track duration in seconds
   */
  getDuration() {
    const timing = this.extractSoundCloudTiming();
    return timing.duration || 0;
  }

  /**
   * Get current playing state
   */
  getPlayingState() {
    if (navigator.mediaSession) {
      return navigator.mediaSession.playbackState === 'playing';
    }
    
    // Fallback: check if pause button is visible (indicating playing)
    const pauseButton = this.getElement(this.constructor.config.selectors.pauseButton);
    return !!pauseButton;
  }

  /**
   * Play current track
   */
  async play() {
    console.log('[SoundCloud] Play command');
    
    const playButton = this.getElement(this.constructor.config.selectors.playButton);
    if (playButton) {
      this.clickElement(playButton);
      return { success: true, action: 'play' };
    }
    
    // Fallback: try spacebar
    document.dispatchEvent(new KeyboardEvent('keydown', { 
      code: 'Space', 
      bubbles: true, 
      cancelable: true 
    }));
    
    return { success: true, action: 'play', method: 'keyboard' };
  }

  /**
   * Pause current track
   */
  async pause() {
    console.log('[SoundCloud] Pause command');
    
    const pauseButton = this.getElement(this.constructor.config.selectors.pauseButton);
    if (pauseButton) {
      this.clickElement(pauseButton);
      return { success: true, action: 'pause' };
    }
    
    // Fallback: try spacebar
    document.dispatchEvent(new KeyboardEvent('keydown', { 
      code: 'Space', 
      bubbles: true, 
      cancelable: true 
    }));
    
    return { success: true, action: 'pause', method: 'keyboard' };
  }

  /**
   * Skip to next track
   */
  async next() {
    console.log('[SoundCloud] Next track command');
    
    // Try next button first
    const nextButton = this.getElement(this.constructor.config.selectors.nextButton);
    if (nextButton && !nextButton.disabled) {
      this.clickElement(nextButton);
      return { success: true, action: 'next' };
    }
    
    // Fallback: try keyboard shortcut (J key)
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'j',
      code: 'KeyJ',
      bubbles: true,
      cancelable: true
    }));
    
    return { success: true, action: 'next', method: 'keyboard' };
  }

  /**
   * Skip to previous track
   */
  async previous() {
    console.log('[SoundCloud] Previous track command');
    
    // Try previous button first
    const prevButton = this.getElement(this.constructor.config.selectors.prevButton);
    if (prevButton && !prevButton.disabled) {
      this.clickElement(prevButton);
      return { success: true, action: 'previous' };
    }
    
    // Fallback: try keyboard shortcut (K key)
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k',
      code: 'KeyK',
      bubbles: true,
      cancelable: true
    }));
    
    return { success: true, action: 'previous', method: 'keyboard' };
  }

  /**
   * Seek to specific time
   */
  async seek(time) {
    console.log(`[SoundCloud] Seeking to ${time}s`);
    
    // Try MSE element first
    if (this.mseElement) {
      this.mseElement.currentTime = time;
      return { success: true, action: 'seek', time };
    }

    // Try any media element
    const mediaElements = document.querySelectorAll('audio, video');
    for (const element of mediaElements) {
      if (element.duration && element.duration > 0) {
        element.currentTime = time;
        return { success: true, action: 'seek', time };
      }
    }

    // Calculate progress bar position and click
    const duration = this.getDuration();
    if (duration > 0) {
      const percentage = time / duration;
      const progressBar = this.getElement(this.constructor.config.selectors.progressBar);
      
      if (progressBar && progressBar.parentElement) {
        const rect = progressBar.parentElement.getBoundingClientRect();
        const clickX = rect.left + (rect.width * percentage);
        const clickY = rect.top + (rect.height / 2);
        
        this.clickAtPosition(progressBar.parentElement, clickX, clickY);
        return { success: true, action: 'seek', time, method: 'click' };
      }
    }

    return { success: false, error: 'No seek method available' };
  }

  /**
   * Extract SoundCloud timing data (position and duration)
   */
  extractSoundCloudTiming() {
    try {
      let position = 0;
      let duration = 0;
      
      // Get duration from text elements
      const durationElement = this.getElement(this.constructor.config.selectors.durationElement);
      if (durationElement && durationElement.textContent) {
        duration = this.parseTimeString(durationElement.textContent);
      }
      
      // Calculate position from progress bar percentage (most accurate)
      if (duration > 0) {
        const progressBar = this.getElement(this.constructor.config.selectors.progressBar);
        
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
      
      // Fallback: try position element text
      if (position === 0 && duration > 0) {
        const positionElement = this.getElement(this.constructor.config.selectors.positionElement);
        if (positionElement && positionElement.textContent) {
          position = this.parseTimeString(positionElement.textContent);
        }
      }
      
      // Final fallback: try media elements
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
      
      return { position, duration };
    } catch (error) {
      console.warn('[SoundCloud] Failed to extract timing:', error);
      return { position: 0, duration: 0 };
    }
  }

  /**
   * Set up MediaSession monitoring for track changes and playback state
   */
  setupMediaSessionMonitoring() {
    if (!navigator.mediaSession) {
      console.warn('[SoundCloud] MediaSession API not available');
      return;
    }

    console.log('[SoundCloud] Setting up MediaSession monitoring...');
    
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
          console.log('[SoundCloud] New track detected:', newTrack.title);
          this.currentTrack = newTrack;
        }
      }
    };

    // Poll MediaSession data
    setInterval(checkMediaSession, 1000);
  }

  /**
   * Set up MSE (MediaSource Extensions) detection
   */
  setupMSEDetection() {
    console.log('[SoundCloud] Setting up MSE detection...');
    
    // Hook MediaSource constructor
    const OriginalMediaSource = window.MediaSource;
    if (OriginalMediaSource) {
      const self = this;
      window.MediaSource = function(...args) {
        console.log('[SoundCloud] MediaSource created');
        const ms = new OriginalMediaSource(...args);
        
        ms.addEventListener('sourceopen', () => {
          console.log('[SoundCloud] MSE source opened - streaming active');
          self.isStreamingActive = true;
        });

        ms.addEventListener('sourceclose', () => {
          console.log('[SoundCloud] MSE source closed');
          self.isStreamingActive = false;
        });

        return ms;
      };
    }

    // Hook HTMLMediaElement.srcObject
    this.hookMediaElementSrcObject();
  }

  /**
   * Hook media element srcObject to detect MSE usage
   */
  hookMediaElementSrcObject() {
    const elements = ['HTMLAudioElement', 'HTMLVideoElement', 'HTMLMediaElement'];
    const self = this;
    
    elements.forEach(elementName => {
      const ElementClass = window[elementName];
      if (ElementClass && ElementClass.prototype) {
        const originalDescriptor = Object.getOwnPropertyDescriptor(ElementClass.prototype, 'srcObject');
        
        if (originalDescriptor && originalDescriptor.set) {
          Object.defineProperty(ElementClass.prototype, 'srcObject', {
            set: function(value) {
              if (value instanceof MediaSource) {
                console.log('[SoundCloud] MediaSource attached to', elementName);
                self.mseElement = this;
              }
              return originalDescriptor.set.call(this, value);
            },
            get: originalDescriptor.get,
            configurable: true,
            enumerable: true
          });
        }
      }
    });
  }

  /**
   * Set up fetch interception to detect audio streaming
   */
  setupFetchInterception() {
    const originalFetch = window.fetch;
    const self = this;
    
    window.fetch = async (...args) => {
      const [url] = args;
      const urlString = typeof url === 'string' ? url : url.toString();
      
      // Detect SoundCloud audio segment requests
      if (urlString.includes('media-streaming.soundcloud.cloud') && 
          (urlString.includes('.m4s') || urlString.includes('aac_'))) {
        
        if (!self.segmentLogged) {
          console.log('[SoundCloud] Audio segment streaming detected');
          self.segmentLogged = true;
          self.isStreamingActive = true;
        }
      }
      
      return originalFetch.apply(this, args);
    };
  }

  /**
   * Set up timeline scrub detection for seeking
   */
  setupTimelineScrubDetection() {
    console.log('[SoundCloud] Setting up timeline scrub detection...');
    
    let scrubTimeout;
    const self = this;
    
    const debouncedUpdate = () => {
      clearTimeout(scrubTimeout);
      scrubTimeout = setTimeout(() => {
        // Force timing update after scrubbing
        const timing = self.extractSoundCloudTiming();
        console.log(`[SoundCloud] Scrub update: ${timing.position}s / ${timing.duration}s`);
      }, 200);
    };
    
    const observeTimeline = () => {
      const timelineElements = document.querySelectorAll(this.constructor.config.selectors.timeline);
      
      timelineElements.forEach(element => {
        if (element.dataset.scrubDetected) return;
        element.dataset.scrubDetected = 'true';
        
        const scrubHandler = () => debouncedUpdate();
        
        element.addEventListener('mousedown', scrubHandler);
        element.addEventListener('mouseup', scrubHandler);
        element.addEventListener('click', scrubHandler);
        element.addEventListener('input', scrubHandler);
        element.addEventListener('change', scrubHandler);
      });
    };
    
    // Initial setup
    observeTimeline();
    
    // Re-observe when DOM changes (SoundCloud is an SPA)
    const observer = new MutationObserver(() => observeTimeline());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Parse time string (e.g., "3:45", "2 minutes 30 seconds") to seconds
   */
  parseTimeString(timeStr) {
    try {
      // Try "MM:SS" format first
      const timeMatch = timeStr.match(/(\d+):(\d+)/);
      if (timeMatch) {
        return (parseInt(timeMatch[1], 10) * 60) + parseInt(timeMatch[2], 10);
      }
      
      // Try "X minutes Y seconds" format
      const minutesMatch = timeStr.match(/(\d+)\s+minutes?/);
      const secondsMatch = timeStr.match(/(\d+)\s+seconds?/);
      
      let totalSeconds = 0;
      if (minutesMatch) totalSeconds += parseInt(minutesMatch[1], 10) * 60;
      if (secondsMatch) totalSeconds += parseInt(secondsMatch[1], 10);
      
      if (totalSeconds > 0) return totalSeconds;
      
      // Try just seconds
      const justSeconds = timeStr.match(/(\d+)/);
      if (justSeconds) {
        return parseInt(justSeconds[1], 10);
      }
      
      return 0;
    } catch (error) {
      console.warn('[SoundCloud] Failed to parse time string:', timeStr, error);
      return 0;
    }
  }
}
