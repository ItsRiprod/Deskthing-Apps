/**
 * Enhanced Media Session Detector using navigator.mediaSession API
 * Fixed version with proper quote escaping for AppleScript
 */

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { platform } from 'os';
import path from 'path';

class MediaSessionDetector {
  constructor() {
    this.platform = platform();
  }

  /**
   * Get comprehensive media info using navigator.mediaSession
   */
  async detectMediaSession() {
    if (this.platform !== 'darwin') return null;

    try {
      console.log('🎵 [MediaSession] Checking for active media sessions...');
      
      // Create a temporary JS file to avoid quote escaping issues
      const jsCode = `
(function() {
  try {
    // Check if MediaSession API is available
    if (!navigator.mediaSession || !navigator.mediaSession.metadata) {
      return JSON.stringify({ error: 'No media session active' });
    }

    const metadata = navigator.mediaSession.metadata;
    const playbackState = navigator.mediaSession.playbackState || 'none';
    
    // Get additional info from media elements
    const audioElements = document.querySelectorAll('audio, video');
    let duration = 0;
    let currentTime = 0;
    let isPlaying = false;
    
    for (const media of audioElements) {
      if (!media.paused && media.currentTime > 0) {
        duration = media.duration || 0;
        currentTime = media.currentTime || 0;
        isPlaying = !media.paused;
        break;
      }
    }

    return JSON.stringify({
      title: metadata.title || 'Unknown Title',
      artist: metadata.artist || 'Unknown Artist', 
      album: metadata.album || '',
      artwork: metadata.artwork && metadata.artwork.length > 0 ? 
        metadata.artwork[0].src : null,
      playbackState: playbackState,
      isPlaying: isPlaying,
      duration: isNaN(duration) ? 0 : Math.floor(duration),
      position: isNaN(currentTime) ? 0 : Math.floor(currentTime),
      source: window.location.hostname,
      url: window.location.href,
      supportsControl: true
    });
  } catch (err) {
    return JSON.stringify({ error: err.message });
  }
})()`;

      const result = await this.executeJSInTabs(jsCode, 'mediaSession');
      
      if (result && !result.error) {
        console.log('✅ [MediaSession] Media detected:', {
          title: result.title,
          artist: result.artist,
          source: result.source,
          isPlaying: result.isPlaying
        });
        return result;
      } else {
        console.log('❌ [MediaSession] No active media session found');
        return null;
      }
      
    } catch (error) {
      console.error('❌ [MediaSession] Detection error:', error.message);
      return null;
    }
  }

