import { SiteHandler } from './base-handler.js';
import { logger } from '../logger.js';

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
      timeline: '.playbackTimeline, .playbackTimeline__progressWrapper, .playbackTimeline__progressBackground, .playbackTimeline__progressHandle',
      playerContainer: '.playControls, .soundTitle, .playbackSoundBadge'
    }
  };

  constructor() {
    super();
    
    // Initialize logger
    this.log = logger.soundcloud;
    
    // State initialization
    this.isStreamingActive = false;
    this.currentTrack = null;
    this.mediaSessionData = {};
    this.positionUpdateInterval = null;
    this.lastLoggedPosition = 0;
    this.lastLoggedTime = 0;
    this.segmentLogged = false;
    this.mseElement = null;
    
    this.log.debug('SoundCloud handler constructed', {
      config: SoundCloudHandler.config,
      initialState: {
        isStreamingActive: this.isStreamingActive,
        currentTrack: this.currentTrack
      }
    });
  }

  /**
   * Initialize SoundCloud-specific functionality
   */
  async initialize() {
    this.log.info('Initializing SoundCloud handler...');
    
    try {
      this.log.debug('Setting up monitoring systems');
      
      // Set up MediaSession monitoring
      this.setupMediaSessionMonitoring();
      this.log.trace('MediaSession monitoring setup complete');
      
      // Set up MSE detection
      this.setupMSEDetection();
      this.log.trace('MSE detection setup complete');
      
      // Set up fetch interception for audio segments
      this.setupFetchInterception();
      this.log.trace('Fetch interception setup complete');
      
      // Set up timeline scrub detection
      this.setupTimelineScrubDetection();
      this.log.trace('Timeline scrub detection setup complete');
      
      this.log.info('SoundCloud handler initialized successfully');
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
    this.log.trace('Extracting track information');
    
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
      
      this.log.debug('MediaSession data extracted', {
        hasMetadata: !!metadata,
        title: info.title,
        artist: info.artist,
        album: info.album,
        artworkCount: info.artwork.length,
        playbackState: navigator.mediaSession.playbackState
      });
    } else {
      this.log.debug('MediaSession not available or missing metadata');
    }

    // Enhance with DOM elements if MediaSession is incomplete
    if (info.title === 'Unknown Track') {
      this.log.debug('Falling back to DOM for title extraction');
      
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
          this.log.debug('Title extracted from DOM', { 
            selector, 
            title: info.title 
          });
          break;
        }
      }
      
      if (info.title === 'Unknown Track') {
        this.log.warn('Could not extract title from any DOM selectors');
      }
    }

    if (info.artist === 'Unknown Artist') {
      this.log.debug('Falling back to DOM for artist extraction');
      
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
          this.log.debug('Artist extracted from DOM', { 
            selector, 
            artist: info.artist 
          });
          break;
        }
      }
      
      if (info.artist === 'Unknown Artist') {
        this.log.warn('Could not extract artist from any DOM selectors');
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
    
    this.log.debugObject('Track info extraction complete', {
      finalTrackInfo: info,
      extractionMethods: {
        mediaSessionUsed: !!(navigator.mediaSession && navigator.mediaSession.metadata),
        domFallbackUsed: info.title !== 'Unknown Track' || info.artist !== 'Unknown Artist'
      }
    });
    
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
   * Play current track (with MediaSession fallback + position tracking)
   */
  async play() {
    this.log.debug('Play command - trying MediaSession first, then buttons');
    
    // Try MediaSession API first (matches original approach)
    if (navigator.mediaSession && navigator.mediaSession.setActionHandler) {
      try {
        this.log.trace('Attempting MediaSession play control');
        navigator.mediaSession.setActionHandler('play', null);
        // Note: MediaSession control is more for signaling, still need button clicks
      } catch (error) {
        this.log.warn('MediaSession play control failed', { error: error.message });
      }
    }
    
    // Try play button
    const playButton = this.getElement(this.constructor.config.selectors.playButton);
    if (playButton) {
      this.log.debug('Clicking play button', { className: playButton.className });
      this.clickElement(playButton);
      
      // Start position tracking when playback begins
      this.startPositionTracking();
      
      return { success: true, action: 'play' };
    }
    
    // Fallback: try spacebar
    this.log.debug('Play button not found, trying spacebar fallback');
    document.dispatchEvent(new KeyboardEvent('keydown', { 
      code: 'Space', 
      bubbles: true, 
      cancelable: true 
    }));
    
    // Start position tracking even with keyboard fallback
    this.startPositionTracking();
    
    return { success: true, action: 'play', method: 'keyboard' };
  }

  /**
   * Pause current track (with MediaSession fallback + stop position tracking)
   */
  async pause() {
    this.log.debug('Pause command - trying MediaSession first, then buttons');
    
    // Try MediaSession API first (matches original approach)
    if (navigator.mediaSession && navigator.mediaSession.setActionHandler) {
      try {
        this.log.trace('Attempting MediaSession pause control');
        navigator.mediaSession.setActionHandler('pause', null);
        // Note: MediaSession control is more for signaling, still need button clicks
      } catch (error) {
        this.log.warn('MediaSession pause control failed', { error: error.message });
      }
    }
    
    // Try pause button
    const pauseButton = this.getElement(this.constructor.config.selectors.pauseButton);
    if (pauseButton) {
      this.log.debug('Clicking pause button', { className: pauseButton.className });
      this.clickElement(pauseButton);
      
      // Stop position tracking when playback pauses
      this.stopPositionTracking();
      
      return { success: true, action: 'pause' };
    }
    
    // Fallback: try spacebar
    this.log.debug('Pause button not found, trying spacebar fallback');
    document.dispatchEvent(new KeyboardEvent('keydown', { 
      code: 'Space', 
      bubbles: true, 
      cancelable: true 
    }));
    
    // Stop position tracking even with keyboard fallback
    this.stopPositionTracking();
    
    return { success: true, action: 'pause', method: 'keyboard' };
  }

  /**
   * Skip to next track (matches original timing: keyboard first + delays)
   */
  async next() {
    this.log.debug('Next track command - using original timing strategy');
    
    // KEYBOARD SHORTCUT FIRST with 50ms delay (matches original)
    setTimeout(() => {
      this.log.trace('Dispatching keyboard event: j key');
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'j',
        code: 'KeyJ',
        bubbles: true,
        cancelable: true
      }));
    }, 50);
    
    // BUTTON CLICK SECOND with 600ms delay (matches original)
    setTimeout(() => {
      const nextButton = this.getElement(this.constructor.config.selectors.nextButton);
      
      if (nextButton && !nextButton.disabled) {
        this.log.debug('Clicking next button after delay', { 
          className: nextButton.className,
          disabled: nextButton.disabled 
        });
        this.clickElement(nextButton);
      } else {
        this.log.warn('Next button not found or disabled after delay', {
          found: !!nextButton,
          disabled: nextButton?.disabled
        });
      }
    }, 600);
    
    return { success: true, action: 'next', method: 'keyboard-first-with-button-fallback' };
  }

  /**
   * Skip to previous track (matches original timing: keyboard immediate + button delay)
   */
  async previous() {
    this.log.debug('Previous track command - using original timing strategy');
    
    // KEYBOARD SHORTCUT IMMEDIATELY (matches original - no delay)
    this.log.trace('Dispatching keyboard event: k key');
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'k',
      code: 'KeyK',
      bubbles: true,
      cancelable: true
    }));
    
    // BUTTON CLICK SECOND with 200ms delay (matches original)
    setTimeout(() => {
      const prevButton = this.getElement(this.constructor.config.selectors.prevButton);
      
      if (prevButton && !prevButton.disabled) {
        this.log.debug('Clicking prev button after delay', { 
          className: prevButton.className,
          disabled: prevButton.disabled 
        });
        this.clickElement(prevButton);
      } else {
        this.log.warn('Prev button not found or disabled after delay', {
          found: !!prevButton,
          disabled: prevButton?.disabled
        });
      }
    }, 200);
    
    return { success: true, action: 'previous', method: 'keyboard-first-with-button-fallback' };
  }

  /**
   * Seek to specific time
   */
  async seek(time) {
    this.log.debug('Seeking to position', { time, timeFormatted: `${time}s` });
    
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
   * Start tracking playback position (matches original 1000ms interval)
   */
  startPositionTracking() {
    if (this.positionUpdateInterval) return;
    
    this.log.debug('Starting position tracking with 1000ms interval');
    
    this.positionUpdateInterval = setInterval(() => {
      this.updatePosition();
    }, 1000);
  }

  /**
   * Stop tracking playback position
   */
  stopPositionTracking() {
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval);
      this.positionUpdateInterval = null;
      this.log.debug('Stopped position tracking');
    }
  }

  /**
   * Update current position and duration (called by interval)
   */
  updatePosition() {
    // Extract timing from SoundCloud DOM elements
    const soundcloudTiming = this.extractSoundCloudTiming();
    
    if (soundcloudTiming.duration > 0) {
      // For now, just log the position - TODO: implement smart logging
      this.log.trace('Position update', {
        position: soundcloudTiming.position,
        duration: soundcloudTiming.duration,
        percentage: Math.round((soundcloudTiming.position / soundcloudTiming.duration) * 100)
      });
      
      // TODO: Add broadcastTimeUpdate to send to DeskThing app
      // this.broadcastTimeUpdate(soundcloudTiming.position, soundcloudTiming.duration);
      return;
    }

    // Try to get position from discovered MSE element (matches original)
    if (this.mseElement) {
      const position = this.mseElement.currentTime || 0;
      const duration = this.mseElement.duration || 0;
      
      if (duration > 0) {
        this.log.trace('MSE position update', {
          position: Math.floor(position),
          duration: Math.floor(duration)
        });
        
        // TODO: Add broadcastTimeUpdate to send to DeskThing app
        // this.broadcastTimeUpdate(Math.floor(position), Math.floor(duration));
      }
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
