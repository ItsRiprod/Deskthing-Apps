/**
 * CACP Extension Test Script
 * 
 * Manual testing script to validate CACP functionality.
 * Run this in browser console on supported sites.
 */

window.CACPTest = {
  // Test configuration
  config: {
    testDuration: 10000, // 10 seconds
    logLevel: 'debug'
  },

  // Test results
  results: {
    initialization: false,
    siteDetection: false,
    handlerActivation: false,
    mediaExtraction: false,
    controls: {
      play: false,
      pause: false,
      next: false,
      previous: false
    },
    communication: {
      popup: false,
      websocket: false
    }
  },

  /**
   * Run all CACP tests
   */
  async runAllTests() {
    try {
      const extVersion = chrome?.runtime?.getManifest?.().version || 'unknown';
      console.log(`🎯 CACP Extension v${extVersion} Test Suite Starting...`);
    } catch {
      console.log('🎯 CACP Extension Test Suite Starting...');
    }
    console.log('Current URL:', window.location.href);
    
    try {
      // Test 1: Check CACP initialization
      await this.testInitialization();
      
      // Test 2: Test site detection
      await this.testSiteDetection();
      
      // Test 3: Test handler activation
      await this.testHandlerActivation();
      
      // Test 4: Test media extraction
      await this.testMediaExtraction();
      
      // Test 5: Test controls
      await this.testControls();
      
      // Test 6: Test communication
      await this.testCommunication();
      
      // Print results
      this.printResults();
      
    } catch (error) {
      console.error('🔥 CACP Test Suite Failed:', error);
    }
  },

  /**
   * Test CACP initialization
   */
  async testInitialization() {
    console.log('📋 Testing CACP initialization...');
    
    // Wait for CACP to load
    await this.waitFor(() => window.CACP, 5000, 'CACP global object');
    
    if (window.CACP) {
      console.log('✅ CACP global object found');
      this.results.initialization = true;
      
      // Check if initialized
      const status = window.CACP.getStatus();
      if (status.isInitialized) {
        console.log('✅ CACP is initialized');
      } else {
        console.warn('⚠️ CACP object exists but not initialized');
      }
    } else {
      console.error('❌ CACP global object not found');
    }
  },

  /**
   * Test site detection
   */
  async testSiteDetection() {
    console.log('📋 Testing site detection...');
    
    if (!window.CACP) {
      console.error('❌ CACP not available for site detection test');
      return;
    }
    
    const status = window.CACP.getStatus();
    
    if (status.siteDetector) {
      const matchedHandlers = status.siteDetector.matchedHandlers || [];
      const registeredHandlers = status.siteDetector.registeredHandlers || [];
      
      console.log(`📊 Registered handlers: ${registeredHandlers.length}`);
      console.log(`📊 Matched handlers: ${matchedHandlers.length}`);
      
      if (registeredHandlers.length > 0) {
        console.log('✅ Site handlers registered');
        registeredHandlers.forEach(handler => {
          console.log(`  - ${handler.name} (priority: ${handler.priority})`);
        });
      }
      
      if (matchedHandlers.length > 0) {
        console.log('✅ Site detection working');
        this.results.siteDetection = true;
        
        matchedHandlers.forEach(handler => {
          console.log(`  - ${handler.name} matches current URL`);
        });
      } else {
        console.warn('⚠️ No handlers match current URL');
      }
    }
  },

  /**
   * Test handler activation
   */
  async testHandlerActivation() {
    console.log('📋 Testing handler activation...');
    
    if (!window.CACP) return;
    
    const status = window.CACP.getStatus();
    
    if (status.hasActiveHandler && status.activeSiteName) {
      console.log(`✅ Handler activated: ${status.activeSiteName}`);
      this.results.handlerActivation = true;
    } else {
      console.warn('⚠️ No active handler found');
    }
  },

  /**
   * Test media extraction
   */
  async testMediaExtraction() {
    console.log('📋 Testing media extraction...');
    
    if (!window.CACP) return;
    
    const status = window.CACP.getStatus();
    
    if (status.lastMediaData) {
      console.log('✅ Media data extraction working');
      console.log('📊 Current media:', {
        title: status.lastMediaData.title,
        artist: status.lastMediaData.artist,
        site: status.lastMediaData.site,
        isPlaying: status.lastMediaData.isPlaying
      });
      this.results.mediaExtraction = true;
    } else {
      console.warn('⚠️ No media data found');
    }
  },

  /**
   * Test control commands
   */
  async testControls() {
    console.log('📋 Testing control commands...');
    
    if (!window.CACP || !window.CACP.currentHandler) {
      console.warn('⚠️ No active handler for control testing');
      return;
    }
    
    const handler = window.CACP.currentHandler;
    
    // Test each control method
    const controls = ['play', 'pause', 'next', 'previous'];
    
    for (const control of controls) {
      try {
        if (typeof handler[control] === 'function') {
          console.log(`✅ ${control} method available`);
          this.results.controls[control] = true;
        } else {
          console.warn(`⚠️ ${control} method not available`);
        }
      } catch (error) {
        console.error(`❌ ${control} test failed:`, error);
      }
    }
  },

  /**
   * Test communication systems
   */
  async testCommunication() {
    console.log('📋 Testing communication systems...');
    
    // Test WebSocket status
    if (window.CACP) {
      const status = window.CACP.getStatus();
      
      if (status.websocketManager) {
        if (status.websocketManager.isConnected) {
          console.log('✅ WebSocket connected to DeskThing');
          this.results.communication.websocket = true;
        } else {
          console.warn('⚠️ WebSocket not connected');
        }
      }
    }
    
    // Test popup communication (if popup is open)
    try {
      chrome.runtime.sendMessage({ type: 'test-communication' }, response => {
        if (response) {
          console.log('✅ Extension communication working');
          this.results.communication.popup = true;
        }
      });
    } catch (error) {
      console.warn('⚠️ Extension communication not available (normal in content script)');
    }
  },

  /**
   * Wait for condition with timeout
   */
  async waitFor(condition, timeout = 5000, description = 'condition') {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error(`Timeout waiting for ${description}`);
  },

  /**
   * Print test results
   */
  printResults() {
    console.log('\n🎯 CACP Test Results Summary:');
    console.log('================================');
    
    const passed = Object.values(this.results).filter(r => 
      typeof r === 'boolean' ? r : Object.values(r).some(v => v)
    ).length;
    
    const total = Object.keys(this.results).length;
    
    console.log(`📊 Overall: ${passed}/${total} test categories passed`);
    console.log('\n📋 Detailed Results:');
    
    Object.entries(this.results).forEach(([test, result]) => {
      if (typeof result === 'boolean') {
        console.log(`  ${result ? '✅' : '❌'} ${test}: ${result}`);
      } else {
        const subPassed = Object.values(result).filter(v => v).length;
        const subTotal = Object.keys(result).length;
        console.log(`  📊 ${test}: ${subPassed}/${subTotal} passed`);
        
        Object.entries(result).forEach(([subTest, subResult]) => {
          console.log(`    ${subResult ? '✅' : '❌'} ${subTest}: ${subResult}`);
        });
      }
    });
    
    try {
      const extVersion = chrome?.runtime?.getManifest?.().version || 'unknown';
      console.log(`\n🎯 CACP Extension v${extVersion} Test Suite Complete!`);
    } catch {
      console.log('\n🎯 CACP Test Suite Complete!');
    }
  },

  /**
   * Get current CACP status
   */
  getStatus() {
    if (window.CACP) {
      return window.CACP.getStatus();
    }
    return null;
  }
};

// Auto-run tests after 3 seconds if CACP is detected
setTimeout(() => {
  if (window.CACP) {
    console.log('🎯 CACP detected! Run CACPTest.runAllTests() to test functionality');
  } else {
    console.log('⚠️ CACP not detected. Make sure extension is loaded on a supported site.');
  }
}, 3000);

console.log('🎯 CACP Test Suite loaded. Use CACPTest.runAllTests() to begin testing.'); 