/**
 * CACP Logger Configuration
 * 
 * Centralized configuration for all logging across CACP extension components.
 * Supports granular control over log levels per component/scope.
 */

export const loggerConfig = {
  // Global settings
  global: {
    enabled: true,
    environment: 'development', // 'development' | 'production'
    timestampFormat: 'HH:mm:ss.SSS',
    useColors: true,
    maxLogEntries: 1000, // For popup display
  },

  // Component-specific configurations
  scopes: {
    soundcloud: {
      enabled: true,
      prefix: '🎵 [SoundCloud]',
      color: '#ff5500',
      levels: {
        debug: true,   // Detailed debugging info
        info: true,    // General information
        warn: true,    // Warnings
        error: true,   // Errors
        trace: true,   // Very verbose tracing - TEMPORARILY ENABLED FOR DEBUGGING
      }
    },

    youtube: {
      enabled: true,
      prefix: '📺 [YouTube]',
      color: '#ff0000',
      levels: {
        debug: true,
        info: true,
        warn: true,
        error: true,
        trace: false,
      }
    },

    'site-detector': {
      enabled: true,
      prefix: '🔍 [SiteDetector]',
      color: '#00aa00',
      levels: {
        debug: true,   // Enable debug for troubleshooting
        info: true,
        warn: true,
        error: true,
        trace: false,
      }
    },

    'priority-manager': {
      enabled: true,
      prefix: '⚖️ [Priority]',
      color: '#0066cc',
      levels: {
        debug: false,
        info: true,
        warn: true,
        error: true,
        trace: false,
      }
    },

    'websocket-manager': {
      enabled: true,
      prefix: '🔌 [WebSocket]',
      color: '#6600cc',
      levels: {
        debug: false,  // Can be very noisy
        info: true,
        warn: true,
        error: true,
        trace: false,
      }
    },

    cacp: {
      enabled: true,
      prefix: '🎯 [CACP-Core]',
      color: '#007aff',
      levels: {
        debug: true,
        info: true,
        warn: true,
        error: true,
        trace: false,
      }
    },

    popup: {
      enabled: true,
      prefix: '🪟 [Popup]',
      color: '#cc6600',
      levels: {
        debug: false,
        info: true,
        warn: true,
        error: true,
        trace: false,
      }
    }
  },

  // Quick presets for common scenarios
  presets: {
    silent: {
      global: { enabled: false },
      overrideAll: true
    },
    
    production: {
      global: { 
        enabled: true,
        environment: 'production',
        useColors: false
      },
      scopeDefaults: {
        levels: {
          debug: false,
          info: false,
          warn: true,
          error: true,
          trace: false,
        }
      }
    },

    debug: {
      global: { enabled: true },
      scopeDefaults: {
        levels: {
          debug: true,
          info: true,
          warn: true,
          error: true,
          trace: true,
        }
      }
    },

    soundcloudOnly: {
      scopeDefaults: { enabled: false },
      scopeOverrides: {
        soundcloud: { enabled: true },
        cacp: { enabled: true }
      }
    }
  }
};

/**
 * Apply a preset configuration
 * @param {string} presetName - Name of preset to apply
 */
export function applyPreset(presetName) {
  const preset = loggerConfig.presets[presetName];
  if (!preset) {
    console.warn(`Unknown logger preset: ${presetName}`);
    return;
  }

  // Apply global overrides
  if (preset.global) {
    Object.assign(loggerConfig.global, preset.global);
  }

  // Apply scope defaults
  if (preset.scopeDefaults) {
    for (const scopeName in loggerConfig.scopes) {
      const scope = loggerConfig.scopes[scopeName];
      if (preset.scopeDefaults.enabled !== undefined) {
        scope.enabled = preset.scopeDefaults.enabled;
      }
      if (preset.scopeDefaults.levels) {
        Object.assign(scope.levels, preset.scopeDefaults.levels);
      }
    }
  }

  // Apply specific scope overrides
  if (preset.scopeOverrides) {
    for (const scopeName in preset.scopeOverrides) {
      if (loggerConfig.scopes[scopeName]) {
        Object.assign(loggerConfig.scopes[scopeName], preset.scopeOverrides[scopeName]);
      }
    }
  }

  // Handle override all
  if (preset.overrideAll) {
    for (const scopeName in loggerConfig.scopes) {
      if (preset.global?.enabled !== undefined) {
        loggerConfig.scopes[scopeName].enabled = preset.global.enabled;
      }
    }
  }
}

/**
 * Runtime configuration changes
 */
export function enableScope(scopeName) {
  if (loggerConfig.scopes[scopeName]) {
    loggerConfig.scopes[scopeName].enabled = true;
  }
}

export function disableScope(scopeName) {
  if (loggerConfig.scopes[scopeName]) {
    loggerConfig.scopes[scopeName].enabled = false;
  }
}

export function setLevel(scopeName, level, enabled) {
  if (loggerConfig.scopes[scopeName]?.levels) {
    loggerConfig.scopes[scopeName].levels[level] = enabled;
  }
}

// Quick development shortcuts (can be called from console)
if (typeof window !== 'undefined') {
  window.cacpLogger = {
    config: loggerConfig,
    applyPreset,
    enableScope,
    disableScope,
    setLevel,
    presets: Object.keys(loggerConfig.presets)
  };
} 