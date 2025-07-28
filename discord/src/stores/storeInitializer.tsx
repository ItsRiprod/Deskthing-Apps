import { useEffect } from "react";
import { useChatStore } from "./chatStore";
import { useCallStore } from "./callStore";
import { useUIStore } from "./uiStore";
import { useSongStore } from "./songStore";
import { DeskThing } from "@deskthing/client";

export function StoreInitializer({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    DeskThing.getManifest()
      .then(() => {
        console.log("DeskThing manifest loaded");
      })
      .catch((error) => {
        console.error("Failed to load DeskThing manifest:", error);
      });
    useChatStore.getState().initialize?.();
    useCallStore.getState().initialize?.();
    useUIStore.getState().initialize?.();
    useSongStore.getState().initialize?.();
    // Continue adding stores as you need more initializations
  }, []);
  return <>{children}</>;
}
