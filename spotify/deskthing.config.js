
// version 0.10.7
import { defineConfig } from '@deskthing/cli';
import dotEnv from 'dotenv'

dotEnv.config()

export default defineConfig({
  development: {
    logging: {
      level: "info",
      prefix: "[DeskThing Server]",
    },
    client: {
      logging: {
        level: "info",
        prefix: "[DeskThing Client]",
        enableRemoteLogging: false,
      },
      clientPort: 3000,
      viteLocation: "http://localhost",
      vitePort: 5174,
      linkPort: 8080,
    },
    server: {
      editCooldownMs: 8000,
      refreshInterval: 15,
      mockData: {
        settings: {
          "client_id": process.env.SPOTIFY_CLIENT_ID,
          "client_secret": process.env.SPOTIFY_CLIENT_SECRET,
          "redirect_uri": process.env.SPOTIFY_REDIRECT_URI,
          "change_source": true,
          "output_device": "default",
          "transfer_playback_on_error": true,
          "blur_background_thumbnail": false,
          "show_controls": true,
          "thumbnail_size": "small",
          "text_setting": "minimal",
        }
      }
    },
  }
});
