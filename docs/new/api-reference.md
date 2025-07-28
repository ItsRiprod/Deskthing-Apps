# CACP API Reference

**Interface Specifications for Chrome Audio Control Platform**

---

## 🔧 **Site Handler Interface**

### **SiteHandler Base Class**

All site implementations must extend the `SiteHandler` base class:

```javascript
import { SiteHandler } from './base-handler.js';

export class YourSiteHandler extends SiteHandler {
  static config = { /* site configuration */ }
  
  // Override methods as needed
}
```

### **Required Static Configuration**

```javascript
static config = {
  // Required: Site identification
  name: string,           // Display name for the site
  urlPatterns: string[],  // Array of domain patterns to match
  
  // Required: CSS Selectors for basic functionality
  selectors: {
    playButton: string,     // Play button selector
    pauseButton: string,    // Pause button selector (can be same as play)
    nextButton: string,     // Next track button selector  
    prevButton: string,     // Previous track button selector
    title: string,          // Track title text selector
    artist: string,         // Artist name text selector
    
    // Optional: Enhanced metadata
    album?: string,         // Album name text selector
    artwork?: string,       // Album art image selector
    
    // Optional: Progress tracking  
    currentTime?: string,   // Current time display selector
    duration?: string,      // Total duration display selector
    progressBar?: string,   // Progress bar/slider selector
    
    // Optional: State detection
    playingIndicator?: string,  // Element that indicates playing state
    pausedIndicator?: string    // Element that indicates paused state
  }
}
```

### **Core Control Methods**

#### **play(): boolean**
Start or resume playback
- **Returns:** `true` if successful, `false` if failed
- **Default behavior:** Clicks `config.selectors.playButton`

#### **pause(): boolean**
Pause playback
- **Returns:** `true` if successful, `false` if failed
- **Default behavior:** Clicks `config.selectors.pauseButton`

#### **next(): boolean**
Skip to next track
- **Returns:** `true` if successful, `false` if failed
- **Default behavior:** Clicks `config.selectors.nextButton`

#### **previous(): boolean**
Go to previous track
- **Returns:** `true` if successful, `false` if failed
- **Default behavior:** Clicks `config.selectors.prevButton`

### **Metadata Extraction Methods**

#### **getTrackInfo(): TrackInfo**
Extract current track metadata
- **Returns:** `TrackInfo` object
- **Default behavior:** Extracts text from configured selectors

```javascript
// TrackInfo interface
{
  title: string,           // Required: Track title
  artist: string,          // Required: Artist name
  album?: string,          // Optional: Album name
  artwork?: string[],      // Optional: Array of artwork URLs
  isPlaying: boolean       // Required: Current playback state
}
```

### **Progress Tracking Methods**

#### **getCurrentTime(): number**
Get current playback position
- **Returns:** Position in seconds
- **Default behavior:** Parses time from `config.selectors.currentTime`

#### **getDuration(): number**
Get total track duration
- **Returns:** Duration in seconds
- **Default behavior:** Parses time from `config.selectors.duration`

### **Optional Enhancement Methods**

#### **seek(time: number): boolean**
Seek to specific position
- **Parameters:** `time` - Position in seconds
- **Returns:** `true` if successful, `false` if failed
- **Default behavior:** Not implemented (returns `false`)

#### **isReady(): boolean**
Check if site is loaded and ready
- **Returns:** `true` if ready for interaction
- **Default behavior:** Checks if play button exists

#### **isLoggedIn(): boolean**
Check user authentication status
- **Returns:** `true` if user is logged in
- **Default behavior:** Always returns `true`

---

## 📡 **WebSocket Protocol**

### **Extension → DeskThing Messages**

#### **Connection Handshake**
```javascript
{
  type: 'connection',
  source: 'chrome-extension',
  version: '1.0.1',
  site: string,           // Currently active site
  timestamp: number
}
```

#### **Media Metadata Update**
```javascript
{
  type: 'mediaData',
  site: string,           // Source site identifier
  data: {
    title: string,
    artist: string,
    album?: string,
    artwork?: string[],
    isPlaying: boolean
  },
  timestamp: number
}
```

#### **Progress Update**
```javascript
{
  type: 'timeupdate', 
  site: string,           // Source site identifier
  currentTime: number,    // Position in seconds
  duration: number,       // Total length in seconds
  isPlaying: boolean,
  timestamp: number
}
```

#### **Command Acknowledgment**
```javascript
{
  type: 'command-result',
  site: string,           // Site that executed command
  commandId: string,      // Original command ID
  success: boolean,       // Execution result
  result?: string,        // Optional result message
  timestamp: number
}
```

### **DeskThing → Extension Messages**

#### **Media Control Command**
```javascript
{
  type: 'media-command',
  action: 'play' | 'pause' | 'nexttrack' | 'previoustrack',
  id: string,             // Command identifier
  targetSite?: string,    // Optional: specific site to target
  timestamp: number
}
```

#### **Seek Command**
```javascript
{
  type: 'seek',
  time: number,           // Target position in seconds
  targetSite?: string,    // Optional: specific site to target  
  timestamp: number
}
```

#### **Health Check**
```javascript
{
  type: 'ping',
  timestamp: number
}
```

Expected response:
```javascript
{
  type: 'pong', 
  timestamp: number
}
```

---

## 🎯 **Site Detection**

### **URL Pattern Matching**
Site handlers are selected based on `config.urlPatterns`:

```javascript
// Example patterns
urlPatterns: [
  'soundcloud.com',        // Matches any subdomain
  'music.youtube.com',     // Specific subdomain only
  'open.spotify.com'       // Specific subdomain only
]
```

### **Priority Resolution**
When multiple sites match:
1. **User-defined priority** from settings
2. **Currently playing** site gets preference
3. **First match** in priority order

---

## ⚠️ **Error Handling**

### **Method Error Response**
All methods should handle errors gracefully:

```javascript
try {
  // Site-specific logic
  return true;
} catch (error) {
  console.error(`[${this.constructor.config.name}] Operation failed:`, error);
  return false; // or appropriate fallback
}
```

### **Selector Failure Fallbacks**
When selectors fail:
1. **Try alternative selectors** if available
2. **Fall back to base class** behavior
3. **Return default values** rather than throwing

### **WebSocket Connection Errors**
Extension handles connection failures with:
- **Auto-reconnection** with exponential backoff
- **Command queuing** during disconnection
- **Status reporting** via popup interface

---

**Version:** CACP v1.0.1+  
**Last Updated:** July 28, 2025
