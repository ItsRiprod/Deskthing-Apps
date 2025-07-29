/**
 * Browser Console Formatter for CACP Logger
 * Beautiful console output with emoji, colors, and context trees
 */

import { COMPONENT_SCHEME, LEVEL_SCHEME } from '../config/component-schemes.js';

/**
 * Create browser console formatter for a specific component
 * @param {string} componentName - Component identifier
 * @param {Object} logStore - Optional log store for capturing logs
 * @returns {Object} Stream-like object for Pino
 */
export const createBrowserFormatter = (componentName, logStore = null) => {
  const component = COMPONENT_SCHEME[componentName] || COMPONENT_SCHEME['cacp'];
  
  return {
    write: (data) => {
      try {
        const logData = typeof data === 'string' ? JSON.parse(data) : data;
        const level = LEVEL_SCHEME[logData.level] || LEVEL_SCHEME[30];
        const timestamp = new Date(logData.time).toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3
        });
        
        // Format like: "15:31:42 ✨ [SOUNDCLOUD] Site detection complete"
        const message = logData.msg || '';
        const componentName = component.name.toUpperCase().replace(/([a-z])([A-Z])/g, '$1-$2');
        
        // Use browser console styling to match the new bracket format
        console.log(
          `%c${timestamp} %c${level.emoji} %c[${componentName}] %c${message}`,
          'color: #888; font-family: monospace;',                    // timestamp
          `color: ${level.color}; font-size: 14px;`,                 // level emoji  
          `color: ${component.color}; font-weight: bold;`,           // [COMPONENT-NAME]
          'color: inherit;'                                          // message
        );

        // Extract and display additional context data (the missing JSON payloads!)
        const excludeKeys = new Set(['level', 'time', 'msg', 'name', 'pid', 'hostname', 'v']);
        const contextData = {};
        
        Object.keys(logData).forEach(key => {
          if (!excludeKeys.has(key)) {
            contextData[key] = logData[key];
          }
        });

        // Show context data if present
        if (Object.keys(contextData).length > 0) {
          // Format context data with tree-like structure
          Object.entries(contextData).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              console.log(`   ├─ %c${key}:`, 'color: #00C896; font-weight: bold;', value);
            } else {
              console.log(`   ├─ %c${key}: %c${value}`, 'color: #00C896; font-weight: bold;', 'color: inherit;');
            }
          });
        }
        
        // Show error stack trace if present
        if (logData.err && logData.err.stack) {
          console.error('   ╰─ Error Stack:');
          console.error(logData.err.stack);
        }

        // Store log if logStore provided
        if (logStore) {
          logStore.add(logData);
        }
        
      } catch (error) {
        // Fallback for malformed data
        console.log(data);
        if (logStore) {
          logStore.add({ 
            level: 50, 
            time: Date.now(), 
            msg: 'Logger formatting error', 
            error: error.message,
            data 
          });
        }
      }
    }
  };
};