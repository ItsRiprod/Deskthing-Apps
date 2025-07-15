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
            source: 'soundcloud',
            controls: this.getChromeControls()
          };
        }
        
        // General music patterns
        if (title.includes(' by ') && (title.includes(' - ') || title.includes('Live from'))) {
          return {
            title: title,
            url: url,
            source: 'web-music',
            controls: this.getChromeControls()
          };
        }
        
        // YouTube Music
        if (url.includes('music.youtube.com') || title.includes(' - YouTube Music')) {
          return {
            title: title,
            url: url,
            source: 'youtube-music',
            controls: this.getChromeControls()
          };
        }
        
        // Spotify Web
        if (url.includes('open.spotify.com') || title.includes(' | Spotify')) {
          return {
            title: title,
            url: url,
            source: 'spotify-web',
            controls: this.getChromeControls()
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

  getChromeControls() {
    return {
      playPause: () => this.executeJavaScript('togglePlayPause()'),
      next: () => this.executeJavaScript('nextTrack()'),
      previous: () => this.executeJavaScript('previousTrack()'),
      getPosition: () => this.executeJavaScript('getCurrentPosition()'),
      setPosition: (pos) => this.executeJavaScript(`setPosition(${pos})`)
    };
  }

  executeJavaScript(jsCode) {
    if (this.platform !== 'darwin') {
      throw new Error('Chrome control only supported on macOS');
    }

    try {
      // Define the JavaScript functions for SoundCloud control
      const soundCloudJS = `
        function togglePlayPause() {
          const playBtn = document.querySelector('button[title*="Play"], button[title*="Pause"]');
          if (playBtn) {
            playBtn.click();
            return {success: true, action: 'toggle'};
          }
          return {success: false, error: 'No play/pause button found'};
        }
        
        function nextTrack() {
          const nextBtn = document.querySelector('button[title*="Next"]');
          if (nextBtn) {
            nextBtn.click();
            return {success: true, action: 'next'};
          }
          return {success: false, error: 'No next button found'};
        }
        
        function previousTrack() {
          const prevBtn = document.querySelector('button[title*="Previous"]');
          if (prevBtn) {
            prevBtn.click();
            return {success: true, action: 'previous'};
          }
          return {success: false, error: 'No previous button found'};
        }
        
        function getCurrentPosition() {
          const progressBar = document.querySelector('.playbackTimeline__progressWrapper');
          const currentTime = document.querySelector('.playbackTimeline__timePassed');
          const totalTime = document.querySelector('.playbackTimeline__duration');
          
          return {
            current: currentTime ? currentTime.textContent : '0:00',
            total: totalTime ? totalTime.textContent : '0:00',
            progress: progressBar ? progressBar.style.width : '0%'
          };
        }
        
        function setPosition(percentage) {
          const progressBar = document.querySelector('.playbackTimeline__progressWrapper');
          if (progressBar) {
            const rect = progressBar.getBoundingClientRect();
            const x = rect.left + (rect.width * percentage / 100);
            const y = rect.top + rect.height / 2;
            
            const event = new MouseEvent('click', {
              clientX: x,
              clientY: y,
              bubbles: true
            });
            progressBar.dispatchEvent(event);
            return {success: true, position: percentage};
          }
          return {success: false, error: 'Progress bar not found'};
        }
        
        ${jsCode}
      `;

      const script = `tell application "Google Chrome" to execute front window's active tab javascript "${soundCloudJS.replace(/"/g, '\\"')}"`;
      const result = execSync(`osascript -e '${script}'`, { encoding: 'utf8' }).trim();
      
      try {
        return JSON.parse(result);
      } catch {
        return { success: true, raw: result };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
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
    
    if (musicInfo.controls) {
      console.log('🎛️  Available controls: play/pause, next, previous, seek');
    }
  }
}

// CLI interface
async function main() {
  const detector = new MusicDetector();
  const musicInfo = await detector.detectMusic();
  await detector.displayResults(musicInfo);
  
  if (musicInfo && musicInfo.controls) {
    console.log('\n💡 Try: npm run player:control -- play-pause');
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch(console.error);
}

export default MusicDetector; 