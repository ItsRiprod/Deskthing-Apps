// @ts-check
// version 0.11.15
import { config as loadEnv } from "dotenv";
import { defineConfig } from '@deskthing/cli';

// Load local env (for secrets) first, then fall back to .env if present.
loadEnv({ path: ".env.local" });
loadEnv();

const clientID = process.env.DISCORD_CLIENT_ID ?? "";
const clientSecret = process.env.DISCORD_CLIENT_SECRET ?? "";
const redirectUrl = process.env.DISCORD_REDIRECT_URL ?? "http://localhost:8888/callback/discord";

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
        enableRemoteLogging: true,
      },
      clientPort: 3000,
      viteLocation: "http://localhost",
      vitePort: 5173,
      linkPort: 8080,
    },
    server: {
      editCooldownMs: 1000,
      mockData: {
        settings: {
          clientID,
          clientSecret,
          redirectUrl,
        }
      }
    },
  }
});
  
