import express from 'express';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8080;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// CORS middleware for browser requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

/**
 * Get current media detection data
 */
app.get('/api/media/detect', async (req, res) => {
    try {
        console.log('🔍 Media detection requested');
        
        // Use the existing nowplaying detection
        const result = execSync('node scripts/music-debug.js', { 
            encoding: 'utf8',
            timeout: 5000 
        });
        
        // Parse the output to extract media info
        const mediaData = parseDetectionOutput(result);
        
        console.log('📱 Detected media:', mediaData);
        res.json({ success: true, data: mediaData });
        
    } catch (error) {
        console.error('❌ Detection failed:', error.message);
        res.json({ 
            success: false, 
            error: error.message,
            data: null 
        });
    }
});

/**
 * Send media control commands
 */
app.post('/api/media/control', async (req, res) => {
    try {
        const { action } = req.body;
        console.log(`🎛️  Control command: ${action}`);
        
        if (!['play-pause', 'next', 'previous'].includes(action)) {
            return res.json({ success: false, error: 'Invalid action' });
        }
        
        // Use the existing control script
        const result = execSync(`node scripts/player-control.js ${action}`, { 
            encoding: 'utf8',
            timeout: 3000 
        });
        
        console.log('✅ Control result:', result.trim());
        res.json({ success: true, message: `${action} command sent` });
        
    } catch (error) {
        console.error('❌ Control failed:', error.message);
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * Get enhanced media info with position tracking
 */
app.get('/api/media/status', async (req, res) => {
    try {
        console.log('🔍 Getting media status...');
        
        // Get basic detection
        const detectResult = execSync('node scripts/music-debug.js', { 
            encoding: 'utf8',
            timeout: 5000 
        });
        
        console.log('📝 Raw detection output:', detectResult);
        
        const mediaData = parseDetectionOutput(detectResult);
        console.log('📊 Parsed media data:', mediaData);
        
        // Try to get artwork from the URL if it's SoundCloud
        if (mediaData && mediaData.source === 'soundcloud' && mediaData.url) {
            try {
                console.log('🖼️  Attempting to get SoundCloud artwork...');
                mediaData.artwork = await getSoundCloudArtwork(mediaData.url);
                console.log('🎨 Artwork URL:', mediaData.artwork);
            } catch (artworkError) {
                console.log('⚠️  Could not get artwork:', artworkError.message);
            }
        }
        
        // Add simulated progress for now
        // In a real implementation, this would use the nowplaying package's position data
        if (mediaData && mediaData.title !== 'No track playing') {
            // Simulate progress based on time
            const now = Date.now();
            const baseTime = Math.floor(now / 1000) % 225; // Cycle through 225 seconds
            mediaData.position = baseTime;
            mediaData.duration = 225; // Default duration
            mediaData.isPlaying = true; // Assume playing if detected
            console.log(`⏱️  Simulated position: ${mediaData.position}/${mediaData.duration}`);
        }
        
        console.log('📤 Sending media data:', mediaData);
        res.json({ success: true, data: mediaData });
        
    } catch (error) {
        console.error('❌ Status check failed:', error.message);
        res.json({ 
            success: false, 
            error: error.message,
            data: null 
        });
    }
});

/**
 * Try to get artwork from SoundCloud URL using oEmbed API
 */
async function getSoundCloudArtwork(url) {
    try {
        console.log('🎵 Fetching SoundCloud artwork via oEmbed for:', url);
        
        // Use SoundCloud's oEmbed API (still publicly available)
        const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
        
        console.log('🔗 oEmbed URL:', oembedUrl);
        
        const response = await fetch(oembedUrl);
        
        if (!response.ok) {
            throw new Error(`SoundCloud oEmbed API responded with ${response.status}`);
        }
        
        const oembedData = await response.json();
        console.log('📊 SoundCloud oEmbed data received:', oembedData.title, oembedData.thumbnail_url ? 'with thumbnail' : 'no thumbnail');
        
        if (oembedData.thumbnail_url) {
            // SoundCloud thumbnails are sometimes low-res, try to get higher resolution
            let artworkUrl = oembedData.thumbnail_url;
            
            // Replace small thumbnails with larger versions if possible
            if (artworkUrl.includes('-large.')) {
                artworkUrl = artworkUrl.replace('-large.', '-t500x500.');
            } else if (artworkUrl.includes('-t300x300.')) {
                artworkUrl = artworkUrl.replace('-t300x300.', '-t500x500.');
            } else if (artworkUrl.includes('-small.')) {
                artworkUrl = artworkUrl.replace('-small.', '-t500x500.');
            } else if (artworkUrl.includes('artworks-')) {
                // Try to get larger artwork from the artworks URL
                artworkUrl = artworkUrl.replace(/artworks-[^-]+-[^-]+-large/, 'artworks-000000000000-large');
                artworkUrl = artworkUrl.replace('-large.jpg', '-t500x500.jpg');
            }
            
            console.log('🎨 Found artwork URL from oEmbed:', artworkUrl);
            return artworkUrl;
        } else {
            console.log('📷 No thumbnail available from SoundCloud oEmbed');
            return getSoundCloudPlaceholder();
        }
        
    } catch (error) {
        console.log('⚠️  oEmbed artwork fetch failed:', error.message);
        console.log('📷 Trying alternative scraping method...');
        return await getSoundCloudArtworkByScraping(url);
    }
}

/**
 * Fallback: Try to get artwork by scraping the SoundCloud page
 */
async function getSoundCloudArtworkByScraping(url) {
    try {
        console.log('🕸️  Scraping SoundCloud page for artwork:', url);
        
        const response = await fetch(url);
        const html = await response.text();
        
        // Look for Open Graph image meta tag
        const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        if (ogImageMatch && ogImageMatch[1]) {
            let artworkUrl = ogImageMatch[1];
            console.log('🎨 Found artwork from Open Graph meta tag:', artworkUrl);
            
            // Try to get higher resolution
            if (artworkUrl.includes('-large.')) {
                artworkUrl = artworkUrl.replace('-large.', '-t500x500.');
            } else if (artworkUrl.includes('-t300x300.')) {
                artworkUrl = artworkUrl.replace('-t300x300.', '-t500x500.');
            }
            
            return artworkUrl;
        }
        
        // Look for JSON-LD structured data
        const jsonLdMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
        if (jsonLdMatch) {
            try {
                const jsonData = JSON.parse(jsonLdMatch[1]);
                if (jsonData.image) {
                    console.log('🎨 Found artwork from JSON-LD:', jsonData.image);
                    return jsonData.image;
                }
            } catch (e) {
                console.log('⚠️  Could not parse JSON-LD data');
            }
        }
        
        console.log('📷 No artwork found via scraping');
        return getSoundCloudPlaceholder();
        
    } catch (error) {
        console.log('⚠️  Scraping failed:', error.message);
        return getSoundCloudPlaceholder();
    }
}

/**
 * Get a SoundCloud-themed placeholder
 */
function getSoundCloudPlaceholder() {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect fill='%23ff5500' width='300' height='300'/%3E%3Ctext fill='white' font-size='24' x='150' y='140' text-anchor='middle'%3ESoundCloud%3C/text%3E%3Ctext fill='white' font-size='16' x='150' y='170' text-anchor='middle'%3ERinzen Live%3C/text%3E%3C/svg%3E`;
}

/**
 * Parse the music-debug.js output into structured data
 */
function parseDetectionOutput(output) {
    const lines = output.split('\n');
    let title = 'No track playing';
    let artist = 'Unknown artist';
    let source = 'No source';
    let url = null;
    
    for (const line of lines) {
        if (line.includes('📍 Source:')) {
            source = line.split('📍 Source:')[1]?.trim() || 'unknown';
        }
        if (line.includes('🎼 Title:')) {
            const titleLine = line.split('🎼 Title:')[1]?.trim() || '';
            if (titleLine.includes(' by ')) {
                const parts = titleLine.split(' by ');
                title = parts[0]?.trim() || 'Unknown track';
                artist = parts[1]?.trim() || 'Unknown artist';
            } else {
                title = titleLine || 'Unknown track';
            }
        }
        if (line.includes('🔗 URL:')) {
            url = line.split('🔗 URL:')[1]?.trim() || null;
        }
    }
    
    return {
        title,
        artist,
        album: '', // Not provided in current output
        source,
        url,
        artwork: null, // Not provided in current output
        isPlaying: title !== 'No track playing',
        position: 0,
        duration: 0
    };
}

// Serve the dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'media-dashboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Media Dashboard Server running on http://localhost:${PORT}`);
    console.log(`📱 Open the dashboard at: http://localhost:${PORT}`);
    console.log(`🎵 API endpoints:`);
    console.log(`   GET  /api/media/detect - Detect current media`);
    console.log(`   GET  /api/media/status - Get media with position`);
    console.log(`   POST /api/media/control - Send control commands`);
});

export default app; 