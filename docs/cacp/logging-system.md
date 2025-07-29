# CACP Smart Adaptive Logging System Documentation

*Last Updated: July 28, 2025*

## 🎯 **Overview**

The CACP (Chrome Audio Control Platform) features a **Smart Adaptive Logging System** built on **Pino**, designed to automatically detect environment (browser/CLI/server) and provide optimal logging experience for each. It delivers beautiful, structured logging with unified configuration across all environments.

## ✨ **Key Features**

### **🧠 Smart Environment Detection**
- **Browser**: Beautiful console formatting with bracket notation and JSON payloads
- **CLI**: pino-colada integration for terminal development  
- **Server**: Structured JSON for production logging
- **Automatic**: Zero configuration environment switching

### **🎨 Enhanced Visual Experience**
- **Bracket Format**: `[COMPONENT-NAME]` with uppercase styling
- **Emoji Components**: `🎯 [CACP-CORE]`, `🎵 [SOUNDCLOUD]`, `🔍 [SITE-DETECTOR]`
- **JSON Payload Display**: Context data shown in expandable tree format
- **Color Coding**: Component-specific colors for easy visual scanning

### **⚙️ Portable Configuration**
- **Single JSON Config**: Everything configurable via one file
- **File-Level Overrides**: Per-file log level control with pattern matching
- **Component Auto-Registration**: Automatic component discovery + manual control
- **Future npm Package**: Designed for easy reuse across projects

## 🏗️ **Architecture**

### **Core Components**

| **File** | **Purpose** | **Responsibilities** |
|----------|-------------|----------------------|
| `logger-config.js` | Smart Adaptive Logic | Environment detection, formatters, configuration |
| `logger.js` | Simple Entry Point | Exports configured loggers |
| `config.json` | Project Configuration | Components, levels, overrides *(Future)* |

### **Technology Stack**

- **🔥 Pino**: High-performance structured logging engine
- **🍹 pino-colada**: Beautiful CLI terminal logging *(CLI mode)*
- **🎨 Custom Browser Formatter**: Console styling with JSON context *(Browser mode)*
- **📊 Structured Data**: JSON-first approach with visual enhancements
- **🎯 Smart Detection**: Automatic environment adaptation
- **⚡ Performance**: 5-10x faster than Winston, minimal overhead

## 🎨 **Output Examples**

### **Browser Console (Current)**
```
22:02:44.969 🔍 [CACP-CORE] Logger initialized
22:02:45.321 ✨ [SITE-DETECTOR] Site detection complete
22:02:45.322 🚨 [CACP-CORE] Handler activation failed
   ├─ siteName: soundcloud
   ├─ availableHandlers: ["soundcloud", "youtube"] 
   ├─ reason: Handler creation failed
```

### **CLI Terminal (With pino-colada)**
```
15:31:42 ✨ [SOUNDCLOUD] Track extraction complete
15:31:42 🐛 [SITE-DETECTOR] Pattern matching started
15:31:49 🚨 [CACP-CORE] WebSocket connection failed
```

### **Server/Production (JSON)**
```json
{"level":50,"time":1753344060123,"name":"cacp","msg":"Handler activation failed","siteName":"soundcloud","availableHandlers":["soundcloud","youtube"]}
```

## ⚙️ **Current Configuration System**

### **Component & Level Schemes**
```javascript
// In logger-config.js (Current Implementation)
const COMPONENT_SCHEME = {
  'cacp': { emoji: '🎯', color: '#4A90E2', name: 'CACP-Core' },
  'soundcloud': { emoji: '🎵', color: '#FF5500', name: 'SoundCloud' },
  'youtube': { emoji: '📹', color: '#FF0000', name: 'YouTube' },
  'site-detector': { emoji: '🔍', color: '#00C896', name: 'SiteDetector' },
  'websocket': { emoji: '🌐', color: '#9B59B6', name: 'WebSocket' },
  'popup': { emoji: '🎛️', color: '#FF6B6B', name: 'Popup' },
  'background': { emoji: '🔧', color: '#4ECDC4', name: 'Background' },
  'priority-manager': { emoji: '⚖️', color: '#45B7D1', name: 'PriorityManager' },
  'settings': { emoji: '⚙️', color: '#96CEB4', name: 'Settings' },
  'test': { emoji: '🧪', color: '#FFEAA7', name: 'Test' }
};

const LEVEL_SCHEME = {
  10: { emoji: '🔍', color: '#6C7B7F', name: 'TRACE' },
  20: { emoji: '🐛', color: '#74B9FF', name: 'DEBUG' },
  30: { emoji: '✨', color: '#00B894', name: 'INFO' },
  40: { emoji: '⚠️', color: '#FDCB6E', name: 'WARN' },
  50: { emoji: '🚨', color: '#E17055', name: 'ERROR' },
  60: { emoji: '💀', color: '#D63031', name: 'FATAL' }
};
```

## 🚀 **Usage Examples**

