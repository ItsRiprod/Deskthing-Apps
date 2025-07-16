/**
 * DeskThing Media Bridge - Content Script
 * Properly accesses navigator.mediaSession and sends data to dashboard
 */

console.log('🎵 DeskThing Media Bridge loaded on:', window.location.hostname);

class MediaBridge {
  constructor() {
    this.dashboardUrl = 'http://localhost:8080';
    this.lastSentData = null;
    this.sendInterval = null;
    
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
    console.log('🚀 Starting MediaSession monitoring...');
    
    // Start periodic monitoring
    this.sendInterval = setInterval(() => {
      this.checkAndSendMediaData();
    }, 2000);
    
    // Send initial data
    setTimeout(() => this.checkAndSendMediaData(), 1000);
    
    // Listen for media events
    this.setupMediaEventListeners();
  }
  
  setupMediaEventListeners() {
    // Listen for media element events
    document.addEventListener('play', () => {
      console.log('🎵 Play event detected');
      setTimeout(() => this.checkAndSendMediaData(), 500);
    }, true);
    
    document.addEventListener('pause', () => {
      console.log('⏸️ Pause event detected');
      setTimeout(() => this.checkAndSendMediaData(), 500);
    }, true);
    
    // Listen for navigation changes (SPA sites)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        console.log('🔗 Navigation detected');
        setTimeout(() => this.checkAndSendMediaData(), 2000);
      }
    }).observe(document, { subtree: true, childList: true });
  }
  
  getMediaSessionData() {
    try {
      // Check MediaSession API first
      if (navigator.mediaSession && navigator.mediaSession.metadata) {
        const metadata = navigator.mediaSession.metadata;
        const playbackState = navigator.mediaSession.playbackState;
        
        // Get media element info for position/duration
        const mediaElements = document.querySelectorAll('audio, video');
        let duration = 0;
        let position = 0;
        let isPlaying = false;
        
        for (const media of mediaElements) {
          if (media.currentTime > 0) {
            duration = Math.floor(media.duration) || 0;
            position = Math.floor(media.currentTime) || 0;
            isPlaying = !media.paused;
            break;
          }
        }
        
        return {
          title: metadata.title || 'Unknown Title',
          artist: metadata.artist || 'Unknown Artist',
          album: metadata.album || '',
          artwork: metadata.artwork && metadata.artwork.length > 0 ? 
            metadata.artwork[0].src : null,
          source: `${window.location.hostname} (MediaSession)`,
          url: window.location.href,
          isPlaying: isPlaying,
          duration: duration,
          position: position,
          playbackState: playbackState || (isPlaying ? 'playing' : 'paused'),
          method: 'MediaSession',
          timestamp: Date.now()
        };
      }
      
      // Fallback to DOM scraping for sites without MediaSession
      return this.getDOMMediaData();
      
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
    // Check if playing
    const playButton = document.querySelector('.playControl');
    if (!playButton) return null;
    
    const isPlaying = playButton.title?.includes('Pause');
    
    // Extract title and artist from page title or DOM
    const title = document.title;
    if (title.includes(' by ')) {
      const [track, artist] = title.split(' by ');
      return {
        title: track.replace(/^Stream /, '').trim(),
        artist: artist.split(' | ')[0].trim(),
        album: '',
        artwork: document.querySelector('.image__full')?.src || null,
        isPlaying: isPlaying,
        duration: 0,
        position: 0
      };
    }
    
    return null;
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
        console.log('📤 Sending media data:', mediaData);
        await this.sendToDashboard(mediaData);
        this.lastSentData = mediaData;
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
        // Only update position if it changed significantly (>2 seconds)
        return Math.abs((newData[field] || 0) - (this.lastSentData[field] || 0)) > 2;
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
        console.log('✅ Data sent to dashboard successfully');
      } else {
        console.error('❌ Dashboard response error:', response.status);
      }
    } catch (error) {
      // Dashboard might not be running, fail silently
      console.log('⚠️ Dashboard not reachable (this is normal if dashboard is off)');
    }
  }
}

// Start the media bridge
new MediaBridge(); 