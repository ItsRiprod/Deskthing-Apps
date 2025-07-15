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
      
      // Use our enhanced AppleScript file for reliable detection
      const result = execSync('osascript ./audio/debug-music.applescript', {
        encoding: 'utf8',
        timeout: 10000,
        cwd: '/Users/joe/Desktop/Repos/Personal/DeskThing-Apps'
      }).trim();

      if (result && result !== 'null' && result !== '""' && !result.includes('No music currently playing')) {
        // Parse the AppleScript result (e.g., "SoundCloud: Track by Artist")
        const sourceMatch = result.match(/^(\w+):\s*(.+?)\s*by\s*(.+)$/);
        if (sourceMatch) {
          const [, source, title, artist] = sourceMatch;
          
          console.log('✅ Browser media detected:', { title, artist, source });
          
          // Get enhanced info for SoundCloud
          if (source === 'SoundCloud') {
            try {
              const enhancedInfo = await this.getSoundCloudEnhancedInfo();
              return {
                title: title.trim(),
                artist: artist.trim(),
                album: null,
                source: source,
                url: enhancedInfo.url || null,
                playbackState: 'playing',
                artwork: enhancedInfo.artwork || null,
                supportsControl: true,
                isPlaying: true,
                duration: enhancedInfo.duration || 0,
                position: enhancedInfo.position || 0
              };
            } catch (error) {
              console.log('⚠️ Could not get enhanced SoundCloud info:', error.message);
            }
          }
          
          return {
            title: title.trim(),
            artist: artist.trim(),
            album: null,
            source: source,
            url: null,
            playbackState: 'playing',
            artwork: null,
            supportsControl: true,
            isPlaying: true,
            duration: 0,
            position: 0
          };
        }
        
        // Handle single title results (like YouTube)
        const ytMatch = result.match(/^YouTube:\s*(.+)$/);
        if (ytMatch) {
          const [, title] = ytMatch;
          
          console.log('✅ YouTube video detected:', title);
          
          // Get enhanced info for YouTube
          try {
            const youtubeInfo = await this.getYouTubeEnhancedInfo();
            return {
              title: title.trim(),
              artist: youtubeInfo.channelName || 'YouTube',
              album: null,
              source: 'YouTube',
              url: youtubeInfo.url || null,
              playbackState: 'playing',
              artwork: youtubeInfo.thumbnail || null,
              supportsControl: true,
              isPlaying: true,
              duration: youtubeInfo.duration || 0,
              position: youtubeInfo.position || 0
            };
          } catch (error) {
            console.log('⚠️ Could not get enhanced YouTube info:', error.message);
          }
          
          return {
            title: title.trim(),
            artist: 'YouTube',
            album: null,
            source: 'YouTube',
            url: null,
            playbackState: 'playing',
            artwork: null,
            supportsControl: true,
            isPlaying: true,
            duration: 0,
            position: 0
          };
        }
      }
      
    } catch (error) {
      if (error.message.includes('Allow JavaScript from Apple Events')) {
        console.log('💡 Enable: Chrome → View → Developer → Allow JavaScript from Apple Events');
      }
      return null;
    }
    
    return null;
  }

  async getSoundCloudEnhancedInfo() {
    try {
      // Get enhanced SoundCloud info using JavaScript injection
      const enhancedScript = `
        tell application "Google Chrome"
          try
            repeat with w from 1 to count of windows
              repeat with t from 1 to count of tabs of window w
                set tabURL to URL of tab t of window w
                
                if tabURL contains "soundcloud.com" then
                  try
                    -- Get track info, duration, position, and artwork
                    set trackInfo to (execute tab t of window w javascript "
                      try {
                        // Get progress info
                        const progressBar = document.querySelector('.playbackTimeline__progressWrapper');
                        const currentTime = document.querySelector('.playbackTimeline__timePassed');
                        const totalTime = document.querySelector('.playbackTimeline__duration');
                        
                        // Get artwork
                        const artworkImg = document.querySelector('.image__full, .sc-artwork, [class*=\\"image\\"][class*=\\"artwork\\"], .sound__coverArt img');
                        const artworkUrl = artworkImg ? (artworkImg.src || artworkImg.getAttribute('src')) : null;
                        
                        // Convert time strings to seconds
                        const parseTime = (timeStr) => {
                          if (!timeStr) return 0;
                          const parts = timeStr.trim().split(':');
                          if (parts.length === 2) {
                            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
                          }
                          return 0;
                        };
                        
                        const position = parseTime(currentTime ? currentTime.textContent : '0:00');
                        const duration = parseTime(totalTime ? totalTime.textContent : '0:00');
                        
                        return JSON.stringify({
                          duration: duration,
                          position: position,
                          artwork: artworkUrl,
                          url: window.location.href
                        });
                      } catch (e) {
                        return JSON.stringify({ duration: 0, position: 0, artwork: null, url: window.location.href });
                      }
                    ")
                    
                    return trackInfo
                  on error
                    return "{\\"duration\\": 0, \\"position\\": 0, \\"artwork\\": null}"
                  end try
                end if
              end repeat
            end repeat
          on error
            return "{\\"duration\\": 0, \\"position\\": 0, \\"artwork\\": null}"
          end try
        end tell
        
        return "{\\"duration\\": 0, \\"position\\": 0, \\"artwork\\": null}"
      `;
      
      const result = execSync(`osascript -e '${enhancedScript}'`, {
        encoding: 'utf8',
        timeout: 10000
      }).trim();
      
      if (result && result !== 'null') {
        const enhancedData = JSON.parse(result);
        console.log('✅ Enhanced SoundCloud info:', enhancedData);
        return enhancedData;
      }
      
    } catch (error) {
      console.log('⚠️ Enhanced SoundCloud info failed:', error.message);
    }
    
    return { duration: 0, position: 0, artwork: null, url: null };
  }

  async getYouTubeEnhancedInfo() {
    try {
      // Get enhanced YouTube info using JavaScript injection
      const enhancedScript = `
        tell application "Google Chrome"
          try
            repeat with w from 1 to count of windows
              repeat with t from 1 to count of tabs of window w
                set tabURL to URL of tab t of window w
                
                if tabURL contains "youtube.com/watch" then
                  try
                    -- Get YouTube video info
                    set videoInfo to (execute tab t of window w javascript "
                      try {
                        const video = document.querySelector('video');
                        const channelName = document.querySelector('#channel-name a, .ytd-channel-name a, .ytd-video-owner-renderer a');
                        const thumbnail = document.querySelector('meta[property=\\"og:image\\"]');
                        
                        return JSON.stringify({
                          duration: video ? Math.floor(video.duration) : 0,
                          position: video ? Math.floor(video.currentTime) : 0,
                          channelName: channelName ? channelName.textContent.trim() : 'YouTube',
                          thumbnail: thumbnail ? thumbnail.getAttribute('content') : null,
                          url: window.location.href
                        });
                      } catch (e) {
                        return JSON.stringify({ duration: 0, position: 0, channelName: 'YouTube', thumbnail: null, url: window.location.href });
                      }
                    ")
                    
                    return videoInfo
                  on error
                    return "{\\"duration\\": 0, \\"position\\": 0, \\"channelName\\": \\"YouTube\\", \\"thumbnail\\": null}"
                  end try
                end if
              end repeat
            end repeat
          on error
            return "{\\"duration\\": 0, \\"position\\": 0, \\"channelName\\": \\"YouTube\\", \\"thumbnail\\": null}"
          end try
        end tell
        
        return "{\\"duration\\": 0, \\"position\\": 0, \\"channelName\\": \\"YouTube\\", \\"thumbnail\\": null}"
      `;
      
      const result = execSync(`osascript -e '${enhancedScript}'`, {
        encoding: 'utf8',
        timeout: 10000
      }).trim();
      
      if (result && result !== 'null') {
        const enhancedData = JSON.parse(result);
        console.log('✅ Enhanced YouTube info:', enhancedData);
        return enhancedData;
      }
      
    } catch (error) {
      console.log('⚠️ Enhanced YouTube info failed:', error.message);
    }
    
    return { duration: 0, position: 0, channelName: 'YouTube', thumbnail: null, url: null };
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