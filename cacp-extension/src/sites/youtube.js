import { SiteHandler } from './base-handler.js';
import logger from '@crimsonsunset/jsg-logger';

/**
 * YouTube Site Handler for CACP
 * Supports both YouTube and YouTube Music
 */
export class YouTubeHandler extends SiteHandler {
  static config = {
    name: 'YouTube',
    urlPatterns: ['youtube.com', 'music.youtube.com'],
    selectors: {
      // YouTube main site selectors
      playButton: '.ytp-play-button[aria-label*="Play"], .play-pause-button[aria-label*="Play"]',
      pauseButton: '.ytp-play-button[aria-label*="Pause"], .play-pause-button[aria-label*="Pause"]',
      nextButton: '.ytp-next-button, .next-button',
      prevButton: '.ytp-prev-button, .previous-button',
      
      // YouTube Music specific selectors  
      ytmPlayButton: '#play-pause-button[aria-label*="Play"], .play-pause-button[title*="Play"]',
      ytmPauseButton: '#play-pause-button[aria-label*="Pause"], .play-pause-button[title*="Pause"]',
      ytmNextButton: '.next-button, #next-button',
      ytmPrevButton: '.previous-button, #previous-button',
      
      // Progress and timing
      progressBar: '.ytp-progress-bar, .progress-bar',
      currentTime: '.ytp-time-current, .time-info .left-controls',
      duration: '.ytp-time-duration, .time-info .right-controls',
      
      // Player containers
      playerContainer: '.html5-video-player, .player-bar, #movie_player',
      videoElement: 'video',
      
      // Title and metadata
      titleElement: 'h1.title, .content-info-wrapper .title, .ytmusic-player-bar .title',
      artistElement: '.ytmusic-player-bar .subtitle, .owner-name, .upload-info .channel-name'
    }
  };

  constructor() {
    super();
    this.log = logger.youtube;
    this.isYouTubeMusic = window.location.hostname.includes('music.youtube.com');
    this.currentVideoElement = null;
    
    this.log.debug('YouTube handler constructed', {
      isYouTubeMusic: this.isYouTubeMusic,
      hostname: window.location.hostname,
      config: YouTubeHandler.config
    });
  }

  /**
   * Initialize YouTube-specific functionality
   */
  async initialize() {
    this.log.info('Initializing YouTube handler', {
      isYouTubeMusic: this.isYouTubeMusic,
      hostname: window.location.hostname,
      currentUrl: window.location.href
    });
    
    try {
      // Find and monitor video element
      this.log.debug('Setting up video element monitoring');
      this.setupVideoElementMonitoring();
      
      // Set up MediaSession monitoring (YouTube uses this)
      this.log.debug('Setting up MediaSession monitoring');
      this.setupMediaSessionMonitoring();
      
      // Monitor for YouTube's dynamic content changes
      this.log.debug('Setting up DOM observer for dynamic content');
      this.setupDOMObserver();
      
      this.log.info('YouTube handler initialized successfully', {
        hasVideoElement: !!this.currentVideoElement,
        hasMediaSession: !!(navigator.mediaSession && navigator.mediaSession.metadata),
        playerReady: this.isReady()
      });
      return true;
    } catch (error) {
      this.log.error('YouTube handler initialization failed', {
        error: error.message,
        stack: error.stack,
        isYouTubeMusic: this.isYouTubeMusic
      });
      return false;
    }
  }

  /**
   * Check if YouTube player is ready
   */
  isReady() {
    // Check for video element and player container
    const hasVideo = !!this.getElement(this.constructor.config.selectors.videoElement);
    const hasPlayer = !!this.getElement(this.constructor.config.selectors.playerContainer);
    const hasMediaSession = navigator.mediaSession && navigator.mediaSession.metadata;
    
    return hasVideo || hasPlayer || hasMediaSession;
  }

