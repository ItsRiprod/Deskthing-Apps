/**
 * CACP Chrome Extension - Background Script
 * 
 * Handles extension lifecycle and background tasks.
 */

import { logger } from './logger.js';

// Initialize logger
const backgroundLogger = logger.cacp.child({ component: 'background' });

backgroundLogger.info('CACP Background service worker started', {
  version: chrome.runtime.getManifest().version,
  timestamp: Date.now()
});

// Handle extension installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  backgroundLogger.info('Extension lifecycle event', {
    reason: details.reason,
    previousVersion: details.previousVersion,
    id: details.id
  });
  
  if (details.reason === 'install') {
    backgroundLogger.info('First-time CACP installation detected');
    // Set default settings if needed
  } else if (details.reason === 'update') {
    backgroundLogger.info('CACP extension updated', {
      fromVersion: details.previousVersion,
      toVersion: chrome.runtime.getManifest().version
    });
    // Handle updates if needed
  }
});

// Handle tab updates to inject content scripts if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is a supported streaming site
    const supportedDomains = [
      'soundcloud.com',
      'youtube.com',
      'music.youtube.com',
      'open.spotify.com',
      'music.apple.com'
    ];
    
    const isSupported = supportedDomains.some(domain => tab.url.includes(domain));
    
    if (isSupported) {
      const matchedDomain = supportedDomains.find(domain => tab.url.includes(domain));
      backgroundLogger.debug('Supported streaming site detected', {
        tabId,
        url: tab.url,
        domain: matchedDomain,
        title: tab.title
      });
      // Content scripts are automatically injected via manifest
    }
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  backgroundLogger.debug('Message received from content script', {
    messageType: message.type,
    tabUrl: sender.tab?.url,
    tabId: sender.tab?.id,
    hasData: !!message.data
  });
  
  switch (message.type) {
    case 'get-status':
      // Return extension status
      backgroundLogger.trace('Status request handled');
      sendResponse({
        status: 'active',
        version: chrome.runtime.getManifest().version
      });
      break;
      
    case 'site-detected':
      backgroundLogger.info('Site detection notification', {
        siteName: message.siteName,
        tabUrl: sender.tab?.url,
        tabId: sender.tab?.id
      });
      break;
      
    case 'error':
      backgroundLogger.error('Content script error reported', {
        error: message.error,
        tabUrl: sender.tab?.url,
        tabId: sender.tab?.id,
        context: message.context
      });
      break;
      
    default:
      backgroundLogger.warn('Unknown message type received', {
        messageType: message.type,
        tabUrl: sender.tab?.url,
        fullMessage: message
      });
  }
  
  return true; // Keep message channel open for async responses
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  backgroundLogger.info('CACP extension startup event', {
    version: chrome.runtime.getManifest().version
  });
});

// Monitor storage changes (for settings sync)
chrome.storage.onChanged.addListener((changes, namespace) => {
  backgroundLogger.debug('Chrome storage changed', {
    namespace,
    changedKeys: Object.keys(changes),
    changes: Object.fromEntries(
      Object.entries(changes).map(([key, change]) => [
        key,
        { hasOldValue: 'oldValue' in change, hasNewValue: 'newValue' in change }
      ])
    )
  });
  
  if (changes['cacp-site-priorities']) {
    backgroundLogger.info('Site priorities configuration updated', {
      oldValue: changes['cacp-site-priorities'].oldValue,
      newValue: changes['cacp-site-priorities'].newValue
    });
    // Notify content scripts of priority changes if needed
  }
});

// Keep service worker alive (if needed)
let keepAliveInterval = null;

function keepServiceWorkerAlive() {
  keepAliveInterval = setInterval(() => {
    chrome.runtime.getPlatformInfo(() => {
      // Simple operation to keep service worker active
    });
  }, 25000); // Every 25 seconds
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// Start keep-alive mechanism
keepServiceWorkerAlive();

console.log('[CACP Background] Background script initialized'); 