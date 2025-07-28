/**
 * DOM-Based Media Controls
 * Fallback/alternative control system using HTML scraping and button clicking
 * Extracted from working content.js implementation
 */

class DOMMediaControls {
  constructor() {
    console.log('🔘 [DOM Controls] Initialized DOM-based media control fallback system');
  }

  /**
   * 🎮 Execute media control commands using DOM manipulation
   */
  async executeCommand(command) {
    try {
      console.log(`🎵 [DOM Controls] Attempting ${command} in tab: ${window.location.hostname}`);
      
      // First, try direct media element control (most reliable)
      const mediaResult = await this.tryMediaElementControl(command);
      if (mediaResult.success) {
        return mediaResult;
      }
      
      // If media element control didn't work, try site-specific button clicking
      const buttonResult = await this.trySiteSpecificControl(command);
      if (buttonResult.success) {
        return buttonResult;
      }
      
      // Final fallback: keyboard shortcuts
      const keyboardResult = this.tryKeyboardControl(command);
      if (keyboardResult.success) {
        return keyboardResult;
      }
      
      throw new Error(`No DOM control method worked for ${command}`);
      
    } catch (error) {
      console.error(`❌ [DOM Controls] Media control error:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 🎵 Try controlling media elements directly
   */
  async tryMediaElementControl(command) {
    const mediaElements = document.querySelectorAll('audio, video');
    
    for (const media of mediaElements) {
      if (media.duration > 0 || media.currentTime > 0) {
        try {
          switch (command) {
            case 'play':
              if (media.paused) {
                await media.play();
                return { 
                  success: true, 
                  method: 'media-element', 
                  element: media.tagName.toLowerCase() 
                };
              }
              break;
              
            case 'pause':
              if (!media.paused) {
                media.pause();
                return { 
                  success: true, 
                  method: 'media-element', 
                  element: media.tagName.toLowerCase() 
                };
              }
              break;
              
            case 'nexttrack':
            case 'previoustrack':
              // Media elements don't handle track changes - fall through to button clicking
              break;
          }
        } catch (error) {
          console.warn(`⚠️ [DOM Controls] Media element control failed:`, error);
        }
      }
    }
    
    return { success: false, method: 'media-element' };
  }

  /**
   * 🔘 Site-specific button control
   */
  async trySiteSpecificControl(command) {
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
          console.log(`🔘 [DOM Controls] Clicking button: ${selector}`);
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
        console.warn(`⚠️ [DOM Controls] Button click failed for ${selector}:`, error);
      }
    }
    
    return { success: false, method: 'button-click' };
  }

  /**
   * ⌨️ Keyboard shortcut fallback
   */
  tryKeyboardControl(command) {
    try {
      let keyCode = null;
      
      switch (command) {
        case 'play':
        case 'pause':
          keyCode = 32; // Spacebar
          break;
        case 'nexttrack':
          keyCode = 39; // Right arrow
          break;
        case 'previoustrack':
          keyCode = 37; // Left arrow
          break;
      }
      
      if (keyCode) {
        // Create and dispatch keyboard event
        const event = new KeyboardEvent('keydown', {
          keyCode: keyCode,
          which: keyCode,
          bubbles: true,
          cancelable: true
        });
        
        document.dispatchEvent(event);
        
        return {
          success: true,
          method: 'keyboard',
          keyCode: keyCode,
          command: command
        };
      }
      
    } catch (error) {
      console.warn(`⚠️ [DOM Controls] Keyboard control failed:`, error);
    }
    
    return { success: false, method: 'keyboard' };
  }

  /**
   * 🔍 Get current playback state by scraping DOM
   */
  getPlaybackState() {
    try {
      const hostname = window.location.hostname.replace('www.', '');
      
      // Site-specific playback state detection
      if (hostname.includes('soundcloud.com')) {
        return this.getSoundCloudState();
      } else if (hostname.includes('spotify.com')) {
        return this.getSpotifyState();
      } else if (hostname.includes('youtube.com')) {
        return this.getYouTubeState();
      }
      
      // Generic fallback
      return this.getGenericState();
      
    } catch (error) {
      console.warn(`⚠️ [DOM Controls] Failed to get playback state:`, error);
      return { playing: false, error: error.message };
    }
  }

  /**
   * 🎵 SoundCloud-specific state detection
   */
  getSoundCloudState() {
    const playButton = document.querySelector('.playControl');
    if (!playButton) return { playing: false, error: 'No play button found' };
    
    // Check if pause icon is showing (meaning it's playing)
    const isPaused = playButton.querySelector('[aria-label*="Pause"]') !== null;
    
    return {
      playing: isPaused, // If pause button is showing, it means it's playing
      site: 'soundcloud',
      method: 'dom-scraping'
    };
  }

  /**
   * 🟢 Spotify-specific state detection
   */
  getSpotifyState() {
    const playPauseButton = document.querySelector('[data-testid="control-button-playpause"]');
    if (!playPauseButton) return { playing: false, error: 'No play/pause button found' };
    
    const ariaLabel = playPauseButton.getAttribute('aria-label') || '';
    const isPlaying = ariaLabel.toLowerCase().includes('pause');
    
    return {
      playing: isPlaying,
      site: 'spotify',
      method: 'dom-scraping'
    };
  }

  /**
   * 🔴 YouTube-specific state detection
   */
  getYouTubeState() {
    const video = document.querySelector('video');
    if (video) {
      return {
        playing: !video.paused,
        site: 'youtube',
        method: 'video-element'
      };
    }
    
    return { playing: false, error: 'No video element found' };
  }

  /**
   * 🔍 Generic state detection fallback
   */
  getGenericState() {
    // Try to find any media elements
    const mediaElements = document.querySelectorAll('audio, video');
    for (const media of mediaElements) {
      if (media.duration > 0) {
        return {
          playing: !media.paused,
          site: 'generic',
          method: 'media-element'
        };
      }
    }
    
    return { playing: false, error: 'No media elements found' };
  }
}

// Export for use in other scripts
window.DOMMediaControls = DOMMediaControls; 