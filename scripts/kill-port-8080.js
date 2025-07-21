#!/usr/bin/env node

import { execSync } from 'child_process';

/**
 * Kill any processes using port 8080
 */
function killPort8080() {
  try {
    console.log('🔍 Checking for processes on port 8080...');
    
    // Find processes using port 8080
    const result = execSync('lsof -ti:8080', { encoding: 'utf8' }).trim();
    
    if (!result) {
      console.log('✅ Port 8080 is already free');
      return;
    }
    
    const pids = result.split('\n').filter(pid => pid.trim());
    console.log(`🎯 Found ${pids.length} process(es) using port 8080: ${pids.join(', ')}`);
    
    // Kill all processes
    for (const pid of pids) {
      try {
        execSync(`kill -9 ${pid}`);
        console.log(`💀 Killed process ${pid}`);
      } catch (error) {
        console.warn(`⚠️  Could not kill process ${pid}: ${error.message}`);
      }
    }
    
    console.log('✅ Port 8080 cleanup complete');
    
  } catch (error) {
    if (error.status === 1) {
      // No processes found - this is good
      console.log('✅ Port 8080 is already free');
    } else {
      console.error('❌ Error checking port 8080:', error.message);
    }
  }
}

// Check if this file is being run directly (ES module equivalent)
if (process.argv[1] === new URL(import.meta.url).pathname) {
  killPort8080();
}

export default killPort8080; 