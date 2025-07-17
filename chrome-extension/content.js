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

class MediaBridge {
  constructor() {
    this.version = EXTENSION_VERSION;
    this.dashboardUrl = 'http://localhost:8080';
    this.lastSentData = null;
    this.sendInterval = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    
    // 🚀 NEW: Cross-window command polling
    this.commandPollInterval = null;
    this.isPollingEnabled = true;
    
    this.init();
  }
  
  init() {
    // Wait for page to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }
  }
  
  start() {
    console.log(`🚀 Starting enhanced MediaSession monitoring v${this.version}...`);
    
    // Start periodic monitoring with shorter interval for better responsiveness
    this.sendInterval = setInterval(() => {
      this.checkAndSendMediaData();
    }, 1000);
    
    // 🚀 NEW: Start command polling for cross-window control
    this.startCommandPolling();
    
    // Send initial data after a delay to ensure page is loaded
    setTimeout(() => this.checkAndSendMediaData(), 2000);
    
    // Listen for media events
    this.setupMediaEventListeners();
  }
  
  setupMediaEventListeners() {
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
    
    // Listen for MediaSession changes
    if (navigator.mediaSession) {
      // Periodically check for MediaSession updates
      setInterval(() => {
        if (navigator.mediaSession.metadata) {
          this.checkAndSendMediaData();
        }
      }, 2000);
    }
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
      
      // Accept any audio element with timing data
      if (audio.duration > 0 || audio.currentTime > 0 || audio.readyState >= 2) {
        duration = Math.floor(audio.duration) || 0;
        position = Math.floor(audio.currentTime) || 0;
        isPlaying = !audio.paused;
        console.log('🎵 SoundCloud selected audio element:', { duration, position, isPlaying });
        break;
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
   * 🚀 BREAKTHROUGH FEATURE: Command polling for cross-window control
   */
  startCommandPolling() {
    if (!this.isPollingEnabled) return;
    
    console.log(`🔄 [MediaBridge] Starting command polling for cross-window control v${this.version}`);
    
    // Poll every 2 seconds for pending commands
    this.commandPollInterval = setInterval(() => {
      this.pollForCommands();
    }, 2000);
    
    // Initial poll after a short delay
    setTimeout(() => this.pollForCommands(), 3000);
  }
  
  /**
   * 📥 Poll dashboard for pending extension commands
   */
  async pollForCommands() {
    if (!this.isPollingEnabled) return;
    
    try {
      const response = await fetch(`${this.dashboardUrl}/api/extension/poll`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.commands && data.commands.length > 0) {
          console.log(`📥 [MediaBridge] Received ${data.commands.length} pending command(s):`, data.commands);
          
          // Process each command via background script coordination
          for (const command of data.commands) {
            await this.executeCommandViaBackground(command);
          }
        }
      }
      
    } catch (error) {
      // Silently fail - dashboard might not be available, which is OK
      // Only log if we have repeated failures
      if (this.retryCount % 10 === 0) {
        console.log(`⚠️ [MediaBridge] Command polling: Dashboard not reachable (attempt ${this.retryCount})`);
      }
      this.retryCount++;
    }
  }
  
  /**
   * 🎮 Execute command via background script (cross-window coordination)
   */
  async executeCommandViaBackground(commandData) {
    try {
      console.log(`🎮 [MediaBridge] Executing command via background script:`, commandData);
      
      // Send to background script for cross-window coordination
      const response = await chrome.runtime.sendMessage({
        type: 'mediaControl',
        command: commandData.command,
        commandId: commandData.id,
        source: 'dashboard-poll'
      });
      
      console.log(`📬 [MediaBridge] Background script response:`, response);
      
      // Report result back to dashboard
      await this.reportCommandResult(commandData.id, response);
      
    } catch (error) {
      console.error(`❌ [MediaBridge] Command execution error:`, error);
      
      // Report failure back to dashboard
      await this.reportCommandResult(commandData.id, {
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * 📬 Report command execution result back to dashboard
   */
  async reportCommandResult(commandId, result) {
    try {
      const response = await fetch(`${this.dashboardUrl}/api/extension/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commandId: commandId,
          success: result.success,
          result: result,
          tabUrl: window.location.href,
          timestamp: Date.now()
        })
      });
      
      if (response.ok) {
        console.log(`✅ [MediaBridge] Command result reported: ${commandId}`);
      }
      
    } catch (error) {
      console.error(`❌ [MediaBridge] Failed to report command result:`, error);
    }
  }
  
  /**
   * 🛑 Stop command polling (cleanup)
   */
  stopCommandPolling() {
    if (this.commandPollInterval) {
      clearInterval(this.commandPollInterval);
      this.commandPollInterval = null;
      console.log(`🛑 [MediaBridge] Command polling stopped`);
    }
  }
}

// Start the enhanced media bridge
const mediaBridge = new MediaBridge();

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