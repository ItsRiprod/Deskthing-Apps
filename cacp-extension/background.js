/**
 * CACP Chrome Extension - Background Script
 * 
 * Handles extension lifecycle and background tasks.
 */

console.log('[CACP Background] Service worker started');

// Handle extension installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[CACP Background] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    console.log('[CACP Background] First-time installation');
    // Set default settings if needed
  } else if (details.reason === 'update') {
    console.log('[CACP Background] Extension updated');
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
      console.log(`[CACP Background] Supported site detected: ${tab.url}`);
      // Content scripts are automatically injected via manifest
    }
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[CACP Background] Message received:', message, 'from:', sender.tab?.url);
  
  switch (message.type) {
    case 'get-status':
      // Return extension status
      sendResponse({
        status: 'active',
        version: chrome.runtime.getManifest().version
      });
      break;
      
    case 'site-detected':
      console.log(`[CACP Background] Site detected: ${message.siteName}`);
      break;
      
    case 'error':
      console.error(`[CACP Background] Error from ${sender.tab?.url}:`, message.error);
      break;
      
    default:
      console.log(`[CACP Background] Unknown message type: ${message.type}`);
  }
  
  return true; // Keep message channel open for async responses
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('[CACP Background] Extension startup');
});

// Monitor storage changes (for settings sync)
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log('[CACP Background] Storage changed:', changes, 'in namespace:', namespace);
  
  if (changes['cacp-site-priorities']) {
    console.log('[CACP Background] Site priorities updated');
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