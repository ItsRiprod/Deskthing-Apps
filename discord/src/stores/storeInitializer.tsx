import { useEffect } from "react";
import { useChatStore } from "./chatStore";
import { useCallStore } from "./callStore";
import { useUIStore } from "./uiStore";
import { useSongStore } from "./songStore";

export function StoreInitializer({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    useChatStore.getState().initialize?.();
    useCallStore.getState().initialize?.();
    useUIStore.getState().initialize?.();
    useSongStore.getState().initialize?.();
    // Continue adding stores as you need more initializations
  }, []);
  return <>{children}</>;
}