
// version 0.10.19
import { defineConfig } from '@deskthing/cli';

export default defineConfig({
  development: {
    logging: {
      level: "debug",
      prefix: "[DeskThing Server]",
    },
    client: {
      logging: {
        level: "debug",
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
    },
  }
});
  