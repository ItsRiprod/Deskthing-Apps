# CACP Architecture

**Chrome Audio Control Platform - Technical Design**

> **Previous Version:** [SoundCloud Architecture](../old/architecture-old.md)

---

## 🏗️ **System Overview**

CACP implements a **modular site handler architecture** that allows multiple music streaming services to be controlled through a single Chrome extension and DeskThing app integration.

## 📋 **Core Components**

### **Chrome Extension Architecture**
```
cacp.js (Orchestrator)
├── Site Detection & Priority Manager
├── Active Site Handler Management  
├── WebSocket Communication
└── Settings Management

sites/ (Site Handlers)
├── base-handler.js (Config + Override Pattern)
├── soundcloud.js (Full Implementation)
├── youtube.js (Phase 1 Target)
└── _template.js (Contributor Template)

managers/ (Core Services)
├── site-detector.js (URL Pattern Matching)
├── priority-manager.js (User Preferences)
└── websocket-manager.js (DeskThing Communication)
```

### **DeskThing App Architecture**
```
server/index.ts (WebSocket Server)
├── Multi-Site Message Router
├── Site-Specific Data Management
└── DeskThing Platform Integration
```

## 🔄 **Communication Protocol**

### **WebSocket Messages**
**Extension → DeskThing:**
```javascript
{ type: 'mediaData', site: 'soundcloud', data: { title, artist, isPlaying, ... } }
{ type: 'timeupdate', site: 'soundcloud', currentTime, duration, isPlaying }
{ type: 'command-result', site: 'soundcloud', commandId, success, result }
```

**DeskThing → Extension:**
```javascript
{ type: 'media-command', action: 'play', targetSite?: 'soundcloud' }
{ type: 'seek', time: 120, targetSite?: 'soundcloud' }
```

### **Site Handler Interface**
```javascript
class SiteHandler {
  static config = { name, urlPatterns, selectors }
  
  // Core Controls
  play() / pause() / next() / previous()
  
  // Metadata Extraction  
  getTrackInfo() → { title, artist, album, artwork, isPlaying }
  
  // Progress Tracking
  getCurrentTime() / getDuration()
  
  // Optional Features
  seek(time) / isReady() / isLoggedIn()
}
```

## 🎯 **Design Patterns**

### **Config-Driven Defaults + Override Pattern**
- **Declarative config** handles 80% of common cases
- **Custom method overrides** handle complex edge cases
- **Graceful fallbacks** when selectors fail

### **Priority-Based Site Selection**
- **User-configurable** site ranking via drag-drop UI
- **Auto-detection** of active audio sites
- **Smart switching** when priority site becomes active

### **Robust Error Handling**
- **Try/catch** around all DOM interactions
- **Fallback strategies** when primary methods fail
- **Graceful degradation** to MediaSession API when needed

---

**Status:** 🚧 **Under Development** - Migrating from SoundCloud-only to multi-site platform  
**Next:** Site handler base class implementation
