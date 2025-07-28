# Next Session Planning - CACP Development

*Last Updated: January 27, 2025*

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

## 🎯 **IMMEDIATE PRIORITY FIXES**

### **HIGH RISK - FIX FIRST:**
1. **Next/Previous timing** - Original's delays may be crucial for SoundCloud's SPA behavior
2. **Missing position tracking interval** - No continuous updates to DeskThing
3. **Timeline scrub selectors** - Missing important interaction points
4. **Smart logging system** - Implement to prevent performance issues

### **MEDIUM RISK:**  
5. **MediaSession control approach** - Missing potential control method

### **LOW RISK:**
6. **MSE element storage** - Unlikely to affect functionality
7. **Seek method priority** - Both should work, just different order

---

## 📋 **CURRENT SESSION GOALS**

- [ ] **CRITICAL:** Implement SmartLogger system in CACP
- [ ] **CRITICAL:** Fix next/previous control timing to match original
- [ ] **CRITICAL:** Add missing timeline scrub selectors
- [ ] **CRITICAL:** Implement continuous position tracking interval
- [ ] Add MediaSession API control fallbacks
- [ ] Test CACP extension with fixed implementation
- [ ] Move to CACP app server implementation

## 🔄 **NEXT STEPS**

1. **Find existing logging implementation** in Fora app for reference
2. **Implement SmartLogger** in CACP base-handler or site-detector
3. **Update SoundCloud handler** with proper timing and intervals
4. **Test against working SoundCloud extension**
5. **Validate all control commands work properly**

## 📝 **NOTES**

- The biggest concern is the **next/previous control strategy** and **missing continuous position tracking** which are core to the working functionality
- SmartLogger is crucial for performance - the original has sophisticated throttling that prevents log spam
- Timeline interaction needs all selectors to properly detect user scrubbing

## 🚧 **BLOCKERS**

None currently - ready to implement fixes. 