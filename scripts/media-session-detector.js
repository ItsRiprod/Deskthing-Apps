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
    
    // First try to get info from any media elements
    for (const media of audioElements) {
      if (media.duration > 0) {
        duration = media.duration || 0;
        currentTime = media.currentTime || 0;
        isPlaying = !media.paused;
        break;
      }
    }
    
    // If no media elements or playbackState indicates playing, use playbackState
    if (!isPlaying && playbackState === 'playing') {
      isPlaying = true;
    }

    // CRITICAL: Update MediaSession with position state (this is how browsers get duration/position!)
    if (navigator.mediaSession && 'setPositionState' in navigator.mediaSession && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1.0,
          position: currentTime
        });
        
        // Set up MediaSession action handlers for seeking
        if (!navigator.mediaSession._deskthingHandlersSet) {
          navigator.mediaSession.setActionHandler('seekto', (details) => {
            const media = document.querySelector('audio, video');
            if (media && details.seekTime !== undefined) {
              media.currentTime = details.seekTime;
            }
          });
          
          navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            const media = document.querySelector('audio, video');
            if (media) {
              const skipTime = details.seekOffset || 10;
              media.currentTime = Math.max(media.currentTime - skipTime, 0);
            }
          });
          
          navigator.mediaSession.setActionHandler('seekforward', (details) => {
            const media = document.querySelector('audio, video');
            if (media) {
              const skipTime = details.seekOffset || 10;
              media.currentTime = Math.min(media.currentTime + skipTime, media.duration);
            }
          });
          
          // Mark handlers as set to avoid duplicate registration
          navigator.mediaSession._deskthingHandlersSet = true;
        }
      } catch (e) {
        console.log('MediaSession setPositionState failed:', e);
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
      supportsControl: true,
      // Debug info
      debug: {
        audioElementsFound: audioElements.length,
        audioElementsWithDuration: Array.from(audioElements).filter(a => a.duration > 0).length,
        audioElementsWithCurrentTime: Array.from(audioElements).filter(a => a.currentTime > 0).length,
        rawDuration: duration,
        rawCurrentTime: currentTime,
        mediaSessionPlaybackState: playbackState,
        audioElementDetails: Array.from(audioElements).map(a => ({
          duration: a.duration,
          currentTime: a.currentTime,
          paused: a.paused,
          ended: a.ended,
          readyState: a.readyState,
          networkState: a.networkState,
          src: a.src ? a.src.substring(0, 100) + '...' : 'no src'
        }))
      }
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
      
      console.log(`🔍 [MediaSession] Raw control result for ${action}:`, result);
      console.log(`🔍 [MediaSession] Result type:`, typeof result);
      console.log(`🔍 [MediaSession] Result success:`, result?.success);
      
      if (result && result.success) {
        console.log(`✅ [MediaSession] Control sent: ${action} via ${result.action || result.method || 'unknown'}`);
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

  /**
   * Seek to specific position in seconds
   */
  async seekToPosition(positionSeconds) {
    if (this.platform !== 'darwin') return false;

    try {
      console.log(`🔍 [MediaSession] Seeking to: ${positionSeconds}s`);
      
      const jsCode = `
(function() {
  try {
    // Use direct media element seeking (most reliable)
    const media = document.querySelector('audio, video');
    if (media && media.duration && ${positionSeconds} <= media.duration) {
      media.currentTime = ${positionSeconds};
      
      // Update MediaSession position state to reflect the change
      if (navigator.mediaSession && 'setPositionState' in navigator.mediaSession) {
        navigator.mediaSession.setPositionState({
          duration: media.duration,
          playbackRate: media.playbackRate || 1.0,
          position: ${positionSeconds}
        });
      }
      
      return JSON.stringify({ success: true, method: 'media-element', position: ${positionSeconds} });
    }
    
    // Fallback: Site-specific seeking for SoundCloud
    const progressBar = document.querySelector('.playbackTimeline__progressWrapper');
    if (progressBar && media) {
      const rect = progressBar.getBoundingClientRect();
      const percentage = ${positionSeconds} / (media.duration || 100);
      const clickX = rect.left + (rect.width * percentage);
      const clickY = rect.top + rect.height / 2;
      
      progressBar.dispatchEvent(new MouseEvent('click', {
        clientX: clickX,
        clientY: clickY,
        bubbles: true
      }));
      
      return JSON.stringify({ success: true, method: 'soundcloud-progressBar', position: ${positionSeconds} });
    }
    
    return JSON.stringify({ success: false, error: 'No seek method available - no media element found' });
    
  } catch (err) {
    return JSON.stringify({ error: err.message });
  }
})()`;

      console.log(`🔍 [MediaSession] Executing seek JavaScript for ${positionSeconds}s...`);
      const result = await this.executeJSInTabs(jsCode, 'seek');
      
      console.log(`🔍 [MediaSession] Raw seek result:`, result);
      console.log(`🔍 [MediaSession] Result type:`, typeof result);
      
      if (result && result !== 'null' && typeof result === 'string' && !result.includes('error')) {
        try {
          const data = JSON.parse(result);
          console.log(`✅ [MediaSession] Parsed seek result:`, data);
          return data.success;
        } catch (parseError) {
          console.log(`❌ [MediaSession] Failed to parse seek result:`, parseError.message);
          return false;
        }
      }
      
      console.log(`❌ [MediaSession] Seek failed - invalid result:`, result);
      return false;
      
    } catch (error) {
      console.error('❌ [MediaSession] Seek error:', error.message);
      return false;
    }
  }
}

export default MediaSessionDetector;