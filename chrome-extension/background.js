/**
 * DeskThing Media Bridge - Background Service Worker
 */

console.log('🎵 DeskThing Media Bridge background script loaded');

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('🎉 DeskThing Media Bridge installed!');
    
    // Open dashboard in new tab
    chrome.tabs.create({
      url: 'http://localhost:8080'
    });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Received message:', message);
  
  if (message.type === 'mediaUpdate') {
    // Could store data in chrome.storage for popup access
    chrome.storage.local.set({
      lastMediaData: message.data,
      lastUpdate: Date.now()
    });
  }
  
  sendResponse({ success: true });
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 DeskThing Media Bridge startup');
}); 