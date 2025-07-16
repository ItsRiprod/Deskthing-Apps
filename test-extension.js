#!/usr/bin/env node

/**
 * Extension Connectivity Test Script
 * Tests if the Chrome extension is loaded and working
 */

const fetch = require('node-fetch');

const DASHBOARD_URL = 'http://localhost:8080';

async function testExtensionConnectivity() {
  console.log('🔍 Testing Chrome Extension Connectivity...\n');
  
  try {
    // Test 1: Can we reach the dashboard server?
    console.log('1. Testing dashboard server connectivity...');
    const pingResponse = await fetch(`${DASHBOARD_URL}/api/ping`);
    if (pingResponse.ok) {
      const data = await pingResponse.json();
      console.log('✅ Dashboard server is reachable:', data.message);
      console.log('   Server version:', data.serverVersion);
    } else {
      console.log('❌ Dashboard server not reachable');
      return;
    }
    
    // Test 2: Check media status
    console.log('\n2. Testing media status endpoint...');
    const statusResponse = await fetch(`${DASHBOARD_URL}/api/media/status`);
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Media status endpoint working');
      console.log('   Current media detected:', !!statusData.data);
      if (statusData.data) {
        console.log('   Title:', statusData.data.title);
        console.log('   Artist:', statusData.data.artist);
        console.log('   Source:', statusData.data.source);
        console.log('   Duration:', statusData.data.duration);
        console.log('   Position:', statusData.data.position);
        console.log('   Is Playing:', statusData.data.isPlaying);
      }
    }
    
    // Test 3: Test posting data like the extension would
    console.log('\n3. Testing extension data posting...');
    const testData = {
      title: 'Test Track',
      artist: 'Test Artist',
      isPlaying: true,
      duration: 180,
      position: 30,
      method: 'Test Script',
      version: '2.0',
      timestamp: Date.now()
    };
    
    const postResponse = await fetch(`${DASHBOARD_URL}/api/obs-nowplaying`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DeskThing-Test-Script'
      },
      body: JSON.stringify(testData)
    });
    
    if (postResponse.ok) {
      console.log('✅ Extension endpoint accepts data successfully');
    } else {
      console.log('❌ Extension endpoint rejected data');
    }
    
    console.log('\n📋 Instructions to check extension status:');
    console.log('1. Open Chrome and go to: chrome://extensions/');
    console.log('2. Make sure "DeskThing Media Bridge" is enabled');
    console.log('3. Check the version number (should be 2.0)');
    console.log('4. Go to SoundCloud and open DevTools (F12)');
    console.log('5. Look for these logs in Console:');
    console.log('   - "🎵 DeskThing Media Bridge v2.0 loaded on: soundcloud.com"');
    console.log('   - "📤 Sending enhanced media data v2.0:"');
    console.log('6. If no logs appear, the extension needs to be reloaded');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testExtensionConnectivity(); 