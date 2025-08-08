import { DeskThing } from "@deskthing/server";
import { DESKTHING_EVENTS } from "@deskthing/types";
import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer | null = null;

// Extremely shallow bridge: accepts extension updates, forwards song to DeskThing,
// and relays simple control commands back to the extension.

type ExtensionMessage = {
  type: 'connection' | 'mediaData' | 'timeupdate' | 'command-result';
  site?: string;
  sourceId?: string | number;
  data?: { title?: string; artist?: string; album?: string; artwork?: string; isPlaying?: boolean };
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  version?: string;
  action?: string;
  success?: boolean;
};

let lastExtensionSocket: WebSocket | null = null;
let lastSnapshot: {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: string;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  site?: string;
  sourceId?: string | number;
  ts?: number;
} = {};

const sendSongToDeskThing = () => {
  if (!lastSnapshot.title && !lastSnapshot.artist) return;
  const payload = {
    version: 2,
    album: lastSnapshot.album || null,
    artist: lastSnapshot.artist || null,
    playlist: null,
    playlist_id: null,
    track_name: lastSnapshot.title || 'Unknown Track',
    shuffle_state: null,
    repeat_state: 'off' as const,
    is_playing: !!lastSnapshot.isPlaying,
    abilities: [
      // Minimal abilities for extension control
      3, // NEXT
      4, // PREVIOUS
      0, // PLAY
      1  // PAUSE
    ],
    track_duration: lastSnapshot.duration ? Math.round(lastSnapshot.duration * 1000) : null,
    track_progress: lastSnapshot.currentTime ? Math.round(lastSnapshot.currentTime * 1000) : null,
    volume: 0,
    thumbnail: lastSnapshot.artwork || null,
    device: 'Chrome Extension',
    id: null,
    device_id: 'chrome-extension',
    source: lastSnapshot.site || 'chrome-extension'
  } as any;
  DeskThing.sendSong(payload);
};

const startWsServer = async () => {
  const port = Number(process.env.CACP_WS_PORT || 8081);
  wss = new WebSocketServer({ port });
  console.log(`🎯 [CACP] WS server listening on ${port}`);

  wss.on('connection', (ws, req) => {
    lastExtensionSocket = ws;
    console.log('🔌 [CACP] Extension connected from', req.socket.remoteAddress);

    ws.on('message', (raw) => {
      try {
        const msg: ExtensionMessage = JSON.parse(raw.toString());
        if (msg.type === 'mediaData') {
          lastSnapshot.title = msg.data?.title ?? lastSnapshot.title;
          lastSnapshot.artist = msg.data?.artist ?? lastSnapshot.artist;
          lastSnapshot.album = msg.data?.album ?? lastSnapshot.album;
          lastSnapshot.artwork = msg.data?.artwork ?? lastSnapshot.artwork;
          if (msg.data?.isPlaying !== undefined) lastSnapshot.isPlaying = msg.data.isPlaying;
          lastSnapshot.site = msg.site || lastSnapshot.site;
          lastSnapshot.sourceId = msg.sourceId || lastSnapshot.sourceId;
          lastSnapshot.ts = Date.now();
          sendSongToDeskThing();
        } else if (msg.type === 'timeupdate') {
          if (typeof msg.currentTime === 'number') lastSnapshot.currentTime = msg.currentTime;
          if (typeof msg.duration === 'number') lastSnapshot.duration = msg.duration;
          if (typeof msg.isPlaying === 'boolean') lastSnapshot.isPlaying = msg.isPlaying;
          lastSnapshot.ts = Date.now();
          // Throttle: forward only if duration>0 and at least 1s since last
          sendSongToDeskThing();
        }
      } catch (e) {
        console.error('❌ [CACP] WS message parse error', e);
      }
    });

    ws.on('close', () => {
      if (lastExtensionSocket === ws) lastExtensionSocket = null;
      console.log('🔌 [CACP] Extension disconnected');
    });
  });
};

// Map DeskThing control events to extension commands
const sendControl = (action: string, payload: any = {}) => {
  if (!lastExtensionSocket) return;
  const msg = { type: 'media-command', action, ...payload, timestamp: Date.now(), id: Date.now() };
  try { lastExtensionSocket.send(JSON.stringify(msg)); } catch {}
};

const start = async () => {
  await startWsServer();
  DeskThing.sendLog('CACP App Started (shallow bridge)');
};

const stop = async () => {
  if (wss) { wss.close(); wss = null; }
  DeskThing.sendLog('CACP App Stopped');
};

const purge = async () => {
  if (wss) { wss.close(); wss = null; }
  DeskThing.sendLog('CACP App Purged');
};

DeskThing.on(DESKTHING_EVENTS.START, start);
DeskThing.on(DESKTHING_EVENTS.STOP, stop);
DeskThing.on(DESKTHING_EVENTS.PURGE, purge);

