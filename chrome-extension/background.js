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
    // Store media data for popup access
    chrome.storage.local.set({
      lastMediaData: message.data,
      lastUpdate: Date.now()
    });
    sendResponse({ success: true });
    
  } else if (message.type === 'mediaControl') {
    // 🚀 NEW: Cross-window media control coordination
    handleCrossWindowControl(message.command, sendResponse);
    return true; // Keep response channel open for async response
    
  } else if (message.type === 'findMediaTabs') {
    // 🚀 NEW: Find active media tabs across all windows
    findActiveMediaTabs(sendResponse);
    return true; // Keep response channel open for async response
    
  } else {
    sendResponse({ success: true });
  }
});

/**
 * 🚀 BREAKTHROUGH FEATURE: Cross-window media control coordination
 * This solves the MediaSession window-scoped limitation!
 */
async function handleCrossWindowControl(command, sendResponse) {
  console.log(`🎮 [Background] Cross-window control request: ${command}`);
  
  try {
    // Find all media-capable tabs across ALL Chrome windows
    const mediaTabs = await chrome.tabs.query({
      url: [
        '*://music.youtube.com/*',
        '*://www.youtube.com/*', 
        '*://youtube.com/*',
        '*://soundcloud.com/*',
        '*://www.soundcloud.com/*',
        '*://open.spotify.com/*',
        '*://music.apple.com/*',
        '*://pandora.com/*',
        '*://www.pandora.com/*',
        '*://twitch.tv/*',
        '*://www.twitch.tv/*'
      ]
    });
    
    console.log(`🔍 [Background] Found ${mediaTabs.length} potential media tabs across all windows`);
    
    if (mediaTabs.length === 0) {
      sendResponse({ 
        success: false, 
        error: 'No media tabs found',
        method: 'cross-window-coordination'
      });
      return;
    }
    
    // Send control command to all potential media tabs
    let successCount = 0;
    let responses = [];
    
    for (const tab of mediaTabs) {
      try {
        console.log(`📤 [Background] Sending ${command} to tab ${tab.id} (${tab.url.substring(0, 50)}...)`);
        
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'executeMediaControl',
          command: command,
          source: 'cross-window-coordination'
        });
        
        if (response && response.success) {
          successCount++;
          responses.push({
            tabId: tab.id,
            url: tab.url,
            response: response
          });
          console.log(`✅ [Background] Command executed successfully in tab ${tab.id}`);
        }
        
      } catch (error) {
        // Tab might not have content script or be ready - that's OK
        console.log(`⚠️ [Background] Could not send to tab ${tab.id}: ${error.message}`);
      }
    }
    
    if (successCount > 0) {
      sendResponse({
        success: true,
        command: command,
        tabsFound: mediaTabs.length,
        tabsResponded: successCount,
        method: 'cross-window-coordination',
        responses: responses
      });
    } else {
      sendResponse({
        success: false,
        error: 'No tabs responded to control command',
        tabsFound: mediaTabs.length,
        method: 'cross-window-coordination'
      });
    }
    
  } catch (error) {
    console.error('❌ [Background] Cross-window control error:', error);
    sendResponse({
      success: false,
      error: error.message,
      method: 'cross-window-coordination'
    });
  }
}

/**
 * 🔍 Find active media tabs across all Chrome windows
 */
async function findActiveMediaTabs(sendResponse) {
  try {
    const mediaTabs = await chrome.tabs.query({
      url: [
        '*://music.youtube.com/*',
        '*://www.youtube.com/*', 
        '*://youtube.com/*',
        '*://soundcloud.com/*',
        '*://www.soundcloud.com/*',
        '*://open.spotify.com/*',
        '*://music.apple.com/*',
        '*://pandora.com/*',
        '*://www.pandora.com/*',
        '*://twitch.tv/*',
        '*://www.twitch.tv/*'
      ]
    });
    
    const tabInfo = mediaTabs.map(tab => ({
      id: tab.id,
      windowId: tab.windowId,
      url: tab.url,
      title: tab.title,
      active: tab.active
    }));
    
    console.log(`🔍 [Background] Found ${mediaTabs.length} media tabs:`, tabInfo);
    
    sendResponse({
      success: true,
      tabs: tabInfo,
      count: mediaTabs.length
    });
    
  } catch (error) {
    console.error('❌ [Background] Find media tabs error:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 DeskThing Media Bridge startup');
}); 