
// version 0.10.7
import { defineConfig } from '@deskthing/cli';
import dotEnv from 'dotenv'

dotEnv.config()

export default defineConfig({
  development: {
    logging: {
      level: "debug",
    },
    client: {
      logging: {
        level: "info",
      },
    },
    server: {
      editCooldownMs: 5000,
      mockData: {
        settings: {
          "client_id": process.env.DISCORD_CLIENT_ID,
          "client_secret": process.env.DISCORD_CLIENT_SECRET,
          "set_main_text": 'DiscordThing',
          "set_secondary_text": 'The ultimate deskthing app',
          "have_timer": true,
        }
      }
    },
  }
});
  