  /**
   * Send control commands using MediaSession API
   */
  async sendMediaControl(action) {
    if (this.platform !== 'darwin') return false;

    try {
      console.log(`🎮 [MediaSession] Sending control: ${action}`);
      
      const jsCode = `
(function() {
  try {
    // Direct media element control (more reliable than MediaSession handlers)
    const media = document.querySelector('audio, video');
    
    switch ('${action}') {
      case 'play':
        // Try direct media element first
        if (media && media.paused) {
          media.play();
          return JSON.stringify({ success: true, action: 'play' });
        }
        
        // Try site-specific play button selectors
        const playSelectors = [
          '.playControl',                       // SoundCloud
          '[data-testid="control-button-playpause"]', // Spotify
          '.ytp-play-button',                   // YouTube
          '[aria-label*="play" i]',             // Generic
          '[title*="play" i]'                   // Generic
        ];
        
        for (const selector of playSelectors) {
          const button = document.querySelector(selector);
          if (button && button.offsetParent !== null) {
            button.click();
            return JSON.stringify({ success: true, action: 'play-button', selector });
          }
        }
        
        // Fallback to space key
        document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space' }));
        return JSON.stringify({ success: true, action: 'play-keyboard' });
        
      case 'pause':
        // Try direct media element first
        if (media && !media.paused) {
          media.pause();
          return JSON.stringify({ success: true, action: 'pause' });
        }
        
        // Try site-specific pause button selectors
        const pauseSelectors = [
          '.playControl',                       // SoundCloud
          '[data-testid="control-button-playpause"]', // Spotify
          '.ytp-pause-button',                  // YouTube
          '[aria-label*="pause" i]',            // Generic
          '[title*="pause" i]'                  // Generic
        ];
        
        for (const selector of pauseSelectors) {
          const button = document.querySelector(selector);
          if (button && button.offsetParent !== null) {
            button.click();
            return JSON.stringify({ success: true, action: 'pause-button', selector });
          }
        }
        
        // Fallback to space key
        document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space' }));
        return JSON.stringify({ success: true, action: 'pause-keyboard' });
        break;
        
      case 'previoustrack':
        // Site-specific previous button selectors
        const prevSelectors = [
          '[data-testid="previous-button"]',    // Spotify
          '.skipControl__previous',             // SoundCloud
          '.ytp-prev-button',                   // YouTube
          '[aria-label*="previous" i]',         // Generic
          '[title*="previous" i]'               // Generic
        ];
        
        for (const selector of prevSelectors) {
          const btn = document.querySelector(selector);
          if (btn) {
            btn.click();
            return JSON.stringify({ success: true, action: 'previoustrack', method: selector });
          }
        }
        return JSON.stringify({ error: 'No previous button found' });
        
      case 'nexttrack':
        // Site-specific next button selectors
        const nextSelectors = [
          '[data-testid="next-button"]',        // Spotify
          '.skipControl__next',                 // SoundCloud  
          '.ytp-next-button',                   // YouTube
          '[aria-label*="next" i]',             // Generic
          '[title*="next" i]'                   // Generic
        ];
        
        for (const selector of nextSelectors) {
          const btn = document.querySelector(selector);
          if (btn) {
            btn.click();
            return JSON.stringify({ success: true, action: 'nexttrack', method: selector });
          }
        }
        return JSON.stringify({ error: 'No next button found' });
        
      default:
        return JSON.stringify({ error: 'Unknown action: ' + '${action}' });
    }
  } catch (err) {
    return JSON.stringify({ error: err.message });
  }
})()`;

      const result = await this.executeJSInTabs(jsCode, 'control');
      
      if (result && result.success) {
        console.log(`✅ [MediaSession] Control sent: ${action}`);
        return true;
      } else {
        console.log(`❌ [MediaSession] Control failed: ${result?.error || 'Unknown error'}`);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ [MediaSession] Control error: ${error.message}`);
      return false;
    }
  }

  /**
   * Execute JavaScript in Chrome tabs using temp AppleScript file (ZERO quote escaping)
   */
  async executeJSInTabs(jsCode, operation) {
    try {
      // Write JS to temp file
      const tempJSFile = path.join('/tmp', `deskthing-${operation}-${Date.now()}.js`);
      writeFileSync(tempJSFile, jsCode);

      // Write AppleScript to temp file to completely avoid shell quoting
      const appleScript = `tell application "Google Chrome"
  repeat with w from 1 to count of windows
    repeat with t from 1 to count of tabs of window w
      try
        set tabURL to URL of tab t of window w
        
        -- Only check media-capable sites
        if tabURL contains "youtube.com" or tabURL contains "soundcloud.com" or tabURL contains "spotify.com" or tabURL contains "music.apple.com" or tabURL contains "pandora.com" or tabURL contains "twitch.tv" then
          
          set jsContent to (do shell script "cat '${tempJSFile}'")
          set result to (execute tab t of window w javascript jsContent)
          
          -- Check if we got valid JSON back
          if result is not "null" and result is not "" and result does not contain "error" then
            return result
          end if
        end if
      on error
        -- Skip tabs that can't execute JavaScript
      end try
    end repeat
  end repeat
end tell

return "{\\"error\\": \\"No media tabs found\\"}"`;

      const tempAppleScriptFile = path.join('/tmp', `deskthing-${operation}-${Date.now()}.scpt`);
      writeFileSync(tempAppleScriptFile, appleScript);

      // Execute AppleScript file directly - NO shell quoting at all!
      const result = execSync(`osascript "${tempAppleScriptFile}"`, {
        encoding: 'utf8',
        timeout: 5000
      }).trim();

      // Clean up temp files
      try {
        unlinkSync(tempJSFile);
        unlinkSync(tempAppleScriptFile);
      } catch {}

      try {
        return JSON.parse(result);
      } catch {
        return { error: 'Invalid JSON response' };
      }
      
    } catch (error) {
      console.error('❌ [MediaSession] AppleScript execution failed:', error.message);
      return { error: error.message };
    }
  }

  /**
   * Get enhanced metadata with artwork using temp file approach
   */
  async getEnhancedMetadata() {
    try {
      const jsCode = `
(function() {
  try {
    const metadata = navigator.mediaSession?.metadata;
    if (!metadata) return JSON.stringify({ error: 'No metadata' });

    // Enhanced artwork detection
    let artwork = null;
    if (metadata.artwork && metadata.artwork.length > 0) {
      artwork = metadata.artwork[0].src;
    } else {
      // Fallback artwork detection
      const artworkSelectors = [
        'img[data-testid="cover-art"]',          // Spotify
        '.image__full',                          // SoundCloud
        '.ytp-cued-thumbnail-overlay-image',     // YouTube
        '.playback-bar__cover img',              // General
        '[class*="artwork"] img',                // Generic artwork
        '[class*="cover"] img',                  // Generic cover
        '[class*="album"] img'                   // Generic album
      ];
      
      for (const selector of artworkSelectors) {
        const img = document.querySelector(selector);
        if (img && img.src && !img.src.includes('data:')) {
          artwork = img.src;
          break;
        }
      }
    }

    return JSON.stringify({
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      artwork: artwork,
      source: window.location.hostname,
      url: window.location.href
    });
  } catch (err) {
    return JSON.stringify({ error: err.message });
  }
})()`;

      return await this.executeJSInTabs(jsCode, 'metadata');
    } catch (error) {
      console.error('❌ [MediaSession] Enhanced metadata error:', error.message);
      return null;
    }
  }
}

export default MediaSessionDetector; 