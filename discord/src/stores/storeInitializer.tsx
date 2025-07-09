import { useEffect } from "react";
import { useChatStore } from "./chatStore";
import { useCallStore } from "./callStore";

export function useStoreInitializer() {
  useEffect(() => {
    useChatStore.getState().initialize?.();
    useCallStore.getState().initialize?.();
    // Continue adding stores as you need more initializations
  }, []);
}

export function StoreInitializer({ children }: { children?: React.ReactNode }) {
  useStoreInitializer();
  return <>{children}</>;
}