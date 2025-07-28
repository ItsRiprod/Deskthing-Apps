# Chrome Audio Control Platform (CACP) - Roadmap

**Last Updated:** July 28, 2025  
**Evolution From:** SoundCloud App → Universal Chrome Audio Control Platform  
**Previous Roadmap:** [../old/roadmap-old.md](../old/roadmap-old.md)

---

## 🎯 **Vision**

Transform the SoundCloud app into a **universal Chrome audio control platform** that allows contributors to easily add support for any web-based music service through a standardized interface.

## 🏗️ **Architecture Decisions**

### **WebSocket Communication** ✅ **Option 1: Single Connection**
- **One WebSocket connection** on port 8081
- **Site identification** via message field: `{ type: 'mediaData', site: 'spotify', data: {...} }`
- **Message routing** handled elegantly in single connection
- **Reason**: Simple, efficient, handles message volume well

### **Site Integration Pattern** ✅ **Hybrid Approach**
- **Declarative config** as optimistic starting point for basic functionality
- **Custom JS logic** override capability for complex edge cases
- **Base handler class** with config-driven defaults + method overrides

### **Priority System** ✅ **User-Controlled Ranking**
- **Drag-and-drop settings interface** for site priority
- **Auto-detection** of current site via Chrome APIs
- **Priority-based selection** when multiple audio tabs are active

---

## 📋 **Current DeskThing Contract** ✅ **Already Perfect**

**Chrome Extension → DeskThing:**
```javascript
// Connection handshake
{ type: 'connection', source: 'chrome-extension', version: '1.0.1', site: 'soundcloud' }

// Media metadata updates
{ type: 'mediaData', site: 'soundcloud', data: { title, artist, album, artwork, isPlaying } }

// Real-time timing updates  
{ type: 'timeupdate', site: 'soundcloud', currentTime, duration, isPlaying }

// Command acknowledgment
{ type: 'command-result', site: 'soundcloud', commandId, success, result }
```

**DeskThing → Chrome Extension:**
```javascript
// Control commands
{ type: 'media-command', action: 'play|pause|nexttrack|previoustrack', id, targetSite?: 'soundcloud' }

// Seek to position
{ type: 'seek', time: number, targetSite?: 'soundcloud' }

// Health check
{ type: 'ping' }
```

---

## 🔧 **Site Handler Interface**

### **Minimum Required Implementation**
```javascript
export class SiteHandler {
  // Required: Site identification
  static config = {
    name: 'Site Name',
    urlPatterns: ['example.com'],
    selectors: {
      playButton: '.play-btn',
      pauseButton: '.pause-btn',
      nextButton: '.next-btn',
      prevButton: '.prev-btn',
      title: '.track-title',
      artist: '.track-artist'
    }
  };
  
  // Required: Core controls (can use config or override)
  play() { /* Default: click config.selectors.playButton */ }
  pause() { /* Default: click config.selectors.pauseButton */ }
  next() { /* Default: click config.selectors.nextButton */ }
  previous() { /* Default: click config.selectors.prevButton */ }
  
  // Required: Metadata extraction (can use config or override)
  getTrackInfo() { 
    /* Default: extract from config.selectors.title/.artist/etc */
    return { title, artist, album, artwork, isPlaying };
  }
  
  // Required: Progress tracking
  getCurrentTime() { return seconds; }
  getDuration() { return seconds; }
  
  // Optional: Advanced features
  seek(time) { /* Optional: seek to position */ }
  isReady() { return true; /* Site loaded and ready */ }
  isLoggedIn() { return true; /* User authenticated */ }
}
```

### **Custom Logic Override Example**
```javascript
export class SpotifyHandler extends SiteHandler {
  static config = {
    name: 'Spotify Web',
    urlPatterns: ['open.spotify.com', 'play.spotify.com'],
    selectors: {
      playButton: '[data-testid="control-button-playpause"]',
      // ... other selectors
    }
  };
  
  // Override for complex logic
  play() {
    if (this.isInFullscreen()) {
      // Custom logic for fullscreen mode
      document.querySelector('.fullscreen-play').click();
    } else {
      // Use default config-driven approach
      super.play();
    }
  }
  
  getTrackInfo() {
    // Complex extraction logic for Spotify's dynamic DOM
    const isPodcast = document.querySelector('[data-testid="podcast-badge"]');
    if (isPodcast) {
      return this.extractPodcastInfo();
    }
    return super.getTrackInfo(); // Use config defaults
  }
}
```

