// @ts-nocheck

import type { NowPlaying as NowPlayingType } from 'node-nowplaying'

/**
 * Modern Now Playing implementation that uses the dashboard server's real-time API
 * instead of polling. This connects to the WebSocket-powered Chrome Extension data.
 */
export class DashboardNowPlaying {
  private callback: (message: any) => void
  private isRunning = false
  private dashboardUrl = 'http://localhost:8080'
  
  constructor(callback: (message: any) => void, options?: any) {
    this.callback = callback
    console.log('🚀 [DashboardNowPlaying] Initialized with dashboard server integration')
    console.log('📡 [DashboardNowPlaying] Using real-time Chrome Extension data (no polling)')
  }
  
  /**
   * Subscribe to Now Playing updates - no longer polls, just sets up for on-demand requests
   */
  async subscribe(callback?: (message: any) => void) {
    if (callback) {
      this.callback = callback
    }
    this.isRunning = true
    console.log('✅ [DashboardNowPlaying] Subscribed to dashboard server updates')
    
    // Get initial state
    await this.fetchCurrentMedia()
  }
  
  /**
   * Unsubscribe from updates
   */
  unsubscribe() {
    this.isRunning = false
    console.log('🔌 [DashboardNowPlaying] Unsubscribed from dashboard server')
  }
  
  /**
   * Start monitoring - now event-driven instead of polling
   */
  start() {
    this.isRunning = true
    console.log('▶️ [DashboardNowPlaying] Started (event-driven, no polling)')
    this.fetchCurrentMedia()
  }
  
  /**
   * Stop monitoring
   */
  stop() {
    this.isRunning = false
    console.log('⏹️ [DashboardNowPlaying] Stopped')
  }
  
  /**
   * Fetch current media from dashboard server's real-time API
   * This uses Chrome Extension WebSocket data - no polling needed!
   */
  private async fetchCurrentMedia() {
    if (!this.isRunning || !this.callback) return
    
    try {
      console.log('📡 [DashboardNowPlaying] Fetching real-time media from dashboard server...')
      
      const response = await fetch(`${this.dashboardUrl}/api/media/status`)
      if (!response.ok) {
        console.log(`⚠️ [DashboardNowPlaying] Dashboard server response: ${response.status}`)
        return
      }
      
      const mediaData = await response.json()
      
      if (mediaData.error) {
        console.log('ℹ️ [DashboardNowPlaying] No media currently playing')
        return
      }
      
      // Convert dashboard server format to NowPlaying format
      const nowPlayingMessage = {
        trackName: mediaData.title || 'Unknown Track',
        artist: mediaData.artist ? [mediaData.artist] : ['Unknown Artist'],
        album: mediaData.album || 'Unknown Album',
        isPlaying: mediaData.isPlaying || false,
        trackDuration: mediaData.duration ? Math.floor(mediaData.duration * 1000) : 0, // Convert to ms
        trackProgress: mediaData.position ? Math.floor(mediaData.position * 1000) : 0, // Convert to ms
        thumbnail: mediaData.artwork || null,
        device: 'Chrome Browser',
        source: 'dashboard-chrome-extension',
        id: `${mediaData.title}-${mediaData.artist}`,
        canSkip: true,
        canFastForward: true,
        canLike: false,
        canChangeVolume: false,
        canSetOutput: false,
        shuffleState: null,
        repeatState: 'off'
      }
      
      console.log('✅ [DashboardNowPlaying] Real-time media data received:', {
        title: nowPlayingMessage.trackName,
        artist: nowPlayingMessage.artist[0],
        isPlaying: nowPlayingMessage.isPlaying,
        duration: nowPlayingMessage.trackDuration,
        position: nowPlayingMessage.trackProgress
      })
      
      // Send to callback
      this.callback(nowPlayingMessage)
      
    } catch (error) {
      console.error('❌ [DashboardNowPlaying] Error fetching media data:', error.message)
    }
  }
  
  /**
   * Manually refresh current media state
   * Called when the audio app needs updated data
   */
  async refresh() {
    console.log('🔄 [DashboardNowPlaying] Manual refresh requested')
    await this.fetchCurrentMedia()
  }
}

/**
 * Factory function that replaces the original NowPlaying class
 * with our modern dashboard-integrated version
 */
export function NowPlaying(callback: (message: any) => void, options?: any): NowPlayingType {
  console.log('🏭 [NowPlaying Factory] Creating dashboard-integrated Now Playing instance')
  return new DashboardNowPlaying(callback, options) as unknown as NowPlayingType
}