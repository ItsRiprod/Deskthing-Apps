/**
 * Base Site Handler for CACP (Chrome Audio Control Platform)
 * 
 * Provides config-driven defaults with override capabilities for site-specific implementations.
 * Follows the 80/20 rule: config handles 80% of cases, custom overrides handle complex 20%.
 */

import logger from '@crimsonsunset/jsg-logger';

export class SiteHandler {
  constructor() {
    this.config = this.constructor.config;
    this.isInitialized = false;
    this.lastKnownTrackInfo = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    
    // Get logger based on config name
    const siteName = this.config.name.toLowerCase();
    this.log = logger[siteName] || logger.createLogger(siteName);
  }

  /**
   * Static config that must be defined by each site implementation
   * @example
   * static config = {
   *   name: 'SoundCloud',
   *   urlPatterns: ['soundcloud.com'],
   *   selectors: {
   *     playButton: '.playButton',
   *     pauseButton: '.pauseButton',
   *     nextButton: '.skipControl__next',
   *     prevButton: '.skipControl__previous',
   *     title: '.playbackSoundBadge__titleLink',
   *     artist: '.playbackSoundBadge__lightLink',
   *     artwork: '.playbackSoundBadge .image span[style*="background-image"]',
   *     currentTime: '.playbackTimeline__timePassed span[aria-label]',
   *     duration: '.playbackTimeline__duration span[aria-label]',
   *     progressBar: '.playbackTimeline__progressWrapper'
   *   }
   * }
   */
  static config = {
    name: 'Generic',
    urlPatterns: [],
    selectors: {}
  };

  // === Core Interface Methods ===

  /**
   * Initialize the site handler
   * Called when the site is detected and ready
   */
  async initialize() {
    try {
      await this.waitForElements();
      this.isInitialized = true;
      this.log.info('Handler initialized successfully', {
        siteName: this.config.name,
        hasElements: true
      });
      return true;
    } catch (error) {
      this.log.error('Handler initialization failed', {
        siteName: this.config.name,
        error: error.message,
        stack: error.stack
      });
      return false;
    }
  }

  /**
   * Check if the site is ready for interaction
   * @returns {boolean} True if site is loaded and ready
   */
  isReady() {
    if (!this.isInitialized) return false;
    
    // Check if essential elements exist
    const playButton = this.getElement(['playButton', 'pauseButton']);
    return !!playButton;
  }

  /**
   * Check if user is logged in (if applicable)
   * @returns {boolean} True if logged in or login not required
   */
  isLoggedIn() {
    // Default: assume no login required
    // Override in site-specific handlers if needed
    return true;
  }

