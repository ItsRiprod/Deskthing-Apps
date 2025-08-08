# Next Session Planning - CACP Development

*Last Updated: July 28, 2025*

## 🎯 **CURRENT STATUS: CACP Extension Complete - Testing Phase**

### **✅ MAJOR PROGRESS: CACP Extension Fully Implemented (Last Session)**
- **CACP extension is 90%+ complete** - sophisticated multi-site architecture implemented
- **Content script** (455 lines): Global media source reporting with site detection  
- **Background script** (324 lines): Complete GlobalMediaManager with tab coordination
- **Site handlers**: Full SoundCloud (892 lines) + YouTube (477 lines) implementations
- **Base architecture**: Config-driven handler system with override capabilities
- **Support systems**: WebSocket manager, priority manager, structured logging, popup UI

### **🎯 CURRENT PRIORITY: Extension-to-SoundCloud Communication**
**Focus**: Get CACP extension working with SoundCloud site **before** touching DeskThing app
- Extension → SoundCloud site interaction (play/pause/next/prev)
- Popup interface showing SoundCloud detection and control
- Validate against working SoundCloud app server (port 8081)

### **🔄 IMPLEMENTATION STATUS**

**✅ COMPLETE (Last Session):**
- CACP Chrome extension architecture and implementation
- Multi-site handler system with base class + overrides
- SoundCloud and YouTube site handlers 
- Global media manager for cross-tab coordination
- WebSocket communication layer
- Structured logging system with Pino
- Extension popup and settings UI
- Chrome manifest with multi-site permissions

**🎯 CURRENT FOCUS:**
- [ ] **DEBUG**: Extension popup showing SoundCloud detection
- [ ] **TEST**: SoundCloud site control commands (play/pause/next/prev)
- [ ] **VALIDATE**: Extension communication with SoundCloud app server
- [ ] **FIX**: Any extension-to-site interaction issues

**🔜 NEXT PHASE (After Extension Works):**
- [ ] Migrate working SoundCloud app server to universal CACP app
- [ ] Multi-site server message routing
- [ ] Test YouTube handler integration

---

## 🚨 **PREVIOUS CONSOLE ERRORS (May Be Resolved)**

### **Extension Loading Issues (Check if still occurring):**
```
cacp.js:4 {time: 1753749008251, level: 'error', msg: 'CACP Media Source initialization failed'}
Uncaught runtime.lastError: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received
```

### **Ad-Blocker Interference (Still Relevant):**
- **30+ blocked requests** for SoundCloud internal scripts
- May affect MediaSession API and extension functionality
- Test in clean browser profile if issues persist

---

## 📋 **CURRENT SESSION GOALS**

### **🎯 PRIMARY (Extension-to-Site Communication):**
- [ ] **LOAD**: Test CACP extension in Chrome Developer Mode
- [ ] **NAVIGATE**: Go to SoundCloud and check popup shows detection
- [ ] **CONTROL**: Test play/pause/next/prev commands from popup
- [ ] **DEBUG**: Any site interaction failures or console errors
- [ ] **VALIDATE**: Extension properly detects and controls SoundCloud

### **🔧 SECONDARY (If Primary Works):**
- [ ] **CONNECT**: Test extension WebSocket connection to SoundCloud app (port 8081)
- [ ] **VERIFY**: Media state reporting to DeskThing app
- [ ] **CONFIRM**: Full end-to-end control flow working

## 🔄 **TESTING WORKFLOW**

### **Phase 1: Extension-to-Site (Current)**
1. **Load CACP extension** in Chrome Developer Mode
2. **Navigate to SoundCloud** 
3. **Open extension popup** - should show SoundCloud detected
4. **Test basic controls** - play, pause, next, previous from popup
5. **Check console** for any errors or warnings

### **Phase 2: Extension-to-App (If Phase 1 Works)**
1. **Start SoundCloud app server** (`npm run dev:soundcloud`)
2. **Test WebSocket connection** from extension
3. **Verify media data flow** - track info, playback state
4. **Test DeskThing control commands** end-to-end

## 📝 **ARCHITECTURE NOTES**

