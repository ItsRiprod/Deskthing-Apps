// @ts-check
import { defineConfig } from '@deskthing/cli';
import { config } from 'dotenv'

config()

export default defineConfig({
  development: {
    logging: {
      level: "info",
    },
    client: {
      logging: {
        level: "info",
      },
      // viteLocation: 'http://192.168.1.241'
      vitePort: 5173
    },
    server: {
      editCooldownMs: 8000,
      mockData: {
        settings: {
          "client_id": process.env.DISCORD_CLIENT_ID,
          "client_secret": process.env.DISCORD_CLIENT_SECRET,
          "set_main_text": 'DiscordThing',
          "set_secondary_text": 'The ultimate deskthing app',
          "have_timer": true,
          "left_dashboard_panel": "call_status",
          "right_dashboard_panel": "chat",
          "dashboard_elements": [
            "clock",
            "notifications",
          "call_controls"]
        }
      }
    },
  }
});
