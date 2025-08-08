# Chrome Audio Control Platform (CACP) - Roadmap

**Last Updated:** July 28, 2025  
**Current Phase:** Extension Testing & Validation  
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

## 🛣️ **Implementation Phases**

### **Phase 1: Foundation** ✅ **COMPLETE (Last Session)**
- [x] Repository restructure with dual development approach
- [x] CACP directory structure and scaffolding
- [x] Updated documentation and architecture
- [x] Chrome extension manifest with multi-site permissions
- [x] CACP app package.json and TypeScript configuration
- [x] **✅ Base handler class implementation**
- [x] **✅ Site detector and priority manager**
- [x] **✅ WebSocket manager for DeskThing communication**
- [x] **✅ SoundCloud functionality extracted into modular handler**
- [x] **✅ YouTube handler implementation**
- [x] **✅ Global media manager with cross-tab coordination**
- [x] **✅ Structured logging system**
- [x] **✅ Extension popup and settings UI**

### **Phase 2: Extension Validation** 🔄 **CURRENT (July 2025)**
- [ ] **🎯 Current:** Test extension-to-SoundCloud site communication
- [ ] Validate popup shows SoundCloud detection and controls
- [ ] Test play/pause/next/previous commands from extension
- [ ] Debug any site interaction or console errors
- [ ] Verify extension works with existing SoundCloud app server
- [ ] Test YouTube handler functionality

### **Phase 3: Universal App Server** 🔜 **NEXT**
- [ ] Migrate SoundCloud app server to universal CACP app
- [ ] Message routing by site in CACP app
- [ ] Multi-site data handling and storage
- [ ] Error handling and graceful fallbacks
- [ ] Testing framework for end-to-end validation

### **Phase 4: Platform Maturity** 🎯 **Q3-Q4 2025**
- [ ] Contributor documentation and guidelines
- [ ] Site handler template and examples
- [ ] Automated testing for selector stability
- [ ] Performance optimizations and resource management
- [ ] Advanced error recovery mechanisms

### **Phase 5: Ecosystem Growth** 🚀 **2026+**
- [ ] Additional site handlers (Spotify Web, Apple Music, YouTube Music)
- [ ] Community contribution pipeline
- [ ] Advanced features (volume control, playlists, queue management)
- [ ] Integration with additional DeskThing platform features

---

## 📊 **Current Development Status**

### **✅ Completed (Phase 1 - Last Session)**
- **CACP Chrome Extension**: Fully implemented with 3000+ lines of code
  - Content script orchestrator with site detection
  - Background script with global media management
  - Base handler class with config-driven architecture
  - Complete SoundCloud handler (892 lines)
  - Complete YouTube handler (477 lines)
  - WebSocket manager for DeskThing communication
  - Structured logging with Pino integration
  - Extension popup and settings interfaces
- **Multi-site manifest** with permissions for 5+ streaming services
- **Build system** updates with workspace support

### **🔄 In Progress (Phase 2)**
- **Extension testing** - Validate extension-to-site communication
- **SoundCloud integration** - Test against working app server
- **YouTube validation** - Verify second site handler works
- **Console debugging** - Fix any remaining initialization issues

### **🎯 Next Priorities (Phase 3)**
1. Migrate working SoundCloud app server to universal CACP app
2. Implement multi-site message routing and data handling
3. Create unified WebSocket server for all sites
4. Test end-to-end multi-site functionality

### **🔗 Dependencies**
- Extension validation must complete before app server migration
- SoundCloud baseline provides working reference for migration
- Chrome extension APIs provide cross-tab and site communication

---

## 📊 **Success Metrics**

**Phase 2 Complete:** Extension controls SoundCloud + YouTube sites reliably  
**Phase 3 Complete:** Universal app server supports 2+ sites with message routing  
**Phase 4 Complete:** Community contribution pipeline + 5+ sites  
**Platform Success:** 10+ sites with active community contributions

---

**Next Update:** After extension validation completion  
**Current Focus:** Extension-to-site communication before universal app development

---

### 2025-08-08 — Progress Note (Validation)

- Adopted ARIA-first timeline extraction on SoundCloud feed (reads `[role="progressbar"]` now/max) with fallbacks; scrubs update immediately. Added detailed trace logging for timing paths.
- Fixed popup UX (open-by-default, art + progress, heartbeat) and content SW/module build issues; manifests now patch-bumped on each build and version logged.
- Remaining: sanitize duplicated DOM titles, relax control presence check, and improve popup reconnect after SW restarts.
