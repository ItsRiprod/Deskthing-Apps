# Next Session Planning - CACP Development

*Last Updated: January 28, 2025*

## 🚨 **CRITICAL STATUS: CACP Extension Failed - Immediate Action Required**

### **Current State: BROKEN ❌**
- **CACP extension initialization FAILED**
- Extension loads but crashes during `CACPMediaSource.initialize()`
- No media detection or control functionality working
- Multiple architectural and environmental issues identified

### **Console Error Summary:**
```
cacp.js:4 {time: 1753749008251, level: 'error', msg: 'CACP Media Source initialization failed'}
Uncaught runtime.lastError: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received
```

### **Root Cause Analysis:**

**1. 🔥 CRITICAL: Extension Architecture Failure**
- New global media controller architecture has bugs
- Background script/content script communication broken  
- Async message handling errors in Chrome extension APIs
- `chrome.runtime.sendMessage` calls failing or timing out

**2. 🔥 CRITICAL: Ad-Blocker Interference**
- **30+ blocked requests** for SoundCloud internal scripts:
  - `net::ERR_BLOCKED_BY_CLIENT` for analytics, ads, tracking
  - `htlbid.js`, `scorecardresearch.com`, `googletagmanager.com` blocked
  - `synchrobox.adswizz.com`, `cdn.moengage.com` blocked
- SoundCloud's MediaSession API likely compromised
- Our extension may be fighting damaged SoundCloud functionality

**3. 🔥 CRITICAL: Service Worker Errors** 
- Multiple `TypeError: Failed to convert value to 'Response'` errors
- Service worker conflicts between our extension and SoundCloud
- CORS policy blocks for SoundCloud assets (`@rive-app-canvas-lite`)

**4. Environment Issues:**
- Vite bundling may have introduced module resolution bugs
- ES6 module compatibility problems in Chrome extension context
- Background script may not be properly handling async operations

---

## 🚨 **IMMEDIATE PRIORITY FIXES**

### **Block everything else until these are fixed:**

**1. 🔥 DEBUG EXTENSION INITIALIZATION FAILURE (Critical)**
- [ ] Add comprehensive error logging to `CACPMediaSource.initialize()`
- [ ] Check background script is loading and responding
- [ ] Verify `chrome.runtime.sendMessage` communication works
- [ ] Test without ad-blockers to isolate interference

**2. 🔥 FIX GLOBAL MEDIA CONTROLLER ARCHITECTURE (Critical)**
- [ ] Debug background script `GlobalMediaManager` class
- [ ] Fix async message handling in `chrome.runtime.onMessage`
- [ ] Ensure content script registration with background works
- [ ] Verify popup can communicate with background script

**3. 🔥 ISOLATE AD-BLOCKER IMPACT (High)**
- [ ] Test extension on clean browser profile (no ad-blockers)
- [ ] Document which SoundCloud features break with heavy ad-blocking
- [ ] Determine if our extension can work around blocked APIs
- [ ] Consider fallback strategies for compromised MediaSession

### **Secondary (After core fixes):**
**4. 🟡 IMPLEMENT MISSING SOUNDCLOUD FIXES**
- [ ] Fix next/previous control timing to match original
- [ ] Add missing timeline scrub selectors  
- [ ] Implement continuous position tracking interval
- [ ] Add MediaSession API control fallbacks

---

## 🚨 **CRITICAL FINDINGS: SoundCloud vs CACP Handler Comparison**

### ✅ **What's ALIGNED:**

**Selectors:**
- ✅ Duration selector: `.playbackTimeline__duration` - **IDENTICAL**
- ✅ Position selector: `.playbackTimeline__timePassed` - **IDENTICAL** 
- ✅ Progress bar: `.playbackTimeline__progressBar` - **IDENTICAL**
- ✅ Next/Prev buttons: `.playControls__next`, `.playControls__prev` - **IDENTICAL**
- ✅ Play/Pause patterns: `[title="Play"]`, `[title="Pause"]` - **IDENTICAL**

**Core Strategies:**
- ✅ MediaSession monitoring - **SAME APPROACH**
- ✅ MSE detection with fetch interception - **SAME APPROACH**
- ✅ Progress bar percentage calculation for position - **SAME LOGIC**
- ✅ Multiple fallback methods for timing - **SAME PATTERN**
- ✅ Audio segment detection via `media-streaming.soundcloud.cloud` - **SAME URL PATTERN**

---

### ⚠️ **CRITICAL INCONGRUENCES - MUST FIX:**

