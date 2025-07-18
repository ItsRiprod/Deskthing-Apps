/**
 * DeskThing Media Bridge - Background Service Worker
 */

const manifest = chrome.runtime.getManifest();
console.log(`🎵 DeskThing Media Bridge background script loaded - v${manifest.version}`);
console.log('🔍 [Background] Extension ID:', chrome.runtime.id);
console.log('🔍 [Background] Ready to handle cross-window coordination!');

// Add periodic heartbeat to show background script is alive
setInterval(() => {
  console.log('💓 [Background] Heartbeat - Extension background script active');
  console.log('📊 [Background] Active tabs query test...');
  
  // Test if we can query tabs
  chrome.tabs.query({}, (tabs) => {
    console.log(`📊 [Background] Found ${tabs.length} total tabs across all windows`);
    const mediaTabs = tabs.filter(tab => 
      tab.url && (
        tab.url.includes('soundcloud.com') ||
        tab.url.includes('youtube.com') ||
        tab.url.includes('spotify.com')
      )
    );
    console.log(`🎵 [Background] Found ${mediaTabs.length} potential media tabs`);
  });
}, 30000); // Every 30 seconds

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
    
  } else if (message.type === 'ping') {
    // Health check from content script
    sendResponse({ success: true, status: 'healthy', timestamp: Date.now() });
    
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
  console.log(`🔍 [Background] Starting tab discovery across all Chrome windows...`);
  
  try {
    // First, get all windows to see what we're working with
    const allWindows = await chrome.windows.getAll({ populate: true });
    console.log(`🪟 [Background] Found ${allWindows.length} total Chrome windows:`);
    allWindows.forEach(window => {
      console.log(`   Window ${window.id}: ${window.tabs?.length || 0} tabs, focused: ${window.focused}`);
    });
    
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
    
    console.log(`🔍 [Background] Found ${mediaTabs.length} potential media tabs across all windows:`);
    mediaTabs.forEach(tab => {
      console.log(`   Tab ${tab.id} (Window ${tab.windowId}): ${tab.url} - Active: ${tab.active}, Audible: ${tab.audible}`);
    });
    
    if (mediaTabs.length === 0) {
      console.log(`❌ [Background] No media tabs found - sending failure response`);
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
    let errors = [];
    
    console.log(`📤 [Background] Attempting to send command to ${mediaTabs.length} tabs...`);
    
    for (const tab of mediaTabs) {
      try {
        console.log(`📤 [Background] Sending ${command} to tab ${tab.id} (Window ${tab.windowId}): ${tab.url.substring(0, 50)}...`);
        
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'executeMediaControl',
          command: command,
          source: 'cross-window-coordination'
        });
        
        console.log(`📥 [Background] Response from tab ${tab.id}:`, response);
        
        if (response && response.success) {
          successCount++;
          responses.push({
            tabId: tab.id,
            windowId: tab.windowId,
            url: tab.url,
            response: response
          });
          console.log(`✅ [Background] Command executed successfully in tab ${tab.id}`);
        } else {
          console.log(`⚠️ [Background] Command failed in tab ${tab.id}:`, response);
        }
        
      } catch (error) {
        // Tab might not have content script or be ready - that's OK
        console.log(`❌ [Background] Could not send to tab ${tab.id}: ${error.message}`);
        errors.push({
          tabId: tab.id,
          windowId: tab.windowId,
          url: tab.url,
          error: error.message
        });
      }
    }
    
    console.log(`📊 [Background] Results: ${successCount}/${mediaTabs.length} tabs responded successfully`);
    console.log(`✅ [Background] Successful responses:`, responses);
    console.log(`❌ [Background] Errors:`, errors);
    
    if (successCount > 0) {
      const result = {
        success: true,
        command: command,
        tabsFound: mediaTabs.length,
        tabsResponded: successCount,
        method: 'cross-window-coordination',
        responses: responses,
        errors: errors
      };
      console.log(`📤 [Background] Sending success response:`, result);
      sendResponse(result);
    } else {
      const result = {
        success: false,
        error: 'No tabs responded to control command',
        tabsFound: mediaTabs.length,
        method: 'cross-window-coordination',
        errors: errors
      };
      console.log(`📤 [Background] Sending failure response:`, result);
      sendResponse(result);
    }
    
  } catch (error) {
    console.error('💥 [Background] Cross-window control error:', error);
    const result = {
      success: false,
      error: error.message,
      method: 'cross-window-coordination'
    };
    console.log(`📤 [Background] Sending error response:`, result);
    sendResponse(result);
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