  /**
   * Play audio
   */
  async play() {
    try {
      const button = this.getElement(['playButton', 'pauseButton']);
      if (button) {
        // Check if it's actually a play button (not pause)
        const isPlayButton = this.isPlayButton(button);
        if (isPlayButton) {
          this.clickElement(button);
          return { success: true, action: 'play' };
        }
      }
      throw new Error('Play button not found or not in correct state');
    } catch (error) {
      this.log.error('Play command failed', {
        siteName: this.config.name,
        error: error.message,
        selector: this.config.selectors?.playButton
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Pause audio
   */
  async pause() {
    try {
      const button = this.getElement(['pauseButton', 'playButton']);
      if (button) {
        // Check if it's actually a pause button (not play)
        const isPauseButton = this.isPauseButton(button);
        if (isPauseButton) {
          this.clickElement(button);
          return { success: true, action: 'pause' };
        }
      }
      throw new Error('Pause button not found or not in correct state');
    } catch (error) {
      this.log.error('Pause command failed', {
        siteName: this.config.name,
        error: error.message,
        selector: this.config.selectors?.pauseButton
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Next track
   */
  async next() {
    try {
      const button = this.getElement('nextButton');
      if (button && !button.disabled) {
        this.clickElement(button);
        return { success: true, action: 'next' };
      }
      throw new Error('Next button not found or disabled');
    } catch (error) {
      this.log.error('Next command failed', {
        siteName: this.config.name,
        error: error.message,
        selector: this.config.selectors?.nextButton
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Previous track
   */
  async previous() {
    try {
      const button = this.getElement('prevButton');
      if (button && !button.disabled) {
        this.clickElement(button);
        return { success: true, action: 'previous' };
      }
      throw new Error('Previous button not found or disabled');
    } catch (error) {
      this.log.error('Previous command failed', {
        siteName: this.config.name,
        error: error.message,
        selector: this.config.selectors?.prevButton
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current track information
   * @returns {Object} Track info object
   */
  getTrackInfo() {
    try {
      const title = this.getElementText('title') || 'Unknown Title';
      const artist = this.getElementText('artist') || 'Unknown Artist';
      const album = this.getElementText('album') || '';
      const artwork = this.getArtwork();
      const isPlaying = this.isPlaying();

      const trackInfo = {
        title,
        artist,
        album,
        artwork,
        isPlaying
      };

      this.lastKnownTrackInfo = trackInfo;
      return trackInfo;
    } catch (error) {
      this.log.warn('Track info extraction failed', {
        siteName: this.config.name,
        error: error.message,
        fallback: 'returning last known info'
      });
      return this.lastKnownTrackInfo || this.getDefaultTrackInfo();
    }
  }

  /**
   * Get current playback time
   * @returns {number} Current time in seconds
   */
  getCurrentTime() {
    try {
      const timeElement = this.getElement('currentTime');
      if (timeElement) {
        const timeText = timeElement.textContent || timeElement.getAttribute('aria-label') || '';
        return this.parseTimeString(timeText);
      }
      return 0;
    } catch (error) {
      this.log.warn('Current time extraction failed', {
        siteName: this.config.name,
        error: error.message,
        fallback: 0
      });
      return 0;
    }
  }

  /**
   * Get total track duration
   * @returns {number} Duration in seconds
   */
  getDuration() {
    try {
      const durationElement = this.getElement('duration');
      if (durationElement) {
        const durationText = durationElement.textContent || durationElement.getAttribute('aria-label') || '';
        return this.parseTimeString(durationText);
      }
      return 0;
    } catch (error) {
      this.log.warn('Duration extraction failed', {
        siteName: this.config.name,
        error: error.message,
        fallback: 0
      });
      return 0;
    }
  }

  /**
   * Seek to specific time
   * @param {number} time Time in seconds
   * @returns {boolean} Success
   */
  async seek(time) {
    try {
      const progressBar = this.getElement('progressBar');
      if (progressBar && this.isSeekable(progressBar)) {
        const duration = this.getDuration();
        if (duration > 0) {
          const percentage = Math.max(0, Math.min(1, time / duration));
          this.seekToPercentage(progressBar, percentage);
          return { success: true, action: 'seek', time };
        }
      }
      throw new Error('Seeking not available or invalid time');
    } catch (error) {
      this.log.error('Seek command failed', {
        siteName: this.config.name,
        error: error.message,
        time,
        selector: this.config.selectors?.progressBar
      });
      return { success: false, error: error.message };
    }
  }

  // === Helper Methods ===

  /**
   * Get DOM element using config selectors with fallbacks
   * @param {string|string[]} selectorKey Selector key(s) from config
   * @returns {Element|null} Found element or null
   */
  getElement(selectorKey) {
    const selectorKeys = Array.isArray(selectorKey) ? selectorKey : [selectorKey];
    
    for (const key of selectorKeys) {
      const selector = this.config.selectors[key];
      if (selector) {
        const element = document.querySelector(selector);
        if (element) return element;
      }
    }
    return null;
  }

  /**
   * Get text content from element
   * @param {string} selectorKey Selector key from config
   * @returns {string} Element text content
   */
  getElementText(selectorKey) {
    const element = this.getElement(selectorKey);
    return element ? (element.textContent || element.innerText || '').trim() : '';
  }

  /**
   * Get artwork URLs
   * @returns {string[]} Array of artwork URLs
   */
  getArtwork() {
    const artworkElement = this.getElement('artwork');
    if (!artworkElement) return [];

    const artworkUrls = [];
    
    // Check for background-image style
    const bgImage = artworkElement.style.backgroundImage;
    if (bgImage) {
      const match = bgImage.match(/url\("?([^"]*)"?\)/);
      if (match) artworkUrls.push(match[1]);
    }

    // Check for src attribute
    const src = artworkElement.src || artworkElement.getAttribute('src');
    if (src) artworkUrls.push(src);

    return artworkUrls;
  }

  /**
   * Determine if audio is currently playing
   * @returns {boolean} True if playing
   */
  getPlayingState() {
    const playButton = this.getElement(['playButton', 'pauseButton']);
    if (playButton) {
      return !this.isPlayButton(playButton);
    }
    return false;
  }

  /**
   * Check if button is in "play" state (shows play icon)
   * @param {Element} button Button element
   * @returns {boolean} True if button will start playback
   */
  isPlayButton(button) {
    // Check common patterns for play vs pause states
    const buttonText = button.textContent || '';
    const ariaLabel = button.getAttribute('aria-label') || '';
    const className = button.className || '';
    
    // Common play indicators
    const playIndicators = ['play', 'start', '▶', '►'];
    const pauseIndicators = ['pause', 'stop', '⏸', '❚❚'];
    
    const text = `${buttonText} ${ariaLabel} ${className}`.toLowerCase();
    
    if (pauseIndicators.some(indicator => text.includes(indicator))) {
      return false; // It's a pause button
    }
    if (playIndicators.some(indicator => text.includes(indicator))) {
      return true; // It's a play button
    }
    
    // Fallback: assume it's a play button if uncertain
    return true;
  }

  /**
   * Safely click an element
   * @param {Element} element Element to click
   */
  clickElement(element) {
    if (element && typeof element.click === 'function') {
      element.click();
    }
  }

  /**
   * Click at specific coordinates
   * @param {Element} element Target element
   * @param {number} x X coordinate
   * @param {number} y Y coordinate
   */
  clickAtPosition(element, x, y) {
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y
    });
    element.dispatchEvent(event);
  }

  /**
   * Parse time string to seconds
   * @param {string} timeString Time in format like "1:23" or "12:34"
   * @returns {number} Time in seconds
   */
  parseTimeString(timeString) {
    if (!timeString) return 0;
    
    const cleanTime = timeString.replace(/[^\d:]/g, '');
    const parts = cleanTime.split(':').map(p => parseInt(p, 10) || 0);
    
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]; // mm:ss
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]; // hh:mm:ss
    }
    
    return 0;
  }

  /**
   * Wait for essential elements to load
   * @param {number} timeout Timeout in milliseconds
   */
  async waitForElements(timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const playButton = this.getElement(['playButton', 'pauseButton']);
      if (playButton) {
        return true;
      }
      await this.sleep(100);
    }
    
    throw new Error(`Essential elements not found within ${timeout}ms`);
  }

  /**
   * Sleep utility
   * @param {number} ms Milliseconds to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if current URL matches this handler's patterns
   * @returns {boolean} True if URL matches
   */
  static matchesURL(url) {
    const patterns = this.config.urlPatterns || [];
    return patterns.some(pattern => url.includes(pattern));
  }
}

export default SiteHandler;