**1. Next/Previous Control Strategy - DIFFERENT TIMING:**
```javascript
// Original (working):
handleNext() {
  // Keyboard shortcut FIRST with 50ms delay
  setTimeout(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', code: 'KeyJ' }));
  }, 50);
  
  // Button click AFTER with 600ms delay  
  setTimeout(() => {
    nextButton.click();
  }, 600);
}

// CACP (my version):
async next() {
  // Button click FIRST
  const nextButton = this.getElement(this.constructor.config.selectors.nextButton);
  if (nextButton && !nextButton.disabled) {
    this.clickElement(nextButton);
    return { success: true, action: 'next' };
  }
  
  // Keyboard shortcut FALLBACK (no delays)
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', code: 'KeyJ' }));
}
```
**Issue:** Original uses keyboard FIRST + timing delays. Mine uses button FIRST + immediate fallback.

**2. Missing Smart Logging System:**
```javascript
// Original has sophisticated SmartLogger class:
- 20-second log intervals
- Jump detection with 5-second threshold  
- Scrub session tracking
- Log cooldowns and deduplication

// CACP: Basic logging without smart filtering
- No log throttling
- No jump detection
- No scrub session management
```

**3. Timeline Scrub Detection - MISSING SELECTORS:**
```javascript
// Original covers MORE timeline selectors:
const timelineSelectors = [
  '.playbackTimeline',
  '.playbackTimeline__progressWrapper',  
  '.playbackTimeline__progressBackground', // ← MISSING in CACP
  '.playbackTimeline__progressBar',
  '.playbackTimeline__progressHandle'     // ← MISSING in CACP
];

// CACP only has:
timeline: '.playbackTimeline, .playbackTimeline__progressWrapper'
```

**4. Position Update Interval - NOT IMPLEMENTED:**
```javascript
// Original has automatic position tracking:
startPositionTracking() {
  this.positionUpdateInterval = setInterval(() => {
    this.updatePosition(); // Calls extractSoundCloudTiming()
  }, 1000);
}

// CACP: Only extracts timing on-demand via getCurrentTime()
// Missing continuous position broadcasting
```

**5. MSE Element Storage - DIFFERENT APPROACH:**
```javascript
// Original stores MSE element globally:
window.discoveredMSEElement = this;

// CACP stores in instance:
self.mseElement = this;
```

**6. Media Element Seeking Priority - DIFFERENT ORDER:**
```javascript
// Original: MSE element → any media element → UI click
// CACP: MSE element → any media element → progress bar click

// Original doesn't try progress bar clicking for seek
```

**7. Play/Pause Control Fallbacks - MISSING METHODS:**
```javascript
// Original tries MediaSession API first:
if (navigator.mediaSession && navigator.mediaSession.setActionHandler) {
  navigator.mediaSession.setActionHandler('play', null);
}

// CACP: Goes straight to button → keyboard
// Missing MediaSession API control attempt
```

---

## 📋 **CURRENT SESSION GOALS**

### **🚨 EMERGENCY FIXES (Do First):**
- [ ] **DEBUG:** Add detailed error logging to identify initialization failure point
- [ ] **DEBUG:** Test background script loads and responds to messages
- [ ] **DEBUG:** Verify content script → background → popup communication chain
- [ ] **TEST:** Run extension in clean browser (no ad-blockers) to isolate issues
- [ ] **FIX:** Resolve async message handling errors in global media controller

### **🔧 CRITICAL FIXES (After Emergency):**
- [ ] **CRITICAL:** Implement SmartLogger system in CACP
- [ ] **CRITICAL:** Fix next/previous control timing to match original
- [ ] **CRITICAL:** Add missing timeline scrub selectors
- [ ] **CRITICAL:** Implement continuous position tracking interval
- [ ] Add MediaSession API control fallbacks
- [ ] Test CACP extension with fixed implementation
- [ ] Move to CACP app server implementation

## 🔄 **NEXT STEPS**

### **Immediate (This Session):**
1. **Add debug logging** throughout CACP initialization process
2. **Test background script** functionality in isolation  
3. **Verify message passing** between all extension components
4. **Test on clean browser** to confirm ad-blocker impact
5. **Fix critical initialization bugs** before proceeding

### **After Emergency Fixes:**
1. **Find existing logging implementation** in Fora app for reference
2. **Implement SmartLogger** in CACP base-handler or site-detector
3. **Update SoundCloud handler** with proper timing and intervals
4. **Test against working SoundCloud extension**
5. **Validate all control commands work properly**

## 📝 **NOTES**

- **CRITICAL:** Extension is completely broken - no functionality works
- **Ad-blocker interference** is severe and may require working around compromised SoundCloud APIs
- **New global architecture** introduced bugs that need immediate fixing
- The biggest concern is the **extension initialization failure** which blocks everything else
- SmartLogger is crucial for performance - the original has sophisticated throttling that prevents log spam
- Timeline interaction needs all selectors to properly detect user scrubbing

## 🚧 **BLOCKERS**

- **Extension initialization completely failing** - blocks all testing and development
- **Unknown cause of background script communication errors** - need debugging session 