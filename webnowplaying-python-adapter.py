#!/usr/bin/env python3
"""
WebNowPlaying Python Adapter for DeskThing
Uses the official pywnp library to receive media data from WebNowPlaying extension
and serves it via HTTP API endpoints compatible with the existing dashboard
"""

import asyncio
import json
import time
from datetime import datetime
from aiohttp import web
from pywnp import WNPRedux

# Global state
current_media = {
    'title': None,
    'artist': None,
    'album': None,
    'state': 'STOPPED',
    'cover': None,
    'duration': 0,
    'position': 0,
    'volume': 100,
    'player': None,
    'source': 'WebNowPlaying',
    'timestamp': 0
}

class DeskThingWNPAdapter:
    def __init__(self, port=8080):
        self.port = port
        self.app = web.Application()
        self.setup_routes()
        
    def setup_routes(self):
        """Setup HTTP API routes compatible with existing dashboard"""
        # API endpoints
        self.app.router.add_get('/api/media/detect', self.get_media_detect)
        self.app.router.add_get('/api/media/status', self.get_media_status)
        self.app.router.add_post('/api/media/control', self.post_media_control)
        self.app.router.add_get('/health', self.get_health)
        
        # Dashboard UI
        self.app.router.add_get('/', self.get_dashboard)
        
    async def get_media_detect(self, request):
        """Get current media detection data (WebNowPlaying format)"""
        print('🔍 [API] Media detection requested')
        
        if current_media['title']:
            print(f'✅ [API] Returning WebNowPlaying data: {current_media["title"]} by {current_media["artist"]}')
            return web.json_response({
                'success': True,
                'data': {
                    'title': current_media['title'],
                    'artist': current_media['artist'],
                    'album': current_media['album'],
                    'source': current_media['source'],
                    'url': None,
                    'playbackState': 'playing' if current_media['state'] == 'PLAYING' else 'paused',
                    'artwork': current_media['cover'],
                    'supportsControl': True,
                    'isPlaying': current_media['state'] == 'PLAYING',
                    'duration': current_media['duration'],
                    'position': current_media['position'],
                    'volume': current_media['volume']
                }
            })
        else:
            print('❌ [API] No media data from WebNowPlaying')
            return web.json_response({
                'success': False,
                'error': 'No media detected',
                'data': None
            })
    
    async def get_media_status(self, request):
        """Get current media status (alias for detect)"""
        print('🔍 [API] Media status requested')
        return await self.get_media_detect(request)
    
    async def post_media_control(self, request):
        """Send control commands to WebNowPlaying"""
        try:
            data = await request.json()
            action = data.get('action')
            
            print(f'🎮 [API] Control command received: {action}')
            
            # Send control commands via WNPRedux
            if action == 'play':
                WNPRedux.media_info.controls.try_play()
            elif action == 'pause':
                WNPRedux.media_info.controls.try_pause()
            elif action == 'toggle':
                WNPRedux.media_info.controls.try_toggle_play_pause()
            elif action == 'next':
                WNPRedux.media_info.controls.try_skip_next()
            elif action == 'previous':
                WNPRedux.media_info.controls.try_skip_previous()
            elif action == 'seek':
                position = data.get('position', 0)
                WNPRedux.media_info.controls.try_set_position_seconds(position)
            elif action == 'volume':
                volume = data.get('volume', 50)
                WNPRedux.media_info.controls.try_set_volume(volume)
            else:
                return web.json_response({
                    'success': False,
                    'error': f'Unknown action: {action}'
                }, status=400)
            
            return web.json_response({
                'success': True,
                'message': f'✅ WebNowPlaying control command sent: {action}'
            })
            
        except Exception as e:
            print(f'❌ [API] Error processing control command: {e}')
            return web.json_response({
                'success': False,
                'error': str(e)
            }, status=500)
    
    async def get_health(self, request):
        """Health check endpoint"""
        return web.json_response({
            'status': 'ok',
            'timestamp': datetime.now().isoformat(),
            'hasMedia': bool(current_media['title']),
            'adapter': 'pywnp-python'
        })
    
    async def get_dashboard(self, request):
        """Serve dashboard HTML"""
        try:
            with open('media-dashboard.html', 'r') as f:
                html_content = f.read()
            return web.Response(text=html_content, content_type='text/html')
        except FileNotFoundError:
            return web.Response(text='Dashboard not found', status=404)

def on_media_info_changed():
    """Callback when media info changes"""
    global current_media
    
    media_info = WNPRedux.media_info
    
    # Update our global state
    current_media.update({
        'title': media_info.title or None,
        'artist': media_info.artist or None,
        'album': media_info.album or None,
        'state': media_info.state or 'STOPPED',
        'cover': media_info.cover_url or None,
        'duration': media_info.duration_seconds or 0,
        'position': media_info.position_seconds or 0,
        'volume': media_info.volume or 100,
        'player': media_info.player_name or 'WebNowPlaying',
        'source': 'WebNowPlaying',
        'timestamp': int(time.time())
    })
    
    if current_media['title']:
        print(f'🎵 [PyWNP] Media updated: "{current_media["title"]}" by "{current_media["artist"]}" ({current_media["state"]})')
    else:
        print('🔇 [PyWNP] No media playing')

async def main():
    """Main application entry point"""
    print('🎵 WebNowPlaying Python Adapter for DeskThing')
    print('📚 Using official pywnp library')
    
    # Initialize WebNowPlaying adapter
    try:
        print('🔌 Starting WebNowPlaying connection...')
        WNPRedux.start(
            port=8080,
            version='1.0.0',
            logger=lambda level, msg: print(f'[{level}] {msg}')
        )
        
        print('✅ WebNowPlaying adapter started successfully')
        
    except Exception as e:
        print(f'❌ Failed to start WebNowPlaying adapter: {e}')
        return
    
    # Create and start HTTP server
    adapter = DeskThingWNPAdapter(port=8080)
    
    print(f'🌐 Starting HTTP server on port 8080...')
    print('📊 Available endpoints:')
    print('  GET  /api/media/detect  - Get current media from WebNowPlaying')
    print('  GET  /api/media/status   - Get current media status')
    print('  POST /api/media/control  - Send control commands to WebNowPlaying')
    print('  GET  /health            - Server health check')
    print('  GET  /                  - Dashboard UI')
    print('')
    print('🔥 Server ready! WebNowPlaying extension should connect automatically.')
    print('📱 Extension URL: https://chromewebstore.google.com/detail/webnowplaying/jfakgfcdgpghbbefmdfjkbdlibjgnbli')
    
    # Run the web server
    runner = web.AppRunner(adapter.app)
    await runner.setup()
    
    site = web.TCPSite(runner, '127.0.0.1', 8080)
    await site.start()
    
    try:
        # Keep the server running and check for media updates
        while True:
            on_media_info_changed()
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print('\n👋 Server shutting down...')
    finally:
        WNPRedux.stop()
        await runner.cleanup()

if __name__ == '__main__':
    asyncio.run(main()) 