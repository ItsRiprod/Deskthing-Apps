# CACP Architecture

**Chrome Audio Control Platform - Technical Design**

**Updated:** July 28, 2025  
**Current Structure:** Dual development with separated CACP and SoundCloud implementations

---

## 🏗️ **System Overview**

CACP implements a **modular site handler architecture** that allows multiple music streaming services to be controlled through a single Chrome extension and DeskThing app integration.

## 📁 **Physical Structure**

### **CACP Implementation (New)**
```
cacp-extension/
├── cacp.js                 # Main orchestrator
├── sites/
│   ├── base-handler.js     # Base class with config + override pattern
│   ├── soundcloud.js       # SoundCloud implementation
│   ├── youtube.js          # YouTube implementation
│   └── _template.js        # Template for contributors
├── managers/
│   ├── site-detector.js    # URL pattern matching
│   ├── priority-manager.js # User priority ranking
│   └── websocket-manager.js # DeskThing communication
├── settings/
│   ├── settings.html       # Priority drag-drop interface
│   └── settings.js         # Settings logic
└── manifest.json           # Multi-site permissions
```

```
cacp-app/
├── server/
│   ├── index.ts            # WebSocket server (port 8081)
│   ├── mediaStore.ts       # Multi-site message routing
│   └── siteManager.ts      # Site-specific data handling
├── src/
│   └── App.tsx             # React frontend
└── deskthing/
    └── manifest.json       # CACP app manifest
```

### **SoundCloud Legacy (Working Baseline)**
```
soundcloud-extension/       # Current working Chrome extension
soundcloud-app/            # Current working DeskThing app
```

## 🔄 **Communication Protocol**

### **WebSocket Messages (Unchanged)**
The protocol is already designed for multi-site support:

**Extension → DeskThing:**
```javascript
{ type: 'mediaData', site: 'soundcloud', data: { title, artist, isPlaying } }
{ type: 'timeupdate', site: 'soundcloud', currentTime, duration, isPlaying }
{ type: 'command-result', site: 'soundcloud', commandId, success, result }
```

**DeskThing → Extension:**
```javascript
{ type: 'media-command', action: 'play', targetSite?: 'soundcloud' }
{ type: 'seek', time: 120, targetSite?: 'soundcloud' }
```

## 🎯 **Site Handler Interface**

### **Base Handler Pattern**
```javascript
export class SiteHandler {
  // Config-driven defaults
  static config = {
    name: 'Site Name',
    urlPatterns: ['example.com'],
    selectors: { playButton: '.play', /* ... */ }
  };
  
  // Core methods (can use config or override)
  play() { /* click config.selectors.playButton or custom logic */ }
  pause() { /* click config.selectors.pauseButton or custom logic */ }
  getTrackInfo() { /* extract from config.selectors or custom logic */ }
  
  // Override for complex cases
  isReady() { return true; }
  isLoggedIn() { return true; }
}
```

## 🔧 **Core Components**

### **Site Detection & Priority**
- **URL pattern matching** determines active site
- **User priority settings** resolve conflicts when multiple sites have audio
- **Auto-switching** when higher-priority site becomes active

### **Message Routing**
- **Single WebSocket** connection on port 8081
- **Site identification** in all messages
- **Command targeting** via optional `targetSite` parameter

### **Settings Management**
- **Chrome extension options page** for site priority
- **Drag-drop interface** for user configuration
- **Per-site enable/disable** controls

## 🎯 **Design Patterns**

### **Progressive Enhancement**
1. **Config-only** handlers for simple sites (80% of cases)
2. **Selective overrides** for complex edge cases (15% of cases)  
3. **Full custom implementation** for unique architectures (5% of cases)

### **Graceful Degradation**
- **Fallback strategies** when selectors change
- **MediaSession API** as backup when site-specific detection fails
- **Error isolation** preventing one site from breaking others

---

## 🚧 **Current Development Status**

**Scaffolded:** ✅ Directory structure, manifests, documentation  
**Next Phase:** 🔄 Base handler class implementation  
**Working Baseline:** ✅ SoundCloud implementation preserved for reference

**Target:** Universal platform supporting 5+ streaming services with contributor-friendly architecture.
