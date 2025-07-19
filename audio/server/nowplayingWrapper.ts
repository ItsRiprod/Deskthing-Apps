// @ts-nocheck

import type { NowPlaying as NowPlayingType } from 'node-nowplaying'
import { WebSocket } from 'ws'

/**
 * Real-time Now Playing implementation using WebSocket from Chrome Extension
 * NO POLLING - 100% event-driven via Chrome Extension audio monitoring
 */
export class DashboardNowPlaying {
  private callback: (message: any) => void
  private isRunning = false
  private dashboardUrl = 'ws://localhost:8080'
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  
  constructor(callback: (message: any) => void, options?: any) {
    this.callback = callback
    console.log('🚀 [DashboardNowPlaying] Initialized with real-time WebSocket audio events')
    console.log('🎵 [DashboardNowPlaying] Zero polling - 100% event-driven!')
  }
  
  /**
   * Subscribe to Now Playing updates - connects to WebSocket for real-time events
   */
  async subscribe(callback?: (message: any) => void) {
    if (callback) {
      this.callback = callback
    }
    this.isRunning = true
    console.log('✅ [DashboardNowPlaying] Subscribing to real-time WebSocket events')
    
    // Connect to WebSocket for real-time updates
    this.connectWebSocket()
  }
  
  /**
   * Unsubscribe from updates
   */
  unsubscribe() {
    this.isRunning = false
    console.log('🔌 [DashboardNowPlaying] Unsubscribing from WebSocket events')
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
  
  /**
   * Start monitoring - connects to WebSocket for real-time events
   */
  start() {
    this.isRunning = true
    console.log('▶️ [DashboardNowPlaying] Starting real-time WebSocket monitoring')
    this.connectWebSocket()
  }
  
  /**
   * 🚀 Connect to WebSocket for real-time audio events
   */
  private connectWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('🔌 [DashboardNowPlaying] WebSocket already connected')
      return
    }
    
    console.log('🔌 [DashboardNowPlaying] Connecting to WebSocket server...')
    
    try {
      this.ws = new WebSocket(this.dashboardUrl)
      
      this.ws.on('open', () => {
        console.log('✅ [DashboardNowPlaying] WebSocket connected for real-time audio events')
        this.reconnectAttempts = 0
      })
      
      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString())
          this.handleWebSocketMessage(message)
        } catch (error) {
          console.error('❌ [DashboardNowPlaying] WebSocket message parse error:', error)
        }
      })
      
      this.ws.on('close', () => {
        console.log('🔌 [DashboardNowPlaying] WebSocket disconnected')
        this.ws = null
        this.scheduleReconnect()
      })
      
      this.ws.on('error', (error) => {
        console.error('❌ [DashboardNowPlaying] WebSocket error:', error.message)
      })
      
    } catch (error) {
      console.error('❌ [DashboardNowPlaying] WebSocket connection failed:', error.message)
      this.scheduleReconnect()
    }
  }
  
  /**
   * 🎵 Handle real-time WebSocket messages
   */
  private handleWebSocketMessage(message: any) {
    if (!this.isRunning) return
    
    if (message.type === 'timeupdate' && message.data) {
      // Convert real-time time data to audio app format
      const audioData = {
        title: 'Live Audio',
        artist: 'Chrome Extension',
        album: '',
        artwork: null,
        isPlaying: message.data.isPlaying || false,
        position: message.data.currentTime || 0,
        duration: message.data.duration || 0,
        canSeek: message.data.canSeek || false,
        source: message.data.source || 'real-time',
        timestamp: Date.now(),
        realTime: true
      }
      
      console.log(`⏱️ [DashboardNowPlaying] Real-time update: ${audioData.position}s/${audioData.duration}s`)
      
      // Send to audio app callback
      if (this.callback) {
        this.callback(audioData)
      }
    }
  }
  
  /**
   * 🔄 Schedule WebSocket reconnection
   */
  private scheduleReconnect() {
    if (!this.isRunning || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }
    
    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    
    console.log(`🔄 [DashboardNowPlaying] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    
    setTimeout(() => {
      if (this.isRunning) {
        this.connectWebSocket()
      }
    }, delay)
  }
  
  /**
   * Stop monitoring
   */
  stop() {
    this.isRunning = false
    console.log('⏹️ [DashboardNowPlaying] Stopping WebSocket monitoring')
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
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