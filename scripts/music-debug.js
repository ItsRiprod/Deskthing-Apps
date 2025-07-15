#!/usr/bin/env node

import { execSync } from 'child_process';
import os from 'os';

class MusicDetector {
  constructor() {
    this.platform = os.platform();
  }

  async detectMusic() {
    const sources = [];
    
    try {
      // Check Chrome for SoundCloud/web players
      const chromeMusic = await this.detectChromeMusic();
      if (chromeMusic) sources.push(chromeMusic);
      
      // Check native apps if available
      const nativeMusic = await this.detectNativeMusic();
      if (nativeMusic) sources.push(nativeMusic);
      
    } catch (error) {
      console.error('Detection error:', error.message);
    }
    
    return sources.length > 0 ? sources[0] : null;
  }

  async detectChromeMusic() {
    if (this.platform !== 'darwin') return null;
    
    try {
      // Get Chrome tab titles and URLs
      const titleScript = `tell application "Google Chrome" to get title of every tab of every window`;
      const urlScript = `tell application "Google Chrome" to get URL of every tab of every window`;
      
      const titlesResult = execSync(`osascript -e '${titleScript}'`, { encoding: 'utf8' }).trim();
      const urlsResult = execSync(`osascript -e '${urlScript}'`, { encoding: 'utf8' }).trim();
      
      if (!titlesResult || !urlsResult) return null;
      
      // Parse comma-separated results
      const titles = titlesResult.split(', ');
      const urls = urlsResult.split(', ');
      
      // Find SoundCloud or music tabs
      for (let i = 0; i < titles.length && i < urls.length; i++) {
        const title = titles[i];
        const url = urls[i];
        
        // SoundCloud detection
        if (url.includes('soundcloud.com') && title.includes(' by ')) {
          return {
            title: title,
            url: url,
            source: 'soundcloud'
          };
        }
        
        // General music patterns
        if (title.includes(' by ') && (title.includes(' - ') || title.includes('Live from'))) {
          return {
            title: title,
            url: url,
            source: 'web-music'
          };
        }
        
        // YouTube Music
        if (url.includes('music.youtube.com') || title.includes(' - YouTube Music')) {
          return {
            title: title,
            url: url,
            source: 'youtube-music'
          };
        }
        
        // Spotify Web
        if (url.includes('open.spotify.com') || title.includes(' | Spotify')) {
          return {
            title: title,
            url: url,
            source: 'spotify-web'
          };
        }
      }
      
    } catch (error) {
      console.error('Chrome detection error:', error.message);
    }
    
    return null;
  }

  async detectNativeMusic() {
    // Only include if actually requested
    return null;
  }

  async displayResults(musicInfo) {
    if (!musicInfo) {
      console.log('🎵 No music currently playing detected');
      return;
    }

    console.log('🎵 Music Detection Results:');
    console.log('═══════════════════════════');
    console.log(`📍 Source: ${musicInfo.source}`);
    console.log(`🎼 Title: ${musicInfo.title}`);
    if (musicInfo.url) {
      console.log(`🔗 URL: ${musicInfo.url}`);
    }
    console.log('═══════════════════════════');
    
    // Check if source supports control
    const supportsControl = this.supportsControl(musicInfo.source);
    console.log(`🎛️  Controls: ${supportsControl ? 'Available via Media Session API' : 'Not available'}`);
  }

  supportsControl(source) {
    const supportedSources = [
      'soundcloud', 'youtube-music', 'spotify-web',  // Web players via Media Session API
      'Music', 'Spotify'  // Native apps via AppleScript
    ];
    
    return supportedSources.includes(source);
  }
}

// CLI interface
async function main() {
  const detector = new MusicDetector();
  const musicInfo = await detector.detectMusic();
  await detector.displayResults(musicInfo);
  
  if (musicInfo && detector.supportsControl(musicInfo.source)) {
    console.log('\n💡 Try: npm run player:control -- play-pause');
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(console.error);
}

export default MusicDetector; 