# Contributing to CACP

**How to Add Support for New Music Sites**

---

## 🎯 **Overview**

Adding support for a new music streaming site involves creating a **site handler** that implements the CACP interface. This guide walks you through the process.

## 🚀 **Quick Start**

1. **Copy** the [site template](./site-template.md)
2. **Update** the config with your site's details
3. **Implement** the required methods
4. **Test** thoroughly on the target site
5. **Submit** a pull request

## 📋 **Minimum Requirements**

Your site handler must implement:

### **Site Identification**
```javascript
static config = {
  name: 'Your Site Name',
  urlPatterns: ['yoursite.com', 'music.yoursite.com'],
  selectors: {
    playButton: '.play-selector',
    pauseButton: '.pause-selector', 
    nextButton: '.next-selector',
    prevButton: '.prev-selector',
    title: '.track-title-selector',
    artist: '.artist-name-selector'
  }
}
```

### **Core Controls**
```javascript
play() // Start/resume playback
pause() // Pause playback  
next() // Skip to next track
previous() // Go to previous track
```

### **Metadata Extraction**
```javascript
getTrackInfo() {
  return {
    title: 'Track Title',
    artist: 'Artist Name', 
    album: 'Album Name', // optional
    artwork: ['url1', 'url2'], // optional, array of URLs
    isPlaying: true // required
  }
}
```

### **Progress Tracking**
```javascript
getCurrentTime() // Return current position in seconds
getDuration() // Return total track length in seconds  
```

## 🛠️ **Implementation Approaches**

### **Option 1: Config-Only (Simplest)**
Perfect for sites with stable, simple DOM structures:

```javascript
export class YourSiteHandler extends SiteHandler {
  static config = {
    name: 'Your Site',
    urlPatterns: ['yoursite.com'],
    selectors: {
      playButton: '.play-btn',
      title: '.track-title'
      // ... all required selectors
    }
  }
  
  // No custom methods needed - base class handles everything!
}
```

### **Option 2: Selective Overrides (Recommended)**
Override only the methods that need custom logic:

```javascript
export class YourSiteHandler extends SiteHandler {
  static config = { /* ... */ }
  
  // Custom logic for complex play/pause detection
  getTrackInfo() {
    if (this.isPodcastMode()) {
      return this.extractPodcastInfo();
    }
    return super.getTrackInfo(); // Use config defaults
  }
}
```

### **Option 3: Full Custom Implementation (Complex Sites)**
For sites requiring extensive custom logic:

```javascript
export class YourSiteHandler extends SiteHandler {
  static config = { /* basic info only */ }
  
  play() { /* complex site-specific logic */ }
  pause() { /* complex site-specific logic */ }
  getTrackInfo() { /* custom extraction logic */ }
  // ... override as needed
}
```

## 🧪 **Testing Guidelines**

### **Manual Testing Checklist**
- [ ] **Play/Pause** commands work reliably
- [ ] **Next/Previous** track navigation functions
- [ ] **Metadata extraction** returns correct info
- [ ] **Progress tracking** updates accurately
- [ ] **Error handling** gracefully handles failures
- [ ] **Site variations** work (logged in/out, different layouts)

### **Edge Cases to Test**
- [ ] Site not loaded yet
- [ ] User not logged in
- [ ] No audio content playing
- [ ] Ad interruptions (if applicable)
- [ ] Different player modes (playlist, radio, etc.)
- [ ] Mobile vs desktop layouts

## 📝 **Documentation Requirements**

Include in your pull request:

1. **Site handler file** (`sites/yoursite.js`)
2. **Updated manifest.json** (add host permissions)
3. **Testing notes** documenting what you tested
4. **Known limitations** or edge cases
5. **Screenshots** showing the integration working

## ❓ **Common Questions**

### **Q: What if the site uses complex authentication?**
A: Implement `isLoggedIn()` method and gracefully handle auth states.

### **Q: What if selectors change frequently?**
A: Use multiple fallback selectors in your custom implementation.

### **Q: How do I handle sites with multiple players?**
A: Implement custom logic to detect and target the active player.

### **Q: What about sites with ads?**
A: Handle ad states in your custom logic, possibly pause metadata during ads.

---

## 🤝 **Getting Help**

- **Template:** Use [site-template.md](./site-template.md) as starting point
- **Examples:** Study `soundcloud.js` implementation
- **Issues:** Open GitHub issue for technical questions
- **Testing:** Test thoroughly before submitting PR

**Remember:** Start simple with config-only approach, then add custom logic as needed!