  /**
   * Check if user is logged in to YouTube
   */
  isLoggedIn() {
    // Look for user avatar or account menu
    const userAvatar = document.querySelector('#avatar-btn, .ytmusic-nav-bar .right-content');
    const signInButton = document.querySelector('#sign-in-button, .sign-in-link');
    
    return !!userAvatar && !signInButton;
  }

  /**
   * Get current track information
   */
  getTrackInfo() {
    const info = {
      title: 'Unknown Video',
      artist: 'Unknown Channel',
      album: '',
      artwork: [],
      isPlaying: false,
      site: this.isYouTubeMusic ? 'YouTube Music' : 'YouTube'
    };

    // Try MediaSession first (most reliable for YouTube)
    if (navigator.mediaSession && navigator.mediaSession.metadata) {
      const metadata = navigator.mediaSession.metadata;
      info.title = metadata.title || info.title;
      info.artist = metadata.artist || info.artist;
      info.album = metadata.album || info.album;
      info.artwork = metadata.artwork || [];
      info.isPlaying = navigator.mediaSession.playbackState === 'playing';
    }

    // Enhance with DOM elements if MediaSession is incomplete
    if (info.title === 'Unknown Video') {
      const titleElement = this.getElement(this.constructor.config.selectors.titleElement);
      if (titleElement) {
        info.title = this.getElementText(titleElement);
      }
    }

    if (info.artist === 'Unknown Channel') {
      const artistElement = this.getElement(this.constructor.config.selectors.artistElement);
      if (artistElement) {
        info.artist = this.getElementText(artistElement);
      }
    }

    // Get artwork if not available from MediaSession
    if (info.artwork.length === 0) {
      // Try video thumbnail or album art
      const artworkSelectors = [
        '.ytmusic-player-bar img',
        '.ytp-videowall-still img',
        'meta[property="og:image"]'
      ];
      
      for (const selector of artworkSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const src = element.src || element.content;
          if (src) {
            info.artwork = [{ src }];
            break;
          }
        }
      }
    }

