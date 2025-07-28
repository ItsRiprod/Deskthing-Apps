# Site Handler Template

**Template for Adding New Music Site Support to CACP**

---

## 📋 **Template Code**

Copy this template and customize for your target music site:

```javascript
/**
 * CACP Site Handler for [SITE_NAME]
 * 
 * Author: [YOUR_NAME]
 * Date: [DATE]
 * Site URL: [SITE_URL]
 * 
 * Implementation Notes:
 * - [Note any special considerations]
 * - [Document any limitations]
 * - [Mention tested browser versions]
 */

import { SiteHandler } from './base-handler.js';

export class [SITE_NAME]Handler extends SiteHandler {
  
  // Required: Site identification and basic selectors
  static config = {
    name: '[Site Display Name]',
    urlPatterns: [
      '[primary-domain.com]',
      '[alternate-domain.com]' // if applicable
    ],
    selectors: {
      // Required: Basic controls
      playButton: '[CSS_SELECTOR_FOR_PLAY_BUTTON]',
      pauseButton: '[CSS_SELECTOR_FOR_PAUSE_BUTTON]', // or same as play if toggle
      nextButton: '[CSS_SELECTOR_FOR_NEXT_BUTTON]',
      prevButton: '[CSS_SELECTOR_FOR_PREV_BUTTON]',
      
      // Required: Metadata extraction
      title: '[CSS_SELECTOR_FOR_TRACK_TITLE]',
      artist: '[CSS_SELECTOR_FOR_ARTIST_NAME]',
      
      // Optional: Enhanced metadata
      album: '[CSS_SELECTOR_FOR_ALBUM_NAME]',
      artwork: '[CSS_SELECTOR_FOR_ALBUM_ART_IMG]',
      
      // Optional: Progress tracking
      currentTime: '[CSS_SELECTOR_FOR_CURRENT_TIME]',
      duration: '[CSS_SELECTOR_FOR_TOTAL_TIME]',
      progressBar: '[CSS_SELECTOR_FOR_PROGRESS_BAR]',
      
      // Optional: State detection
      playingIndicator: '[CSS_SELECTOR_FOR_PLAYING_STATE]',
      pausedIndicator: '[CSS_SELECTOR_FOR_PAUSED_STATE]'
    }
  };
  
  // Optional: Override if site has complex play/pause logic
  /*
  play() {
    try {
      // Custom play logic here
      const playButton = document.querySelector(this.constructor.config.selectors.playButton);
      if (playButton && !this.isPlaying()) {
        playButton.click();
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[${this.constructor.config.name}] Play failed:`, error);
      return false;
    }
  }
  */
  
  // Optional: Override if site has complex metadata extraction
  /*
  getTrackInfo() {
    try {
      // Example: Custom extraction with fallbacks
      const title = this.extractTitle() || 'Unknown Track';
      const artist = this.extractArtist() || 'Unknown Artist';
      const isPlaying = this.detectPlayState();
      
      return {
        title,
        artist,
        album: this.extractAlbum(),
        artwork: this.extractArtwork(),
        isPlaying
      };
    } catch (error) {
      console.error(`[${this.constructor.config.name}] Metadata extraction failed:`, error);
      return super.getTrackInfo(); // Fallback to config-based extraction
    }
  }
  */
  
  // Optional: Override if site has complex time tracking
  /*
  getCurrentTime() {
    try {
      // Custom time extraction logic
      const timeElement = document.querySelector(this.constructor.config.selectors.currentTime);
      if (timeElement) {
        return this.parseTimeString(timeElement.textContent);
      }
      return 0;
    } catch (error) {
      console.error(`[${this.constructor.config.name}] Current time extraction failed:`, error);
      return 0;
    }
  }
  */
  
  // Optional: Site-specific utility methods
  /*
  isLoggedIn() {
    // Return true if user is logged in, false otherwise
    return document.querySelector('.user-profile, .login-required') !== null;
  }
  
  isReady() {
    // Return true if site is loaded and ready for interaction
    return document.querySelector(this.constructor.config.selectors.playButton) !== null;
  }
  
  parseTimeString(timeStr) {
    // Helper to parse "MM:SS" or "HH:MM:SS" format to seconds
    if (!timeStr) return 0;
    const parts = timeStr.split(':').reverse();
    return parts.reduce((acc, part, i) => acc + (parseInt(part) || 0) * Math.pow(60, i), 0);
  }
  */
}

// Register the handler (this will be automated in the future)
export default [SITE_NAME]Handler;
```

## 📝 **Customization Checklist**

### **Step 1: Replace Placeholders**
- [ ] `[SITE_NAME]` → Your site name (e.g., `Spotify`, `YouTubeMusic`)
- [ ] `[YOUR_NAME]` → Your name for attribution
- [ ] `[DATE]` → Current date
- [ ] `[SITE_URL]` → The music site's URL
- [ ] `[CSS_SELECTOR_FOR_*]` → Actual CSS selectors for each element

### **Step 2: Test Selectors**
Open the target site and test each selector in browser console:
```javascript
// Test if selector works
document.querySelector('[YOUR_SELECTOR]')

// Test if it returns the expected element
console.log(document.querySelector('.play-button').textContent)
```

### **Step 3: Choose Implementation Strategy**
- **Config-only**: Just fill in selectors, no custom methods needed
- **Selective override**: Override only methods that need custom logic
- **Full custom**: Override all methods for complex sites

### **Step 4: Test Integration**
- [ ] Load the site with your handler active
- [ ] Test all play/pause/next/prev commands
- [ ] Verify metadata extraction accuracy
- [ ] Check progress tracking updates
- [ ] Test error handling with invalid states

## 🎯 **Common Selector Patterns**

### **Button Selectors**
```css
/* Look for these common patterns */
.play-button, .pause-button
button[aria-label*="play"], button[aria-label*="pause"]  
[data-testid="play-button"], [data-testid="pause-button"]
.controls .play, .controls .pause
svg[data-icon="play"], svg[data-icon="pause"]
```

### **Metadata Selectors**
```css
/* Track title */
.track-title, .song-title, .now-playing-title
[data-testid="track-title"], [aria-label*="title"]
h1, h2, h3 /* sometimes titles are in headers */

/* Artist name */
.artist-name, .track-artist, .by-artist
[data-testid="artist-name"], a[href*="/artist/"]
.metadata .artist, .song-info .artist
```

### **Progress Selectors**
```css
/* Time displays */
.current-time, .elapsed-time, .time-current
.duration, .total-time, .time-total
[data-testid="current-time"], [data-testid="duration"]

/* Progress bars */
.progress-bar, .seek-bar, .timeline
input[type="range"][aria-label*="seek"]
.slider, .scrubber
```

## ⚠️ **Common Pitfalls**

1. **Dynamic Content**: Some sites load content asynchronously. Add retry logic.
2. **Multiple Players**: Some sites have multiple players. Target the active one.
3. **Login States**: Different selectors for logged in vs guest users.
4. **Mobile vs Desktop**: Different layouts may need different selectors.
5. **Ad Interruptions**: Handle cases where ads interrupt music.

## 📚 **Additional Resources**

- **Base Handler**: Study `base-handler.js` to understand default behavior
- **SoundCloud Example**: Reference `soundcloud.js` for a complete implementation
- **Browser DevTools**: Use Inspector to find reliable selectors
- **Site's Mobile App**: Check if mobile site has different selectors

---

**Ready to implement?** Save this as `sites/[yoursite].js` and start customizing!