### **CACP Extension Structure (Implemented):**
```
cacp-extension/src/
├── cacp.js                 # Content script orchestrator (455 lines)
├── background.js           # Global media manager (324 lines)  
├── sites/
│   ├── base-handler.js     # Config-driven base class (442 lines)
│   ├── soundcloud.js       # Full SC implementation (892 lines)
│   └── youtube.js          # Full YT implementation (477 lines)
├── managers/
│   ├── site-detector.js    # URL pattern matching (311 lines)
│   ├── priority-manager.js # User priority ranking (321 lines)
│   └── websocket-manager.js # DeskThing communication (545 lines)
└── logger.js               # Structured logging (250 lines)
```

### **Next Phase: CACP App Server (Not Started)**
```
cacp-app/server/
├── index.ts               # Empty - needs implementation
├── mediaStore.ts          # Empty - needs implementation  
└── siteManager.ts         # Empty - needs implementation
```

## 🚧 **BLOCKERS & DEPENDENCIES**

**Current Blocker**: Unknown if extension-to-SoundCloud site communication works
**Dependency**: Must validate extension works before building universal app server
**Environment**: Test with/without ad-blockers if issues arise

---

**Evolution Path**: Extension Working → App Migration → Universal Platform  
**Current Focus**: Extension validation and site control before DeskThing integration 

---

## Session Findings — 2025-08-08 01:17:23 MDT

- **What was broken**
  - Media element is inside sandboxed iframes on the feed → no `audio/video` in main doc; MediaSession often empty at start → timing 0/0.
  - Loading unpacked from `src/*` caused bare-import and module errors; popup logs collapsed; handler state checked wrong property.

- **What we changed**
  - Load built `dist/`, mark SW as module; patch-bump each build and log version in content/popup.
  - Fix handler state (`currentHandler`), add `getSitePriority`, open popup by default with heartbeat logs, add art + progress.
  - SoundCloud handler: add mini-player selectors; implement ARIA-first timeline (now/max) with fallbacks; scrub forces immediate update; detailed trace logs.

- **What works now**
  - ARIA path active on feed: progress and scrubs reflect immediately; MediaSession metadata/artwork populate mid-play; controls work.
  - Popup timeline click-to-seek for priority source and per-source progress bars; seeks dispatch mouse sequence onto SoundCloud `.playbackTimeline__progressWrapper[role="progressbar"]`.

- **Remaining**
  - Clean duplicated DOM titles (strip "Current track:" and repeats).
  - Relax `hasControls` check; strengthen popup reconnect after SW restarts.
  - Apply the same click-to-seek approach to YouTube when that handler is validated.

---

## YouTube (watch) Implementation Plan — Scoped (No YouTube Music)

1) Scope
- Support only `www.youtube.com` watch pages (exclude Shorts `/shorts/` and Live `/live/` for v1). No YouTube Music.

2) Handler skeleton
- Create `src/sites/youtube.js` mirroring SoundCloud public API: `initialize`, `isReady`, `getTrackInfo`, `getCurrentTime`, `getDuration`, `isPlaying/getPlayingState`, `play/pause/next/previous`, `seek`, `extractTiming`.

3) Controls mapping
- Play/Pause: `.ytp-play-button` (toggle) → fallback keyboard `'k'`.
- Next/Prev: `.ytp-next-button` / `.ytp-prev-button` (if present).

4) Timing extraction (priority order)
- Media element: `document.querySelector('video')` → `currentTime/duration` if `duration>0`.
- ARIA slider: `.ytp-progress-bar [role="slider"]` → `aria-valuenow/aria-valuemax`.
- Ratio fallback: `.ytp-play-progress` width / `.ytp-progress-bar` width.
- Text fallback: `.ytp-time-current`, `.ytp-time-duration`.

5) Click-to-seek
- Primary: set `video.currentTime = target`.
- Fallback mouse sequence on `.ytp-progress-bar`: dispatch `mousemove/mousedown/mouseup/click` at `rect.left + rect.width * (time/duration)`.

6) Readiness and metadata
- isReady if controls exist, MediaSession metadata exists, or video present.
- Track info from MediaSession; fallback to `h1.title` and channel link.

7) Edge cases
- Ads: skip timing during `player.classList.contains('ad-interrupting')` or ad overlays.
- Live: `duration === 0` → disable seek.
- SPA: re-detect on URL change (already wired).

8) QA
- Validate play/pause/next/prev, progress, click-to-seek on standard watch pages and playlist items; mini/theater modes.