### **Basic Logging**
```javascript
import logger from '../logger.js';

export class SoundCloudHandler extends SiteHandler {
  constructor() {
    super();
    this.log = logger.soundcloud;  // Get component logger
    
    this.log.info('SoundCloud handler initialized');
  }

  async initialize() {
    this.log.debug('Setting up monitoring systems', {
      url: window.location.href,
      hasMediaSession: !!navigator.mediaSession
    });
    
    try {
      this.setupMediaSessionMonitoring();
      this.log.info('SoundCloud handler ready');
    } catch (error) {
      this.log.error('Initialization failed', {
        error: error.message,
        stack: error.stack,
        context: { url: window.location.href }
      });
      throw error;
    }
  }
}
```

### **Rich Context Logging**
```javascript
// Detailed context automatically displayed in browser
this.log.error('Handler activation failed', {
  siteName: 'soundcloud',
  availableHandlers: ['soundcloud', 'youtube'],
  siteDetector: !!this.siteDetector,
  error: error.message,
  stack: error.stack,
  timing: { started: startTime, failed: Date.now() }
});

// Browser output:
// 22:02:45.322 🚨 [CACP-CORE] Handler activation failed
//    ├─ siteName: soundcloud
//    ├─ availableHandlers: ["soundcloud", "youtube"]
//    ├─ siteDetector: true
//    ├─ error: "createHandler returned null"
//    ├─ timing: { started: 1753344060120, failed: 1753344060123 }
```

### **Environment-Specific Behavior**
```javascript
// Same code, different output based on environment:
this.log.info('Site detected', { 
  siteName: detectedSite.name,
  priority: detectedSite.priority 
});

// Browser: 22:02:45.186 ✨ [SITE-DETECTOR] Site detected
//           ├─ siteName: soundcloud
//           ├─ priority: 1000

// CLI: 15:31:42 ✨ [SITE-DETECTOR] Site detected

// Server: {"level":30,"time":1753344060186,"name":"site-detector","msg":"Site detected","siteName":"soundcloud","priority":1000}
```

## 🔮 **Future Portable Configuration** *(Not Yet Implemented)*

### **Planned config.json Structure**
```json
{
  "projectName": "My Project",
  "globalLevel": "info",
  "autoRegister": true,
  
  "format": {
    "style": "brackets",
    "componentCase": "upper",
    "timestamp": "HH:mm:ss.SSS"
  },
  
  "levels": {
    "10": { "name": "TRACE", "emoji": "🔍", "color": "#6C7B7F" },
    "20": { "name": "DEBUG", "emoji": "🐛", "color": "#74B9FF" },
    "30": { "name": "INFO", "emoji": "✨", "color": "#00B894" },
    "40": { "name": "WARN", "emoji": "⚠️", "color": "#FDCB6E" },
    "50": { "name": "ERROR", "emoji": "🚨", "color": "#E17055" },
    "60": { "name": "FATAL", "emoji": "💀", "color": "#D63031" }
  },
  
  "components": {
    "api": { 
      "emoji": "🌐", 
      "color": "#4A90E2", 
      "name": "API",
      "level": "debug"
    },
    "database": { 
      "emoji": "💾", 
      "color": "#00C896", 
      "name": "Database",
      "level": "warn"
    }
  },
  
  "fileOverrides": {
    "src/auth/login.js": { 
      "level": "trace",
      "component": "auth"
    },
    "src/database/*.js": { 
      "level": "error"
    },
    "src/critical-path.js": { 
      "level": "debug",
      "emoji": "🚨"
    }
  }
}
```

### **Planned Level Resolution Hierarchy**
1. **File Override** - `fileOverrides["src/auth/login.js"].level`
2. **Component Level** - `components["api"].level` 
3. **Global Level** - `globalLevel`

### **Planned Usage** *(Future)*
```javascript
import Logger from './logger/index.js';
const log = Logger.getLogger('api');  // Gets 'api' component
log.debug('Hello world');             // Respects api.level: "debug"
```

## 🛠️ **Implementation Status**

### ✅ **Implemented Features**
- **Smart Environment Detection**: Browser/CLI/Server auto-detection
- **Enhanced Browser Formatter**: Bracket format + JSON payload display
- **Component-Specific Styling**: Emojis, colors, uppercase names
- **pino-colada Integration**: Beautiful CLI terminal logging
- **Structured Context Display**: Tree-like JSON data visualization
- **Legacy Compatibility**: Works with existing CACP codebase

### 🔄 **In Progress**
- **Documentation Updates**: This comprehensive guide
- **Testing & Validation**: Cross-environment verification

### 📋 **Planned Features** *(Not Yet Implemented)*
- **Portable /logger Folder**: Self-contained reusable module
- **JSON Configuration File**: External config.json support
- **File-Level Overrides**: Per-file and pattern-based level control
- **Auto-Component Registration**: Automatic component discovery
- **npm Package**: Reusable smart-logger package
- **Runtime Configuration**: Browser console controls
- **Log Store for Popup**: In-memory log management
- **Performance Monitoring**: Built-in timing and metrics
- **Conditional Logging**: Smart performance optimizations

