# Chrome Audio Control Platform (CACP) - Roadmap

**Last Updated:** July 28, 2025  
**Current Phase:** Foundation Implementation  
**Repository Structure:** Dual development (working SoundCloud + CACP development)

---

## 🎯 **Vision**

Transform single-site audio control into a **universal Chrome audio control platform** that allows contributors to easily add support for any web-based music service through a standardized interface.

## 🏗️ **Architecture Decisions Made**

### **✅ Development Structure: Dual Implementation**
- **Working baseline** preserved in `soundcloud-app/` + `soundcloud-extension/`
- **CACP development** in separate `cacp-app/` + `cacp-extension/` directories
- **No breaking changes** to existing functionality during development

### **✅ WebSocket Communication: Single Connection**
- **One WebSocket connection** on port 8081
- **Site identification** via message field: `{ type: 'mediaData', site: 'spotify', data: {...} }`
- **Message routing** handled elegantly in single connection
- **Protocol compatibility** with existing SoundCloud implementation

### **✅ Site Integration Pattern: Hybrid Approach**
- **Declarative config** as optimistic starting point (80% of cases)
- **Custom JS logic** override capability for complex edge cases (20% of cases)
- **Base handler class** with config-driven defaults + method overrides

### **✅ Priority System: User-Controlled Ranking**
- **Chrome extension options page** with drag-drop interface
- **Auto-detection** of current site via URL patterns
- **Priority-based selection** when multiple audio tabs are active

---

## 📋 **WebSocket Protocol** ✅ **Already Multi-Site Ready**

The existing protocol was designed for multi-site support:

**Extension → DeskThing:**
```javascript
{ type: 'connection', source: 'chrome-extension', version: '0.1.0', site: 'soundcloud' }
{ type: 'mediaData', site: 'soundcloud', data: { title, artist, album, artwork, isPlaying } }
{ type: 'timeupdate', site: 'soundcloud', currentTime, duration, isPlaying }
{ type: 'command-result', site: 'soundcloud', commandId, success, result }
```

**DeskThing → Extension:**
```javascript
{ type: 'media-command', action: 'play|pause|nexttrack|previoustrack', id, targetSite?: 'soundcloud' }
{ type: 'seek', time: number, targetSite?: 'soundcloud' }
{ type: 'ping' }
```

---

## 🛣️ **Implementation Phases**

### **Phase 1: Foundation** 🔄 **Current (July 2025)**
- [x] Repository restructure with dual development approach
- [x] CACP directory structure and scaffolding
- [x] Updated documentation and architecture
- [x] Chrome extension manifest with multi-site permissions
- [x] CACP app package.json and TypeScript configuration
- [ ] **🎯 Current:** Base handler class implementation
- [ ] Site detector and priority manager
- [ ] WebSocket manager for DeskThing communication
- [ ] Extract SoundCloud functionality into modular handler

### **Phase 2: Multi-Site Core** 🔜 **Next**
- [ ] Priority manager with drag-drop settings UI
- [ ] Message routing by site in CACP app
- [ ] Error handling and graceful fallbacks
- [ ] Basic YouTube implementation
- [ ] Testing framework for site handlers

### **Phase 3: Platform Maturity** 🎯 **Q3-Q4 2025**
- [ ] Contributor documentation and guidelines
- [ ] Site handler template and examples
- [ ] Automated testing for selector stability
- [ ] Performance optimizations and resource management
- [ ] Advanced error recovery mechanisms

### **Phase 4: Ecosystem Growth** 🚀 **2026+**
- [ ] Additional site handlers (Spotify Web, Apple Music, YouTube Music)
- [ ] Community contribution pipeline
- [ ] Advanced features (volume control, playlists, queue management)
- [ ] Integration with additional DeskThing platform features

---

## 🎵 **Target Site Support**

### **Phase 1 Sites**
- **SoundCloud** ✅ Working baseline, 🔄 Migrating to modular
- **YouTube** 🔄 Basic framework, needs implementation

### **Phase 2 Sites**
- **Spotify Web** - Existing selector research available
- **YouTube Music** - Extension of YouTube handler

### **Phase 3+ Sites**
- **Apple Music Web** - Basic research completed
- **Pandora** - Community request
- **Tidal** - Premium streaming support
- **Deezer** - International market support

---

## 📝 **Current Development Status**

### **✅ Completed (July 2025)**
- Repository organization with dual development structure
- Architecture documentation and technical design
- CACP app and extension scaffolding
- Multi-site Chrome extension manifest
- Build system updates with workspace support

### **🔄 In Progress**
- **Base handler class** - Core interface for all site implementations
- **Site detection system** - URL pattern matching and priority management
- **WebSocket manager** - DeskThing communication layer

### **🎯 Next Priorities**
1. Complete base handler implementation
2. Extract SoundCloud functionality into modular handler
3. Implement site detection and priority management
4. Create settings UI for site priority configuration

### **🔗 Dependencies**
- No external dependencies - self-contained development
- SoundCloud implementation serves as working reference
- Chrome extension APIs provide site detection capabilities

---

## 📊 **Success Metrics**

**Phase 1 Complete:** Base handler + SoundCloud modular + YouTube basic  
**Phase 2 Complete:** 3+ sites supported with user priority settings  
**Phase 3 Complete:** Community contribution pipeline + 5+ sites  
**Platform Success:** 10+ sites with active community contributions

---

**Next Update:** After base handler implementation completion  
**Current Focus:** Foundation infrastructure for universal platform