---

## 📁 **Proposed File Structure**

```
chrome-extension/
├── cacp.js                 # Main orchestrator
├── sites/
│   ├── base-handler.js     # Base class with config-driven defaults
│   ├── soundcloud.js       # SoundCloud implementation
│   ├── youtube.js          # YouTube implementation
│   └── _template.js        # Template for contributors
├── managers/
│   ├── site-detector.js    # URL-based site detection
│   ├── priority-manager.js # User priority ranking
│   └── websocket-manager.js # WebSocket communication
├── settings/
│   ├── settings.html       # Priority drag-drop interface
│   └── settings.js         # Settings logic
└── manifest.json           # Updated permissions
```

```
server/
├── index.ts                # WebSocket server (port 8081)
├── mediaStore.ts           # Multi-site message routing
└── siteManager.ts          # Site-specific data handling
```

---

## 🎵 **Initial Site Support** (Phase 1)

### **SoundCloud** ✅ **Current Implementation**
- **Status**: Fully functional
- **Features**: Play/pause, next/prev, metadata, progress tracking
- **Migration**: Extract into modular site handler

### **YouTube** 🚧 **Scaffold Implementation**
- **Status**: Basic support exists in scattered code
- **Features**: Play/pause, metadata extraction
- **Migration**: Consolidate and modularize existing code

---

## ❓ **Open Questions** (To Be Answered)

### **1. Edge Case Handling**
- How do we handle sites that fail selector detection?
- What's the fallback strategy when primary methods break?
- How do we manage sites with multiple player instances?

### **2. User Experience**
- Should the priority settings be per-site or per-domain?
- How do we handle sites requiring login vs guest access?
- What's the UX when a prioritized site has no audio playing?

### **3. Technical Implementation**
- How do we detect when a site's DOM structure changes?
- Should we implement rate limiting for command sending?
- How do we handle sites with ad interruptions?

### **4. Contributor Guidelines**
- What's the minimum testing required for new site handlers?
- How do we validate that a site handler works correctly?
- Should we have automated tests for selector stability?

### **5. Error Recovery**
- What happens when a site handler throws an exception?
- How do we gracefully degrade functionality?
- Should we have automatic fallback to MediaSession API?

### **6. Performance & Resource Management**
- How many sites should we actively monitor simultaneously?
- What's the polling frequency for inactive tabs?
- How do we minimize impact on browser performance?

---

## 🛣️ **Implementation Phases**

### **Phase 1: Foundation** 🚧 **Current**
- [x] Rename project to CACP
- [x] Document architecture decisions
- [ ] Create base handler class with config support
- [ ] Extract SoundCloud into modular handler
- [ ] Scaffold YouTube handler
- [ ] Implement site detection system

### **Phase 2: Multi-Site Core**
- [ ] Priority manager with drag-drop UI
- [ ] Message routing by site
- [ ] Error handling and fallbacks
- [ ] Basic YouTube implementation

### **Phase 3: Platform Maturity**
- [ ] Contributor documentation
- [ ] Site handler template
- [ ] Testing framework
- [ ] Performance optimizations

### **Phase 4: Ecosystem Growth**
- [ ] Additional site handlers (Spotify Web, Apple Music, etc.)
- [ ] Community contribution guidelines
- [ ] Automated integration testing
- [ ] Advanced features (volume control, playlists, etc.)

---

## 📝 **Notes**

- **Backward Compatibility**: Maintain compatibility with existing SoundCloud functionality
- **DeskThing Integration**: No changes needed to DeskThing app side initially
- **Chrome Extension**: Major refactor but same manifest permissions
- **WebSocket Protocol**: Enhanced with site identification, no breaking changes