    return info;
  }

  /**
   * Get current playback time in seconds
   */
  getCurrentTime() {
    // Try video element first
    if (this.currentVideoElement) {
      return this.currentVideoElement.currentTime || 0;
    }

    // Try any video element
    const videoElement = this.getElement(this.constructor.config.selectors.videoElement);
    if (videoElement) {
      return videoElement.currentTime || 0;
    }

    // Fallback: try to parse from time display
    const currentTimeElement = this.getElement(this.constructor.config.selectors.currentTime);
    if (currentTimeElement) {
      return this.parseTimeString(this.getElementText(currentTimeElement));
    }

    return 0;
  }

  /**
   * Get track duration in seconds
   */
  getDuration() {
    // Try video element first
    if (this.currentVideoElement) {
      return this.currentVideoElement.duration || 0;
    }

    // Try any video element
    const videoElement = this.getElement(this.constructor.config.selectors.videoElement);
    if (videoElement) {
      return videoElement.duration || 0;
    }

    // Fallback: try to parse from duration display
    const durationElement = this.getElement(this.constructor.config.selectors.duration);
    if (durationElement) {
      return this.parseTimeString(this.getElementText(durationElement));
    }

    return 0;
  }

  /**
   * Get current playing state
   */
  getPlayingState() {
    // Try MediaSession first
    if (navigator.mediaSession) {
      return navigator.mediaSession.playbackState === 'playing';
    }
    
    // Try video element
    const videoElement = this.currentVideoElement || this.getElement(this.constructor.config.selectors.videoElement);
    if (videoElement) {
      return !videoElement.paused;
    }
    
    // Fallback: check if pause button is visible (indicating playing)
    const pauseButton = this.getElement(
      this.isYouTubeMusic ? 
        this.constructor.config.selectors.ytmPauseButton : 
        this.constructor.config.selectors.pauseButton
    );
    return !!pauseButton;
  }

  /**
   * Play current video/track
   */
  async play() {
    this.log.info(`Play command`, { isYouTubeMusic: this.isYouTubeMusic });
    
    // Try appropriate play button
    const playButtonSelector = this.isYouTubeMusic ? 
      this.constructor.config.selectors.ytmPlayButton : 
      this.constructor.config.selectors.playButton;
    
    const playButton = this.getElement(playButtonSelector);
    if (playButton) {
      this.clickElement(playButton);
      return { success: true, action: 'play' };
    }

    // Try video element directly
    const videoElement = this.currentVideoElement || this.getElement(this.constructor.config.selectors.videoElement);
    if (videoElement) {
      await videoElement.play();
      return { success: true, action: 'play', method: 'video' };
    }

    // Fallback: keyboard shortcut (spacebar)
    document.dispatchEvent(new KeyboardEvent('keydown', { 
      code: 'Space', 
      bubbles: true, 
      cancelable: true 
    }));
    
    return { success: true, action: 'play', method: 'keyboard' };
  }

  /**
   * Pause current video/track
   */
  async pause() {
    this.log.info(`Pause command`, { isYouTubeMusic: this.isYouTubeMusic });
    
    // Try appropriate pause button
    const pauseButtonSelector = this.isYouTubeMusic ? 
      this.constructor.config.selectors.ytmPauseButton : 
      this.constructor.config.selectors.pauseButton;
    
    const pauseButton = this.getElement(pauseButtonSelector);
    if (pauseButton) {
      this.clickElement(pauseButton);
      return { success: true, action: 'pause' };
    }

    // Try video element directly
    const videoElement = this.currentVideoElement || this.getElement(this.constructor.config.selectors.videoElement);
    if (videoElement) {
      videoElement.pause();
      return { success: true, action: 'pause', method: 'video' };
    }

    // Fallback: keyboard shortcut (spacebar)
    document.dispatchEvent(new KeyboardEvent('keydown', { 
      code: 'Space', 
      bubbles: true, 
      cancelable: true 
    }));
    
    return { success: true, action: 'pause', method: 'keyboard' };
  }

  /**
   * Skip to next video/track
   */
  async next() {
    this.log.info(`Next track command`, { isYouTubeMusic: this.isYouTubeMusic });
    
    // Try appropriate next button
    const nextButtonSelector = this.isYouTubeMusic ? 
      this.constructor.config.selectors.ytmNextButton : 
      this.constructor.config.selectors.nextButton;
    
    const nextButton = this.getElement(nextButtonSelector);
    if (nextButton && !nextButton.disabled) {
      this.clickElement(nextButton);
      return { success: true, action: 'next' };
    }

    // Fallback: keyboard shortcut (Shift+N for YouTube)
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'N',
      code: 'KeyN',
      shiftKey: true,
      bubbles: true,
      cancelable: true
    }));
    
    return { success: true, action: 'next', method: 'keyboard' };
  }

  /**
   * Skip to previous video/track
   */
  async previous() {
    this.log.info(`Previous track command`, { isYouTubeMusic: this.isYouTubeMusic });
    
    // Try appropriate previous button
    const prevButtonSelector = this.isYouTubeMusic ? 
      this.constructor.config.selectors.ytmPrevButton : 
      this.constructor.config.selectors.prevButton;
    
    const prevButton = this.getElement(prevButtonSelector);
    if (prevButton && !prevButton.disabled) {
      this.clickElement(prevButton);
      return { success: true, action: 'previous' };
    }

    // Fallback: keyboard shortcut (Shift+P for YouTube)
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'P',
      code: 'KeyP',
      shiftKey: true,
      bubbles: true,
      cancelable: true
    }));
    
    return { success: true, action: 'previous', method: 'keyboard' };
  }

  /**
   * Seek to specific time
   */
  async seek(time) {
    this.log.info(`Seeking to ${time}s`, { isYouTubeMusic: this.isYouTubeMusic, time });
    
    // Try video element first
    const videoElement = this.currentVideoElement || this.getElement(this.constructor.config.selectors.videoElement);
    if (videoElement) {
      videoElement.currentTime = time;
      return { success: true, action: 'seek', time };
    }

    // Try clicking on progress bar
    const progressBar = this.getElement(this.constructor.config.selectors.progressBar);
    const duration = this.getDuration();
    
    if (progressBar && duration > 0) {
      const percentage = time / duration;
      const rect = progressBar.getBoundingClientRect();
      const clickX = rect.left + (rect.width * percentage);
      const clickY = rect.top + (rect.height / 2);
      
      this.clickAtPosition(progressBar, clickX, clickY);
      return { success: true, action: 'seek', time, method: 'click' };
    }

    return { success: false, error: 'No seek method available' };
  }

  /**
   * Set up video element monitoring
   */
  setupVideoElementMonitoring() {
    const findVideoElement = () => {
      const videoElement = this.getElement(this.constructor.config.selectors.videoElement);
      if (videoElement && videoElement !== this.currentVideoElement) {
        this.log.debug(`Video element found`, { isYouTubeMusic: this.isYouTubeMusic });
        this.currentVideoElement = videoElement;
        
        // Add event listeners for better state tracking
        videoElement.addEventListener('play', () => {
          this.log.debug(`Video playing`, { isYouTubeMusic: this.isYouTubeMusic });
        });
        
        videoElement.addEventListener('pause', () => {
          this.log.debug(`Video paused`, { isYouTubeMusic: this.isYouTubeMusic });
        });
      }
    };

    // Initial search
    findVideoElement();
    
    // Re-search periodically (YouTube changes DOM frequently) with cleanup tracking
    this.videoElementInterval = setInterval(() => {
      try {
        findVideoElement();
      } catch (error) {
        if (error.message && error.message.includes('Extension context invalidated')) {
          clearInterval(this.videoElementInterval);
          this.videoElementInterval = null;
        }
      }
    }, 2000);
  }

  /**
   * Set up MediaSession monitoring
   */
  setupMediaSessionMonitoring() {
    if (!navigator.mediaSession) {
      this.log.warn(`MediaSession API not available`, { isYouTubeMusic: this.isYouTubeMusic });
      return;
    }

    this.log.debug(`Setting up MediaSession monitoring`, { isYouTubeMusic: this.isYouTubeMusic });
    
    let lastMetadata = null;
    
    const checkMediaSession = () => {
      if (navigator.mediaSession.metadata) {
        const metadata = navigator.mediaSession.metadata;
        const metadataKey = `${metadata.title}-${metadata.artist}`;
        
        if (metadataKey !== lastMetadata) {
          this.log.info(`New track detected`, { 
            isYouTubeMusic: this.isYouTubeMusic, 
            title: metadata.title,
            artist: metadata.artist 
          });
          lastMetadata = metadataKey;
        }
      }
    };

    // Poll MediaSession data with cleanup tracking
    this.mediaSessionInterval = setInterval(() => {
      try {
        checkMediaSession();
      } catch (error) {
        if (error.message && error.message.includes('Extension context invalidated')) {
          clearInterval(this.mediaSessionInterval);
          this.mediaSessionInterval = null;
        }
      }
    }, 1000);
  }

  /**
   * Set up DOM observer for dynamic content changes
   */
  setupDOMObserver() {
    const observer = new MutationObserver(() => {
      // Re-find video element when DOM changes significantly
      this.setupVideoElementMonitoring();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Clean up all intervals and listeners
   */
  cleanup() {
    this.log.debug('🧹 Cleaning up handler');
    
    // Clean up video element monitoring
    if (this.videoElementInterval) {
      clearInterval(this.videoElementInterval);
      this.videoElementInterval = null;
      this.log.debug('Stopped video element monitoring');
    }
    
    // Clean up MediaSession polling
    if (this.mediaSessionInterval) {
      clearInterval(this.mediaSessionInterval);
      this.mediaSessionInterval = null;
      this.log.debug('Stopped MediaSession polling');
    }
  }
}
