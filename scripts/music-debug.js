#!/usr/bin/env node

import { execSync } from 'child_process';
import os from 'os';

class MusicDetector {
  constructor() {
    this.platform = os.platform();
  }

  async detectMusic() {
    try {
      // 1. First try system-level MediaRemote (works with background, any app)
      const systemMusic = await this.detectSystemMedia();
      if (systemMusic) return systemMusic;
      
      // 2. Fallback to browser detection only when no system media found
      const browserMusic = await this.detectBrowserMedia();
      if (browserMusic) return browserMusic;
      
    } catch (error) {
      console.error('Detection error:', error.message);
    }
    
    return null;
  }

  async detectSystemMedia() {
    if (this.platform !== 'darwin') return null;
    
    try {
      // Use nowplaying-cli to get system-wide media info
      const result = execSync('nowplaying-cli get title artist album artworkData', {
        encoding: 'utf8',
        timeout: 5000
      }).trim();
      
      const lines = result.split('\n');
      const [title, artist, album, artworkData] = lines;
      
      // Check if we have meaningful data (not just nulls)
      if (title && title !== 'null' && title !== '(null)') {
        return {
          title: title,
          artist: artist && artist !== 'null' ? artist : null,
          album: album && album !== 'null' ? album : null,
          source: this.getSourceFromSystemMedia(title, artist),
          artwork: artworkData && artworkData !== 'null' ? this.convertArtworkData(artworkData) : null,
          playbackState: 'playing', // If detected via MediaRemote, it's playing
          supportsControl: true
        };
      }
      
    } catch (error) {
      // nowplaying-cli failed or returned no data
      return null;
    }
    
    return null;
  }

  async detectBrowserMedia() {
    if (this.platform !== 'darwin') return null;
    
    try {
      console.log('🔍 No system media found, checking browser...');
      
      // Execute JavaScript in the active Chrome tab (only as fallback)
      const jsCode = `
        (function() {
          try {
            if (!navigator.mediaSession || !navigator.mediaSession.metadata) {
              return null;
            }
            
            const metadata = navigator.mediaSession.metadata;
            const playbackState = navigator.mediaSession.playbackState || 'none';
            
            return JSON.stringify({
              url: window.location.href,
              title: metadata.title || null,
              artist: metadata.artist || null,
              album: metadata.album || null,
              playbackState: playbackState,
              artwork: metadata.artwork ? metadata.artwork.map(art => ({
                src: art.src,
                sizes: art.sizes,
                type: art.type
              })) : []
            });
          } catch (e) {
            return null;
          }
        })();
      `.replace(/\s+/g, ' ').trim();

      // Use AppleScript to execute JavaScript in active Chrome tab
      const appleScript = `tell application "Google Chrome" to tell front window to tell active tab to execute javascript "${jsCode}"`;
      
      const result = execSync(`osascript -e '${appleScript}'`, {
        encoding: 'utf8',
        timeout: 5000
      }).trim();

      if (result && result !== 'null' && result !== '""') {
        const mediaData = JSON.parse(result);
        
        console.log('✅ Browser media detected');
        
        return {
          title: mediaData.title,
          artist: mediaData.artist, 
          album: mediaData.album,
          source: this.getSourceFromUrl(mediaData.url),
          url: mediaData.url,
          playbackState: mediaData.playbackState,
          artwork: mediaData.artwork?.length > 0 ? mediaData.artwork[0].src : null,
          supportsControl: true
        };
      }
      
    } catch (error) {
      if (error.message.includes('Allow JavaScript from Apple Events')) {
        console.log('💡 Enable: Chrome → View → Developer → Allow JavaScript from Apple Events');
      }
      return null;
    }
    
    return null;
  }

  getSourceFromSystemMedia(title, artist) {
    // Try to guess source from system media metadata patterns
    if (title && artist) {
      // Common patterns for different sources
      if (title.includes(' - ') && artist === 'Chrome') return 'browser';
      if (artist === 'SoundCloud') return 'soundcloud';
      return 'system'; // Could be Music.app, Spotify.app, etc.
    }
    return 'unknown';
  }

  getSourceFromUrl(url) {
    if (!url) return 'browser';
    
    if (url.includes('soundcloud.com')) return 'soundcloud';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('music.youtube.com')) return 'youtube-music';
    if (url.includes('open.spotify.com')) return 'spotify-web';
    if (url.includes('music.apple.com')) return 'apple-music-web';
    
    return 'browser';
  }

  convertArtworkData(artworkData) {
    // nowplaying-cli returns base64 artwork data
    // For now, we could save it as a data URL or file
    // Simplified for demo - in production, you'd handle the binary data
    if (artworkData && artworkData.length > 100) {
      return `data:image/jpeg;base64,${artworkData}`;
    }
    return null;
  }
}

// Export for use as module
export default MusicDetector;

// Also run directly if called as script
if (import.meta.url === `file://${process.argv[1]}`) {
  const detector = new MusicDetector();
  
  detector.detectMusic().then(music => {
    if (music) {
      console.log('✅ Music detected:');
      console.log(`   Title: ${music.title}`);
      console.log(`   Artist: ${music.artist}`);
      console.log(`   Source: ${music.source}`);
      console.log(`   Artwork: ${music.artwork ? '✅' : '❌'}`);
      console.log(`   Control: ${music.supportsControl ? '✅' : '❌'}`);
    } else {
      console.log('❌ No music detected');
    }
  }).catch(error => {
    console.error('❌ Detection failed:', error.message);
  });
} 