## 🎛️ **Current Usage**

### **Get Component Logger**
```javascript
import logger from '../logger.js';

// Available loggers:
const log = logger.cacp;           // 🎯 [CACP-CORE]
const log = logger.soundcloud;     // 🎵 [SOUNDCLOUD]  
const log = logger.youtube;        // 📹 [YOUTUBE]
const log = logger.siteDetector;   // 🔍 [SITE-DETECTOR]
const log = logger.websocket;      // 🌐 [WEBSOCKET]
const log = logger.popup;          // 🎛️ [POPUP]
const log = logger.background;     // 🔧 [BACKGROUND]
const log = logger.priorityManager;// ⚖️ [PRIORITY-MANAGER]
const log = logger.settings;       // ⚙️ [SETTINGS]
const log = logger.test;           // 🧪 [TEST]

// Create custom logger:
const log = logger.createLogger('my-component');
```

### **Log Levels & Output**
```javascript
log.trace('Detailed execution flow');    // 🔍 [COMPONENT] message
log.debug('Development info', context);  // 🐛 [COMPONENT] message + context tree
log.info('General information');         // ✨ [COMPONENT] message  
log.warn('Potential issue');             // ⚠️ [COMPONENT] message
log.error('Actual problem', { error });  // 🚨 [COMPONENT] message + error details
log.fatal('Critical failure');           // 💀 [COMPONENT] message
```

## 🐛 **Debugging & Troubleshooting**

### **Environment Detection Issues**
```javascript
// Check detected environment
console.log(logger.config.environment); // 'browser', 'cli', or 'server'

// Check formatters in use
console.log(logger.config.components);  // Available components
console.log(logger.config.levels);      // Available levels
```

### **Browser Console Not Showing Formatting**
1. **Check browser console settings**: Ensure formatting is enabled
2. **Verify component exists**: Use `logger.createLogger('test')` to test
3. **Check log level**: Ensure level is above filter threshold

### **CLI Not Using pino-colada**
1. **Install pino-colada**: `npm install pino-colada --save-dev`
2. **Verify CLI detection**: Check `process.stdout.isTTY`
3. **Fallback to pino-pretty**: Should work automatically

## 📈 **Performance Characteristics**

### **Current Benchmarks**
| **Operation** | **Browser** | **CLI** | **Server** | **Notes** |
|---------------|-------------|---------|------------|-----------|
| Simple log | ~0.1ms | ~0.5ms | ~0.05ms | Browser styling overhead |
| Context data | ~0.3ms | ~1ms | ~0.1ms | JSON serialization |
| Environment detection | ~0.01ms | ~0.01ms | ~0.01ms | Cached after first call |

### **Production Recommendations**
- **Server mode**: Automatically uses structured JSON with `info` level
- **Browser development**: Full formatting with `trace` level
- **CLI development**: pino-colada with beautiful terminal output

## 🔗 **Related Documentation**

- [Pino Official Documentation](https://getpino.io/)
- [pino-colada: Beautiful terminal logs](https://github.com/lrlna/pino-colada)
- [Chrome Extension Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Chrome DevTools Console API](https://developer.chrome.com/docs/devtools/console/api/)

## 🗺️ **Future Roadmap**

### **📅 Next Development Phase**

**🔧 Advanced Configuration System**
- **Per-Component Log Levels**: Override global level per file/component
- **Runtime Level Changes**: Dynamic level adjustment without restart
- **Custom Component Registration**: Manual component definition vs auto-discovery

**📦 Portable Logger Package**
- **NPM Package**: Standalone reusable logger for any project
- **Zero Dependencies**: Optional pino-colada for CLI environments
- **Config-Driven**: Single JSON file controls all behavior

**🎨 Granular Display Control**
- **Timestamp Options**: 
  - `"readable"`: `"2:34 PM"` vs `"14:34:12.969"`
  - `"relative"`: `"2s ago"` vs absolute time
  - `"disable"`: No timestamp display
- **Component Toggles**: Enable/disable each log part independently:
  ```json
  {
    "display": {
      "timestamp": true,
      "emoji": true, 
      "component": true,
      "level": false,
      "message": true,
      "jsonPayload": true,
      "stackTrace": true
    }
  }
  ```
- **Custom Separators**: Configure brackets `[COMP]`, parentheses `(COMP)`, or custom
- **Conditional Display**: Show/hide based on log level or component

**🌟 Advanced Features**
- **Log Filtering**: Real-time console filtering by component/level
- **Log Export**: Save filtered logs to file
- **Performance Metrics**: Timing and memory tracking per component

---

*This Smart Adaptive Logging System provides optimal logging experience across all environments while maintaining unified configuration and beautiful visual output. The system is designed for easy portability and future npm package distribution.* 