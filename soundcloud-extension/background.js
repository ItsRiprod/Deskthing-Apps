/**
 * DeskThing Media Bridge - Background Service Worker
 */

const manifest = chrome.runtime.getManifest();
console.log(`🎵 DeskThing Media Bridge background script loaded - v${manifest.version}`);
console.log('🔍 [Background] Extension ID:', chrome.runtime.id);

// Background script is event-driven - no polling needed!

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('🎉 DeskThing Media Bridge installed!');
    
    // Open dashboard in new tab
    chrome.tabs.create({
      url: 'http://localhost:8081'
    });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Received message:', message);
  
  if (message.type === 'mediaUpdate') {
    // Store media data for popup access
    chrome.storage.local.set({
      lastMediaData: message.data,
      lastUpdate: Date.now()
    });
    sendResponse({ success: true });
    
  } else if (message.type === 'ping') {
    // Health check from content script
    sendResponse({ success: true, status: 'healthy', timestamp: Date.now() });
    
  } else {
    sendResponse({ success: true });
  }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 DeskThing Media Bridge startup');
}); 