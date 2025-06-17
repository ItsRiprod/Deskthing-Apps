// @ts-check
// version 0.11.4
import { defineConfig } from '@deskthing/cli';

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
          recordSize: "large",
          recordPosX: "left",
          recordPosY: "top",
          display: ["album", "title", "artists", "mini_clock", "controls", "record_thumbnail", "bg_darkened", "custom_color", "custom_text"],
          controls: ["play_pause", "previous", "next", "shuffle", "repeat", "vol_down", "vol_up"],
          textPos: "center",
          bgBlur: 25,
          bgColor: "#1A237E",
          textColor: "#FFEB3B"
        }
      }
    },
  }
});